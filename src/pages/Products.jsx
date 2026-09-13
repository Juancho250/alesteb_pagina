import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Percent,
  Plus,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import api from "../services/api";
import { extractCategories, extractPagination, extractProducts } from "../utils/apiResponse";
import { useCart } from "../context/CartContext";
import { useDiscounts } from "../context/DiscountsContext";
import { useFavorites } from "../context/FavoritesContext";
import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";
import ProductReviewSummary from "../components/reviews/ProductReviewSummary";

const cache = new Map();
const CACHE_TTL = 60_000;

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

function imgUrl(url, width = 720) {
  if (!url) return null;
  if (url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_fill,dpr_auto/`);
  }
  return url;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-[var(--store-radius-md)] bg-[var(--store-surface)]" />
      <div className="mt-4 space-y-2 px-1">
        <div className="h-2.5 w-2/3 rounded-full bg-[var(--store-surface)]" />
        <div className="h-4 w-1/2 rounded-full bg-[var(--store-surface)]" />
      </div>
    </div>
  );
}

const ProductCard = memo(function ProductCard({ product, isInCart, onToggle, currencyFormatter }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const favorite = isFavorite(product.id);
  const priceOriginal = Number(product.sale_price || product.price) || 0;
  const priceFinalRaw = Number(product.final_price) || 0;
  const hasDiscount = priceFinalRaw > 0 && priceFinalRaw < priceOriginal;
  const priceFinal = hasDiscount ? priceFinalRaw : priceOriginal;
  const discountPercent = hasDiscount
    ? Math.round(((priceOriginal - priceFinal) / priceOriginal) * 100)
    : 0;
  const hasVariants = Boolean(product.has_variants);
  const isOnDemand = product.fulfillment_mode === "on_demand";
  const isHybrid = product.fulfillment_mode === "hybrid";
  const isOut = product.stock <= 0 && !isOnDemand;
  const isLow = !isOut && product.stock_status === "low" && !hasVariants && !isOnDemand;

  const rawThumb =
    product.main_image ||
    product.images?.[0]?.url ||
    product.variant_swatches?.find((swatch) => swatch.attribute_slug === "color")?.main_image ||
    product.variant_swatches?.[0]?.main_image ||
    null;
  const thumb = imgUrl(rawThumb, 720);
  const thumb2x = imgUrl(rawThumb, 1280);

  return (
    <article className="storefront-product-card group relative">
      <div className="storefront-product-media">
        {!isOut ? (
          <span className={`absolute left-3 top-3 z-20 rounded-full border px-2.5 py-1 text-[9px] font-semibold backdrop-blur-md ${
            isOnDemand
              ? "border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300"
              : isHybrid
                ? "border-[var(--store-brand)]/25 bg-[var(--store-brand)] text-[var(--store-brand-contrast)]"
                : "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          }`}>
            {isOnDemand ? "Bajo pedido" : isHybrid ? "Disponible / pedido" : "Entrega inmediata"}
          </span>
        ) : null}

        {hasDiscount ? (
          <span className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1 rounded-full border border-[var(--store-border)] bg-[var(--store-page-bg)]/90 px-2.5 py-1 text-[9px] font-semibold text-[var(--store-text-primary)] backdrop-blur-md">
            <Percent size={9} /> {discountPercent}%
          </span>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            toggleFavorite(product);
          }}
          aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          className={`absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full border border-[var(--store-border)] bg-[var(--store-page-bg)]/90 backdrop-blur-md transition-transform hover:scale-105 ${favorite ? "text-rose-500" : "text-[var(--store-text-muted)]"}`}
        >
          <Heart size={15} fill={favorite ? "currentColor" : "none"} />
        </button>

        <Link to={`/productos/detalle/${product.id}`} className="absolute inset-0">
          {!imgLoaded && !imgError && thumb ? (
            <span className="absolute inset-0 animate-pulse bg-[var(--store-surface)]" />
          ) : null}

          {thumb && !imgError ? (
            <img
              src={thumb}
              srcSet={`${thumb} 1x, ${thumb2x} 2x`}
              alt={product.name || "Producto"}
              loading="lazy"
              decoding="async"
              width={720}
              height={900}
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                setImgError(true);
                setImgLoaded(true);
              }}
              className={imgLoaded ? "opacity-100" : "opacity-0"}
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-[var(--store-text-muted)]">
              <ShoppingBag size={30} strokeWidth={1.4} />
            </span>
          )}

          {isOut ? (
            <span className="absolute inset-0 z-10 grid place-items-center bg-[var(--store-page-bg)]/72 backdrop-blur-[1px]">
              <span className="rounded-full border border-[var(--store-border)] bg-[var(--store-page-bg)] px-3 py-1.5 text-[10px] font-semibold text-[var(--store-text-muted)]">Agotado</span>
            </span>
          ) : null}
        </Link>

        {hasVariants ? (
          <Link
            to={`/productos/detalle/${product.id}`}
            aria-label="Ver opciones"
            onClick={isOut ? (event) => event.preventDefault() : undefined}
            className={`absolute bottom-3 right-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-[var(--store-border)] bg-[var(--store-page-bg)] text-[var(--store-text-primary)] shadow-sm ${isOut ? "pointer-events-none opacity-40" : "hover:border-[var(--store-brand)]"}`}
          >
            <ShoppingBag size={17} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => !isOut && onToggle({ ...product, cartKey: String(product.id) }, 1)}
            disabled={isOut}
            aria-label={isOut ? "Agotado" : isInCart ? "Quitar del carrito" : "Agregar al carrito"}
            className={`absolute bottom-3 right-3 z-20 grid h-10 w-10 place-items-center rounded-full border shadow-sm transition-transform hover:scale-105 ${
              isOut
                ? "cursor-not-allowed border-[var(--store-border)] bg-[var(--store-surface)] text-[var(--store-text-muted)]"
                : isInCart
                  ? "border-[var(--store-brand)] bg-[var(--store-brand)] text-[var(--store-brand-contrast)]"
                  : "border-[var(--store-border)] bg-[var(--store-page-bg)] text-[var(--store-text-primary)]"
            }`}
          >
            {isOut ? <X size={16} /> : isInCart ? <ShoppingBag size={16} /> : <Plus size={16} />}
          </button>
        )}
      </div>

      <div className="px-1 pt-4">
        <Link to={`/productos/detalle/${product.id}`} className="block">
          <h2 className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--store-text-secondary)] transition-colors group-hover:text-[var(--store-text-primary)]">
            {product.name}
          </h2>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className={`text-lg font-semibold tracking-[-0.035em] ${isOut ? "text-[var(--store-text-muted)]" : "text-[var(--store-text-primary)]"}`}>
              {hasVariants ? "Desde " : ""}{currencyFormatter.format(priceFinal)}
            </span>
            {hasDiscount ? (
              <span className="text-xs text-[var(--store-text-muted)] line-through">{currencyFormatter.format(priceOriginal)}</span>
            ) : null}
          </div>
        </Link>

        <div className="mt-2 min-h-5">
          {isLow ? (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-300">Últimas {product.stock}</span>
          ) : isOnDemand ? (
            <span className="text-[10px] font-medium text-violet-600 dark:text-violet-300">
              Entrega en {product.supplier_lead_time_days ?? "?"} días
            </span>
          ) : hasVariants ? (
            <span className="text-[10px] text-[var(--store-text-muted)]">Opciones disponibles</span>
          ) : null}
        </div>

        <div className="mt-1">
          <ProductReviewSummary productId={product.id} compact />
        </div>
      </div>
    </article>
  );
});

function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-16 flex items-center justify-center gap-3" aria-label="Paginación">
      <button type="button" onClick={onPrev} disabled={page === 1} className="storefront-secondary-button !h-11 !min-h-11 !w-11 !p-0 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Página anterior">
        <ChevronLeft size={18} />
      </button>
      <span className="min-w-20 text-center text-xs font-semibold text-[var(--store-text-muted)]">{page} / {totalPages}</span>
      <button type="button" onClick={onNext} disabled={page === totalPages} className="storefront-secondary-button !h-11 !min-h-11 !w-11 !p-0 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Página siguiente">
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}

function isDescendantOf(category, slug) {
  if (category.slug === slug) return true;
  return category.children?.some((child) => isDescendantOf(child, slug)) ?? false;
}

function usePrefetchNextPage({ slug, debSearch, page, totalPages }) {
  useEffect(() => {
    if (page >= totalPages) return;
    const nextPage = page + 1;
    const key = `${slug ?? ""}-${debSearch}-${nextPage}`;
    if (cacheGet(key)) return;

    const params = new URLSearchParams({ page: nextPage, limit: 200 });
    if (debSearch) params.append("search", debSearch);
    if (slug) params.append("category", slug);

    api.get(`/products?${params}`)
      .then(({ data }) => cacheSet(key, data))
      .catch(() => {});
  }, [slug, debSearch, page, totalPages]);
}

export default function Products() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cart, toggleCart } = useCart();
  const { applyDiscount } = useDiscounts();
  const { runtime } = useSiteRuntime();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [debSearch, setDebSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const [catName, setCatName] = useState("");
  const [categories, setCategories] = useState([]);
  const searchRef = useRef(null);

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: runtime.locale.currency || "COP",
        maximumFractionDigits: 0,
      });
    } catch {
      return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
    }
  }, [runtime.locale.currency]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebSearch(search);
      setPage(1);
      setSearchParams(search ? { search } : {}, { replace: true });
    }, 420);
    return () => clearTimeout(timer);
  }, [search, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [slug]);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/categories", { signal: controller.signal })
      .then((response) => setCategories(extractCategories(response.data)))
      .catch((error) => {
        if (error?.code !== "ERR_CANCELED") setCategories([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let active = true;
    const cacheKey = `${slug ?? ""}-${debSearch}-${page}`;
    const cached = cacheGet(cacheKey);

    if (cached) {
      const items = extractProducts(cached);
      const pag = extractPagination(cached);
      setProducts(items.map(applyDiscount));
      setPagination(pag);
      if (slug && items[0]?.category_name) setCatName(items[0].category_name);
      setLoading(false);
      setFirstLoad(false);
      return undefined;
    }

    setLoading(true);
    const params = new URLSearchParams({ page, limit: 200 });
    if (debSearch) params.append("search", debSearch);
    if (slug) params.append("category", slug);

    api.get(`/products?${params}`)
      .then(({ data }) => {
        if (!active) return;
        cacheSet(cacheKey, data);
        const items = extractProducts(data);
        const pag = extractPagination(data);
        setProducts(items.map(applyDiscount));
        setPagination(pag);
        if (slug && items[0]?.category_name) setCatName(items[0].category_name);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setFirstLoad(false);
        if (page > 1) window.scrollTo({ top: 0, behavior: "smooth" });
      });

    return () => {
      active = false;
    };
  }, [slug, debSearch, page, applyDiscount]);

  usePrefetchNextPage({ slug, debSearch, page, totalPages: pagination.totalPages });

  const handleToggle = useCallback(toggleCart, [toggleCart]);
  const activeCat = slug ? categories.find((category) => isDescendantOf(category, slug)) : null;
  const currentTitle = slug ? (catName || slug.replace(/-/g, " ")) : "Todos los productos";

  return (
    <div className="storefront-container pb-24 pt-8 sm:pt-12">
      {slug ? (
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-[var(--store-text-muted)]" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[var(--store-text-primary)]">Inicio</Link>
          <ChevronRight size={12} />
          <Link to="/productos" className="hover:text-[var(--store-text-primary)]">Productos</Link>
          {activeCat && slug !== activeCat.slug ? (
            <>
              <ChevronRight size={12} />
              <Link to={`/productos/categoria/${activeCat.slug}`} className="hover:text-[var(--store-text-primary)]">{activeCat.name}</Link>
            </>
          ) : null}
          <ChevronRight size={12} />
          <span className="text-[var(--store-text-primary)]">{currentTitle}</span>
        </nav>
      ) : null}

      <header className="grid gap-8 border-b border-[var(--store-border)] pb-8 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <p className="storefront-kicker">Catálogo</p>
          <h1 className="storefront-section-title mt-3">{currentTitle}</h1>
          <p className="mt-3 text-sm text-[var(--store-text-muted)]">
            {loading ? "Actualizando catálogo…" : `${pagination.totalItems} ${pagination.totalItems === 1 ? "producto" : "productos"}`}
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--store-text-muted)]" />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar productos"
            className="storefront-surface min-h-12 w-full bg-[var(--store-surface)] py-3 pl-11 pr-11 text-sm text-[var(--store-text-primary)] outline-none transition-colors placeholder:text-[var(--store-text-muted)] focus:border-[var(--store-brand)]"
          />
          {search ? (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[var(--store-text-muted)] hover:bg-[var(--store-surface-hover)]" aria-label="Limpiar búsqueda">
              <X size={14} />
            </button>
          ) : null}
        </div>
      </header>

      {categories.length > 0 ? (
        <section className="py-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button type="button" onClick={() => navigate("/productos")} className={!slug ? "storefront-brand-button !min-h-10 !px-4 !py-2" : "storefront-category-chip !min-h-10"}>Todos</button>
            {categories.map((category) => {
              const active = activeCat?.id === category.id;
              return (
                <button key={category.id} type="button" onClick={() => navigate(`/productos/categoria/${category.slug}`)} className={active ? "storefront-brand-button !min-h-10 !px-4 !py-2" : "storefront-category-chip !min-h-10"}>
                  {category.name}
                </button>
              );
            })}
          </div>

          {activeCat?.children?.length ? (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button type="button" onClick={() => navigate(`/productos/categoria/${activeCat.slug}`)} className={slug === activeCat.slug ? "storefront-brand-button !min-h-9 !px-3.5 !py-1.5 !text-[11px]" : "storefront-category-chip !min-h-9 !px-3.5 !py-1.5 !text-[11px]"}>
                Todo en {activeCat.name}
              </button>
              {activeCat.children.map((child) => (
                <button key={child.id} type="button" onClick={() => navigate(`/productos/categoria/${child.slug}`)} className={slug === child.slug ? "storefront-brand-button !min-h-9 !px-3.5 !py-1.5 !text-[11px]" : "storefront-category-chip !min-h-9 !px-3.5 !py-1.5 !text-[11px]"}>
                  {child.name}
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {loading && firstLoad ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
          {Array.from({ length: 12 }, (_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onToggle={handleToggle}
              isInCart={cart.some((item) => item.cartKey === String(product.id))}
              currencyFormatter={currencyFormatter}
            />
          ))}
        </div>
      ) : (
        <div className="storefront-surface flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
          <Search size={28} strokeWidth={1.5} className="text-[var(--store-text-muted)]" />
          <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[var(--store-text-primary)]">No encontramos productos</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--store-text-muted)]">Prueba otro término o vuelve al catálogo completo.</p>
          <Link to="/productos" onClick={() => setSearch("")} className="storefront-secondary-button mt-6">
            <ArrowLeft size={15} /> Limpiar filtros
          </Link>
        </div>
      )}

      {!loading ? (
        <Pagination
          page={page}
          totalPages={pagination.totalPages}
          onPrev={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
        />
      ) : null}
    </div>
  );
}
