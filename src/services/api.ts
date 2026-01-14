import axios from 'axios';

// URL base da API - altere aqui para desenvolvimento
// const API_BASE_URL = 'http://localhost:8000/';
const API_BASE_URL = 'https://www.ergogroupapp.com/'; 

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
