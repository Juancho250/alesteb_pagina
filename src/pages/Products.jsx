import { useEffect, useState, memo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const ProductCard = memo(({ p, isInCart, onToggle }) => (
  <div className="relative group">
    <Link to={`/productos/${p.id}`}>
      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-[#f5f5f7]">
        <img
          src={p.main_image}
          alt={p.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
    </Link>

    <button
      onClick={() => onToggle(p)}
      className={`absolute top-4 right-4 px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-all ${
        isInCart
          ? "bg-green-100 text-green-700"
          : "bg-white text-black hover:bg-black hover:text-white"
      }`}
    >
      {isInCart ? "Agregado" : "Agregar"}
    </button>

    <div className="mt-4">
      <h3 className="text-sm font-medium">{p.name}</h3>
      <p className="text-sm">${Number(p.price).toLocaleString()}</p>
    </div>
  </div>
));


export default function Products({ cart, toggleCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products").then((res) => {
      setProducts(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10">Cargando...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            p={p}
            onToggle={toggleCart}
            isInCart={cart.some((item) => item.id === p.id)}
          />
        ))}
      </div>
    </div>
  );
}
