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

// WCAG relative luminance — 0 (black) → 1 (white)
function getLuminance(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return 1;
  return [m[1], m[2], m[3]]
    .map(c => { const v = parseInt(c, 16) / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((acc, c, i) => acc + [0.2126, 0.7152, 0.0722][i] * c, 0);
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

  const isDark = getLuminance(pageBg) < 0.18;
  if (isDark) {
    root.style.setProperty("--store-text-primary",   "#f8fafc");
    root.style.setProperty("--store-text-secondary", "#cbd5e1");
    root.style.setProperty("--store-text-muted",     "#94a3b8");
    root.style.setProperty("--store-surface",        "rgba(255,255,255,0.07)");
    root.style.setProperty("--store-surface-hover",  "rgba(255,255,255,0.11)");
    root.style.setProperty("--store-border",         "rgba(255,255,255,0.12)");
  } else {
    root.style.setProperty("--store-text-primary",   "#0f172a");
    root.style.setProperty("--store-text-secondary", "#475569");
    root.style.setProperty("--store-text-muted",     "#94a3b8");
    root.style.setProperty("--store-surface",        "#f8fafc");
    root.style.setProperty("--store-surface-hover",  "#f1f5f9");
    root.style.setProperty("--store-border",         "#e2e8f0");
  }

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
