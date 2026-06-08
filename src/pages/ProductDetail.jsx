// src/pages/ProductDetail.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Check, ShoppingBag, Package,
  ShieldCheck, Tag, Plus, Minus, Info, Loader2, ChevronRight, Heart,
  ZoomIn, X, AlertCircle, Truck, Clock, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useAvailability } from "../hooks/useAvailability";
import { useDiscounts } from "../context/DiscountsContext";
import ProductReviewsSection from "../components/reviews/ProductReviewsSection";

// ─── Cache ────────────────────────────────────────────────────────────────────
const prodCache = new Map();
const CACHE_TTL = 120_000;

function cacheGet(key) {
  const e = prodCache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { prodCache.delete(key); return null; }
  return e.data;
}
function cacheSet(key, data) {
  prodCache.set(key, { data, ts: Date.now() });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const optimizeUrl = (url, width = 800) => {
  if (!url) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000'%3E%3Crect width='800' height='1000' fill='%23F5F5F7'/%3E%3C/svg%3E";
  return url.includes("/upload/")
    ? url.replace("/upload/", `/upload/f_webp,q_auto:good,w_${width},c_limit,dpr_auto/`)
    : url;
};

function slugify(str = "") {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** Normaliza el nombre del tipo de atributo sin importar si viene como
 *  `type`, `attribute_type` o `attribute_slug`. */
const getAttrTypeName = (a) =>
  a?.type ?? a?.attribute_type ?? a?.attribute_slug ?? "";

/** Extrae las URLs de imagen de un variant, soportando varios formatos de API. */
const getVariantImageUrls = (v) => {
  if (v.images?.length)
    return v.images.map(i => (typeof i === "string" ? i : i.url)).filter(Boolean);
  if (v.main_image) return [v.main_image];
  if (v.image_url)  return [v.image_url];
  if (typeof v.image === "string" && v.image) return [v.image];
  if (v.image?.url) return [v.image.url];
  return [];
};

// ─── Variantes de animación ───────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

// ─── Thumbnail ────────────────────────────────────────────────────────────────
const Thumb = ({ img, active, onClick, idx }) => (
  <button
    onClick={onClick}
    data-active={active}
    className={`relative flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden transition-all duration-300
      ${active
        ? "ring-2 ring-slate-900 ring-offset-2 scale-95 opacity-100"
        : "opacity-30 hover:opacity-70 hover:scale-95 ring-1 ring-slate-100"
      }`}
    aria-label={`Ver imagen ${idx + 1}`}
  >
    <img src={optimizeUrl(img, 200)} className="w-full h-full object-cover" loading="lazy" alt="" />
  </button>
);

// ─── Selectores de atributo ───────────────────────────────────────────────────
function ColorSwatch({ value, isSelected, isDisabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={value.display_value}
      className={`relative w-9 h-9 rounded-full border-2 transition-all duration-200 focus:outline-none
        ${isSelected ? "border-slate-900 scale-110 shadow-md" : "border-slate-200 hover:border-slate-400"}
        ${isDisabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}
      `}
      style={{ backgroundColor: value.hex_color || "#ccc" }}
    >
      {isSelected && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Check size={14} className="text-white drop-shadow" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function AttributePill({ value, isSelected, isDisabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all duration-200
        ${isSelected
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
        }
        ${isDisabled ? "opacity-20 cursor-not-allowed line-through" : "cursor-pointer"}
      `}
    >
      {value.display_value}
    </button>
  );
}

function AttributeSelector({ attrType, values, selected, onSelect, availableValueIds }) {
  const isColor = attrType.toLowerCase().includes("color");
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{attrType}</span>
        {selected != null && (
          <span className="text-[10px] font-bold text-slate-600">
            {values.find(v => v.attribute_value_id === selected)?.display_value}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map(v => {
          const isAvailable = availableValueIds.has(v.attribute_value_id);
          return isColor ? (
            <ColorSwatch
              key={v.attribute_value_id} value={v}
              isSelected={selected === v.attribute_value_id}
              isDisabled={!isAvailable}
              onClick={() => onSelect(v.attribute_value_id)}
            />
          ) : (
            <AttributePill
              key={v.attribute_value_id} value={v}
              isSelected={selected === v.attribute_value_id}
              isDisabled={!isAvailable}
              onClick={() => onSelect(v.attribute_value_id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ icon, text }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/80">
      <div className="text-slate-400">{icon}</div>
      <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">{text}</span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id }                         = useParams();
  const { cart, toggleCart }           = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  // ✅ FIX: importamos applyDiscount para aplicarlo al producto del detalle
  const { applyDiscount }              = useDiscounts();

  const [product,      setProduct]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [selectedImg,  setSelectedImg]  = useState("");
  const [quantity,     setQuantity]     = useState(1);
  const [selections,   setSelections]   = useState({});
  const [zoomed,       setZoomed]       = useState(false);
  const [stockError,   setStockError]   = useState(null);
  const thumbsRef = useRef(null);

  const fav = isFavorite(product?.id);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    window.scrollTo(0, 0);
    setSelections({});
    setQuantity(1);
    setSelectedImg("");

    const cached = cacheGet(id);
    if (cached) {
      // ✅ FIX: Re-aplicar descuentos al leer de cache por si el contexto
      // cambió (ej. descuento expiró o se activó uno nuevo)
      const withDiscount = applyDiscount(cached);
      setProduct(withDiscount);
      autoSelectSingleVariant(withDiscount);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get(`/products/${id}`)
      .then(({ data }) => {
        if (!alive) return;
        const raw = data?.data || data?.product || data;
        const resolved = raw ? {
          ...raw,
          sale_price:    raw.sale_price    ?? raw.price,
          // Conservamos el final_price del backend (LATERAL JOIN) si existe,
          // si no, usamos sale_price como base para que applyDiscount lo calcule.
          final_price:   raw.final_price   ?? raw.sale_price ?? raw.price,
          category_name: raw.category_name ?? raw.category,
        } : null;

        // ✅ FIX: aplicar descuentos del DiscountsContext sobre el producto
        // del detalle, igual que se hace en el listing con .map(applyDiscount).
        // Esto garantiza que final_price en el carrito sea el precio con descuento.
        const withDiscount = resolved ? applyDiscount(resolved) : null;

        // Guardamos en cache el producto YA con descuento aplicado
        cacheSet(id, withDiscount || null);
        setProduct(withDiscount || null);
        autoSelectSingleVariant(withDiscount);
      })
      .catch(() => { if (alive) setProduct(null); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  // ✅ FIX: applyDiscount como dependencia para que el efecto re-corra
  // si los descuentos se cargan después del montaje del componente
  }, [id, applyDiscount]);

  function autoSelectSingleVariant(resolved) {
    const variants = resolved?.variants || [];
    if (variants.length === 1) {
      const auto = {};
      (variants[0].attributes || []).forEach(a => {
        auto[slugify(getAttrTypeName(a))] = a.attribute_value_id;
      });
      setSelections(auto);
    }
  }

  // ── Variantes ──────────────────────────────────────────────────────────────
  const variants    = product?.variants || [];
  const hasVariants = variants.length > 0;

  const attributeTypes = useMemo(() => {
    const map = new Map();
    variants.forEach(v => {
      (v.attributes || []).forEach(a => {
        const typeName = getAttrTypeName(a);
        const slug = slugify(typeName);
        if (!map.has(slug)) map.set(slug, { slug, name: typeName, values: new Map() });
        const at = map.get(slug);
        if (!at.values.has(a.attribute_value_id)) {
          at.values.set(a.attribute_value_id, {
            attribute_value_id: a.attribute_value_id,
            value:         a.value,
            display_value: a.display_value,
            hex_color:     a.hex_color,
          });
        }
      });
    });
    return [...map.values()].map(at => ({ ...at, values: [...at.values.values()] }));
  }, [variants]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants || attributeTypes.length === 0) return null;
    const selVals = Object.values(selections);
    if (selVals.length < attributeTypes.length) return null;
    return variants.find(v => {
      const ids = new Set((v.attributes || []).map(a => a.attribute_value_id));
      return selVals.length === ids.size && selVals.every(id => ids.has(id));
    }) || null;
  }, [variants, selections, attributeTypes, hasVariants]);

  const availableValueIds = useMemo(() => {
    const set = new Set();
    variants.forEach(v => {
      const compatible = Object.entries(selections).every(([slug, valId]) => {
        const match = (v.attributes || []).find(a =>
          slugify(getAttrTypeName(a)) === slug
        );
        return match?.attribute_value_id === valId;
      });
      if (compatible) {
        (v.attributes || []).forEach(a => set.add(a.attribute_value_id));
      }
    });
    return set;
  }, [variants, selections]);

  // ── Imágenes ───────────────────────────────────────────────────────────────
  const images = useMemo(() => {
    if (!product) return [];
    const gallery = (product.images || [])
      .map(i => (typeof i === "string" ? i : i.url))
      .filter(Boolean);

    // 1. Variante completa seleccionada → sus imágenes primero
    if (selectedVariant) {
      const varImgs = getVariantImageUrls(selectedVariant);
      if (varImgs.length)
        return [...new Set([...varImgs, ...gallery])].filter(Boolean);
    }

    // 2. Selección parcial (ej. solo color) → recopila imágenes de los
    //    variants que coincidan con lo seleccionado hasta ahora.
    if (hasVariants && Object.keys(selections).length > 0) {
      const seenUrls = new Set();
      const partialImgs = [];

      variants
        .filter(v =>
          Object.entries(selections).every(([slug, valId]) =>
            (v.attributes || []).some(a =>
              slugify(getAttrTypeName(a)) === slug &&
              a.attribute_value_id === valId
            )
          )
        )
        .forEach(v =>
          getVariantImageUrls(v).forEach(url => {
            if (!seenUrls.has(url)) {
              seenUrls.add(url);
              partialImgs.push(url);
            }
          })
        );

      if (partialImgs.length)
        return [...new Set([...partialImgs, ...gallery])].filter(Boolean);
    }

    // 3. Sin selección → galería del producto; si está vacía usa las imágenes
    //    del primer variante como preview (no mezcla todos los colores).
    const base = [...new Set([product.main_image, ...gallery])].filter(Boolean);
    if (base.length) return base;

    return getVariantImageUrls(variants[0] ?? {});
  }, [product, selectedVariant, selections, hasVariants, variants]);

  // Resetear imagen seleccionada cuando cambia cualquier selección de atributo
  const selectionKey = Object.entries(selections).sort().map(([k, v]) => `${k}:${v}`).join("|");
  useEffect(() => {
    setSelectedImg("");
  }, [selectionKey]);

  // Imagen activa
  const activeImg = images.includes(selectedImg) ? selectedImg : (images[0] || "");

  // ── Preload sin memory leak ────────────────────────────────────────────────
  useEffect(() => {
    images.slice(0, 5).forEach(url => {
      const img = new Image();
      img.src = optimizeUrl(url, 800);
    });
  }, [images]);

  // Auto-scroll al thumb activo
  useEffect(() => {
    if (!thumbsRef.current) return;
    const active = thumbsRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeImg]);

  // ── Precios ────────────────────────────────────────────────────────────────
  const { priceOriginal, priceFinal, hasDiscount, stock, priceRange } = useMemo(() => {
    // ✅ FIX: product.final_price ya viene de applyDiscount(), así que
    // siempre refleja el precio con descuento correcto para productos simples.
    const basePrice = Number(product?.sale_price) || 0;
    const finalBase = Number(product?.final_price) || basePrice;

    if (selectedVariant) {
      const vPrice = Number(selectedVariant.sale_price) || basePrice;
      // Para variantes: mostramos el precio de la variante.
      // Si el producto padre tiene descuento y la variante no tiene precio propio,
      // usamos finalBase (con descuento) como precio de la variante.
      const effectiveVariantPrice = selectedVariant.sale_price != null
        ? vPrice
        : finalBase;
      return {
        priceOriginal: basePrice,
        priceFinal:    effectiveVariantPrice,
        hasDiscount:   effectiveVariantPrice < basePrice,
        stock:         Number(selectedVariant.stock) || 0,
        priceRange:    null,
      };
    }
    if (hasVariants) {
      const prices = variants.map(v => Number(v.sale_price) || basePrice).filter(Boolean);
      const min = prices.length ? Math.min(...prices) : basePrice;
      const max = prices.length ? Math.max(...prices) : basePrice;
      return {
        priceOriginal: max, priceFinal: min, hasDiscount: false, stock: 0,
        priceRange: min !== max ? `$${min.toLocaleString()} – $${max.toLocaleString()}` : null,
      };
    }
    return {
      priceOriginal: basePrice, priceFinal: finalBase,
      hasDiscount: finalBase > 0 && finalBase < basePrice,
      stock: Number(product?.stock) || 0, priceRange: null,
    };
  }, [selectedVariant, hasVariants, variants, product]);

  // ── Disponibilidad en tiempo real ─────────────────────────────────────────
  const avail = useAvailability(product?.id ?? null, selectedVariant?.id ?? null);
  const effectiveAvailable = avail.available ?? stock;

  // ── Cart ───────────────────────────────────────────────────────────────────
  const cartKey = selectedVariant
    ? `${product?.id}-v${selectedVariant.id}`
    : String(product?.id ?? "");

  const isInCart        = cart.some(item => item.cartKey === cartKey);
  const isFullySelected = !hasVariants || Object.keys(selections).length === attributeTypes.length;
  const isOnDemand      = product?.fulfillment_mode === "on_demand";
  const isHybrid        = product?.fulfillment_mode === "hybrid";
  const canAdd          = isFullySelected && (effectiveAvailable > 0 || isOnDemand || isHybrid);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    setStockError(null);

    if (avail.available !== null && quantity > avail.available) {
      const n = avail.available;
      setStockError(
        n <= 0
          ? "Este producto ya no tiene stock disponible."
          : `Solo ${n} unidad${n === 1 ? "" : "es"} disponible${n === 1 ? "" : "s"}. Ajusta la cantidad.`
      );
      return;
    }

    // Para variantes: calculamos precio original y precio con descuento por separado.
    // variantOriginalPrice → base para calcular discountAmount en checkout.
    // variantPrice         → precio efectivo que paga el cliente (con descuento si aplica).
    let variantOriginalPrice;
    let variantFinalPrice;
    if (selectedVariant) {
      variantOriginalPrice = selectedVariant.sale_price != null
        ? Number(selectedVariant.sale_price)
        : Number(product.sale_price) || 0;

      variantFinalPrice = variantOriginalPrice;
      if (product.discount_info && variantOriginalPrice > 0) {
        const d   = product.discount_info;
        const cut = d.type === "percentage"
          ? (variantOriginalPrice * Number(d.value)) / 100
          : Number(d.value);
        const maxCut = d.max_discount_amount ? Number(d.max_discount_amount) : Infinity;
        variantFinalPrice = Math.max(0, Math.round(variantOriginalPrice - Math.min(cut, maxCut)));
      }
    }

    const payload = {
      ...product,
      cartKey,
      ...(selectedVariant && {
        variantId:            selectedVariant.id,
        variantSku:           selectedVariant.sku,
        variantPrice:         variantFinalPrice,
        variantOriginalPrice: variantOriginalPrice,
        stock:                selectedVariant.stock,
        variantLabel:         (selectedVariant.attributes || []).map(a => a.display_value).join(" / "),
        variantAttributes:    selectedVariant.attributes || [],
      }),
    };
    toggleCart(payload, quantity);
  }, [product, selectedVariant, quantity, cartKey, toggleCart, avail.available]);

  const handleSelect = useCallback((slug, valueId) => {
    setSelections(prev => {
      if (prev[slug] === valueId) {
        const next = { ...prev }; delete next[slug]; return next;
      }
      return { ...prev, [slug]: valueId };
    });
    setQuantity(1);
  }, []);

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={28} />
      <p className="text-[10px] font-black tracking-[0.3em] text-slate-300 uppercase">Cargando</p>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <p className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">
        Producto no encontrado
      </p>
      <Link to="/productos"
        className="flex items-center gap-2 text-xs font-black tracking-widest text-blue-600 uppercase">
        <ArrowLeft size={14} /> Volver a la tienda
      </Link>
    </div>
  );

  const discountPercent = hasDiscount && priceOriginal > 0
    ? Math.round(((priceOriginal - priceFinal) / priceOriginal) * 100)
    : 0;

  const partiallySelectedVariants = hasVariants && Object.keys(selections).length > 0
    ? variants.filter(v =>
        Object.entries(selections).every(([slug, valId]) =>
          (v.attributes || []).some(a =>
            slugify(getAttrTypeName(a)) === slug && a.attribute_value_id === valId
          )
        )
      )
    : [];

  const partialStock = partiallySelectedVariants.reduce(
    (sum, v) => sum + (Number(v.stock) || 0), 0
  );

  return (
    <div className="bg-white min-h-screen pb-20 font-sans text-slate-900 selection:bg-blue-100">

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setZoomed(false)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 cursor-zoom-out"
          >
            <button
              onClick={() => setZoomed(false)}
              className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20
                rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X size={18} />
            </button>
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              src={optimizeUrl(activeImg, 1600)}
              alt={product.name}
              className="max-w-full max-h-full object-contain rounded-2xl"
              onClick={e => e.stopPropagation()}
            />
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((img, idx) => (
                  <button
                    key={img || idx}
                    onClick={e => { e.stopPropagation(); setSelectedImg(img); }}
                    className={`w-2 h-2 rounded-full transition-all duration-200
                      ${activeImg === img ? "bg-white scale-125" : "bg-white/30 hover:bg-white/60"}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-6 pt-8">

        {/* ── Breadcrumb ── */}
        <motion.nav
          variants={fadeUp} initial="hidden" animate="visible"
          className="flex items-center gap-2.5 text-[10px] font-black
            text-slate-400 mb-10 uppercase tracking-[0.2em]"
        >
          <Link to="/" className="hover:text-blue-600 transition-colors">Inicio</Link>
          <ChevronRight size={10} className="text-slate-200" />
          <Link to="/productos"
            className="hover:text-blue-600 transition-colors flex items-center gap-1 group">
            <ArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
            Tienda
          </Link>
          {product.category_name && (
            <>
              <ChevronRight size={10} className="text-slate-200" />
              <Link
                to={`/productos/categoria/${slugify(product.category_name)}`}
                className="hover:text-blue-600 transition-colors"
              >
                {product.category_name}
              </Link>
            </>
          )}
          <ChevronRight size={10} className="text-slate-200" />
          <span className="text-slate-700 truncate max-w-[140px]">{product.name}</span>
        </motion.nav>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-start">

          {/* ── Galería ─────────────────────────────────────────────────────── */}
          <motion.div
            variants={stagger} initial="hidden" animate="visible"
            className="lg:col-span-5 space-y-4"
          >
            <motion.div variants={fadeUp} className="relative">
              {hasDiscount && (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-white/90
                  backdrop-blur-md text-slate-900 px-3 py-1 rounded-2xl text-[10px] font-black
                  shadow-sm border border-slate-100">
                  <span className="text-blue-600">−{discountPercent}%</span>
                </div>
              )}

              <AnimatePresence>
                {isFullySelected && selectedVariant && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="absolute top-4 right-14 z-20 bg-slate-900/70 backdrop-blur-md
                      text-white px-2.5 py-1 rounded-xl text-[9px] font-black tracking-wider
                      max-w-[160px] truncate"
                  >
                    {(selectedVariant.attributes || []).map(a => a.display_value).join(" · ")}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setZoomed(true)}
                className="absolute top-4 right-4 z-20 p-2.5 rounded-xl bg-white/80 backdrop-blur-md
                  border border-slate-100 text-slate-500 hover:text-slate-900 transition-all
                  hover:bg-white hover:scale-105 active:scale-95 shadow-sm"
              >
                <ZoomIn size={16} strokeWidth={2} />
              </button>

              <div
                className="relative aspect-square bg-[#F5F5F7] rounded-[2.5rem] overflow-hidden
                  border border-slate-100/80 cursor-zoom-in"
                onClick={() => setZoomed(true)}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImg}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    src={optimizeUrl(activeImg, 800)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
              </div>
            </motion.div>

            {images.length > 1 && (
              <motion.div
                variants={fadeUp}
                ref={thumbsRef}
                className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar"
              >
                {images.map((img, idx) => (
                  <Thumb
                    key={img || idx} img={img} idx={idx}
                    active={activeImg === img}
                    onClick={() => setSelectedImg(img)}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* ── Info + acciones ──────────────────────────────────────────────── */}
          <motion.div
            variants={stagger} initial="hidden" animate="visible"
            className="lg:col-span-5 flex flex-col pt-2 space-y-6"
          >
            <motion.div variants={fadeUp}>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-600
                bg-blue-50 px-2.5 py-1 rounded-lg">
                {product.category_name || "Premium"}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-[clamp(2rem,6vw,3.5rem)] font-black text-slate-900
                leading-[0.9] uppercase italic tracking-tighter"
            >
              {product.name}
            </motion.h1>

            <motion.div variants={fadeUp} className="flex items-baseline gap-3">
              {hasVariants && !isFullySelected ? (
                <span className="text-3xl font-black text-slate-900 tracking-tighter">
                  {priceRange || `$${priceFinal.toLocaleString()}`}
                </span>
              ) : (
                <>
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">
                    ${priceFinal.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-base text-slate-300 line-through font-bold">
                      ${priceOriginal.toLocaleString()}
                    </span>
                  )}
                </>
              )}
            </motion.div>

            {hasVariants && attributeTypes.length > 0 && (
              <motion.div
                variants={fadeUp}
                className="space-y-4 border border-slate-100 rounded-2xl p-5 bg-slate-50/40"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Selecciona una opción
                </p>

                {attributeTypes.map(at => (
                  <AttributeSelector
                    key={at.slug}
                    attrType={at.name}
                    values={at.values}
                    selected={selections[at.slug]}
                    onSelect={(valId) => handleSelect(at.slug, valId)}
                    availableValueIds={availableValueIds}
                  />
                ))}

                <AnimatePresence mode="wait">
                  {isFullySelected && selectedVariant ? (
                    <motion.div key="stock-ok"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex flex-wrap items-center gap-2"
                    >
                      {isOnDemand ? (
                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-purple-600">
                          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                          {product.supplier_lead_time_days
                            ? `Bajo pedido · llega en ~${product.supplier_lead_time_days} días`
                            : "Bajo pedido"}
                        </span>
                      ) : isHybrid && effectiveAvailable <= 0 ? (
                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-blue-500">
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                          Sin stock físico · disponible por pedido
                        </span>
                      ) : (
                        <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider
                          ${effectiveAvailable > 0 ? (avail.isLow ? "text-amber-600" : "text-emerald-600") : "text-red-400"}`}>
                          <span className={`w-2 h-2 rounded-full ${effectiveAvailable > 0 ? (avail.isLow ? "bg-amber-400 animate-pulse" : "bg-emerald-500 animate-pulse") : "bg-red-400"}`} />
                          {effectiveAvailable > 0
                            ? avail.isLow
                              ? `Últimas ${effectiveAvailable} unidades`
                              : `${effectiveAvailable} disponibles`
                            : "Sin stock"
                          }
                        </span>
                      )}
                    </motion.div>
                  ) : isFullySelected && !selectedVariant ? (
                    <motion.p key="no-combo"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-[10px] font-bold text-amber-500 uppercase tracking-wider"
                    >
                      Combinación no disponible
                    </motion.p>
                  ) : Object.keys(selections).length > 0 && partiallySelectedVariants.length > 0 ? (
                    <motion.div key="partial-stock"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider
                        ${isOnDemand || partialStock > 0 ? "text-slate-400" : "text-red-400"}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isOnDemand || partialStock > 0 ? "bg-slate-300" : "bg-red-400"}`} />
                      {isOnDemand
                        ? `${partiallySelectedVariants.length} ${partiallySelectedVariants.length === 1 ? "opción disponible" : "opciones disponibles"} · elige la talla`
                        : partialStock > 0
                          ? `${partiallySelectedVariants.length} ${partiallySelectedVariants.length === 1 ? "opción disponible" : "opciones disponibles"} · elige la talla`
                          : "Sin stock en esta opción"
                      }
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            )}

            {!hasVariants && (
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
                {isOnDemand ? (
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-purple-600">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    {product.supplier_lead_time_days
                      ? `Bajo pedido · llega en ~${product.supplier_lead_time_days} días`
                      : "Bajo pedido"}
                  </span>
                ) : isHybrid && effectiveAvailable <= 0 ? (
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-blue-500">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    Sin stock físico · disponible por pedido
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider
                    ${effectiveAvailable > 0 ? (avail.isLow ? "text-amber-600" : "text-emerald-600") : "text-red-400"}`}>
                    <span className={`w-2 h-2 rounded-full ${effectiveAvailable > 0 ? (avail.isLow ? "bg-amber-400 animate-pulse" : "bg-emerald-500 animate-pulse") : "bg-red-400"}`} />
                    {effectiveAvailable > 0
                      ? avail.isLow
                        ? `Últimas ${effectiveAvailable} unidades`
                        : `${effectiveAvailable} disponibles`
                      : "Sin stock"
                    }
                  </span>
                )}
              </motion.div>
            )}

            {product.description && (
              <motion.div variants={fadeUp} className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Info size={12} className="text-blue-500" /> Detalles
                </div>
                <p className="text-slate-500 leading-relaxed text-sm font-medium">
                  {product.description}
                </p>
              </motion.div>
            )}

            {/* Fulfillment notice */}
            {(isOnDemand || isHybrid) && (
              <motion.div variants={fadeUp} className="space-y-2">
                <div className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border ${
                  isOnDemand
                    ? "bg-purple-50 border-purple-200"
                    : "bg-blue-50 border-blue-200"
                }`}>
                  <Truck size={16} className={`flex-shrink-0 mt-0.5 ${isOnDemand ? "text-purple-600" : "text-blue-600"}`} />
                  <div className="space-y-0.5">
                    <p className={`text-xs font-black uppercase tracking-wider ${isOnDemand ? "text-purple-700" : "text-blue-700"}`}>
                      {isOnDemand ? "Producto bajo pedido" : "Disponible en stock o bajo pedido"}
                    </p>
                    {product.supplier_lead_time_days && (
                      <p className={`text-[11px] font-medium flex items-center gap-1 ${isOnDemand ? "text-purple-600" : "text-blue-600"}`}>
                        <Clock size={10} />
                        Tiempo de entrega estimado: <strong>{product.supplier_lead_time_days} días hábiles</strong>
                      </p>
                    )}
                  </div>
                </div>

                {product.requires_advance_payment && (
                  <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                    <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                        Requiere anticipo
                      </p>
                      <p className="text-[11px] text-amber-600 mt-0.5">
                        Este producto requiere un pago anticipado al proveedor antes de ser procesado.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <motion.div variants={fadeUp} className="flex flex-col gap-3">
              <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 border border-slate-100">
                <span className="pl-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Cantidad
                </span>
                <div className="flex items-center gap-4 bg-white rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || !canAdd}
                    className="p-2 hover:text-blue-600 disabled:opacity-20 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-black text-sm w-4 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(effectiveAvailable, q + 1))}
                    disabled={quantity >= effectiveAvailable || !canAdd}
                    className="p-2 hover:text-blue-600 disabled:opacity-20 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {stockError && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border
                  bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20">
                  <AlertCircle size={13} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">{stockError}</p>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={!canAdd}
                className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-[0.25em]
                  flex items-center justify-center gap-3 transition-all duration-300 active:scale-95
                  ${isInCart
                    ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                    : !canAdd
                      ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-blue-500/10 hover:shadow-blue-500/25"
                  }`}
              >
                <AnimatePresence mode="wait">
                  {isInCart ? (
                    <motion.span key="in"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2.5">
                      <Check size={16} /> EN BOLSA
                    </motion.span>
                  ) : !canAdd ? (
                    <motion.span key="no"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2.5">
                      <ShoppingBag size={16} />
                      {!isFullySelected && hasVariants ? "ELIGE UNA OPCIÓN" : isOnDemand ? "BAJO PEDIDO" : "SIN STOCK"}
                    </motion.span>
                  ) : (
                    <motion.span key="add"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2.5">
                      <ShoppingBag size={16} /> AÑADIR A LA BOLSA
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <button
                onClick={() => toggleFavorite(product)}
                className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-[0.25em]
                  flex items-center justify-center gap-3 border-2 transition-all duration-300 active:scale-95
                  ${fav
                    ? "border-red-200 bg-red-50 text-red-500"
                    : "border-slate-100 bg-white text-slate-400 hover:border-red-200 hover:text-red-400"
                  }`}
              >
                <Heart size={15} fill={fav ? "currentColor" : "none"} />
                {fav ? "GUARDADO EN FAVORITOS" : "GUARDAR EN FAVORITOS"}
              </button>

              {isInCart && selectedVariant && (
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {(selectedVariant.attributes || []).map(a => a.display_value).join(" / ")} · en tu bolsa
                </p>
              )}
            </motion.div>

            <motion.div variants={fadeUp} className="h-px bg-slate-50" />

            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
              <Badge icon={<Package    size={14} />} text="Envío"     />
              <Badge icon={<ShieldCheck size={14} />} text="Garantía" />
              <Badge icon={<Tag        size={14} />} text="Original"  />
            </motion.div>
          </motion.div>
        </div>

        <ProductReviewsSection productId={id} productName={product.name} />
      </div>
    </div>
  );
}