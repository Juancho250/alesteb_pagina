// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { Instagram, Twitter, MessageCircle, Mail } from "lucide-react";
import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";
import { socialHref, whatsappUrl } from "../utils/storefrontContact";

export default function Footer() {
  const { runtime } = useSiteRuntime();
  const identity = runtime.identity;
  const businessName = identity.businessName || "Tienda";
  const description =
    identity.description ||
    runtime.brand.tagline ||
    "Compra en línea con una experiencia segura, clara y rápida.";

  const instagram = socialHref(identity.socialLinks, "instagram");
  const twitter = socialHref(identity.socialLinks, "twitter");
  const whatsapp =
    socialHref(identity.socialLinks, "whatsapp") ||
    whatsappUrl(identity.contact.phone);
  const email = identity.contact.email;
  const country = identity.location.country || "Colombia";

  const socialItems = [
    instagram && { href: instagram, label: "Instagram", Icon: Instagram },
    twitter && { href: twitter, label: "X / Twitter", Icon: Twitter },
    whatsapp && { href: whatsapp, label: "WhatsApp", Icon: MessageCircle },
    email && { href: `mailto:${email}`, label: "Email", Icon: Mail },
  ].filter(Boolean);

  return (
    <footer className="bg-[#f5f5f7] border-t border-[#d2d2d7] pt-16 pb-12 font-sans">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div className="sm:col-span-2 md:col-span-1">
            <Link
              to="/"
              className="text-lg font-black tracking-tighter mb-4 block text-[#1d1d1f] italic uppercase"
            >
              {businessName}
            </Link>
            <p className="text-[#6e6e73] text-[13px] leading-relaxed max-w-xs font-medium">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-[10px] text-[#1d1d1f] uppercase tracking-[0.2em]">
              Tienda
            </h4>
            <ul className="space-y-3 text-[13px] text-[#424245] font-medium">
              <li><Link to="/productos" className="hover:text-brand transition-colors">Catálogo</Link></li>
              <li><Link to="/favoritos" className="hover:text-brand transition-colors">Favoritos</Link></li>
              <li><Link to="/carrito" className="hover:text-brand transition-colors">Carrito</Link></li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-[10px] text-[#1d1d1f] uppercase tracking-[0.2em]">
              Soporte
            </h4>
            <ul className="space-y-3 text-[13px] text-[#424245] font-medium">
              <li><Link to="/contact" className="hover:text-brand transition-colors">Contacto</Link></li>
              <li><Link to="/support" className="hover:text-brand transition-colors">Centro de ayuda</Link></li>
              <li><Link to="/perfil?tab=orders" className="hover:text-brand transition-colors">Mis pedidos</Link></li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-[10px] text-[#1d1d1f] uppercase tracking-[0.2em]">
              Contacto
            </h4>
            {socialItems.length > 0 ? (
              <div className="flex flex-wrap gap-4 text-[#424245]">
                {socialItems.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
                    aria-label={label}
                    className="hover:text-brand transition-all hover:scale-110"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            ) : (
              <Link to="/contact" className="text-[13px] text-[#424245] font-medium hover:text-brand">
                Escríbenos
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-[#d2d2d7] pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-[11px] text-[#86868b] font-medium">
              <p>© {new Date().getFullYear()} {businessName.toUpperCase()}.</p>
              <span className="hidden sm:block text-[#d2d2d7]">|</span>
              <div className="flex gap-4">
                <Link to="/privacidad" className="hover:text-brand">Privacidad</Link>
                <Link to="/legal" className="hover:text-brand">Legal</Link>
                <Link to="/support" className="hover:text-brand">Ayuda</Link>
              </div>
            </div>
            <p className="text-[#86868b] text-[9px] font-black tracking-[0.2em] uppercase">
              {country}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
