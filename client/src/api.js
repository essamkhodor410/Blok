import axios from "axios";

const TOKEN_KEY = "blok_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// In dev, Vite proxies "/api" to the backend (see vite.config.js).
// In production (e.g. frontend on Vercel, backend on Render/Railway),
// set VITE_API_URL to your backend URL, e.g. https://blok-api.onrender.com
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "/api";

export const api = axios.create({ baseURL: API_BASE });

// Base for public published sites ("/sites/:slug"). Empty in dev (Vite proxies it);
// the backend origin in production.
export const siteBase = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "";

api.interceptors.request.use((cfg) => {
  const t = tokenStore.get();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// surface a clean message from the server on errors
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.error || err.message || "Request failed";
    return Promise.reject(new Error(msg));
  }
);
