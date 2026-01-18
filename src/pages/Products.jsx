import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import { ShoppingBag, Star } from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <header className="max-w-7xl mx-auto mb-16 text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
        ALE<span className="text-cyan-500">STEB</span>
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto italic">
          Calidad premium seleccionada para expertos.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/productos/${p.id}`}
            className="group relative bg-white/5 border border-white/10 rounded-3xl p-4 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden shadow-2xl"
          >
            {/* Badge de estrella o descuento */}
            <div className="absolute top-6 left-6 z-10 bg-black/50 backdrop-blur-md p-2 rounded-xl border border-white/10">
              <Star className="text-yellow-400 fill-yellow-400" size={14} />
            </div>

            {/* Imagen del Producto */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl mb-6 bg-slate-900">
              <img
                src={p.main_image}
                alt={p.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Overlay en hover */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
            </div>

            {/* Info */}
            <div className="space-y-3 px-2">
              <h3 className="text-xl font-bold group-hover:text-cyan-400 transition-colors truncate">
                {p.name}
              </h3>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Precio</p>
                  <p className="text-2xl font-black text-white">
                    ${Number(p.price).toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-cyan-500 p-3 rounded-xl group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all">
                  <ShoppingBag size={20} className="text-black" />
                </div>
              </div>
            </div>

            {/* Efecto de brillo al pasar el mouse */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-tr from-cyan-500/10 to-transparent pointer-events-none" />
          </Link>
        ))}
      </div>
    </div>
  );
}