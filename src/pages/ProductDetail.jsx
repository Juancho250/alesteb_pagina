import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Check } from "lucide-react";
import api from "../services/api";

export default function ProductDetail({ cart, toggleCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState("");

  useEffect(() => {
    api.get(`/products/${id}`).then(({ data }) => {
      setProduct(data);
    });
  }, [id]);

  const images = useMemo(() => {
    if (!product) return [];
    const gallery = product.images?.map((i) => i.url) || [];
    return [...new Set([product.main_image, ...gallery])].filter(Boolean);
  }, [product]);

  // ✅ PRIMERA IMAGEN SIEMPRE
  useEffect(() => {
    if (images.length > 0) {
      setActiveImg(images[0]);
    }
  }, [images]);

  if (!product) return <div className="p-10">Cargando...</div>;

  const isInCart = cart.some((item) => item.id === product.id);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-32">
      <Link to="/productos" className="text-sm text-gray-500 flex items-center gap-2 mb-10">
        <ArrowLeft size={16} /> Volver
      </Link>

      <div className="grid lg:grid-cols-2 gap-16">
        {/* GALERÍA */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden">
            <img
              src={activeImg}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex gap-4 mt-4 overflow-x-auto">
            {images.map((img) => (
              <button
                key={img}
                onClick={() => setActiveImg(img)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 ${
                  activeImg === img ? "border-blue-500" : "border-transparent"
                }`}
              >
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* INFO */}
        <div className="sticky top-32">
          <h1 className="text-4xl font-semibold mb-4">{product.name}</h1>
          <p className="text-2xl mb-6">
            ${Number(product.price).toLocaleString()}
          </p>

          <p className="mb-10">{product.description}</p>

          <button
            onClick={() => toggleCart(product)}
            className={`w-full py-5 rounded-full font-bold flex items-center justify-center gap-2 ${
              isInCart
                ? "bg-green-100 text-green-700"
                : "bg-black text-white"
            }`}
          >
            {isInCart ? <Check /> : <Plus />}
            {isInCart ? "En tu lista" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}
