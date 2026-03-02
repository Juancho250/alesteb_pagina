import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ShoppingBag,
  Package,
  ShieldCheck,
  Tag,
  Plus,
  Minus,
  Info,
  Loader2,
} from "lucide-react";
import api from "../services/api";

const getOptimizedGalleryUrl = (url, isMain = false) => {
  if (!url) return "https://via.placeholder.com/800x1000";
  if (url.includes("/upload/")) {
    const width = isMain ? 800 : 160;
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }
  return url;
};

export default function ProductDetail({ cart = [], toggleCart = () => {} }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImg, setSelectedImg] = useState("");
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let alive = true;
    window.scrollTo(0, 0);

    queueMicrotask(() => {
      if (alive) setLoading(true);
    });

    api.get(`/products/${id}`)
      .then(({ data }) => {
        if (!alive) return;
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

  const activeImg = images.includes(selectedImg) ? selectedImg : (images[0] || "");

  useEffect(() => {
    if (images.length === 0) return;
    images.forEach((imgUrl) => {
      const img = new Image();
      img.src = getOptimizedGalleryUrl(imgUrl, true);
    });
  }, [images]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
      </div>
    );
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">No encontrado</div>;
  }

  const isInCart = cart.some((item) => item.id === product.id);
  const priceOriginal = Number(product.sale_price || product.price) || 0;
  const priceFinal = Number(product.final_price) || priceOriginal;
  const hasDiscount = priceFinal > 0 && priceFinal < priceOriginal;
  const stock = Number(product.stock) || 0;

  return (
    <div className="bg-white min-h-screen pb-20 font-sans text-slate-900 selection:bg-blue-100">
      <div className="max-w-5xl mx-auto px-6 pt-8">
        <Link
          to="/productos"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all mb-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tienda</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square bg-[#F5F5F7] rounded-[2rem] overflow-hidden group border border-slate-50">
              {hasDiscount && (
                <div className="absolute top-4 left-4 z-10 bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest shadow-lg">
                  OFERTA
                </div>
              )}
              <img
                key={activeImg}
                src={getOptimizedGalleryUrl(activeImg, true)}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(img)}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 transition-all ${
                    activeImg === img ? "ring-2 ring-blue-600 opacity-100 scale-90" : "opacity-30 hover:opacity-100"
                  }`}
                >
                  <img src={getOptimizedGalleryUrl(img, false)} className="w-full h-full object-cover" alt="Thumb" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col pt-2">
            <div className="mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50/50 px-2 py-1 rounded">
                {product.category_name || "Premium"}
              </span>
            </div>

            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 mb-4 leading-tight uppercase italic tracking-tighter">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">${priceFinal.toLocaleString()}</span>
              {hasDiscount && <span className="text-base text-slate-300 line-through font-bold">${priceOriginal.toLocaleString()}</span>}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
                <Info size={12} className="text-blue-500" /> Detalles
              </div>
              <p className="text-slate-500 leading-relaxed text-sm font-medium">
                {product.description || "Diseno de alta fidelidad con acabados premium."}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 border border-slate-100">
                <span className="pl-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cantidad</span>
                <div className="flex items-center gap-4 bg-white rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 hover:text-blue-600 disabled:opacity-10"
                    disabled={quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-black text-sm w-4 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    className="p-2 hover:text-blue-600 disabled:opacity-10"
                    disabled={quantity >= stock}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => toggleCart(product, quantity)}
                disabled={stock <= 0}
                className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 ${
                  isInCart
                    ? "bg-emerald-500 text-white"
                    : stock <= 0
                      ? "bg-slate-100 text-slate-400"
                      : "bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-blue-500/10"
                }`}
              >
                {isInCart ? <><Check size={16} /> EN BOLSA</> : <><ShoppingBag size={16} /> {stock <= 0 ? "SIN STOCK" : "ANADIR"}</>}
              </button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-2 border-t border-slate-50 pt-8">
              <Badge icon={<Package size={14} />} text="Envio" />
              <Badge icon={<ShieldCheck size={14} />} text="Garantia" />
              <Badge icon={<Tag size={14} />} text="Original" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, text }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-50/30 border border-slate-50">
      <div className="text-slate-400">{icon}</div>
      <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">{text}</span>
    </div>
  );
}
