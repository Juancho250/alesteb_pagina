// src/pages/Privacy.jsx
import { motion } from "framer-motion";
import { ReactLenis } from "lenis/react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

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
    title: "1. Información que recopilamos",
    body: `Cuando te registras en Alesteb recopilamos tu nombre, correo electrónico, cédula, teléfono y dirección de envío. También registramos información de navegación como páginas visitadas, productos vistos y datos de dispositivo para mejorar tu experiencia de compra. Nunca recopilamos información sin tu consentimiento explícito.`,
  },
  {
    title: "2. Cómo usamos tu información",
    body: `Usamos tus datos exclusivamente para procesar tus pedidos, enviarte confirmaciones por correo, coordinar entregas y brindarte soporte. Nunca vendemos, alquilamos ni compartimos tu información personal con terceros con fines comerciales. Podemos compartir datos mínimos necesarios con proveedores logísticos únicamente para completar tu entrega.`,
  },
  {
    title: "3. Seguridad de tus datos",
    body: `Tus contraseñas se almacenan cifradas con bcrypt (salt rounds 12). Las comunicaciones entre tu navegador y nuestros servidores van protegidas con HTTPS/TLS. Los tokens de sesión tienen expiración automática y se revocan al cerrar sesión. Realizamos revisiones periódicas de seguridad en nuestra infraestructura.`,
  },
  {
    title: "4. Cookies",
    body: `Usamos cookies de sesión estrictamente necesarias para mantener tu carrito activo y tu estado de autenticación. No usamos cookies de rastreo publicitario de terceros. Puedes deshabilitar las cookies en tu navegador aunque esto puede afectar el funcionamiento del sitio.`,
  },
  {
    title: "5. Tus derechos",
    body: `Tienes derecho a acceder, corregir o eliminar tus datos personales en cualquier momento. Puedes actualizarlos directamente desde tu perfil o enviarnos un correo a web@alesteb.com. Para solicitar la eliminación completa de tu cuenta escríbenos y procesaremos tu solicitud en máximo 15 días hábiles.`,
  },
  {
    title: "6. Retención de datos",
    body: `Conservamos tus datos mientras tu cuenta esté activa o sea necesario para prestarte el servicio. Si eliminas tu cuenta, eliminamos tu información personal en un plazo de 30 días, exceptuando los registros contables que debemos conservar por obligación legal por un período de 5 años.`,
  },
  {
    title: "7. Cambios a esta política",
    body: `Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos por correo electrónico y mediante un aviso visible en el sitio al menos 15 días antes de que los cambios entren en vigor. El uso continuado del sitio después de esa fecha implica tu aceptación de los cambios.`,
  },
  {
    title: "8. Contacto",
    body: `Para cualquier pregunta sobre esta política o el manejo de tus datos personales, escríbenos a web@alesteb.com o comunícate con nosotros a través de WhatsApp al +57 314 505 5073. Respondemos en máximo 2 días hábiles.`,
  },
];

export default function Privacy() {
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
                Política de Privacidad · Alesteb
              </motion.p>
              <motion.div variants={fadeInUp} className="flex items-end gap-6 mb-8">
                <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.9] uppercase">
                  Tus datos,
                  <br />
                  <span className="italic text-neutral-400">tu control.</span>
                </h1>
                <div className="hidden sm:flex mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                    <ShieldCheck size={26} />
                  </div>
                </div>
              </motion.div>
              <motion.p
                variants={fadeInUp}
                className="text-[15px] text-neutral-500 max-w-xl leading-relaxed"
              >
                En Alesteb tratamos tu información con total transparencia.
                Esta política describe exactamente qué datos recopilamos, cómo
                los usamos y cómo los protegemos.
              </motion.p>
              <motion.p
                variants={fadeInUp}
                className="text-[11px] text-neutral-400 font-bold mt-4"
              >
                Última actualización: enero 2026
              </motion.p>
            </motion.div>
          </section>

          {/* ÍNDICE */}
          <section className="px-6 pb-6">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="bg-[#f5f5f7] rounded-2xl p-6 flex flex-wrap gap-3"
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
                className="space-y-0"
              >
                {sections.map((s, i) => (
                  <motion.div
                    key={s.title}
                    variants={fadeInUp}
                    id={s.title.replace(/\s+/g, "-").toLowerCase()}
                    className={`py-10 ${i < sections.length - 1 ? "border-b border-neutral-100" : ""}`}
                  >
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3">
                      {s.title}
                    </h2>
                    <p className="text-[15px] text-neutral-600 leading-[1.8]">{s.body}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA final */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="mt-16 bg-neutral-900 text-white rounded-3xl p-10 text-center"
              >
                <p className="text-[10px] font-black tracking-[0.4em] uppercase text-neutral-500 mb-3">
                  ¿Tienes preguntas?
                </p>
                <h3 className="text-2xl font-black tracking-tighter mb-6">
                  Estamos disponibles para aclarar cualquier duda.
                </h3>
                <Link
                  to="/contact"
                  className="inline-block px-8 py-3 bg-white text-black font-black text-[10px] tracking-widest uppercase rounded-full hover:bg-neutral-100 transition-colors"
                >
                  Contáctanos →
                </Link>
              </motion.div>
            </div>
          </section>

        </main>
      </div>
    </ReactLenis>
  );
}