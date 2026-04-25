// src/pages/ProfilePage.jsx
import { useState, useEffect, useCallback, Suspense, lazy } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { ReactLenis } from "lenis/react";

// Lazy-load ProofUploader solo cuando se necesita
const ProofUploader = lazy(() => import("../components/ProofUploader"));

// ── Animaciones reutilizables ────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "info",     label: "Mi perfil",   icon: User    },
  { id: "orders",   label: "Mis pedidos", icon: Package },
  { id: "security", label: "Seguridad",   icon: Shield  },
];

// ── Optimización de imágenes (Cloudinary) ────────────────────────────────────
const optimizeImage = (url, width = 400) => {
  if (!url) return null;
  if (url.includes("/upload/"))
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_scale/`);
  return url;
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton de carga
// ─────────────────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] rounded-xl ${className}`}
      style={{ animation: "shimmer 1.4s infinite", backgroundSize: "200% 100%" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:   { label: "Pendiente",  icon: <Clock size={10} />,       cls: "text-amber-600 bg-amber-50 border-amber-200"      },
    paid:      { label: "Pagado",     icon: <CheckCircle size={10} />, cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    cancelled: { label: "Cancelado",  icon: <XCircle size={10} />,     cls: "text-red-500 bg-red-50 border-red-200"             },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusTimeline
// ─────────────────────────────────────────────────────────────────────────────
function StatusTimeline({ order }) {
  const isCancelled = order.payment_status === "cancelled";
  const isPaid      = order.payment_status === "paid";
  const hasProof    = !!order.payment_proof_url;
  const isOnline    = order.sale_type === "online" || order.sale_type === "web";

  if (isCancelled) return (
    <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-400 mt-1.5">
      <XCircle size={10} /> Pedido cancelado
    </div>
  );

  const steps = isOnline
    ? [
        { label: "Recibido",    done: true },
        { label: "Comprobante", done: hasProof },
        { label: "Verificando", done: hasProof && !isPaid },
        { label: "Confirmado",  done: isPaid },
      ]
    : [
        { label: "Recibido",   done: true },
        { label: "Confirmado", done: isPaid },
      ];

  const currentStep = steps.filter(s => s.done).length;

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100">
      <div className="flex items-center">
        {steps.map((step, i) => {
          const isActive  = i < currentStep;
          const isCurrent = i === currentStep - 1;
          const isLast    = i === steps.length - 1;
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all
                  ${isActive
                    ? isCurrent && !isPaid
                      ? "bg-amber-400 border-amber-400"
                      : "bg-emerald-500 border-emerald-500"
                    : "bg-white border-slate-200"
                  }`}
                >
                  {isActive
                    ? <CheckCircle size={8} className="text-white" />
                    : <div className="w-1 h-1 rounded-full bg-slate-300" />
                  }
                </div>
                <p className={`text-[7px] font-bold text-center leading-tight max-w-[40px] tracking-wide
                  ${isActive ? "text-slate-500" : "text-slate-300"}`}>
                  {step.label}
                </p>
              </div>
              {!isLast && (
                <div className={`flex-1 h-[1.5px] mx-0.5 mb-3.5 rounded-full transition-all
                  ${i < currentStep - 1 ? "bg-emerald-400" : "bg-slate-100"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderMiniCard
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
    <motion.div
      layout
      variants={scaleIn}
      className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden hover:border-slate-200 hover:shadow-md transition-all duration-300"
    >
      {/* Cabecera */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={toggleExpand}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
          ${isPaid ? "bg-emerald-50" : isCancelled ? "bg-red-50" : "bg-amber-50"}`}
        >
          <Package
            size={16}
            className={isPaid ? "text-emerald-500" : isCancelled ? "text-red-400" : "text-amber-500"}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-black text-slate-900 text-sm tracking-tight">
              {order.order_code || `#${order.id}`}
            </span>
            <StatusBadge status={order.payment_status} />
            {isPending && order.payment_proof_url && (
              <span className="inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <Upload size={7} /> Enviado
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Calendar size={9} />
            {new Date(order.created_at).toLocaleDateString("es-CO", {
              year: "numeric", month: "short", day: "numeric",
            })}
          </p>
          <StatusTimeline order={order} />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-black text-slate-900 text-sm tracking-tight">
            ${Number(order.total).toLocaleString()}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronRight size={13} className="text-slate-300" />
          </motion.div>
        </div>
      </button>

      {/* Detalle expandido con AnimatePresence */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 pb-4 pt-1">
              {loading ? (
                <div className="space-y-2 mt-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-14" />)}
                </div>
              ) : (
                <div className="space-y-2 mt-3 mb-3">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                      {item.main_image && (
                        <img
                          src={optimizeImage(item.main_image, 120)}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400">
                          ${Number(item.unit_price).toLocaleString()} × {item.quantity}
                        </p>
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
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</span>
                <span className="font-black text-slate-900">${Number(order.total).toLocaleString()}</span>
              </div>

              {/* Dirección */}
              {order.shipping_address && (
                <div className="bg-slate-50 rounded-xl px-3 py-2.5 mb-3 border border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Envío a</p>
                  <p className="font-bold text-slate-900 text-xs">{order.shipping_city}</p>
                  <p className="text-xs text-slate-500">{order.shipping_address}</p>
                </div>
              )}

              {/* Comprobante lazy */}
              {isPending && isOnline && (
                <div className="mb-3">
                  <Suspense fallback={<Skeleton className="h-16" />}>
                    <ProofUploader order={order} onUploaded={onRefresh} compact />
                  </Suspense>
                </div>
              )}

              {/* Cancelar */}
              {isPending && (
                <button
                  onClick={cancelOrder}
                  className="flex items-center gap-2 text-red-500 hover:text-red-700 text-xs font-bold
                    px-3 py-2 bg-red-50 hover:bg-red-100 rounded-xl w-full justify-center transition-all"
                >
                  <Ban size={11} /> Cancelar pedido
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
    setForm({
      name: user?.name || "", phone: user?.phone || "",
      city: user?.city || "", address: user?.address || "",
    });
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
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Datos fijos */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Cuenta</h3>
        <div className="space-y-3">
          {[
            { icon: <Mail size={13} className="text-blue-500" />, bg: "bg-blue-50", label: "Email",  value: user?.email },
            { icon: <CreditCard size={13} className="text-slate-500" />, bg: "bg-slate-100", label: "Cédula", value: user?.cedula || "—" },
          ].map(({ icon, bg, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {icon}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Datos editables */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Información personal</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Edit3 size={12} /> Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={12} /> Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 text-[11px] font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95"
              >
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                Guardar
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-4"
            >
              <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
              <p className="text-xs font-bold text-emerald-700">Perfil actualizado correctamente</p>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4"
            >
              <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
              <p className="text-xs font-bold text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3.5">
          {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
            <div key={key}>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                {label}
              </label>
              <AnimatePresence mode="wait" initial={false}>
                {editing ? (
                  <motion.input
                    key="input"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    name={key}
                    type={type}
                    value={form[key]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium
                      text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2
                      focus:ring-slate-900/10 focus:border-slate-300 transition-all"
                  />
                ) : (
                  <motion.div
                    key="display"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <Icon size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700">
                      {user?.[key] || <span className="text-slate-300 italic text-xs">Sin registrar</span>}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
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
    <div className="space-y-4">
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
      {/* Orders skeleton */}
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
      {/* Stats */}
      {stats?.summary && (
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          {[
            { label: "Pedidos",    value: stats.summary.total_orders || 0,                                   amber: false },
            { label: "Invertido",  value: `$${Number(stats.summary.total_invested || 0).toLocaleString()}`,  amber: false },
            { label: "Pendientes", value: stats.summary.pending_orders || 0,                                 amber: Number(stats.summary.pending_orders) > 0 },
          ].map(({ label, value, amber }) => (
            <div
              key={label}
              className={`rounded-2xl border p-3.5 text-center transition-all
                ${amber ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100"}`}
            >
              <p className={`text-[8px] font-black uppercase tracking-widest mb-1
                ${amber ? "text-amber-500" : "text-slate-400"}`}>
                {label}
              </p>
              <p className={`text-xl font-black tracking-tight
                ${amber ? "text-amber-700" : "text-slate-900"}`}>
                {value}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Lista */}
      {orders.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-14 text-center"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={22} className="text-slate-400" />
          </div>
          <h3 className="text-base font-black text-slate-900 mb-1 tracking-tight">Sin pedidos aún</h3>
          <p className="text-slate-400 text-xs mb-6 font-medium">Explora nuestra colección y haz tu primer pedido</p>
          <Link
            to="/productos"
            className="inline-block bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
          >
            Ver productos
          </Link>
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="space-y-3">
          {orders.map(order => (
            <OrderMiniCard key={order.id} order={order} onRefresh={loadData} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Seguridad
// ─────────────────────────────────────────────────────────────────────────────
function SecurityTab() {
  const [form, setForm]     = useState({ current: "", next: "", confirm: "" });
  const [show, setShow]     = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]   = useState("");

  const toggle = (key) => setShow(p => ({ ...p, [key]: !p[key] }));

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
    setSuccess(false);
  };

  const validate = () => {
    if (!form.current.trim())     return "Ingresa tu contraseña actual";
    if (form.next.length < 8)      return "Mínimo 8 caracteres";
    if (!/[A-Z]/.test(form.next)) return "Incluye al menos una mayúscula";
    if (!/[0-9]/.test(form.next)) return "Incluye al menos un número";
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

  const strength = [
    form.next.length >= 8,
    /[A-Z]/.test(form.next),
    /[0-9]/.test(form.next),
    form.next.length >= 12,
  ];
  const strengthLabel = [
    form.next.length < 8 && "Muy corta",
    form.next.length >= 8  && !/[A-Z]/.test(form.next) && "Agrega una mayúscula",
    form.next.length >= 8  && /[A-Z]/.test(form.next) && !/[0-9]/.test(form.next) && "Agrega un número",
    form.next.length >= 8  && /[A-Z]/.test(form.next) && /[0-9]/.test(form.next) && form.next.length < 12 && "Buena",
    form.next.length >= 12 && /[A-Z]/.test(form.next) && /[0-9]/.test(form.next) && "Excelente",
  ].find(Boolean);

  const fields = [
    { key: "current", label: "Contraseña actual",   placeholder: "••••••••" },
    { key: "next",    label: "Nueva contraseña",     placeholder: "Mín. 8 caracteres" },
    { key: "confirm", label: "Confirmar contraseña", placeholder: "Repite la nueva contraseña" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
      {/* Info */}
      <motion.div
        variants={fadeUp}
        className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3"
      >
        <Shield size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Usa al menos 8 caracteres, una mayúscula y un número. No la compartas con nadie.
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cambiar contraseña</h3>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2"
            >
              <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
              <p className="text-xs font-bold text-emerald-700">Contraseña actualizada</p>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2"
            >
              <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
              <p className="text-xs font-bold text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
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
                  focus:ring-slate-900/10 focus:border-slate-300 transition-all"
              />
              <button
                type="button"
                onClick={() => toggle(key)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {show[key] ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}

        {/* Barra de fortaleza */}
        <AnimatePresence>
          {form.next && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5"
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fortaleza</p>
              <div className="flex gap-1">
                {strength.map((ok, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className={`h-1 flex-1 rounded-full origin-left transition-colors duration-500
                      ${ok ? (i < 2 ? "bg-amber-400" : "bg-emerald-500") : "bg-slate-100"}`}
                  />
                ))}
              </div>
              {strengthLabel && (
                <p className="text-[10px] text-slate-400 font-medium">{strengthLabel}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm
            flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:shadow-lg hover:shadow-slate-900/10"
        >
          {saving
            ? <><Loader2 size={14} className="animate-spin" /> Guardando…</>
            : <><Shield size={14} /> Actualizar contraseña</>
          }
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [activeTab, setActiveTab]             = useState("info");

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
          <User size={24} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Acceso restringido</h2>
        <p className="text-slate-400 text-sm text-center mb-7 font-medium max-w-xs">
          Inicia sesión para ver tu perfil y hacer seguimiento a tus pedidos
        </p>
        <Link
          to="/auth"
          className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold text-sm
            hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 hover:shadow-lg"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: true }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      <div className="min-h-screen bg-[#F8FAFC]">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 pt-6 pb-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-900 mb-5 transition-colors"
            >
              <ArrowLeft size={13} /> Volver
            </Link>

            {/* Avatar + nombre */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 shadow-lg shadow-slate-900/10">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">{user.name}</h1>
                <p className="text-xs text-slate-400 font-medium">{user.email}</p>
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-0">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all
                    ${activeTab === id ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <Icon size={13} />
                  <span className="hidden sm:block">{label}</span>
                  {activeTab === id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Contenido ──────────────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === "info"     && <InfoTab     user={user} onUpdate={(data) => updateUser?.(data)} />}
              {activeTab === "orders"   && <OrdersTab   userId={user.id} />}
              {activeTab === "security" && <SecurityTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </ReactLenis>
  );
}