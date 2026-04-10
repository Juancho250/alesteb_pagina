// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // ── Inicializar desde localStorage para sobrevivir recargas ──────────────
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("alesteb_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ── Sincronizar con localStorage cada vez que cambia el carrito ──────────
  useEffect(() => {
    try {
      localStorage.setItem("alesteb_cart", JSON.stringify(cart));
    } catch {
      // localStorage lleno o bloqueado — ignorar silenciosamente
    }
  }, [cart]);

  // ── Agregar / quitar del carrito (toggle) ────────────────────────────────
  const toggleCart = useCallback((product, quantity = 1) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.filter(i => i.id !== product.id);
      return [...prev, { ...product, quantity }];
    });
  }, []);

  // ── Actualizar cantidad ──────────────────────────────────────────────────
  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.id !== productId));
      return;
    }
    setCart(prev =>
      prev.map(i => i.id === productId ? { ...i, quantity: qty } : i)
    );
  }, []);

  // ── Quitar un producto ───────────────────────────────────────────────────
  const removeFromCart = useCallback((product) => {
    setCart(prev => prev.filter(i => i.id !== product.id));
  }, []);

  // ── Vaciar el carrito (llamar DESPUÉS de confirmar un pedido) ────────────
  const clearCart = useCallback(() => {
    setCart([]);
    try { localStorage.removeItem("alesteb_cart"); } catch {}
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