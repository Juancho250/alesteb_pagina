// src/pages/OrderSuccessPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle, Copy, Check, MessageCircle,
  Package, MapPin, Home, ChevronRight, Upload
} from "lucide-react";
import ProofUploader from "../components/ProofUploader";
import { BANK_INFO } from "./Checkoutpage";

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const state     = location.state || {};

  const {
    sale_id,
    order_code,
    total,
    payment_method,
    shipping_address,
    shipping_city,
  } = state;

  const [copiedIdx, setCopiedIdx] = useState(null);

  // ── Si no hay datos de orden, redirigir ─────────────────────────────────
  useEffect(() => {
    if (!order_code) {
      const t = setTimeout(() => navigate("/"), 2000);
      return () => clearTimeout(t);
    }
  }, [order_code, navigate]);

  if (!order_code) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 font-medium">Redirigiendo…</p>
      </div>
    );
  }

  const copyToClipboard = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      // fallback para iOS Safari
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  const isTransfer = payment_method === "transfer";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <div className="max-w-lg mx-auto px-4 pt-12">

        {/* ── Animación de éxito ─────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500 mb-5 shadow-xl shadow-emerald-200 animate-bounce">
            <CheckCircle size={40} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
            ¡Pedido confirmado!
          </h1>
          <p className="text-slate-500 font-medium mb-4">
            Revisamos y procesamos tu pedido muy pronto
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full shadow-lg">
            <Package size={15} />
            <span className="font-black text-sm tracking-wide">{order_code}</span>
          </div>
        </div>

        {/* ── Resumen ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
          {/* Total */}
          <div className="bg-slate-900 text-white px-6 py-5 text-center">
            <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">Total del pedido</p>
            <p className="text-4xl font-black">${Number(total).toLocaleString()}</p>
          </div>

          {/* Dirección */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin size={14} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-0.5">Dirección de envío</p>
              <p className="font-bold text-slate-900">{shipping_city}</p>
              <p className="text-sm text-slate-500">{shipping_address}</p>
            </div>
          </div>

          {/* Próximos pasos */}
          <div className="px-6 py-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">¿Qué sigue?</p>
            <ol className="space-y-3">
              {[
                "Revisa tu correo con el resumen del pedido",
                isTransfer
                  ? "Realiza la transferencia usando los datos de abajo"
                  : "Coordinaremos el pago en efectivo al entregar",
                "Sube tu comprobante para agilizar el proceso",
                "Recibe tu pedido en la dirección indicada",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-600 font-medium leading-snug pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Datos bancarios (solo si eligió transferencia) ─────────── */}
        {isTransfer && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
            <div className="px-6 py-4 border-b border-slate-100">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Datos para transferencia
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {BANK_INFO.map((bank, idx) => (
                <div key={idx} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{bank.emoji}</span>
                    <p className="font-black text-slate-900">{bank.bank}</p>
                    <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full ml-auto">
                      {bank.type}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: "Número de cuenta / celular", value: bank.number },
                      { label: "Titular", value: bank.name },
                      ...(bank.nit ? [{ label: "NIT", value: bank.nit }] : []),
                    ].map((row, rowIdx) => {
                      const copyKey = `${idx}-${rowIdx}`;
                      return (
                        <div
                          key={rowIdx}
                          className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {row.label}
                            </p>
                            <p className="text-sm font-bold text-slate-900 truncate">{row.value}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(row.value, copyKey)}
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                              ${copiedIdx === copyKey
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                              }`}
                            title="Copiar"
                          >
                            {copiedIdx === copyKey ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-700 font-medium text-center">
                ⚠️ Incluye el código <strong>{order_code}</strong> en la descripción de la transferencia
              </p>
            </div>
          </div>
        )}

        {/* ── Subir comprobante aquí mismo ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Upload size={14} className="text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Sube tu comprobante</p>
              <p className="text-xs text-slate-400">
                {isTransfer
                  ? "Después de transferir, sube la captura aquí"
                  : "Si ya tienes un comprobante, súbelo aquí"
                }
              </p>
            </div>
          </div>
          <div className="p-5">
            {/* Pasamos un objeto minimal con id y sin proof_url para que muestre el uploader */}
            <ProofUploader
              order={{ id: sale_id, payment_proof_url: null }}
            />
          </div>
        </div>

        {/* ── WhatsApp (alternativa, no forzado) ─────────────────────── */}
        <a
          href={`https://wa.me/573145055073?text=${encodeURIComponent(
            `Hola! Confirmo mi pedido ${order_code} por $${Number(total).toLocaleString()}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition-all active:scale-[0.98] mb-3"
        >
          <MessageCircle size={18} />
          Contactar por WhatsApp
        </a>

        {/* ── Acciones ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200
              text-slate-900 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all"
          >
            <Home size={15} /> Volver
          </Link>
          <Link
            to="/mis-pedidos"
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