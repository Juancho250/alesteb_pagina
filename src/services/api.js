import axios from "axios";
import {
  STOREFRONT_API_BASE_URL,
  storefrontHeaders,
} from "./storefrontConfig";

const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

const REFRESHABLE_TOKEN_CODES = new Set([
  "NO_TOKEN",
  "TOKEN_EXPIRED",
  "INVALID_TOKEN",
]);

const TERMINAL_TOKEN_CODES = new Set([
  "USER_INACTIVE",
  "USER_NOT_FOUND",
  "TOKEN_REVOKED",
  "INVALID_REFRESH_TOKEN",
]);

function readStorefrontPreviewToken() {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash).get("preview") || "";
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function persistSessionTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function redirectToAuth() {
  if (!window.location.pathname.startsWith("/auth")) {
    window.location.replace("/auth");
  }
}

const api = axios.create({
  baseURL: STOREFRONT_API_BASE_URL,
  timeout: 30_000,
});

api.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};

    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const previewToken = readStorefrontPreviewToken();
    if (previewToken && !config.headers["X-ALESTEB-Preview-Token"]) {
      config.headers["X-ALESTEB-Preview-Token"] = previewToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${STOREFRONT_API_BASE_URL}/auth/refresh`,
        { refreshToken },
        {
          timeout: 15_000,
          headers: storefrontHeaders({ "Content-Type": "application/json" }),
        }
      )
      .then(({ data }) => {
        const accessToken = data?.data?.accessToken;
        const nextRefreshToken = data?.data?.refreshToken;

        if (!accessToken || !nextRefreshToken) {
          throw new Error("Invalid refresh response");
        }

        persistSessionTokens(accessToken, nextRefreshToken);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code || "";
    const originalRequest = error.config;

    if (status === 401 && TERMINAL_TOKEN_CODES.has(code)) {
      clearStoredSession();
      redirectToAuth();
      return Promise.reject(error);
    }

    if (
      status === 401 &&
      REFRESHABLE_TOKEN_CODES.has(code) &&
      originalRequest &&
      !originalRequest._storefrontRetry &&
      getRefreshToken()
    ) {
      originalRequest._storefrontRetry = true;

      try {
        const accessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        clearStoredSession();
        redirectToAuth();
        return Promise.reject(error);
      }
    }

    if (status === 401 && REFRESHABLE_TOKEN_CODES.has(code)) {
      clearStoredSession();
      redirectToAuth();
    } else if (status === 401) {
      console.error("[Storefront API] Unauthorized request:", code);
    }

    if (status === 403) {
      console.error(
        "[Storefront API] Access denied:",
        error.response?.data?.message
      );
    }

    return Promise.reject(error);
  }
);

export default api;
