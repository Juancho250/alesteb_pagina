// src/pages/Legal.jsx
import { motion } from "framer-motion";
import { ReactLenis } from "lenis/react";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const sections = [
  {
    title: "1. Aceptación de términos",
    body: `Al acceder y utilizar el sitio web de Alesteb Boutique, aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguno de estos términos, no debes usar este sitio. Nos reservamos el derecho de modificar estos términos en cualquier momento con previo aviso de 15 días.`,
  },
  {
    title: "2. Uso del sitio",
    body: `Este sitio es para uso personal y no comercial. No puedes reproducir, duplicar, copiar, vender o explotar ninguna parte del sitio sin nuestro consentimiento expreso por escrito. Cualquier uso no autorizado puede derivar en acciones legales. Debes tener al menos 18 años o contar con autorización de un tutor legal para realizar compras.`,
  },
  {
    title: "3. Cuenta de usuario",
    body: `Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Notifícanos inmediatamente en caso de uso no autorizado de tu cuenta. No somos responsables por pérdidas derivadas del incumplimiento de esta obligación. Una cuenta por persona; cuentas duplicadas pueden ser eliminadas sin previo aviso.`,
  },
  {
    title: "4. Precios y pagos",
    body: `Todos los precios están expresados en pesos colombianos (COP) e incluyen IVA cuando aplica. Nos reservamos el derecho de modificar precios sin previo aviso. Los pedidos solo se confirman una vez verificado el pago. En caso de error de precio evidente, nos reservamos el derecho de cancelar el pedido y reembolsar el pago realizado.`,
  },
  {
    title: "5. Envíos y entregas",
    body: `Los tiempos de entrega son estimados y pueden variar por factores externos (clima, operador logístico, festivos). No somos responsables por demoras ocasionadas por causas de fuerza mayor. El riesgo de pérdida o daño del producto se transfiere al comprador una vez el paquete es entregado al operador logístico y el cliente recibe el número de guía.`,
  },
  {
    title: "6. Devoluciones y cambios",
    body: `Aceptamos cambios dentro de los primeros 7 días calendario desde la recepción del producto, siempre que presente defectos de fabricación comprobables. El producto debe estar en su empaque original y sin señales de uso. No aplican devoluciones por cambio de opinión. Los gastos de envío del cambio corren por cuenta del comprador salvo que el defecto sea verificado.`,
  },
  {
    title: "7. Propiedad intelectual",
    body: `Todo el contenido de este sitio —textos, imágenes, logotipos, diseños, código— es propiedad exclusiva de Alesteb Boutique o sus licenciantes y está protegido por las leyes de propiedad intelectual de Colombia. Queda prohibida su reproducción parcial o total sin autorización escrita. El uso no autorizado puede derivar en acciones civiles y penales.`,
  },
  {
    title: "8. Limitación de responsabilidad",
    body: `Alesteb no será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso o imposibilidad de uso del sitio o sus productos. Nuestra responsabilidad total no superará el monto pagado por el pedido en cuestión. Este sitio puede contener enlaces a terceros sobre los cuales no tenemos control ni responsabilidad.`,
  },
  {
    title: "9. Ley aplicable",
    body: `Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa que surja en relación con estos términos se someterá a los tribunales competentes de la ciudad de Medellín, Colombia, renunciando las partes a cualquier otro fuero que pudiera corresponderles.`,
  },
  {
    title: "10. Contacto",
    body: `Para consultas sobre estos términos y condiciones, escríbenos a web@alesteb.com o comunícate por WhatsApp al +57 314 505 5073. Damos respuesta en máximo 2 días hábiles. También puedes consultar nuestra Política de Privacidad para información adicional sobre el manejo de tus datos.`,
  },
];

export default function Legal() {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: true }}>
      <div className="min-h-screen bg-white text-black font-sans antialiased">
        <main className="pt-24">

          {/* HERO */}
          <section className="max-w-5xl mx-auto px-6 py-20">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.p
                variants={fadeInUp}
                className="text-[10px] font-black tracking-[0.5em] uppercase text-neutral-400 mb-6"
              >
                Términos y Condiciones · Alesteb
              </motion.p>
              <motion.div variants={fadeInUp} className="flex items-end gap-6 mb-8">
                <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.9] uppercase">
                  Claro y
                  <br />
                  <span className="italic text-neutral-400">sin letra chica.</span>
                </h1>
                <div className="hidden sm:flex mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center text-white">
                    <Scale size={26} />
                  </div>
                </div>
              </motion.div>
              <motion.p
                variants={fadeInUp}
                className="text-[15px] text-neutral-500 max-w-xl leading-relaxed"
              >
                Estos son los términos que rigen el uso de Alesteb. Los
                escribimos en lenguaje claro porque creemos que mereces
                entender exactamente con qué acuerdas.
              </motion.p>
              <motion.p
                variants={fadeInUp}
                className="text-[11px] text-neutral-400 font-bold mt-4"
              >
                Última actualización: enero 2026
              </motion.p>
            </motion.div>
          </section>

          {/* RESUMEN RÁPIDO */}
          <section className="px-6 pb-6">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {[
                  { emoji: "✅", title: "Compras seguras", desc: "Pago verificado antes de despachar." },
                  { emoji: "🔄", title: "Cambios justos", desc: "7 días si el producto tiene defectos." },
                  { emoji: "⚖️", title: "Ley colombiana", desc: "Nos rigen las normas de Colombia." },
                ].map(({ emoji, title, desc }) => (
                  <motion.div
                    key={title}
                    variants={fadeInUp}
                    className="bg-[#f5f5f7] rounded-2xl p-6"
                  >
                    <span className="text-3xl mb-3 block">{emoji}</span>
                    <h3 className="font-black text-[12px] uppercase tracking-widest mb-1">{title}</h3>
                    <p className="text-[13px] text-neutral-500">{desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* ÍNDICE */}
          <section className="px-6 pt-6 pb-2">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="border border-neutral-100 rounded-2xl p-6 flex flex-wrap gap-3"
              >
                {sections.map((s) => (
                  <a
                    key={s.title}
                    href={`#${s.title.replace(/\s+/g, "-").toLowerCase()}`}
                    className="text-[11px] font-bold text-neutral-500 hover:text-blue-600 transition-colors"
                  >
                    {s.title.split(". ")[1]}
                  </a>
                ))}
              </motion.div>
            </div>
          </section>

          {/* CONTENIDO */}
          <section className="py-12 px-6 pb-32">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
              >
                {sections.map((s, i) => (
                  <motion.div
                    key={s.title}
                    variants={fadeInUp}
                    id={s.title.replace(/\s+/g, "-").toLowerCase()}
                    className={`py-10 ${i < sections.length - 1 ? "border-b border-neutral-100" : ""}`}
                  >
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-900 mb-3">
                      {s.title}
                    </h2>
                    <p className="text-[15px] text-neutral-600 leading-[1.8]">{s.body}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Links relacionados */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <Link
                  to="/privacidad"
                  className="group bg-[#f5f5f7] rounded-2xl p-6 hover:bg-neutral-900 hover:text-white transition-all duration-300"
                >
                  <p className="text-[9px] font-black tracking-[0.3em] uppercase text-neutral-400 group-hover:text-neutral-500 mb-2">
                    También te interesa
                  </p>
                  <p className="font-black text-[15px] tracking-tight">
                    Política de Privacidad →
                  </p>
                </Link>
                <Link
                  to="/contact"
                  className="group bg-neutral-900 text-white rounded-2xl p-6 hover:bg-blue-600 transition-all duration-300"
                >
                  <p className="text-[9px] font-black tracking-[0.3em] uppercase text-neutral-500 mb-2">
                    ¿Dudas legales?
                  </p>
                  <p className="font-black text-[15px] tracking-tight">
                    Contactar al equipo →
                  </p>
                </Link>
              </motion.div>
            </div>
          </section>

        </main>
      </div>
    </ReactLenis>
  );
}