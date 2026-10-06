const DEFAULT_STOREFRONT_PROXY = "/api/storefront";

function stripTrailingSlashes(value) {
  return value.replace(/\/+$/, "");
}

export function resolveStorefrontApiBase(rawValue) {
  let base = stripTrailingSlashes(
    String(rawValue || DEFAULT_STOREFRONT_PROXY).trim()
  );

  if (!base || base === "/api" || base === "api") {
    base = DEFAULT_STOREFRONT_PROXY;
  }

  if (/\/public-api\/v1$/i.test(base)) {
    return base;
  }

  return `${stripTrailingSlashes(base)}/public-api/v1`;
}

export const STOREFRONT_API_BASE_URL = resolveStorefrontApiBase(
  import.meta.env.VITE_API_BASE_URL
);

export function storefrontHeaders(extra = {}) {
  return { ...extra };
}
