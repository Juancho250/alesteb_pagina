// src/pages/ProductDetail.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Check, ShoppingBag, Package,
  ShieldCheck, Tag, Plus, Minus, Info, Loader2, ChevronRight,
} from "lucide-react";
import api from "../services/api";
import { useCart } from "../context/CartContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const optimizeUrl = (url, width = 800) => {
  if (!url) return "https://via.placeholder.com/800x1000";
  return url.includes("/upload/")
    ? url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`)
    : url;
};

// ─── Sub-componentes de atributos ─────────────────────────────────────────────

function ColorSwatch({ value, isSelected, isDisabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={value.display_value}
      className={`
        relative w-9 h-9 rounded-full border-2 transition-all duration-200 focus:outline-none
        ${isSelected ? "border-slate-900 scale-110 shadow-md" : "border-slate-200 hover:border-slate-400"}
        ${isDisabled ? "opacity-25 cursor-not-allowed" : "cursor-pointer"}
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
      className={`
        px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all duration-200
        ${isSelected
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
        }
        ${isDisabled ? "opacity-25 cursor-not-allowed line-through" : "cursor-pointer"}
      `}
    >
      {value.display_value}
    </button>
  );
}

/**
 * Selector de un tipo de atributo completo (Color, Talla, etc.)
 * availableValueIds: Set de IDs que son seleccionables dado el estado actual
 */
function AttributeSelector({ attrType, values, selected, onSelect, availableValueIds }) {
  const isColor = attrType.toLowerCase().includes("color");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {attrType}
        </span>
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
              key={v.attribute_value_id}
              value={v}
              isSelected={selected === v.attribute_value_id}
              isDisabled={!isAvailable}
              onClick={() => onSelect(v.attribute_value_id)}
            />
          ) : (
            <AttributePill
              key={v.attribute_value_id}
              value={v}
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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id }             = useParams();
  const { cart, toggleCart } = useCart();

  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [selectedImg, setSelectedImg] = useState("");
  const [quantity, setQuantity] = useState(1);
  // { [attributeSlug]: attributeValueId }
  const [selections, setSelections] = useState({});

  // ── Fetch ─────────────────────────────────────────────────────────────────
  // getById ya devuelve variants y images embebidos en data.data
  useEffect(() => {
    let alive = true;
    window.scrollTo(0, 0);
    setLoading(true);
    setSelections({});
    setQuantity(1);

    api.get(`/products/${id}`)
      .then(({ data }) => {
        if (!alive) return;
        // El controller devuelve { success, data: { ...product, variants, images } }
        const resolved = data?.data || data?.product || data;
        setProduct(resolved || null);

        // Si solo hay una variante, preseleccionarla
        const variants = resolved?.variants || [];
        if (variants.length === 1) {
          const auto = {};
          (variants[0].attributes || []).forEach(a => {
            // El backend usa 'type' como clave de tipo (ver getById)
            auto[slugify(a.type)] = a.attribute_value_id;
          });
          setSelections(auto);
        }
      })
      .catch(() => { if (alive) setProduct(null); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [id]);

  // ── Variantes del producto ────────────────────────────────────────────────
  const variants = product?.variants || [];
  const hasVariants = variants.length > 0;

  // ── Tipos de atributo únicos extraídos de todas las variantes ─────────────
  // Usamos 'type' (getById) como slug-friendly key para las selections
  const attributeTypes = useMemo(() => {
    const map = new Map();
    variants.forEach(v => {
      (v.attributes || []).forEach(a => {
        const slug = slugify(a.type);
        if (!map.has(slug)) {
          map.set(slug, { slug, name: a.type, values: new Map() });
        }
        const attrType = map.get(slug);
        if (!attrType.values.has(a.attribute_value_id)) {
          attrType.values.set(a.attribute_value_id, {
            attribute_value_id: a.attribute_value_id,
            value:         a.value,
            display_value: a.display_value,
            hex_color:     a.hex_color,
          });
        }
      });
    });
    return [...map.values()].map(at => ({
      ...at,
      values: [...at.values.values()],
    }));
  }, [variants]);

  // ── Variante que corresponde a la selección actual ─────────────────────────
  const selectedVariant = useMemo(() => {
    if (!hasVariants || attributeTypes.length === 0) return null;
    const selectionValues = Object.values(selections);
    if (selectionValues.length < attributeTypes.length) return null;

    return variants.find(v => {
      const ids = new Set((v.attributes || []).map(a => a.attribute_value_id));
      return selectionValues.length === ids.size
        && selectionValues.every(id => ids.has(id));
    }) || null;
  }, [variants, selections, attributeTypes, hasVariants]);

  // ── IDs disponibles dado el estado de selección actual ────────────────────
  // Una variante es "compatible" si coincide con TODOS los atributos ya
  // seleccionados. Todos los IDs de esas variantes son seleccionables.
  const availableValueIds = useMemo(() => {
    const set = new Set();
    variants.forEach(v => {
      const variantIds = new Set((v.attributes || []).map(a => a.attribute_value_id));
      const compatible = Object.entries(selections).every(([slug, valId]) => {
        const match = (v.attributes || []).find(a => slugify(a.type) === slug);
        return match?.attribute_value_id === valId;
      });
      if (compatible) variantIds.forEach(id => set.add(id));
    });
    return set;
  }, [variants, selections]);

  // ── Precios ───────────────────────────────────────────────────────────────
  const { priceOriginal, priceFinal, hasDiscount, stock, priceRange } = useMemo(() => {
    const basePrice = Number(product?.sale_price) || 0;
    const finalBase = Number(product?.final_price) || basePrice;

    if (selectedVariant) {
      const vPrice  = Number(selectedVariant.sale_price) || basePrice;
      return {
        priceOriginal: basePrice,
        priceFinal:    vPrice,
        hasDiscount:   finalBase < basePrice && Number(selectedVariant.sale_price) == null
          ? true
          : vPrice < basePrice,
        stock:         Number(selectedVariant.stock) || 0,
        priceRange:    null,
      };
    }

    if (hasVariants) {
      const prices = variants
        .map(v => Number(v.sale_price) || basePrice)
        .filter(Boolean);
      const min = prices.length ? Math.min(...prices) : basePrice;
      const max = prices.length ? Math.max(...prices) : basePrice;
      return {
        priceOriginal: max,
        priceFinal:    min,
        hasDiscount:   false,
        stock:         0,
        priceRange:    min !== max
          ? `$${min.toLocaleString()} – $${max.toLocaleString()}`
          : null,
      };
    }

    return {
      priceOriginal: basePrice,
      priceFinal:    finalBase,
      hasDiscount:   finalBase > 0 && finalBase < basePrice,
      stock:         Number(product?.stock) || 0,
      priceRange:    null,
    };
  }, [selectedVariant, hasVariants, variants, product]);

  // ── Imágenes ──────────────────────────────────────────────────────────────
  const images = useMemo(() => {
    if (!product) return [];
    const productGallery = (product.images || []).map(i => i.url);
    const variantGallery = selectedVariant?.images?.length
      ? selectedVariant.images.map(i => i.url)
      : [];
    const ordered = variantGallery.length
      ? [...variantGallery, ...productGallery]
      : [product.main_image, ...productGallery];
    return [...new Set(ordered)].filter(Boolean);
  }, [product, selectedVariant]);

  const activeImg = images.includes(selectedImg) ? selectedImg : (images[0] || "");

  // Reset imagen al cambiar de variante
  useEffect(() => { setSelectedImg(""); }, [selectedVariant?.id]);

  // Preload
  useEffect(() => {
    images.forEach(url => { const img = new Image(); img.src = optimizeUrl(url); });
  }, [images]);

  // ── Cart ──────────────────────────────────────────────────────────────────
  const cartKey = selectedVariant
    ? `${product?.id}-v${selectedVariant.id}`
    : String(product?.id ?? "");

  const isInCart = cart.some(item => item.cartKey === cartKey);

  const isFullySelected = !hasVariants || Object.keys(selections).length === attributeTypes.length;
  const canAdd = isFullySelected && stock > 0;

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    const payload = {
      ...product,
      cartKey,
      // Sobreescribir con datos de la variante si aplica
      ...(selectedVariant && {
        variantId:    selectedVariant.id,
        variantSku:   selectedVariant.sku,
        final_price:  selectedVariant.sale_price || product.final_price || product.sale_price,
        stock:        selectedVariant.stock,
        variantLabel: (selectedVariant.attributes || [])
          .map(a => a.display_value).join(" / "),
      }),
    };
    toggleCart(payload, quantity);
  }, [product, selectedVariant, quantity, cartKey, toggleCart]);

  const handleSelect = useCallback((slug, valueId) => {
    setSelections(prev => {
      if (prev[slug] === valueId) {
        const next = { ...prev };
        delete next[slug];
        return next;
      }
      return { ...prev, [slug]: valueId };
    });
    setQuantity(1);
  }, []);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
      <Loader2 className="animate-spin text-blue-600" size={32} />
      <p className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">Cargando</p>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <p className="text-2xl font-black text-slate-900">Producto no encontrado</p>
      <Link to="/productos" className="text-blue-600 font-bold underline">Volver a la tienda</Link>
    </div>
  );

  return (
    <div className="bg-white min-h-screen pb-20 font-sans text-slate-900 selection:bg-blue-100">
      <div className="max-w-5xl mx-auto px-6 pt-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
          <Link to="/" className="hover:text-blue-600 transition-colors">Inicio</Link>
          <ChevronRight size={10} className="text-slate-300" />
          <Link to="/productos" className="hover:text-blue-600 transition-colors flex items-center gap-1 group">
            <ArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
            Tienda
          </Link>
          {product.category_name && (
            <>
              <ChevronRight size={10} className="text-slate-300" />
              <span className="text-slate-500">{product.category_name}</span>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 items-start">

          {/* ── Galería ───────────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square bg-[#F5F5F7] rounded-[2rem] overflow-hidden border border-slate-50">
              {hasDiscount && (
                <div className="absolute top-4 left-4 z-10 bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest shadow-lg">
                  OFERTA
                </div>
              )}
              {/* Badge de variante activa */}
              {selectedVariant && (
                <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md text-slate-700 px-3 py-1 rounded-full text-[9px] font-black tracking-widest shadow-sm border border-slate-100">
                  {(selectedVariant.attributes || []).map(a => a.display_value).join(" · ")}
                </div>
              )}
              <img
                key={activeImg}
                src={optimizeUrl(activeImg, 800)}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImg(img)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200
                      ${activeImg === img
                        ? "ring-2 ring-blue-600 scale-90 opacity-100"
                        : "opacity-30 hover:opacity-100 hover:scale-95"
                      }`}
                  >
                    <img src={optimizeUrl(img, 160)} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info + acciones ───────────────────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col pt-2 space-y-6">

            {/* Badge categoría */}
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50/50 px-2 py-1 rounded">
                {product.category_name || "Premium"}
              </span>
            </div>

            {/* Nombre */}
            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight uppercase italic tracking-tighter">
              {product.name}
            </h1>

            {/* Precio */}
            <div className="flex items-baseline gap-3">
              {hasVariants && !isFullySelected ? (
                <span className="text-2xl font-black text-slate-900 tracking-tighter">
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
            </div>

            {/* ── Selectores de variante ── */}
            {hasVariants && attributeTypes.length > 0 && (
              <div className="space-y-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/40">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
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

                {/* Feedback de disponibilidad */}
                {isFullySelected && selectedVariant && (
                  <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider
                    ${stock > 0 ? "text-emerald-600" : "text-red-400"}`}>
                    <div className={`w-2 h-2 rounded-full ${stock > 0 ? "bg-emerald-500" : "bg-red-400"}`} />
                    {stock > 0 ? `${stock} disponibles` : "Sin stock"}
                  </div>
                )}
                {isFullySelected && !selectedVariant && (
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                    Combinación no disponible
                  </p>
                )}
              </div>
            )}

            {/* Stock — producto simple */}
            {!hasVariants && (
              <div className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider
                ${stock > 0 ? "text-emerald-600" : "text-red-400"}`}>
                <div className={`w-2 h-2 rounded-full ${stock > 0 ? "bg-emerald-500" : "bg-red-400"}`} />
                {stock > 0 ? `${stock} disponibles` : "Sin stock"}
              </div>
            )}

            {/* Descripción */}
            {product.description && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Info size={12} className="text-blue-500" /> Detalles
                </div>
                <p className="text-slate-500 leading-relaxed text-sm font-medium">
                  {product.description}
                </p>
              </div>
            )}

            {/* Cantidad + Agregar */}
            <div className="flex flex-col gap-3">
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
                    onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                    disabled={quantity >= stock || !canAdd}
                    className="p-2 hover:text-blue-600 disabled:opacity-20 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!canAdd}
                className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95
                  ${isInCart
                    ? "bg-emerald-500 text-white"
                    : !canAdd
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-blue-500/10"
                  }`}
              >
                {isInCart ? (
                  <><Check size={16} /> EN BOLSA</>
                ) : !canAdd ? (
                  <><ShoppingBag size={16} /> {!isFullySelected && hasVariants ? "ELIGE UNA OPCIÓN" : "SIN STOCK"}</>
                ) : (
                  <><ShoppingBag size={16} /> AÑADIR</>
                )}
              </button>

              {isInCart && selectedVariant && (
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {(selectedVariant.attributes || []).map(a => a.display_value).join(" / ")} · en tu bolsa
                </p>
              )}
            </div>

            {/* Badges */}
            <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-6">
              <Badge icon={<Package size={14} />} text="Envío" />
              <Badge icon={<ShieldCheck size={14} />} text="Garantía" />
              <Badge icon={<Tag size={14} />} text="Original" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers internos ─────────────────────────────────────────────────────────
function slugify(str = "") {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function Badge({ icon, text }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-50/30 border border-slate-50">
      <div className="text-slate-400">{icon}</div>
      <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">{text}</span>
    </div>
  );
}