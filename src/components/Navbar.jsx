import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
  }, [isOpen]);

  return (
    <>
      {/* NAV PRINCIPAL */}
      <nav className={`fixed top-0 w-full z-[150] transition-colors duration-300 ${
        scrolled || isOpen ? "bg-white" : "bg-white/70 backdrop-blur-md"
      } ${scrolled ? "border-b border-slate-200" : "border-b border-transparent"}`}>
        
        <div className="max-w-7xl mx-auto px-6 h-12 lg:h-14 flex items-center justify-between relative z-[160]">
          
          {/* BOTÓN MENU MÓVIL */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden p-1 text-slate-900 transition-transform active:scale-90"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <div className="w-4 h-4 bg-black rounded-[3px]" />
            <span className="text-[17px] font-bold tracking-tight text-black">ALESTEB</span>
          </Link>

          {/* DESKTOP LINKS */}
          <div className="hidden md:flex items-center gap-8 text-[12px] font-medium text-slate-600">
            <Link to="/productos" className="hover:text-black transition-colors">Tienda</Link>
            <a href="#categorias" className="hover:text-black transition-colors">Categorías</a>
            <a href="#beneficios" className="hover:text-black transition-colors">Soporte</a>
          </div>

          {/* ICONOS DERECHA */}
          <div className="flex items-center gap-4">
            <Link to="/productos" className="p-1 text-slate-600 hover:text-black transition-colors">
              <ShoppingBag size={18} />
            </Link>
            <Link 
              to="/productos" 
              className="hidden md:block px-3 py-1 bg-blue-600 text-white text-[11px] font-semibold rounded-full hover:bg-blue-700 transition-colors"
            >
              Comprar
            </Link>
          </div>
        </div>

        {/* MENU MÓVIL DESPLEGABLE */}
        <div className={`
          fixed inset-0 bg-white z-[140] md:hidden transition-all duration-300 ease-in-out
          ${isOpen ? "translate-y-0 opacity-100 visible" : "-translate-y-full opacity-0 invisible"}
        `}>
          <div className="flex flex-col px-10 pt-24 h-full">
            <nav className="flex flex-col gap-6">
              {['Tienda', 'Categorías', 'Soporte', 'Contacto'].map((item, idx) => (
                <Link 
                  key={item}
                  to="/productos" 
                  className={`text-2xl font-bold tracking-tight border-b border-slate-50 pb-4 transition-all duration-500 ${
                    isOpen ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
                  }`}
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  {item}
                </Link>
              ))}
              
              <Link 
                to="/productos" 
                className={`mt-6 inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-2xl text-base font-bold transition-all duration-700 ${
                  isOpen ? "scale-100 opacity-100" : "scale-90 opacity-0"
                }`}
              >
                Comprar ahora
              </Link>
            </nav>
          </div>
        </div>
      </nav>
      
      {/* ESPACIADOR */}
      <div className="h-12 lg:h-14" />
    </>
  );
}