import axios from 'axios';
// Базовый URL твоего бэкенда (из .env или константа)
const API_URL = 'http://localhost:5000/api'; 

export const $api = axios.create({
  baseURL: API_URL,
});

// Интерцептор для добавления токена к каждому запросу
$api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});