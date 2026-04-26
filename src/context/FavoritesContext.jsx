import { createContext, useCallback, useContext, useState } from "react";

const FavoritesContext = createContext();

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favorites") || "[]");
    } catch {
      return [];
    }
  });

  const toggleFavorite = useCallback((product) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === product.id);
      const next = exists
        ? prev.filter(f => f.id !== product.id)
        : [...prev, { id: product.id, name: product.name, sale_price: product.sale_price, final_price: product.final_price, main_image: product.main_image, category_name: product.category_name, has_variants: product.has_variants }];
      localStorage.setItem("favorites", JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((id) => favorites.some(f => f.id === id), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};