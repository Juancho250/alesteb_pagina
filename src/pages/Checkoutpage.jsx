// src/pages/CheckoutPage.jsx
import { useState, useMemo } from "react";
import {
  ChevronLeft, MapPin, Package, Clock,
  AlertCircle, Loader2, ShoppingBag, Check, CreditCard, Landmark, Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useCart, getItemPrice } from "../context/CartContext";
import { useInventoryReservation } from "../hooks/useInventoryReservation";
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

function fmtCountdown(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function CheckoutPage() {
  const navigate            = useNavigate();
  const { user }            = useAuth();
  const { cart, clearCart } = useCart();

  const [step, setStep]                     = useState(1);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [errors, setErrors]                 = useState({});
  const [redirecting, setRedirecting]       = useState(false);
  const [paymentMethod, setPaymentMethod]   = useState("online");
  const [onlinePayAvailable, setOnlinePayAvailable] = useState(true);

  const [form, setForm] = useState({
    shipping_address: user?.address || "",
    shipping_city:    user?.city    || "",
    shipping_notes:   "",
  });

  // ── Inventory reservation (created on mount; released on unmount) ──────────
  const reserv = useInventoryReservation(cart);

  // ── Cálculo de totales ─────────────────────────────────────────────────────
  const { total, count, subtotalOriginal, discountAmount } = useMemo(() => {
    let totalConDescuento = 0;
    let totalSinDescuento = 0;
    let c = 0;

    cart.forEach(i => {
      const qty = i.quantity || 1;
      // precioFinal: precio con descuento (variantPrice ya es el precio descontado si hay discount_info)
      const precioFinal = getItemPrice(i);
      // precioBase: precio original sin descuento
      // variantOriginalPrice se almacena en ProductDetail cuando hay variante + descuento
      const precioBase = Number(
        i.variantOriginalPrice ?? i.variantPrice ?? i.sale_price ?? i.price ?? precioFinal
      );

      totalConDescuento += precioFinal * qty;
      totalSinDescuento += precioBase  * qty;
      c += qty;
    });

    return {
      total:            totalConDescuento,
      count:            c,
      subtotalOriginal: totalSinDescuento,
      discountAmount:   Math.max(0, Math.round(totalSinDescuento - totalConDescuento)),
    };
  }, [cart]);

  // on_demand delivery summary
  const onDemandItems   = cart.filter(i => i.fulfillment_mode === "on_demand");
  const hasOnDemand     = onDemandItems.length > 0;
  const maxLeadDays     = hasOnDemand
    ? Math.max(...onDemandItems.map(i => Number(i.supplier_lead_time_days) || 0))
    : 0;
  const maxDeliveryDate = maxLeadDays > 0
    ? new Date(Date.now() + maxLeadDays * 86400000)
        .toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  // discount_id del primer ítem que tenga descuento aplicado (discount_info viene de DiscountsContext)
  const appliedDiscountId = useMemo(() => {
    for (const item of cart) {
      if (item.discount_info?.id) return item.discount_info.id;
    }
    return undefined;
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
      const { data: saleResp } = await api.post("/sales", {
        customer_id:      user.id,
        reservation_id:   reserv.reservationId ?? undefined,
        items: cart.map(i => ({
          product_id: i.id,
          quantity:   i.quantity || 1,
          unit_price: getItemPrice(i),
          ...(i.variantId && { variant_id: i.variantId }),
        })),
        discount_id:      appliedDiscountId  || undefined,
        discount_amount:  discountAmount     || undefined,
        payment_method:   paymentMethod === "online" ? "credit" : "transfer",
        sale_type:        "web",
        shipping_address: form.shipping_address,
        shipping_city:    form.shipping_city,
        shipping_notes:   form.shipping_notes,
      });

      if (!saleResp.success) throw new Error(saleResp.message || "Error al crear el pedido");

      const saleId     = saleResp.data?.sale_id ?? saleResp.data?.id;
      const saleNumber = saleResp.data?.sale_number ?? saleResp.data?.code ?? String(saleId);

      reserv.markPaid();

      if (paymentMethod === "online") {
        // Obtener parámetros de Wompi desde el backend
        // El backend lee sales.total desde DB — que ahora es el precio correcto
        const { data: sessResp } = await api.get(`/wompi/session/${saleId}`);
        if (!sessResp.success) throw new Error(sessResp.message || "No se pudo iniciar el pago");

        const p = sessResp.data;
        const params = new URLSearchParams({
          "public-key":      p.public_key,
          currency:          p.currency,
          "amount-in-cents": String(Math.round(Number(p.amount_in_cents))),
          reference:         p.reference,
          "redirect-url":    p.redirect_url,
        });

        clearCart();
        setRedirecting(true);
        window.location.href =
          `https://checkout.wompi.co/p/?${params.toString()}&signature:integrity=${p.signature}`;

      } else {
        // Transferencia bancaria
        clearCart();
        navigate("/order-success", {
          replace: true,
          state: {
            order_code:            saleNumber,
            sale_id:               saleId,
            total,
            payment_method:        "transfer",
            shipping_address:      form.shipping_address,
            shipping_city:         form.shipping_city,
            has_on_demand_items:   hasOnDemand,
            estimated_delivery_date: maxDeliveryDate,
          },
        });
      }

    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message ?? err.message
        ?? "Error al procesar tu pedido. Intenta de nuevo.";

      if (status === 409) {
        setErrors({
          submit: "Uno o más productos ya no tienen stock suficiente. Vuelve al carrito y ajusta las cantidades.",
          is409: true,
        });
      } else if (
        status === 402 ||
        /cuenta de pago|payment account|no configurad/i.test(msg)
      ) {
        setOnlinePayAvailable(false);
        setPaymentMethod("transfer");
        setErrors({
          submit: "El pago en línea no está disponible ahora. Completa tu pedido con transferencia bancaria.",
        });
      } else if (
        /reserva.*expir|reservation.*expir/i.test(msg)
      ) {
        setErrors({
          submit: "Tu reserva de stock expiró. Vuelve al carrito e inténtalo de nuevo.",
          reservaExpirada: true,
        });
      } else {
        setErrors({ submit: msg });
      }

      setIsProcessing(false);
      setRedirecting(false);
    }
  };

  // ── Pantalla de redireccionando ───────────────────────────────────────────
  if (redirecting) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5">
        <div className="w-16 h-16 rounded-full bg-[#FF3366]/10 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#FF3366]" />
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

  // ── Guard: reserva expirada ───────────────────────────────────────────────
  if (reserv.expired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
            <Clock size={28} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Reserva expirada</h2>
          <p className="text-slate-500 text-sm mb-6">
            Tu carrito estuvo reservado 15 minutos. Vuelve e inténtalo de nuevo.
          </p>
          <button
            onClick={() => navigate("/carrito")}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl
              font-bold text-sm transition-all active:scale-[0.98]"
          >
            Volver al carrito
          </button>
        </div>
      </div>
    );
  }

  // ── Guard: 409 en reserva (stock insuficiente al crear reserva) ───────────
  if (reserv.is409) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Stock insuficiente</h2>
          <p className="text-slate-500 text-sm mb-6">
            {reserv.error || "Uno o más productos ya no tienen stock suficiente."}
          </p>
          <button
            onClick={() => navigate("/carrito")}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl
              font-bold text-sm transition-all active:scale-[0.98]"
          >
            Volver al carrito
          </button>
        </div>
      </div>
    );
  }

  // ── Guards estándar ────────────────────────────────────────────────────────
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

  const isOnline = paymentMethod === "online";
  const showCountdown = reserv.reservationId && reserv.secondsLeft !== null;
  const countdownUrgent = showCountdown && reserv.secondsLeft <= 120;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Header sticky ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => step === 1 ? navigate(-1) : setStep(1)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 shrink-0"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-black text-slate-900 leading-none">
                  {step === 1 ? "Datos de envío" : "Confirmar pedido"}
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Paso {step} de 2</p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {/* Countdown badge */}
              {showCountdown && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black
                  transition-colors
                  ${countdownUrgent
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                  }`}>
                  <Clock size={11} className="shrink-0" />
                  {fmtCountdown(reserv.secondsLeft)}
                </div>
              )}
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
                <p className="text-xl font-black text-slate-900">${total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-slate-900 transition-all duration-500"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        {/* Countdown sub-banner (urgente < 2 min) */}
        <AnimatePresence>
          {countdownUrgent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
                <Clock size={12} className="text-red-500 shrink-0" />
                <p className="text-[11px] font-bold text-red-600">
                  Tu carrito está reservado por <span className="font-black">{fmtCountdown(reserv.secondsLeft)}</span>.
                  Confirma antes de que expire.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Countdown info (normal, > 2 min) ──────────────────────────────── */}
      {showCountdown && !countdownUrgent && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 rounded-2xl border border-amber-100">
            <Clock size={13} className="text-amber-500 shrink-0" />
            <p className="text-xs font-bold text-amber-700">
              Tu carrito está reservado por{" "}
              <span className="font-black">{fmtCountdown(reserv.secondsLeft)}</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">

          {/* ── Formulario ──────────────────────────────────────────────── */}
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

                {/* Método de pago */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Método de pago
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {onlinePayAvailable && (
                      <button
                        onClick={() => setPaymentMethod("online")}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left
                          ${isOnline
                            ? "border-slate-900 bg-slate-900"
                            : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                          ${isOnline ? "bg-white/15" : "bg-[#FF3366]/10"}`}>
                          <CreditCard size={18} className={isOnline ? "text-white" : "text-[#FF3366]"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-black text-sm ${isOnline ? "text-white" : "text-slate-900"}`}>
                            Pagar en línea
                          </p>
                          <p className={`text-xs mt-0.5 ${isOnline ? "text-white/60" : "text-slate-400"}`}>
                            Tarjeta débito · crédito · PSE — vía Wompi
                          </p>
                        </div>
                        {isOnline && <Check size={18} className="text-white flex-shrink-0" />}
                      </button>
                    )}

                    <button
                      onClick={() => setPaymentMethod("transfer")}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left
                        ${!isOnline
                          ? "border-slate-900 bg-slate-900"
                          : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${!isOnline ? "bg-white/15" : "bg-emerald-50"}`}>
                        <Landmark size={18} className={!isOnline ? "text-white" : "text-emerald-600"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-sm ${!isOnline ? "text-white" : "text-slate-900"}`}>
                          Transferencia bancaria
                        </p>
                        <p className={`text-xs mt-0.5 ${!isOnline ? "text-white/60" : "text-slate-400"}`}>
                          Bancolombia · Nequi · sin comisiones
                        </p>
                      </div>
                      {!isOnline && <Check size={18} className="text-white flex-shrink-0" />}
                    </button>
                  </div>
                </div>

                {/* Resumen de envío */}
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

                {/* Info según método */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                      ${isOnline ? "bg-[#FF3366]/10" : "bg-emerald-50"}`}>
                      {isOnline
                        ? <Package size={16} className="text-[#FF3366]" />
                        : <Landmark size={16} className="text-emerald-600" />
                      }
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      {isOnline
                        ? <>Al confirmar serás redirigido al portal seguro de{" "}
                            <strong className="text-slate-900">Wompi</strong> para pagar con
                            tarjeta débito, crédito o PSE.</>
                        : <>Crearemos tu pedido y recibirás los datos bancarios para
                            <strong className="text-slate-900"> realizar la transferencia</strong>. Sube tu
                            comprobante para que confirmemos rápido.</>
                      }
                    </p>
                  </div>
                </div>

                {/* Error de submit */}
                {errors.submit && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-200">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-600 font-medium">{errors.submit}</p>
                      {(errors.is409 || errors.reservaExpirada) && (
                        <button
                          onClick={() => navigate("/carrito")}
                          className="mt-1.5 text-xs font-bold text-red-500 underline"
                        >
                          Volver al carrito
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-xl font-black text-sm flex items-center
                    justify-center gap-2 transition-all active:scale-[0.98]
                    ${isProcessing
                      ? "bg-slate-200 text-slate-400 cursor-wait"
                      : isOnline
                        ? "bg-[#FF3366] hover:bg-[#e02d5a] text-white shadow-xl shadow-[#FF3366]/20"
                        : "bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10"
                    }`}
                >
                  {isProcessing ? (
                    <><Loader2 size={18} className="animate-spin" />
                      {isOnline ? "Iniciando pago…" : "Creando pedido…"}</>
                  ) : isOnline ? (
                    <><CreditCard size={18} /> Continuar a Wompi</>
                  ) : (
                    <><Landmark size={18} /> Confirmar pedido</>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-400">
                  {isOnline
                    ? "🔒 Pago 100% seguro · Procesado por Wompi"
                    : "🔒 Tu pedido está protegido · Confirma con comprobante"
                  }
                </p>
              </div>
            )}
          </div>

          {/* ── Sidebar resumen del pedido ─────────────────────────────── */}
          <div className="lg:sticky lg:top-28 h-fit">
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
                  <span className="font-bold text-slate-900">${subtotalOriginal.toLocaleString()}</span>
                </div>
                {/* ✅ Mostrar descuento si existe */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 font-medium">Descuento</span>
                    <span className="font-bold text-emerald-600">−${discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Envío</span>
                  <span className="font-bold text-slate-500">A coordinar</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-sm font-black uppercase text-slate-600">Total</span>
                  <span className="text-2xl font-black text-slate-900">${total.toLocaleString()}</span>
                </div>
                {hasOnDemand && (
                  <div className="flex items-start gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5 mt-2">
                    <Truck size={12} className="text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider">
                        Algunos ítems bajo pedido
                      </p>
                      {maxDeliveryDate && (
                        <p className="text-[10px] text-purple-600 flex items-center gap-1 mt-0.5">
                          <Clock size={9} /> Entrega estimada: <strong className="ml-0.5">{maxDeliveryDate}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 text-center pt-1">
                  {isOnline ? "💳 Tarjeta / PSE vía Wompi" : "🏦 Bancolombia · Nequi"}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}