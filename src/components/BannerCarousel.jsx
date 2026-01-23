import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function BannerCarousel({ banners }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      next();
    }, 5000); // Aumentado a 5s para mejor experiencia
    return () => clearInterval(timer);
  }, [banners, current]);

  if (!banners || banners.length === 0) return null;

  const next = () => setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  const prev = () => setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden group">
      {banners.map((slide, index) => {
        const isActive = index === current;
        
        return (
          <div
            key={slide.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-20" : "opacity-0 z-10"
            }`}
          >
            {/* Imagen de Fondo */}
            <div className="absolute inset-0 overflow-hidden">
              <img 
                src={slide.image_url} 
                alt={slide.title} 
                fetchPriority="high" // <-- ESTO ES CLAVE
                loading="eager"
                className="w-full h-full object-cover opacity-60 transition-transform duration-700 ease-out"
            />

              <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Luces Ambientales */}
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-600/15 blur-[140px] rounded-full translate-x-1/4 translate-y-1/4 pointer-events-none" />

            {/* Contenido con animaciones corregidas */}
            <div className="relative z-30 h-full flex flex-col items-center justify-center px-6 text-center">
              <div className={`space-y-4 transition-all duration-1000 ease-out ${
                isActive ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}>
                {/* Cambia el h2 del banner */}
                <h2 className="text-3xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl">
                {slide.title}
                </h2>

                {/* Cambia el p del banner */}
                <p className="text-base md:text-2xl text-slate-200 font-light max-w-2xl mx-auto tracking-wide drop-shadow-lg">
                {slide.description}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-6">
                  <Link
                    to={slide.button_link || "/productos"}
                    className="px-8 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    {slide.button_text || "Más información"}
                  </Link>
                  <Link
                    to="/productos"
                    className="px-8 py-3 border border-white/50 text-white rounded-full font-medium hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                  >
                    Comprar
                  </Link>
                </div>
              </div>
            </div>

            {/* Gradiente inferior */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] to-transparent z-40" />
          </div>
        );
      })}

      {/* Controles Nav */}
      <button 
        onClick={(e) => { e.stopPropagation(); prev(); }} 
        className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-3 text-white/30 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft size={40} strokeWidth={1} />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); next(); }} 
        className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-3 text-white/30 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
      >
        <ChevronRight size={40} strokeWidth={1} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-3">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 transition-all duration-500 rounded-full ${
              current === i ? "w-8 bg-white" : "w-1.5 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}