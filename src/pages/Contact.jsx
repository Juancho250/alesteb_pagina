import { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2 } from "lucide-react";
import api from "../services/api"; // Tu instancia de axios

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", subject: "", message: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", formData);
      setSent(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      alert("Error al enviar el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-20 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto px-6 pt-16">
        
        {/* RESUMEN */}
        <div className="mb-16">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-4">Canales de Atención</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ContactCard icon={<Mail size={20}/>} title="Email" detail="info@alesteb.com" />
            <ContactCard icon={<Phone size={20}/>} title="WhatsApp" detail="+57 300 000 0000" />
            <ContactCard icon={<MapPin size={20}/>} title="Showroom" detail="Medellín, CO" />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-[0.85] mb-6">
              Registra tu <br /> consulta técnica.
            </h1>
            <p className="text-slate-500 font-medium mb-8 max-w-sm">
              Cada mensaje genera un ticket de seguimiento en nuestra base de datos para garantizar respuesta inmediata.
            </p>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
            {sent ? (
              <div className="py-20 text-center animate-in fade-in zoom-in duration-500">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                <h3 className="font-black italic uppercase tracking-tighter text-2xl">Registro Exitoso</h3>
                <p className="text-slate-500 text-sm mt-2">Revisa tu correo, te contactaremos pronto.</p>
                <button onClick={() => setSent(false)} className="mt-8 text-[10px] font-black text-blue-600 uppercase underline">Enviar otro mensaje</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="NOMBRE" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  <Input placeholder="TELÉFONO" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <Input type="email" placeholder="EMAIL" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                <Input placeholder="ASUNTO (Ej: Garantía, Venta Mayorista)" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required />
                <textarea 
                  required
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  placeholder="DETALLE DE TU MENSAJE" 
                  rows="4" 
                  className="w-full bg-white border border-slate-100 p-4 rounded-2xl text-[11px] font-black tracking-widest focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-300"
                ></textarea>
                
                <button 
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} /> ENVIAR A REGISTRO</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-componente de Input para limpiar el código
function Input(props) {
  return (
    <input 
      {...props} 
      className="w-full bg-white border border-slate-100 p-4 rounded-2xl text-[11px] font-black tracking-widest focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-300" 
    />
  );
}

function ContactCard({ icon, title, detail }) {
  return (
    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all group">
      <div className="text-slate-300 mb-4 group-hover:text-blue-600 transition-colors">{icon}</div>
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</div>
      <div className="text-sm font-bold text-slate-900 tracking-tight">{detail}</div>
    </div>
  );
}