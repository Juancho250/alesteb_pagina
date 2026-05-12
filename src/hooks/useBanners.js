// src/hooks/useBanners.js
import { useState, useEffect, useRef } from "react";
import api from "../services/api";

const CACHE_KEY = "_alesteb_banners";
const CACHE_TTL = 5 * 60 * 1000;

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
  // Lee el caché UNA vez al montar — solo para el estado inicial
  const initialCache = useRef(readCache());
  const cached       = initialCache.current;

  const [banners, setBanners] = useState(cached?.data ?? []);
  // loading=true solo si NO hay caché (ni fresca ni stale)
  const [loading, setLoading] = useState(!cached);
  const [error,   setError]   = useState(null);
  const isMounted             = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Caché fresca → no fetches
    if (cached && !cached.stale) {
      return;
    }

    const controller = new AbortController();

    async function fetchBanners() {
      try {
        const response = await api.get("/banners", {
          signal: controller.signal,
        });

        // response.data = { success: true, data: [...] }
        const raw  = response.data?.data ?? response.data;
        const list = Array.isArray(raw) ? raw : [];

        if (isMounted.current) {
          setBanners(list);
          setError(null);
        }
        writeCache(list);
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") return;
        // Si hay caché stale, la seguimos mostrando en silencio
        if (isMounted.current && !cached) {
          setError(err);
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
  // Solo se ejecuta al montar — dependencias vacías intencional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { banners, loading, error };
}