// src/pages/Products.jsx
import React, { useEffect, useState, useRef, memo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { extractPagination, extractProducts } from "../utils/apiResponse";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { ReactLenis } from "lenis/react";
import {
  ShoppingBag, Percent, Search, X,
  ChevronRight, ArrowLeft, Plus, ChevronLeft,
} from "lucide-react";

// ─── Cache en memoria (vive mientras la SPA esté abierta) ─────────────────────
const cache = new Map();
const CACHE_TTL = 60_000; // 1 minuto

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// ─── Optimización de imagen Cloudinary ───────────────────────────────────────
// Las imágenes ya llegan como WebP desde el uploader, solo ajustamos tamaño
function imgUrl(url, w = 600) {
  if (!url) return null;
  if (url.includes("/upload/"))
    return url.replace("/upload/", `/upload/f_webp,q_auto:good,w_${w},c_fill,dpr_auto/`);
  return url;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex flex-col animate-pulse">
    <div className="aspect-[4/5] rounded-[2rem] bg-slate-100" />
    <div className="mt-5 px-1 space-y-2">
      <div className="h-2 w-24 bg-slate-100 rounded-full" />
      <div className="h-5 w-32 bg-slate-100 rounded-full" />
    </div>
  </div>
);

// ─── Variantes de animación ───────────────────────────────────────────────────
const cardVariants = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

// ─── ProductCard ──────────────────────────────────────────────────────────────
const ProductCard = memo(({ p, index, isInCart, onToggle }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);

  const priceOriginal   = Number(p.sale_price || p.price) || 0;
  const priceFinalRaw   = Number(p.final_price) || 0;
  const hasDiscount     = priceFinalRaw > 0 && priceFinalRaw < priceOriginal;
  const priceFinal      = hasDiscount ? priceFinalRaw : priceOriginal;
  const discountPercent = hasDiscount
    ? Math.round(((priceOriginal - priceFinal) / priceOriginal) * 100) : 0;
  const hasVariants     = Boolean(p.has_variants);

  // Thumb pequeño para grid, srcSet para pantallas retina
  const thumb    = imgUrl(p.main_image || p.images?.[0]?.url, 600);
  const thumb2x  = imgUrl(p.main_image || p.images?.[0]?.url, 1200);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group relative flex flex-col"
    >
      {/* Badge descuento */}
      {hasDiscount && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md
          text-slate-900 px-3 py-1 rounded-2xl text-[10px] font-black shadow-sm border border-slate-100">
          <Percent size={9} className="text-blue-600" strokeWidth={3} />
          {discountPercent}% OFF
        </div>
      )}

      {/* Badge variantes */}
      {hasVariants && (
        <div className="absolute top-4 right-4 z-20 bg-slate-900/70 backdrop-blur-md
          text-white px-2.5 py-1 rounded-xl text-[9px] font-black tracking-wider">
          + opciones
        </div>
      )}

      {/* Imagen */}
      <Link
        to={`/productos/detalle/${p.id}`}
        className="relative block overflow-hidden rounded-[2.5rem] bg-[#F5F5F7] aspect-[4/5]
          transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-slate-200/80"
      >
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 animate-pulse" />
        )}

        {thumb && (
          <img
            src={thumb}
            srcSet={`${thumb} 1x, ${thumb2x} 2x`}
            alt={p.name}
            loading="lazy"
            decoding="async"
            width={600}
            height={750}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true); }}
            className={`w-full h-full object-cover transition-all duration-700
              group-hover:scale-[1.06]
              ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.04] transition-colors duration-500" />
      </Link>

      {/* Botón carrito */}
      {hasVariants ? (
        <Link
          to={`/productos/detalle/${p.id}`}
          className="absolute bottom-[7.5rem] right-5 z-20 p-4 rounded-full bg-white text-slate-900
            border border-slate-100 shadow-xl hover:bg-blue-600 hover:text-white hover:border-blue-600
            transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ShoppingBag size={19} strokeWidth={2} />
        </Link>
      ) : (
        <button
          onClick={() => onToggle({ ...p, cartKey: String(p.id) }, 1)}
          className={`absolute bottom-[7.5rem] right-5 z-20 p-4 rounded-full shadow-2xl
            transition-all duration-300 hover:scale-105 active:scale-95
            ${isInCart
              ? "bg-blue-600 text-white shadow-blue-500/30 border border-blue-500"
              : "bg-white text-slate-900 border border-slate-100 shadow-slate-200/80"
            }`}
        >
          {isInCart
            ? <ShoppingBag size={19} strokeWidth={2} />
            : <Plus size={19} strokeWidth={2} />
          }
        </button>
      )}

      {/* Info */}
      <div className="mt-5 px-1 space-y-1.5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight
          group-hover:text-blue-600 transition-colors duration-300 truncate">
          {p.name}
        </p>
        <div className="flex items-baseline gap-2.5">
          <span className="text-xl font-black text-slate-900 tracking-tight">
            {hasVariants ? "Desde " : ""}${priceFinal.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm text-slate-300 line-through font-medium">
              ${priceOriginal.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});
ProductCard.displayName = "ProductCard";

// ─── Paginación ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  return (
    <motion.div
      variants={fadeUp} initial="hidden" animate="visible"
      className="flex justify-center items-center gap-5 mt-24 mb-4"
    >
      <button
        onClick={onPrev} disabled={page === 1}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50
          hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed
          transition-all hover:scale-105 active:scale-95"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="font-black text-slate-900 tracking-widest text-xs">
        {page} / {totalPages}
      </span>
      <button
        onClick={onNext} disabled={page === totalPages}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50
          hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed
          transition-all hover:scale-105 active:scale-95"
      >
        <ChevronRight size={20} />
      </button>
    </motion.div>
  );
}

// ─── Prefetch del siguiente bloque de productos ───────────────────────────────
function usePrefetchNextPage({ slug, debSearch, page, totalPages }) {
  useEffect(() => {
    if (page >= totalPages) return;
    const nextPage = page + 1;
    const key = `${slug ?? ""}-${debSearch}-${nextPage}`;
    if (cacheGet(key)) return; // ya está en cache

    const params = new URLSearchParams({ page: nextPage, limit: 12 });
    if (debSearch) params.append("search", debSearch);
    if (slug)      params.append("categoria", slug);

    api.get(`/products?${params}`)
      .then(({ data }) => cacheSet(key, data))
      .catch(() => {});
  }, [slug, debSearch, page, totalPages]);
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Products() {
  const { slug }             = useParams();
  const { cart, toggleCart } = useCart();

  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [firstLoad,  setFirstLoad]  = useState(true);
  const [search,     setSearch]     = useState("");
  const [debSearch,  setDebSearch]  = useState("");
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const [catName,    setCatName]    = useState("");
  const searchRef = useRef(null);

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => { setDebSearch(search); setPage(1); }, 420);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch con cache
  useEffect(() => {
    let active = true;
    const cacheKey = `${slug ?? ""}-${debSearch}-${page}`;
    const cached   = cacheGet(cacheKey);

    if (cached) {
      // Render inmediato desde cache
      const items = extractProducts(cached);
      const pag   = extractPagination(cached);
      setProducts(items);
      setPagination(pag);
      if (slug && items[0]?.category_name) setCatName(items[0].category_name);
      setLoading(false);
      setFirstLoad(false);
      return;
    }

    setLoading(true);

    const params = new URLSearchParams({ page, limit: 12 });
    if (debSearch) params.append("search", debSearch);
    if (slug)      params.append("categoria", slug);

    api.get(`/products?${params}`)
      .then(({ data }) => {
        if (!active) return;
        cacheSet(cacheKey, data);
        const items = extractProducts(data);
        const pag   = extractPagination(data);
        setProducts(items);
        setPagination(pag);
        if (slug && items[0]?.category_name) setCatName(items[0].category_name);
      })
      .catch(console.error)
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setFirstLoad(false);
        if (page > 1) window.scrollTo({ top: 0, behavior: "smooth" });
      });

    return () => { active = false; };
  }, [slug, debSearch, page]);

  // Prefetch de la página siguiente en background
  usePrefetchNextPage({ slug, debSearch, page, totalPages: pagination.totalPages });

  const handleToggle = useCallback(toggleCart, [toggleCart]);

  const SKELETONS = 12;

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.8, smoothTouch: false }}>
      <div className="bg-white min-h-screen font-sans selection:bg-blue-100">
        <main className="pt-24 md:pt-32 max-w-7xl mx-auto px-5 sm:px-8 pb-32">

          {/* ── Breadcrumb ──────────────────────────────────────────── */}
          {slug && (
            <motion.nav
              variants={fadeUp} initial="hidden" animate="visible"
              className="flex items-center gap-2.5 text-[10px] font-black
                text-slate-400 mb-10 uppercase tracking-[0.2em]"
            >
              <Link to="/" className="hover:text-blue-600 transition-colors">Inicio</Link>
              <ChevronRight size={10} className="text-slate-200" />
              <Link to="/productos" className="hover:text-blue-600 transition-colors">Tienda</Link>
              <ChevronRight size={10} className="text-slate-200" />
              <span className="text-slate-900">{catName || slug.replace(/-/g, " ")}</span>
            </motion.nav>
          )}

          {/* ── Header ──────────────────────────────────────────────── */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible"
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16"
          >
            <div className="space-y-5">
              <h1 className="text-[clamp(3rem,10vw,7rem)] font-black text-slate-900
                tracking-[-0.04em] leading-[0.85] italic whitespace-pre-line">
                {slug
                  ? (catName || slug.replace(/-/g, " ")).toUpperCase()
                  : "EXPLORA\nLO NUEVO"
                }
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-1 w-14 bg-blue-600 rounded-full" />
                <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">
                  {loading ? "Cargando…" : `${pagination.totalItems} productos`}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative group w-full lg:w-80 xl:w-96">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300
                  group-focus-within:text-blue-600 transition-colors duration-300"
                size={18} strokeWidth={2.5}
              />
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 rounded-2xl py-4 pl-12 pr-10 outline-none border border-transparent
                  focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-600/8
                  transition-all duration-300 font-semibold text-sm text-slate-800
                  placeholder:text-slate-300 shadow-sm"
              />
              <AnimatePresence>
                {search && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200
                      hover:bg-slate-300 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X size={12} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Grid ────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {(loading && firstLoad) ? (
              <motion.div
                key="skeletons"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14"
              >
                {Array.from({ length: SKELETONS }).map((_, i) => <SkeletonCard key={i} />)}
              </motion.div>
            ) : products.length > 0 ? (
              <motion.div
                key={`${debSearch}-${page}-${slug}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14"
              >
                {products.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    index={i}
                    onToggle={handleToggle}
                    isInCart={cart.some(item => item.cartKey === String(p.id))}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                variants={fadeUp} initial="hidden" animate="visible"
                className="col-span-full flex flex-col items-center justify-center py-36 text-center"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center
                  justify-center text-slate-200 mb-6 border border-slate-100">
                  <Search size={36} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">
                  SIN RESULTADOS
                </h3>
                <p className="text-sm text-slate-400 font-medium mb-8">
                  Prueba con otro término o explora toda la colección
                </p>
                <Link
                  to="/productos"
                  onClick={() => setSearch("")}
                  className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4
                    rounded-full font-bold text-sm hover:bg-blue-600
                    transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/10"
                >
                  <ArrowLeft size={16} /> Limpiar filtros
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Paginación ──────────────────────────────────────────── */}
          {!loading && (
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            />
          )}

        </main>
      </div>
    </ReactLenis>
  );
}