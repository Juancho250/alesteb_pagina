import axios from "axios";

const defaultBaseURL = "https://alesteb-back-1.onrender.com/api";
const rawEnvBaseURL  = import.meta.env.VITE_API_BASE_URL?.trim();

const normalizeBaseURL = (value) => {
  if (!value) return "";
  const normalized = value.replace(/\/+$/, "");
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

// ============================================
// 🔑 La API Key va en variable de entorno
// En tu .env:  VITE_API_KEY=ak_xxxxxxxx_xxxxxxxx
// En Vercel:   Settings → Environment Variables
// NUNCA la pegues directo en el código
// ============================================
const API_KEY = import.meta.env.VITE_API_KEY;

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 30_000,
});

// Códigos de error que indican problema de JWT (no de API key)
const TOKEN_ERROR_CODES = new Set([
  "NO_TOKEN", "TOKEN_EXPIRED", "INVALID_TOKEN",
  "USER_INACTIVE", "USER_NOT_FOUND",
]);

// ============================================
// 📡 REQUEST: API Key + JWT del cliente logueado
// ============================================
api.interceptors.request.use(
  (config) => {
    if (API_KEY) {
      config.headers["X-API-Key"] = API_KEY;
    }
    // Adjunta el JWT cuando el cliente está autenticado
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// 🚨 RESPONSE: Manejo de errores
// ============================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code   = error.response?.data?.code || "";

    if (status === 401) {
      if (TOKEN_ERROR_CODES.has(code)) {
        // JWT vencido o inválido: limpiar sesión y redirigir a login
        console.warn("[API] Sesión expirada o inválida:", code);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (!window.location.pathname.startsWith("/auth")) {
          window.location.replace("/auth");
        }
      } else {
        // API key inválida o ausente
        console.error("[API] Clave de API inválida o no configurada:", code);
      }
    }

    if (status === 403) {
      console.error("[API] Acceso denegado:", error.response?.data?.message);
    }

    return Promise.reject(error);
  }
);

export default api;