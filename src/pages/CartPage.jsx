// src/pages/CartPage.jsx
import { Link, useNavigate } from "react-router-dom";
import { useCart, getItemPrice } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, ArrowRight, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const optimizeUrl = (url, w = 160) => {
  if (!url) return null;
  return url.includes("/upload/")
    ? url.replace("/upload/", `/upload/f_webp,q_auto:good,w_${w},c_fill/`)
    : url;
};

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function CartPage() {
  const { cart, removeFromCart, updateQty, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => {
    return sum + getItemPrice(item) * (item.quantity || 1);
  }, 0);

  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleCheckout = () => {
    if (!user) {
      navigate("/auth", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (cart.length === 0) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5"
      >
        <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-100
          flex items-center justify-center text-slate-200">
          <ShoppingBag size={40} strokeWidth={1.5} />
        </div>
        <p className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">
          Bolsa vacía
        </p>
        <p className="text-sm text-slate-400 font-medium">
          Agrega productos para continuar
        </p>
        <Link to="/productos"
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white
            rounded-full font-black text-xs tracking-widest uppercase
            hover:bg-blue-600 transition-all duration-300 hover:scale-105 active:scale-95">
          <ArrowLeft size={14} /> Ir a la tienda
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-10 pb-32">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible"
          className="flex items-center justify-between mb-12">
          <div className="space-y-2">
            <Link to="/productos"
              className="flex items-center gap-1.5 text-[10px] font-black tracking-widest
                text-slate-400 uppercase hover:text-blue-600 transition-colors">
              <ArrowLeft size={11} /> Seguir comprando
            </Link>
            <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-black italic uppercase
              tracking-tighter leading-[0.85] text-slate-900">
              Mi bolsa
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-1 w-10 bg-slate-900 rounded-full" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {count} {count === 1 ? "producto" : "productos"}
              </p>
            </div>
          </div>

          <button onClick={clearCart}
            className="flex items-center gap-1.5 text-[10px] font-black tracking-widest
              text-slate-300 uppercase hover:text-red-400 transition-colors self-start mt-2">
            <Trash2 size={11} /> Vaciar
          </button>
        </motion.div>

        {/* ── Grid: lista + resumen ────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">

          {/* Lista de items */}
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {cart.map(item => {
                const price    = getItemPrice(item);
                const qty      = item.quantity || 1;
                const subtotal = price * qty;

                return (
                  <motion.div
                    key={item.cartKey}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex items-center gap-4 p-4 rounded-2xl border
                      border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200
                      hover:shadow-sm transition-all duration-300"
                  >
                    {/* Imagen */}
                    <div className="relative shrink-0">
                      {item.main_image ? (
                        <img
                          src={optimizeUrl(item.main_image)}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover border border-slate-100"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center
                          justify-center text-slate-300">
                          <ShoppingBag size={24} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-black text-sm text-slate-900 truncate">{item.name}</p>
                      {item.variantLabel && (
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                          {item.variantLabel}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 font-medium">
                        ${price.toLocaleString()} c/u
                      </p>

                      {/* Controles cantidad */}
                      <div className="flex items-center gap-0 bg-white border border-slate-200
                        rounded-xl w-fit overflow-hidden mt-2">
                        <button
                          onClick={() => updateQty(item.cartKey, qty - 1)}
                          disabled={qty <= 1}
                          className="p-2 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 font-black text-sm text-slate-900 min-w-[2rem]
                          text-center border-x border-slate-200">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.cartKey, qty + 1)}
                          className="p-2 hover:bg-slate-50 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal + eliminar */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <span className="font-black text-slate-900">
                        ${subtotal.toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.cartKey)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-400
                          hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ── Resumen ────────────────────────────────────────────────── */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible"
            className="lg:sticky lg:top-8 bg-white border border-slate-100
              rounded-[1.75rem] p-6 shadow-sm space-y-5"
          >
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Resumen
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Subtotal</span>
                <span className="font-bold text-slate-900">${total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Envío</span>
                <span className="font-bold text-slate-500">A coordinar</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                  Total
                </span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">
                  ${total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl
                bg-slate-900 text-white font-black text-[10px] tracking-[0.25em] uppercase
                hover:bg-blue-600 transition-all duration-300 hover:scale-[1.02]
                active:scale-95 shadow-xl shadow-blue-500/10"
            >
              {user
                ? <><ArrowRight size={14} /> Ir al checkout</>
                : <><LogIn size={14} /> Iniciar sesión para comprar</>
              }
            </button>

            {!user && (
              <p className="text-center text-[10px] text-slate-400 font-medium">
                Necesitas una cuenta para finalizar tu compra
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}