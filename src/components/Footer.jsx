// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { Instagram, Twitter, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#f5f5f7] border-t border-[#d2d2d7] pt-16 pb-12 font-sans">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Grid Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" className="text-lg font-black tracking-tighter mb-4 block text-[#1d1d1f] italic uppercase">
              ALESTEB
            </Link>
            <p className="text-[#6e6e73] text-[13px] leading-relaxed max-w-xs font-medium">
              Tecnología de vanguardia con un diseño minimalista. Curamos lo mejor para tu estilo de vida digital.
            </p>
          </div>

          {/* Links de Tienda */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-[10px] text-[#1d1d1f] uppercase tracking-[0.2em]">Tienda</h4>
            <ul className="space-y-3 text-[13px] text-[#424245] font-medium">
              <li><Link to="/productos" className="hover:text-blue-600 transition-colors">Catálogo Completo</Link></li>
              <li><Link to="/productos" className="hover:text-blue-600 transition-colors">Novedades</Link></li>
              <li><Link to="/productos" className="hover:text-blue-600 transition-colors">Ofertas</Link></li>
            </ul>
          </div>

          {/* Soporte (Actualizado) */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-[10px] text-[#1d1d1f] uppercase tracking-[0.2em]">Soporte</h4>
            <ul className="space-y-3 text-[13px] text-[#424245] font-medium">
              <li><Link to="/soporte" className="hover:text-blue-600 transition-colors">Centro de Ayuda</Link></li>
              <li><Link to="/soporte" className="hover:text-blue-600 transition-colors">Garantía</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contacto Directo</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-[10px] text-[#1d1d1f] uppercase tracking-[0.2em]">Social</h4>
            <div className="flex gap-5 text-[#424245]">
              <a href="#" className="hover:text-blue-600 transition-all hover:scale-110"><Instagram size={18} /></a>
              <a href="#" className="hover:text-blue-600 transition-all hover:scale-110"><Twitter size={18} /></a>
              <a href="#" className="hover:text-blue-600 transition-all hover:scale-110"><MessageCircle size={18} /></a>
            </div>
          </div>
        </div>

        {/* Copyright & Legal */}
        <div className="border-t border-[#d2d2d7] pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-[11px] text-[#86868b] font-medium">
              <p>© 2026 ALESTEB STORE.</p>
              <span className="hidden sm:block text-[#d2d2d7]">|</span>
              <div className="flex gap-4">
                <a href="#" className="hover:text-blue-600">Privacidad</a>
                <a href="#" className="hover:text-blue-600">Legal</a>
                <Link to="/soporte" className="hover:text-blue-600">Mapa del sitio</Link>
              </div>
            </div>
            
            <p className="text-[#86868b] text-[9px] font-black tracking-[0.2em] uppercase">COLOMBIA / GLOBAL</p>
          </div>
        </div>
      </div>
    </footer>
  );
}