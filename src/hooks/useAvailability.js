// src/hooks/useAvailability.js
// Live stock check against GET /inventory/availability?productId=X[&variantId=Y].
// Falls back silently on error so it never blocks the UI.
import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

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

    api.get(`/inventory/availability?${params}`)
      .then(({ data }) => {
        setAvailable(data?.data?.available ?? null);
        setMinStock(data?.data?.min_stock  ?? null);
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
