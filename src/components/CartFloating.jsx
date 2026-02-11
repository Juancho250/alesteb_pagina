import { MessageCircle, X, Plus, Minus, ShoppingBag, Loader2, MapPin, ChevronRight, ChevronLeft, Package, AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ============================================
// 🧩 MODAL DE CHECKOUT - 2 PASOS
// Paso 1: Dirección de envío
// Paso 2: Resumen + confirmación
// ============================================
function CheckoutModal({ cart, total, onClose, onSuccess, user }) {
  const [step, setStep] = useState(1); // 1 = dirección, 2 = resumen
  const [isProcessing, setIsProcessing] = useState(false);

  // Pre-rellenar con la dirección guardada del perfil si existe
  const [form, setForm] = useState({
    shipping_address: user?.address || "",
    shipping_city:    user?.city    || "",
    shipping_notes:   "",
    payment_method:   "transfer",
  });

  const [errors, setErrors] = useState({});

  const paymentOptions = [
    { value: "transfer", label: "Transferencia bancaria", icon: "🏦" },
    { value: "cash",     label: "Efectivo",               icon: "💵" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.shipping_address.trim()) newErrors.shipping_address = "La dirección es requerida";
    if (!form.shipping_city.trim())    newErrors.shipping_city    = "La ciudad es requerida";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      const saleData = {
        customer_id:      user.id,
        items:            cart.map(item => ({
          product_id: item.id,
          quantity:   item.quantity || 1,
        })),
        payment_method:   form.payment_method,
        shipping_address: form.shipping_address,
        shipping_city:    form.shipping_city,
        shipping_notes:   form.shipping_notes,
      };

      const response = await api.post("/sales", saleData);

      if (response.status === 201 && response.data.success) {
        const { order_code, total: orderTotal } = response.data.data;
        onSuccess({ order_code, total: orderTotal, ...form });
      }
    } catch (error) {
      console.error("Error al procesar venta:", error);
      const msg = error.response?.data?.message || "Error al procesar tu pedido";
      setErrors({ submit: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white w-full sm:max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-none">
                {step === 1 ? "Datos de envío" : "Confirmar pedido"}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Paso {step} de 2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="h-1 bg-slate-100 shrink-0">
          <div
            className="h-full bg-slate-900 transition-all duration-500"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        {/* BODY — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-6">

          {/* ── PASO 1: DIRECCIÓN ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <MapPin size={18} className="text-blue-600 shrink-0" />
                <p className="text-sm text-blue-700 font-medium leading-snug">
                  Ingresa la dirección donde recibirás tu pedido.
                  {user?.address && (
                    <span className="block text-xs text-blue-500 mt-0.5 font-normal">
                      Hemos precargado tu dirección de perfil. Puedes modificarla si es necesario.
                    </span>
                  )}
                </p>
              </div>

              {/* Ciudad */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Ciudad <span className="text-red-400">*</span>
                </label>
                <input
                  name="shipping_city"
                  value={form.shipping_city}
                  onChange={handleChange}
                  placeholder="Ej: Medellín, Bogotá, Cali…"
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all
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

              {/* Dirección */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Dirección completa <span className="text-red-400">*</span>
                </label>
                <input
                  name="shipping_address"
                  value={form.shipping_address}
                  onChange={handleChange}
                  placeholder="Calle, número, barrio, apto…"
                  className={`w-full px-4 py-3.5 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all
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

              {/* Nota opcional */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Instrucciones adicionales <span className="text-slate-300 font-normal normal-case">(opcional)</span>
                </label>
                <textarea
                  name="shipping_notes"
                  value={form.shipping_notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Ej: Timbre roto, entregar a portería, llamar al llegar…"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all resize-none"
                />
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Método de pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, payment_method: opt.value }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-bold
                        ${form.payment_method === opt.value
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                        }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-xs text-center leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 2: RESUMEN ── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Productos */}
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Productos ({cart.length})
                </p>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {item.main_image && (
                        <img
                          src={item.main_image}
                          alt={item.name}
                          className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400 font-medium">
                          ${Number(item.final_price || item.price).toLocaleString()} × {item.quantity || 1}
                        </p>
                      </div>
                      <p className="text-sm font-black text-slate-900 shrink-0">
                        ${Number((item.final_price || item.price) * (item.quantity || 1)).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dirección elegida */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-bold text-emerald-800">{form.shipping_city}</p>
                    <p className="text-emerald-700 font-medium">{form.shipping_address}</p>
                    {form.shipping_notes && (
                      <p className="text-emerald-600 text-xs mt-1 italic">{form.shipping_notes}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Total a pagar</p>
                  <p className="text-xs text-slate-400 font-medium">
                    {form.payment_method === "transfer" ? "🏦 Transferencia" : "💵 Efectivo"}
                  </p>
                </div>
                <p className="text-3xl font-black">${Number(total).toLocaleString()}</p>
              </div>

              {/* Info email */}
              <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 rounded-xl border border-blue-100">
                <Package size={15} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  Al confirmar, recibirás un email con el resumen de tu pedido en <strong>{user.email}</strong> y te redirigiremos a WhatsApp para coordinar el pago.
                </p>
              </div>

              {/* Error de envío */}
              {errors.submit && (
                <div className="flex items-center gap-2 p-3.5 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 font-medium">{errors.submit}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER — sticky */}
        <div className="px-6 pb-6 pt-4 border-t border-slate-100 shrink-0">
          {step === 1 ? (
            <button
              onClick={handleNext}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-[0.98]"
            >
              Continuar al resumen
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                ${isProcessing
                  ? "bg-slate-300 text-slate-500 cursor-wait"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Procesando pedido…
                </>
              ) : (
                <>
                  <MessageCircle size={18} />
                  Confirmar y abrir WhatsApp
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 🛒 CART FLOATING — componente principal
// ============================================
export default function CartFloating({ cart, onRemove, onUpdateQty, onClearCart }) {
  const [isOpen,          setIsOpen]          = useState(false);
  const [showCheckout,    setShowCheckout]     = useState(false);
  const { user }                               = useAuth();

  const { total, whatsappMessage, count } = useMemo(() => {
    let currentTotal = 0;
    let itemsCount   = 0;

    const itemsList = cart.map(i => {
      const price    = i.final_price || i.price || 0;
      const subtotal = price * (i.quantity || 1);
      currentTotal  += subtotal;
      itemsCount    += i.quantity || 1;
      return `• ${i.name} (×${i.quantity || 1}) - $${subtotal.toLocaleString()}`;
    }).join("\n");

    const userName  = user?.name  || "Cliente";
    const userEmail = user?.email ? `(${user.email})` : "";

    const msg = encodeURIComponent(
      `✨ *NUEVA SOLICITUD DE PEDIDO - Alesteb* ✨\n\n` +
      `👤 *CLIENTE:* ${userName.toUpperCase()} ${userEmail}\n` +
      `────────────────────────\n` +
      `${itemsList}\n` +
      `────────────────────────\n\n` +
      `💰 *VALOR TOTAL: $${currentTotal.toLocaleString()}*\n\n` +
      `Quedo atento para confirmar disponibilidad y coordinar el envío.`
    );

    return { total: currentTotal, whatsappMessage: msg, count: itemsCount };
  }, [cart, user]);

  // Callback cuando el pedido se crea exitosamente
  const handleOrderSuccess = ({ order_code, shipping_address, shipping_city, shipping_notes }) => {
    // Construir mensaje de WhatsApp enriquecido con código de orden y dirección
    const enhancedMsg =
      whatsappMessage +
      encodeURIComponent(
        `\n\n🔖 *CÓDIGO DE ORDEN:* ${order_code}\n` +
        `📍 *DIRECCIÓN:* ${shipping_city} - ${shipping_address}` +
        (shipping_notes ? `\n📝 ${shipping_notes}` : "") +
        `\n📅 *FECHA:* ${new Date().toLocaleDateString("es-CO")}`
      );

    window.open(`https://wa.me/573145055073?text=${enhancedMsg}`, "_blank");

    if (onClearCart) onClearCart();
    setShowCheckout(false);
    setIsOpen(false);

    // Toast de éxito
    alert(`✅ Pedido ${order_code} registrado.\n📧 Revisa tu email con el resumen.\n💬 Abriendo WhatsApp para coordinar el pago.`);
  };

  if (!cart.length) return null;

  return (
    <>
      {/* MODAL CHECKOUT */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          total={total}
          user={user}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {/* FLOATING CART */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 max-w-[350px] w-full pointer-events-none">

        {/* LISTA DESPLEGABLE */}
        <div
          className={`
            flex flex-col-reverse gap-3 w-full overflow-y-auto px-2 py-2 pointer-events-auto no-scrollbar
            transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]
            ${isOpen
              ? "max-h-[60vh] opacity-100 translate-y-0"
              : "max-h-0 opacity-0 translate-y-10"}
          `}
        >
          {cart.map(item => (
            <div
              key={item.id}
              className="relative group bg-white/95 backdrop-blur-xl rounded-[1.5rem] p-2 pr-5 flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white/50 transition-all duration-300 hover:shadow-xl hover:bg-white"
            >
              <div className="relative shrink-0">
                <img
                  src={item.main_image}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {item.quantity}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-tight text-slate-800 truncate">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[11px] font-bold text-slate-900">
                    ${((item.final_price || item.price) * (item.quantity || 1)).toLocaleString()}
                  </p>
                  <div className="flex items-center bg-slate-100 rounded-full px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onUpdateQty(item.id, (item.quantity || 1) - 1)}
                      className="p-1 hover:text-blue-600"
                    >
                      <Minus size={10} />
                    </button>
                    <button
                      onClick={() => onUpdateQty(item.id, (item.quantity || 1) + 1)}
                      className="p-1 hover:text-blue-600"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onRemove(item)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>

        {/* CONTROLES PRINCIPALES */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative group flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 shadow-2xl border border-white/40
              ${isOpen
                ? "bg-slate-900 text-white rotate-[360deg]"
                : "bg-white text-slate-900 hover:scale-110"}
            `}
          >
            {isOpen ? <X size={22} /> : <ShoppingBag size={22} />}
            {!isOpen && (
              <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
                {count}
              </span>
            )}
          </button>

          {/* BOTÓN FINALIZAR */}
          <button
            onClick={() => {
              if (!user) {
                alert("Debes iniciar sesión para finalizar tu pedido");
                return;
              }
              setShowCheckout(true);
            }}
            disabled={!user}
            className={`flex items-center gap-4 p-2 pl-8 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 group relative overflow-hidden
              ${!user ? "bg-slate-400 opacity-60 cursor-not-allowed" : "bg-slate-900 hover:scale-105 active:scale-95"}
            `}
          >
            <div className="flex flex-col text-white">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
                {!user ? "Inicia sesión" : `Orden de ${user.name.split(" ")[0]}`}
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

        {/* TOOLTIP: No autenticado */}
        {!user && (
          <div className="pointer-events-auto bg-amber-500 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-lg animate-pulse">
            ⚠️ Inicia sesión para finalizar tu compra
          </div>
        )}
      </div>
    </>
  );
}