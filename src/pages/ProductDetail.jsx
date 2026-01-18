import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, CheckCircle, ShieldCheck } from "lucide-react";
import api from "../services/api";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState("");

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => {
      const productData = res.data;
      setProduct(productData);
      // Solo establecemos activeImg si existe main_image para evitar estados vacíos
      if (productData.main_image) {
        setActiveImg(productData.main_image);
      } else if (productData.images && productData.images.length > 0) {
        // Si no hay principal, usamos la primera de la galería por defecto
        setActiveImg(productData.images[0].url);
      }
    });
  }, [id]);

  // 1. CAMBIO CLAVE: Quitamos !activeImg de la validación para evitar bucles de carga
  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500"></div>
      </div>
    );
  }

  const whatsappUrl = `https://wa.me/573145055073?text=Hola,%20me%20interesa%20este%20producto:%20${product.name}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        <Link to="/productos" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-8 group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* SECCIÓN IMÁGENES */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm relative">
              {activeImg ? (
                <img 
                  src={activeImg} 
                  alt={product.name} 
                  className="w-full h-full object-cover animate-fade-in"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 italic text-sm">
                  Sin imagen disponible
                </div>
              )}
            </div>
            
            {/* Galería de miniaturas */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {/* Combinamos principal y galería, eliminando nulos y duplicados */}
              {[product.main_image, ...(product.images?.map(i => i.url) || [])]
                .filter(Boolean)
                .filter((value, index, self) => self.indexOf(value) === index) // Elimina duplicados
                .map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(img)}
                  className={`w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImg === img 
                      ? "border-cyan-500 scale-105" 
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img 
                    src={img} 
                    className="w-full h-full object-cover" 
                    alt={`Vista ${idx}`} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* SECCIÓN INFO */}
          <div className="space-y-8">
            <div>
              <span className="text-cyan-400 font-bold tracking-widest uppercase text-sm">
                {product.category || "General"}
              </span>
              <h1 className="text-4xl md:text-6xl font-black mt-2 leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-5xl font-black text-white">
                ${Number(product.price).toLocaleString()}
              </p>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                EN STOCK
              </span>
            </div>

            <p className="text-slate-400 text-lg leading-relaxed border-l-2 border-white/10 pl-6">
              Este producto cuenta con los más altos estándares de calidad. Ideal para quienes buscan durabilidad y diseño de vanguardia.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="text-cyan-500" size={18} /> Envío inmediato
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <ShieldCheck className="text-cyan-500" size={18} /> Garantía oficial
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all text-white font-black py-5 rounded-2xl text-xl shadow-lg shadow-green-900/20 active:scale-[0.98]"
            >
              <MessageCircle size={24} />
              Comprar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div> 
  );
}