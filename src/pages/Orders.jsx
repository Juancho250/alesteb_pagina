// src/pages/Orders.jsx — con flujo de comprobante de pago
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package, Calendar, ChevronRight, Loader2,
  ShoppingBag, AlertCircle, CheckCircle, Clock, XCircle,
  Receipt, ArrowLeft, Ban, Upload, Image, CheckCircle2,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ── Upload comprobante inline ── */
function ProofUploader({ order, onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(!!order.payment_proof_url);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("proof", file);
      await api.post(`/sales/${order.id}/upload-proof`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDone(true);
      setPreview(null);
      if (onUploaded) onUploaded();
    } catch (err) {
      alert(err.response?.data?.message || "Error al subir el comprobante");
    } finally {
      setUploading(false);
    }
  };

  // Ya subió comprobante
  if (done || order.payment_proof_url) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-800">Comprobante enviado</p>
          <p className="text-xs text-emerald-600 mt-0.5">El equipo verificará tu pago pronto</p>
        </div>
        {order.payment_proof_url && (
          <a
            href={order.payment_proof_url}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-600 hover:text-emerald-800 flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3" onClick={e => e.stopPropagation()}>
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-900">Pago pendiente</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            Realiza tu transferencia y sube el comprobante para que confirmemos tu pedido.
          </p>
        </div>
      </div>

      {/* Zona de upload */}
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
          preview ? "border-transparent p-0 overflow-hidden" : "border-gray-200 hover:border-blue-400 bg-gray-50 p-4"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
        {preview ? (
          <div className="relative">
            <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-xl" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <p className="text-white text-sm font-semibold">Cambiar imagen</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-gray-400">
            <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
              <Image size={18} />
            </div>
            <p className="text-sm font-medium text-gray-600">Subir comprobante</p>
            <p className="text-xs text-gray-400">JPG, PNG o PDF · máx 8MB</p>
          </div>
        )}
      </div>

      {file && (
        <button
          onClick={upload}
          disabled={uploading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? "Subiendo..." : "Enviar comprobante"}
        </button>
      )}
    </div>
  );
}

export default function Orders() {
  const { user, isAuthenticated, can } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await api.get(`/sales/user/history?userId=${user.id}`);
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await api.get(`/sales/user/stats?userId=${user.id}`);
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrders();
      loadStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, loadOrders, loadStats]);

  const viewOrderDetail = async (order) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const { data } = await api.get(`/sales/${order.id}`);
      setOrderItems(Array.isArray(data) ? data : data?.items || []);
    } catch (error) {
      console.error("Error loading order items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("¿Cancelar este pedido? Se restaurará el stock.")) return;
    try {
      await api.post(`/sales/${orderId}/cancel`, { user_id: user.id });
      closeModal();
      loadOrders();
      loadStats();
    } catch (error) {
      alert(error.response?.data?.message || "Error al cancelar");
    }
  };

  const closeModal = () => { setSelectedOrder(null); setOrderItems([]); };

  const getStatusInfo = (status) => ({
    pending:   { label: "Pendiente",  icon: <Clock size={14} />,       cls: "text-amber-600 bg-amber-50 border-amber-200"   },
    paid:      { label: "Pagado",     icon: <CheckCircle size={14} />, cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    cancelled: { label: "Cancelado",  icon: <XCircle size={14} />,     cls: "text-red-600 bg-red-50 border-red-200"         },
  }[status] || { label: "Pendiente", icon: <Clock size={14} />, cls: "text-amber-600 bg-amber-50 border-amber-200" });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <Package size={32} className="text-slate-300 mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Acceso Restringido</h2>
          <p className="text-slate-500 text-center mb-8">Debes iniciar sesión para ver tus pedidos</p>
          <Link to="/auth" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm">
            Iniciar Sesión
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 mb-6">
            <ArrowLeft size={15} /> Volver
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">Mis Pedidos</h1>
              <p className="text-slate-500 mt-1">Hola, <span className="font-bold text-slate-900">{user.name}</span></p>
            </div>
            {stats?.summary && (
              <div className="flex gap-3">
                <div className="bg-slate-50 px-5 py-3.5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Invertido</p>
                  <p className="text-xl font-black text-slate-900">${Number(stats.summary.total_invested || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 px-5 py-3.5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Pedidos</p>
                  <p className="text-xl font-black text-slate-900">{stats.summary.total_orders || 0}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center">
            <ShoppingBag size={32} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-900 mb-2">Sin pedidos aún</h3>
            <Link to="/productos" className="inline-block bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm mt-4">
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const si = getStatusInfo(order.payment_status);
              const isPending = order.payment_status === "pending";
              const isOnline = order.sale_type === "online" || order.sale_type === "web";
              const hasProof = !!order.payment_proof_url;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Fila principal */}
                  <div
                    className="flex items-center gap-4 p-5 cursor-pointer"
                    onClick={() => viewOrderDetail(order)}
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Package size={20} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-black text-slate-900">
                          {order.order_code || `#${order.id}`}
                        </h3>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${si.cls}`}>
                          {si.icon}{si.label}
                        </span>
                        {isPending && hasProof && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            <CheckCircle2 size={10} /> Comprobante enviado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(order.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
                        <span className="text-slate-300">·</span>
                        <span className="text-xs uppercase tracking-wide">{isOnline ? "🌐 Online" : "🏪 Tienda"}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-xl font-black text-slate-900">${Number(order.total).toLocaleString()}</p>
                      <ChevronRight size={18} className="text-slate-300" />
                    </div>
                  </div>

                  {/* Bloque de comprobante — solo pedidos online pendientes */}
                  {isPending && isOnline && (
                    <div className="px-5 pb-5">
                      <ProofUploader order={order} onUploaded={loadOrders} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Header modal */}
            <div className="bg-slate-50 px-7 py-6 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                  <Receipt size={22} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {selectedOrder.order_code || `Pedido #${selectedOrder.id}`}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {new Date(selectedOrder.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 bg-white hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <XCircle size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-7 py-5">
              {loadingItems ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
              ) : (
                <div className="space-y-3 mb-5">
                  {orderItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                      {item.main_image && (
                        <img src={item.main_image} alt={item.name} className="w-14 h-14 object-cover rounded-lg border border-slate-200 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-sm text-slate-500">${Number(item.unit_price).toLocaleString()} × {item.quantity}</p>
                      </div>
                      <p className="font-black text-slate-900 flex-shrink-0">
                        ${(item.unit_price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="bg-slate-900 text-white rounded-2xl px-5 py-4 flex justify-between items-center mb-5">
                <span className="text-sm font-bold opacity-70 uppercase tracking-wider">Total</span>
                <span className="text-2xl font-black">${Number(selectedOrder.total).toLocaleString()}</span>
              </div>

              {/* Comprobante dentro del modal también */}
              {selectedOrder.payment_status === "pending" &&
                (selectedOrder.sale_type === "online" || selectedOrder.sale_type === "web") && (
                <ProofUploader
                  order={selectedOrder}
                  onUploaded={() => { loadOrders(); closeModal(); }}
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 flex-shrink-0">
              {selectedOrder.payment_status === "pending" && (
                <button
                  onClick={() => cancelOrder(selectedOrder.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Ban size={15} /> Cancelar pedido
                </button>
              )}
              <button
                onClick={closeModal}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl font-bold text-sm transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}