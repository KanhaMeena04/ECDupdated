const isBrowser = typeof window !== "undefined";
const isLocalhost = isBrowser && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const rawUrl = 
  process.env.REACT_APP_API_BASE_URL || 
  process.env.REACT_APP_API_URL || 
  process.env.VITE_API_URL || 
  (isLocalhost ? "http://localhost:5000" : "https://ecd-kart-backend.onrender.com");

const API_BASE_URL = rawUrl.replace(/\/api(\/v1)?\/?$/, "").replace(/\/+$/, "");

export {
  API_BASE_URL
};
