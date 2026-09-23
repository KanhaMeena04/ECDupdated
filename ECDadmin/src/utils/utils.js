const rawUrl =
  (typeof process !== 'undefined' && (process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || process.env.VITE_API_URL)) ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  "http://localhost:5000";

const API_BASE_URL = rawUrl.replace(/\/api(\/v1)?\/?$/, "");

export {
  API_BASE_URL
};
