import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AppearanceContext = createContext(null);

const ALLOWED_FONTS = new Set(["Inter", "Poppins", "Raleway", "Nunito", "Lato"]);

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? `${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)}`
    : null;
}

function darken(hex, pct) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const f = 1 - pct / 100;
  const ch = (n) => Math.max(0, Math.round(parseInt(n, 16) * f)).toString(16).padStart(2, "0");
  return `#${ch(m[1])}${ch(m[2])}${ch(m[3])}`;
}

function applyGlobalStyles(data) {
  if (!data) return;
  const root = document.documentElement;

  if (data.primary_color) {
    root.style.setProperty("--brand", data.primary_color);
    const rgb = hexToRgb(data.primary_color);
    if (rgb) root.style.setProperty("--brand-rgb", rgb);
    root.style.setProperty("--brand-hover", darken(data.primary_color, 12));
  }

  const pageBg = data.store_page_bg || "#ffffff";
  root.style.setProperty("--store-page-bg", pageBg);
  document.body.style.backgroundColor = pageBg;

  const font = data.store_font;
  if (font && ALLOWED_FONTS.has(font)) {
    let link = document.getElementById("gf-dynamic");
    const href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@400;500;600;700;800;900&display=swap`;
    if (link) {
      link.href = href;
    } else {
      link = document.createElement("link");
      link.id = "gf-dynamic";
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
    document.body.style.fontFamily = `'${font}', system-ui, sans-serif`;
  }
}

export function AppearanceProvider({ children }) {
  const [appearance, setAppearance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/profile")
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
