// src/components/BannerCarousel.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
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

const preloadedUrls = new Set();
function preloadImage(url, w = 960) {
  const src = getBannerUrl(url, { w });
  if (!src || preloadedUrls.has(src)) return;
  preloadedUrls.add(src);
  const img = new Image();
  img.fetchPriority = "low";
  img.src = src;
  img.srcset = getBannerSrcSet(url);
  img.sizes = "100vw";
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

// ─── SVG Progress Ring ────────────────────────────────────────────────────────
function ProgressRing({ size = 44, stroke = 2, duration, active, isPaused }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 -rotate-90"
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={stroke}
      />
      {/* Progress */}
      {active && (
        <motion.circle
          key={`${active}-${isPaused}`}
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={!isPaused ? { strokeDashoffset: 0 } : {}}
          transition={{ duration: duration / 1000, ease: "linear" }}
        />
      )}
    </svg>
  );
}

// ─── Pill de indicadores ──────────────────────────────────────────────────────
function ControlPill({ banners, current, go, isPaused, setIsPaused, onPrev, onNext }) {
  return (
    <div className="flex items-center gap-3">
      {/* Pill principal con dots */}
      <div
        className="flex items-center gap-[7px] px-4 h-[42px] rounded-full
          bg-white/10 backdrop-blur-xl border border-white/10
          shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]"
      >
        {/* Flecha prev — solo visible en mobile dentro de la pill */}
        <button
          onClick={onPrev}
          aria-label="Banner anterior"
          className="md:hidden flex items-center justify-center w-5 h-5
            text-white/40 hover:text-white transition-colors duration-200 mr-1"
        >
          <ChevronLeft size={16} strokeWidth={1.8} />
        </button>

        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i, i > current ? 1 : -1)}
            aria-label={`Ir al banner ${i + 1}`}
            className="relative flex items-center justify-center"
          >
            <motion.div
              animate={{
                width: i === current ? 26 : 6,
                backgroundColor: i === current
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.25)",
              }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ height: 6, borderRadius: 99 }}
            />
          </button>
        ))}

        {/* Flecha next — solo visible en mobile dentro de la pill */}
        <button
          onClick={onNext}
          aria-label="Siguiente banner"
          className="md:hidden flex items-center justify-center w-5 h-5
            text-white/40 hover:text-white transition-colors duration-200 ml-1"
        >
          <ChevronRight size={16} strokeWidth={1.8} />
        </button>
      </div>

      {/* Botón Play / Pause con progress ring */}
      <div className="relative w-[44px] h-[44px] flex-shrink-0">
        <ProgressRing size={44} stroke={2} duration={7000} active isPaused={isPaused} key={`${current}-${isPaused}`} />
        <button
          onClick={() => setIsPaused(p => !p)}
          aria-label={isPaused ? "Reanudar slideshow" : "Pausar slideshow"}
          className="absolute inset-[4px] rounded-full flex items-center justify-center
            bg-white/10 backdrop-blur-xl border border-white/10
            text-white/60 hover:text-white hover:bg-white/18
            transition-all duration-200 hover:scale-105 active:scale-95
            shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]"
        >
          {isPaused
            ? <Play  size={13} strokeWidth={2.5} className="translate-x-px" />
            : <Pause size={13} strokeWidth={2.5} />
          }
        </button>
      </div>
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
  const allLoaded  = useRef(false);

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

  // Precarga de todas las imágenes en background
  useEffect(() => {
    if (!banners?.length || allLoaded.current) return;
    allLoaded.current = true;
    const t = setTimeout(() => {
      banners.forEach((s, i) => { if (i !== 0) preloadImage(s.image_url); });
    }, 1500);
    return () => clearTimeout(t);
  }, [banners]);

  useEffect(() => {
    if (!banners?.length) return;
    const nextIdx = current === banners.length - 1 ? 0 : current + 1;
    preloadImage(banners[nextIdx]?.image_url, 1600);
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
      {/* ── Fondos ─────────────────────────────────────────────────────────── */}
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
      <div className="relative z-30 h-full flex flex-col items-center justify-center px-6 text-center pb-28 md:pb-24">
        <AnimatePresence mode="wait">
          <div key={current} className="max-w-4xl w-full">
            <AnimatePresence>
              {slide.label && (
                <motion.span
                  variants={labelVariants}
                  initial="enter" animate="center" exit="exit"
                  className="inline-flex items-center gap-2.5 mb-6"
                >
                  <span className="h-px w-8 bg-brand rounded-full" />
                  <span className="text-brand text-[10px] font-black uppercase tracking-[0.35em]">
                    {slide.label}
                  </span>
                  <span className="h-px w-8 bg-brand rounded-full" />
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
                  transition-all duration-300 hover:bg-[var(--brand-hover)] hover:text-white
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
      <div className="absolute inset-x-0 bottom-0 h-40 md:h-52
        bg-gradient-to-t from-[#050505] to-transparent z-20 pointer-events-none" />

      {/* ── Controles laterales (desktop) ─────────────────────────────────── */}
      <div className="hidden md:flex absolute inset-y-0 left-0 items-center z-40 px-6">
        <button
          onClick={prev}
          aria-label="Banner anterior"
          className="group w-11 h-11 flex items-center justify-center rounded-full
            border border-white/10 bg-white/5 backdrop-blur-sm
            text-white/30 hover:text-white hover:bg-white/15 hover:border-white/25
            transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
      </div>
      <div className="hidden md:flex absolute inset-y-0 right-0 items-center z-40 px-6">
        <button
          onClick={next}
          aria-label="Siguiente banner"
          className="group w-11 h-11 flex items-center justify-center rounded-full
            border border-white/10 bg-white/5 backdrop-blur-sm
            text-white/30 hover:text-white hover:bg-white/15 hover:border-white/25
            transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Control pill flotante ──────────────────────────────────────────── */}
      {banners.length > 1 && (
        <div className="absolute bottom-7 md:bottom-10 left-1/2 -translate-x-1/2 z-50">
          <ControlPill
            banners={banners}
            current={current}
            go={go}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            onPrev={prev}
            onNext={next}
          />
        </div>
      )}
    </div>
  );
}