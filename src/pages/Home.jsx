import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import BannerCarousel from "../components/BannerCarousel";
import { ArrowRight, ShoppingBag } from "lucide-react";

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [bannersRes, productsRes] = await Promise.all([
          api.get("/banners"),
          api.get("/products")
        ]);

        // Banners activos
        setBanners(bannersRes.data.filter(b => b.is_active));
        
        // Curaduría de productos: tomamos los primeros 4 como "destacados"
        // En el futuro podrías filtrar por p.is_featured o p.sales_count
        setFeaturedProducts(productsRes.data.slice(0, 4));
        
      } catch (err) {
        console.error("Error cargando home", err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">...</div>;

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased">
      <main className="pt-16 md:pt-20">
        
        {/* BANNER PRINCIPAL */}
        {banners.length > 0 && (
          <section className="max-w-[1520px] mx-auto h-[70vh] sm:h-[80vh] md:h-[85vh] bg-[#f5f5f7] overflow-hidden relative md:rounded-3xl shadow-sm md:-mt-16">
            <BannerCarousel banners={banners} />
          </section>
        )}

        <div className="max-w-6xl mx-auto px-6">
          
          {/* HERO TEXT */}
          <section className="text-center py-24 md:py-32">
            <h2 className="text-5xl md:text-7xl font-semibold tracking-tight mb-8">
              Redefiniendo <br />
              <span className="text-[#86868b]">lo cotidiano.</span>
            </h2>
            <Link to="/productos" className="inline-block px-8 py-3 bg-[#0071e3] text-white font-medium rounded-full text-sm transition hover:bg-[#0077ed]">
              Ver colección completa
            </Link>
          </section>

          {/* SECCIÓN: PRODUCTOS DESTACADOS (LO NUEVO) */}
          <section className="mb-32">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h3 className="text-3xl font-semibold tracking-tight">Lo último</h3>
                <p className="text-[#86868b]">Nuestras novedades más recientes.</p>
              </div>
              <Link to="/productos" className="text-[#0071e3] hover:underline flex items-center gap-1 text-sm font-medium">
                Ver todos <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((p) => (
                <Link key={p.id} to={`/productos/${p.id}`} className="group">
                  <div className="aspect-[4/5] bg-[#f5f5f7] rounded-3xl overflow-hidden mb-4">
                    <img 
                      src={p.main_image} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                  </div>
                  <h4 className="font-medium text-[15px] text-[#1d1d1f] truncate">{p.name}</h4>
                  <p className="text-[#86868b] text-sm">${Number(p.price).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* BENEFICIOS */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32 border-t border-[#f5f5f7] pt-16">
            <Feature title="Logística Global" desc="Envíos con seguimiento en tiempo real." />
            <Feature title="Calidad Verificada" desc="Certificación en cada componente." />
            <Feature title="Acceso Exclusivo" desc="Lanzamientos para nuestra comunidad." />
          </section>

          {/* SECCIÓN DE CATEGORÍAS (Visual) */}
          <section className="mb-32">
             <h3 className="text-3xl font-semibold tracking-tight mb-12 text-center">Explora por colección</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PromoCard 
                  title="Audio Pro" 
                  subtitle="Inmersión total." 
                  img="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000" 
                  dark 
                />
                <PromoCard 
                  title="Desktop Setups" 
                  subtitle="Optimiza tu espacio." 
                  img="https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?q=80&w=1000" 
                />
             </div>
          </section>

        </div>
      </main>
    </div>
  );
}

/* Componentes de apoyo para el look Apple */

function Feature({ title, desc }) {
  return (
    <div className="text-center md:text-left">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[#86868b] mb-3">{title}</h3>
      <p className="text-base text-[#1d1d1f] font-normal leading-snug">{desc}</p>
    </div>
  );
}

function PromoCard({ title, subtitle, img, dark = false }) {
  return (
    <div className={`relative h-[400px] rounded-3xl overflow-hidden group cursor-pointer`}>
      <img src={img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
      <div className={`absolute inset-0 p-10 flex flex-col justify-end ${dark ? 'bg-black/20 text-white' : 'bg-white/5 text-black'}`}>
        <h4 className="text-sm font-semibold uppercase tracking-widest opacity-80 mb-2">{title}</h4>
        <p className="text-3xl font-semibold tracking-tight">{subtitle}</p>
      </div>
    </div>
  );
}