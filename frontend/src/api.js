import axios from 'axios';

// Create an axios instance with the base URL for the backend API
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Include credentials (cookies) in requests
});

export default api;