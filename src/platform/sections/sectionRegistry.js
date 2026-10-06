const definitions = Object.freeze({
  "hero.banner": Object.freeze({
    key: "hero.banner",
    ownerDomain: "storefront",
    status: "registered",
    description: "Banner principal administrado desde ALESTEB.",
  }),
  "trust.strip": Object.freeze({
    key: "trust.strip",
    ownerDomain: "storefront",
    status: "registered",
    description: "Franja compacta de mensajes de confianza.",
  }),
  "hero.copy": Object.freeze({
    key: "hero.copy",
    ownerDomain: "storefront",
    status: "registered",
    description: "Mensaje editorial y CTA de la página de inicio.",
  }),
  "product.collection": Object.freeze({
    key: "product.collection",
    ownerDomain: "catalog",
    status: "registered",
    description: "Colección de productos servida por Catálogo.",
  }),
  "feature.strip": Object.freeze({
    key: "feature.strip",
    ownerDomain: "storefront",
    status: "registered",
    description: "Bloque de beneficios del storefront.",
  }),
  "category.grid": Object.freeze({
    key: "category.grid",
    ownerDomain: "catalog",
    status: "registered",
    description: "Accesos a categorías del catálogo.",
  }),
  "legacy.home": Object.freeze({
    key: "legacy.home",
    ownerDomain: "storefront",
    status: "legacy-bridge",
    description: "Puente de compatibilidad para la Home anterior.",
  }),
});

export const DEFAULT_HOME_SECTIONS = Object.freeze([
  Object.freeze({ id: "hero-banner", type: "hero.banner", enabled: true, settings: Object.freeze({}) }),
  Object.freeze({ id: "trust-strip", type: "trust.strip", enabled: true, settings: Object.freeze({}) }),
  Object.freeze({
    id: "hero-copy",
    type: "hero.copy",
    enabled: true,
    settings: Object.freeze({
      title: "",
      ctaLabel: "Ver colección",
      ctaLink: "/productos",
    }),
  }),
  Object.freeze({
    id: "product-collection",
    type: "product.collection",
    enabled: true,
    settings: Object.freeze({
      title: "Lo último",
      source: "latest",
      limit: 4,
    }),
  }),
  Object.freeze({ id: "feature-strip", type: "feature.strip", enabled: true, settings: Object.freeze({}) }),
  Object.freeze({
    id: "category-grid",
    type: "category.grid",
    enabled: true,
    settings: Object.freeze({
      title: "Categorías",
      limit: 6,
    }),
  }),
]);

export function getSectionDefinition(sectionKey) {
  return definitions[sectionKey] ?? null;
}

export function hasSectionDefinition(sectionKey) {
  return Object.prototype.hasOwnProperty.call(definitions, sectionKey);
}

export function listSectionDefinitions() {
  return Object.values(definitions);
}

export function normalizeHomeSections(manifest) {
  const sections = Array.isArray(manifest?.home?.sections)
    ? manifest.home.sections
    : DEFAULT_HOME_SECTIONS;

  const seen = new Set();
  const normalized = [];

  for (const section of sections) {
    if (!section || !hasSectionDefinition(section.type)) continue;
    const id = String(section.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    normalized.push({
      id,
      type: section.type,
      enabled: section.enabled !== false,
      settings: section.settings && typeof section.settings === "object"
        ? section.settings
        : {},
    });
  }

  return normalized.length
    ? normalized
    : DEFAULT_HOME_SECTIONS.map((section) => ({
        ...section,
        settings: { ...section.settings },
      }));
}
