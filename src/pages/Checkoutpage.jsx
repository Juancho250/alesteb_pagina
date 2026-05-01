// src/pages/CheckoutPage.jsx
import {
  ChevronLeft, MapPin, Package,
  AlertCircle, Loader2, ShoppingBag, Check, CreditCard,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart, getItemPrice } from "../context/CartContext";
import api from "../services/api";

export const BANK_INFO = [
  {
    bank:   "Bancolombia",
    type:   "Ahorros",
    number: "123-456789-00",
    name:   "Alesteb S.A.S",
    nit:    "900.123.456-7",
    emoji:  "🏦",
  },
  {
    bank:   "Nequi",
    type:   "Nequi",
    number: "3145055073",
    name:   "Alesteb Boutique",
    nit:    null,
    emoji:  "💜",
  },
];

export default function CheckoutPage() {
  const navigate            = useNavigate();
  const { user }            = useAuth();
  const { cart, clearCart } = useCart();

  const [step, setStep]                 = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors]             = useState({});
  const [redirecting, setRedirecting]   = useState(false);

  const [form, setForm] = useState({
    shipping_address: user?.address || "",
    shipping_city:    user?.city    || "",
    shipping_notes:   "",
  });

  const { total, count } = useMemo(() => {
    let t = 0, c = 0;
    cart.forEach(i => {
      t += getItemPrice(i) * (i.quantity || 1);
      c += i.quantity || 1;
    });
    return { total: t, count: c };
  }, [cart]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.shipping_address.trim()) e.shipping_address = "La dirección es requerida";
    if (!form.shipping_city.trim())    e.shipping_city    = "La ciudad es requerida";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setErrors({});
    try {
      const { data } = await api.post("/sales", {
        customer_id:      user.id,
        items: cart.map(i => ({
          product_id: i.id,
          quantity:   i.quantity || 1,
          ...(i.variantId && { variant_id: i.variantId }),
        })),
        payment_method:   "credit",
        shipping_address: form.shipping_address,
        shipping_city:    form.shipping_city,
        shipping_notes:   form.shipping_notes,
      });

      if (!data.success) throw new Error(data.message || "Error al crear el pedido");

      const { data: wompi } = await api.get(`/wompi/session/${data.data.sale_id}`);
      if (!wompi.success) throw new Error("No se pudo iniciar el pago con Wompi");

      // ✅ URL construida manualmente — el ":" en signature:integrity NO se codifica
      const wompiUrl = [
        `https://checkout.wompi.co/p/`,
        `?public-key=${encodeURIComponent(wompi.data.public_key)}`,
        `&currency=${wompi.data.currency}`,
        `&amount-in-cents=${wompi.data.amount_in_cents}`,
        `&reference=${encodeURIComponent(wompi.data.reference)}`,
        `&signature:integrity=${wompi.data.signature}`,
        `&redirect-url=${encodeURIComponent(wompi.data.redirect_url)}`,
      ].join("");

      setRedirecting(true);
      clearCart();
      window.location.href = wompiUrl;

    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || error.message || "Error al procesar tu pedido. Intenta de nuevo.",
      });
      setIsProcessing(false);
      setRedirecting(false);
    }
  };

  // ── Pantalla de redireccionando (evita el flicker del guard) ─────────────
  if (redirecting) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-[#FF3366]/10 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-[#FF3366]" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="font-black text-slate-900 text-lg tracking-tight">Redirigiendo a Wompi</p>
          <p className="text-sm text-slate-400 font-medium">Preparando tu pago seguro…</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            🔒 Conexión segura
          </span>
        </div>
      </div>
    );
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="mx-auto text-amber-400" />
          <h2 className="text-2xl font-black text-slate-900">Inicia sesión primero</h2>
          <p className="text-slate-500 text-sm">Necesitas una cuenta para completar tu pedido</p>
          <button
            onClick={() => navigate("/auth", { state: { from: "/checkout" } })}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold
              hover:bg-slate-800 transition-colors"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <ShoppingBag size={48} className="mx-auto text-slate-300" />
          <h2 className="text-2xl font-black text-slate-900">Tu carrito está vacío</h2>
          <button
            onClick={() => navigate("/productos")}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold
              hover:bg-slate-800 transition-colors"
          >
            Ver productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Header sticky */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => step === 1 ? navigate(-1) : setStep(1)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-black text-slate-900 leading-none">
                  {step === 1 ? "Datos de envío" : "Confirmar pedido"}
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Paso {step} de 2</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
              <p className="text-xl font-black text-slate-900">${total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-slate-900 transition-all duration-500"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">

          {/* Formulario */}
          <div>

            {/* Paso 1: Dirección */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
                {user?.address && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      Precargamos tu dirección de perfil. Modifícala si es necesario.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Ciudad <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="shipping_city"
                    value={form.shipping_city}
                    onChange={handleChange}
                    placeholder="Ej: Medellín, Bogotá, Cali…"
                    className={`w-full px-4 py-3.5 rounded-xl border text-sm font-medium text-slate-900
                      placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all
                      ${errors.shipping_city
                        ? "border-red-300 bg-red-50 focus:ring-red-200"
                        : "border-slate-200 bg-slate-50 focus:ring-slate-900/10 focus:border-slate-400"
                      }`}
                  />
                  {errors.shipping_city && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.shipping_city}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Dirección completa <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="shipping_address"
                    value={form.shipping_address}
                    onChange={handleChange}
                    placeholder="Calle, número, barrio, apto…"
                    className={`w-full px-4 py-3.5 rounded-xl border text-sm font-medium text-slate-900
                      placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all
                      ${errors.shipping_address
                        ? "border-red-300 bg-red-50 focus:ring-red-200"
                        : "border-slate-200 bg-slate-50 focus:ring-slate-900/10 focus:border-slate-400"
                      }`}
                  />
                  {errors.shipping_address && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.shipping_address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Instrucciones{" "}
                    <span className="text-slate-300 font-normal normal-case">(opcional)</span>
                  </label>
                  <textarea
                    name="shipping_notes"
                    value={form.shipping_notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Ej: Timbre roto, entregar a portería, llamar al llegar…"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm
                      font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none
                      focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all resize-none"
                  />
                </div>

                {/* Info de pago */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <CreditCard size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Pagarás de forma segura con <strong className="text-slate-700">tarjeta débito, crédito o PSE</strong> a través de Wompi en el siguiente paso.
                  </p>
                </div>

                <button
                  onClick={() => { if (validateStep1()) setStep(2); }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl
                    font-black text-sm flex items-center justify-center gap-2
                    transition-all active:scale-[0.98]"
                >
                  Continuar al resumen
                  <ChevronLeft size={16} className="rotate-180" />
                </button>
              </div>
            )}

            {/* Paso 2: Confirmar */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Resumen envío */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                        Envío a
                      </p>
                      <p className="font-bold text-slate-900">{form.shipping_city}</p>
                      <p className="text-sm text-slate-500">{form.shipping_address}</p>
                      {form.shipping_notes && (
                        <p className="text-xs text-slate-400 mt-1 italic">{form.shipping_notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold underline shrink-0"
                    >
                      Editar
                    </button>
                  </div>
                </div>

                {/* Info pago Wompi */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-[#FF3366]/10 rounded-xl flex items-center justify-center shrink-0">
                      <Package size={16} className="text-[#FF3366]" />
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      Al confirmar, crearemos tu pedido y serás redirigido al portal de pago seguro de{" "}
                      <strong className="text-slate-900">Wompi</strong> para completar el pago con
                      tarjeta débito, crédito o PSE.
                    </p>
                  </div>
                </div>

                {errors.submit && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-200">
                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                    <p className="text-sm text-red-600 font-medium">{errors.submit}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-xl font-black text-sm flex items-center
                    justify-center gap-2 transition-all active:scale-[0.98]
                    ${isProcessing
                      ? "bg-slate-200 text-slate-400 cursor-wait"
                      : "bg-[#FF3366] hover:bg-[#e02d5a] text-white shadow-xl shadow-[#FF3366]/20"
                    }`}
                >
                  {isProcessing
                    ? <><Loader2 size={18} className="animate-spin" /> Iniciando pago…</>
                    : <><CreditCard size={18} /> Confirmar y pagar con Wompi</>
                  }
                </button>

                <p className="text-center text-[11px] text-slate-400">
                  🔒 Pago 100% seguro · Procesado por Wompi
                </p>
              </div>
            )}
          </div>

          {/* Sidebar resumen */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                Tu pedido · {count} {count === 1 ? "producto" : "productos"}
              </h3>

              <div className="space-y-3 mb-5 max-h-72 overflow-y-auto">
                {cart.map(item => {
                  const price    = getItemPrice(item);
                  const subtotal = price * (item.quantity || 1);
                  return (
                    <div key={item.cartKey}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {item.main_image && (
                        <div className="relative shrink-0">
                          <img
                            src={item.main_image}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                          />
                          <div className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white
                            text-[10px] font-black w-5 h-5 rounded-full flex items-center
                            justify-center border-2 border-white">
                            {item.quantity || 1}
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                        {item.variantLabel && (
                          <p className="text-[10px] text-blue-500 font-bold truncate">
                            {item.variantLabel}
                          </p>
                        )}
                        {!item.variantLabel && item.variantAttributes?.length > 0 && (
                          <p className="text-[10px] text-blue-500 font-bold truncate">
                            {item.variantAttributes.map(a => a.display_value ?? a.value).join(" / ")}
                          </p>
                        )}
                        <p className="text-xs text-slate-400">
                          ${price.toLocaleString()} × {item.quantity || 1}
                        </p>
                      </div>
                      <p className="text-sm font-black text-slate-900 shrink-0">
                        ${subtotal.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-900">${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Envío</span>
                  <span className="font-bold text-slate-500">A coordinar</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-sm font-black uppercase text-slate-600">Total</span>
                  <span className="text-2xl font-black text-slate-900">${total.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-slate-400 text-center pt-1">
                  💳 Tarjeta / PSE vía Wompi
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}