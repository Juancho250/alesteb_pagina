import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

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
    .map((width) => `${getBannerUrl(url, { w: width })} ${width}w`)
    .join(", ");
}

const preloadedUrls = new Set();
function preloadImage(url, width = 1280) {
  const src = getBannerUrl(url, { w: width });
  if (!src || preloadedUrls.has(src)) return;
  preloadedUrls.add(src);
  const image = new Image();
  image.fetchPriority = "low";
  image.src = src;
  image.srcset = getBannerSrcSet(url);
  image.sizes = "100vw";
}

const INTERVAL = 7000;
const transition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] };

export default function BannerCarousel({ banners }) {
  const [current, setCurrent] = useState(0);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const timerRef = useRef(null);
  const allLoaded = useRef(false);

  const safeBanners = useMemo(
    () => (Array.isArray(banners) ? banners.filter((banner) => banner?.image_url) : []),
    [banners]
  );

  const go = useCallback((index) => {
    if (!safeBanners.length) return;
    const normalized = (index + safeBanners.length) % safeBanners.length;
    setCurrent(normalized);
  }, [safeBanners.length]);

  const next = useCallback(() => go(current + 1), [current, go]);
  const prev = useCallback(() => go(current - 1), [current, go]);
  const isPaused = pausedByUser || hovering;

  useEffect(() => {
    if (!safeBanners.length || allLoaded.current) return;
    allLoaded.current = true;
    const timeout = setTimeout(() => {
      safeBanners.forEach((banner, index) => {
        if (index !== 0) preloadImage(banner.image_url);
      });
    }, 1200);
    return () => clearTimeout(timeout);
  }, [safeBanners]);

  useEffect(() => {
    if (safeBanners.length <= 1 || isPaused) return undefined;
    timerRef.current = window.setInterval(next, INTERVAL);
    return () => window.clearInterval(timerRef.current);
  }, [safeBanners.length, isPaused, next]);

  useEffect(() => {
    if (!safeBanners.length) return;
    preloadImage(safeBanners[(current + 1) % safeBanners.length]?.image_url, 1600);
  }, [current, safeBanners]);

  const handleTouchStart = useCallback((event) => {
    setTouchStart(event.touches[0]?.clientX ?? null);
  }, []);

  const handleTouchEnd = useCallback((event) => {
    if (touchStart === null) return;
    const end = event.changedTouches[0]?.clientX ?? touchStart;
    const delta = touchStart - end;
    if (delta > 56) next();
    if (delta < -56) prev();
    setTouchStart(null);
  }, [next, prev, touchStart]);

  if (!safeBanners.length) return null;

  const slide = safeBanners[current];
  const showContent = Boolean(slide.title || slide.description || slide.label || slide.button_link || slide.button_text);

  return (
    <div
      role="region"
      aria-label="Banner principal"
      tabIndex={0}
      className="storefront-hero"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") next();
        if (event.key === "ArrowLeft") prev();
      }}
    >
      {safeBanners.map((banner, index) => {
        const active = index === current;
        return (
          <div
            key={banner.id || index}
            aria-hidden={!active}
            className={`storefront-hero-media ${active ? "is-active" : ""}`}
          >
            <img
              src={getBannerUrl(banner.image_url, { w: 1600 })}
              srcSet={getBannerSrcSet(banner.image_url)}
              sizes="(max-width: 768px) 100vw, 1400px"
              alt={active ? (banner.title || "") : ""}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "low"}
              decoding={index === 0 ? "sync" : "async"}
            />
          </div>
        );
      })}

      <div className="storefront-hero-overlay" aria-hidden="true" />

      {showContent ? (
        <div className="storefront-hero-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id || current}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={transition}
              className="storefront-hero-copy"
            >
              {slide.label ? (
                <p className="storefront-hero-label">{slide.label}</p>
              ) : null}

              {slide.title ? (
                <h2 className="storefront-hero-title">{slide.title}</h2>
              ) : null}

              {slide.description ? (
                <p className="storefront-hero-description">{slide.description}</p>
              ) : null}

              <Link
                to={slide.button_link || "/productos"}
                className="storefront-hero-button"
              >
                {slide.button_text || "Ver más"}
                <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : null}

      {safeBanners.length > 1 ? (
        <div className="storefront-hero-controls" aria-label="Controles del banner">
          <span className="storefront-hero-count" aria-hidden="true">
            {String(current + 1).padStart(2, "0")} / {String(safeBanners.length).padStart(2, "0")}
          </span>

          <div className="storefront-hero-dots" aria-label="Seleccionar banner">
            {safeBanners.map((banner, index) => (
              <button
                key={banner.id || index}
                type="button"
                onClick={() => go(index)}
                className={`storefront-hero-dot ${index === current ? "is-active" : ""}`}
                aria-label={`Ir al banner ${index + 1}`}
                aria-current={index === current ? "true" : undefined}
              />
            ))}
          </div>

          <div className="storefront-hero-control-actions">
            <button type="button" onClick={prev} className="storefront-hero-icon-button" aria-label="Banner anterior">
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => setPausedByUser((value) => !value)}
              className="storefront-hero-icon-button"
              aria-label={pausedByUser ? "Reanudar banners" : "Pausar banners"}
            >
              {pausedByUser ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button type="button" onClick={next} className="storefront-hero-icon-button" aria-label="Siguiente banner">
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
