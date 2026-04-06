import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingBag, ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import api from "../services/api";
import { extractProducts } from "../utils/apiResponse";

const CategoryPage = ({ cart, toggleCart }) => {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Obtener productos de la categoría
        const resProd = await api.get(`/products?categoria=${slug}`);
        setProducts(extractProducts(resProd.data));

        // 2. Obtener info de la categoría para el título (si el slug es legible, lo formateamos)
        try {
          const resCat = await api.get(`/categories/slug/${slug}`);
          setCategoryName(resCat.data.name);
        } catch {
          setCategoryName(slug.replace(/-/g, ' '));
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" strokeWidth={1.5} />
        <p className="text-slate-400 font-medium animate-pulse">Cargando colección...</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* HEADER DE CATEGORÍA */}
      <header className="pt-12 pb-16 px-6 max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 text-[13px] font-semibold text-slate-400 mb-8 uppercase tracking-widest">
          <Link to="/" className="hover:text-black transition-colors">Inicio</Link>
          <ChevronRight size={14} />
          <Link to="/productos" className="hover:text-black transition-colors">Tienda</Link>
          <ChevronRight size={14} />
          <span className="text-black">{categoryName}</span>
        </nav>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 uppercase leading-[0.9] mb-6">
          {categoryName}
        </h1>
        <p className="text-slate-500 text-lg max-w-xl font-medium leading-relaxed">
          Explora nuestra curada selección de productos en la categoría {categoryName.toLowerCase()}. Calidad excepcional en cada detalle.
        </p>
      </header>

      {/* GRILLA DE PRODUCTOS */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        {products.length === 0 ? (
          <div className="py-32 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No hay productos</h3>
            <p className="text-slate-500 mb-8">Estamos preparando nuevas llegadas para esta categoría.</p>
            <Link to="/productos" className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform">
              <ArrowLeft size={18} /> Volver a la tienda
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {products.map((product) => {
              const inCart = cart?.some((item) => item.id === product.id);
              return (
                <div key={product.id} className="group relative">
                  {/* IMAGEN */}
                  <Link to={`/productos/${product.id}`} className="block aspect-[3/4] overflow-hidden bg-slate-100 rounded-[2rem] mb-6 relative">
                    <img
                      src={product.main_image || (product.images && product.images[0]?.url)}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    {product.discount_value > 0 && (
                      <span className="absolute top-5 left-5 bg-blue-600 text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter">
                        Oferta
                      </span>
                    )}
                  </Link>

                  {/* INFO */}
                  <div className="px-2">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="text-[17px] font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                        <Link to={`/productos/${product.id}`}>{product.name}</Link>
                      </h3>
                      <button
                        onClick={() => toggleCart(product)}
                        className={`shrink-0 p-3 rounded-2xl transition-all duration-300 ${
                          inCart 
                          ? "bg-black text-white scale-110" 
                          : "bg-slate-100 text-slate-900 hover:bg-blue-600 hover:text-white"
                        }`}
                      >
                        <ShoppingBag size={18} strokeWidth={inCart ? 3 : 2} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-slate-900">
                        ${Number(product.final_price || product.price).toLocaleString()}
                      </span>
                      {product.discount_value > 0 && (
                        <span className="text-sm text-slate-400 line-through font-medium">
                          ${Number(product.price).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CategoryPage;
