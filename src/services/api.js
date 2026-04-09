import axios from "axios";

const defaultBaseURL = "https://alesteb-back.onrender.com/api";
const rawEnvBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();

const normalizeBaseURL = (value) => {
  if (!value) return "";

  const normalized = value.replace(/\/+$/, "");
// Si el valor es exactamente "/api" o "api", lo normalizamos a "" para evitar problemas de rutas relativas.
  // En Vercel esto termina pegandole al mismo dominio y rompe /products con 404.
  if (
    normalized === "/api" ||
    normalized === "api" ||
    normalized === window.location.origin + "/api"
  ) {
    return "";
  }

  return normalized;
};

const apiBaseURL = normalizeBaseURL(rawEnvBaseURL) || defaultBaseURL;

const api = axios.create({
  baseURL: apiBaseURL,
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
