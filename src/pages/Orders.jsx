import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Package, Calendar, DollarSign, ChevronRight, Loader2, 
  ShoppingBag, AlertCircle, CheckCircle, Clock, XCircle,
  Receipt, ArrowLeft, Eye, Ban
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
    // Verificar permiso antes de ver detalles
    if (!can('sale.my.read', user.id)) {
      console.error('No tienes permiso para ver este pedido');
      return;
    }

    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const { data } = await api.get(`/sales/${order.id}`);
      setOrderItems(data);
    } catch (error) {
      console.error("Error loading order items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('¿Estás seguro de cancelar este pedido? Se restaurará el stock de los productos.')) {
      return;
    }

    try {
      await api.post(`/sales/${orderId}/cancel`, { user_id: user.id });
      alert('Pedido cancelado exitosamente');
      closeModal();
      loadOrders(); // Recargar lista
      loadStats(); // Actualizar estadísticas
    } catch (error) {
      console.error("Error canceling order:", error);
      alert(error.response?.data?.message || 'Error al cancelar el pedido');
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setOrderItems([]);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        label: "Pendiente",
        icon: <Clock size={16} />,
        color: "text-amber-600 bg-amber-50 border-amber-200",
        dotColor: "bg-amber-500"
      },
      paid: {
        label: "Pagado",
        icon: <CheckCircle size={16} />,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        dotColor: "bg-emerald-500"
      },
      cancelled: {
        label: "Cancelado",
        icon: <XCircle size={16} />,
        color: "text-red-600 bg-red-50 border-red-200",
        dotColor: "bg-red-500"
      }
    };
    return statusMap[status] || statusMap.pending;
  };

  // Si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Package size={32} className="text-slate-300" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-8">
            Debes iniciar sesión para ver tus pedidos
          </p>
          <Link 
            to="/auth" 
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all"
          >
            Iniciar Sesión
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Si está cargando
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <Loader2 size={48} className="animate-spin text-slate-300 mb-4" />
          <p className="text-slate-400 font-medium">Cargando tus pedidos...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* HERO SECTION */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Volver a Inicio
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2">
                Mis Pedidos
              </h1>
              <p className="text-slate-500 font-medium">
                Hola, <span className="text-slate-900 font-bold">{user.name}</span> · Historial completo de compras
              </p>
            </div>

            {/* STATS CARDS */}
            {stats?.summary && (
              <div className="flex gap-4">
                <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Total Invertido
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    ${Number(stats.summary.total_invested || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Total Pedidos
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {stats.summary.total_orders || 0}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              Aún no tienes pedidos
            </h3>
            <p className="text-slate-500 mb-8">
              Explora nuestro catálogo y realiza tu primera compra
            </p>
            <Link 
              to="/productos" 
              className="inline-block bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.payment_status);
              return (
                <div
                  key={order.id}
                  onClick={() => viewOrderDetail(order)}
                  className="group bg-white rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-slate-100 hover:border-blue-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* LEFT SIDE */}
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                        <Package size={24} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-black text-slate-900">
                            Pedido #{order.order_code || order.id}
                          </h3>
                          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar size={14} />
                            <span className="font-medium">
                              {new Date(order.created_at).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          
                          <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">
                            {order.sale_type === 'online' ? '🌐 Compra Online' : '🏪 Tienda Física'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="flex items-center gap-4 md:ml-auto">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Total
                        </p>
                        <p className="text-2xl font-black text-slate-900">
                          ${Number(order.total).toLocaleString()}
                        </p>
                      </div>

                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>

                  {/* PAYMENT STATUS ALERT */}
                  {order.payment_status === 'pending' && (
                    <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-amber-900 mb-1">
                          Pago Pendiente
                        </p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Tu pedido está registrado pero aún no confirmamos tu pago. 
                          Por favor, contacta por WhatsApp para confirmar la transacción.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DETALLE DEL PEDIDO */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
            
            {/* HEADER */}
            <div className="bg-slate-50 p-8 border-b border-slate-100 sticky top-0 z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                    <Receipt size={28} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">
                      Pedido #{selectedOrder.order_code || selectedOrder.id}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      {new Date(selectedOrder.created_at).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={closeModal}
                  className="p-2 bg-white hover:bg-slate-200 rounded-full text-slate-500 transition-colors shadow-sm"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* STATUS BADGE */}
              {(() => {
                const statusInfo = getStatusInfo(selectedOrder.payment_status);
                return (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm ${statusInfo.color}`}>
                    {statusInfo.icon}
                    Estado: {statusInfo.label}
                  </div>
                );
              })()}
            </div>

            {/* ITEMS */}
            <div className="p-8">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-6">
                Productos en este pedido
              </h3>

              {loadingItems ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-slate-300" size={32} />
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {orderItems.map((item, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                      {item.main_image && (
                        <img 
                          src={item.main_image} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-sm text-slate-500 font-medium">
                          ${Number(item.unit_price).toLocaleString()} × {item.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900">
                          ${(item.unit_price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TOTAL */}
              <div className="bg-slate-900 text-white rounded-2xl p-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-wider opacity-70">
                    Total del Pedido
                  </span>
                  <span className="text-3xl font-black">
                    ${Number(selectedOrder.total).toLocaleString()}
                  </span>
                </div>

                {selectedOrder.payment_status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs opacity-70 leading-relaxed">
                      💬 Para confirmar tu pago, contacta por WhatsApp con el código de pedido
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <div className="flex gap-3">
                {/* Botón Cancelar (solo si está pending y tiene permiso) */}
                {selectedOrder.payment_status === 'pending' && can('sale.my.cancel', user.id) && (
                  <button
                    onClick={() => cancelOrder(selectedOrder.id)}
                    className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Ban size={18} />
                    Cancelar Pedido
                  </button>
                )}
                
                <button
                  onClick={closeModal}
                  className={`${selectedOrder.payment_status === 'pending' ? 'flex-1' : 'w-full'} bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all`}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
