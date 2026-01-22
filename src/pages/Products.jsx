import { useEffect, useState, memo, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { ShoppingBag, Percent, Search, X } from "lucide-react";

const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="aspect-[4/5] bg-gray-200 rounded-3xl mb-4" />
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
  </div>
);

const ProductCard = memo(({ p, isInCart, onToggle }) => {
  const priceOriginal = Number(p.price) || 0;
  const priceFinalRaw = Number(p.final_price) || priceOriginal;
  const hasDiscount = priceFinalRaw > 0 && priceFinalRaw < priceOriginal;
  const priceFinal = hasDiscount ? priceFinalRaw : priceOriginal;
  
  const discountPercent = hasDiscount
    ? Math.round(((priceOriginal - priceFinal) / priceOriginal) * 100)
    : 0;

  return (
    <div className="relative group flex flex-col">
      {hasDiscount && (
        <div className="absolute top-3 left-3 z-10 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1 shadow-xl">
          <Percent size={10} strokeWidth={3} />
          -{discountPercent}% OFF
        </div>
      )}

      <Link to={`/productos/${p.id}`} className="relative">
        <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#f5f5f7] border border-transparent group-hover:border-slate-200 transition-all duration-500 shadow-sm group-hover:shadow-md">
          <img
            src={p.main_image || 'https://via.placeholder.com/400x500'}
            alt={p.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
      </Link>

      <button
        onClick={() => onToggle(p, 1)}
        className={`absolute top-3 right-3 z-10 p-3 rounded-full shadow-lg transition-all duration-300 transform ${
          isInCart
            ? "bg-emerald-500 text-white scale-110"
            : "bg-white text-slate-900 hover:bg-black hover:text-white scale-100" 
        }`}
      >
        <ShoppingBag size={18} strokeWidth={2.5} />
      </button>

      <div className="mt-5 px-1">
        <h3 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
          {p.name}
        </h3>
        
        <div className="flex items-center gap-3 mt-2">
          {hasDiscount ? (
            <>
              <span className="text-base font-black text-slate-900">${priceFinal.toLocaleString()}</span>
              <span className="text-xs text-slate-400 line-through">${priceOriginal.toLocaleString()}</span>
            </>
          ) : (
            <span className="text-base font-black text-slate-900">${priceOriginal.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
});

export default function Products({ cart, toggleCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* CABECERA CON BUSCADOR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">NEW DROPS</h2>
            <div className="h-1.5 w-24 bg-blue-600 rounded-full" />
          </div>

          {/* BARRA DE BÚSQUEDA ROBUSTA */}
          <div className="relative w-full md:w-80 group">
            <input 
              type="text"
              placeholder="¿Qué estás buscando?"
              className="w-full bg-slate-100 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-3.5 pl-12 pr-10 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" size={20} strokeWidth={2.5} />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-200 hover:bg-slate-300 p-1 rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  onToggle={toggleCart}
                  isInCart={cart.some((item) => item.id === p.id)}
                />
              ))
            ) : (
              <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-50 rounded-[3rem]">
                <p className="text-slate-300 text-xl font-black uppercase italic tracking-widest">No results found</p>
                <button onClick={() => setSearchTerm("")} className="mt-4 text-blue-600 font-bold underline">VER TODO</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}