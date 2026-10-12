import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createSiteRuntime } from "../src/platform/runtime/siteRuntime.js";
import { normalizeHomeSections, getSectionDefinition } from "../src/platform/sections/sectionRegistry.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("published site style is isolated from brand and included in runtime", () => {
  const style = {
    surfaceColor: "#15171A",
    footerColor: "#141619",
    buttonShape: "square",
    cardShape: "soft",
    sectionSpacing: "compact",
  };
  const runtime = createSiteRuntime(
    { business_name: "Test Store", primary_color: "#D19D01" },
    { schemaVersion: 1, style, home: { sections: [{ id: "promo", type: "promotion.banner", enabled: true, settings: { title: "Test" } }] } }
  );
  assert.equal(runtime.brand.colors.primary, "#D19D01");
  assert.deepEqual(runtime.site.manifest.style, style);
  assert.equal(normalizeHomeSections(runtime.site.manifest)[0].type, "promotion.banner");
  assert.equal(getSectionDefinition("custom.javascript"), null);
  assert.ok(getSectionDefinition("promotion.banner"));
});

test("legacy storefront keeps its section defaults", () => {
  const runtime = createSiteRuntime({ business_name: "Existing" });
  assert.equal(runtime.site.manifest, null);
  assert.equal(normalizeHomeSections(null).length, 6);
});

test("public storefront renders only scoped style tokens and registered sections", () => {
  const appearance = read("src/context/AppearanceContext.jsx");
  const home = read("src/pages/Home.jsx");
  const footer = read("src/components/Footer.jsx");
  assert.match(appearance, /--store-surface-bg/);
  assert.match(appearance, /--store-footer-bg/);
  assert.match(appearance, /getLuminance\(surface\)/);
  assert.match(home, /PromotionBannerSection/);
  assert.match(home, /EditorialStorySection/);
  assert.match(home, /FaqSection/);
  assert.match(appearance, /--store-content-width/);
  assert.match(appearance, /--store-product-aspect/);
  assert.match(appearance, /--brand-secondary/);
  assert.match(appearance, /--brand-accent/);

  assert.match(home, /--store-section-spacing|store-site-section/);
  assert.match(footer, /--store-footer-text/);
  assert.match(footer, /showStoreLinks/);
  const navbar = read("src/components/Navbar.jsx");
  assert.match(navbar, /navigation\.showCategories/);
  assert.match(navbar, /navigation\.showSupport/);
  assert.match(navbar, /navigation\.showSearch/);
  assert.match(navbar, /aria-label=\{\x60Carrito/);

  assert.match(footer, /showSupportLinks/);
  assert.match(footer, /showCountry/);
  const runtimeContext = read("src/platform/runtime/SiteRuntimeContext.jsx");
  assert.match(runtimeContext, /applySiteDocumentMetadata/);
  assert.match(runtimeContext, /safePublicImageUrl/);
  const html = read("index.html");
  assert.doesNotMatch(html, /<link rel="canonical" href="https:\/\/alesteb\.vercel\.app/);
  assert.doesNotMatch(html, /<title>Alesteb/);

});

test("password change uses the authenticated identity contract without exposing secrets in console", () => {
  const profile = read("src/pages/ProfilePage.jsx");
  const auth = read("src/pages/Auth.jsx");
  assert.match(profile, /api\.post\("\/auth\/change-password",\s*\{/);
  assert.match(profile, /currentPassword: form\.current/);
  assert.match(profile, /newPassword: form\.next/);
  assert.match(profile, /confirmPassword: form\.confirm/);
  assert.doesNotMatch(profile, /current_password: form\.current|new_password:\s*form\.next/);
  assert.match(profile, /<motion\.form/);
  assert.match(profile, /onSubmit=\{handleSubmit\}/);
  assert.match(profile, /autoComplete: "current-password"/);
  assert.match(profile, /autoComplete: "new-password"/);
  assert.match(profile, /type="submit"/);
  assert.match(profile, /clearStoredSession\(\)/);
  assert.match(profile, /window\.location\.replace\("\/auth\?passwordUpdated=1"\)/);
  assert.match(profile, /INVALID_CURRENT_PASSWORD/);
  assert.match(profile, /PASSWORD_REUSE/);
  assert.match(auth, /Contraseña actualizada\. Inicia sesión con tu nueva contraseña/);
  assert.doesNotMatch(auth, /console\.error\(error\)/);
});
