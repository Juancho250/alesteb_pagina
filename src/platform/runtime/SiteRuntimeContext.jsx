import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../../services/api";
import {
  createSiteRuntime,
  extractPublicProfile,
  FALLBACK_SITE_RUNTIME,
} from "./siteRuntime";

const SiteRuntimeContext = createContext(null);

const FATAL_STOREFRONT_CODES = new Set([
  "NO_API_KEY",
  "INVALID_API_KEY",
  "INVALID_API_KEY_FORMAT",
  "API_KEY_INACTIVE",
  "API_KEY_EXPIRED",
  "ORIGIN_NOT_ALLOWED",
  "TENANT_CONTEXT_UNAVAILABLE",
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
  const [runtime, setRuntime] = useState(FALLBACK_SITE_RUNTIME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fatalError, setFatalError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get("/profile");
      const profile = extractPublicProfile(response);
      setRuntime(createSiteRuntime(profile));
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
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({ runtime, loading, error, fatalError, reload }),
    [runtime, loading, error, fatalError, reload]
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
