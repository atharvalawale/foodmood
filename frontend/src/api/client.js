import axios from "axios";

// ─── BASE URL ─────────────────────────────────────────────────────────────────
// FastAPI runs on localhost:8000 during development
// VITE_API_URL is set in .env file for production deployment
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── CREATE AXIOS INSTANCE ────────────────────────────────────────────────────
// Think of this like creating a "pre-configured fetch" tool
// Every request you make with `api` will automatically use these settings
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds — Gemini image analysis can be slow
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── HELPER: Get user data from localStorage ──────────────────────────────────
// We call this in multiple places, so it's cleaner as a function
// localStorage is like the browser's "memory" — it survives page refresh
const getUser = () => JSON.parse(localStorage.getItem("foodmood_user") || "{}");

// ─── HELPER: Save user data to localStorage ───────────────────────────────────
// When we get a new token, we save it here so future requests use it
const saveUser = (userData) =>
  localStorage.setItem("foodmood_user", JSON.stringify(userData));

// ─── HELPER: Refresh the Supabase token ──────────────────────────────────────
// Supabase tokens expire after 1 hour
// This function asks Supabase "hey, give me a new token using my refresh_token"
// refresh_token never expires (unless user logs out)
let isRefreshing = false;       // prevents multiple refresh calls at the same time
let refreshQueue = [];          // stores requests that were waiting for new token

const refreshToken = async () => {
  const user = getUser();

  // If we don't have a refresh_token, we can't refresh — must log in again
  if (!user?.refresh_token) {
    throw new Error("No refresh token available");
  }

  // Call FastAPI backend which calls Supabase to get new tokens
  // We use axios directly (not `api`) to avoid infinite loop
  const response = await axios.post(`${BASE_URL}/auth/refresh`, {
    refresh_token: user.refresh_token,
  });

  // Supabase returns new access_token and refresh_token
  const { access_token, refresh_token } = response.data;

  // Save new tokens to localStorage so future requests use them
  saveUser({
    ...user,                    // keep name, email, etc.
    token: access_token,        // replace old expired token
    refresh_token: refresh_token, // replace refresh token too (Supabase rotates these)
  });

  return access_token;
};

// ─── REQUEST INTERCEPTOR ─────────────────────────────────────────────────────
// This runs BEFORE every API request is sent
// It automatically adds the auth token to the request header
// So you never have to manually write "Authorization: Bearer xxx" anywhere
api.interceptors.request.use(
  (config) => {
    const user = getUser();
    if (user?.token) {
      // This is how you tell the backend "I am logged in, here's my proof"
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config; // send the request with the token added
  },
  (error) => Promise.reject(error) // if something went wrong building the request
);

// ─── RESPONSE INTERCEPTOR ────────────────────────────────────────────────────
// This runs AFTER every API response comes back
// 
// The KEY FIX is here:
// OLD behavior: token expired → delete token → send to /login (BAD)
// NEW behavior: token expired → quietly get new token → retry request (GOOD)
//
// This is called "transparent token refresh" — user never notices it happened
api.interceptors.response.use(
  // ✅ Success: just return the response as-is
  (response) => response,

  // ❌ Error: check if it's a 401 (token expired) and try to refresh
  async (error) => {
    const originalRequest = error.config; // the request that failed

    // Is this a 401 error AND we haven't already tried refreshing for this request?
    // _retry flag prevents infinite loop: refresh → 401 → refresh → 401 → ...
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // mark this request as "already tried refreshing"

      // If a refresh is already in progress (e.g., 3 requests expired at same time)
      // queue up the other requests to wait for the single refresh to complete
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            // Once refresh is done, retry this request with the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Start the refresh process
      isRefreshing = true;

      try {
        const newToken = await refreshToken();

        // Tell all waiting requests "refresh is done, here's the new token"
        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = []; // clear the queue

        // Retry the original failed request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh also failed (refresh_token is gone/invalid)
        // NOW it's time to log the user out — no other choice
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue = [];

        // Clear everything and send to login
        localStorage.removeItem("foodmood_user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false; // always reset this flag when done
      }
    }

    // For any other error (404, 500, etc.) — just reject normally
    return Promise.reject(error);
  }
);

export default api;