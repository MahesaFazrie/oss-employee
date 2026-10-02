import axios from 'axios';

// Membuat instance axios dengan konfigurasi dasar
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Aktifkan withCredentials jika backend Laravel menggunakan Sanctum (cookie-based)
  // withCredentials: true, 
});

// Request Interceptor: menambahkan token otomatis (jika menggunakan JWT/Token)
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: global error handler
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      
      // Handle Unauthorized (Session Expired / Invalid Token)
      if (status === 401) {
        if (typeof window !== 'undefined') {
          // Bersihkan state/token jika perlu, lalu lempar ke login
          localStorage.removeItem('token');
          // window.location.href = '/login';
        }
      }
      
      // Handle Forbidden (Akses ditolak karena permission)
      if (status === 403) {
        console.warn('Akses ditolak (Forbidden)');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
