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

export function SiteRuntimeProvider({ children }) {
  const [runtime, setRuntime] = useState(FALLBACK_SITE_RUNTIME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get("/profile");
      const profile = extractPublicProfile(response);
      setRuntime(createSiteRuntime(profile));
      setError(null);
    } catch (loadError) {
      setError(loadError);
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
    () => ({ runtime, loading, error, reload }),
    [runtime, loading, error, reload]
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
