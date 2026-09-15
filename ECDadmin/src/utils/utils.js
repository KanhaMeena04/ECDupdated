const rawUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL = rawUrl.replace(/\/api\/?$/, "");

export {
	API_BASE_URL
};
