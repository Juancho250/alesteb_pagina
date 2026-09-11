# ALESTEB — Storefront Site Composition V1

Status: **implemented foundation / progressive cutover**  
Scope: `alesteb_pagina` runtime, routing and future section composition  
Migration strategy: expand-first, backward-compatible, reversible

## 1. Decision

`alesteb_pagina` evolves as one multi-tenant Storefront/Site runtime. A tenant must not require a fork, a tenant-specific React application or arbitrary tenant JavaScript/CSS/HTML to obtain its own identity.

The target composition is:

`Tenant identity -> Branding -> Storefront presentation -> Site manifest -> Registered sections -> Domain data`

ALESTEB owns the rendering platform and safe composition contracts. Business domains remain owners of their data.

## 2. Ownership boundary

The ownership boundary follows the current ALESTEB platform cutover:

| Concern | Owner | Storefront responsibility |
| --- | --- | --- |
| Business identity, legal/contact/location/social data | Tenant Profile | Read a public-safe projection only |
| Logo, tagline and visual palette | Branding | Consume the published visual projection; do not become authority |
| Store navigation, page presentation and composition | Storefront | Own presentation/configuration contracts |
| Products/categories | Catalog | Query Catalog contracts; never own Catalog tables |
| Inventory availability | Inventory | Query public availability contracts |
| Orders | Sales | Request actions through Sales contracts |
| Reviews | Reviews | Consume Reviews contracts |
| Discounts | Discounts | Consume authoritative discount contracts |

A Site Manifest is presentation/configuration. It must not grant permissions, capabilities or entitlements and must not duplicate source-domain business data.

## 3. Current public contract observed in backend

The current Storefront router executes `apiKeyAuth` and then `apiKeyTenantContext` before registering `/profile` and the other public contracts.

`GET /api/public/profile` currently reads `admin_profiles` using `req.apiKey.adminId`. It returns a compatibility projection containing:

- `business_name`, `tagline`, `description`;
- `logo_url`, `favicon_url`;
- `primary_color`, `secondary_color`, `accent_color`;
- business contact/location fields and `currency`;
- `social_links`;
- `store_navbar_bg`, `store_navbar_text`, `store_page_bg`, `store_font`.

This means the request already receives a resolved `req.tenantId` when the API-key tenant context can resolve it, but this particular profile handler still uses the legacy admin key physically. That is migration debt, not the target boundary. This frontend slice does not widen that debt and does not invent a second tenant identifier.

## 4. Site Runtime V1

`SiteRuntimeProvider` becomes the single bootstrap reader for the current public profile. `AppearanceProvider` is retained as a compatibility adapter so existing components keep the same `{ appearance, loading }` contract and the same CSS behavior.

Runtime V1 is intentionally conservative:

```text
SiteRuntimeV1
├── schemaVersion: 1
├── source: public-profile-compat
├── status: resolved | fallback
├── identity
│   ├── businessName / description
│   ├── contact
│   ├── location
│   └── socialLinks
├── brand
│   ├── tagline
│   ├── assets
│   └── colors
├── locale
│   └── currency
├── site
│   ├── presentation
│   └── manifest: null
└── compatibility
    └── publicProfile
```

`manifest` is deliberately `null` in V1. No unpublished backend contract is simulated in the client.

If bootstrap loading fails, the runtime enters a safe fallback state. Existing CSS/default presentation remains usable; a failed refresh does not overwrite an already resolved runtime.

## 5. Route Registry

React route declarations are moved out of `App.jsx` into `src/platform/routing/routeRegistry.jsx`.

The first cutover is behavior-preserving: the exact existing paths and page components remain registered. The registry is not yet capability-filtered because the public Storefront does not currently expose an authoritative published route/capability manifest for this purpose.

Future filtering must use backend-authoritative capabilities/entitlements. A route manifest may hide or omit UI, but it cannot authorize access to backend operations.

## 6. Section Registry

`src/platform/sections/sectionRegistry.js` establishes a closed registry boundary. V1 contains only `legacy.home` as a migration bridge.

The registry is intentionally closed:

- no arbitrary component names received from tenants;
- no runtime `eval` or dynamic code execution;
- no tenant-provided JavaScript;
- no arbitrary HTML injection;
- no unrestricted CSS payloads.

Future sections must be implemented in code, registered explicitly, versioned where necessary and constrained by stable schemas.

## 7. Brand system direction

The current public compatibility profile supports palette, logo/favicon, navbar colors, page background and a restricted storefront font. Existing font allow-list and light/dark surface derivation remain unchanged in this slice.

The target Brand System can expand to semantic design tokens, typography scales, geometry, density, button/card/navigation variants, media direction and motion preferences only through validated contracts and accessible guardrails. Those fields are not claimed as implemented by V1.

## 8. Site Manifest target contract

A future published Site Manifest should be a versioned Storefront-owned document that references only registered routes/sections and safe configuration. A conceptual shape is:

```text
schemaVersion
revisionId
site
routes[]
homepage.sections[]
seo
```

The exact persistence model, API, validation schema and entitlement behavior are **not implemented in this slice** and require backend/domain work before use.

## 9. Publishing lifecycle target

Target lifecycle:

`Draft -> Validate -> Preview -> Publish -> Observe -> Rollback`

A published revision must be immutable or otherwise reproducibly versioned so rollback can restore the previous effective site. This workflow is a target; V1 only creates the frontend runtime/registry seams needed to adopt it incrementally.

## 10. Disable behavior

Target disable behavior for Storefront/site composition:

- disabling a presentation capability must not delete tenant identity, Branding history, products, orders, reviews or other domain data;
- independent capabilities continue working when their dependencies permit it;
- re-enabling restores preserved configuration where commercially valid;
- backend remains authoritative for entitlement and authorization enforcement.

No destructive disable operation is added by this slice.

## 11. Security and tenancy

V1 does not accept tenant identity from URL query parameters, local storage or client-supplied manifest fields. Tenant selection remains bound to the existing API-key/backend request context.

Known debt: `/api/public/profile` is behind `apiKeyTenantContext`, but still queries `admin_profiles.user_id` with the API key's legacy `adminId`. Canonicalization should later change the backend read path to tenant-owned/tenant-resolved storage through an additive migration; the public frontend must not compensate by implementing its own tenant mapping.

## 12. Observability

Current state:

- API failures still pass through the existing Axios interceptor;
- SiteRuntime exposes bootstrap `error` state to consumers;
- no new telemetry endpoint or metric is introduced in V1.

Target Storefront observability should include tenant-safe bootstrap/publish/validation/revision metrics without logging customer payloads. This remains future work.

## 13. Migration and rollback

This slice is additive and has no database migration.

Forward migration:

1. bootstrap the compatibility public profile once in `SiteRuntimeProvider`;
2. let `AppearanceProvider` consume that runtime instead of issuing a second ownership-independent fetch;
3. route existing pages through `routeRegistry` without changing paths;
4. introduce the closed Section Registry boundary;
5. later add a real backend-published manifest through expand/migrate/contract phases.

Rollback:

1. restore the previous `App.jsx` direct route declarations;
2. restore `AppearanceProvider` direct `/profile` loading;
3. remove `src/platform/runtime`, `src/platform/routing` and `src/platform/sections` additions;
4. no schema, tenant data, product data, order data or Branding data rollback is required.

## 14. Certification status

The pure runtime mapping/extraction code has local smoke checks for the current `{ success, data }` profile envelope, null profile handling and visual mapping.

Full repository `npm run lint` and `npm run build` remain mandatory before production certification. They cannot be claimed from this environment unless the complete repository and dependencies are executable. GitHub Actions, if configured, remains the final repository-level gate.

## 15. Next slice

After this foundation is certified, the next logical slice is backend-first:

1. define the Storefront Site Manifest persistence/validation contract and ownership;
2. resolve published manifest by canonical tenant context;
3. expose only a public-safe published revision;
4. add revision/publish/rollback tests and cross-tenant isolation tests;
5. then migrate the current Home into registered sections incrementally rather than rewriting it at once.
