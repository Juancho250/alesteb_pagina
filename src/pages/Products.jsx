import React, { useEffect, useState, memo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { ShoppingBag, Percent, Search, X, ChevronRight, ArrowLeft, Plus, ChevronLeft } from "lucide-react";

// --- UTILIDADES ---

// Transforma URL de Cloudinary para reducir tamaño (WebP + 500px ancho + calidad auto)
const getOptimizedImageUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/400x500';
  if (url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_500/');
  }
  return url;
};

// --- COMPONENTES ---

// 1. SKELETON (Carga visual)
const SkeletonCard = () => (
  <div className="space-y-6">
    <div className="aspect-[4/5] bg-slate-100 rounded-[2.5rem] animate-pulse" />
    <div className="space-y-3 px-2">
      <div className="h-4 bg-slate-100 rounded-full w-2/3 animate-pulse" />
      <div className="h-6 bg-slate-100 rounded-full w-1/3 animate-pulse" />
    </div>
  </div>
);

// 2. PRODUCT CARD
const ProductCard = memo(({ p, isInCart, onToggle }) => {
  // ✅ Usar sale_price con fallback a price
  const priceOriginal = Number(p.sale_price || p.price) || 0;
  const priceFinalRaw = Number(p.final_price) || 0;
  const hasDiscount = priceFinalRaw > 0 && priceFinalRaw < priceOriginal;
  const priceFinal = hasDiscount ? priceFinalRaw : priceOriginal;
  
  const discountPercent = hasDiscount
    ? Math.round(((priceOriginal - priceFinal) / priceOriginal) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col">
      {/* Badge Descuento */}
      {hasDiscount && (
        <div className="absolute top-5 left-5 z-20 bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-2xl text-[10px] font-black tracking-tighter flex items-center gap-1 shadow-sm border border-slate-100">
          <Percent size={10} className="text-blue-600" strokeWidth={3} />
          {discountPercent}% OFF
        </div>
      )}

      {/* Imagen Optimizada */}
      <Link to={`/productos/detalle/${p.id}`} className="relative block overflow-hidden rounded-[2.5rem] bg-[#F5F5F7] aspect-[4/5] transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-slate-200">
        <img
          src={getOptimizedImageUrl(p.main_image || (p.images && p.images[0]?.url))}
          alt={p.name}
          loading="lazy" // Carga diferida nativa
          className="w-full h-full object-cover transition-transform duration-1000 cubic-bezier(0.4, 0, 0.2, 1) group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
      </Link>

      {/* Botón Carrito */}
      <button
        onClick={() => onToggle(p, 1)}
        className={`absolute bottom-32 right-6 z-20 p-4 rounded-full shadow-2xl transition-all duration-300 transform active:scale-90 ${
          isInCart
            ? "bg-blue-600 text-white scale-110 shadow-blue-500/40"
            : "bg-white text-slate-900 border border-slate-100 shadow-xl"
        }`}
      >
        {isInCart ? (
          <ShoppingBag size={20} strokeWidth={2.5} className="animate-in zoom-in duration-300" />
        ) : (
          <Plus size={20} strokeWidth={2.5} className="animate-in zoom-in duration-300" />
        )}
      </button>

      {/* Info */}
      <div className="mt-6 px-2 space-y-1">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-tight group-hover:text-blue-600 transition-colors duration-300">
          {p.name}
        </h3>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-black text-slate-900 tracking-tighter">
            ${priceFinal.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm text-slate-400 line-through font-medium">
              ${priceOriginal.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

// 3. MAIN COMPONENT
export default function Products({ cart, toggleCart }) {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para búsqueda y paginación server-side
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  
  const [categoryName, setCategoryName] = useState("");

  // Debounce: Esperar 500ms después de escribir para actualizar la búsqueda real
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Resetear a página 1 al buscar
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch de Datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Construimos Query String
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", 12); // Solo traemos 12 productos
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (slug) params.append("categoria", slug);

        const res = await api.get(`/products?${params.toString()}`);
        
        // ✅ Manejo robusto de respuesta del backend
        const data = res.data.data || res.data.products || [];
        const pag = res.data.pagination || { totalPages: 1, totalItems: 0 };
        
        setProducts(data);
        setPagination(pag);

        if (slug) {
            // Nombre visual de categoría (si el backend no lo devolvió en los productos)
            const catName = data[0]?.category_name || slug.replace(/-/g, ' ');
            setCategoryName(catName);
        }
      } catch (err) {
        console.error("Error cargando productos", err);
      } finally {
        setLoading(false);
        // Scroll top suave al cambiar de página
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    loadData();
  }, [slug, debouncedSearch, page]);

  return (
    <div className="bg-white min-h-screen font-sans">
      <div className="max-w-7xl mx-auto px-6 py-16">
        
        {/* Breadcrumbs */}
        {slug && (
          <nav className="flex items-center gap-3 text-[10px] font-black text-slate-400 mb-10 uppercase tracking-[0.2em]">
            <Link to="/" className="hover:text-blue-600 transition-colors">Inicio</Link>
            <ChevronRight size={12} className="text-slate-300" />
            <Link to="/productos" className="hover:text-blue-600 transition-colors">Tienda</Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-900">{categoryName}</span>
          </nav>
        )}

        {/* Header & Buscador */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
          <div className="space-y-6">
            <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85] italic">
              {slug ? categoryName : "EXPLORA\nLO NUEVO"}
            </h2>
            <div className="flex items-center gap-4">
              <div className="h-1.5 w-20 bg-blue-600 rounded-full" />
              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">
                {pagination.totalItems} Productos encontrados
              </p>
            </div>
          </div>

          <div className="relative group w-full lg:w-96">
            <input 
              type="text"
              placeholder="Buscar en la colección..."
              className="w-full bg-slate-50 border-none rounded-[1.5rem] py-5 pl-14 pr-10 outline-none ring-0 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all duration-300 font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={22} strokeWidth={2.5} />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-200 hover:bg-slate-300 p-1 rounded-full transition-all">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 min-h-[50vh]">
              {products.length > 0 ? (
                products.map((p) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    onToggle={toggleCart}
                    isInCart={cart?.some((item) => item.id === p.id)}
                  />
                ))
              ) : (
                <div className="col-span-full py-32 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                    <Search size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">SIN RESULTADOS</h3>
                  <Link to="/productos" onClick={() => setSearchTerm("")} className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold mt-6 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2">
                    <ArrowLeft size={18} /> Limpiar filtros
                  </Link>
                </div>
              )}
            </div>

            {/* Paginación */}
            {products.length > 0 && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-20">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-4 rounded-full bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="font-black text-slate-900 tracking-widest text-sm">
                  PÁGINA {page} DE {pagination.totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="p-4 rounded-full bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}