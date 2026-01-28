import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const getOptimizedBannerUrl = (url) => {
  if (!url) return "";
  if (url.includes("/upload/")) {
    // Usamos c_fill y ar_16:9 para asegurar que cubra bien el espacio en responsive
    return url.replace("/upload/", "/upload/f_auto,q_auto,w_1600,c_fill,g_auto/");
  }
  return url;
};

export default function BannerCarousel({ banners }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  // Soporte para Swipe en móviles
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 70) next(); // Swipe Izquierda
    if (touchStart - touchEnd < -70) prev(); // Swipe Derecha
  };

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [banners.length, isPaused, next]);

  if (!banners || banners.length === 0) return null;

  return (
    <div 
      className="relative w-full h-full bg-[#050505] overflow-hidden group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {banners.map((slide, index) => {
        const isActive = index === current;
        
        return (
          <div
            key={slide.id || index}
            className={`absolute inset-0 transition-all duration-[1200ms] ease-in-out ${
              isActive ? "opacity-100 z-20" : "opacity-0 z-10"
            }`}
          >
            {/* Fondo con Ken Burns optimizado */}
            <div className="absolute inset-0">
              <img 
                src={getOptimizedBannerUrl(slide.image_url)} 
                alt={slide.title} 
                className={`w-full h-full object-cover transition-transform duration-[8000ms] ${
                  isActive ? "scale-110" : "scale-100"
                }`}
              />
              {/* Overlay: más oscuro en móvil para asegurar legibilidad */}
              <div className="absolute inset-0 bg-black/40 md:bg-black/30" />
            </div>

            {/* Contenido Adaptativo */}
            <div className="relative z-30 h-full flex flex-col items-center justify-center px-6 text-center">
              <div className={`max-w-4xl transition-all duration-1000 delay-200 ${
                isActive ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}>
                
                {slide.label && (
                  <span className="inline-block text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-4">
                    {slide.label}
                  </span>
                )}

                {/* Tipografía fluida: text-4xl en móvil, text-8xl en desktop */}
                <h2 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 leading-[1] md:leading-[0.85] italic">
                  {slide.title}
                </h2>

                <p className="text-sm sm:text-lg md:text-2xl text-white/80 font-medium max-w-xl mx-auto tracking-tight leading-snug md:leading-relaxed">
                  {slide.description}
                </p>

                {/* Botones: en móvil uno bajo el otro para mayor área de toque */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4 pt-10">
                  <Link
                    to={slide.button_link || "/productos"}
                    className="w-full sm:w-auto px-10 py-4 bg-white text-black rounded-full font-bold text-xs md:text-sm transition-all hover:bg-blue-600 hover:text-white"
                  >
                    {slide.button_text || "Ver detalles"}
                  </Link>
                  <Link
                    to="/productos"
                    className="w-full sm:w-auto px-10 py-4 border border-white/40 text-white rounded-full font-bold text-xs md:text-sm hover:bg-white/10 backdrop-blur-md"
                  >
                    Explorar colección
                  </Link>
                </div>
              </div>
            </div>

            {/* Fade inferior más suave para móviles */}
            <div className="absolute inset-x-0 bottom-0 h-24 md:h-40 bg-gradient-to-t from-[#050505] to-transparent z-40" />
          </div>
        );
      })}

      {/* Navegación lateral: Oculta en móviles (usamos swipe) */}
      <div className="hidden md:block">
        <button onClick={prev} className="absolute left-8 top-1/2 -translate-y-1/2 z-50 p-4 text-white/20 hover:text-white transition-all">
          <ChevronLeft size={48} strokeWidth={1} />
        </button>
        <button onClick={next} className="absolute right-8 top-1/2 -translate-y-1/2 z-50 p-4 text-white/20 hover:text-white transition-all">
          <ChevronRight size={48} strokeWidth={1} />
        </button>
      </div>

      {/* Indicadores (Pills): más pequeños en móvil */}
      <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-black/20 backdrop-blur-md p-2 rounded-full">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-500 ${
              current === i ? "w-6 md:w-10 bg-white" : "w-1 md:w-1.5 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}