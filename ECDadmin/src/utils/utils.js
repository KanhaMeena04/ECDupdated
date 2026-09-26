const rawUrl = 
  process.env.REACT_APP_API_BASE_URL || 
  process.env.REACT_APP_API_URL || 
  process.env.VITE_API_URL || 
  "http://localhost:5000";

const API_BASE_URL = rawUrl.replace(/\/api(\/v1)?\/?$/, "").replace(/\/+$/, "");

export {
  API_BASE_URL
};
