const DEFAULT_BACKEND_ORIGIN = "https://alesteb-back-1ea2.onrender.com";

function stripTrailingSlashes(value) {
  return value.replace(/\/+$/, "");
}

export function resolveStorefrontApiBase(rawValue) {
  let base = stripTrailingSlashes(
    String(rawValue || DEFAULT_BACKEND_ORIGIN).trim()
  );

  if (!base || base === "/api" || base === "api" || base === "/public-api/v1" || base === "public-api/v1") {
    base = DEFAULT_BACKEND_ORIGIN;
  }

  base = base
    .replace(/\/public-api\/v1$/i, "")
    .replace(/\/api$/i, "");

  return `${stripTrailingSlashes(base)}/public-api/v1`;
}

export const STOREFRONT_API_BASE_URL = resolveStorefrontApiBase(
  import.meta.env.VITE_API_BASE_URL
);

export const STOREFRONT_API_KEY = import.meta.env.VITE_API_KEY?.trim() || "";

export function storefrontHeaders(extra = {}) {
  return {
    ...(STOREFRONT_API_KEY ? { "X-API-Key": STOREFRONT_API_KEY } : {}),
    ...extra,
  };
}
