import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-[110]">
        {/* Logo */}
        <Link to="/" onClick={closeMenu} className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
          <span className="text-white">ALESTEB</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Link to="/productos" className="p-2 text-slate-300 hover:text-white transition-colors">
            <ShoppingBag size={22} />
          </Link>
          
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden p-2 text-slate-300 hover:text-white transition-colors focus:outline-none"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU - FONDO REFORZADO */}
      <div className={`
        fixed inset-0 transition-all duration-500 md:hidden z-[105]
        ${isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}
      `}>
        {/* Capa de fondo: Más oscura (95%) y Blur más denso */}
        <div className="absolute inset-0 bg-black/98 backdrop-blur-xl" />
        
        {/* Luces de profundidad sutiles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative flex flex-col items-center justify-start h-full pt-32 gap-6 text-white">
          <Link 
            to="/productos" 
            onClick={closeMenu} 
            className="group w-[85%] text-center py-5 transition-all"
          >
            <span className="text-xl font-bold tracking-[0.3em] text-white">PRODUCTOS</span>
            <div className="h-[2px] w-12 bg-cyan-400 mx-auto mt-2 opacity-50" />
          </Link>

          <a 
            href="#categorias" 
            onClick={closeMenu} 
            className="group w-[85%] text-center py-5 transition-all"
          >
            <span className="text-xl font-bold tracking-[0.3em] text-white">CATEGORÍAS</span>
            <div className="h-[2px] w-12 bg-purple-400 mx-auto mt-2 opacity-50" />
          </a>

          <a 
            href="#beneficios" 
            onClick={closeMenu} 
            className="group w-[85%] text-center py-5 transition-all"
          >
            <span className="text-xl font-bold tracking-[0.3em] text-white">SERVICIOS</span>
            <div className="h-[2px] w-12 bg-cyan-400 mx-auto mt-2 opacity-50" />
          </a>
          
          <Link 
            to="/productos" 
            onClick={closeMenu}
            className="mt-10 px-12 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-xs font-black rounded-full shadow-2xl active:scale-95 transition-all tracking-widest"
          >
            COMPRAR AHORA
          </Link>
        </div>
      </div>
    </nav>
  );
}