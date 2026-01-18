import { Link } from "react-router-dom";
import { Instagram, Twitter, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-slate-950 border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-xl font-black tracking-tighter mb-4 block">
              ALESTEB
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Elevando el estándar de la tecnología premium con una selección curada para los más exigentes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-cyan-400">Navegación</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link to="/productos" className="hover:text-white transition">Catálogo Completo</Link></li>
              <li><a href="#categorias" className="hover:text-white transition">Categorías Destacadas</a></li>
              <li><a href="#beneficios" className="hover:text-white transition">Cómo Funciona</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-purple-400">Ayuda</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-white transition">Políticas de Envío</a></li>
              <li><a href="#" className="hover:text-white transition">Preguntas Frecuentes</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-white">Redes</h4>
            <div className="flex gap-4">
              <a href="#" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition text-slate-300 hover:text-white">
                <Instagram size={20} />
              </a>
              <a href="#" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition text-slate-300 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition text-slate-300 hover:text-white">
                <MessageCircle size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs">
            © 2026 ALESTEB STORE. Todos los derechos reservados.
          </p>
          <p className="text-slate-600 text-[10px] tracking-[0.2em] uppercase">
            Designed for the future
          </p>
        </div>
      </div>
    </footer>
  );
}