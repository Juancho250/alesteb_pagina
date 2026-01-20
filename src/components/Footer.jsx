import { Link } from "react-router-dom"; // ESTA LÍNEA ES LA QUE FALTABA
import { Instagram, Twitter, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#f5f5f7] border-t border-[#d2d2d7] pt-16 pb-12">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Grid Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" className="text-lg font-semibold tracking-tight mb-4 block text-[#1d1d1f]">
              ALESTEB
            </Link>
            <p className="text-[#6e6e73] text-[13px] leading-relaxed max-w-xs">
              Tecnología de vanguardia con un diseño minimalista. Curamos lo mejor para tu estilo de vida digital.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-xs text-[#1d1d1f] uppercase tracking-wider">Tienda</h4>
            <ul className="space-y-3 text-[13px] text-[#424245]">
              <li><Link to="/productos" className="hover:text-black hover:underline">Catálogo</Link></li>
              <li><a href="#" className="hover:text-black hover:underline">Novedades</a></li>
              <li><a href="#" className="hover:text-black hover:underline">Ofertas</a></li>
            </ul>
          </div>

          {/* Soporte */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-xs text-[#1d1d1f] uppercase tracking-wider">Soporte</h4>
            <ul className="space-y-3 text-[13px] text-[#424245]">
              <li><a href="#" className="hover:text-black hover:underline">Envíos</a></li>
              <li><a href="#" className="hover:text-black hover:underline">Garantía</a></li>
              <li><a href="#" className="hover:text-black hover:underline">Contacto</a></li>
            </ul>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-xs text-[#1d1d1f] uppercase tracking-wider">Social</h4>
            <div className="flex gap-5 text-[#424245]">
              <a href="#" className="hover:text-black transition-transform hover:scale-110"><Instagram size={20} /></a>
              <a href="#" className="hover:text-black transition-transform hover:scale-110"><Twitter size={20} /></a>
              <a href="#" className="hover:text-black transition-transform hover:scale-110"><MessageCircle size={20} /></a>
            </div>
          </div>
        </div>

        {/* Copyright & Legal */}
        <div className="border-t border-[#d2d2d7] pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-[11px] text-[#86868b]">
              <p>© 2026 ALESTEB STORE.</p>
              <span className="hidden sm:block text-[#d2d2d7]">|</span>
              <div className="flex gap-4">
                <a href="#" className="hover:underline">Privacidad</a>
                <a href="#" className="hover:underline">Legal</a>
                <a href="#" className="hover:underline">Mapa del sitio</a>
              </div>
            </div>
            
            <p className="text-[#86868b] text-[10px] font-bold tracking-widest uppercase">COLOMBIA</p>
          </div>
        </div>
      </div>
    </footer>
  );
}