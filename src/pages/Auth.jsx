import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Lock, Mail, User, ArrowRight, 
  ShieldCheck, Zap, Globe, Loader2, KeyRound 
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const { loginWithToken } = useAuth(); // ✅ Cambio: ahora usamos loginWithToken
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("auth"); 
  const [verificationCode, setVerificationCode] = useState("");
  const [loggedUser, setLoggedUser] = useState(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: "" 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      if (step === "auth") {
        const endpoint = isLogin ? "/auth/login" : "/auth/register";
        const payload = isLogin 
          ? { email: formData.email, password: formData.password }
          : formData;

        const { data } = await api.post(endpoint, payload);

        if (isLogin) {
          // ✅ Extraer user y token correctamente
          const userToLogin = data.user;
          const tokenToLogin = data.token;

          if (!userToLogin || !tokenToLogin) {
            throw new Error("Respuesta del servidor incompleta");
          }

          // ✅ Usar loginWithToken en lugar de login
          loginWithToken(userToLogin, tokenToLogin);
          setLoggedUser(userToLogin);
          setStep("success");
          
          setTimeout(() => {
            navigate("/");
          }, 3500);

        } else {
          // Registro exitoso, ir a verificación
          setStep("verify"); 
        }

      } else {
        // Verificación de código
        await api.post("/auth/verify", { 
          email: formData.email, 
          code: verificationCode 
        });
        setStep("auth");
        setIsLogin(true);
        setVerificationCode("");
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || "Error en la autenticación";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZADO CONDICIONAL: OVERLAY DE BIENVENIDA TIENDA VIRTUAL ---
  if (step === "success") {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center overflow-hidden font-sans text-slate-900 animate-in fade-in duration-1000">
        
        {/* Contenedor Principal */}
        <div className="w-full max-w-4xl px-12">
          
          {/* Cabecera de marca */}
          <div className="space-y-4 text-center sm:text-left">
            <p className="text-[10px] font-black tracking-[0.6em] uppercase text-slate-300 animate-in slide-in-from-left-8 duration-1000">
              Secure Entry / Alesteb Boutique
            </p>
            
            <h2 className="text-5xl md:text-8xl font-light tracking-tighter leading-none uppercase animate-in slide-in-from-bottom-12 duration-1000 delay-200">
              Hola, <br />
              <span className="font-black italic block mt-2 text-slate-900">
                {loggedUser?.name?.split(' ')[0] || "Invitado"}
              </span>
            </h2>
          </div>

          {/* Línea de Carga y Frase de Marketing */}
          <div className="mt-20 relative">
            <div className="h-[2px] w-full bg-slate-50 relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-900 origin-left animate-[reveal_3.5s_ease-in-out_forwards]"></div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-8 gap-4">
              <div className="flex items-center gap-4 animate-in fade-in duration-1000 delay-500">
                {/* Un pequeño punto parpadeante que simula exclusividad */}
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[11px] font-black tracking-[0.4em] uppercase text-slate-900 italic">
                  ¿Listo para dejarte tentar?
                </span>
              </div>
              
              <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-slate-300">
                Cargando colección exclusiva 2026
              </span>
            </div>
          </div>
        </div>

        {/* Marca de agua vertical - Lado izquierdo */}
        <div className="absolute left-12 bottom-12 -rotate-90 origin-left hidden md:block">
          <p className="text-[8px] font-black tracking-[0.5em] uppercase text-slate-100">
            ALESTEB // NEW ERA SHOPPING
          </p>
        </div>

        <style>{`
          @keyframes reveal {
            0% { transform: scaleX(0); }
            100% { transform: scaleX(1); }
          }
        `}</style>
      </div>
    );
  }

  // --- RENDERIZADO NORMAL: LOGIN / REGISTRO ---
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans text-slate-900">
      
      {/* SECCIÓN IZQUIERDA: ESTÉTICA */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#f5f5f7] p-16 flex-col justify-between relative overflow-hidden border-r border-slate-100">
        <div className="z-10">
          <h2 className="text-6xl font-black tracking-tighter leading-[0.9] uppercase italic mb-8 whitespace-pre-line">
            {step === "verify" 
              ? "Verifica \n tu identidad." 
              : (isLogin ? "Bienvenido de \n vuelta al futuro." : "Únete a la \n vanguardia digital.")
            }
          </h2>
          
          <div className="space-y-6 mt-12">
            <AuthBenefit icon={<ShieldCheck />} text="Seguridad encriptada de grado militar" />
            <AuthBenefit icon={<Zap />} text="Acceso prioritario a nuevos lanzamientos" />
            <AuthBenefit icon={<Globe />} text="Comunidad global de diseño y tecnología" />
          </div>
        </div>

        <div className="absolute bottom-[-10%] right-[-10%] opacity-[0.03] select-none pointer-events-none">
          <h1 className="text-[20rem] font-black italic">A</h1>
        </div>

        <div className="z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            © 2026 ALESTEB SYSTEM / AUTH_MODULE
          </p>
        </div>
      </div>

      {/* SECCIÓN DERECHA: FORMULARIO */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden text-center">
             <Link to="/" className="text-xl font-black italic tracking-tighter uppercase">ALESTEB</Link>
          </div>

          <div className="mb-10">
            <h3 className="text-2xl font-black tracking-tighter uppercase italic text-slate-900">
              {step === "verify" ? "Confirmar Código" : (isLogin ? "Iniciar Sesión" : "Crear Cuenta")}
            </h3>
            <p className="text-slate-400 text-sm font-medium mt-1">
              {step === "verify" 
                ? `Enviamos un código a ${formData.email}` 
                : "Introduce tus datos para acceder al sistema."
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === "auth" ? (
              <>
                {!isLogin && (
                  <AuthInput 
                    icon={<User size={16}/>} 
                    placeholder="NOMBRE COMPLETO" 
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
              </>
            ) : (
              <div className="space-y-4">
                 <AuthInput 
                  icon={<KeyRound size={16}/>} 
                  placeholder="CÓDIGO DE 6 DÍGITOS" 
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] tracking-[0.25em] flex items-center justify-center gap-3 hover:bg-blue-600 transition-all active:scale-[0.98] shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <> 
                  {step === "verify" ? "VERIFICAR AHORA" : (isLogin ? "ENTRAR" : "REGISTRARME")} 
                  <ArrowRight size={14} /> 
                </>
              )}
            </button>
          </form>

          {step === "auth" && (
            <div className="mt-8 text-center border-t border-slate-100 pt-8">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
              >
                {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES AUXILIARES ---
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
      <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600 border border-slate-100">{icon}</div>
      <span className="text-sm font-bold text-slate-600 tracking-tight">{text}</span>
    </div>
  );
}