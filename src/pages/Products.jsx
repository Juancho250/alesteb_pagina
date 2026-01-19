import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Star, Sparkles } from "lucide-react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    // Intentar cache primero
    const cached = localStorage.getItem("products_cache");
    if (cached) {
      setProducts(JSON.parse(cached));
      setLoading(false);
    }

    api.get("/products", { signal: controller.signal })
      .then(res => {
        setProducts(res.data);
        localStorage.setItem("products_cache", JSON.stringify(res.data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">
      <Navbar />

      {/* Luces SOLO desktop */}
      <div className="hidden md:block fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[20%] w-[300px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 pt-28 pb-20 px-6 md:px-12">

        {/* HEADER */}
        <header className="max-w-7xl mx-auto mb-20 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
            <Sparkles size={14} className="text-cyan-400" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
              Colección Exclusiva
            </span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter">
            ALE<span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">STEB</span>
          </h1>

          <p className="text-slate-400 max-w-lg mx-auto italic text-lg">
            Tecnología premium seleccionada para quienes no aceptan menos que la perfección.
          </p>
        </header>

        {/* LOADER */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* GRID */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {products.map((p) => (
              <Link
                key={p.id}
                to={`/productos/${p.id}`}
                className="group relative bg-white/[0.03] md:backdrop-blur-md border border-white/10 rounded-[2.5rem] p-4 hover:bg-white/[0.07] transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                {/* Badge */}
                <div className="absolute top-6 left-6 z-10 bg-black/60 p-2 rounded-xl border border-white/10">
                  <Star className="text-yellow-400 fill-yellow-400" size={14} />
                </div>

                {/* Imagen */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] mb-6 bg-slate-900">
                  <img
                    src={p.main_image}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                </div>

                {/* Info */}
                <div className="space-y-4 px-2 pb-2">
                  <div>
                    <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em] mb-1">
                      {p.category || "Premium"}
                    </p>
                    <h3 className="text-xl font-bold truncate group-hover:text-cyan-400 transition-colors">
                      {p.name}
                    </h3>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Inversión
                      </p>
                      <p className="text-2xl font-black">
                        ${Number(p.price).toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-white text-black p-3.5 rounded-2xl group-hover:bg-cyan-400 transition-all">
                      <ShoppingBag size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
