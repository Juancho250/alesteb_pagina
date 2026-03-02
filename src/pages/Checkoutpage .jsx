import { MessageCircle, ChevronLeft, MapPin, Package, AlertCircle, Loader2, ShoppingBag, Minus, Plus, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Recibir el carrito desde el estado de navegación
  const cart = useMemo(() => {
    const stateCart = location.state?.cart;
    return Array.isArray(stateCart) ? stateCart : [];
  }, [location.state]);
  
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

  // Calcular total
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
        const { order_code } = response.data.data;
        
        // Construir mensaje de WhatsApp enriquecido
        const enhancedMsg =
          whatsappMessage +
          encodeURIComponent(
            `\n\n🔖 *CÓDIGO DE ORDEN:* ${order_code}\n` +
            `📍 *DIRECCIÓN:* ${form.shipping_city} - ${form.shipping_address}` +
            (form.shipping_notes ? `\n📝 ${form.shipping_notes}` : "") +
            `\n📅 *FECHA:* ${new Date().toLocaleDateString("es-CO")}`
          );

        window.open(`https://wa.me/573145055073?text=${enhancedMsg}`, "_blank");

        // Navegar a página de éxito o home
        navigate("/order-success", { 
          state: { 
            order_code, 
            total,
            shipping_address: form.shipping_address,
            shipping_city: form.shipping_city
          },
          replace: true 
        });
      }
    } catch (error) {
      console.error("Error al procesar venta:", error);
      const msg = error.response?.data?.message || "Error al procesar tu pedido";
      setErrors({ submit: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirigir si no hay carrito o usuario
  if (!cart.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Tu carrito está vacío</h2>
          <p className="text-slate-500 mb-6">Agrega productos para continuar con tu compra</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto text-amber-500 mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Inicia sesión</h2>
          <p className="text-slate-500 mb-6">Debes iniciar sesión para finalizar tu pedido</p>
          <button
            onClick={() => navigate("/login", { state: { from: "/checkout" } })}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => step === 1 ? navigate(-1) : setStep(1)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-black text-slate-900 leading-none">
                  {step === 1 ? "Datos de envío" : "Confirmar pedido"}
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Paso {step} de 2
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Total</p>
              <p className="text-xl font-black text-slate-900">${total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {/* PROGRESS BAR */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-slate-900 transition-all duration-500"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          
          {/* FORMULARIO / RESUMEN */}
          <div>
            {/* ── PASO 1: DIRECCIÓN ── */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
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
                      rows={3}
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
                          <span className="text-2xl">{opt.icon}</span>
                          <span className="text-xs text-center leading-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] mt-6"
                  >
                    Continuar al resumen
                    <ChevronLeft size={18} className="rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 2: RESUMEN ── */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="space-y-5">
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
                      <button
                        onClick={() => setStep(1)}
                        className="ml-auto text-emerald-600 hover:text-emerald-800 text-xs font-bold underline"
                      >
                        Editar
                      </button>
                    </div>
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

                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]
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
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR - RESUMEN DEL PEDIDO */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                Resumen del pedido ({count} {count === 1 ? 'producto' : 'productos'})
              </h3>
              
              <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {item.main_image && (
                      <div className="relative">
                        <img
                          src={item.main_image}
                          alt={item.name}
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                          {item.quantity || 1}
                        </div>
                      </div>
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

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-900">${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Envío</span>
                  <span className="font-bold text-slate-900">A coordinar</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-sm font-black uppercase text-slate-600">Total</span>
                  <span className="text-2xl font-black text-slate-900">${total.toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-400 text-center pt-2">
                  Método: {form.payment_method === "transfer" ? "🏦 Transferencia" : "💵 Efectivo"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
