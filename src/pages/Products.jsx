import { useEffect, useState, memo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const ProductCard = memo(({ p }) => (
  <Link
    to={`/productos/${p.id}`}
    className="group block transition-all duration-500"
  >
    <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-[#f5f5f7]">
      <img
        src={p.main_image}
        alt={p.name}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
    </div>
    <div className="mt-4 space-y-1">
      <p className="text-[10px] text-[#86868b] font-semibold uppercase tracking-widest">
        {p.category || "Colección"}
      </p>
      <h3 className="text-sm font-medium text-[#1d1d1f]">{p.name}</h3>
      <p className="text-sm font-normal text-[#1d1d1f]">
        ${Number(p.price).toLocaleString()}
      </p>
    </div>
  </Link>
));

export default function Products() {
  const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem("products_cache") || "[]"));
  const [loading, setLoading] = useState(!products.length);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/products", { signal: controller.signal })
      .then(res => {
        setProducts(res.data);
        localStorage.setItem("products_cache", JSON.stringify(res.data));
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased">
      <main className="max-w-7xl mx-auto pt-32 pb-20 px-6">
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">ALESTEB.</h1>
          <p className="text-[#86868b] text-lg mt-2 font-medium">La mejor tecnología. Directo a ti.</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="aspect-[4/5] bg-[#f5f5f7] rounded-2xl" />
                <div className="h-4 w-3/4 bg-[#f5f5f7] rounded" />
                <div className="h-4 w-1/4 bg-[#f5f5f7] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}