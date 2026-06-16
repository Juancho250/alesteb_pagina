import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AppearanceContext = createContext(null);

const ALLOWED_FONTS = new Set(["Inter", "Poppins", "Raleway", "Nunito", "Lato"]);

function applyGlobalStyles(data) {
  if (!data) return;

  if (data.store_page_bg) {
    document.body.style.backgroundColor = data.store_page_bg;
  }

  if (data.primary_color) {
    document.documentElement.style.setProperty("--brand", data.primary_color);
  }

  const font = data.store_font;
  if (font && ALLOWED_FONTS.has(font)) {
    if (!document.getElementById("gf-dynamic")) {
      const link = document.createElement("link");
      link.id = "gf-dynamic";
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@400;500;600;700;800;900&display=swap`;
      document.head.appendChild(link);
    }
    document.body.style.fontFamily = `'${font}', system-ui, sans-serif`;
  }
}

export function AppearanceProvider({ children }) {
  const [appearance, setAppearance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin-profile")
      .then(res => {
        const data = res.data?.data ?? res.data ?? null;
        if (data) {
          setAppearance(data);
          applyGlobalStyles(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppearanceContext.Provider value={{ appearance, loading }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
