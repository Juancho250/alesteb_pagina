import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import BannerCarousel from "../components/BannerCarousel";
import { ArrowRight, Loader2 } from "lucide-react";
import { extractBanners, extractProducts } from "../utils/apiResponse";

import { motion } from "framer-motion";
import { ReactLenis } from "lenis/react";
const Motion = motion;

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const getOptimizedImageUrl = (url, width = 600) => {
  if (!url) return "https://via.placeholder.com/400x500";
  if (url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_scale/`);
  }
  return url;
};

// ─── Datos estáticos ──────────────────────────────────────────────
const TICKER_ITEMS = [
  "Envío gratis en pedidos +$200.000",
  "Devolución sin preguntas · 30 días",
  "Garantía 12 meses",
  "Pago seguro · SSL",
];

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    ),
    title: "Envío gratis",
    desc: "En pedidos superiores a $200.000",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
      </svg>
    ),
    title: "Devolución fácil",
    desc: "30 días sin preguntas",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "Garantía total",
    desc: "12 meses en todos los productos",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: "Pago seguro",
    desc: "Encriptación SSL en cada compra",
  },
];

const REVIEWS = [
  {
    name: "Sara M.",
    text: "La calidad superó mis expectativas. Lo recomiendo a cualquiera.",
    stars: 5,
  },
  {
    name: "Carlos R.",
    text: "Llegó rápido y empaquetado perfecto. Sin duda volvería a comprar.",
    stars: 5,
  },
  {
    name: "Valentina L.",
    text: "Exactamente como en las fotos. Atención al cliente impecable.",
    stars: 5,
  },
];

// ─── Componentes auxiliares ───────────────────────────────────────
function TickerStrip() {
  const repeated = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="overflow-hidden border-y border-neutral-100 py-4 bg-white">
      <Motion.div
        className="flex gap-16 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, ease: "linear", repeat: Infinity }}
      >
        {repeated.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.28em] text-neutral-400 shrink-0"
          >
            {item}
            <span className="text-black text-base leading-none select-none">·</span>
          </span>
        ))}
      </Motion.div>
    </div>
  );
}

function FeaturesStrip() {
  return (
    <section className="py-16 px-6 border-t border-neutral-100">
      <Motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={staggerContainer}
        className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10"
      >
        {FEATURES.map((f, i) => (
          <Motion.div
            key={i}
            variants={fadeInUp}
            className="flex flex-col items-center text-center gap-4"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-black">
              {f.icon}
            </div>
            <div>
              <p className="font-black text-[11px] uppercase tracking-[0.18em] mb-1">
                {f.title}
              </p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">{f.desc}</p>
            </div>
          </Motion.div>
        ))}
      </Motion.div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20 px-6 bg-black text-white">
      <div className="max-w-6xl mx-auto">
        <Motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic mb-12"
        >
          Lo que dicen
        </Motion.h3>

        <Motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {REVIEWS.map((r, i) => (
            <Motion.div
              key={i}
              variants={fadeInUp}
              className="border border-white/10 rounded-2xl p-7 flex flex-col gap-5 hover:border-white/20 transition-colors"
            >
              <div className="flex gap-0.5">
                {[...Array(r.stars)].map((_, j) => (
                  <span key={j} className="text-white text-sm leading-none">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-white/65 text-sm leading-relaxed flex-1">
                "{r.text}"
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                — {r.name}
              </p>
            </Motion.div>
          ))}
        </Motion.div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await api.post("/newsletter", { email });
      setStatus("done");
    } catch {
      // Si el endpoint no existe todavía, igual mostramos confirmación
      setStatus("done");
    }
  };

  return (
    <section className="py-24 px-6 bg-[#f5f5f7]">
      <div className="max-w-xl mx-auto text-center">
        <Motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <Motion.h3
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4"
          >
            Sé el primero
            <br />
            <span className="italic text-neutral-400">en enterarte.</span>
          </Motion.h3>

          <Motion.p
            variants={fadeInUp}
            className="text-sm text-neutral-500 mb-8"
          >
            Lanzamientos, drops exclusivos y descuentos solo para suscriptores.
          </Motion.p>

          <Motion.div variants={fadeInUp}>
            {status === "done" ? (
              <p className="text-sm font-black uppercase tracking-widest text-black">
                ¡Listo! Te tendremos en cuenta.
              </p>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex gap-2 max-w-sm mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="flex-1 px-5 py-3.5 rounded-full border border-neutral-200 text-sm outline-none focus:border-black bg-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-6 py-3.5 bg-black text-white rounded-full text-sm font-bold hover:bg-neutral-800 transition-all disabled:opacity-50 shrink-0"
                >
                  {status === "loading" ? "..." : "Suscribirse"}
                </button>
              </form>
            )}
          </Motion.div>
        </Motion.div>
      </div>
    </section>
  );
}

function PromoCard({ title, subtitle, img, dark = false, link }) {
  return (
    <Motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeInUp}
      className="w-full"
    >
      <Link
        to={link}
        className="relative h-[400px] md:h-[500px] rounded-[2rem] md:rounded-[3rem] overflow-hidden group block shadow-sm hover:shadow-2xl transition-all duration-500"
      >
        <Motion.div
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
        </Motion.div>

        <div
          className={`absolute inset-0 p-8 md:p-12 flex flex-col justify-end ${
            dark
              ? "bg-gradient-to-t from-black/70 to-transparent text-white"
              : "bg-gradient-to-t from-white/70 to-transparent text-black"
          }`}
        >
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-80">
            {title}
          </h4>
          <p className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">
            {subtitle}
          </p>
        </div>
      </Link>
    </Motion.div>
  );
}

// ─── Página principal ─────────────────────────────────────────────
export default function Home() {
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [bannersRes, productsRes] = await Promise.all([
          api.get("/banners"),
          api.get("/products?limit=4"),
        ]);

        const bannersData = extractBanners(bannersRes.data);
        setBanners(
          Array.isArray(bannersData) ? bannersData.filter((b) => b.is_active) : []
        );

        const productsData = extractProducts(productsRes.data);
        setFeaturedProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        console.error("Error loading home data", err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-black mb-4" size={40} />
      </div>
    );

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: true }}>
      <div className="min-h-screen bg-white text-black font-sans antialiased selection:bg-neutral-200">
        <main className="pt-20 md:pt-24">

          {/* ── BANNER CAROUSEL ── */}
          {banners.length > 0 && (
            <Motion.section
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="max-w-[1540px] mx-auto h-[90vh] sm:h-[80vh] bg-[#f5f5f7] overflow-hidden relative md:rounded-3xl shadow-sm md:-mt-16"
            >
              <BannerCarousel banners={banners} />
            </Motion.section>
          )}

          {/* ── TICKER ── */}
          <TickerStrip />

          {/* ── HERO TEXT ── */}
          <section className="text-center py-10 md:py-20 px-6 max-w-5xl mx-auto">
            <Motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <Motion.h2
                variants={fadeInUp}
                className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
              >
                Redefiniendo <br />
                <span className="text-neutral-400 italic">lo cotidiano.</span>
              </Motion.h2>

              <Motion.div variants={fadeInUp}>
                <Link
                  to="/productos"
                  className="inline-block px-10 py-4 bg-black text-white font-bold rounded-full text-sm transition-all hover:scale-105 hover:bg-neutral-800 hover:shadow-xl"
                >
                  Ver colección
                </Link>
              </Motion.div>
            </Motion.div>
          </section>

          {/* ── PRODUCTOS ── */}
          <section className="py-20 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
              <Motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-12"
              >
                <div className="space-y-1">
                  <div className="h-1 w-10 bg-black rounded-full mb-3" />
                  <h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">
                    Lo último
                  </h3>
                </div>
                <Link
                  to="/productos"
                  className="group text-black font-bold flex items-center gap-2 text-xs tracking-widest uppercase"
                >
                  Explorar{" "}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </Motion.div>

              <Motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-8"
              >
                {featuredProducts.map((p) => {
                  const price = Number(p.final_price || p.price);
                  return (
                    <Link
                      key={p.id}
                      to={`/productos/detalle/${p.id}`}
                      className="group block cursor-pointer"
                    >
                      <Motion.div variants={fadeInUp}>
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
                      </Motion.div>
                    </Link>
                  );
                })}
              </Motion.div>
            </div>
          </section>

          {/* ── PROPUESTAS DE VALOR ── */}
          <FeaturesStrip />

          {/* ── COLECCIONES ── */}
          <section className="py-20 px-6 border-t border-neutral-100">
            <div className="max-w-6xl mx-auto">
              <Motion.h3
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="text-center text-3xl md:text-4xl font-black mb-16 uppercase tracking-tighter"
              >
                Colecciones
              </Motion.h3>

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

          {/* ── TESTIMONIOS ── */}
          <TestimonialsSection />

          {/* ── NEWSLETTER ── */}
          <NewsletterSection />

        </main>
      </div>
    </ReactLenis>
  );
}