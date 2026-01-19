import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerCarousel from "../components/BannerCarousel";

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true); // 1. Nuevo estado

  useEffect(() => {
    api.get("/banners")
      .then((res) => {
        const activeBanners = res.data.filter(b => b.is_active === true || b.is_active === 1);
        setBanners(activeBanners);
      })
      .catch((err) => console.log("Error cargando banners", err))
      .finally(() => setLoading(false)); // 2. Finaliza la carga
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans">
      <Navbar />

      {/* Luces Ambientales fijas */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      {/* AJUSTE: He añadido pt-20 para compensar la altura del Navbar */}
      <main className="relative z-10 pt-16 md:pt-20"> 
        
        {/* ===== SECCIÓN BANNER (100% ANCHO) ===== */}
        {banners.length > 0 && (
          <section className="w-full h-[calc(100vh-64px)] md:h-[90vh] overflow-hidden relative border-b border-white/5 bg-[#050505]">
            <BannerCarousel banners={banners} />
          </section>
        )}

        <div className="max-w-7xl mx-auto px-6">
          
          {/* ===== HERO SECUNDARIO ===== */}
          <section className="text-center py-32 md:py-44">
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 text-[10px] uppercase tracking-[0.4em] bg-white/[0.03] border border-white/10 rounded-full text-slate-300 backdrop-blur-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              Ingeniería & Estética
            </div>

            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9] text-white">
              Redefiniendo <br />
              <span className="italic font-light text-slate-500">lo cotidiano.</span>
            </h2>

            <p className="max-w-xl mx-auto text-slate-400 mb-14 text-lg md:text-xl font-light leading-relaxed">
              Descubre una curaduría de objetos tecnológicos diseñados para quienes no aceptan compromisos entre funcionalidad y estilo.
            </p>

            <div className="flex justify-center gap-6 flex-wrap">
              <Link
                to="/productos"
                className="group relative px-12 py-4 bg-white text-black font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                <span className="relative z-10 text-sm tracking-widest">VER PRODUCTOS</span>
              </Link>
            </div>
          </section>

          {/* ===== BENEFICIOS ===== */}
          <section id="beneficios" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-48">
            <Feature title="Global Logístics" desc="Envíos prioritarios con seguimiento en tiempo real." />
            <Feature title="Verified Hardware" desc="Certificación de calidad en cada componente seleccionado." />
            <Feature title="Exclusive Access" desc="Lanzamientos limitados para nuestra comunidad." />
          </section>

          {/* ===== CATEGORÍAS GRID ===== */}
          <section id="categorias" className="mb-48">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4 border-l border-white/10 pl-8">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                Nuestras <span className="text-slate-600 font-light">Colecciones</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Category title="Audio Pro" />
              <Category title="Performance" />
              <Category title="Desktop" />
              <Category title="Limited" />
            </div>
          </section>

          {/* ===== CTA FINAL ===== */}
          <section className="mb-32">
            <div className="relative bg-[#080808] border border-white/5 rounded-[4rem] p-16 md:p-32 overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
              
              <div className="relative z-10">
                <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-10">
                  ¿Listo para el <br /> siguiente nivel?
                </h2>
                <Link
                  to="/productos"
                  className="inline-flex items-center gap-6 text-white font-light tracking-[0.3em] text-xs uppercase group"
                >
                  Ir a la tienda oficial
                  <span className="w-16 h-[1px] bg-white/20 transition-all duration-500 group-hover:w-28 group-hover:bg-cyan-500" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ===== COMPONENTES DE APOYO ===== */

function Feature({ title, desc }) {
  return (
    <div className="group p-12 bg-white/[0.01] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.02] hover:border-white/20 transition-all duration-700 ease-out">
      <h3 className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-6 group-hover:text-cyan-400 transition-colors">
        {title}
      </h3>
      <p className="text-xl text-slate-300 leading-tight font-medium">
        {desc}
      </p>
    </div>
  );
}

function Category({ title }) {
  return (
    <div className="relative h-72 flex items-center justify-center p-8 bg-white/[0.01] border border-white/5 rounded-[2rem] hover:border-white/30 transition-all cursor-pointer group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <p className="relative z-10 font-light text-sm tracking-[0.4em] uppercase text-slate-400 group-hover:text-white transition-all transform group-hover:scale-110">
        {title}
      </p>
    </div>
  );
}