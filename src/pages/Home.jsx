import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import BannerCarousel from "../components/BannerCarousel";

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get("/banners", { signal: controller.signal })
      .then((res) => {
        const activeBanners = res.data.filter((b) => b.is_active === true || b.is_active === 1);
        setBanners(activeBanners);
      })
      .catch((err) => { if (err.name !== "CanceledError") console.error(err); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased">

      <main className="pt-16 md:pt-20">
        {/* BANNER - Ahora con bordes redondeados opcionales y margen lateral para un look más "Apple Store" */}
        {banners.length > 0 && (
          <section
            className="
              max-w-[1520px]
              mx-auto
              h-[70vh] sm:h-[80vh] md:h-[85vh]
              bg-[#f5f5f7]
              overflow-hidden
              relative
              md:rounded-3xl
              shadow-sm
              -mt-0 md:-mt-16
            "
          >
            <BannerCarousel banners={banners} />
          </section>
        )}



        <div className="max-w-5xl mx-auto px-6">
          {/* HERO */}
          <section className="text-center py-24 md:py-40">
            <h2 className="text-5xl md:text-7xl font-semibold tracking-tight mb-8">
              Redefiniendo <br />
              <span className="text-[#86868b]">lo cotidiano.</span>
            </h2>

            <p className="max-w-lg mx-auto text-[#1d1d1f] mb-10 text-lg md:text-xl font-normal leading-relaxed">
              Objetos tecnológicos diseñados con un equilibrio perfecto entre funcionalidad y estilo.
            </p>

            <Link
              to="/productos"
              className="inline-block px-8 py-3 bg-[#0071e3] text-white font-medium rounded-full text-sm transition hover:bg-[#0077ed]"
            >
              Comprar ahora
            </Link>
          </section>

          {/* BENEFICIOS - Minimalist Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32 border-t border-[#f5f5f7] pt-16">
            <Feature title="Logística Global" desc="Envíos con seguimiento en tiempo real." />
            <Feature title="Calidad Verificada" desc="Certificación en cada componente." />
            <Feature title="Acceso Exclusivo" desc="Lanzamientos para nuestra comunidad." />
          </section>

          {/* CATEGORÍAS - Subtle interaction */}
          <section className="mb-32">
            <h2 className="text-3xl font-semibold tracking-tight mb-12">Colecciones</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Category title="Audio" />
              <Category title="Performance" />
              <Category title="Desktop" />
              <Category title="Limited" />
            </div>
          </section>

          {/* CTA FINAL - Clean card */}
          <section className="mb-32">
            <div className="bg-[#f5f5f7] rounded-3xl p-12 md:p-24 text-center">
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">
                ¿Listo para el cambio?
              </h2>
              <Link
                to="/productos"
                className="text-[#0071e3] font-medium text-lg hover:underline underline-offset-4"
              >
                Explorar la tienda &rarr;
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ===== COMPONENTES AUXILIARES ===== */

function Feature({ title, desc }) {
  return (
    <div className="text-center md:text-left">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[#86868b] mb-3">
        {title}
      </h3>
      <p className="text-base text-[#1d1d1f] font-normal leading-snug">{desc}</p>
    </div>
  );
}

function Category({ title }) {
  return (
    <div className="aspect-square flex items-center justify-center bg-[#f5f5f7] rounded-2xl transition-all hover:scale-[1.02] cursor-pointer group">
      <p className="font-medium text-sm tracking-tight text-[#1d1d1f] group-hover:text-black">
        {title}
      </p>
    </div>
  );
}