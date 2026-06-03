/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// ⚠️ Usa el cliente público (API Key), NO el api.js de admin (JWT)
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://alesteb-back-1.onrender.com/public-api/v1")
  .replace(/\/+$/, "");
const API_KEY = import.meta.env.VITE_API_KEY || "";

const DiscountsContext = createContext({ discounts: [], applyDiscount: (p) => p });

export function DiscountsProvider({ children }) {
  const [discounts, setDiscounts] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/discounts`, {
      headers: { "X-API-Key": API_KEY },
    })
      .then(r => r.json())
      .then(({ data }) => setDiscounts(Array.isArray(data) ? data : []))
      .catch(() => setDiscounts([]));
  }, []);

  // ✅ FIX: applyDiscount acepta un segundo argumento `basePrice` opcional.
  // Esto permite que ProductDetail pase el precio de una variante específica
  // para calcular su descuento, sin depender de product.sale_price del padre.
  const applyDiscount = useCallback((product, overrideBasePrice = null) => {
    const price = overrideBasePrice !== null
      ? Number(overrideBasePrice)
      : Number(product.sale_price || product.price) || 0;

    if (!price || !discounts.length) return product;

    // Si el backend ya calculó final_price (viene del LATERAL JOIN en products.controller),
    // y viene del listing (tiene discount_type), confiar en ese valor directamente.
    // En el detalle, final_price puede ser igual a sale_price (sin descuento del servidor),
    // así que siempre recalculamos para garantizar coherencia con el contexto local.
    const serverHasDiscount = product.discount_type && product.final_price &&
      Number(product.final_price) < price;

    if (serverHasDiscount && overrideBasePrice === null) {
      // El backend ya aplicó el descuento correcto en el listing — no recalcular
      return product;
    }

    const productId  = String(product.id);
    const categoryId = String(product.category_id || "");

    // Buscar el descuento con menor precio final que aplique a este producto
    let bestDiscount = null;
    let bestPrice    = price;

    for (const d of discounts) {
      // Verificar vigencia (la API pública ya filtra, pero por si el cache está desactualizado)
      const now   = Date.now();
      const start = d.starts_at ? new Date(d.starts_at).getTime() : 0;
      const end   = d.ends_at   ? new Date(d.ends_at).getTime()   : Infinity;
      if (now < start || now > end) continue;

      // Solo descuentos de canal web/all aplican en la tienda pública
      if (d.scope && d.scope !== "web" && d.scope !== "all") continue;

      // Verificar si el descuento aplica a este producto
      const targets = Array.isArray(d.targets) ? d.targets : [];

      // Sin targets → aplica globalmente a todos los productos
      const isGlobal = targets.length === 0;

      // Con targets → verificar si este producto o su categoría están incluidos
      const appliesToProduct  = targets.some(t => t.target_type === "product"  && String(t.target_id) === productId);
      const appliesToCategory = targets.some(t => t.target_type === "category" && String(t.target_id) === categoryId && categoryId);

      if (!isGlobal && !appliesToProduct && !appliesToCategory) continue;

      // No aplicar si hay un mínimo de compra (en el listado/detalle no conocemos el total del carrito)
      const min = Number(d.min_purchase_amount) || 0;
      if (min > 0) continue;

      // Calcular precio final con este descuento
      let finalPrice = price;
      if (d.type === "percentage") {
        const cut    = (price * Number(d.value)) / 100;
        const maxCut = d.max_discount_amount ? Number(d.max_discount_amount) : Infinity;
        finalPrice   = price - Math.min(cut, maxCut);
      } else {
        finalPrice = Math.max(0, price - Number(d.value));
      }

      // Quedarse con el descuento más beneficioso
      if (finalPrice < bestPrice) {
        bestPrice    = finalPrice;
        bestDiscount = d;
      }
    }

    if (!bestDiscount) return product;

    return {
      ...product,
      final_price:   bestPrice,
      discount_info: bestDiscount,
    };
  }, [discounts]);

  return (
    <DiscountsContext.Provider value={{ discounts, applyDiscount }}>
      {children}
    </DiscountsContext.Provider>
  );
}

export const useDiscounts = () => useContext(DiscountsContext);