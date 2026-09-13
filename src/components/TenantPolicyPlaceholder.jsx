import { FileText, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";

export default function TenantPolicyPlaceholder({ type = "legal" }) {
  const { runtime } = useSiteRuntime();
  const businessName = runtime.identity.businessName || "la tienda";
  const email = runtime.identity.contact.email ? String(runtime.identity.contact.email) : "";
  const isPrivacy = type === "privacy";

  return (
    <div className="storefront-container pb-24 pt-10 sm:pt-16">
      <header className="max-w-4xl">
        <p className="storefront-kicker">{isPrivacy ? "Privacidad" : "Información legal"} · {businessName}</p>
        <div className="mt-5 flex items-start gap-5">
          <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--store-surface)] text-[var(--store-text-secondary)] sm:grid">
            {isPrivacy ? <ShieldCheck size={21} strokeWidth={1.7} /> : <FileText size={21} strokeWidth={1.7} />}
          </span>
          <div>
            <h1 className="storefront-title !text-[clamp(2.7rem,7vw,5.5rem)]">
              {isPrivacy ? "Política de privacidad" : "Términos y condiciones"}
            </h1>
            <p className="storefront-copy mt-6 max-w-2xl">
              {isPrivacy
                ? `Este storefront todavía no tiene publicada una política de privacidad específica y versionada para ${businessName}.`
                : `Este storefront todavía no tiene publicados términos y condiciones específicos y versionados para ${businessName}.`}
            </p>
          </div>
        </div>
      </header>

      <section className="storefront-elevated mt-12 max-w-3xl p-6 sm:p-9">
        <p className="storefront-kicker">Publicación pendiente</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[var(--store-text-primary)]">
          No mostramos políticas genéricas como si pertenecieran al comercio.
        </h2>
        <p className="mt-4 text-sm leading-6 text-[var(--store-text-secondary)]">
          La identidad, las obligaciones, los plazos, las condiciones comerciales y el tratamiento de datos pueden cambiar entre tenants. ALESTEB necesita recibir esa información desde una autoridad backend antes de publicarla aquí.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/contact" className="storefront-brand-button">Contactar a la tienda</Link>
          {email ? (
            <a href={`mailto:${email}`} className="storefront-secondary-button">
              <Mail size={14} /> {email}
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
