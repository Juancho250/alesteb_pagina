// src/pages/FavoritesPage.jsx
import { memo, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowLeft, Percent, Plus, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";

const imgUrl = (url, w = 600) => {
  if (!url) return null;
  return url.includes("/upload/")
    ? url.replace("/upload/", `/upload/f_webp,q_auto:good,w_${w},c_fill,dpr_auto/`)
    : url;
};

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

const FavCard = memo(({ p, index, isInCart, onToggle }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  const fav = isFavorite(p.id);

  const priceOriginal = Number(p.sale_price) || 0;
  const priceFinalRaw = Number(p.final_price) || 0;
  const hasDiscount   = priceFinalRaw > 0 && priceFinalRaw < priceOriginal;
  const priceFinal    = hasDiscount ? priceFinalRaw : priceOriginal;
  const discountPct   = hasDiscount
    ? Math.round(((priceOriginal - priceFinal) / priceOriginal) * 100) : 0;
  const hasVariants   = Boolean(p.has_variants);
  const thumb         = imgUrl(p.main_image, 600);
  const thumb2x       = imgUrl(p.main_image, 1200);

  return (
    <motion.div
      custom={index} variants={cardVariants} initial="hidden" animate="visible"
      className="group relative flex flex-col"
    >
      {hasDiscount && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-white/90
          backdrop-blur-md text-slate-900 px-3 py-1 rounded-2xl text-[10px] font-black
          shadow-sm border border-slate-100">
          <Percent size={9} className="text-blue-600" strokeWidth={3} />
          {discountPct}% OFF
        </div>
      )}

      {hasVariants && (
        <div className="absolute top-4 right-4 z-20 bg-slate-900/70 backdrop-blur-md
          text-white px-2.5 py-1 rounded-xl text-[9px] font-black tracking-wider">
          + opciones
        </div>
      )}

      {/* Botón favorito */}
      <button
        onClick={(e) => { e.preventDefault(); toggleFavorite(p); }}
        className={`absolute z-20 p-2.5 rounded-full bg-white/90 backdrop-blur-md
          border border-slate-100 shadow-sm transition-all duration-300
          hover:scale-110 active:scale-95
          ${hasVariants ? "top-12 right-4 mt-1" : "top-4 right-4"}
          ${fav ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}
      >
        <Heart size={15} fill={fav ? "currentColor" : "none"} strokeWidth={2} />
      </button>

      {/* Imagen */}
      <Link
        to={`/productos/detalle/${p.id}`}
        className="relative block overflow-hidden rounded-[2.5rem] bg-[#F5F5F7] aspect-[4/5]
          transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-slate-200/80"
      >
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 animate-pulse" />
        )}
        {thumb && (
          <img
            src={thumb} srcSet={`${thumb} 1x, ${thumb2x} 2x`} alt={p.name}
            loading="lazy" decoding="async" width={600} height={750}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-700
              group-hover:scale-[1.06] ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </Link>

      {/* Botón carrito */}
      {hasVariants ? (
        <Link
          to={`/productos/detalle/${p.id}`}
          className="absolute bottom-[7.5rem] right-5 z-20 p-4 rounded-full bg-white
            text-slate-900 border border-slate-100 shadow-xl hover:bg-blue-600
            hover:text-white hover:border-blue-600 transition-all duration-300
            hover:scale-105 active:scale-95"
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
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]
          leading-tight group-hover:text-blue-600 transition-colors truncate">
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
FavCard.displayName = "FavCard";

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { cart, toggleCart } = useCart();
  const handleToggle = useCallback(toggleCart, [toggleCart]);

  return (
    <div className="bg-white min-h-screen font-sans pb-32">
      <main className="pt-24 md:pt-32 max-w-7xl mx-auto px-5 sm:px-8">

        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-16 space-y-5">
          <Link
            to="/productos"
            className="inline-flex items-center gap-2 text-[10px] font-black tracking-widest
              text-slate-400 uppercase hover:text-blue-600 transition-colors mb-6"
          >
            <ArrowLeft size={12} /> Volver a la tienda
          </Link>
          <h1 className="text-[clamp(3rem,10vw,7rem)] font-black text-slate-900
            tracking-[-0.04em] leading-[0.85] italic">
            FAVORITOS
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-1 w-14 bg-red-400 rounded-full" />
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">
              {favorites.length} {favorites.length === 1 ? "producto" : "productos"}
            </p>
          </div>
        </motion.div>

        {favorites.length === 0 ? (
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible"
            className="flex flex-col items-center justify-center py-36 gap-5"
          >
            <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100
              flex items-center justify-center text-slate-200">
              <Heart size={36} strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">
              Aún no tienes favoritos
            </p>
            <Link
              to="/productos"
              className="flex items-center gap-2 text-xs font-black tracking-widest
                text-blue-600 uppercase hover:text-blue-700 transition-colors"
            >
              <ArrowLeft size={14} /> Explorar productos
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">
            {favorites.map((p, i) => (
              <FavCard
                key={p.id} p={p} index={i}
                onToggle={handleToggle}
                isInCart={cart.some(item => item.cartKey === String(p.id))}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}