import React, { useEffect, useState, memo, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { ShoppingBag, Percent, Search, X, ChevronRight, Loader2, ArrowLeft } from "lucide-react";

// Componente de carga (Skeleton) para mejorar el UX
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="aspect-[4/5] bg-gray-200 rounded-3xl mb-4" />
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
  </div>
);

// Componente de Tarjeta de Producto optimizado con memo
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
            src={p.main_image || (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x500'}
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
  const { slug } = useParams(); // Detecta si estamos en una categoría
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Dentro de Products.js
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Importante: Si hay slug, usamos el filtro de categoría, si no, traemos todo.
        const endpoint = slug ? `/products?categoria=${slug}` : "/products";
        const res = await api.get(endpoint);
        
        // Ajuste de seguridad para la respuesta de la API
        const data = Array.isArray(res.data) ? res.data : (res.data.products || []);
        setProducts(data);

        if (slug) {
          const resCat = await api.get(`/categories/slug/${slug}`).catch(() => null);
          setCategoryName(resCat?.data?.name || slug.replace(/-/g, ' '));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]); // <--- Esto fuerza la recarga cuando cambias de categoría en el Navbar

  // En Products.jsx verifica que el filtrado use 'category_name' (como definimos en el SQL)
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category_name && p.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  if (loading && slug) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" strokeWidth={1.5} />
        <p className="text-slate-400 font-medium animate-pulse">Cargando colección...</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* BREADCRUMBS (Solo se muestran si hay un slug de categoría) */}
        {slug && (
          <nav className="flex items-center gap-2 text-[13px] font-semibold text-slate-400 mb-8 uppercase tracking-widest">
            <Link to="/" className="hover:text-black transition-colors">Inicio</Link>
            <ChevronRight size={14} />
            <Link to="/productos" className="hover:text-black transition-colors">Tienda</Link>
            <ChevronRight size={14} />
            <span className="text-black">{categoryName}</span>
          </nav>
        )}

        {/* CABECERA DINÁMICA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
              {slug ? categoryName : "NEW DROPS"}
            </h2>
            <div className="h-2 w-24 bg-blue-600 rounded-full" />
            {slug && (
              <p className="text-slate-500 text-lg font-medium leading-relaxed">
                Explora nuestra curada selección en {categoryName.toLowerCase()}. Calidad excepcional.
              </p>
            )}
          </div>

          {/* BARRA DE BÚSQUEDA */}
          <div className="relative w-full md:w-80 group">
            <input 
              type="text"
              placeholder="¿Qué estás buscando?"
              className="w-full bg-slate-100 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 pl-12 pr-10 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
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

        {/* CONTENIDO PRINCIPAL */}
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
                  isInCart={cart?.some((item) => item.id === p.id)}
                />
              ))
            ) : (
              <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-100 rounded-[3rem]">
                <p className="text-slate-300 text-xl font-black uppercase italic tracking-widest mb-4">No se encontraron resultados</p>
                <Link to="/productos" onClick={() => setSearchTerm("")} className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform">
                   <ArrowLeft size={18} /> Ver todos los productos
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}