import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed top-0 w-full z-[100] bg-slate-950/90 md:bg-slate-950/60 md:backdrop-blur-xl">

      {/* OVERLAY: Fondo difuminado que cubre la web al abrir el menú */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-500 md:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={closeMenu}
      />

      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-[110]">
        {/* Logo */}
        <Link to="/" onClick={closeMenu} className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
          <span className="text-white">ALESTEB</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <Link to="/productos" className="hover:text-white transition-colors">Productos</Link>
          <a href="#categorias" className="hover:text-white transition-colors">Categorías</a>
          <a href="#beneficios" className="hover:text-white transition-colors">Servicios</a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Link to="/productos" className="p-2 text-slate-300 hover:text-white transition-colors">
            <ShoppingBag size={22} />
          </Link>
          
          {/* BOTÓN HAMBURGUESA */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden p-2 text-slate-300 hover:text-white transition-colors focus:outline-none relative z-[120]"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          <Link 
            to="/productos" 
            className="hidden md:block px-5 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-cyan-400 transition-all active:scale-95"
          >
            COMPRAR AHORA
          </Link>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div className={`
        fixed inset-0 bg-slate-950/95 transition-all duration-500 md:hidden z-[105]
        ${isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}
      `}>
        <div className="flex flex-col items-center pt-32 h-full gap-8 text-xl font-bold tracking-[0.2em] text-white">
          <Link 
            to="/productos" 
            onClick={closeMenu} 
            className="w-full text-center py-4 hover:bg-white/5 hover:text-cyan-400 transition-all"
          >
            PRODUCTOS
          </Link>
          <a 
            href="#categorias" 
            onClick={closeMenu} 
            className="w-full text-center py-4 hover:bg-white/5 hover:text-cyan-400 transition-all"
          >
            CATEGORÍAS
          </a>
          <a 
            href="#beneficios" 
            onClick={closeMenu} 
            className="w-full text-center py-4 hover:bg-white/5 hover:text-cyan-400 transition-all"
          >
            SERVICIOS
          </a>
          
          <Link 
            to="/productos" 
            onClick={closeMenu}
            className="mt-8 px-12 py-5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black rounded-full shadow-[0_0_30px_rgba(34,211,238,0.2)] active:scale-95 transition-all"
          >
            COMPRAR AHORA
          </Link>
        </div>
      </div>
    </nav>
  );
}