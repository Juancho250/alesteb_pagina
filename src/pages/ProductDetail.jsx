import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import api from "../services/api";

export default function ProductDetail() {
  const { id } = useParams();

  // 1. Cargamos el producto del caché inmediatamente
  const [product, setProduct] = useState(() => {
    try {
      const cached = localStorage.getItem(`product_${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  // 2. CONFIGURACIÓN CLAVE: Inicializamos activeImg con la foto del caché
  // Esto hace que la imagen se vea desde el segundo 0 si ya fue visitado.
  const [activeImg, setActiveImg] = useState(product?.main_image || "");

  useEffect(() => {
    const controller = new AbortController();

    api.get(`/products/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        setProduct(data);

        const firstImage =
          data.main_image ||
          data.images?.[0]?.url ||
          "";

        setActiveImg(firstImage);

        localStorage.setItem(`product_${id}`, JSON.stringify(data));
      })
      .catch(err => {
        if (err.name !== "CanceledError") console.error(err);
      });

    return () => controller.abort();
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const images = [...new Set([product.main_image, ...(product.images?.map(i => i.url) || [])])].filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased">

      <main className="max-w-6xl mx-auto pt-24 px-6 pb-32">
        <Link to="/productos" className="inline-flex items-center gap-2 text-sm text-[#86868b] hover:text-black transition-colors mb-12">
          <ArrowLeft size={16} />
          Todos los productos
        </Link>

        <section className="grid lg:grid-cols-2 gap-16 items-start">
          {/* GALERÍA */}
          <div className="space-y-6">
            <div className="aspect-square bg-[#f5f5f7] rounded-3xl overflow-hidden">
              <img
                src={activeImg}
                onError={() => setActiveImg(product.main_image)}
                alt={product.name}
                className="w-full h-full object-cover"
              />

            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    // Lógica para marcar como activa la primera foto por defecto
                    (activeImg === img || (!activeImg && i === 0)) 
                      ? "border-[#0071e3] scale-95" 
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* INFORMACIÓN */}
          <article className="lg:pt-4 sticky top-32">
            <span className="text-xs font-semibold text-[#86868b] uppercase tracking-widest">
              {product.category || "Nuevo"}
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mt-2 mb-4 text-[#1d1d1f]">
              {product.name}
            </h1>
            <p className="text-2xl font-normal text-[#1d1d1f] mb-8">
              ${Number(product.price).toLocaleString()}
            </p>

            <div className="h-[1px] bg-[#d2d2d7] w-full mb-8" />

            <p className="text-[#1d1d1f] text-lg leading-relaxed font-normal mb-10">
              {product.description || "Un diseño pensado para el rendimiento y la durabilidad."}
            </p>

            <a
              href={`https://wa.me/573145055073?text=Hola! Me interesa: ${encodeURIComponent(product.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#0071e3] text-white py-4 px-8 rounded-full font-medium text-base transition hover:bg-[#0077ed] w-full md:w-max shadow-lg shadow-blue-500/10"
            >
              Comprar por WhatsApp
              <MessageCircle size={20} />
            </a>
            
            <p className="mt-6 text-xs text-[#86868b] text-center md:text-left font-medium">
              Envío prioritario incluido • Pago seguro
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}