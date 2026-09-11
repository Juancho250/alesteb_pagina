const definitions = Object.freeze({
  "legacy.home": Object.freeze({
    key: "legacy.home",
    ownerDomain: "storefront",
    status: "legacy-bridge",
    description: "Puente de compatibilidad para la Home actual durante la migración progresiva.",
  }),
});

export function getSectionDefinition(sectionKey) {
  return definitions[sectionKey] ?? null;
}

export function hasSectionDefinition(sectionKey) {
  return Object.prototype.hasOwnProperty.call(definitions, sectionKey);
}

export function listSectionDefinitions() {
  return Object.values(definitions);
}
