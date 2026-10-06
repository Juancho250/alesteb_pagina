import api from "./api";

const CACHE_PREFIX = "_alesteb_public_v2:";
const memory = new Map();
const inFlight = new Map();

function storage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

export function readPublicCache(key, maxAgeMs = 30 * 60 * 1000) {
  const now = Date.now();
  const mem = memory.get(key);
  if (mem && now - mem.ts <= maxAgeMs) return mem.data;

  try {
    const raw = storage()?.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || now - Number(parsed.ts || 0) > maxAgeMs) return null;
    memory.set(key, parsed);
    return parsed.data;
  } catch {
    return null;
  }
}

export function writePublicCache(key, data) {
  const entry = { data, ts: Date.now() };
  memory.set(key, entry);
  try {
    storage()?.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Cache persistence is best-effort only.
  }
  return data;
}

function earlyPrefetch(path) {
  if (typeof window === "undefined") return null;
  const value = window.__ALESTEB_PREFETCH__?.[path];
  return value && typeof value.then === "function" ? value : null;
}

export function loadPublicJson(path, cacheKey = path) {
  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);

  const prefetched = earlyPrefetch(path);
  const promise = (
    prefetched
      ? Promise.resolve(prefetched)
      : api.get(path).then((response) => response.data)
  )
    .then((payload) => {
      if (payload != null) writePublicCache(cacheKey, payload);
      return payload;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
      if (typeof window !== "undefined" && window.__ALESTEB_PREFETCH__?.[path]) {
        delete window.__ALESTEB_PREFETCH__[path];
      }
    });

  inFlight.set(cacheKey, promise);
  return promise;
}
