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
import { PREVIEW_READY, PREVIEW_APPLY, normalizeLivePreviewManifest, isTrustedPreviewEditorOrigin } from "./livePreviewProtocol";
import {
  createSiteRuntime,
  extractPublicProfile,
  FALLBACK_SITE_RUNTIME,
} from "./siteRuntime";

const SiteRuntimeContext = createContext(null);

// Do not rehydrate another business identity from browser-wide storage.
// Public data has its own scoped caching and is resolved before the store is shown.
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

  const editorSession = useMemo(() => {
    const hash = typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, "");
    return new URLSearchParams(hash).get("editorSession") || "";
  }, []);
  const [previewVerified, setPreviewVerified] = useState(false);

  const [runtime, setRuntime] = useState(FALLBACK_SITE_RUNTIME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fatalError, setFatalError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setPreviewVerified(false);

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
      if (previewToken && (
        manifestPayload?.success !== true ||
        !manifestPayload?.preview ||
        !manifest ||
        manifest.schemaVersion !== 1
      )) {
        throw new Error("SITE_PREVIEW_MANIFEST_INVALID");
      }
      const nextRuntime = createSiteRuntime(profile, manifest);
      if (previewToken && nextRuntime.status !== "resolved") {
        throw new Error("SITE_PREVIEW_PROFILE_UNAVAILABLE");
      }
      setRuntime(nextRuntime);
      setPreviewVerified(Boolean(previewToken));

      setError(null);
      setFatalError(null);
    } catch (loadError) {
      setError(loadError);
      setFatalError(storefrontFatalError(loadError) || {
        status: loadError?.response?.status || 503,
        code: "STOREFRONT_PROFILE_LOAD_FAILED",
        message: "No se pudo identificar de forma segura la tienda.",
      });
      // Never continue displaying a cached or previously selected company
      // when authoritative profile resolution fails.
      setRuntime(FALLBACK_SITE_RUNTIME);
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

  // This channel only exists inside a server-authenticated, signed-token preview.
  // Updates affect React's in-memory presentation model; no DB writes or publishing.
  useEffect(() => {
    if (!previewToken || !previewVerified || !editorSession || window.parent === window) return undefined;

    const onMessage = (event) => {
      if (event.source !== window.parent || !isTrustedPreviewEditorOrigin(event.origin)) return;
      if (event.data?.type !== PREVIEW_APPLY || event.data?.editorSession !== editorSession) return;
      const safeManifest = normalizeLivePreviewManifest(event.data.manifest);
      if (!safeManifest) return;
      setRuntime((current) => (
        current.status === "resolved"
          ? createSiteRuntime(current.compatibility.publicProfile, safeManifest)
          : current
      ));
    };
    window.addEventListener("message", onMessage);
    // Only a non-sensitive random session ID is announced to the embedding window.
    window.parent.postMessage({ type: PREVIEW_READY, editorSession }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, [previewToken, previewVerified, editorSession]);


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
