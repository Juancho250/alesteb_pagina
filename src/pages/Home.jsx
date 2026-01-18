import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Glow background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-purple-500/20 blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-[380px] h-[380px] bg-cyan-500/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-fuchsia-500/10 blur-[120px]" />
      </div>

      {/* HERO */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <span className="inline-block mb-6 px-4 py-1.5 text-sm uppercase tracking-widest bg-white/5 border border-white/10 rounded-full">
          ⚡ Tecnología & Estilo
        </span>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
          Eleva tu experiencia <br />
          <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            con productos premium
          </span>
        </h1>

        <p className="max-w-xl mx-auto text-slate-400 mb-12">
          Curamos tecnología moderna para quienes buscan diseño,
          rendimiento y presencia.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            to="/productos"
            className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 transition"
          >
            Explorar productos
          </Link>

          <a
            href="#categorias"
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition"
          >
            Ver categorías
          </a>
        </div>

        {/* BENEFICIOS */}
        <section
          id="beneficios"
          className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <Feature icon="🚚" title="Entrega rápida">
            Envíos seguros y rápidos a todo el país.
          </Feature>

          <Feature icon="🛡️" title="Compra protegida">
            Pagos seguros y respaldo garantizado.
          </Feature>

          <Feature icon="💎" title="Selección premium">
            Solo productos bien curados.
          </Feature>
        </section>

        {/* CATEGORÍAS */}
        <section
          id="categorias"
          className="mt-32 text-left"
        >
          <h2 className="text-3xl font-bold mb-10 text-center">
            Categorías destacadas
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Category title="Ropa" />
            <Category title="Tecnología" />
            <Category title="Accesorios" />
            <Category title="Ediciones limitadas" />
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="mt-32">
          <h2 className="text-3xl font-bold mb-12">
            ¿Cómo funciona?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step number="1" title="Explora">
              Navega por nuestro catálogo curado.
            </Step>

            <Step number="2" title="Elige">
              Selecciona lo que va contigo.
            </Step>

            <Step number="3" title="Recibe">
              Nosotros lo llevamos a tu puerta.
            </Step>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mt-36 mb-20">
          <div className="relative bg-white/5 border border-white/10 rounded-3xl p-14 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-2xl" />

            <div className="relative z-10">
              <h2 className="text-4xl font-black mb-4">
                ¿Listo para empezar?
              </h2>
              <p className="text-slate-400 mb-8">
                Descubre productos que hablan por ti.
              </p>

              <Link
                to="/productos"
                className="inline-block px-10 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 transition"
              >
                Ver catálogo
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* COMPONENTES */

function Feature({ icon, title, children }) {
  return (
    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl text-left hover:border-white/20 transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-400">{children}</p>
    </div>
  );
}

function Category({ title }) {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center hover:bg-white/10 transition cursor-pointer">
      <p className="font-semibold">{title}</p>
    </div>
  );
}

function Step({ number, title, children }) {
  return (
    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
      <span className="text-cyan-400 font-bold text-lg">
        {number}
      </span>
      <h3 className="text-xl font-bold mt-2 mb-2">
        {title}
      </h3>
      <p className="text-slate-400">{children}</p>
    </div>
  );
}
