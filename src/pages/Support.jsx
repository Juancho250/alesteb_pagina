import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  Mail,
  MessageCircle,
  PackageSearch,
  Phone,
  ShieldQuestion,
} from "lucide-react";
import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";

function whatsappHref(value) {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text;
  const digits = text.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--store-border)] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-16 w-full items-center justify-between gap-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[var(--store-text-primary)]">{question}</span>
        <ChevronDown size={17} className={`shrink-0 text-[var(--store-text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <p className="pb-5 pr-8 text-sm leading-6 text-[var(--store-text-secondary)]">{answer}</p> : null}
    </div>
  );
}

export default function Support() {
  const { runtime } = useSiteRuntime();
  const businessName = runtime.identity.businessName || "la tienda";
  const phone = runtime.identity.contact.phone ? String(runtime.identity.contact.phone) : "";
  const email = runtime.identity.contact.email ? String(runtime.identity.contact.email) : "";
  const whatsapp = whatsappHref(runtime.identity.socialLinks?.whatsapp || phone);

  const channels = useMemo(() => [
    email ? {
      key: "email",
      icon: Mail,
      label: "Correo",
      value: email,
      href: `mailto:${email}`,
    } : null,
    phone ? {
      key: "phone",
      icon: Phone,
      label: "Teléfono",
      value: phone,
      href: `tel:${phone.replace(/[^\d+]/g, "")}`,
    } : null,
    whatsapp ? {
      key: "whatsapp",
      icon: MessageCircle,
      label: "WhatsApp",
      value: "Abrir conversación",
      href: whatsapp,
    } : null,
  ].filter(Boolean), [email, phone, whatsapp]);

  const faqs = [
    {
      question: "¿Dónde puedo consultar mis pedidos?",
      answer: "Inicia sesión y abre tu perfil. Allí encontrarás la información de pedidos que la tienda tenga disponible para tu cuenta.",
    },
    {
      question: "¿Qué pasa si cambia la disponibilidad de un producto?",
      answer: "La disponibilidad se valida durante el proceso de compra. Si una unidad deja de estar disponible, el carrito o el checkout te indicarán que debes ajustar el pedido.",
    },
    {
      question: "¿Dónde consulto tiempos de entrega, cambios o garantías?",
      answer: `Esas condiciones dependen de ${businessName}. Consulta la información publicada por la tienda o utiliza uno de sus canales de contacto antes de comprar.`,
    },
    {
      question: "¿Qué información conviene enviar al solicitar ayuda?",
      answer: "Incluye el número de pedido si ya compraste, el producto relacionado y una descripción breve del problema. Evita enviar contraseñas o datos sensibles por mensajes.",
    },
  ];

  return (
    <div className="storefront-container pb-24 pt-10 sm:pt-16">
      <header className="mx-auto max-w-3xl text-center">
        <p className="storefront-kicker">Soporte · {businessName}</p>
        <h1 className="storefront-title mt-5 !text-[clamp(2.8rem,7vw,5.8rem)]">¿Cómo podemos ayudarte?</h1>
        <p className="storefront-copy mx-auto mt-6 max-w-2xl">
          Consulta información básica sobre tu compra o utiliza los canales que la tienda haya publicado.
        </p>
      </header>

      {channels.length > 0 ? (
        <section className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map(({ key, icon: Icon, label, value, href }) => (
            <a
              key={key}
              href={href}
              target={key === "whatsapp" ? "_blank" : undefined}
              rel={key === "whatsapp" ? "noreferrer" : undefined}
              className="storefront-surface group flex min-w-0 items-center gap-4 p-5 transition-transform hover:-translate-y-0.5"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--store-surface-elevated)] text-[var(--store-text-primary)]">
                <Icon size={17} strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="storefront-kicker !text-[0.61rem]">{label}</span>
                <span className="mt-1 block truncate text-sm font-semibold text-[var(--store-text-primary)]">{value}</span>
              </span>
            </a>
          ))}
        </section>
      ) : null}

      <section className="mt-16 grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-start">
        <div className="storefront-elevated p-6 sm:p-8">
          <ShieldQuestion size={21} strokeWidth={1.7} className="text-[var(--store-text-muted)]" />
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-[var(--store-text-primary)]">Información clara, sin asumir políticas</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--store-text-secondary)]">
            Los tiempos de envío, condiciones de cambio, garantía y medios de atención pueden variar entre tiendas. Esta página no inventa esas condiciones: muestra únicamente lo que puede verificarse o te dirige al comercio.
          </p>
          <Link to="/contact" className="storefront-secondary-button mt-6">
            Formulario de contacto <ArrowRight size={14} />
          </Link>
        </div>

        <div className="storefront-surface p-6 sm:p-8">
          <div className="mb-3 flex items-center gap-3">
            <PackageSearch size={19} strokeWidth={1.7} className="text-[var(--store-text-muted)]" />
            <div>
              <p className="storefront-kicker">Ayuda rápida</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--store-text-primary)]">Preguntas frecuentes</h2>
            </div>
          </div>
          <div className="mt-4">
            {faqs.map((faq) => <FaqItem key={faq.question} {...faq} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
