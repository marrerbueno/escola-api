import axios from 'axios';

// URL do servidor - usar variável de ambiente ou IP local
const getBaseURL = () => {
  // Se estiver configurado via variável de ambiente (nuvem), usar ela
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Detectar se está no Celular (Capacitor)
  const isMobile = window.location.protocol === 'file:';
  
  if (isMobile) {
    // No Celular, usar IP do computador
    return 'http://192.168.100.111:3000/api';
  }
  
  // No navegador, usar localhost
  return 'http://localhost:3000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    
    if (error.code === 'ERR_NETWORK') {
      console.error('Erro de conexão. Verifique se o servidor está rodando.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
