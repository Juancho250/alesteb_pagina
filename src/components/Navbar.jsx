import { Link } from "react-router-dom";
import { ShoppingBag, Menu } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
          <span>ALESTEB</span>
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
          <button className="md:hidden p-2 text-slate-300">
            <Menu size={22} />
          </button>
          <Link 
            to="/productos" 
            className="hidden md:block px-5 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-cyan-400 transition-all active:scale-95"
          >
            COMPRAR AHORA
          </Link>
        </div>
      </div>
    </nav>
  );
}