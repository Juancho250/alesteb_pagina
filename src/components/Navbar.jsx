import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
// Añadido User a la lista de iconos
import { 
  ShoppingBag, Menu, X, ChevronDown, ChevronRight, 
  Search, LifeBuoy, Package, User 
} from "lucide-react";
import api from "../services/api";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeMobileSubs, setActiveMobileSubs] = useState({});
  const location = useLocation();

  useEffect(() => {
    api.get("/categories")
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setActiveMobileSubs({});
    document.body.style.overflow = "unset";
  }, [location]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    document.body.style.overflow = !isOpen ? "hidden" : "unset";
  };

  const toggleMobileSub = (id) => {
    setActiveMobileSubs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMobileCategories = (nodes, level = 0) => {
    return nodes.map(node => (
      <div key={node.id} className="w-full">
        <div className={`flex justify-between items-center py-4 ${level === 0 ? "border-b border-slate-50" : ""}`}>
          <Link 
            to={`/productos/${node.slug}`} 
            className={`${level === 0 ? "text-lg font-bold text-slate-900" : "text-base text-slate-600"} transition-colors`}
          >
            {node.name}
          </Link>
          {node.children?.length > 0 && (
            <button 
              onClick={() => toggleMobileSub(node.id)} 
              className="p-2 bg-slate-50 rounded-full active:bg-slate-200 transition-colors"
            >
              <ChevronRight size={18} className={`transition-transform duration-300 text-slate-400 ${activeMobileSubs[node.id] ? "rotate-90" : ""}`} />
            </button>
          )}
        </div>
        {node.children?.length > 0 && activeMobileSubs[node.id] && (
          <div className="ml-4 border-l-2 border-blue-50 pl-4 mb-2 animate-in slide-in-from-left-2 duration-300">
            {renderMobileCategories(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      <nav className={`fixed top-0 w-full z-[200] transition-all duration-300 ${
        scrolled || isOpen ? "bg-white shadow-sm" : "bg-transparent py-2"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 lg:h-20 flex items-center justify-between relative">
          
          {/* Logo */}
          <Link to="/" className="relative z-[210] order-2 md:order-1">
            <span className="text-2xl font-black tracking-tighter italic text-slate-900">ALESTEB</span>
          </Link>

          {/* Menú Desktop */}
          <div className="hidden md:flex items-center gap-8 order-2">
            <Link to="/productos" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Tienda</Link>
            
            <div className="group h-full">
              <button className="flex items-center gap-1 text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors py-8">
                Categorías <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>

              {/* Mega Menú */}
              <div className="absolute top-[100%] left-0 w-full bg-white shadow-xl border-t border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <div className="max-w-7xl mx-auto px-10 py-12 grid grid-cols-4 gap-12">
                  {categories.map(cat => (
                    <div key={cat.id} className="space-y-4">
                      <Link to={`/productos/${cat.slug}`} className="block text-xs font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-2">
                        {cat.name}
                      </Link>
                      <ul className="space-y-2">
                        {cat.children?.map(sub => (
                          <li key={sub.id} className="group/sub relative">
                            <Link to={`/productos/${sub.slug}`} className="text-[13px] font-bold text-slate-500 hover:text-black flex items-center justify-between">
                              {sub.name} {sub.children?.length > 0 && <ChevronRight size={10} />}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Link to="/soporte" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Soporte</Link>
          </div>

          {/* Iconos Derecha */}
          <div className="flex items-center gap-2 md:gap-4 order-3 relative z-[210]">
            <button className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors hidden sm:block">
              <Search size={20} strokeWidth={2} />
            </button>

            {/* LOGIN ICON (DESKTOP) */}
            <Link to="/auth" className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors hidden md:block">
              <User size={20} strokeWidth={2} />
            </Link>

            <Link to="/carrito" className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
              <ShoppingBag size={20} strokeWidth={2} />
              <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">0</span>
            </Link>
            
            <button onClick={toggleMenu} className="md:hidden p-2 text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* MENU MÓVIL */}
        <div className={`fixed inset-0 bg-white/95 backdrop-blur-xl z-[190] md:hidden transition-all duration-500 ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}>
          <div className="flex flex-col h-full pt-24 px-6 pb-10 overflow-y-auto">
            
            {/* LOGIN / REGISTRO RÁPIDO (MÓVIL) */}
            <div className={`mb-10 transition-all duration-700 delay-75 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <Link to="/auth" className="flex items-center gap-4 p-4 rounded-3xl bg-slate-900 text-white">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <span className="block text-sm font-black uppercase tracking-widest italic">Mi Cuenta</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Entrar o Registrarse</span>
                </div>
              </Link>
            </div>

            <div className={`mb-10 transition-all duration-700 delay-150 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 pl-1">Explorar Tienda</h3>
              <div className="flex flex-col space-y-1">
                {renderMobileCategories(categories)}
              </div>
            </div>
            
            <div className={`mt-auto pt-8 border-t border-slate-100 space-y-3 transition-all duration-700 delay-200 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
              <Link to="/soporte" className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm"><LifeBuoy size={20} /></div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900">Centro de Ayuda</span>
                    <span className="text-xs text-slate-500 font-medium">Resolvemos tus dudas</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="h-16 lg:h-20 w-full bg-transparent" />
    </>
  );
}