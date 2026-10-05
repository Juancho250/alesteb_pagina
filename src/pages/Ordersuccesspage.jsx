// src/pages/OrderSuccessPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  CheckCircle, XCircle,
  Package, MapPin, Home, ChevronRight, Upload, Loader2, AlertCircle, Truck, Clock,
} from "lucide-react";
import ProofUploader from "../components/ProofUploader";
import api from "../services/api";

/* ─────────────────────────────────────────────────────────────────────────
   Wompi redirige con query params:
     ?id=<tx_id>&reference=<order_ref>&amount_in_cents=...&currency=COP&status=APPROVED
   El flujo manual (transfer) sigue usando location.state.
   ───────────────────────────────────────────────────────────────────────── */
export default function OrderSuccessPage() {
  const location       = useLocation();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Params de Wompi en la URL ────────────────────────────────────────────
  const wompiReference = searchParams.get("reference");
  const wompiStatus    = searchParams.get("status"); // APPROVED | DECLINED | ERROR | VOIDED

  // ── Estado para el flujo manual (transfer/cash) desde location.state ────
  const state = location.state || {};

  const [orderData,     setOrderData]     = useState(null);
  const [loadingWompi,  setLoading]       = useState(!!wompiReference);
  const [wompiApproved, setApproved]      = useState(false);
  const [pollTimedOut,  setPollTimedOut]  = useState(false);

  // ── Polling de estado de transacción (solo para flujo Wompi) ─────────────
  //
  // El query param ?status=APPROVED de Wompi es solo una pista; la fuente de
  // verdad es siempre el backend (que recibe el webhook). Hacemos polling
  // hasta obtener un estado final o agotar el tiempo máximo.
  useEffect(() => {
    if (!wompiReference) return;

    let timerId;
    let attempts = 0;
    const MAX_ATTEMPTS = 60;   // ~3 min a 3 s por intento
    const INTERVAL_MS  = 3_000;

    const FINAL_STATUSES = new Set([
      "approved", "declined", "voided", "error", "paid", "failed",
    ]);

    const poll = async () => {
      try {
        const { data } = await api.get(`/wompi/verify/${wompiReference}`);
        if (data.success) {
          const raw = (
            data.data?.status ??
            data.data?.payment_status ??
            ""
          ).toLowerCase();

          if (FINAL_STATUSES.has(raw)) {
            setOrderData(data.data);
            setApproved(raw === "approved" || raw === "paid");
            setLoading(false);
            return; // detener polling
          }
        }
      } catch {
        // error de red o 5xx: seguir intentando
      }

      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        setLoading(false);
        setPollTimedOut(true);
        return;
      }

      timerId = setTimeout(poll, INTERVAL_MS);
    };

    // Si Wompi ya envió un status en la URL, empezamos el primer check rápido
    // (400 ms) en lugar de esperar 3 s, para no hacer esperar al usuario.
    timerId = setTimeout(poll, wompiStatus ? 400 : 1_000);
    return () => clearTimeout(timerId);
  }, [wompiReference, wompiStatus]);

  // ── Redirigir si no hay datos en absoluto ───────────────────────────────
  useEffect(() => {
    if (!wompiReference && !state.order_code) {
      const t = setTimeout(() => navigate("/"), 2000);
      return () => clearTimeout(t);
    }
  }, [wompiReference, state.order_code, navigate]);

  // ── Datos unificados para el template ───────────────────────────────────
  const order_code           = state.order_code  || orderData?.sale_number || wompiReference || "";
  const sale_id              = state.sale_id     || orderData?.id          || null;
  const total                = state.total       || orderData?.total       || 0;
  const payment_method       = state.payment_method || (wompiReference ? "wompi" : "");
  const shipping_address     = state.shipping_address || "";
  const shipping_city        = state.shipping_city    || "";
  const has_on_demand_items  = state.has_on_demand_items  || orderData?.has_on_demand_items  || false;
  const estimated_delivery_date = state.estimated_delivery_date || orderData?.estimated_delivery_date || null;

  const isWompi    = payment_method === "wompi" || !!wompiReference;
  const isTransfer = payment_method === "transfer";
  const isSuccess  = isWompi ? wompiApproved : true;

  // ── Loading mientras hacemos polling ────────────────────────────────────
  if (loadingWompi) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={40} className="mx-auto text-slate-400 animate-spin" />
          <p className="text-slate-600 font-black text-lg">Verificando tu pago…</p>
          <p className="text-slate-400 text-sm font-medium">
            Confirmando con Wompi. Esto puede tomar unos segundos.
          </p>
        </div>
      </div>
    );
  }

  // ── Timeout de polling: no pudimos confirmar ─────────────────────────────
  if (pollTimedOut) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
            <AlertCircle size={32} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Verificación pendiente</h2>
          <p className="text-slate-500 text-sm mb-2">
            No pudimos confirmar el estado de tu pago en este momento.
          </p>
          <p className="text-slate-400 text-xs mb-6">
            Si el cargo fue realizado, el pedido quedará registrado. Revisa "Mis pedidos" en
            unos minutos o contacta soporte.
          </p>
          <div className="space-y-3">
            <Link
              to="/perfil?tab=orders"
              className="flex items-center justify-center gap-2 w-full py-3
                bg-slate-900 text-white rounded-xl font-bold text-sm"
            >
              Ver mis pedidos
            </Link>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full py-3
                bg-slate-100 text-slate-700 rounded-xl font-bold text-sm"
            >
              <Home size={15} /> Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Pago rechazado con Wompi ─────────────────────────────────────────────
  if (isWompi && !isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <XCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Pago no aprobado</h2>
          <p className="text-slate-500 text-sm mb-2">
            Tu pedido <strong className="text-slate-700">{order_code}</strong> fue creado pero el
            pago no se completó.
          </p>
          <p className="text-slate-400 text-xs mb-6">
            Puedes intentar nuevamente desde el checkout o revisar el estado desde "Mis pedidos".
          </p>
          <div className="space-y-3">
            <Link
              to="/perfil?tab=orders"
              className="flex items-center justify-center gap-2 w-full py-3
                bg-slate-900 text-white rounded-xl font-bold text-sm"
            >
              Ver mis pedidos
            </Link>
            <Link
              to="/checkout"
              className="flex items-center justify-center gap-2 w-full py-3
                bg-slate-100 text-slate-700 rounded-xl font-bold text-sm"
            >
              Intentar de nuevo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Fallback si aún no hay código ────────────────────────────────────────
  if (!order_code) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 font-medium">Redirigiendo…</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <div className="max-w-lg mx-auto px-4 pt-12">

        {/* ── Animación de éxito ───────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full
            bg-emerald-500 mb-5 shadow-xl shadow-emerald-200 animate-bounce">
            <CheckCircle size={40} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
            {isWompi ? "¡Pago recibido!" : "¡Pedido confirmado!"}
          </h1>
          <p className="text-slate-500 font-medium mb-4">
            {isWompi
              ? "Tu pago fue aprobado. Procesaremos tu pedido pronto."
              : "Revisamos y procesamos tu pedido muy pronto"
            }
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white
            rounded-full shadow-lg">
            <Package size={15} />
            <span className="font-black text-sm tracking-wide">{order_code}</span>
          </div>
        </div>

        {/* ── Resumen ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
          {/* Total */}
          <div className="bg-slate-900 text-white px-6 py-5 text-center">
            <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">
              Total del pedido
            </p>
            <p className="text-4xl font-black">${Number(total).toLocaleString()}</p>
            {isWompi && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1
                bg-emerald-500 rounded-full">
                <CheckCircle size={12} />
                <span className="text-[11px] font-black">Pago aprobado por Wompi</span>
              </div>
            )}
          </div>

          {/* Dirección */}
          {(shipping_city || shipping_address) && (
            <div className="px-6 py-4 border-b border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin size={14} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-0.5">
                  Dirección de envío
                </p>
                {shipping_city    && <p className="font-bold text-slate-900">{shipping_city}</p>}
                {shipping_address && <p className="text-sm text-slate-500">{shipping_address}</p>}
              </div>
            </div>
          )}

          {/* Entrega bajo pedido */}
          {has_on_demand_items && (
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3.5">
                <Truck size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-purple-700 uppercase tracking-wider mb-1">
                    Tu pedido incluye ítems bajo pedido
                  </p>
                  <p className="text-[11px] text-purple-600 leading-relaxed">
                    Algunos productos se adquirirán especialmente para ti. Esto puede tardar algunos
                    días adicionales.
                  </p>
                  {estimated_delivery_date && (
                    <p className="text-[11px] text-purple-700 font-bold flex items-center gap-1 mt-1.5">
                      <Clock size={10} />
                      Entrega estimada: {estimated_delivery_date}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Próximos pasos */}
          <div className="px-6 py-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              ¿Qué sigue?
            </p>
            <ol className="space-y-3">
              {(isWompi
                ? [
                    "Revisa tu correo con el resumen del pedido",
                    "Prepararemos tu pedido para el envío",
                    "Recibe tu pedido en la dirección indicada",
                  ]
                : [
                    "Revisa tu correo con el resumen del pedido",
                    "Sigue las instrucciones de pago proporcionadas por la tienda",
                    "Sube tu comprobante para agilizar la verificación",
                    "Recibe tu pedido en la dirección indicada",
                  ]
              ).map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white
                    text-[11px] font-black flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-600 font-medium leading-snug pt-0.5">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Subir comprobante (no aplica para Wompi aprobado) ────────── */}
        {isTransfer && sale_id && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Upload size={14} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Sube tu comprobante</p>
                <p className="text-xs text-slate-400">
                  Después de transferir, sube la captura aquí
                </p>
              </div>
            </div>
            <div className="p-5">
              <ProofUploader order={{ id: sale_id, payment_proof_url: null }} />
            </div>
          </div>
        )}

        <Link
          to="/contact"
          className="flex items-center justify-center gap-2 w-full py-4 bg-white border
            border-slate-200 text-slate-900 rounded-2xl font-black text-sm
            hover:bg-slate-50 transition-all active:scale-[0.98] mb-3"
        >
          Contactar soporte
        </Link>

        {/* ── Acciones ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 py-3.5 bg-white border
              border-slate-200 text-slate-900 rounded-2xl font-bold text-sm
              hover:bg-slate-50 transition-all"
          >
            <Home size={15} /> Volver
          </Link>
          <Link
            to="/perfil?tab=orders"
            className="flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white
              rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all"
          >
            Mis pedidos <ChevronRight size={15} />
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400">
          Código del pedido: <strong className="text-slate-600">{order_code}</strong>
        </p>
      </div>
    </div>
  );
}
