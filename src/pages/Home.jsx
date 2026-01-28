import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import BannerCarousel from "../components/BannerCarousel";
import { ArrowRight, Loader2 } from "lucide-react";

// 1. Optimización de imágenes con carga inteligente
const getOptimizedImageUrl = (url, width = 600) => {
  if (!url) return 'https://via.placeholder.com/400x500';
  if (url.includes('/upload/')) {
    // f_auto: formato moderno (webp/avif), q_auto: mejor compresión sin pérdida visual
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_scale/`);
  }
  return url;
};

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. Ejecución en paralelo para no bloquear el hilo principal
    const loadHomeData = async () => {
      try {
        const [bannersRes, productsRes] = await Promise.all([
          api.get("/banners"),
          api.get("/products?limit=4") // Solo pedimos lo necesario
        ]);

        setBanners(bannersRes.data.filter(b => b.is_active));
        const productsData = productsRes.data.products || productsRes.data;
        setFeaturedProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        console.error("Error", err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white transition-opacity duration-500">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">Iniciando</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased selection:bg-blue-100">
      <main className="pt-16 md:pt-20">
        
        {/* BANNER: Prioridad alta (LCP) */}
        {banners.length > 0 && (
          <section className="max-w-[1520px] mx-auto h-[60vh] sm:h-[80vh] bg-[#f5f5f7] overflow-hidden relative md:rounded-3xl shadow-sm md:-mt-16">
            <BannerCarousel banners={banners} />
          </section>
        )}

        <div className="max-w-6xl mx-auto px-6">
          
          {/* HERO TEXT: Responsive y fluido */}
          <section className="text-center py-20 md:py-40">
            <h2 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-10 leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Redefiniendo <br />
              <span className="text-slate-200 italic">lo cotidiano.</span>
            </h2>
            <Link to="/productos" className="inline-block px-10 py-4 bg-blue-600 text-white font-bold rounded-full text-sm transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/10">
              Ver colección
            </Link>
          </section>

          {/* PRODUCTOS: Grid adaptativo */}
          <section className="mb-32 md:mb-48">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
              <div className="space-y-1">
                <div className="h-1 w-10 bg-blue-600 rounded-full mb-3" />
                <h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Lo último</h3>
                <p className="text-slate-400 text-sm md:text-base font-medium">Curaduría de novedades.</p>
              </div>
              <Link to="/productos" className="group text-blue-600 flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-blue-800 transition-colors">
                Explorar <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {featuredProducts.map((p, index) => {
                const price = Number(p.final_price || p.price);
                return (
                  <Link key={p.id} to={`/productos/detalle/${p.id}`} className="group flex flex-col">
                    <div className="aspect-[4/5] bg-[#f5f5f7] rounded-2xl md:rounded-[2.5rem] overflow-hidden mb-4 relative shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1">
                      <img 
                        src={getOptimizedImageUrl(p.main_image)} 
                        alt={p.name} 
                        // 3. Lazy loading solo para elementos que no se ven al inicio
                        loading={index > 1 ? "lazy" : "eager"}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                    </div>
                    <h4 className="font-bold text-slate-400 text-[9px] md:text-[10px] uppercase tracking-[0.2em] mb-1 truncate">
                      {p.name}
                    </h4>
                    <p className="text-slate-900 font-black text-lg md:text-xl tracking-tighter">
                      ${price.toLocaleString()}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* BENEFICIOS: Grid responsivo de 1 a 3 columnas */}
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-16 mb-32 md:mb-48 border-t border-slate-50 pt-16">
            <Feature title="Logística" desc="Seguimiento global en tiempo real." />
            <Feature title="Calidad" desc="Certificación de grado industrial." />
            <Feature title="Exclusividad" desc="Acceso preferente a preventas." />
          </section>

          {/* CATEGORÍAS: Cards con altura dinámica */}
          <section className="mb-32 md:mb-48">
             <h3 className="text-3xl md:text-4xl font-black tracking-tighter italic text-center mb-12 uppercase">Colecciones</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <PromoCard 
                  title="Audio Pro" 
                  subtitle="Inmersión total." 
                  img="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000" 
                  dark 
                  link="/productos?categoria=audio"
                />
                <PromoCard 
                  title="Workspace" 
                  subtitle="Alto rendimiento." 
                  img="https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?q=80&w=1000" 
                  link="/productos?categoria=desktop"
                />
             </div>
          </section>

        </div>
      </main>
    </div>
  );
}

/* Componentes internos optimizados */

function Feature({ title, desc }) {
  return (
    <div className="flex flex-col items-center md:items-start text-center md:text-left">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3">{title}</h3>
      <p className="text-base md:text-lg text-slate-900 font-bold leading-tight">{desc}</p>
    </div>
  );
}

function PromoCard({ title, subtitle, img, dark = false, link }) {
  return (
    <Link to={link} className="relative h-[400px] md:h-[550px] rounded-[2rem] md:rounded-[3rem] overflow-hidden group cursor-pointer block">
      <img 
        src={img} 
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
        alt={title} 
      />
      <div className={`absolute inset-0 p-8 md:p-14 flex flex-col justify-end transition-all ${dark ? 'bg-black/20 text-white' : 'bg-white/5 text-black hover:bg-black/10 hover:text-white'}`}>
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-70">{title}</h4>
        <p className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9] italic uppercase">{subtitle}</p>
      </div>
    </Link>
  );
}