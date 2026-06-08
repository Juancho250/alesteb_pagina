// src/hooks/useAvailability.js
// Live stock check via GET /public-api/v1/inventory/availability.
// Accessible with API key only (no admin JWT required).
// Falls back silently on error so it never blocks the UI.
import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

// Derive the public-api base from the same env variable used by api.js.
// baseURL ends in /api; replace that suffix to get the public API root.
const rawBase = import.meta.env.VITE_API_BASE_URL?.trim() ?? "https://alesteb-back-1.onrender.com/api";
const PUBLIC_API_BASE = rawBase.replace(/\/api\/?$/, "/public-api/v1");

/**
 * @param {number|null} productId
 * @param {number|null} variantId   — pass null for product-level availability
 * @returns {{ available, minStock, isOut, isLow, loading, refresh }}
 */
export function useAvailability(productId, variantId = null) {
  const [available, setAvailable] = useState(null);
  const [minStock,  setMinStock]  = useState(null);
  const [loading,   setLoading]   = useState(false);

  const check = useCallback(() => {
    if (!productId) return;
    setLoading(true);
    const params = new URLSearchParams({ productId });
    if (variantId != null) params.append("variantId", variantId);

    // Use absolute URL so it bypasses api.js baseURL and hits the public-api path.
    // The api interceptor still attaches X-API-Key automatically.
    api.get(`${PUBLIC_API_BASE}/inventory/availability?${params}`)
      .then(({ data }) => {
        // View column is `disponible`, not `available`
        setAvailable(data?.data?.disponible ?? null);
        setMinStock(data?.data?.min_stock   ?? null);
      })
      .catch(() => {
        // Fail silently — caller falls back to cached product.stock
      })
      .finally(() => setLoading(false));
  }, [productId, variantId]);

  useEffect(() => { check(); }, [check]);

  return {
    available,
    minStock,
    isOut:  available !== null && available <= 0,
    isLow:  available !== null && available > 0 && minStock !== null && available <= minStock,
    loading,
    refresh: check,
  };
}
