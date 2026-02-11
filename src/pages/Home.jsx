import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import BannerCarousel from "../components/BannerCarousel"; // <--- Importado de nuevo
import { ArrowRight, Loader2 } from "lucide-react";

// ANIMACIÓN: Librerías clave
import { motion } from "framer-motion";
import { ReactLenis } from "lenis/react";

// Configuración de animación reutilizable
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// 1. Optimización de imágenes
const getOptimizedImageUrl = (url, width = 600) => {
  if (!url) return 'https://via.placeholder.com/400x500';
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_scale/`);
  }
  return url;
};

export default function Home() {
  const [banners, setBanners] = useState([]); // <--- Estado para banners
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        // 2. Carga en paralelo (Banners + Productos)
        const [bannersRes, productsRes] = await Promise.all([
          api.get("/banners"),
          api.get("/products?limit=4")
        ]);

        setBanners(bannersRes.data.filter(b => b.is_active));
        const productsData = productsRes.data.products || productsRes.data;
        setFeaturedProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        console.error("Error loading home data", err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-black mb-4" size={40} />
    </div>
  );

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: true }}>
      <div className="min-h-screen bg-white text-black font-sans antialiased selection:bg-neutral-200">
        
        <main className="pt-20 md:pt-24"> {/* Añadido padding-top para que no choque con navbar */}
          
          {/* --- BANNER CAROUSEL --- */}
          {/* Animación: Aparece suavemente con un ligero zoom-out */}
          {banners.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="max-w-[1540px] mx-auto h-[90vh] sm:h-[80vh] bg-[#f5f5f7] overflow-hidden relative md:rounded-3xl shadow-sm md:-mt-16"
            >
              <BannerCarousel banners={banners} />
            </motion.section>
          )}

          {/* --- HERO TEXT (Debajo del banner) --- */}
          <section className="text-center py-10 md:py-20 px-6 max-w-5xl mx-auto">
             <motion.div 
               initial="hidden"
               whileInView="visible" // Se activa cuando entra en pantalla
               viewport={{ once: true }}
               variants={staggerContainer}
             >
                <motion.h2 variants={fadeInUp} className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                  Redefiniendo <br />
                  <span className="text-neutral-400 italic">lo cotidiano.</span>
                </motion.h2>
                
                <motion.div variants={fadeInUp}>
                  <Link to="/productos" className="inline-block px-10 py-4 bg-black text-white font-bold rounded-full text-sm transition-all hover:scale-105 hover:bg-neutral-800 hover:shadow-xl">
                    Ver colección
                  </Link>
                </motion.div>
             </motion.div>
          </section>

          {/* --- PRODUCTOS (GRID) --- */}
          <section className="py-20 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={fadeInUp}
                  className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-12"
                >
                  <div className="space-y-1">
                    <div className="h-1 w-10 bg-black rounded-full mb-3" />
                    <h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Lo último</h3>
                  </div>
                  <Link to="/productos" className="group text-black font-bold flex items-center gap-2 text-xs tracking-widest uppercase">
                    Explorar <ArrowRight size={16} className="transition-transform group-hover:translate-x-1"/>
                  </Link>
                </motion.div>

                <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={staggerContainer}
                  className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-8"
                >
                  {featuredProducts.map((p) => {
                    const price = Number(p.final_price || p.price);
                    return (
                      <Link key={p.id} to={`/productos/detalle/${p.id}`} className="group block cursor-pointer">
                        <motion.div variants={fadeInUp}>
                          <div className="aspect-[4/5] bg-[#f5f5f7] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden mb-5 relative">
                            <img 
                              src={getOptimizedImageUrl(p.main_image)} 
                              alt={p.name} 
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                            />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-neutral-500 truncate">
                              {p.name}
                            </h4>
                            <p className="font-black text-lg md:text-xl tracking-tight text-neutral-900">
                              ${price.toLocaleString()}
                            </p>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </motion.div>
            </div>
          </section>

          {/* --- COLECCIONES --- */}
          <section className="py-20 px-6 pb-32 border-t border-neutral-100">
             <div className="max-w-6xl mx-auto">
                 <motion.h3 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="text-center text-3xl md:text-4xl font-black mb-16 uppercase tracking-tighter"
                 >
                    Colecciones
                 </motion.h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <PromoCard 
                      title="Audio Pro" 
                      subtitle="Inmersión" 
                      img="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000" 
                      dark 
                      link="/productos?categoria=audio"
                    />
                    <PromoCard 
                      title="Workspace" 
                      subtitle="Focus" 
                      img="https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?q=80&w=1000" 
                      link="/productos?categoria=desktop"
                    />
                 </div>
             </div>
          </section>

        </main>
      </div>
    </ReactLenis>
  );
}

function PromoCard({ title, subtitle, img, dark = false, link }) {
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeInUp}
      className="w-full"
    >
      <Link to={link} className="relative h-[400px] md:h-[500px] rounded-[2rem] md:rounded-[3rem] overflow-hidden group block shadow-sm hover:shadow-2xl transition-all duration-500">
        <motion.div 
          className="absolute inset-0 w-full h-full"
          whileHover={{ scale: 1.05 }} 
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <img 
            src={img} 
            loading="lazy"
            className="w-full h-full object-cover" 
            alt={title} 
          />
        </motion.div>
        
        <div className={`absolute inset-0 p-8 md:p-12 flex flex-col justify-end ${dark ? 'bg-gradient-to-t from-black/70 to-transparent text-white' : 'bg-gradient-to-t from-white/70 to-transparent text-black'}`}>
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-80">{title}</h4>
          <p className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">{subtitle}</p>
        </div>
      </Link>
    </motion.div>
  );
}