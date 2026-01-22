import { MessageCircle, X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useMemo } from "react";

export default function CartFloating({ cart, onRemove, onUpdateQty }) {
  if (!cart.length) return null;

  const { total, message } = useMemo(() => {
    let currentTotal = 0;
    const itemsList = cart.map(i => {
      const priceUnit = i.final_price || i.price || 0;
      const subtotal = priceUnit * (i.quantity || 1);
      currentTotal += subtotal;
      return `• ${i.name} (x${i.quantity || 1}) - $${subtotal.toLocaleString()}`;
    }).join("\n");

    const msg = encodeURIComponent(
      `¡Hola! 👋 Me gustaría realizar este pedido:\n\n${itemsList}\n\n💰 TOTAL: $${currentTotal.toLocaleString()}`
    );
    return { total: currentTotal, message: msg };
  }, [cart]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 max-w-[340px] w-full pointer-events-none">
      
      {/* CONTENEDOR DE BURBUJAS (STACK) */}
      <div className="flex flex-col-reverse gap-3 w-full overflow-y-auto max-h-[70vh] px-4 py-2 pointer-events-auto custom-scrollbar no-scrollbar">
        {cart.map((item, index) => (
          <div 
            key={item.id} 
            className="relative group bg-white/90 backdrop-blur-2xl rounded-[2rem] p-2 pr-5 flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] animate-bubble"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Miniatura Circular */}
            <div className="relative shrink-0">
              <img 
                src={item.main_image} 
                alt={item.name} 
                className="w-14 h-14 rounded-full object-cover border-2 border-slate-50 shadow-inner" 
              />
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                {item.quantity}
              </div>
            </div>

            {/* Info Refinada */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-tighter text-slate-800 truncate">{item.name}</p>
              <p className="text-[12px] font-medium text-blue-600">${((item.final_price || item.price) * (item.quantity || 1)).toLocaleString()}</p>
              
              {/* Controles Flotantes (Aparecen en Hover) */}
              <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                <button 
                  onClick={() => onUpdateQty(item.id, (item.quantity || 1) - 1)}
                  className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-900 hover:text-white transition-colors"
                >
                  <Minus size={12} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => onUpdateQty(item.id, (item.quantity || 1) + 1)}
                  className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-900 hover:text-white transition-colors"
                >
                  <Plus size={12} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Botón Cerrar */}
            <button 
              onClick={() => onRemove(item)} 
              className="text-slate-300 hover:text-red-500 transition-colors"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>

      {/* BOTÓN ORBE WHATSAPP (EL DISPARADOR) */}
      <a
        href={`https://wa.me/573145055073?text=${message}`}
        target="_blank"
        rel="noreferrer"
        className="pointer-events-auto flex items-center gap-4 bg-slate-900 text-white p-2 pl-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-105 transition-all duration-500 group relative overflow-hidden"
      >
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Finalizar</span>
          <span className="text-xl font-black">${total.toLocaleString()}</span>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-emerald-400 rounded-full blur-md opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-700" />
          <div className="relative bg-emerald-500 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-700 group-hover:rotate-[360deg]">
            <MessageCircle size={28} fill="white" strokeWidth={1} />
          </div>
        </div>
      </a>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes bubbleIn {
          0% { transform: scale(0.5) translateY(20px); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        .animate-bubble {
          animation: bubbleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
      `}</style>
    </div>
  );
}