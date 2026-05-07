// src/components/BannerCarousel.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ─── Cloudinary URL helpers ───────────────────────────────────────────────────
function getBannerUrl(url, { w = 1600, q = "auto:good" } = {}) {
  if (!url) return "";
  if (!url.includes("/upload/")) return url;
  return url.replace(
    "/upload/",
    `/upload/f_webp,q_${q},w_${w},c_fill,g_auto,ar_16:9,dpr_auto/`
  );
}

function getBannerSrcSet(url) {
  if (!url || !url.includes("/upload/")) return "";
  return [640, 960, 1280, 1600, 1920]
    .map(w => `${getBannerUrl(url, { w, q: "auto:good" })} ${w}w`)
    .join(", ");
}

// ─── Preload de imagen via JS (sin tocar el DOM) ─────────────────────────────
const preloadedUrls = new Set(); // evita precargar dos veces la misma imagen

function preloadImage(url, w = 960) {
  const src = getBannerUrl(url, { w });
  if (!src || preloadedUrls.has(src)) return;
  preloadedUrls.add(src);
  const img = new Image();
  img.fetchPriority = "low";
  img.src = src;
  // srcset para que el navegador elija la mejor resolución
  img.srcset = getBannerSrcSet(url);
  img.sizes  = "100vw";
}

// ─── Variantes de animación ───────────────────────────────────────────────────
const contentVariants = {
  enter:  { opacity: 0, y: 32 },
  center: { opacity: 1, y: 0,  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 } },
  exit:   { opacity: 0, y: -16, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const labelVariants = {
  enter:  { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0,  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.35 } },
  exit:   { opacity: 0 },
};
const btnsVariants = {
  enter:  { opacity: 0, y: 16 },
  center: { opacity: 1, y: 0,  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.55 } },
  exit:   { opacity: 0 },
};

// ─── Barra de progreso ────────────────────────────────────────────────────────
function ProgressBar({ active, duration, isPaused }) {
  return (
    <div className="h-[2px] w-full bg-white/15 rounded-full overflow-hidden">
      <motion.div
        key={active ? "running" : "paused"}
        className="h-full bg-white rounded-full origin-left"
        initial={{ scaleX: 0 }}
        animate={active && !isPaused ? { scaleX: 1 } : { scaleX: active ? undefined : 0 }}
        transition={active && !isPaused
          ? { duration: duration / 1000, ease: "linear" }
          : { duration: 0 }}
      />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
const INTERVAL = 7000;

export default function BannerCarousel({ banners }) {
  const [current,    setCurrent]    = useState(0);
  const [isPaused,   setIsPaused]   = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [direction,  setDirection]  = useState(1);
  const timerRef   = useRef(null);
  const allLoaded  = useRef(false); // flag: solo precargamos una vez

  const go = useCallback((idx, dir = 1) => {
    setDirection(dir);
    setCurrent(idx);
  }, []);

  const next = useCallback(() => {
    go(current === banners.length - 1 ? 0 : current + 1, 1);
  }, [current, banners.length, go]);

  const prev = useCallback(() => {
    go(current === 0 ? banners.length - 1 : current - 1, -1);
  }, [current, banners.length, go]);

  // ── Precarga de TODAS las imágenes en background tras montar ─────────────
  // El slide 0 ya cargó con fetchpriority="high". El resto los cargamos
  // con baja prioridad para no competir con el LCP.
  useEffect(() => {
    if (!banners?.length || allLoaded.current) return;
    allLoaded.current = true;

    // Retrasamos 1.5 s para dar tiempo al LCP de completarse primero
    const t = setTimeout(() => {
      banners.forEach((s, i) => {
        if (i === 0) return; // slide 0 ya está en el DOM como eager
        preloadImage(s.image_url);
      });
    }, 1500);

    return () => clearTimeout(t);
  }, [banners]);

  // ── Precarga anticipada del slide siguiente al cambiar ───────────────────
  useEffect(() => {
    if (!banners?.length) return;
    const nextIdx = current === banners.length - 1 ? 0 : current + 1;
    preloadImage(banners[nextIdx]?.image_url, 1600); // resolución alta para el siguiente
  }, [current, banners]);

  // Auto-play
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    timerRef.current = setInterval(next, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [banners.length, isPaused, next]);

  // Swipe táctil
  const handleTouchStart = useCallback(e => setTouchStart(e.touches[0].clientX), []);
  const handleTouchEnd   = useCallback(e => {
    if (touchStart === null) return;
    const delta = touchStart - e.changedTouches[0].clientX;
    if (delta > 60) next();
    else if (delta < -60) prev();
    setTouchStart(null);
  }, [touchStart, next, prev]);

  // Teclado
  useEffect(() => {
    const onKey = e => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (!banners?.length) return null;

  const slide = banners[current];

  return (
    <div
      role="region"
      aria-label="Banner principal"
      className="relative w-full h-full bg-[#050505] overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Fondos: todos montados, solo el activo visible ─────────────────── */}
      {banners.map((s, i) => {
        const isActive = i === current;
        return (
          <div
            key={s.id || i}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out
              ${isActive ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <div
              className={`absolute inset-0 transition-transform ease-in-out
                ${isActive ? "scale-[1.08] duration-[9000ms]" : "scale-100 duration-0"}`}
            >
              <img
                src={getBannerUrl(s.image_url, { w: 1600 })}
                srcSet={getBannerSrcSet(s.image_url)}
                sizes="100vw"
                alt={s.title || ""}
                // Solo el primero carga inmediatamente y con alta prioridad LCP.
                // Los demás usan lazy para no competir, pero ya fueron precargados por JS.
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "low"}
                decoding={i === 0 ? "sync" : "async"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-black/20 md:bg-black/10" />
          </div>
        );
      })}

      {/* ── Contenido animado ──────────────────────────────────────────────── */}
      <div className="relative z-30 h-full flex flex-col items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          <div key={current} className="max-w-4xl w-full">
            <AnimatePresence>
              {slide.label && (
                <motion.span
                  variants={labelVariants}
                  initial="enter" animate="center" exit="exit"
                  className="inline-flex items-center gap-2.5 mb-6"
                >
                  <span className="h-px w-8 bg-blue-400 rounded-full" />
                  <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.35em]">
                    {slide.label}
                  </span>
                  <span className="h-px w-8 bg-blue-400 rounded-full" />
                </motion.span>
              )}
            </AnimatePresence>

            <motion.h2
              variants={contentVariants}
              initial="enter" animate="center" exit="exit"
              className="text-[clamp(2.8rem,10vw,8rem)] font-black tracking-[-0.04em]
                text-white leading-[0.85] italic mb-6 whitespace-pre-line"
            >
              {slide.title}
            </motion.h2>

            <motion.p
              variants={contentVariants}
              initial="enter" animate="center" exit="exit"
              className="text-sm sm:text-lg md:text-xl text-white/70 font-medium
                max-w-lg mx-auto tracking-tight leading-relaxed mb-10"
            >
              {slide.description}
            </motion.p>

            <motion.div
              variants={btnsVariants}
              initial="enter" animate="center" exit="exit"
              className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4"
            >
              <Link
                to={slide.button_link || "/productos"}
                className="w-full sm:w-auto px-10 py-4 bg-white text-slate-900 rounded-full
                  font-black text-[10px] tracking-[0.2em] uppercase
                  transition-all duration-300 hover:bg-blue-600 hover:text-white
                  hover:scale-105 active:scale-95 shadow-2xl shadow-black/20"
              >
                {slide.button_text || "Ver detalles"}
              </Link>
              <Link
                to="/productos"
                className="w-full sm:w-auto px-10 py-4 border border-white/25 text-white rounded-full
                  font-black text-[10px] tracking-[0.2em] uppercase
                  hover:bg-white/10 backdrop-blur-md
                  transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Explorar colección
              </Link>
            </motion.div>
          </div>
        </AnimatePresence>
      </div>

      {/* ── Fade inferior ──────────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 h-32 md:h-48
        bg-gradient-to-t from-[#050505] to-transparent z-20 pointer-events-none" />

      {/* ── Controles laterales ────────────────────────────────────────────── */}
      <div className="hidden md:flex absolute inset-y-0 left-0 items-center z-40 px-6">
        <button onClick={prev} aria-label="Banner anterior"
          className="group w-12 h-12 flex items-center justify-center rounded-full
            border border-white/10 bg-white/5 backdrop-blur-sm
            text-white/30 hover:text-white hover:bg-white/15 hover:border-white/25
            transition-all duration-300 hover:scale-105 active:scale-95">
          <ChevronLeft size={22} strokeWidth={1.5} />
        </button>
      </div>
      <div className="hidden md:flex absolute inset-y-0 right-0 items-center z-40 px-6">
        <button onClick={next} aria-label="Siguiente banner"
          className="group w-12 h-12 flex items-center justify-center rounded-full
            border border-white/10 bg-white/5 backdrop-blur-sm
            text-white/30 hover:text-white hover:bg-white/15 hover:border-white/25
            transition-all duration-300 hover:scale-105 active:scale-95">
          <ChevronRight size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Indicadores + barra de progreso ───────────────────────────────── */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 md:bottom-14 left-1/2 -translate-x-1/2 z-50
          flex flex-col items-center gap-3 min-w-[180px]">
          <div className="flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i, i > current ? 1 : -1)}
                aria-label={`Ir al banner ${i + 1}`}
                className={`rounded-full transition-all duration-500 bg-white
                  ${i === current
                    ? "w-8 md:w-12 h-[3px] opacity-100"
                    : "w-[3px] h-[3px] opacity-25 hover:opacity-50"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.3em] text-white/40 uppercase">
            <span className="text-white/80">{String(current + 1).padStart(2, "0")}</span>
            <span className="h-px w-4 bg-white/20" />
            <span>{String(banners.length).padStart(2, "0")}</span>
          </div>
        </div>
      )}

      {banners.length > 1 && (
        <div className="hidden md:block absolute top-8 right-8 z-50 w-32">
          <ProgressBar active duration={INTERVAL} isPaused={isPaused} key={`${current}-${isPaused}`} />
        </div>
      )}
    </div>
  );
}