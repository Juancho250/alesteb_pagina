// src/pages/ProfilePage.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  User, MapPin, Package, Edit3, Save, X,
  Phone, Mail, CreditCard, Building2, ArrowLeft,
  CheckCircle, AlertCircle, Loader2, ChevronRight,
  ChevronUp, Calendar, Clock, XCircle, Ban,
  Upload, Shield, Eye, EyeOff
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import ProofUploader from "../components/ProofUploader";

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "info",     label: "Mi perfil",   icon: User    },
  { id: "orders",   label: "Mis pedidos", icon: Package },
  { id: "security", label: "Seguridad",   icon: Shield  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    pending:   { label: "Pendiente",  icon: <Clock size={11} />,       cls: "text-amber-600 bg-amber-50 border-amber-200"      },
    paid:      { label: "Pagado",     icon: <CheckCircle size={11} />, cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    cancelled: { label: "Cancelado",  icon: <XCircle size={11} />,     cls: "text-red-500 bg-red-50 border-red-200"             },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

function StatusTimeline({ order }) {
  const isCancelled = order.payment_status === "cancelled";
  const isPaid      = order.payment_status === "paid";
  const hasProof    = !!order.payment_proof_url;
  const isOnline    = order.sale_type === "online" || order.sale_type === "web";

  if (isCancelled) return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-50 rounded-lg px-2 py-1 mt-2">
      <XCircle size={11} /> Cancelado
    </div>
  );

  const steps = isOnline
    ? [
        { label: "Recibido",      done: true },
        { label: "Comprobante",   done: hasProof },
        { label: "Verificando",   done: hasProof && !isPaid },
        { label: "Confirmado",    done: isPaid },
      ]
    : [
        { label: "Recibido",   done: true },
        { label: "Confirmado", done: isPaid },
      ];

  const currentStep = steps.filter(s => s.done).length;

  return (
    <div className="mt-2 pt-2 border-t border-slate-100">
      <div className="flex items-center">
        {steps.map((step, i) => {
          const isActive  = i < currentStep;
          const isCurrent = i === currentStep - 1;
          const isLast    = i === steps.length - 1;
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-0.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 flex-shrink-0
                  ${isActive
                    ? isCurrent && !isPaid ? "bg-amber-400 border-amber-400" : "bg-emerald-500 border-emerald-500"
                    : "bg-white border-slate-200"
                  }`}
                >
                  {isActive
                    ? <CheckCircle size={10} className="text-white" />
                    : <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  }
                </div>
                <p className={`text-[8px] font-bold text-center leading-tight max-w-[44px] ${isActive ? "text-slate-600" : "text-slate-300"}`}>
                  {step.label}
                </p>
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-0.5 mb-3 rounded-full ${i < currentStep - 1 ? "bg-emerald-400" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini card de pedido
// ─────────────────────────────────────────────────────────────────────────────
function OrderMiniCard({ order, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const { user }                = useAuth();

  const isPending   = order.payment_status === "pending";
  const isPaid      = order.payment_status === "paid";
  const isCancelled = order.payment_status === "cancelled";
  const isOnline    = order.sale_type === "online" || order.sale_type === "web";

  const toggleExpand = async () => {
    if (!expanded && items.length === 0) {
      setLoading(true);
      try {
        const { data } = await api.get(`/sales/${order.id}`);
        setItems(Array.isArray(data) ? data : data?.items || []);
      } catch {}
      finally { setLoading(false); }
    }
    setExpanded(e => !e);
  };

  const cancelOrder = async () => {
    if (!window.confirm("¿Cancelar este pedido?")) return;
    try {
      await api.post(`/sales/${order.id}/cancel`, { user_id: user.id });
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Error al cancelar");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
      {/* Cabecera */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={toggleExpand}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
          ${isPaid ? "bg-emerald-50" : isCancelled ? "bg-red-50" : "bg-amber-50"}`}
        >
          <Package size={18} className={isPaid ? "text-emerald-500" : isCancelled ? "text-red-400" : "text-amber-500"} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-black text-slate-900 text-sm">{order.order_code || `#${order.id}`}</span>
            <StatusBadge status={order.payment_status} />
            {isPending && order.payment_proof_url && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                <Upload size={8} /> Enviado
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Calendar size={10} />
            {new Date(order.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })}
          </p>
          <StatusTimeline order={order} />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-black text-slate-900 text-sm">${Number(order.total).toLocaleString()}</span>
          {expanded ? <ChevronUp size={14} className="text-slate-300" /> : <ChevronRight size={14} className="text-slate-300" />}
        </div>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="space-y-2 mt-3 mb-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  {item.main_image && (
                    <img src={item.main_image} alt={item.name}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-xs truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">${Number(item.unit_price).toLocaleString()} × {item.quantity}</p>
                  </div>
                  <p className="font-black text-slate-900 text-xs flex-shrink-0">
                    ${(item.unit_price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center py-2.5 border-t border-b border-slate-100 mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total</span>
            <span className="font-black text-slate-900">${Number(order.total).toLocaleString()}</span>
          </div>

          {/* Dirección */}
          {order.shipping_address && (
            <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Envío a</p>
              <p className="font-bold text-slate-900 text-xs">{order.shipping_city}</p>
              <p className="text-xs text-slate-500">{order.shipping_address}</p>
            </div>
          )}

          {/* Comprobante */}
          {isPending && isOnline && (
            <div className="mb-3">
              <ProofUploader order={order} onUploaded={onRefresh} compact />
            </div>
          )}

          {/* Cancelar */}
          {isPending && (
            <button
              onClick={cancelOrder}
              className="flex items-center gap-2 text-red-500 hover:text-red-700 text-xs font-bold
                px-3 py-2 bg-red-50 hover:bg-red-100 rounded-xl w-full justify-center transition-colors"
            >
              <Ban size={12} /> Cancelar pedido
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Información personal
// ─────────────────────────────────────────────────────────────────────────────
function InfoTab({ user, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm]       = useState({
    name:    user?.name    || "",
    phone:   user?.phone   || "",
    city:    user?.city    || "",
    address: user?.address || "",
  });

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("El nombre es requerido"); return; }
    setSaving(true);
    setError("");
    try {
      const { data } = await api.put("/auth/profile", form);
      if (data.success) {
        onUpdate(data.data);
        setEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: user?.name || "", phone: user?.phone || "", city: user?.city || "", address: user?.address || "" });
    setEditing(false);
    setError("");
  };

  const fields = [
    { key: "name",    label: "Nombre completo", icon: User,      type: "text", placeholder: "Tu nombre"              },
    { key: "phone",   label: "Teléfono",         icon: Phone,     type: "tel",  placeholder: "Ej: 3001234567"         },
    { key: "city",    label: "Ciudad",            icon: Building2, type: "text", placeholder: "Ej: Medellín"           },
    { key: "address", label: "Dirección",         icon: MapPin,    type: "text", placeholder: "Calle, número, barrio…" },
  ];

  return (
    <div className="space-y-4">
      {/* Datos fijos */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Cuenta</h3>
        <div className="space-y-3">
          {[
            { icon: <Mail size={14} className="text-blue-600" />, bg: "bg-blue-50", label: "Email",  value: user?.email },
            { icon: <CreditCard size={14} className="text-slate-500" />, bg: "bg-slate-50", label: "Cédula", value: user?.cedula || "—" },
          ].map(({ icon, bg, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>{icon}</div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                <p className="text-sm font-bold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Datos editables */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Información personal</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Edit3 size={13} /> Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={handleCancel} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                <X size={13} /> Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Guardar
              </button>
            </div>
          )}
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-4">
            <CheckCircle size={14} className="text-emerald-600" />
            <p className="text-xs font-bold text-emerald-700">Perfil actualizado correctamente</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">
            <AlertCircle size={14} className="text-red-500" />
            <p className="text-xs font-bold text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
            <div key={key}>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                {label}
              </label>
              {editing ? (
                <input
                  name={key}
                  type={type}
                  value={form[key]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium
                    text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2
                    focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                />
              ) : (
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Icon size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">
                    {user?.[key] || <span className="text-slate-300 italic">Sin registrar</span>}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Mis pedidos
// ─────────────────────────────────────────────────────────────────────────────
function OrdersTab({ userId }) {
  const [orders, setOrders]   = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get(`/sales/user/history?userId=${userId}`),
        api.get(`/sales/user/stats?userId=${userId}`),
      ]);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 size={28} className="animate-spin text-slate-300" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats?.summary && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Pedidos",    value: stats.summary.total_orders || 0,                                  amber: false },
            { label: "Invertido",  value: `$${Number(stats.summary.total_invested || 0).toLocaleString()}`, amber: false },
            { label: "Pendientes", value: stats.summary.pending_orders || 0,                                amber: Number(stats.summary.pending_orders) > 0 },
          ].map(({ label, value, amber }) => (
            <div
              key={label}
              className={`rounded-2xl border p-3 text-center ${amber ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100"}`}
            >
              <p className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${amber ? "text-amber-500" : "text-slate-400"}`}>
                {label}
              </p>
              <p className={`text-lg font-black ${amber ? "text-amber-700" : "text-slate-900"}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center">
          <Package size={28} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-900 mb-1">Aún no tienes pedidos</h3>
          <p className="text-slate-400 text-xs mb-5">Explora nuestra colección y haz tu primer pedido</p>
          <Link
            to="/productos"
            className="inline-block bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <OrderMiniCard key={order.id} order={order} onRefresh={loadData} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Seguridad (cambiar contraseña)
// ─────────────────────────────────────────────────────────────────────────────
function SecurityTab() {
  const [form, setForm]       = useState({ current: "", next: "", confirm: "" });
  const [show, setShow]       = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  const toggle = (key) => setShow(p => ({ ...p, [key]: !p[key] }));

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
    setSuccess(false);
  };

  const validate = () => {
    if (!form.current.trim()) return "Ingresa tu contraseña actual";
    if (form.next.length < 8)  return "La nueva contraseña debe tener al menos 8 caracteres";
    if (!/[A-Z]/.test(form.next)) return "Debe incluir al menos una mayúscula";
    if (!/[0-9]/.test(form.next)) return "Debe incluir al menos un número";
    if (form.next !== form.confirm) return "Las contraseñas no coinciden";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setError("");
    try {
      await api.put("/auth/change-password", {
        current_password: form.current,
        new_password:     form.next,
      });
      setSuccess(true);
      setForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Error al cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "current", label: "Contraseña actual",   placeholder: "••••••••" },
    { key: "next",    label: "Nueva contraseña",     placeholder: "Mín. 8 caracteres" },
    { key: "confirm", label: "Confirmar contraseña", placeholder: "Repite la nueva contraseña" },
  ];

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Shield size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 font-medium leading-relaxed">
          Tu contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula y un número.
          Nunca la compartas con nadie.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Cambiar contraseña</h3>

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <CheckCircle size={14} className="text-emerald-600" />
            <p className="text-xs font-bold text-emerald-700">Contraseña actualizada correctamente</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <AlertCircle size={14} className="text-red-500" />
            <p className="text-xs font-bold text-red-600">{error}</p>
          </div>
        )}

        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              {label}
            </label>
            <div className="relative">
              <input
                name={key}
                type={show[key] ? "text" : "password"}
                value={form[key]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium
                  text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2
                  focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              />
              <button
                type="button"
                onClick={() => toggle(key)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {show[key] ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        ))}

        {/* Indicador de fortaleza */}
        {form.next && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fortaleza</p>
            <div className="flex gap-1">
              {[
                form.next.length >= 8,
                /[A-Z]/.test(form.next),
                /[0-9]/.test(form.next),
                form.next.length >= 12,
              ].map((ok, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    ok
                      ? i < 2 ? "bg-amber-400" : "bg-emerald-500"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              {[
                !form.next.length && "",
                form.next.length < 8 && "Muy corta",
                form.next.length >= 8 && !/[A-Z]/.test(form.next) && "Agrega una mayúscula",
                form.next.length >= 8 && /[A-Z]/.test(form.next) && !/[0-9]/.test(form.next) && "Agrega un número",
                form.next.length >= 8 && /[A-Z]/.test(form.next) && /[0-9]/.test(form.next) && form.next.length < 12 && "Buena",
                form.next.length >= 12 && /[A-Z]/.test(form.next) && /[0-9]/.test(form.next) && "Excelente",
              ].find(Boolean)}
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl font-bold text-sm
            flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {saving ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : <><Shield size={15} /> Actualizar contraseña</>}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("info");

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <User size={32} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Acceso restringido</h2>
        <p className="text-slate-500 text-center mb-6">Inicia sesión para ver tu perfil</p>
        <Link to="/auth" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-sm">
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> Volver
          </Link>

          {/* Avatar + nombre */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{user.name}</h1>
              <p className="text-sm text-slate-400 font-medium">{user.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all
                  ${activeTab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Icon size={14} />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === "info"     && <InfoTab     user={user} onUpdate={(data) => updateUser?.(data)} />}
        {activeTab === "orders"   && <OrdersTab   userId={user.id} />}
        {activeTab === "security" && <SecurityTab />}
      </div>
    </div>
  );
}