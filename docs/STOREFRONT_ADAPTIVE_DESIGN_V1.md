# ALESTEB Storefront — Adaptive Design v1

## Objetivo

Convertir `alesteb_pagina` en un storefront multi-tenant que se vea profesional, minimalista y coherente sin mantener una implementación React distinta por negocio.

La página pública no define la identidad del negocio. La consume.

## Cadena de autoridad

1. Tenant e identidad: backend.
2. Branding: backend / panel admin.
3. Presentación del storefront: backend / panel admin.
4. `SiteRuntimeV1`: adaptación pública y estable para el frontend.
5. Design tokens semánticos: derivados localmente desde `SiteRuntimeV1`.
6. Componentes y secciones registradas: consumen tokens, nunca colores tenant hardcodeados.
7. Site Manifest: composición futura, cerrada y versionada.

Los datos de catálogo, inventario, ventas, descuentos, pagos y permisos siguen perteneciendo a sus dominios. El sistema visual no puede redefinirlos.

## Design Runtime

`AppearanceProvider` funciona como adaptador de compatibilidad para los componentes existentes, pero su fuente ya no es el payload crudo de `/profile`. Su fuente es `SiteRuntimeV1`.

El runtime normaliza:

- nombre, descripción y tagline;
- logo y favicon;
- color primario, secundario y de acento;
- fondo del sitio;
- fondo y contraste del navbar;
- tipografía allowlist;
- moneda;
- contacto, ubicación y redes.

A partir de ello se generan tokens semánticos:

- `--store-brand` y `--store-brand-contrast`;
- `--store-secondary`;
- `--store-accent`;
- `--store-page-bg`;
- `--store-surface`, `--store-surface-elevated`, `--store-surface-hover`;
- `--store-border`;
- `--store-text-primary`, `--store-text-secondary`, `--store-text-muted`;
- `--store-navbar-bg`, `--store-navbar-text`.

Los colores recibidos deben ser valores hexadecimales válidos. No se acepta CSS arbitrario desde el panel. La tipografía también se limita a una lista conocida.

## Reglas visuales

- El layout responde al contenido y al viewport; no existe una versión por tenant.
- El color de marca se usa para identidad y acciones principales, no para pintar cada superficie.
- El contraste de texto se deriva del fondo cuando el admin no lo define explícitamente.
- El modo oscuro no es un segundo tema manual: se deriva de la luminancia del fondo configurado.
- Radios, espaciado, ancho de contenido y jerarquía tipográfica permanecen controlados por la plataforma para mantener calidad entre tenants.
- Las animaciones son breves y respetan `prefers-reduced-motion`.

## Home v1

El Home deja de incluir testimonios, garantías, promociones, colecciones o redes inventadas por el frontend.

Solo renderiza información soportada por autoridades existentes:

- banners publicados;
- identidad y descripción del tenant;
- categorías reales;
- productos reales;
- información de contacto publicada.

Si un dato no existe, la sección correspondiente se omite o usa un fallback neutro. No se fabrican claims comerciales.

## Escalabilidad

El siguiente nivel no consiste en añadir `if (tenant === ...)`.

La evolución prevista es:

- `Storefront Presentation` para preferencias visuales cerradas;
- `Site Manifest` inmutable y versionado para ordenar secciones registradas;
- registro de secciones permitido por plataforma;
- configuración tipada por sección;
- publicación/rollback de revisiones;
- render público de la revisión vigente.

El manifest no podrá incluir JavaScript, CSS o HTML arbitrario, permisos, capacidades, precios ni lógica de negocio.

## Pendiente después de esta base

1. Adaptar Navbar y mega menú a los tokens semánticos sin perder búsqueda, categorías, cuenta y carrito.
2. Adaptar catálogo, detalle, carrito, checkout, auth, perfil, soporte y páginas legales al mismo sistema visual.
3. Resolver tenant/API key publicable del proyecto Vercel y repetir smoke real.
4. Diseñar Storefront Presentation backend para `favicon_url`, navbar, page background y font como autoridad tenant-native.
5. Implementar Site Manifest cuando la autoridad de presentación esté estable.
6. Code splitting adicional del storefront, incluyendo `ProofUploader`.

## No incluido en v1

- cambios de pricing o checkout autoritativo;
- cambios de permisos;
- migraciones de base de datos;
- Site Manifest;
- CSS/JS/HTML suministrado por tenants;
- merge a `main` o despliegue de producción.
