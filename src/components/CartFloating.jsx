// src/components/CartFloating.jsx
import { MessageCircle, X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart, getItemPrice } from "../context/CartContext";

// ─── Chip de variante ─────────────────────────────────────────────────────────
function VariantLabel({ item }) {
  // variantLabel viene de ProductDetail: "Rojo / L"
  // variantAttributes viene de Sales: [{ display_value, hex_color }]
  if (item.variantLabel) {
    return (
      <p className="text-[9px] font-bold text-blue-400 truncate leading-tight">
        {item.variantLabel}
      </p>
    );
  }
  if (item.variantAttributes?.length) {
    return (
      <div className="flex flex-wrap gap-1 mt-0.5">
        {item.variantAttributes.map((a, i) => (
          <span key={i}
            className="inline-flex items-center gap-0.5 text-[8px] font-bold text-blue-400 leading-none">
            {a.hex_color && (
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: a.hex_color }}
              />
            )}
            {a.display_value ?? a.value}
          </span>
        ))}
      </div>
    );
  }
  return null;
}

export default function CartFloating() {
  const [isOpen, setIsOpen]               = useState(false);
  const { user }                          = useAuth();
  const { cart, removeFromCart, updateQty } = useCart();
  const navigate                          = useNavigate();

  const { total, count } = useMemo(() => {
    let t = 0, c = 0;
    cart.forEach(i => {
      t += getItemPrice(i) * (i.quantity || 1);
      c += i.quantity || 1;
    });
    return { total: t, count: c };
  }, [cart]);

  const handleGoToCheckout = () => {
    if (!user) {
      navigate("/auth", { state: { from: "/checkout" } });
      return;
    }
    setIsOpen(false);
    navigate("/checkout");
  };

  if (!cart.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 max-w-[350px] w-full pointer-events-none">

      {/* Lista desplegable */}
      <div
        className={`flex flex-col-reverse gap-3 w-full overflow-y-auto px-2 py-2 pointer-events-auto no-scrollbar
          transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]
          ${isOpen
            ? "max-h-[60vh] opacity-100 translate-y-0"
            : "max-h-0 opacity-0 translate-y-10"
          }`}
      >
        {cart.map(item => {
          const price    = getItemPrice(item);
          const qty      = item.quantity || 1;
          const subtotal = price * qty;

          return (
            <div
              key={item.cartKey}  // ← cartKey, no item.id
              className="relative group bg-white/95 backdrop-blur-xl rounded-[1.5rem] p-2 pr-5 flex items-center gap-4
                shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white/50 transition-all hover:shadow-xl hover:bg-white"
            >
              {/* Imagen */}
              <div className="relative shrink-0">
                <img
                  src={item.main_image || "https://via.placeholder.com/48"}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {qty}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-tight text-slate-800 truncate leading-tight">
                  {item.name}
                </p>
                {/* Variante */}
                <VariantLabel item={item} />
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[11px] font-bold text-slate-900">
                    ${subtotal.toLocaleString()}
                  </p>
                  {/* Controles de cantidad — visible en hover */}
                  <div className="flex items-center bg-slate-100 rounded-full px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => updateQty(item.cartKey, qty - 1)} // ← usa cartKey
                      className="p-1 hover:text-blue-600 transition-colors"
                      title="Reducir cantidad"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-[10px] font-black w-3 text-center">{qty}</span>
                    <button
                      onClick={() => updateQty(item.cartKey, qty + 1)} // ← usa cartKey
                      className="p-1 hover:text-blue-600 transition-colors"
                      title="Aumentar cantidad"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Eliminar */}
              <button
                onClick={() => removeFromCart(item.cartKey)}
                className="text-slate-300 hover:text-red-500 transition-colors"
                title="Eliminar del carrito"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Controles principales */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative group flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 shadow-2xl border border-white/40
            ${isOpen ? "bg-slate-900 text-white rotate-[360deg]" : "bg-white text-slate-900 hover:scale-110"}`}
        >
          {isOpen ? <X size={22} /> : <ShoppingBag size={22} />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
              {count}
            </span>
          )}
        </button>

        <button
          onClick={handleGoToCheckout}
          className="flex items-center gap-4 p-2 pl-8 rounded-full bg-slate-900 hover:scale-105 active:scale-95
            shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 group relative overflow-hidden"
        >
          <div className="flex flex-col text-white">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
              {user ? user.name.split(" ")[0] : "Iniciar sesión"}
            </span>
            <span className="text-xl font-black">${total.toLocaleString()}</span>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-md opacity-20 group-hover:opacity-100 group-hover:scale-150 transition-all duration-700" />
            <div className="relative bg-emerald-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-700 group-hover:rotate-[360deg]">
              <MessageCircle size={24} fill="white" strokeWidth={1} />
            </div>
          </div>
        </button>
      </div>

      {!user && (
        <div className="pointer-events-auto bg-amber-500 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-lg animate-pulse">
          ⚠️ Inicia sesión para finalizar tu compra
        </div>
      )}
    </div>
  );
}