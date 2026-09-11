// Centralized API & Socket configuration for SPA Lan Anh Beauty
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Safe fallback:
// - Localhost (npm run dev locally on localhost:5173): targets http://localhost:5000/api
// - Production / VPS (accessed via domain or IP): targets relative '/api' proxied by Nginx
export const API_URL = isLocalhost 
  ? (import.meta.env.VITE_DEV_API_URL || 'http://localhost:5000/api')
  : (import.meta.env.VITE_API_URL || '/api');

export const SOCKET_URL = isLocalhost 
  ? (import.meta.env.VITE_DEV_SOCKET_URL || 'http://localhost:5000')
  : (import.meta.env.VITE_SOCKET_URL || (isBrowser ? window.location.origin : ''));

export const ASSET_URL = isLocalhost 
  ? (import.meta.env.VITE_DEV_ASSET_URL || 'http://localhost:5000')
  : (import.meta.env.VITE_ASSET_URL || '');
