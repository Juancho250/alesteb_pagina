import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import BannerCarousel from "../components/BannerCarousel";
import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";
import { normalizeHomeSections } from "../platform/sections/sectionRegistry";
import { loadPublicJson, readPublicCache } from "../services/publicData";
import {
  extractBanners,
  extractCategories,
  extractProducts,
} from "../utils/apiResponse";

const getOptimizedImageUrl = (url, width = 600) => {
  if (!url) {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23F5F5F7'/%3E%3C/svg%3E";
  }
  if (url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_scale/`);
  }
  return url;
};

const TICKER_ITEMS = [
  "Catálogo conectado al inventario",
  "Disponibilidad validada en tiempo real",
  "Pago en línea con Wompi",
  "Historial de pedidos desde tu cuenta",
];

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M6 3v6M18 3v6M5 13h14v8H5z" />
      </svg>
    ),
    title: "Catálogo conectado",
    desc: "Productos, precios y variantes servidos por la tienda en tiempo real.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16v10H4z" /><path d="M8 11h8" />
      </svg>
    ),
    title: "Stock validado",
    desc: "La disponibilidad se comprueba antes de confirmar una compra.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" />
      </svg>
    ),
    title: "Pago con Wompi",
    desc: "El monto se calcula en el backend y el pago se procesa en Wompi.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Cuenta protegida",
    desc: "Acceso autenticado para checkout, perfil y seguimiento de pedidos.",
  },
];

function clamp(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function TickerStrip({ settings }) {
  const items = Array.isArray(settings?.items) && settings.items.length
    ? settings.items.slice(0, 4)
    : TICKER_ITEMS;

  return (
    <div className="border-y border-neutral-100 bg-white px-6 py-4">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
        {items.map((item) => (
          <span
            key={item}
            className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function FeaturesStrip({ settings }) {
  const configuredItems = Array.isArray(settings?.items) ? settings.items.slice(0, 4) : [];
  const items = FEATURES.map((fallback, index) => {
    const configured = configuredItems[index];
    if (!configured || typeof configured !== "object") return fallback;
    return {
      ...fallback,
      title: String(configured.title || fallback.title),
      desc: String(configured.description || fallback.desc),
    };
  });

  return (
    <section className="perf-section border-t border-neutral-100 px-6 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 md:grid-cols-4">
        {items.map((feature) => (
          <div key={feature.title} className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5f5f7] text-black">
              {feature.icon}
            </div>
            <div>
              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em]">
                {feature.title}
              </p>
              <p className="text-[11px] leading-relaxed text-neutral-500">
                {feature.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryCard({ category }) {
  const childCount = Array.isArray(category?.children) ? category.children.length : 0;

  return (
    <Link
      to={`/productos/categoria/${category.slug}`}
      className="group block rounded-[2rem] border border-neutral-200 bg-white p-7 transition-all duration-300 hover:border-neutral-900 hover:shadow-xl md:p-9"
    >
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">
        Categoría
      </p>
      <div className="flex items-end justify-between gap-6">
        <div>
          <h4 className="text-2xl font-black tracking-tight text-neutral-900 md:text-3xl">
            {category.name}
          </h4>
          {childCount > 0 ? (
            <p className="mt-2 text-xs text-neutral-400">
              {childCount} {childCount === 1 ? "subcategoría" : "subcategorías"}
            </p>
          ) : null}
        </div>
        <ArrowRight
          size={20}
          className="text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-black"
        />
      </div>
    </Link>
  );
}

function BannerSection({ banners, loading }) {
  if (banners.length > 0) {
    return (
      <section className="relative mx-auto h-[90vh] max-w-[1540px] overflow-hidden bg-[#f5f5f7] shadow-sm sm:h-[80vh] md:-mt-16 md:rounded-3xl">
        <BannerCarousel banners={banners} />
      </section>
    );
  }

  if (!loading) return null;

  return (
    <section
      className="relative mx-auto h-[90vh] max-w-[1540px] animate-pulse overflow-hidden bg-[#f5f5f7] shadow-sm sm:h-[80vh] md:-mt-16 md:rounded-3xl"
      aria-label="Cargando contenido principal"
    />
  );
}

function HeroCopySection({ runtime, settings }) {
  const configuredTitle = String(settings?.title || "").trim();
  const title = configuredTitle || runtime.brand.tagline;
  const ctaLabel = String(settings?.ctaLabel || "Ver colección").trim() || "Ver colección";
  const ctaLink = String(settings?.ctaLink || "/productos").trim() || "/productos";

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 text-center md:py-20">
      <h2 className="mb-8 whitespace-pre-line text-5xl font-black leading-[0.9] tracking-tighter sm:text-7xl md:text-8xl">
        {title || (
          <>
            Explora <br />
            <span className="italic text-neutral-400">la colección.</span>
          </>
        )}
      </h2>
      <Link
        to={ctaLink}
        className="inline-block rounded-full bg-brand px-10 py-4 text-sm font-bold text-white transition-all hover:scale-105 hover:bg-[var(--brand-hover)] hover:shadow-xl"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}

function ProductCollectionSection({ products, loading, settings }) {
  const limit = clamp(settings?.limit, 2, 12, 4);
  const title = String(settings?.title || "Lo último").trim() || "Lo último";
  const visibleProducts = products.slice(0, limit);

  return (
    <section className="perf-section bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col items-end justify-between gap-4 sm:flex-row">
          <div className="space-y-1">
            <div className="mb-3 h-1 w-10 rounded-full bg-black" />
            <h3 className="text-3xl font-black uppercase italic tracking-tighter md:text-4xl">
              {title}
            </h3>
          </div>
          <Link
            to="/productos"
            className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black"
          >
            Explorar
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-8 lg:grid-cols-4">
          {visibleProducts.length === 0 && loading
            ? Array.from({ length: Math.min(limit, 8) }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="mb-5 aspect-[4/5] rounded-[1.5rem] bg-[#f5f5f7] md:rounded-[2rem]" />
                  <div className="mb-2 h-2.5 w-2/3 rounded-full bg-neutral-100" />
                  <div className="h-5 w-1/2 rounded-full bg-neutral-100" />
                </div>
              ))
            : visibleProducts.map((product) => {
                const price = Number(product.final_price || product.price);
                return (
                  <Link
                    key={product.id}
                    to={`/productos/detalle/${product.id}`}
                    className="group block cursor-pointer"
                  >
                    <div>
                      <div className="relative mb-5 aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#f5f5f7] md:rounded-[2rem]">
                        <img
                          src={getOptimizedImageUrl(product.main_image)}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="truncate text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500 md:text-[10px]">
                          {product.name}
                        </h4>
                        <p className="text-lg font-black tracking-tight text-neutral-900 md:text-xl">
                          ${Number.isFinite(price) ? price.toLocaleString() : "0"}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}

function CategoryGridSection({ categories, settings }) {
  const limit = clamp(settings?.limit, 3, 12, 6);
  const title = String(settings?.title || "Categorías").trim() || "Categorías";

  if (!categories.length) return null;

  return (
    <section className="perf-section border-t border-neutral-100 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h3 className="mb-12 text-center text-3xl font-black uppercase tracking-tighter md:text-4xl">
          {title}
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {categories.slice(0, limit).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { runtime } = useSiteRuntime();
  const homeSections = useMemo(
    () => normalizeHomeSections(runtime.site.manifest),
    [runtime.site.manifest],
  );

  const productLimit = useMemo(() => {
    const section = homeSections.find(
      (item) => item.enabled && item.type === "product.collection"
    );
    return clamp(section?.settings?.limit, 2, 12, 4);
  }, [homeSections]);

  const productCacheKey = `home-products-${productLimit}`;

  const [banners, setBanners] = useState(
    () => extractBanners(readPublicCache("banners", 6 * 60 * 60 * 1000) || {})
      .filter((banner) => banner.is_active)
  );
  const [featuredProducts, setFeaturedProducts] = useState(
    () => extractProducts(
      readPublicCache(productCacheKey, 10 * 60 * 1000)
      || readPublicCache("home-products", 10 * 60 * 1000)
      || {}
    )
  );
  const [categories, setCategories] = useState(
    () => extractCategories(readPublicCache("categories", 6 * 60 * 60 * 1000) || {})
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [bannersPayload, productsPayload, categoriesPayload] = await Promise.all([
          loadPublicJson("/banners", "banners"),
          loadPublicJson(`/products?limit=${productLimit}`, productCacheKey),
          loadPublicJson("/categories", "categories"),
        ]);
        if (!active) return;

        const bannersData = extractBanners(bannersPayload);
        setBanners(
          Array.isArray(bannersData)
            ? bannersData.filter((banner) => banner.is_active)
            : []
        );

        const productsData = extractProducts(productsPayload);
        setFeaturedProducts(Array.isArray(productsData) ? productsData : []);

        const categoriesData = extractCategories(categoriesPayload);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setLoadError(false);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadHomeData();
    return () => {
      active = false;
    };
  }, [productCacheKey, productLimit]);

  const renderSection = (section) => {
    if (!section.enabled) return null;

    switch (section.type) {
      case "hero.banner":
        return <BannerSection key={section.id} banners={banners} loading={loading} />;
      case "trust.strip":
        return <TickerStrip key={section.id} settings={section.settings} />;
      case "hero.copy":
        return <HeroCopySection key={section.id} runtime={runtime} settings={section.settings} />;
      case "product.collection":
        return (
          <ProductCollectionSection
            key={section.id}
            products={featuredProducts}
            loading={loading}
            settings={section.settings}
          />
        );
      case "feature.strip":
        return <FeaturesStrip key={section.id} settings={section.settings} />;
      case "category.grid":
        return (
          <CategoryGridSection
            key={section.id}
            categories={categories}
            settings={section.settings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--store-page-bg,#ffffff)] font-sans text-black antialiased selection:bg-neutral-200">
      <main className="pt-20 md:pt-24">
        {loadError && banners.length === 0 && featuredProducts.length === 0 && categories.length === 0 ? (
          <div className="mx-auto max-w-6xl px-6 py-3 text-center text-[11px] font-semibold text-neutral-400">
            No pudimos actualizar los datos. Reintentaremos automáticamente al volver.
          </div>
        ) : null}

        {homeSections.map(renderSection)}
      </main>
    </div>
  );
}
