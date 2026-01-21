import { MessageCircle, X, Send } from "lucide-react";
import { useMemo } from "react";

export default function CartFloating({ cart, onRemove }) {
  if (!cart.length) return null;

  const message = useMemo(() => {
    const total = cart.reduce((acc, item) => acc + Number(item.price), 0);
    return encodeURIComponent(
      `¡Hola! 👋\n\n` +
        cart.map(i => `• ${i.name} ($${Number(i.price).toLocaleString()})`).join("\n") +
        `\n\n💰 Total: $${total.toLocaleString()}`
    );
  }, [cart]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Botón principal */}
      <a
        href={`https://wa.me/573145055073?text=${message}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-4 bg-[#0071e3] text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition"
      >
        <MessageCircle />
        <span className="font-bold">{cart.length}</span>
        <Send size={18} />
      </a>

      {/* Items */}
      <div className="mt-3 space-y-2">
        {cart.slice(-3).map(item => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2"
          >
            <span className="text-xs flex-1 truncate">{item.name}</span>
            <button onClick={() => onRemove(item)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
