// src/pages/Contact.jsx
import { motion } from "framer-motion";
import { ReactLenis } from "lenis/react";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Send,
  Instagram,
  MessageCircle,
  Mail,
  MapPin,
  Loader2,
  CheckCircle,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const channels = [
  {
    icon: <MessageCircle size={20} />,
    label: "WhatsApp",
    value: "+57 314 505 5073",
    href: "https://wa.me/573145055073",
    cta: "Iniciar chat",
  },
  {
    icon: <Mail size={20} />,
    label: "Email",
    value: "web@alesteb.com",
    href: "mailto:web@alesteb.com",
    cta: "Enviar email",
  },
  {
    icon: <Instagram size={20} />,
    label: "Instagram",
    value: "@alesteb",
    href: "https://instagram.com/alesteb",
    cta: "Seguirnos",
  },
  {
    icon: <MapPin size={20} />,
    label: "Ubicación",
    value: "Colombia",
    href: null,
    cta: null,
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    // Simulación — reemplaza con tu endpoint real si tienes uno
    await new Promise((r) => setTimeout(r, 1800));
    setStatus("sent");
  };

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: true }}>
      <div className="min-h-screen bg-white text-black font-sans antialiased">
        <main className="pt-24">

          {/* ── HERO ───────────────────────────────── */}
          <section className="max-w-5xl mx-auto px-6 py-20">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.p
                variants={fadeInUp}
                className="text-[10px] font-black tracking-[0.5em] uppercase text-neutral-400 mb-6"
              >
                Contacto · Alesteb
              </motion.p>
              <motion.h1
                variants={fadeInUp}
                className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.9] uppercase mb-8"
              >
                Hablemos
                <br />
                <span className="italic text-neutral-400">sin filtros.</span>
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="text-[16px] text-neutral-500 max-w-md leading-relaxed"
              >
                Tienes una pregunta, una queja o simplemente quieres saludar.
                Aquí estamos.
              </motion.p>
            </motion.div>
          </section>

          {/* ── CONTENIDO PRINCIPAL ─────────────────── */}
          <section className="pb-32 px-6">
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">

              {/* Canales */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="lg:col-span-2 flex flex-col gap-4"
              >
                <motion.div variants={fadeInUp}>
                  <div className="h-1 w-10 bg-black rounded-full mb-4" />
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-6">
                    Canales directos
                  </h2>
                </motion.div>

                {channels.map(({ icon, label, value, href, cta }) => (
                  <motion.div
                    key={label}
                    variants={fadeInUp}
                    className="bg-[#f5f5f7] rounded-2xl p-5 flex items-center justify-between group hover:bg-neutral-900 hover:text-white transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-blue-600 group-hover:text-blue-400 transition-colors">
                        {icon}
                      </div>
                      <div>
                        <p className="text-[9px] font-black tracking-[0.3em] uppercase text-neutral-400 group-hover:text-neutral-500">
                          {label}
                        </p>
                        <p className="font-bold text-[14px] mt-0.5">{value}</p>
                      </div>
                    </div>
                    {href && cta && (
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer"
                        className="text-[10px] font-black tracking-widest uppercase text-blue-600 group-hover:text-blue-400 whitespace-nowrap"
                      >
                        {cta} →
                      </a>
                    )}
                  </motion.div>
                ))}

                {/* Horario */}
                <motion.div
                  variants={fadeInUp}
                  className="mt-4 border border-neutral-100 rounded-2xl p-5"
                >
                  <p className="text-[9px] font-black tracking-[0.3em] uppercase text-neutral-400 mb-3">
                    Horario de atención
                  </p>
                  <div className="space-y-1.5 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Lun – Vie</span>
                      <span className="font-bold">8:00 am – 7:00 pm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Sábado</span>
                      <span className="font-bold">9:00 am – 4:00 pm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Domingo</span>
                      <span className="font-bold text-neutral-300">Cerrado</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Formulario */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="lg:col-span-3"
              >
                <div className="bg-[#f5f5f7] rounded-3xl p-8 md:p-10">
                  {status === "sent" ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                      <CheckCircle size={48} className="text-green-500" />
                      <h3 className="text-2xl font-black tracking-tighter">
                        ¡Mensaje enviado!
                      </h3>
                      <p className="text-neutral-500 text-[14px] max-w-xs">
                        Te respondemos en menos de 24 horas hábiles.
                      </p>
                      <button
                        onClick={() => { setStatus("idle"); setForm({ name: "", email: "", subject: "", message: "" }); }}
                        className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Enviar otro mensaje
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-8">
                        Formulario directo
                      </h2>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <ContactInput
                            label="Nombre"
                            name="name"
                            placeholder="Tu nombre"
                            value={form.name}
                            onChange={handleChange}
                            required
                          />
                          <ContactInput
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <ContactInput
                          label="Asunto"
                          name="subject"
                          placeholder="¿En qué podemos ayudarte?"
                          value={form.subject}
                          onChange={handleChange}
                          required
                        />
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">
                            Mensaje
                          </label>
                          <textarea
                            name="message"
                            placeholder="Cuéntanos con detalle..."
                            value={form.message}
                            onChange={handleChange}
                            required
                            rows={5}
                            className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-[13px] font-medium outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 transition-all resize-none placeholder:text-neutral-300"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={status === "sending"}
                          className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white py-4 rounded-xl font-black text-[10px] tracking-[0.25em] uppercase hover:bg-blue-600 transition-colors disabled:opacity-60"
                        >
                          {status === "sending" ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <>
                              <Send size={14} /> Enviar mensaje
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </motion.div>

            </div>
          </section>

        </main>
      </div>
    </ReactLenis>
  );
}

function ContactInput({ label, name, type = "text", placeholder, value, onChange, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-[13px] font-medium outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 transition-all placeholder:text-neutral-300"
      />
    </div>
  );
}