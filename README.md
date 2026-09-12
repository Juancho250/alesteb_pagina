# ALESTEB Storefront

Storefront público multi-tenant de ALESTEB. Este repositorio renderiza la experiencia de tienda de cada tenant consumiendo contratos públicos del backend; no es la fuente de autoridad de catálogo, inventario, ventas, descuentos, permisos ni pagos.

## Stack

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Framer Motion
- Lenis

## Arquitectura

La dirección actual es una migración progresiva hacia un único runtime multi-tenant:

`Tenant identity -> Branding -> Storefront presentation -> Site manifest -> Registered sections -> Domain data`

La base V1 ya incluye:

- `SiteRuntimeProvider` como bootstrap único del perfil público;
- `AppearanceProvider` como adaptador de compatibilidad;
- registro central de rutas en `src/platform/routing`;
- registro cerrado de secciones en `src/platform/sections`;
- `manifest: null` hasta que exista un contrato backend publicado y versionado.

La especificación está en `docs/ALESTEB_STOREFRONT_SITE_COMPOSITION_V1.md`.

## Entorno

Copia `.env.example` a un archivo local no versionado y configura:

```bash
VITE_API_BASE_URL=https://alesteb-back-1.onrender.com/public-api/v1
VITE_API_KEY=ak_<prefix>_<secret>
```

### Seguridad de `VITE_API_KEY`

Las variables `VITE_*` se incorporan al bundle del navegador. Por diseño, `VITE_API_KEY` debe tratarse como una credencial publicable del Storefront, nunca como una credencial administrativa o privada.

El backend debe restringirla al mínimo conjunto de permisos necesario y a los orígenes exactos autorizados. La autorización real siempre pertenece al backend.

## Desarrollo

```bash
npm ci
npm run dev
```

Validación obligatoria antes de integrar:

```bash
npm run lint
npm run build
```

## Flujo de integración

Los cambios se trabajan en ramas y se integran mediante PR. `main` debe permanecer como línea estable. El CI del Storefront ejecuta instalación limpia, lint y build antes de considerar una rama certificada.

## Límites de responsabilidad

- Tenant Profile: identidad, contacto, ubicación y datos públicos del negocio.
- Branding: logo, tagline y sistema visual publicado.
- Storefront: navegación, presentación y composición del sitio.
- Catalog: productos y categorías.
- Inventory: disponibilidad y reservas.
- Sales: pedidos y totales autoritativos.
- Reviews: reseñas.
- Discounts: reglas y descuentos autoritativos.

El frontend puede calcular estados de presentación, pero no debe convertirse en autoridad de permisos, precios, descuentos, inventario ni pagos.
