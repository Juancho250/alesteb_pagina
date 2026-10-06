import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadPublicJson, readPublicCache } from "../services/publicData";
import BannerCarousel from "../components/BannerCarousel";
import { ArrowRight } from "lucide-react";
import { extractBanners, extractCategories, extractProducts } from "../utils/apiResponse";

import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";
const getOptimizedImageUrl = (url, width = 600) => {
  if (!url) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23F5F5F7'/%3E%3C/svg%3E";
  if (url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_scale/`);
  }
  return url;
};

// ─── Mensajes respaldados por capacidades reales del storefront ────────────
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
        <path d="M3 6h18M6 3v6M18 3v6M5 13h14v8H5z"/>
      </svg>
    ),
    title: "Catálogo conectado",
    desc: "Productos, precios y variantes servidos por la tienda en tiempo real.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16v10H4z"/><path d="M8 11h8"/>
      </svg>
    ),
    title: "Stock validado",
    desc: "La disponibilidad se comprueba antes de confirmar una compra.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>
      </svg>
    ),
    title: "Pago con Wompi",
    desc: "El monto se calcula en el backend y el pago se procesa en Wompi.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "Cuenta protegida",
    desc: "Acceso autenticado para checkout, perfil y seguimiento de pedidos.",
  },
];

// ─── Componentes auxiliares ───────────────────────────────────────
function TickerStrip() {
  return (
    <div className="border-y border-neutral-100 bg-white px-6 py-4">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
        {TICKER_ITEMS.map((item) => (
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

function FeaturesStrip() {
  return (
    <section className="py-16 px-6 border-t border-neutral-100 perf-section">
      <div
        className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10"
      >
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center gap-4"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-black">
              {f.icon}
            </div>
            <div>
              <p className="font-black text-[11px] uppercase tracking-[0.18em] mb-1">
                {f.title}
              </p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">{f.desc}</p>
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
    <div
    >
      <Link
        to={`/productos/categoria/${category.slug}`}
        className="group block rounded-[2rem] border border-neutral-200 bg-white p-7 md:p-9
          hover:border-neutral-900 hover:shadow-xl transition-all duration-300"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400 mb-3">
          Categoría
        </p>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h4 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900">
              {category.name}
            </h4>
            {childCount > 0 && (
              <p className="text-xs text-neutral-400 mt-2">
                {childCount} {childCount === 1 ? "subcategoría" : "subcategorías"}
              </p>
            )}
          </div>
          <ArrowRight
            size={20}
            className="text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-black"
          />
        </div>
      </Link>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────
export default function Home() {
  const { runtime } = useSiteRuntime();
  const [banners, setBanners] = useState(
    () => extractBanners(readPublicCache("banners", 6 * 60 * 60 * 1000) || {})
      .filter((b) => b.is_active)
  );
  const [featuredProducts, setFeaturedProducts] = useState(
    () => extractProducts(readPublicCache("home-products", 10 * 60 * 1000) || {})
  );
  const [categories, setCategories] = useState(
    () => extractCategories(readPublicCache("categories", 6 * 60 * 60 * 1000) || {})
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [bannersPayload, productsPayload, categoriesPayload] = await Promise.all([
          loadPublicJson("/banners", "banners"),
          loadPublicJson("/products?limit=4", "home-products"),
          loadPublicJson("/categories", "categories"),
        ]);

        const bannersData = extractBanners(bannersPayload);
        setBanners(
          Array.isArray(bannersData) ? bannersData.filter((b) => b.is_active) : []
        );

        const productsData = extractProducts(productsPayload);
        setFeaturedProducts(Array.isArray(productsData) ? productsData : []);

        const categoriesData = extractCategories(categoriesPayload);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setLoadError(false);
      } catch (err) {
        console.error("Error loading home data", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
      <div className="min-h-screen text-black font-sans antialiased selection:bg-neutral-200 bg-[var(--store-page-bg,#ffffff)]">
        <main className="pt-20 md:pt-24">

          {/* ── BANNER CAROUSEL ── */}
          {banners.length > 0 ? (
            <section
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-[1540px] mx-auto h-[90vh] sm:h-[80vh] bg-[#f5f5f7] overflow-hidden relative md:rounded-3xl shadow-sm md:-mt-16"
            >
              <BannerCarousel banners={banners} />
            </section>
          ) : loading ? (
            <section
              className="max-w-[1540px] mx-auto h-[90vh] sm:h-[80vh] bg-[#f5f5f7] overflow-hidden relative md:rounded-3xl shadow-sm md:-mt-16 animate-pulse"
              aria-label="Cargando contenido principal"
            />
          ) : null}

          {loadError && banners.length === 0 && featuredProducts.length === 0 && categories.length === 0 && (
            <div className="mx-auto max-w-6xl px-6 py-3 text-center text-[11px] font-semibold text-neutral-400">
              No pudimos actualizar los datos. Reintentaremos automáticamente al volver.
            </div>
          )}

          {/* ── TICKER ── */}
          <TickerStrip />

          {/* ── HERO TEXT ── */}
          <section className="text-center py-10 md:py-20 px-6 max-w-5xl mx-auto">
            <div
            >
              <h2
                className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
              >
                {runtime.brand.tagline ? (
                  runtime.brand.tagline
                ) : (
                  <>
                    Explora <br />
                    <span className="text-neutral-400 italic">la colección.</span>
                  </>
                )}
              </h2>

              <div>
                <Link
                  to="/productos"
                  className="inline-block px-10 py-4 bg-brand text-white font-bold rounded-full text-sm transition-all hover:scale-105 hover:bg-[var(--brand-hover)] hover:shadow-xl"
                >
                  Ver colección
                </Link>
              </div>
            </div>
          </section>

          {/* ── PRODUCTOS ── */}
          <section className="py-20 px-6 bg-white perf-section">
            <div className="max-w-6xl mx-auto">
              <div
                className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-12"
              >
                <div className="space-y-1">
                  <div className="h-1 w-10 bg-black rounded-full mb-3" />
                  <h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">
                    Lo último
                  </h3>
                </div>
                <Link
                  to="/productos"
                  className="group text-black font-bold flex items-center gap-2 text-xs tracking-widest uppercase"
                >
                  Explorar{" "}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>

              <div
                className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-8"
              >
                {featuredProducts.length === 0 && loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="aspect-[4/5] bg-[#f5f5f7] rounded-[1.5rem] md:rounded-[2rem] mb-5" />
                        <div className="h-2.5 w-2/3 rounded-full bg-neutral-100 mb-2" />
                        <div className="h-5 w-1/2 rounded-full bg-neutral-100" />
                      </div>
                    ))
                  : featuredProducts.map((p) => {
                  const price = Number(p.final_price || p.price);
                  return (
                    <Link
                      key={p.id}
                      to={`/productos/detalle/${p.id}`}
                      className="group block cursor-pointer"
                    >
                      <div>
                        <div className="aspect-[4/5] bg-[#f5f5f7] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden mb-5 relative">
                          <img
                            src={getOptimizedImageUrl(p.main_image)}
                            alt={p.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-neutral-500 truncate">
                            {p.name}
                          </h4>
                          <p className="font-black text-lg md:text-xl tracking-tight text-neutral-900">
                            ${price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── PROPUESTAS DE VALOR ── */}
          <FeaturesStrip />

          {/* ── CATEGORÍAS DEL BACKEND ── */}
          {categories.length > 0 && (
            <section className="py-20 px-6 border-t border-neutral-100 perf-section">
              <div className="max-w-6xl mx-auto">
                <h3
                  className="text-center text-3xl md:text-4xl font-black mb-12 uppercase tracking-tighter"
                >
                  Categorías
                </h3>

                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                  {categories.slice(0, 6).map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              </div>
            </section>
          )}

        </main>
      </div>
  );
}