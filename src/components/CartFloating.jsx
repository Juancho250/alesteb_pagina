import { MessageCircle, X, Plus, Minus, ShoppingBag, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function CartFloating({ cart, onRemove, onUpdateQty, onClearCart }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const { total, message, count } = useMemo(() => {
    let currentTotal = 0;
    let itemsCount = 0;
    
    const itemsList = cart.map(i => {
      const priceUnit = i.final_price || i.price || 0;
      const subtotal = priceUnit * (i.quantity || 1);
      currentTotal += subtotal;
      itemsCount += (i.quantity || 1);
      return `• ${i.name} (x${i.quantity || 1}) - $${subtotal.toLocaleString()}`;
    }).join("\n");

    const userName = user?.name || "Cliente interesado";
    const userEmail = user?.email ? `(${user.email})` : "";

    const msg = encodeURIComponent(
        `✨ *NUEVA SOLICITUD DE PEDIDO - Alesteb* ✨\n\n` +
        `👤 *CLIENTE:* ${userName.toUpperCase()} ${userEmail}\n` +
        `────────────────────────\n` +
        `Estimados, me gustaría formalizar la adquisición de los siguientes artículos:\n\n` +
        `${itemsList}\n` +
        `────────────────────────\n\n` +
        `📊 *RESUMEN DE COMPRA*\n` +
        `💰 *VALOR TOTAL: $${currentTotal.toLocaleString()}*\n\n` +
        `¿Podrían confirmarme la disponibilidad y los pasos para concretar la operación? Quedo atento.`
      );
      
      return { total: currentTotal, message: msg, count: itemsCount };
    }, [cart, user]);

  // 🔥 NUEVA FUNCIÓN: Registrar venta online antes de WhatsApp
  const handleFinalizePurchase = async () => {
    if (!user) {
      alert("Debes iniciar sesión para finalizar tu pedido");
      return;
    }

    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Registrar venta en el sistema
      const saleData = {
        customer_id: user.id,
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity || 1,
          price: item.final_price || item.price,
          name: item.name
        })),
        total: total,
        sale_type: 'online' // ⚠️ IMPORTANTE: Marca como venta online
      };

      const response = await api.post("/sales", saleData);
      
      // 2. Si la venta se registró correctamente, abrir WhatsApp
      if (response.status === 201) {
        const orderCode = response.data.orderCode || `AL-${response.data.saleId}`;
        
        // Agregar código de orden al mensaje de WhatsApp
        const enhancedMessage = message + encodeURIComponent(
          `\n\n🔖 *CÓDIGO DE ORDEN:* ${orderCode}\n` +
          `📅 *FECHA:* ${new Date().toLocaleDateString('es-CO')}`
        );

        // Abrir WhatsApp
        window.open(`https://wa.me/573145055073?text=${enhancedMessage}`, '_blank');

        // 3. Limpiar carrito después de enviar
        if (onClearCart) onClearCart();
        setIsOpen(false);

        // Notificación de éxito
        alert(`✅ Pedido registrado exitosamente\nCódigo: ${orderCode}\n\nSerás redirigido a WhatsApp para confirmar tu orden.`);
      }

    } catch (error) {
      console.error("Error al procesar venta:", error);
      const errorMsg = error.response?.data?.message || "Error al procesar tu pedido";
      alert(`❌ ${errorMsg}\n\nPor favor intenta nuevamente.`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!cart.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 max-w-[350px] w-full pointer-events-none">
      
      {/* LISTA DESPLEGABLE (PRODUCTOS) */}
      <div className={`
        flex flex-col-reverse gap-3 w-full overflow-y-auto px-2 py-2 pointer-events-auto no-scrollbar transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]
        ${isOpen ? "max-h-[60vh] opacity-100 translate-y-0" : "max-h-0 opacity-0 translate-y-10"}
      `}>
        {cart.map((item) => (
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
              <p className="text-[10px] font-black uppercase tracking-tight text-slate-800 truncate">{item.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[11px] font-bold text-slate-900">${((item.final_price || item.price) * (item.quantity || 1)).toLocaleString()}</p>
                <div className="flex items-center bg-slate-100 rounded-full px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onUpdateQty(item.id, (item.quantity || 1) - 1)} className="p-1 hover:text-blue-600"><Minus size={10} /></button>
                  <button onClick={() => onUpdateQty(item.id, (item.quantity || 1) + 1)} className="p-1 hover:text-blue-600"><Plus size={10} /></button>
                </div>
              </div>
            </div>

            <button onClick={() => onRemove(item)} className="text-slate-300 hover:text-red-500 transition-colors">
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
            ${isOpen ? "bg-slate-900 text-white rotate-[360deg]" : "bg-white text-slate-900 hover:scale-110"}
          `}
        >
          {isOpen ? <X size={22} /> : <ShoppingBag size={22} />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
              {count}
            </span>
          )}
        </button>

        {/* BOTÓN FINALIZAR (Ahora registra venta antes de WhatsApp) */}
        <button
          onClick={handleFinalizePurchase}
          disabled={isProcessing || !user}
          className={`flex items-center gap-4 p-2 pl-8 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 group relative overflow-hidden
            ${isProcessing ? "bg-slate-400 cursor-wait" : "bg-slate-900 hover:scale-105 active:scale-95"}
            ${!user ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="flex flex-col text-white">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
              {!user ? "Inicia sesión" : isProcessing ? "Procesando..." : user ? `Orden de ${user.name.split(' ')[0]}` : "Finalizar Pedido"}
            </span>
            <span className="text-xl font-black">${total.toLocaleString()}</span>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-md opacity-20 group-hover:opacity-100 group-hover:scale-150 transition-all duration-700" />
            <div className="relative bg-emerald-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-700 group-hover:rotate-[360deg]">
              {isProcessing ? (
                <Loader2 size={24} className="animate-spin text-white" />
              ) : (
                <MessageCircle size={24} fill="white" strokeWidth={1} />
              )}
            </div>
          </div>
        </button>
      </div>

      {/* TOOLTIP: Inicia sesión si no está autenticado */}
      {!user && (
        <div className="pointer-events-auto bg-amber-500 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-lg animate-pulse">
          ⚠️ Inicia sesión para finalizar tu compra
        </div>
      )}
    </div>
  );
} 