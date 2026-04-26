// src/components/CartFloating.jsx
import { X, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart, getItemPrice } from "../context/CartContext";

function VariantLabel({ item }) {
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
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: a.hex_color }} />
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
  const [isOpen, setIsOpen]                 = useState(false);
  const { user }                            = useAuth();
  const { cart, removeFromCart, updateQty } = useCart();
  const navigate                            = useNavigate();

  const { total, count } = useMemo(() => {
    let t = 0, c = 0;
    cart.forEach(i => {
      t += getItemPrice(i) * (i.quantity || 1);
      c += i.quantity || 1;
    });
    return { total: t, count: c };
  }, [cart]);

  const handleGoToCart = () => {
    if (!user) {
      navigate("/auth", { state: { from: "/carrito" } });
      return;
    }
    setIsOpen(false);
    navigate("/carrito");
  };

  if (!cart.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3
      max-w-[350px] w-full pointer-events-none">

      {/* ── Panel desplegable ─────────────────────────────────────── */}
      <div className={`flex flex-col gap-2 w-full pointer-events-auto no-scrollbar
        transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]
        ${isOpen
          ? "max-h-[65vh] opacity-100 translate-y-0 overflow-y-auto pb-1"
          : "max-h-0 opacity-0 translate-y-6 overflow-hidden"
        }`}
      >
        {/* Items en orden inverso (último agregado arriba) */}
        {[...cart].reverse().map(item => {
          const price    = getItemPrice(item);
          const qty      = item.quantity || 1;
          const subtotal = price * qty;

          return (
            <div key={item.cartKey}
              className="relative group bg-white/98 backdrop-blur-xl rounded-[1.25rem]
                p-3 flex items-center gap-3
                shadow-[0_8px_24px_rgba(0,0,0,0.07)] border border-slate-100/80
                transition-all hover:shadow-lg"
            >
              <div className="relative shrink-0">
                <img
                  src={item.main_image || "https://placehold.co/44x44/F5F5F7/F5F5F7"}
                  alt={item.name}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-100"
                />
                <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white
                  text-[9px] font-black w-5 h-5 rounded-full flex items-center
                  justify-center border-2 border-white leading-none">
                  {qty}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-tight
                  text-slate-800 truncate leading-tight">
                  {item.name}
                </p>
                <VariantLabel item={item} />
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[11px] font-black text-slate-900">
                    ${subtotal.toLocaleString()}
                  </p>
                  <div className="flex items-center bg-slate-100 rounded-full px-1 py-0.5
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => updateQty(item.cartKey, qty - 1)}
                      className="p-0.5 hover:text-blue-600 transition-colors">
                      <Minus size={9} />
                    </button>
                    <span className="text-[10px] font-black w-3 text-center">{qty}</span>
                    <button onClick={() => updateQty(item.cartKey, qty + 1)}
                      className="p-0.5 hover:text-blue-600 transition-colors">
                      <Plus size={9} />
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={() => removeFromCart(item.cartKey)}
                className="text-slate-200 hover:text-red-400 transition-colors shrink-0 p-1">
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}

        {/* Footer del panel */}
        <div className="bg-white/98 backdrop-blur-xl rounded-[1.25rem] p-3
          shadow-[0_8px_24px_rgba(0,0,0,0.07)] border border-slate-100/80">

          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {count} {count === 1 ? "producto" : "productos"}
            </span>
            <span className="text-base font-black text-slate-900">
              ${total.toLocaleString()}
            </span>
          </div>

          <button
            onClick={handleGoToCart}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-slate-900 text-white font-black text-[10px] tracking-[0.2em] uppercase
              hover:bg-blue-600 transition-all duration-300 active:scale-95"
          >
            <ShoppingBag size={13} />
            Ver mi bolsa
            <ArrowRight size={13} />
          </button>

          {!user && (
            <p className="text-center text-[9px] font-bold text-amber-500 mt-2.5
              uppercase tracking-wider">
              ⚠ Inicia sesión para comprar
            </p>
          )}
        </div>
      </div>

      {/* ── Controles fijos ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 pointer-events-auto">

        {/* Toggle */}
        <button
          onClick={() => setIsOpen(o => !o)}
          className={`relative flex items-center justify-center w-14 h-14 rounded-full
            transition-all duration-500 shadow-2xl border border-white/40
            ${isOpen
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-900 hover:scale-110"
            }`}
        >
          <X size={20} className={`absolute transition-all duration-300
            ${isOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`} />
          <ShoppingBag size={20} className={`absolute transition-all duration-300
            ${isOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"}`} />
          {!isOpen && (
            <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px]
              font-black w-6 h-6 rounded-full flex items-center justify-center
              border-2 border-white leading-none">
              {count}
            </span>
          )}
        </button>

        {/* Pill total → navega a /carrito */}
        <button
          onClick={handleGoToCart}
          className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900
            hover:scale-105 active:scale-95
            shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-all duration-300"
        >
          <div className="flex flex-col text-left">
            <span className="text-[8px] font-black uppercase tracking-[0.3em]
              text-slate-400 leading-none">
              {user ? user.name.split(" ")[0] : "Mi bolsa"}
            </span>
            <span className="text-lg font-black text-white leading-tight">
              ${total.toLocaleString()}
            </span>
          </div>
          <div className="bg-emerald-500 w-10 h-10 rounded-full flex items-center
            justify-center">
            <ShoppingBag size={17} className="text-white" strokeWidth={2} />
          </div>
        </button>
      </div>
    </div>
  );
}