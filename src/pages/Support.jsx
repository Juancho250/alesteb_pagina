import { ShieldCheck, Truck, RotateCcw, CreditCard, ExternalLink, Activity } from "lucide-react";

export default function Support() {
  return (
    <div className="bg-white min-h-screen pb-20 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto px-6 pt-16">
        
        {/* SECCIÓN: GRÁFICA DE ESTADO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-4">Métricas de Soporte</h2>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Centro de Ayuda</h1>
          </div>
          <div className="bg-emerald-50 px-6 py-4 rounded-3xl border border-emerald-100 flex items-center gap-4">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Status del Servidor</div>
              <div className="text-xs font-bold text-emerald-700 uppercase">Todos los sistemas operativos</div>
            </div>
            <Activity size={18} className="text-emerald-500" />
          </div>
        </div>

        {/* SECCIÓN: RESUMEN DE TEMAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <SupportTheme icon={<Truck />} text="Envíos" />
          <SupportTheme icon={<RotateCcw />} text="Devoluciones" />
          <SupportTheme icon={<CreditCard />} text="Pagos" />
          <SupportTheme icon={<ShieldCheck />} text="Garantía" />
        </div>

        {/* SECCIÓN: REGISTRO DE FAQ (Acordeón Minimalista) */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Registros de Ayuda Común</h2>
          <FAQItem 
            question="¿Cuánto tarda en procesarse mi orden?" 
            answer="Todos los registros de compra se procesan en un ciclo de 12 a 24 horas hábiles." 
          />
          <FAQItem 
            question="¿Tienen envíos internacionales?" 
            answer="Actualmente operamos bajo la red nacional con tracking en tiempo real." 
          />
          <FAQItem 
            question="¿Cómo solicito una devolución?" 
            answer="Debes registrar tu caso en el portal de garantías con el ID de transacción #000." 
          />
        </div>
      </div>
    </div>
  );
}

function SupportTheme({ icon, text }) {
  return (
    <button className="flex flex-col items-center gap-3 p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-600 hover:shadow-xl hover:shadow-blue-100 transition-all group">
      <div className="text-slate-400 group-hover:text-blue-600 transition-colors">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest">{text}</span>
    </button>
  );
}

function FAQItem({ question, answer }) {
  return (
    <div className="group border-b border-slate-50 pb-4">
      <details className="cursor-pointer outline-none">
        <summary className="flex items-center justify-between list-none">
          <span className="text-sm font-black uppercase italic tracking-tight group-hover:text-blue-600 transition-colors">
            {question}
          </span>
          <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-600" />
        </summary>
        <p className="mt-4 text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          {answer}
        </p>
      </details>
    </div>
  );
}