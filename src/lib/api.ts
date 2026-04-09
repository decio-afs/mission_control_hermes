import axios from 'axios';

// The base API URL will point to the FastAPI server running on the VPS
// Ex: "https://api.yourdomain.com"
const API_BASE_URL = (import.meta.env.VITE_VPS_API_URL || 'https://openclaw.daagencyllc.com:8000') + '/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject the API key for every request
api.interceptors.request.use(
  (config) => {
    if (API_KEY) {
      config.headers['X-API-Key'] = API_KEY;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
