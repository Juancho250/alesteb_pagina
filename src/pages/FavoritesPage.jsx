import { memo, useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Percent, Plus, ShoppingBag } from "lucide-react";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";
import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";

const imgUrl = (url, width = 600) => {
  if (!url) return null;
  return url.includes("/upload/")
    ? url.replace("/upload/", `/upload/f_webp,q_auto:good,w_${width},c_fill,dpr_auto/`)
    : url;
};

function createCurrencyFormatter(currency) {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: currency || "COP", maximumFractionDigits: 0 });
  } catch {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  }
}

const FavCard = memo(function FavCard({ product, isInCart, onToggle, currencyFormatter }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(product.id);

  const priceOriginal = Number(product.sale_price) || 0;
  const priceFinalRaw = Number(product.final_price) || 0;
  const hasDiscount = priceFinalRaw > 0 && priceFinalRaw < priceOriginal;
  const priceFinal = hasDiscount ? priceFinalRaw : priceOriginal;
  const discountPct = hasDiscount && priceOriginal > 0
    ? Math.round(((priceOriginal - priceFinal) / priceOriginal) * 100)
    : 0;
  const hasVariants = Boolean(product.has_variants);
  const thumb = imgUrl(product.main_image, 600);
  const thumb2x = imgUrl(product.main_image, 1200);

  return (
    <article className="storefront-product-card group relative">
      <div className="storefront-product-media">
        {hasDiscount ? (
          <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full border border-[var(--store-border)] bg-[var(--store-page-bg)]/90 px-2.5 py-1 text-[9px] font-semibold text-[var(--store-text-primary)] backdrop-blur-md">
            <Percent size={9} /> {discountPct}%
          </span>
        ) : null}

        {hasVariants ? (
          <span className="absolute bottom-3 left-3 z-20 rounded-full bg-[var(--store-brand)] px-2.5 py-1 text-[9px] font-semibold text-[var(--store-brand-contrast)]">
            Opciones
          </span>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            toggleFavorite(product);
          }}
          className={`absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full border border-[var(--store-border)] bg-[var(--store-page-bg)]/90 backdrop-blur-md transition-transform hover:scale-105 ${favorite ? "text-rose-500" : "text-[var(--store-text-muted)]"}`}
          aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart size={15} fill={favorite ? "currentColor" : "none"} />
        </button>

        <Link to={`/productos/detalle/${product.id}`} className="absolute inset-0">
          {!imgLoaded && thumb ? <span className="absolute inset-0 animate-pulse bg-[var(--store-surface)]" /> : null}
          {thumb ? (
            <img
              src={thumb}
              srcSet={`${thumb} 1x, ${thumb2x} 2x`}
              alt={product.name || "Producto"}
              loading="lazy"
              decoding="async"
              width={600}
              height={750}
              onLoad={() => setImgLoaded(true)}
              className={imgLoaded ? "opacity-100" : "opacity-0"}
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-[var(--store-text-muted)]"><ShoppingBag size={28} strokeWidth={1.4} /></span>
          )}
        </Link>

        {hasVariants ? (
          <Link
            to={`/productos/detalle/${product.id}`}
            className="absolute bottom-3 right-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-[var(--store-border)] bg-[var(--store-page-bg)] text-[var(--store-text-primary)] shadow-sm transition-transform hover:scale-105"
            aria-label="Ver opciones"
          >
            <ShoppingBag size={17} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onToggle({ ...product, cartKey: String(product.id) }, 1)}
            className={`absolute bottom-3 right-3 z-20 grid h-10 w-10 place-items-center rounded-full border shadow-sm transition-transform hover:scale-105 ${isInCart ? "border-[var(--store-brand)] bg-[var(--store-brand)] text-[var(--store-brand-contrast)]" : "border-[var(--store-border)] bg-[var(--store-page-bg)] text-[var(--store-text-primary)]"}`}
            aria-label={isInCart ? "Quitar del carrito" : "Agregar al carrito"}
          >
            {isInCart ? <ShoppingBag size={17} /> : <Plus size={17} />}
          </button>
        )}
      </div>

      <div className="px-1 pt-4">
        <Link to={`/productos/detalle/${product.id}`}>
          <h2 className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--store-text-secondary)] group-hover:text-[var(--store-text-primary)]">
            {product.name || "Producto"}
          </h2>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-semibold tracking-[-0.035em] text-[var(--store-text-primary)]">
              {hasVariants ? "Desde " : ""}{currencyFormatter.format(priceFinal)}
            </span>
            {hasDiscount ? <span className="text-xs text-[var(--store-text-muted)] line-through">{currencyFormatter.format(priceOriginal)}</span> : null}
          </div>
        </Link>
      </div>
    </article>
  );
});

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { cart, toggleCart } = useCart();
  const { runtime } = useSiteRuntime();
  const handleToggle = useCallback(toggleCart, [toggleCart]);
  const currencyFormatter = useMemo(() => createCurrencyFormatter(runtime.locale.currency), [runtime.locale.currency]);

  return (
    <div className="storefront-container pb-24 pt-10 sm:pt-16">
      <header className="mb-12 border-b border-[var(--store-border)] pb-8">
        <Link to="/productos" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--store-text-muted)] hover:text-[var(--store-text-primary)]">
          <ArrowLeft size={14} /> Volver al catálogo
        </Link>
        <p className="storefront-kicker mt-8">Guardados</p>
        <h1 className="storefront-section-title mt-3">Favoritos</h1>
        <p className="mt-3 text-sm text-[var(--store-text-muted)]">{favorites.length} {favorites.length === 1 ? "producto" : "productos"}</p>
      </header>

      {favorites.length === 0 ? (
        <div className="storefront-surface flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--store-surface-elevated)] text-[var(--store-text-muted)]">
            <Heart size={22} strokeWidth={1.5} />
          </span>
          <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[var(--store-text-primary)]">Aún no tienes favoritos</h2>
          <p className="mt-2 max-w-md text-sm text-[var(--store-text-muted)]">Guarda productos para encontrarlos rápidamente más adelante.</p>
          <Link to="/productos" className="storefront-brand-button mt-6">Explorar productos</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
          {favorites.map((product) => (
            <FavCard
              key={product.id}
              product={product}
              onToggle={handleToggle}
              isInCart={cart.some((item) => item.cartKey === String(product.id))}
              currencyFormatter={currencyFormatter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
