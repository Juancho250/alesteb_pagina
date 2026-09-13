import axios from "axios";

const defaultBaseURL = "https://alesteb-back-1ea2.onrender.com/public-api/v1";
const rawEnvBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();

const normalizeBaseURL = (value) => {
  if (!value) return "";
  return value.replace(/\/+$/, "");
};

const apiBaseURL = normalizeBaseURL(rawEnvBaseURL) || defaultBaseURL;

// La API key siempre llega desde variables de entorno. VITE_* es publicable
// por definición: esta key debe ser restringida al storefront y a sus orígenes.
const API_KEY = import.meta.env.VITE_API_KEY;

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 30_000,
});

const TOKEN_ERROR_CODES = new Set([
  "NO_TOKEN",
  "TOKEN_EXPIRED",
  "INVALID_TOKEN",
  "USER_INACTIVE",
  "USER_NOT_FOUND",
]);

api.interceptors.request.use(
  (config) => {
    if (API_KEY) {
      config.headers["X-API-Key"] = API_KEY;
    }

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code || "";

    if (status === 401) {
      if (TOKEN_ERROR_CODES.has(code)) {
        console.warn("[API] Sesión expirada o inválida:", code);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (!window.location.pathname.startsWith("/auth")) {
          window.location.replace("/auth");
        }
      } else {
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
