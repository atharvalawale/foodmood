# This file handles:
# 1. Register (create new account)
# 2. Login (get token)
# 3. Get current user (verify token)

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
    Logs in a user and returns a token
    Frontend saves this token and sends it with every request
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

        # Return the token (frontend will save this)
        return {
            "access_token": response.session.access_token,
            "user_id": response.user.id,
            "email": response.user.email,
            "message": "Login successful!"
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")


def get_current_user(token: str):
    """
    Checks if a token is valid and returns the user
    We call this in every protected endpoint
    """
    try:
        # Ask Supabase to verify the token
        response = supabase.auth.get_user(token)

        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        return response.user

    except Exception as e:
        raise HTTPException(status_code=401, detail="Please login again")