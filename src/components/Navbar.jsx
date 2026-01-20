import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Bloquear el scroll del cuerpo cuando el menú está abierto
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${
      scrolled || isOpen 
        ? "bg-white/90 backdrop-blur-md border-b border-[#d2d2d7]" 
        : "bg-white/50 backdrop-blur-sm"
    }`}>

      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between relative z-[120]">
        {/* Logo */}
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2 group">
          <div className="w-5 h-5 bg-[#1d1d1f] rounded-sm" />
          <span className="text-lg font-semibold tracking-tight text-[#1d1d1f]">ALESTEB</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10 text-[12px] font-normal text-[#1d1d1f]/80">
          <Link to="/productos" className="hover:text-black transition-colors">Tienda</Link>
          <a href="#categorias" className="hover:text-black transition-colors">Categorías</a>
          <a href="#beneficios" className="hover:text-black transition-colors">Soporte</a>
        </div>

        {/* Icons & Mobile Toggle */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link to="/productos" className="p-1 text-[#1d1d1f]/80 hover:text-black">
            <ShoppingBag size={20} strokeWidth={1.5} />
          </Link>
          
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden p-1 text-[#1d1d1f] relative z-[130]"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link 
            to="/productos" 
            className="hidden md:block px-4 py-1.5 bg-[#0071e3] text-white text-[12px] font-medium rounded-full hover:bg-[#0077ed]"
          >
            Comprar
          </Link>
        </div>
      </div>

      {/* MOBILE MENU - Corregido con fondo sólido y posición fija total */}
      <div className={`
        fixed inset-0 bg-white transition-all duration-500 ease-in-out md:hidden z-[200]
        ${isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
      `}>
        {/* Añadimos un padding top mayor para que no choque con el botón X */}
        <div className="flex flex-col px-10 pt-32 h-full gap-8 text-2xl font-semibold tracking-tight text-[#1d1d1f] bg-white">
          <Link to="/productos" onClick={closeMenu} className="border-b border-[#f5f5f7] pb-4">
            Tienda
          </Link>
          <a href="#categorias" onClick={closeMenu} className="border-b border-[#f5f5f7] pb-4">
            Categorías
          </a>
          <a href="#beneficios" onClick={closeMenu} className="border-b border-[#f5f5f7] pb-4">
            Servicios
          </a>
          
          <Link 
            to="/productos" 
            onClick={closeMenu}
            className="mt-4 text-[#0071e3] text-lg font-medium"
          >
            Comprar ahora {">"}
          </Link>
        </div>
      </div>
    </nav>
  );
}