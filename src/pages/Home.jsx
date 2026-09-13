import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, MapPin, Phone, ShoppingBag } from "lucide-react";
import api from "../services/api";
import BannerCarousel from "../components/BannerCarousel";
import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";
import { extractBanners, extractCategories, extractProducts } from "../utils/apiResponse";

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000'%3E%3Crect width='800' height='1000' fill='%23f3f4f6'/%3E%3C/svg%3E";

function getOptimizedImageUrl(url, width = 760) {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_scale/`);
  }
  return url;
}

function HomeSkeleton() {
  return (
    <div className="storefront-container py-10" aria-label="Cargando tienda" aria-live="polite">
      <div className="h-[52vh] min-h-[360px] animate-pulse rounded-[var(--store-radius-lg)] bg-[var(--store-surface)]" />
      <div className="mx-auto mt-14 max-w-3xl text-center">
        <div className="mx-auto h-3 w-28 animate-pulse rounded-full bg-[var(--store-surface)]" />
        <div className="mx-auto mt-5 h-14 w-3/4 animate-pulse rounded-2xl bg-[var(--store-surface)]" />
        <div className="mx-auto mt-4 h-5 w-2/3 animate-pulse rounded-xl bg-[var(--store-surface)]" />
      </div>
    </div>
  );
}

function ProductCard({ product, currencyFormatter }) {
  const rawPrice = product.final_price ?? product.sale_price ?? product.price;
  const price = Number(rawPrice);
  const hasPrice = Number.isFinite(price);

  return (
    <Link
      to={`/productos/detalle/${product.id}`}
      className="storefront-product-card group block"
      aria-label={`Ver ${product.name || "producto"}`}
    >
      <div className="storefront-product-media">
        <img
          src={getOptimizedImageUrl(product.main_image)}
          alt={product.name || "Producto"}
          loading="lazy"
        />
      </div>
      <div className="px-1 pt-4">
        <p className="truncate text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[var(--store-text-muted)]">
          {product.name || "Producto"}
        </p>
        {hasPrice ? (
          <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--store-text-primary)]">
            {currencyFormatter.format(price)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function ContactItem({ icon: Icon, label, value, href }) {
  const content = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--store-surface-elevated)] text-[var(--store-text-primary)]">
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[var(--store-text-muted)]">{label}</span>
        <span className="mt-1 block truncate text-sm font-semibold text-[var(--store-text-primary)]">{value}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} className="storefront-surface flex min-w-0 items-center gap-3 p-4 transition-transform duration-150 hover:-translate-y-0.5">
        {content}
      </a>
    );
  }

  return <div className="storefront-surface flex min-w-0 items-center gap-3 p-4">{content}</div>;
}

export default function Home() {
  const { runtime } = useSiteRuntime();
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHomeData() {
      try {
        const [bannersResult, productsResult, categoriesResult] = await Promise.allSettled([
          api.get("/banners", { signal: controller.signal }),
          api.get("/products?limit=8", { signal: controller.signal }),
          api.get("/categories", { signal: controller.signal }),
        ]);

        if (bannersResult.status === "fulfilled") {
          const data = extractBanners(bannersResult.value.data);
          setBanners(Array.isArray(data) ? data.filter((banner) => banner.is_active) : []);
        }

        if (productsResult.status === "fulfilled") {
          const data = extractProducts(productsResult.value.data);
          setProducts(Array.isArray(data) ? data.slice(0, 8) : []);
        }

        if (categoriesResult.status === "fulfilled") {
          const data = extractCategories(categoriesResult.value.data);
          setCategories(Array.isArray(data) ? data.filter((category) => category?.id && category?.name).slice(0, 8) : []);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadHomeData();
    return () => controller.abort();
  }, []);

  const businessName = runtime.identity.businessName || "Tienda";
  const heading = runtime.brand.tagline || businessName;
  const description = runtime.identity.description || "Explora los productos disponibles y encuentra lo que mejor se adapta a ti.";
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: runtime.locale.currency || "COP",
      maximumFractionDigits: 0,
    }),
    [runtime.locale.currency]
  );

  const contactItems = useMemo(() => {
    const items = [];
    const phone = runtime.identity.contact.phone;
    const email = runtime.identity.contact.email;
    const location = [runtime.identity.location.city, runtime.identity.location.department]
      .filter(Boolean)
      .join(", ");

    if (phone) {
      const digits = phone.replace(/[^\d+]/g, "");
      items.push({ icon: Phone, label: "Teléfono", value: phone, href: digits ? `tel:${digits}` : null });
    }
    if (email) items.push({ icon: Mail, label: "Correo", value: email, href: `mailto:${email}` });
    if (location) items.push({ icon: MapPin, label: "Ubicación", value: location, href: null });
    return items;
  }, [runtime]);

  if (loading) return <HomeSkeleton />;

  return (
    <div className="pb-24">
      {banners.length > 0 ? (
        <section className="storefront-container pt-3 sm:pt-5">
          <div className="h-[clamp(390px,66vh,760px)] overflow-hidden rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-[var(--store-surface)]">
            <BannerCarousel banners={banners} />
          </div>
        </section>
      ) : null}

      <section className="storefront-container py-16 text-center sm:py-24 lg:py-32">
        <div className="mx-auto max-w-5xl">
          <p className="storefront-kicker">{businessName}</p>
          <h1 className="storefront-title mt-5">{heading}</h1>
          <p className="storefront-copy mx-auto mt-7 max-w-2xl">{description}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/productos" className="storefront-brand-button">
              Explorar catálogo <ArrowRight size={15} />
            </Link>
            {contactItems.length > 0 ? (
              <Link to="/contact" className="storefront-secondary-button">
                Contacto
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="storefront-container pb-14 sm:pb-20">
          <div className="flex flex-col gap-5 border-y border-[var(--store-border)] py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="storefront-kicker">Explorar</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--store-text-primary)]">Categorías</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/productos/categoria/${category.slug}`}
                  className="storefront-category-chip"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="storefront-container py-12 sm:py-18">
        <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="storefront-kicker">Catálogo</p>
            <h2 className="storefront-section-title mt-3">Productos disponibles</h2>
          </div>
          <Link to="/productos" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--store-text-secondary)] hover:text-[var(--store-text-primary)]">
            Ver todo <ArrowRight size={15} />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} currencyFormatter={currencyFormatter} />
            ))}
          </div>
        ) : (
          <div className="storefront-surface flex min-h-52 flex-col items-center justify-center px-6 text-center">
            <ShoppingBag size={22} strokeWidth={1.6} className="text-[var(--store-text-muted)]" />
            <p className="mt-4 text-sm font-semibold text-[var(--store-text-primary)]">No hay productos disponibles en este momento.</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-[var(--store-text-muted)]">Cuando el catálogo publique nuevos productos, aparecerán aquí automáticamente.</p>
          </div>
        )}
      </section>

      {contactItems.length > 0 ? (
        <section className="storefront-container pt-16 sm:pt-24">
          <div className="storefront-elevated overflow-hidden p-6 sm:p-9 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="storefront-kicker">{businessName}</p>
                <h2 className="storefront-section-title mt-3">¿Necesitas ayuda?</h2>
                <p className="storefront-copy mt-4 max-w-lg">Usa los canales publicados por la tienda para resolver dudas sobre productos, pedidos o disponibilidad.</p>
              </div>
              <div className="storefront-contact-grid">
                {contactItems.map((item) => (
                  <ContactItem key={`${item.label}-${item.value}`} {...item} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
