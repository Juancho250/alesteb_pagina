// Private, ephemeral presentation-only preview. Never persists or publishes.
export const PREVIEW_READY = "ALESTEB_SITE_PREVIEW_READY_V1";
export const PREVIEW_APPLY = "ALESTEB_SITE_PREVIEW_APPLY_V1";

const SECTION_TYPES = new Set([
  "hero.banner", "trust.strip", "hero.copy", "product.collection",
  "feature.strip", "category.grid", "promotion.banner", "editorial.story",
  "faq.accordion",
]);

const DEFAULT_STYLES = Object.freeze({
  surfaceColor: "#FFFFFF", footerColor: "#F5F5F7", buttonShape: "pill",
  cardShape: "round", sectionSpacing: "balanced", contentWidth: "balanced",
  headerTreatment: "flat", productImageRatio: "portrait", catalogColumns: "4",
});

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value, limit, fallback = "") => typeof value === "string" ? value.slice(0, limit) : fallback;
const choice = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
const bool = (value) => value !== false;
const color = (value, fallback) => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
const link = (value, fallback = "/productos") => {
  const v = text(value, 200);
  return v.startsWith("/") && !v.startsWith("//") && !/[\u0000-\u001f\\]/.test(v) ? v : fallback;
};

function sectionSettings(type, raw) {
  const s = isRecord(raw) ? raw : {};
  switch (type) {
    case "trust.strip":
      return { items: (Array.isArray(s.items) ? s.items : []).slice(0, 4).map(v => text(v, 80)) };
    case "hero.copy":
      return { title: text(s.title, 120), ctaLabel: text(s.ctaLabel, 40), ctaLink: link(s.ctaLink) };
    case "product.collection":
      return { title: text(s.title, 60), source: "latest", limit: Math.min(12, Math.max(2, Number(s.limit) || 4)) };
    case "feature.strip":
      return { items: (Array.isArray(s.items) ? s.items : []).slice(0, 4).map(v => ({
        title: text(v?.title, 48), description: text(v?.description, 160),
      })) };
    case "category.grid":
      return { title: text(s.title, 60), limit: Math.min(12, Math.max(3, Number(s.limit) || 6)) };
    case "promotion.banner":
      return { eyebrow: text(s.eyebrow, 40), title: text(s.title, 100),
        description: text(s.description, 220), ctaLabel: text(s.ctaLabel, 40),
        ctaLink: link(s.ctaLink), tone: choice(s.tone, ["neutral","brand","secondary","accent","dark"], "neutral") };
    case "editorial.story":
      return { eyebrow: text(s.eyebrow, 42), title: text(s.title, 120), body: text(s.body, 650),
        ctaLabel: text(s.ctaLabel, 40), ctaLink: link(s.ctaLink, "/contact"),
        alignment: choice(s.alignment, ["left","center"], "left") };
    case "faq.accordion":
      return { title: text(s.title, 90), items: (Array.isArray(s.items) ? s.items : []).slice(0, 6)
        .map(item => ({ question: text(item?.question, 120), answer: text(item?.answer, 360) })) };
    default:
      return {};
  }
}

export function normalizeLivePreviewManifest(input) {
  if (!isRecord(input) || input.schemaVersion !== 1 || !Array.isArray(input.home?.sections)) return null;
  const rawStyle = isRecord(input.style) ? input.style : {};
  const style = {
    surfaceColor: color(rawStyle.surfaceColor, DEFAULT_STYLES.surfaceColor),
    footerColor: color(rawStyle.footerColor, DEFAULT_STYLES.footerColor),
    buttonShape: choice(rawStyle.buttonShape, ["pill", "soft", "square"], "pill"),
    cardShape: choice(rawStyle.cardShape, ["round", "soft", "square"], "round"),
    sectionSpacing: choice(rawStyle.sectionSpacing, ["compact", "balanced", "spacious"], "balanced"),
    contentWidth: choice(rawStyle.contentWidth, ["balanced", "wide"], "balanced"),
    headerTreatment: choice(rawStyle.headerTreatment, ["flat", "elevated"], "flat"),
    productImageRatio: choice(rawStyle.productImageRatio, ["portrait", "square"], "portrait"),
    catalogColumns: choice(rawStyle.catalogColumns, ["3", "4", "5"], "4"),
  };
  const seen = new Set();
  const sections = input.home.sections.slice(0, 12).filter(s => {
    if (!isRecord(s) || !SECTION_TYPES.has(s.type) || typeof s.id !== "string") return false;
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(s.id) || seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  }).map(s => ({
    id: s.id, type: s.type, enabled: bool(s.enabled),
    settings: sectionSettings(s.type, s.settings),
  }));
  const nav = isRecord(input.navigation) ? input.navigation : {};
  const foot = isRecord(input.footer) ? input.footer : {};
  const seo = isRecord(input.seo) ? input.seo : {};
  return {
    schemaVersion: 1,
    style,
    seo: { title: text(seo.title, 70), description: text(seo.description, 160) },
    navigation: {
      showCategories: bool(nav.showCategories), showSupport: bool(nav.showSupport),
      showSearch: bool(nav.showSearch), catalogLabel: text(nav.catalogLabel, 24, "Tienda"),
      categoriesLabel: text(nav.categoriesLabel, 24, "Categorías"),
      supportLabel: text(nav.supportLabel, 24, "Soporte"),
    },
    footer: Object.fromEntries(["showDescription","showStoreLinks","showSupportLinks","showSocialLinks","showCountry"]
      .map(k => [k, bool(foot[k])])),
    home: { sections },
  };
}

export function isTrustedPreviewEditorOrigin(origin) {
  const extras = String(import.meta.env.VITE_ADMIN_PREVIEW_ORIGINS || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  const origins = ["https://admin.alesteb.com", "http://localhost:5173",
    "http://localhost:5174", "http://localhost:5175", ...extras];
  return origins.some(value => {
    try {
      const url = new URL(value);
      return url.origin === origin &&
        (url.protocol === "https:" || (url.protocol === "http:" && ["localhost","127.0.0.1"].includes(url.hostname)));
    } catch { return false; }
  });
}
