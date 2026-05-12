import axios from "axios";

const defaultBaseURL = "https://alesteb-back-1.onrender.com/public-api/v1";
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

// ============================================
// 📡 REQUEST: Adjunta la API Key en cada request
// ============================================
api.interceptors.request.use(
  (config) => {
    if (API_KEY) {
      config.headers["X-API-Key"] = API_KEY;
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

    if (status === 401) {
      // Key inválida o ausente
      console.error("[API] Key inválida o no configurada.");
    }

    if (status === 403) {
      // Key desactivada, expirada, u origen no permitido
      console.error("[API] Acceso denegado:", error.response?.data?.message);
    }

    return Promise.reject(error);
  }
);

export default api;