import axios from "axios";

// ─── Base URL — FastAPI runs on localhost:8000 ────────────────────────────────
// Change this if you deploy to a server
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s — Gemini can be slow
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor — attach auth token if available ─────────────────────
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("foodmood_user") || "{}");
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle errors globally ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — send back to login
      localStorage.removeItem("foodmood_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;