# This file handles:
# 1. Register (create new account)
# 2. Login (get token + refresh_token)
# 3. Get current user (verify token)
# 4. Refresh token (get new token without re-login) ← NEW

from modules.supabase_client import supabase
from fastapi import HTTPException


def register_user(email: str, password: str, name: str):
    """
    Creates a new user account in Supabase Auth
    Then creates their profile in our users table
    """
    try:
        # Step 1: Create account in Supabase Auth (handles password hashing)
        response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })

        # If signup failed, raise error
        if not response.user:
            raise HTTPException(status_code=400, detail="Registration failed")

        # Step 2: Get the user's ID from Supabase Auth
        user_id = response.user.id

        # Step 3: Create their profile in our users table
        supabase.table("users").insert({
            "id": user_id,        # same ID as auth
            "email": email,
            "name": name,
        }).execute()

        return {
            "message": "Account created successfully!",
            "user_id": user_id,
            "email": email
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def login_user(email: str, password: str):
    """
    Logs in a user and returns BOTH tokens:
    - access_token  : used for API requests (expires in 1 hour)
    - refresh_token : used to get a new access_token (long-lived)

    FIX: old version only returned access_token
         so when it expired, user had to log in again manually
         now we return refresh_token too so client.js can auto-refresh
    """
    try:
        # Ask Supabase to verify email + password
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        # If login failed
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # ✅ FIX: return refresh_token alongside access_token
        # The frontend (client.js) will save BOTH in localStorage
        # When access_token expires → client.js sends refresh_token here → gets new access_token
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,   # ← THIS WAS MISSING
            "user_id": response.user.id,
            "email": response.user.email,
            "message": "Login successful!"
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")


def refresh_user_token(refresh_token: str):
    """
    NEW FUNCTION — called by client.js when access_token expires

    Flow:
    1. User's access_token expires after 1 hour
    2. client.js gets a 401 error from any API call
    3. client.js calls POST /auth/refresh with refresh_token
    4. This function asks Supabase for a brand new access_token
    5. client.js saves new tokens and retries the original request
    6. User never sees a "please login again" message ✅

    Think of refresh_token like a "master key" —
    it never expires (until user logs out) and can make new access keys
    """
    try:
        # Ask Supabase to exchange refresh_token for new access_token
        # Supabase also rotates the refresh_token (gives you a new one each time)
        response = supabase.auth.refresh_session(refresh_token)

        # If refresh failed (token was revoked or invalid)
        if not response.session:
            raise HTTPException(status_code=401, detail="Refresh token invalid or expired")

        # Return both new tokens to the frontend
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,  # Supabase rotates this!
            "message": "Token refreshed successfully"
        }

    except Exception as e:
        # If refresh fails, user must log in again (this is rare — only if they
        # haven't opened the app in weeks, or manually logged out elsewhere)
        raise HTTPException(status_code=401, detail="Session expired. Please login again.")


def get_current_user(token: str):
    """
    Checks if a token is valid and returns the user
    We call this in every protected endpoint to verify identity
    """
    try:
        # Ask Supabase to verify the token
        response = supabase.auth.get_user(token)

        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        return response.user

    except Exception as e:
        raise HTTPException(status_code=401, detail="Please login again")