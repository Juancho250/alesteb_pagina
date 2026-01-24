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
    api.get(`/products/${id}`)
      .then(({ data }) => {
        if (!alive) return;
        const resolved = data?.product || data?.data || data;
        setProduct(resolved || null);
      })
      .catch(() => { if (alive) setProduct(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-20 text-center font-black italic text-slate-400 tracking-tighter">
        PRODUCTO NO ENCONTRADO
      </div>
    );
  }

  const isInCart = cart.some((item) => item.id === product.id);
  const priceOriginal = Number(product.price) || 0;
  const priceFinalRaw = Number(product.final_price) || priceOriginal;
  const hasDiscount = priceFinalRaw > 0 && priceFinalRaw < priceOriginal;
  const priceFinal = hasDiscount ? priceFinalRaw : priceOriginal;
  const stock = Number(product.stock) || 0;

  return (
    <div className="bg-white min-h-screen pb-20 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto px-6 pt-8">
        
        {/* BOTÓN VOLVER (Minimalista) */}
        <Link
          to="/productos"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all mb-10 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Volver a la tienda</span>
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* COLUMNA IZQUIERDA: GALERÍA */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] bg-[#F5F5F7] rounded-[2rem] overflow-hidden border border-slate-50">
              {hasDiscount && (
                <div className="absolute top-5 left-5 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-tighter shadow-sm flex items-center gap-1">
                  <Percent size={10} className="text-blue-600" strokeWidth={3} /> OFERTA
                </div>
              )}
              <img
                src={activeImg}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Miniaturas pequeñas y elegantes */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImg === img ? "border-blue-600 scale-90" : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="Thumb" />
                </button>
              ))}
            </div>
          </div>

          {/* COLUMNA DERECHA: INFO */}
          <div className="flex flex-col pt-2">
            <div className="mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-600 border border-blue-100 px-2.5 py-1 rounded-md">
                {product.category_name || "Premium Collection"}
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 leading-[1.1] uppercase italic tracking-tighter">
              {product.name}
            </h1>

            {/* PRECIO (Más compacto) */}
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">
                ${priceFinal.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-lg text-slate-300 line-through font-bold">
                  ${priceOriginal.toLocaleString()}
                </span>
              )}
            </div>

            {/* DESCRIPCIÓN */}
            <div className="mb-8 space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                <Info size={12} /> Detalles del producto
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm font-medium">
                {product.description || "Un diseño minimalista pensado para la durabilidad y el estilo contemporáneo."}
              </p>
            </div>

            {/* CARACTERÍSTICAS TÉCNICAS */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <span className="block text-[8px] font-black text-slate-400 uppercase mb-1">Stock</span>
                <span className="text-xs font-bold text-slate-700">
                  {stock > 0 ? `${stock} Unidades` : "Agotado"}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <span className="block text-[8px] font-black text-slate-400 uppercase mb-1">Referencia</span>
                <span className="text-xs font-bold text-slate-700">#{product.id}</span>
              </div>
            </div>

            {/* SELECTOR CANTIDAD + BOTÓN */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 border border-slate-100">
                <span className="pl-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-2 hover:bg-white rounded-xl transition-all disabled:opacity-20"
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                  <span className="font-black text-base">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                    className="p-2 hover:bg-white rounded-xl transition-all"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => toggleCart(product, quantity)}
                disabled={stock <= 0}
                className={`w-full py-5 rounded-[1.25rem] font-black text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                  isInCart
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                    : stock <= 0
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-slate-200"
                }`}
              >
                {isInCart ? (
                  <><Check size={18} strokeWidth={3} /> PRODUCTO EN BOLSA</>
                ) : (
                  <><ShoppingBag size={18} strokeWidth={2.5} /> {stock <= 0 ? "AGOTADO" : "AÑADIR A LA BOLSA"}</>
                )}
              </button>
            </div>

            {/* BADGES DE CONFIANZA */}
            <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-tight">
                <Package size={14} className="text-slate-900" /> Envío Express
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-tight">
                <ShieldCheck size={14} className="text-slate-900" /> Compra Segura
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-tight">
                <Tag size={14} className="text-slate-900" /> Original
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}