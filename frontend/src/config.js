// Centralized API & Socket configuration for SPA Lan Anh Beauty
// In production behind Nginx, relative path '/api' targets 'lananhbeauty.thanhbtdev.id.vn/api'

export const API_URL = import.meta.env.VITE_API_URL 
  || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL 
  || (import.meta.env.DEV ? 'http://localhost:5000' : typeof window !== 'undefined' ? window.location.origin : '');
