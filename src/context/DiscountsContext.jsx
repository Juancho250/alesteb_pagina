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

  const applyDiscount = useCallback((product) => {
    const price = Number(product.sale_price || product.price) || 0;
    if (!price || !discounts.length) return product;

    // Si el backend ya calculó final_price (viene del LATERAL JOIN en products.controller),
    // confiar en ese valor directamente — es más preciso que recalcular aquí.
    if (product.final_price && Number(product.final_price) < price) {
      return product; // ya viene resuelto desde el servidor
    }

    const productId  = String(product.id);
    const categoryId = String(product.category_id || "");

    // Buscar el descuento con menor precio final que aplique a este producto
    let bestDiscount = null;
    let bestPrice    = price;

    for (const d of discounts) {
      // La API pública ya filtra active=true, fechas vigentes y scope web/all,
      // pero si el cache está desactualizado verificamos fechas aquí también
      const now   = Date.now();
      const start = d.starts_at ? new Date(d.starts_at).getTime() : 0;
      const end   = d.ends_at   ? new Date(d.ends_at).getTime()   : Infinity;
      if (now < start || now > end) continue;

      // Verificar scope: solo 'web' o 'all' aplican en la tienda pública
      if (d.scope && d.scope !== 'web' && d.scope !== 'all') continue;

      // Verificar si el descuento aplica a este producto
      const targets = Array.isArray(d.targets) ? d.targets : [];

      // Sin targets → aplica globalmente a todos los productos
      const isGlobal = targets.length === 0;

      // Con targets → verificar si este producto o su categoría están incluidos
      const appliesToProduct  = targets.some(t => t.target_type === 'product'  && String(t.target_id) === productId);
      const appliesToCategory = targets.some(t => t.target_type === 'category' && String(t.target_id) === categoryId && categoryId);

      if (!isGlobal && !appliesToProduct && !appliesToCategory) continue;

      // Calcular precio final con este descuento
      let finalPrice = price;
      if (d.type === 'percentage') {
        const cut    = (price * Number(d.value)) / 100;
        const maxCut = d.max_discount_amount ? Number(d.max_discount_amount) : Infinity;
        finalPrice   = price - Math.min(cut, maxCut);
      } else {
        finalPrice = Math.max(0, price - Number(d.value));
      }

      // No aplicar si no se supera el mínimo de compra
      // (En el listado no conocemos el total del carrito, así que solo
      //  aplicamos si min_purchase_amount es 0 o nulo)
      const min = Number(d.min_purchase_amount) || 0;
      if (min > 0) continue;

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