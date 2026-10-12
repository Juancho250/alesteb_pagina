import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../../services/api";
import { loadPublicJson } from "../../services/publicData";
import {
  createSiteRuntime,
  extractPublicProfile,
  FALLBACK_SITE_RUNTIME,
} from "./siteRuntime";

const SiteRuntimeContext = createContext(null);

const RUNTIME_CACHE_KEY = "_alesteb_site_runtime_v1";

function readCachedRuntime() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RUNTIME_CACHE_KEY) || "null");
    return parsed?.runtime?.status === "resolved" ? parsed.runtime : null;
  } catch {
    return null;
  }
}

function writeCachedRuntime(runtime) {
  try {
    localStorage.setItem(
      RUNTIME_CACHE_KEY,
      JSON.stringify({ runtime, updatedAt: Date.now() })
    );
  } catch {
    // El cache es una optimización; nunca debe romper la tienda.
  }
}

function upsertMeta(selector, selectorAttributes, content) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    for (const [key, value] of Object.entries(selectorAttributes)) {
      element.setAttribute(key, value);
    }
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function safePublicImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const candidate = new URL(value, window.location.origin);
    return candidate.protocol === "https:" || candidate.origin === window.location.origin
      ? candidate.href
      : "";
  } catch {
    return "";
  }
}

function applySiteDocumentMetadata(runtime) {
  if (runtime.status !== "resolved") return;
  const seo = runtime.site.manifest?.seo || {};
  const title = String(seo.title || runtime.identity.businessName || "Tienda en línea").trim().slice(0, 70);
  const description = String(
    seo.description || runtime.identity.description || `Explora el catálogo de ${runtime.identity.businessName || "nuestra tienda"}.`
  ).trim().slice(0, 160);

  document.title = title;
  upsertMeta('meta[name="description"]', { name: "description" }, description);
  upsertMeta('meta[property="og:title"]', { property: "og:title" }, title);
  upsertMeta('meta[property="og:description"]', { property: "og:description" }, description);

  const favicon = safePublicImageUrl(runtime.brand.assets.faviconUrl || runtime.brand.assets.logoUrl);
  let icon = document.head.querySelector('link[rel="icon"]');
  if (favicon) {
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.href = favicon;
  } else {
    icon?.remove();
  }

  const socialImage = safePublicImageUrl(runtime.brand.assets.logoUrl);
  const ogImage = document.head.querySelector('meta[property="og:image"]');
  if (socialImage) {
    upsertMeta('meta[property="og:image"]', { property: "og:image" }, socialImage);
  } else {
    ogImage?.remove();
  }
}

const FATAL_STOREFRONT_CODES = new Set([
  "NO_API_KEY",
  "INVALID_API_KEY",
  "INVALID_API_KEY_FORMAT",
  "API_KEY_INACTIVE",
  "API_KEY_EXPIRED",
  "ORIGIN_NOT_ALLOWED",
  "TENANT_CONTEXT_UNAVAILABLE",
  "SITE_PREVIEW_TOKEN_EXPIRED",
  "SITE_PREVIEW_TOKEN_INVALID",
  "SITE_PREVIEW_TENANT_MISMATCH",
]);

function storefrontFatalError(error) {
  const status = error?.response?.status;
  const code = error?.response?.data?.code || "";
  if (![401, 403, 503].includes(status) || !FATAL_STOREFRONT_CODES.has(code)) {
    return null;
  }
  return {
    status,
    code,
    message:
      error?.response?.data?.message ||
      "La tienda no está disponible temporalmente.",
  };
}

export function SiteRuntimeProvider({ children }) {
  const previewToken = useMemo(() => {
    if (typeof window === "undefined") return "";
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    return new URLSearchParams(hash).get("preview") || "";
  }, []);

  const [runtime, setRuntime] = useState(
    () => previewToken ? FALLBACK_SITE_RUNTIME : (readCachedRuntime() || FALLBACK_SITE_RUNTIME)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fatalError, setFatalError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const manifestRequest = previewToken
        ? api.post(
            "/site-manifest/preview",
            { token: previewToken },
            { headers: { "Cache-Control": "no-store" } }
          ).then((response) => response.data)
        : loadPublicJson("/site-manifest", "site-manifest").catch(() => null);

      const [profilePayload, manifestPayload] = await Promise.all([
        loadPublicJson("/profile", "profile"),
        manifestRequest,
      ]);
      const profile = extractPublicProfile({ data: profilePayload });
      const manifest = manifestPayload?.data ?? manifestPayload ?? null;
      const nextRuntime = createSiteRuntime(profile, manifest);
      setRuntime(nextRuntime);
      if (nextRuntime.status === "resolved" && !previewToken) writeCachedRuntime(nextRuntime);
      setError(null);
      setFatalError(null);
    } catch (loadError) {
      setError(loadError);
      setFatalError(storefrontFatalError(loadError));
      setRuntime((current) =>
        current.status === "resolved" ? current : FALLBACK_SITE_RUNTIME
      );
    } finally {
      setLoading(false);
    }
  }, [previewToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    applySiteDocumentMetadata(runtime);
  }, [runtime]);


  const value = useMemo(
    () => ({ runtime, loading, error, fatalError, reload, previewMode: Boolean(previewToken) }),
    [runtime, loading, error, fatalError, reload, previewToken]
  );

  return (
    <SiteRuntimeContext.Provider value={value}>
      {children}
    </SiteRuntimeContext.Provider>
  );
}

export function useSiteRuntime() {
  const context = useContext(SiteRuntimeContext);

  if (!context) {
    throw new Error("useSiteRuntime debe usarse dentro de SiteRuntimeProvider");
  }

  return context;
}
