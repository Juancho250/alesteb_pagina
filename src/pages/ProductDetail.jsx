// src/pages/ProductDetail.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ShoppingBag,
  Percent,
  Package,
  ShieldCheck,
  Tag,
  Plus,
  Minus,
  Info,
} from "lucide-react";
import api from "../services/api";

export default function ProductDetail({ cart = [], toggleCart = () => {} }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState("");
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        if (!alive) return;

        // soporta: {..producto..} o {product:{..}} o {data:{..}}
        const resolved = data?.product || data?.data || data;
        setProduct(resolved || null);
      })
      .catch(() => {
        if (alive) setProduct(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const images = useMemo(() => {
    if (!product) return [];
    const gallery = product.images?.map((i) => i.url) || [];
    return [...new Set([product.main_image, ...gallery])].filter(Boolean);
  }, [product]);

  useEffect(() => {
    if (images.length > 0) setActiveImg(images[0]);
  }, [images]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-20 text-center font-bold italic">
        PRODUCTO NO ENCONTRADO
      </div>
    );
  }

  const isInCart = cart.some((item) => item.id === product.id);

  // precios
  const priceOriginal = Number(product.price) || 0;
  const priceFinalRaw = Number(product.final_price) || priceOriginal;
  const hasDiscount = priceFinalRaw > 0 && priceFinalRaw < priceOriginal;
  const priceFinal = hasDiscount ? priceFinalRaw : priceOriginal;
  const discountAmount = priceOriginal - priceFinal;
  const discountPercent = hasDiscount
    ? Math.round((discountAmount / priceOriginal) * 100)
    : 0;

  const stock = Number(product.stock) || 0;

  return (
    <div className="bg-white min-h-screen pb-12 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto px-6 pt-12">
        {/* volver */}
        <Link
          to="/productos"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all mb-8 group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            Volver a la colección
          </span>
        </Link>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* galería */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-[#f5f5f7] rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100">
              {hasDiscount && (
                <div className="absolute top-6 left-6 z-10 bg-red-600 text-white px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest flex items-center gap-1.5 shadow-xl animate-pulse">
                  <Percent size={12} strokeWidth={3} /> {discountPercent}% OFF
                </div>
              )}
              {activeImg && (
                <img
                  src={activeImg}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(img)}
                  className={`min-w-[80px] h-[80px] rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImg === img
                      ? "border-slate-900 scale-95"
                      : "border-transparent opacity-40 hover:opacity-100"
                  }`}
                  aria-label={`Ver imagen ${idx + 1}`}
                >
                  <img
                    src={img}
                    className="w-full h-full object-cover"
                    alt={`Vista ${idx + 1}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* info */}
          <div className="flex flex-col">
            <div className="mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                {product.category || product.category_name || "Premium Collection"}
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 leading-tight uppercase italic tracking-tight">
              {product.name}
            </h1>

            {/* precios */}
            <div className="flex flex-col mb-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                {hasDiscount ? "Precio Especial" : "Precio Unitario"}
              </span>
              <div className="flex items-center gap-5">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                  ${priceFinal.toLocaleString()}
                </span>

                {hasDiscount && (
                  <div className="flex flex-col">
                    <span className="text-lg text-slate-400 line-through decoration-red-500/40 font-medium">
                      ${priceOriginal.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-black text-red-600 flex items-center gap-1 mt-1 bg-red-50 px-2 py-0.5 rounded-md w-fit">
                      <Tag size={10} strokeWidth={3} /> AHORRAS $
                      {discountAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* descripción */}
            <div className="mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Info size={14} /> Descripción
              </h3>
              <p className="text-slate-600 leading-relaxed text-base">
                {product.description ||
                  "No hay descripción disponible para este producto."}
              </p>
            </div>

            {/* detalles */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">
                  Disponibilidad
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {stock > 0 ? `${stock} Unidades` : "Agotado"}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">
                  Marca / Colección
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {product.brand || "Exclusivo"}
                </span>
              </div>
            </div>

            {/* cantidad */}
            <div className="mb-8">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">
                Seleccionar Cantidad
              </span>
              <div className="flex items-center bg-slate-100 w-fit rounded-2xl p-1.5 border border-slate-200">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-900 disabled:opacity-20"
                  disabled={quantity <= 1}
                  aria-label="Disminuir cantidad"
                >
                  <Minus size={18} strokeWidth={3} />
                </button>

                <span className="w-14 text-center font-black text-xl">
                  {quantity}
                </span>

                <button
                  onClick={() => setQuantity((q) => Math.min(stock || 99, q + 1))}
                  className="p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-900 disabled:opacity-20"
                  disabled={quantity >= (stock || 99)}
                  aria-label="Aumentar cantidad"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* acción */}
            <button
              onClick={() => toggleCart(product, quantity)}
              disabled={stock <= 0}
              className={`w-full py-6 rounded-[1.5rem] font-black text-xs tracking-[0.2em] flex items-center justify-center gap-4 transition-all active:scale-[0.97] shadow-2xl ${
                isInCart
                  ? "bg-emerald-500 text-white shadow-emerald-200"
                  : stock <= 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-slate-900 text-white hover:bg-black hover:-translate-y-1 shadow-slate-200"
              }`}
            >
              {isInCart ? (
                <>
                  <Check size={20} strokeWidth={4} /> AÑADIDO CON ÉXITO
                </>
              ) : (
                <>
                  <ShoppingBag size={20} strokeWidth={2.5} />{" "}
                  {stock <= 0 ? "SIN STOCK" : "AÑADIR A LA BOLSA"}
                </>
              )}
            </button>

            {/* badges */}
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Package size={14} className="text-slate-900" />
                </div>
                Envío prioritario
              </div>
              <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <ShieldCheck size={14} className="text-slate-900" />
                </div>
                Garantía Original
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
