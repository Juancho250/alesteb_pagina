import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Detectar scroll para cambiar apariencia
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cerrar menú cuando cambie la ruta (navegación)
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Bloquear el scroll del cuerpo cuando el menú está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${
        scrolled || isOpen 
          ? "bg-white border-b border-[#d2d2d7]" 
          : "bg-white/70 backdrop-blur-md"
      }`}>

        <div className="max-w-7xl mx-auto px-6 h-12 lg:h-14 flex items-center justify-between relative z-[120]">
          
          {/* LADO IZQUIERDO: Menu Mobile Toggle */}
          <button 
            onClick={toggleMenu} 
            className="md:hidden p-1 text-[#1d1d1f] hover:opacity-70 transition-opacity"
          >
            {isOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>

          {/* CENTRO/IZQUIERDA: Logo */}
          <Link to="/" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <div className="w-4 h-4 bg-[#1d1d1f] rounded-[3px]" />
            <span className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">ALESTEB</span>
          </Link>

          {/* CENTRO: Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-[12px] font-normal text-[#1d1d1f]/80">
            <Link to="/productos" className="hover:text-black transition-colors">Tienda</Link>
            <a href="#categorias" className="hover:text-black transition-colors">Categorías</a>
            <a href="#beneficios" className="hover:text-black transition-colors">Soporte</a>
          </div>

          {/* LADO DERECHO: Carrito e Iconos */}
          <div className="flex items-center gap-4">
            <Link to="/productos" className="p-1 text-[#1d1d1f]/80 hover:text-black transition-colors">
              <ShoppingBag size={18} strokeWidth={2} />
            </Link>
            
            <Link 
              to="/productos" 
              className="hidden md:block px-3 py-1 bg-[#0071e3] text-white text-[11px] font-medium rounded-full hover:bg-[#0077ed] transition-all"
            >
              Comprar
            </Link>
          </div>
        </div>

        {/* MOBILE MENU OVERLAY */}
        <div className={`
          fixed inset-0 bg-white transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden z-[110]
          ${isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}
        `}>
          <div className="flex flex-col px-10 pt-24 h-full gap-6">
            <nav className="flex flex-col gap-5">
              <Link 
                to="/productos" 
                className={`text-2xl font-semibold tracking-tight border-b border-slate-100 pb-4 transition-all duration-500 delay-75 ${isOpen ? "translate-x-0" : "-translate-x-4"}`}
              >
                Tienda
              </Link>
              <a 
                href="#categorias" 
                className={`text-2xl font-semibold tracking-tight border-b border-slate-100 pb-4 transition-all duration-500 delay-100 ${isOpen ? "translate-x-0" : "-translate-x-4"}`}
              >
                Categorías
              </a>
              <a 
                href="#beneficios" 
                className={`text-2xl font-semibold tracking-tight border-b border-slate-100 pb-4 transition-all duration-500 delay-150 ${isOpen ? "translate-x-0" : "-translate-x-4"}`}
              >
                Soporte
              </a>
              <Link 
                to="/contacto" 
                className={`text-2xl font-semibold tracking-tight transition-all duration-500 delay-200 ${isOpen ? "translate-x-0" : "-translate-x-4"}`}
              >
                Contacto
              </Link>
            </nav>

            <div className={`mt-4 transition-all duration-700 delay-300 ${isOpen ? "opacity-100" : "opacity-0"}`}>
               <Link 
                to="/productos" 
                className="inline-flex items-center gap-2 bg-[#0071e3] text-white px-6 py-3 rounded-full text-sm font-medium"
              >
                Comprar ahora
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Spacer para que el contenido no quede debajo del Nav fijo */}
      <div className="h-12 lg:h-14" />
    </>
  );
}