import { createContext, useContext, useEffect, useMemo } from "react";
import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";

const AppearanceContext = createContext(null);

const ALLOWED_FONTS = new Set(["Inter", "Poppins", "Raleway", "Nunito", "Lato"]);
const DEFAULT_PAGE_BG = "#ffffff";
const DEFAULT_BRAND = "#111827";
const DEFAULT_NAV_BG = "#ffffff";
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function safeHex(value, fallback) {
  return typeof value === "string" && HEX_COLOR.test(value.trim())
    ? value.trim()
    : fallback;
}

function hexToRgb(hex) {
  const normalized = safeHex(hex, null);
  if (!normalized) return null;
  const value = normalized.slice(1);
  return `${parseInt(value.slice(0, 2), 16)} ${parseInt(value.slice(2, 4), 16)} ${parseInt(value.slice(4, 6), 16)}`;
}

function toRgbTuple(hex) {
  const normalized = safeHex(hex, null);
  if (!normalized) return null;
  const value = normalized.slice(1);
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mix(hex, target, amount) {
  const sourceRgb = toRgbTuple(hex);
  const targetRgb = toRgbTuple(target);
  if (!sourceRgb || !targetRgb) return hex;
  const ratio = Math.max(0, Math.min(1, amount));
  return rgbToHex(sourceRgb.map((channel, index) => channel + (targetRgb[index] - channel) * ratio));
}

function getLuminance(hex) {
  const rgb = toRgbTuple(hex);
  if (!rgb) return 1;
  return rgb
    .map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    })
    .reduce((acc, channel, index) => acc + [0.2126, 0.7152, 0.0722][index] * channel, 0);
}

function contrastText(background) {
  return getLuminance(background) < 0.42 ? "#ffffff" : "#111827";
}

function resolveNavbarText(mode, background) {
  if (mode === "light") return "#ffffff";
  if (mode === "dark") return "#111827";
  return contrastText(background);
}

function setCssVariable(root, name, value) {
  if (value != null && value !== "") root.style.setProperty(name, value);
}

function applyFont(font) {
  if (!font || !ALLOWED_FONTS.has(font)) {
    document.body.style.fontFamily = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    return;
  }

  let link = document.getElementById("gf-dynamic");
  const href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@400;500;600;700;800&display=swap`;

  if (link) {
    link.href = href;
  } else {
    link = document.createElement("link");
    link.id = "gf-dynamic";
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  document.body.style.fontFamily = `'${font}', ui-sans-serif, system-ui, sans-serif`;
}

function applyFavicon(url) {
  if (!url) return;
  let favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }
  favicon.href = url;
}

function normalizeAppearance(runtime) {
  const primary = safeHex(runtime.brand.colors.primary, DEFAULT_BRAND);
  const secondary = safeHex(runtime.brand.colors.secondary, primary);
  const accent = safeHex(runtime.brand.colors.accent, primary);
  const pageBackground = safeHex(runtime.site.presentation.pageBackground, DEFAULT_PAGE_BG);
  const navbarBackground = safeHex(runtime.site.presentation.navbarBackground, DEFAULT_NAV_BG);

  return {
    business_name: runtime.identity.businessName || "",
    description: runtime.identity.description || "",
    tagline: runtime.brand.tagline || "",
    business_email: runtime.identity.contact.email || "",
    business_phone: runtime.identity.contact.phone || "",
    website: runtime.identity.contact.website || "",
    address: runtime.identity.location.address || "",
    city: runtime.identity.location.city || "",
    department: runtime.identity.location.department || "",
    country: runtime.identity.location.country || "",
    social_links: runtime.identity.socialLinks,
    logo_url: runtime.brand.assets.logoUrl || "",
    favicon_url: runtime.brand.assets.faviconUrl || "",
    primary_color: primary,
    secondary_color: secondary,
    accent_color: accent,
    store_navbar_bg: navbarBackground,
    store_navbar_text: runtime.site.presentation.navbarText || "auto",
    store_page_bg: pageBackground,
    store_font: ALLOWED_FONTS.has(runtime.site.presentation.fontFamily)
      ? runtime.site.presentation.fontFamily
      : null,
    currency: runtime.locale.currency || "COP",
  };
}

function applyGlobalStyles(appearance) {
  const root = document.documentElement;
  const brand = appearance.primary_color;
  const secondary = appearance.secondary_color;
  const accent = appearance.accent_color;
  const pageBg = appearance.store_page_bg;
  const navBg = appearance.store_navbar_bg;
  const pageIsDark = getLuminance(pageBg) < 0.24;
  const textPrimary = pageIsDark ? "#f8fafc" : "#111827";
  const textSecondary = pageIsDark ? "#cbd5e1" : "#4b5563";
  const textMuted = pageIsDark ? "#94a3b8" : "#6b7280";
  const surface = pageIsDark ? mix(pageBg, "#ffffff", 0.06) : mix(pageBg, "#000000", 0.025);
  const elevated = pageIsDark ? mix(pageBg, "#ffffff", 0.095) : mix(pageBg, "#000000", 0.045);
  const border = pageIsDark ? mix(pageBg, "#ffffff", 0.16) : mix(pageBg, "#000000", 0.12);
  const brandHover = getLuminance(brand) < 0.35 ? mix(brand, "#ffffff", 0.12) : mix(brand, "#000000", 0.12);

  setCssVariable(root, "--brand", brand);
  setCssVariable(root, "--brand-rgb", hexToRgb(brand));
  setCssVariable(root, "--brand-hover", brandHover);
  setCssVariable(root, "--store-brand", brand);
  setCssVariable(root, "--store-brand-contrast", contrastText(brand));
  setCssVariable(root, "--store-secondary", secondary);
  setCssVariable(root, "--store-accent", accent);
  setCssVariable(root, "--store-page-bg", pageBg);
  setCssVariable(root, "--store-text-primary", textPrimary);
  setCssVariable(root, "--store-text-secondary", textSecondary);
  setCssVariable(root, "--store-text-muted", textMuted);
  setCssVariable(root, "--store-surface", surface);
  setCssVariable(root, "--store-surface-elevated", elevated);
  setCssVariable(root, "--store-surface-hover", elevated);
  setCssVariable(root, "--store-border", border);
  setCssVariable(root, "--store-navbar-bg", navBg);
  setCssVariable(root, "--store-navbar-text", resolveNavbarText(appearance.store_navbar_text, navBg));

  root.dataset.storeTheme = pageIsDark ? "dark" : "light";
  root.style.colorScheme = pageIsDark ? "dark" : "light";
  document.body.style.backgroundColor = pageBg;
  document.body.style.color = textPrimary;

  applyFont(appearance.store_font);
  applyFavicon(appearance.favicon_url);
  if (appearance.business_name) document.title = appearance.business_name;
}

export function AppearanceProvider({ children }) {
  const { runtime, loading } = useSiteRuntime();
  const appearance = useMemo(() => normalizeAppearance(runtime), [runtime]);

  useEffect(() => {
    applyGlobalStyles(appearance);
  }, [appearance]);

  const value = useMemo(
    () => ({ appearance, loading, runtime }),
    [appearance, loading, runtime]
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance debe usarse dentro de AppearanceProvider");
  }
  return context;
}
