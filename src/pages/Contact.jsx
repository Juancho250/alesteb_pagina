import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Instagram,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import api from "../services/api";
import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";

function normalizeSocialUrl(key, value) {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text;

  if (key === "whatsapp") {
    const digits = text.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : null;
  }

  const handle = text.replace(/^@/, "");
  if (!handle || handle.includes(" ")) return null;
  if (key === "instagram") return `https://instagram.com/${handle}`;
  if (key === "tiktok") return `https://tiktok.com/@${handle}`;
  if (key === "x" || key === "twitter") return `https://x.com/${handle}`;
  if (key === "facebook") return `https://facebook.com/${handle}`;
  return null;
}

function ContactChannel({ icon: Icon, label, value, href }) {
  const content = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--store-surface-elevated)] text-[var(--store-text-primary)]">
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="storefront-kicker !text-[0.61rem]">{label}</span>
        <span className="mt-1 block truncate text-sm font-semibold text-[var(--store-text-primary)]">{value}</span>
      </span>
      {href ? <ExternalLink size={14} className="shrink-0 text-[var(--store-text-muted)]" /> : null}
    </>
  );

  if (!href) return <div className="storefront-surface flex items-center gap-4 p-5">{content}</div>;

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="storefront-surface flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5"
    >
      {content}
    </a>
  );
}

export default function Contact() {
  const { runtime } = useSiteRuntime();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const businessName = runtime.identity.businessName || "la tienda";
  const email = runtime.identity.contact.email ? String(runtime.identity.contact.email) : "";
  const phone = runtime.identity.contact.phone ? String(runtime.identity.contact.phone) : "";
  const location = [
    runtime.identity.location.address,
    runtime.identity.location.city,
    runtime.identity.location.department,
    runtime.identity.location.country,
  ].filter(Boolean).join(", ");

  const channels = useMemo(() => {
    const links = runtime.identity.socialLinks || {};
    const values = [];

    if (phone) {
      const digits = phone.replace(/[^\d+]/g, "");
      values.push({ key: "phone", icon: Phone, label: "Teléfono", value: phone, href: digits ? `tel:${digits}` : null });
    }
    if (email) values.push({ key: "email", icon: Mail, label: "Correo", value: email, href: `mailto:${email}` });
    if (location) values.push({ key: "location", icon: MapPin, label: "Ubicación", value: location, href: null });

    const whatsapp = normalizeSocialUrl("whatsapp", links.whatsapp);
    if (whatsapp) values.push({ key: "whatsapp", icon: MessageCircle, label: "WhatsApp", value: "Abrir conversación", href: whatsapp });

    const instagram = normalizeSocialUrl("instagram", links.instagram);
    if (instagram) values.push({ key: "instagram", icon: Instagram, label: "Instagram", value: String(links.instagram), href: instagram });

    return values;
  }, [email, phone, location, runtime.identity.socialLinks]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      await api.post("/contact", form);
      setStatus("sent");
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "No fue posible enviar el mensaje. Intenta de nuevo.");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setErrorMsg("");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="storefront-container pb-24 pt-10 sm:pt-16">
      <header className="max-w-3xl">
        <p className="storefront-kicker">Contacto · {businessName}</p>
        <h1 className="storefront-title mt-5 !text-[clamp(2.8rem,7vw,5.8rem)]">Hablemos.</h1>
        <p className="storefront-copy mt-6 max-w-2xl">
          Envíanos un mensaje o usa uno de los canales que {businessName} tenga publicados.
        </p>
      </header>

      <div className="mt-14 grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <aside>
          <p className="storefront-kicker">Canales disponibles</p>
          {channels.length > 0 ? (
            <div className="mt-4 space-y-3">
              {channels.map((channel) => <ContactChannel key={channel.key} {...channel} />)}
            </div>
          ) : (
            <div className="storefront-surface mt-4 p-5">
              <p className="text-sm leading-6 text-[var(--store-text-muted)]">
                La tienda no ha publicado canales adicionales. Puedes utilizar el formulario de contacto.
              </p>
            </div>
          )}
        </aside>

        <section className="storefront-elevated p-6 sm:p-9 lg:p-10">
          {status === "sent" ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 size={25} strokeWidth={1.7} />
              </span>
              <h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em] text-[var(--store-text-primary)]">Mensaje enviado</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--store-text-muted)]">Tu mensaje fue recibido por el canal de contacto de la tienda.</p>
              <button type="button" onClick={handleReset} className="storefront-secondary-button mt-6">Enviar otro mensaje</button>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <p className="storefront-kicker">Formulario</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[var(--store-text-primary)]">Escríbenos</h2>
              </div>

              {status === "error" ? (
                <div className="mb-5 flex items-start gap-3 rounded-[var(--store-radius-sm)] border border-red-500/20 bg-red-500/8 p-4 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ContactInput label="Nombre" name="name" placeholder="Tu nombre" value={form.name} onChange={handleChange} required />
                  <ContactInput label="Correo" name="email" type="email" placeholder="tu@email.com" value={form.email} onChange={handleChange} required />
                </div>
                <ContactInput label="Asunto" name="subject" placeholder="¿En qué podemos ayudarte?" value={form.subject} onChange={handleChange} />
                <label className="block">
                  <span className="storefront-kicker !text-[0.61rem]">Mensaje</span>
                  <textarea
                    name="message"
                    placeholder="Cuéntanos con detalle"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="storefront-surface mt-2 w-full resize-none bg-[var(--store-surface)] px-4 py-3 text-sm text-[var(--store-text-primary)] outline-none placeholder:text-[var(--store-text-muted)] focus:border-[var(--store-brand)]"
                  />
                </label>
                <button type="submit" disabled={status === "sending"} className="storefront-brand-button w-full disabled:cursor-not-allowed disabled:opacity-60">
                  {status === "sending" ? <Loader2 size={16} className="animate-spin" /> : <><Send size={15} /> Enviar mensaje</>}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function ContactInput({ label, name, type = "text", placeholder, value, onChange, required }) {
  return (
    <label className="block">
      <span className="storefront-kicker !text-[0.61rem]">{label}</span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="storefront-surface mt-2 min-h-12 w-full bg-[var(--store-surface)] px-4 py-3 text-sm text-[var(--store-text-primary)] outline-none placeholder:text-[var(--store-text-muted)] focus:border-[var(--store-brand)]"
      />
    </label>
  );
}
