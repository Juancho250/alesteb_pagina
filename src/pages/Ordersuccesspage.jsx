import { CheckCircle, Package, MapPin, Home, MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const orderData = location.state || {};
  const { order_code, total, shipping_address, shipping_city } = orderData;

  // Si no hay datos de orden, redirigir al home
  useEffect(() => {
    if (!order_code) {
      const timer = setTimeout(() => navigate("/"), 2000);
      return () => clearTimeout(timer);
    }
  }, [order_code, navigate]);

  if (!order_code) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        
        {/* ANIMACIÓN DE ÉXITO */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500 mb-6 animate-bounce">
            <CheckCircle size={48} className="text-white" strokeWidth={3} />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
            ¡Pedido confirmado!
          </h1>
          
          <p className="text-slate-600 font-medium mb-2">
            Tu pedido ha sido registrado exitosamente
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full">
            <Package size={16} />
            <span className="font-black text-sm">Código: {order_code}</span>
          </div>
        </div>

        {/* DETALLES DEL PEDIDO */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
          
          {/* Total */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">
              Total del pedido
            </p>
            <p className="text-4xl font-black">
              ${Number(total).toLocaleString()}
            </p>
          </div>

          {/* Dirección */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                  Dirección de envío
                </p>
                <p className="font-bold text-slate-900">{shipping_city}</p>
                <p className="text-slate-600 text-sm">{shipping_address}</p>
              </div>
            </div>
          </div>

          {/* Próximos pasos */}
          <div className="p-6 bg-blue-50">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 mb-3">
              Próximos pasos
            </h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <p className="text-sm text-blue-900 font-medium pt-0.5">
                  Revisa tu correo electrónico para ver el resumen completo de tu pedido
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <p className="text-sm text-blue-900 font-medium pt-0.5">
                  Te contactaremos por WhatsApp para coordinar el pago y la entrega
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                  3
                </span>
                <p className="text-sm text-blue-900 font-medium pt-0.5">
                  Recibirás tu pedido en la dirección indicada
                </p>
              </li>
            </ol>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-xl font-black hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Home size={18} />
            Volver a la tienda
          </button>
          
          <a
            href="https://wa.me/573145055073"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-all"
          >
            <MessageCircle size={18} />
            Contactar por WhatsApp
          </a>
        </div>

        {/* Nota adicional */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Guarda tu código de pedido: <strong className="text-slate-600">{order_code}</strong>
        </p>
      </div>
    </div>
  );
}