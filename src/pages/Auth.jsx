import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Lock, Mail, User, ArrowRight, CheckCircle2, 
  ShieldCheck, Zap, Globe, Loader2 
} from "lucide-react";
import api from "../services/api";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "", email: "", password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const endpoint = isLogin ? "/auth/login" : "/auth/register";
    
    try {
      const { data } = await api.post(endpoint, formData);
      // Guardamos el token (ajusta según tu auth.controller.js)
      localStorage.setItem("token", data.token);
      navigate("/perfil"); 
    } catch (error) {
      alert(error.response?.data?.message || "Error en la autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans text-slate-900">
      
      {/* LADO IZQUIERDO: RESUMEN Y ESTÉTICA (Solo Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#f5f5f7] p-16 flex-col justify-between relative overflow-hidden">
        <div className="z-10">
          <Link to="/" className="text-2xl font-black italic tracking-tighter uppercase mb-12 block">
            ALESTEB
          </Link>
          <h2 className="text-6xl font-black tracking-tighter leading-[0.9] uppercase italic mb-8">
            {isLogin ? "Bienvenido de \n vuelta al futuro." : "Únete a la \n vanguardia digital."}
          </h2>
          
          <div className="space-y-6 mt-12">
            <AuthBenefit icon={<ShieldCheck />} text="Seguridad encriptada de grado militar" />
            <AuthBenefit icon={<Zap />} text="Acceso prioritario a nuevos lanzamientos" />
            <AuthBenefit icon={<Globe />} text="Comunidad global de diseño y tecnología" />
          </div>
        </div>

        {/* GRÁFICA SUTIL DE FONDO */}
        <div className="absolute bottom-[-10%] right-[-10%] opacity-[0.03] select-none pointer-events-none">
          <h1 className="text-[20rem] font-black italic">A</h1>
        </div>

        <div className="z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            © 2026 ALESTEB SYSTEM / AUTH_MODULE
          </p>
        </div>
      </div>

      {/* LADO DERECHO: EL REGISTRO (Formulario) */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
             <Link to="/" className="text-xl font-black italic tracking-tighter uppercase">ALESTEB</Link>
          </div>

          <div className="mb-10">
            <h3 className="text-2xl font-black tracking-tighter uppercase italic">
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </h3>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Ingresa tus credenciales para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <AuthInput 
                icon={<User size={16}/>} 
                placeholder="NOMBRE COMPLETO" 
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            )}
            
            <AuthInput 
              icon={<Mail size={16}/>} 
              placeholder="EMAIL" 
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
            
            <AuthInput 
              icon={<Lock size={16}/>} 
              placeholder="CONTRASEÑA" 
              type="password" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required
            />

            <button 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] tracking-[0.25em] flex items-center justify-center gap-3 hover:bg-blue-600 transition-all active:scale-[0.98] shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <> {isLogin ? "ENTRAR" : "REGISTRARME"} <ArrowRight size={14} /> </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-componentes internos
function AuthInput({ icon, ...props }) {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
        {icon}
      </div>
      <input 
        {...props}
        className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-[11px] font-black tracking-widest outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all placeholder:text-slate-300"
      />
    </div>
  );
}

function AuthBenefit({ icon, text }) {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600">{icon}</div>
      <span className="text-sm font-bold text-slate-600 tracking-tight">{text}</span>
    </div>
  );
}