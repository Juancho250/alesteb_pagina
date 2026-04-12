// src/pages/Support.jsx
import { motion } from "framer-motion";
import { ReactLenis } from "lenis/react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  RefreshCw,
  Truck,
  MessageCircle,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const faqs = [
  {
    q: "¿Cuánto tarda mi pedido en llegar?",
    a: "Los envíos dentro de Colombia toman entre 2 y 5 días hábiles según tu ciudad. Para Medellín y Bogotá generalmente llegan en 1-2 días.",
  },
  {
    q: "¿Cómo confirmo mi pago?",
    a: "Una vez realices tu transferencia o depósito, súbela en la sección 'Mis Pedidos' usando el botón 'Subir comprobante'. Nuestro equipo la verificará en máximo 24 horas hábiles.",
  },
  {
    q: "¿Puedo cancelar mi pedido?",
    a: "Sí, puedes cancelar un pedido siempre que esté en estado 'Pendiente'. Ve a tu historial de pedidos y selecciona la opción cancelar. Una vez confirmado el pago, no aplican cancelaciones.",
  },
  {
    q: "¿Qué garantía tienen los productos?",
    a: "Todos los productos cuentan con garantía mínima de 3 meses contra defectos de fabricación. Algunos productos premium tienen garantía extendida de hasta 1 año.",
  },
  {
    q: "¿Hacen cambios o devoluciones?",
    a: "Aceptamos cambios dentro de los primeros 7 días si el producto presenta defectos. El artículo debe estar en su estado original sin uso. Contáctanos por WhatsApp para coordinar.",
  },
  {
    q: "¿Cómo rastreo mi pedido?",
    a: "Una vez despachado, te enviamos el número de guía a tu email. También puedes consultarlo directamente en tu perfil dentro de la sección 'Mis Pedidos'.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeInUp}
      className="border-b border-neutral-100 last:border-b-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-5 text-left gap-4 group"
      >
        <span className="font-bold text-[15px] text-neutral-900 group-hover:text-blue-600 transition-colors">
          {q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-neutral-400 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          open ? "max-h-40 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-[14px] text-neutral-500 leading-relaxed">{a}</p>
      </div>
    </motion.div>
  );
}

export default function Support() {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: true }}>
      <div className="min-h-screen bg-white text-black font-sans antialiased">
        <main className="pt-24">

          {/* ── HERO ───────────────────────────────── */}
          <section className="max-w-5xl mx-auto px-6 py-20 text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.p
                variants={fadeInUp}
                className="text-[10px] font-black tracking-[0.5em] uppercase text-neutral-400 mb-6"
              >
                Centro de Ayuda · Alesteb
              </motion.p>
              <motion.h1
                variants={fadeInUp}
                className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.9] uppercase mb-8"
              >
                Estamos
                <br />
                <span className="italic text-neutral-400">contigo.</span>
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="text-[16px] text-neutral-500 max-w-lg mx-auto leading-relaxed"
              >
                Encuentra respuestas rápidas o contáctanos directamente.
                Nuestro equipo responde en menos de 24 horas.
              </motion.p>
            </motion.div>
          </section>

          {/* ── TARJETAS DE SOPORTE ─────────────────── */}
          <section className="bg-[#f5f5f7] py-20 px-6">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {[
                  {
                    icon: <ShieldCheck size={22} />,
                    title: "Garantía",
                    desc: "Todos los productos con respaldo mínimo de 3 meses.",
                  },
                  {
                    icon: <RefreshCw size={22} />,
                    title: "Cambios",
                    desc: "7 días para cambios por defectos de fabricación.",
                  },
                  {
                    icon: <Truck size={22} />,
                    title: "Envíos",
                    desc: "2 a 5 días hábiles a todo Colombia.",
                  },
                  {
                    icon: <MessageCircle size={22} />,
                    title: "WhatsApp",
                    desc: "Atención directa lunes a sábado 8am – 7pm.",
                  },
                ].map(({ icon, title, desc }) => (
                  <motion.div
                    key={title}
                    variants={fadeInUp}
                    className="bg-white rounded-2xl p-6 border border-neutral-100 hover:shadow-md transition-shadow"
                  >
                    <div className="text-blue-600 mb-4">{icon}</div>
                    <h3 className="font-black text-[13px] uppercase tracking-widest mb-2">
                      {title}
                    </h3>
                    <p className="text-[13px] text-neutral-500 leading-relaxed">
                      {desc}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* ── FAQ ────────────────────────────────── */}
          <section className="py-24 px-6">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="mb-14"
              >
                <div className="h-1 w-10 bg-black rounded-full mb-4" />
                <h2 className="text-4xl font-black tracking-tighter uppercase italic">
                  Preguntas frecuentes
                </h2>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="bg-[#f5f5f7] rounded-3xl p-6 md:p-10"
              >
                {faqs.map((faq) => (
                  <FaqItem key={faq.q} {...faq} />
                ))}
              </motion.div>
            </div>
          </section>

          {/* ── CTA CONTACTO ───────────────────────── */}
          <section className="pb-32 px-6">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="bg-neutral-900 text-white rounded-[2.5rem] px-10 py-16 text-center"
              >
                <p className="text-[10px] font-black tracking-[0.5em] uppercase text-neutral-500 mb-4">
                  ¿No encontraste tu respuesta?
                </p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-8 leading-tight">
                  Habla con
                  <br />
                  <span className="italic text-neutral-400">nuestro equipo.</span>
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="https://wa.me/573145055073"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black text-[11px] tracking-widest uppercase rounded-full hover:bg-neutral-100 transition-colors"
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-8 py-4 border border-neutral-700 text-white font-black text-[11px] tracking-widest uppercase rounded-full hover:border-white transition-colors"
                  >
                    Formulario <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>

        </main>
      </div>
    </ReactLenis>
  );
}