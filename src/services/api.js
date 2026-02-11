import axios from "axios";

const api = axios.create({
  baseURL: "https://alesteb-back.onrender.com/api",
  timeout: 30000, // 30s — Render puede tardar en cold start
});

// ============================================
// 🔑 REQUEST: Adjunta el token JWT automáticamente
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// 🚨 RESPONSE: Maneja errores globales
// ============================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expirado o inválido → limpiar sesión y redirigir
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes("/auth/login");
      if (!isAuthRoute) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (!window.location.pathname.includes("/auth")) {
          window.location.href = "/auth";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;