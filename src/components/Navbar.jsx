import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
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
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setActiveMobileSubs({});
  }, [location]);

  const toggleMobileSub = (id) => {
    setActiveMobileSubs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMobileCategories = (nodes, level = 0) => {
    return nodes.map(node => (
      <div key={node.id} className={`${level > 0 ? "ml-4 mt-4" : "border-b border-slate-100 pb-4"}`}>
        <div className="flex justify-between items-center">
          {/* CAMBIO: Ahora apunta a /productos/slug */}
          <Link to={`/productos/${node.slug}`} className={`${level === 0 ? "text-xl font-bold" : "text-lg text-slate-600"} flex-1`}>
            {node.name}
          </Link>
          {node.children?.length > 0 && (
            <button onClick={() => toggleMobileSub(node.id)} className="p-2">
              <ChevronRight size={20} className={`transition-transform duration-300 ${activeMobileSubs[node.id] ? "rotate-90" : ""}`} />
            </button>
          )}
        </div>
        {node.children?.length > 0 && activeMobileSubs[node.id] && (
          <div className="border-l border-slate-200 pl-4">
            {renderMobileCategories(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      <nav className={`fixed top-0 w-full z-[150] transition-all duration-500 ${
        scrolled || isOpen ? "bg-white shadow-sm" : "bg-white/70 backdrop-blur-md"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-14 lg:h-20 flex items-center justify-between relative z-[160]">
          
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-1">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <span className="text-xl font-black tracking-tighter italic">ALESTEB</span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-10 h-full">
            <Link to="/productos" className="text-[14px] font-semibold text-slate-500 hover:text-black transition-colors">Tienda</Link>
            
            <div className="group h-full flex items-center">
              <button className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-500 group-hover:text-black transition-colors h-full">
                Categorías <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>

              {/* MEGA MENU - Con pt-4 para evitar que se pierda el hover */}
              <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pt-4"> 
                <div className="max-w-6xl mx-auto p-10 grid grid-cols-4 gap-8 bg-white"> 
                  {categories.map(cat => (
                    <div key={cat.id} className="flex flex-col gap-4 text-left">
                      {/* Enlace nivel 1 */}
                      <Link to={`/productos/${cat.slug}`} className="text-base font-bold text-black border-b border-slate-100 pb-2 hover:text-blue-600 transition-colors uppercase tracking-tight">
                        {cat.name}
                      </Link>
                      <ul className="flex flex-col gap-2">
                        {cat.children?.map(sub => (
                          <li key={sub.id} className="group/sub relative py-1">
                            {/* Enlace nivel 2 */}
                            <Link to={`/productos/${sub.slug}`} className="text-sm font-medium text-slate-500 hover:text-black transition-all flex items-center justify-between">
                              {sub.name} {sub.children?.length > 0 && <ChevronRight size={10} />}
                            </Link>
                            
                            {/* NIVEL 3 - Con pl-4 para puente de hover lateral */}
                            {sub.children?.length > 0 && (
                              <div className="hidden group-hover/sub:block absolute left-full top-0 pl-4 z-50">
                                <div className="bg-white shadow-2xl border border-slate-100 p-4 min-w-[220px] rounded-2xl">
                                  {sub.children.map(deepSub => (
                                    <Link key={deepSub.id} to={`/productos/${deepSub.slug}`} className="block py-2.5 px-3 text-[13px] text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg font-bold uppercase transition-all">
                                      {deepSub.name}
                                    </Link>
                                  ))}
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
            <Link to="/soporte" className="text-[14px] font-semibold text-slate-500 hover:text-black transition-colors">Soporte</Link>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/carrito" className="relative p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors">
              <ShoppingBag size={22} strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* MOBILE MENU */}
        <div className={`fixed inset-0 bg-white z-[140] md:hidden transition-all duration-500 ${isOpen ? "translate-y-0" : "-translate-y-full"}`}>
          <div className="flex flex-col px-8 pt-24 h-full overflow-y-auto pb-20">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Explorar</p>
            <div className="flex flex-col gap-6">
              {renderMobileCategories(categories)}
            </div>
          </div>
        </div>
      </nav>
      {/* Spacer para que el contenido no quede debajo del nav fijo */}
      <div className="h-14 lg:h-20" />
    </>
  );
}