import { createContext, useContext, useEffect } from "react";
import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";

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

function applyGlobalStyles(data, style) {
  if (!data) return;
  const root = document.documentElement;

  // Style is a published, backend-sanitized site manifest; these defaults
  // preserve the appearance of stores that have not configured the editor.
  const safeColor = (value, fallback) =>
    typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
      ? value : fallback;
  const surface = safeColor(style?.surfaceColor, "#FFFFFF");
  const footer = safeColor(style?.footerColor, "#F5F5F7");
  const darkSurface = getLuminance(surface) < 0.18;
  const darkFooter = getLuminance(footer) < 0.18;
  const radii = { pill: "999px", soft: "14px", square: "4px" };
  const cardRadii = { round: "32px", soft: "16px", square: "4px" };
  const spacing = { compact: "48px", balanced: "80px", spacious: "112px" };

  root.style.setProperty("--store-surface-bg", surface);
  root.style.setProperty("--store-surface-text", darkSurface ? "#F8FAFC" : "#17191D");
  root.style.setProperty("--store-surface-muted", darkSurface ? "#CBD5E1" : "#62646B");
  root.style.setProperty("--store-surface-border", darkSurface ? "#41434A" : "#E5E7EB");
  root.style.setProperty("--store-footer-bg", footer);
  root.style.setProperty("--store-footer-text", darkFooter ? "#F8FAFC" : "#1D1D1F");
  root.style.setProperty("--store-footer-muted", darkFooter ? "#CBD5E1" : "#52525B");
  root.style.setProperty("--store-footer-border", darkFooter ? "#3F3F46" : "#D2D2D7");
  root.style.setProperty("--store-button-radius", radii[style?.buttonShape] || radii.pill);
  root.style.setProperty("--store-card-radius", cardRadii[style?.cardShape] || cardRadii.round);
  root.style.setProperty("--store-section-spacing", spacing[style?.sectionSpacing] || spacing.balanced);
  root.style.setProperty("--store-content-width", style?.contentWidth === "wide" ? "1400px" : "1152px");
  root.style.setProperty("--store-footer-width", style?.contentWidth === "wide" ? "1320px" : "1024px");
  root.style.setProperty("--store-header-shadow",
    style?.headerTreatment === "elevated" ? "0 8px 28px rgba(0,0,0,.11)" : "none");
  root.style.setProperty("--store-product-aspect", style?.productImageRatio === "square" ? "1 / 1" : "4 / 5");
  root.style.setProperty("--store-catalog-columns", ["3", "4", "5"].includes(style?.catalogColumns) ? style.catalogColumns : "4");



  if (data.primary_color) {
    root.style.setProperty("--brand", data.primary_color);
    const rgb = hexToRgb(data.primary_color);
    if (rgb) root.style.setProperty("--brand-rgb", rgb);
    root.style.setProperty("--brand-hover", darken(data.primary_color, 12));
    root.style.setProperty("--store-brand-contrast", getLuminance(data.primary_color) > 0.36 ? "#101114" : "#FFFFFF");
  }

  const secondaryColor = safeColor(data.secondary_color, "#1E40AF");
  const accentColor = safeColor(data.accent_color, "#F59E0B");
  root.style.setProperty("--brand-secondary", secondaryColor);
  root.style.setProperty("--brand-accent", accentColor);
  root.style.setProperty("--store-secondary-contrast", getLuminance(secondaryColor) > 0.36 ? "#101114" : "#FFFFFF");
  root.style.setProperty("--store-accent-contrast", getLuminance(accentColor) > 0.36 ? "#101114" : "#FFFFFF");

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

  const font = ALLOWED_FONTS.has(data.store_font) ? data.store_font : null;
  root.style.setProperty(
    "--store-font-family",
    font ? `'${font}', system-ui, sans-serif` : "ui-sans-serif, system-ui, sans-serif"
  );
  document.body.style.fontFamily = "var(--store-font-family)";

  let link = document.getElementById("gf-dynamic");
  if (font) {
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
  } else {
    link?.remove();
  }
}

export function AppearanceProvider({ children }) {
  const { runtime, loading } = useSiteRuntime();
  const appearance = runtime.compatibility.publicProfile;

  useEffect(() => {
    applyGlobalStyles(appearance, runtime.site.manifest?.style);
  }, [appearance, runtime.site.manifest?.style]);

  return (
    <AppearanceContext.Provider value={{ appearance, loading }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
