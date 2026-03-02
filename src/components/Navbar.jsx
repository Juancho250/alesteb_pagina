import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ShoppingBag, Menu, X, ChevronDown, ChevronRight, 
  Search, LifeBuoy, User, LogOut, Package
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ cart = [] }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeMobileSubs, setActiveMobileSubs] = useState({});
  const [activeHoverCategory, setActiveHoverCategory] = useState(null);
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
    const timer = setTimeout(() => {
      setIsOpen(false);
      setActiveMobileSubs({});
    }, 0);
    document.body.style.overflow = "unset";
    return () => clearTimeout(timer);
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
          <div className="ml-4 border-l-2 border-blue-50 pl-4 mb-2">
            {renderMobileCategories(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-[200] transition-all duration-300 ${
        scrolled || isOpen ? "bg-white shadow-md" : "bg-white/90 backdrop-blur-md"
      }`}>
        <div className="w-full h-16 lg:h-20 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between h-full">
            
            <Link to="/" className="relative z-[210]">
              <span className="text-2xl font-black tracking-tighter italic text-slate-900">ALESTEB</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 h-full">
              <Link to="/productos" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                Tienda
              </Link>
              
              {/* --- CATEGORÍAS (MEGAMENU) --- */}
              <div className="group h-full flex items-center">
                <button className="flex items-center gap-1 text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors h-full px-2">
                  Categorías 
                  <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
                </button>

                {/* Este contenedor ocupa todo el ancho y empieza justo debajo del nav */}
                <div className="absolute top-full left-0 w-full bg-transparent opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                  {/* El padding-top crea el puente invisible para que el mouse no "salga" del hover */}
                  <div className="pt-0 shadow-2xl"> 
                    <div className="bg-white border-t border-slate-100 w-full">
                      <div className="max-w-7xl mx-auto px-10 py-12 grid grid-cols-4 gap-10">
                        {categories.map(cat => (
                          <div key={cat.id} className="space-y-5">
                            <Link 
                              to={`/productos/${cat.slug}`} 
                              className="block text-xs font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-3 hover:text-blue-800"
                            >
                              {cat.name}
                            </Link>
                            
                            <ul className="space-y-3">
                              {cat.children?.map(sub => (
                                <li 
                                  key={sub.id} 
                                  className="relative group/item"
                                  onMouseEnter={() => setActiveHoverCategory(sub.id)}
                                  onMouseLeave={() => setActiveHoverCategory(null)}
                                >
                                  <Link 
                                    to={`/productos/${sub.slug}`} 
                                    className="text-[13px] font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-between"
                                  >
                                    {sub.name}
                                    {sub.children?.length > 0 && <ChevronRight size={14} className="text-slate-300" />}
                                  </Link>
                                  
                                  {/* FLYOUT TERCER NIVEL */}
                                  {sub.children?.length > 0 && activeHoverCategory === sub.id && (
                                    <div className="absolute left-full top-[-10px] ml-0 pl-4 w-full h-auto z-[250]">
                                       <div className="bg-white border border-slate-100 rounded-xl shadow-2xl p-5 min-w-[220px]">
                                          <ul className="space-y-3">
                                            {sub.children.map(subsub => (
                                              <li key={subsub.id}>
                                                <Link 
                                                  to={`/productos/${subsub.slug}`}
                                                  className="block text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                                                >
                                                  {subsub.name}
                                                </Link>
                                              </li>
                                            ))}
                                          </ul>
                                       </div>
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Link to="/support" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                Soporte
              </Link>

              {/* ✅ NUEVO: Link a Pedidos (solo si está autenticado) */}
              {isAuthenticated && (
                <Link to="/orders" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <Package size={16} />
                  Mis Pedidos
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3 md:gap-5 relative z-[210]">
              <button className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors hidden sm:block">
                <Search size={20} />
              </button>

              {isAuthenticated && user ? (
                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-blue-600 leading-none">Miembro</span>
                    <span className="text-xs font-bold text-slate-900 capitalize">
                      {user?.name?.split(' ')[0] || "Usuario"}
                    </span>
                  </div>
                  <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors hidden md:block">
                  <User size={20} />
                </Link>
              )}

              <Link to="/productos" className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <ShoppingBag size={21} />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cart.length}
                  </span>
                )}
              </Link>
              
              <button onClick={toggleMenu} className="md:hidden p-2 text-slate-900">
                {isOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>

        {/* --- MOBILE MENU --- */}
        <div className={`fixed inset-0 bg-white z-[190] md:hidden transition-transform duration-500 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col h-full pt-24 px-6 pb-10 overflow-y-auto">
            <div className="mb-8">
              {isAuthenticated ? (
                <div className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-black">
                    {user?.name?.[0] || "U"}
                  </div>
                  <div className="flex-1">
                    <span className="block text-sm font-black uppercase italic">{user?.name}</span>
                    <button onClick={logout} className="text-xs text-red-500 font-bold">Cerrar Sesión</button>
                  </div>
                </div>
              ) : (
                <Link to="/auth" className="flex items-center gap-4 p-5 rounded-3xl bg-slate-900 text-white">
                  <User size={20} />
                  <span className="font-black uppercase text-sm italic tracking-widest">Mi Cuenta</span>
                </Link>
              )}
            </div>

            {/* ✅ NUEVO: Link móvil a Pedidos */}
            {isAuthenticated && (
              <Link 
                to="/orders" 
                className="flex items-center gap-4 p-5 mb-6 rounded-3xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <Package size={20} className="text-blue-600" />
                <span className="font-black uppercase text-sm italic tracking-widest text-blue-900">Mis Pedidos</span>
              </Link>
            )}

            <div className="flex flex-col">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Categorías</h3>
               {renderMobileCategories(categories)}
            </div>
          </div>
        </div>
      </nav>

      <div className="h-16 lg:h-20 w-full" />
    </>
  );
}
