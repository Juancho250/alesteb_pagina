import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function BannerCarousel({ banners }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (!banners?.length) return null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#050505]">
      {[current].map((index) => {
        const slide = banners[index];

        return (
          <div key={slide.id} className="absolute inset-0 z-20">
            
            {/* Imagen */}
            <img
              src={slide.image_url}
              alt={slide.title}
              fetchpriority={index === 0 ? "high" : "auto"}
              loading={index === 0 ? "eager" : "lazy"}
              className="w-full h-full object-cover opacity-60"
            />

            <div className="absolute inset-0 bg-black/40" />

            {/* Luces SOLO desktop */}
            <div className="hidden md:block absolute top-0 left-0 w-[400px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />

            {/* Contenido */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
              <h2 className="text-3xl md:text-7xl font-bold mb-4">
                {slide.title}
              </h2>
              <p className="text-base md:text-2xl text-slate-200 max-w-2xl">
                {slide.description}
              </p>

              <div className="flex gap-4 pt-6">
                <Link
                  to={slide.button_link || "/productos"}
                  className="px-8 py-3 bg-[#0071e3] text-white rounded-full"
                >
                  {slide.button_text || "Más información"}
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Controles */}
      <button onClick={prev} className="absolute left-6 top-1/2 z-30 text-white/50">
        <ChevronLeft size={36} />
      </button>
      <button onClick={next} className="absolute right-6 top-1/2 z-30 text-white/50">
        <ChevronRight size={36} />
      </button>
    </div>
  );
}
