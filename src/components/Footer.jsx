import { Link } from "react-router-dom";
import { ExternalLink, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";

function normalizeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function SocialLinks({ links }) {
  if (!links || typeof links !== "object" || Array.isArray(links)) return null;

  const candidates = [
    { key: "instagram", label: "Instagram", icon: Instagram },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { key: "facebook", label: "Facebook", icon: ExternalLink },
    { key: "tiktok", label: "TikTok", icon: ExternalLink },
    { key: "x", label: "X", icon: ExternalLink },
    { key: "twitter", label: "X", icon: ExternalLink },
  ];

  const available = candidates
    .map((item) => ({ ...item, href: normalizeUrl(links[item.key]) }))
    .filter((item, index, array) => item.href && array.findIndex((candidate) => candidate.href === item.href) === index);

  if (!available.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {available.map(({ key, label, icon: Icon, href }) => (
        <a
          key={`${key}-${href}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="grid h-10 w-10 place-items-center rounded-full border border-[var(--store-border)] bg-[var(--store-surface)] text-[var(--store-text-secondary)] transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--store-brand)] hover:text-[var(--store-text-primary)]"
        >
          <Icon size={16} strokeWidth={1.8} />
        </a>
      ))}
    </div>
  );
}

export default function Footer() {
  const { runtime } = useSiteRuntime();
  const businessName = runtime.identity.businessName || "Tienda";
  const description = runtime.identity.description || runtime.brand.tagline || "";
  const phone = runtime.identity.contact.phone;
  const email = runtime.identity.contact.email;
  const location = [runtime.identity.location.city, runtime.identity.location.department, runtime.identity.location.country]
    .filter(Boolean)
    .join(", ");

  return (
    <footer className="mt-12 border-t border-[var(--store-border)] bg-[var(--store-page-bg)]">
      <div className="storefront-container py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr_0.65fr]">
          <div className="max-w-xl">
            <Link to="/" className="inline-flex items-center gap-3">
              {runtime.brand.assets.logoUrl ? (
                <img
                  src={runtime.brand.assets.logoUrl}
                  alt={businessName}
                  className="h-10 w-10 rounded-xl object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--store-brand)] text-sm font-bold text-[var(--store-brand-contrast)]">
                  {businessName.charAt(0).toUpperCase() || "T"}
                </span>
              )}
              <span className="text-lg font-semibold tracking-[-0.035em] text-[var(--store-text-primary)]">{businessName}</span>
            </Link>

            {description ? (
              <p className="mt-5 max-w-lg text-sm leading-6 text-[var(--store-text-secondary)]">{description}</p>
            ) : null}

            <div className="mt-6">
              <SocialLinks links={runtime.identity.socialLinks} />
            </div>
          </div>

          <div>
            <p className="storefront-kicker">Explorar</p>
            <nav className="mt-4 flex flex-col items-start gap-3 text-sm font-medium text-[var(--store-text-secondary)]">
              <Link to="/productos" className="hover:text-[var(--store-text-primary)]">Productos</Link>
              <Link to="/support" className="hover:text-[var(--store-text-primary)]">Soporte</Link>
              <Link to="/contact" className="hover:text-[var(--store-text-primary)]">Contacto</Link>
            </nav>
          </div>

          <div>
            <p className="storefront-kicker">Información</p>
            <div className="mt-4 space-y-3 text-sm text-[var(--store-text-secondary)]">
              {phone ? (
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 hover:text-[var(--store-text-primary)]">
                  <Phone size={14} /> <span className="truncate">{phone}</span>
                </a>
              ) : null}
              {email ? (
                <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-[var(--store-text-primary)]">
                  <Mail size={14} /> <span className="truncate">{email}</span>
                </a>
              ) : null}
              {location ? (
                <p className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0" /> <span>{location}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-[var(--store-border)] pt-7 text-xs text-[var(--store-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {businessName}. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/privacidad" className="hover:text-[var(--store-text-primary)]">Privacidad</Link>
            <Link to="/legal" className="hover:text-[var(--store-text-primary)]">Legal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
