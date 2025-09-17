import axios from 'axios';

// Determine the base URL based on the environment
const getBaseURL = () => {
  // Check if REACT_APP_API_URL is set in environment variables
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In development, use localhost:5000
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }
  
  // In production, if no environment variable is set, 
  // assume API is on the same host but on the /api path
  return '/api';
};

// Create an axios instance with the base URL for the backend API
const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Include credentials (cookies) in requests
});

export default api;