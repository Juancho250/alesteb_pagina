// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CartContext = createContext(null);

// ─── Key única por item ───────────────────────────────────────────────────────
// Producto simple  → "42"
// Con variante     → "42-v7"
const resolveKey = (product) =>
  product.cartKey != null ? String(product.cartKey) : String(product.id);

const STORAGE_KEY = "alesteb_cart";

const loadCart = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map(item => ({
      ...item,
      cartKey: item.cartKey ?? String(item.id),
    }));
  } catch {
    return [];
  }
};

// ─── Precio efectivo de un ítem ──────────────────────────────────────────────
export const getItemPrice = (item) =>
  Number(item.variantPrice ?? item.final_price ?? item.sale_price ?? item.price ?? 0);

// ─── Provider ────────────────────────────────────────────────────────────────
export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {}
  }, [cart]);

  /**
   * toggleCart(product, quantity = 1)
   * - Si el ítem NO existe → lo agrega con la quantity indicada.
   * - Si ya existe → actualiza quantity (upsert).
   *   Para ELIMINAR usa removeFromCart().
   *
   * Esto permite que ProductDetail añada qty > 1 y que
   * al volver a la página la cantidad se respete.
   */
  const toggleCart = useCallback((product, quantity = 1) => {
    const key = resolveKey(product);
    setCart(prev => {
      const existing = prev.find(i => i.cartKey === key);
      if (existing) {
        // Si misma cantidad ya en carrito → eliminar (comportamiento toggle)
        if (existing.quantity === Math.max(1, quantity)) {
          return prev.filter(i => i.cartKey !== key);
        }
        // Distinta cantidad → actualizar
        return prev.map(i =>
          i.cartKey === key ? { ...i, quantity: Math.max(1, quantity) } : i
        );
      }
      return [...prev, { ...product, cartKey: key, quantity: Math.max(1, quantity) }];
    });
  }, []);

  /**
   * updateQty(cartKey, qty)
   * Establece cantidad exacta. Si qty ≤ 0 elimina el ítem.
   */
  const updateQty = useCallback((cartKey, qty) => {
    const key = String(cartKey);
    setCart(prev =>
      qty <= 0
        ? prev.filter(i => i.cartKey !== key)
        : prev.map(i => i.cartKey === key ? { ...i, quantity: qty } : i)
    );
  }, []);

  /**
   * removeFromCart(cartKey | product)
   * Acepta un cartKey string/number o un objeto con .cartKey / .id
   */
  const removeFromCart = useCallback((cartKeyOrProduct) => {
    const key = typeof cartKeyOrProduct === "object"
      ? resolveKey(cartKeyOrProduct)
      : String(cartKeyOrProduct);
    setCart(prev => prev.filter(i => i.cartKey !== key));
  }, []);

  /**
   * clearCart() — llamar DESPUÉS de confirmar un pedido
   */
  const clearCart = useCallback(() => {
    setCart([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <CartContext.Provider value={{ cart, toggleCart, updateQty, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}