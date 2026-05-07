// src/hooks/useBanners.js
// ─── Stale-While-Revalidate: sirve caché al instante, revalida en segundo plano ───
import { useState, useEffect, useRef } from "react";
import api from "../api/axios"; // tu instancia axios

const CACHE_KEY   = "_alesteb_banners";
const CACHE_TTL   = 5 * 60 * 1000; // 5 min — después fuerza revalidación

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return { data, stale: Date.now() - ts > CACHE_TTL };
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export function useBanners() {
  const cached          = readCache();
  const [banners,    setBanners]    = useState(cached?.data ?? []);
  const [loading,    setLoading]    = useState(!cached);
  const [error,      setError]      = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Si hay caché fresca, no pedimos nada
    if (cached && !cached.stale) return;

    const controller = new AbortController();

    async function fetchBanners() {
      try {
        const { data } = await api.get("/banners", {
          signal: controller.signal,
          // No re-enviar token — es ruta pública
          headers: { Authorization: undefined },
        });

        const active = data.filter(b => b.is_active !== false);
        if (isMounted.current) {
          setBanners(active);
          setError(null);
        }
        writeCache(active);
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") return;
        if (isMounted.current) {
          // Si hay caché (aunque stale), no mostramos error — silencioso
          if (!cached) setError(err);
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    }

    fetchBanners();

    return () => {
      isMounted.current = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { banners, loading, error };
}