// src/components/ProofUploader.jsx
import { useRef, useState } from "react";
import { Upload, Image, Loader2, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";
import api from "../services/api";

/**
 * Componente reutilizable para subir comprobante de pago.
 * Se usa en OrderSuccessPage y en Orders (detalle del pedido).
 *
 * Props:
 *   order      — objeto con { id, payment_proof_url }
 *   onUploaded — callback opcional que se llama cuando el upload termina
 *   compact    — boolean, versión reducida para usar dentro de listas
 */
export default function ProofUploader({ order, onUploaded, compact = false }) {
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone]         = useState(!!order?.payment_proof_url);
  const [error, setError]       = useState("");
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setError("");
    if (f.size > 8 * 1024 * 1024) {
      setError("El archivo supera los 8MB");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null); // PDF — no preview de imagen
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("proof", file);
      await api.post(`/sales/${order.id}/upload-proof`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDone(true);
      setPreview(null);
      setFile(null);
      if (onUploaded) onUploaded();
    } catch (err) {
      setError(err.response?.data?.message || "Error al subir el comprobante. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  // ── Estado: ya tiene comprobante ─────────────────────────────────────────
  if (done || order?.payment_proof_url) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
        <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-800">Comprobante enviado</p>
          <p className="text-xs text-emerald-600 mt-0.5">El equipo verificará tu pago pronto</p>
        </div>
        {order?.payment_proof_url && (
          <a
            href={order.payment_proof_url}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-600 hover:text-emerald-800 flex-shrink-0 p-1"
            title="Ver comprobante"
          >
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    );
  }

  // ── Estado: necesita subir comprobante ───────────────────────────────────
  return (
    <div className="space-y-3" onClick={e => e.stopPropagation()}>
      {!compact && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">Sube tu comprobante de pago</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Realiza la transferencia y sube la captura para que confirmemos tu pedido.
            </p>
          </div>
        </div>
      )}

      {/* Zona de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer group
          ${preview
            ? "border-transparent p-0 overflow-hidden"
            : "border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 p-4"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />

        {preview ? (
          <div className="relative">
            <img src={preview} alt="preview" className="w-full h-44 object-cover rounded-2xl" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
              <p className="text-white text-sm font-bold">Cambiar imagen</p>
            </div>
          </div>
        ) : file ? (
          // Archivo PDF seleccionado
          <div className="flex items-center gap-3 py-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Image size={18} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-slate-400">
            <div className="w-10 h-10 bg-slate-200 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
              <Image size={18} className="group-hover:text-blue-600 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {compact ? "Subir comprobante" : "Arrastra o toca para subir"}
            </p>
            <p className="text-xs text-slate-400">JPG, PNG o PDF · máx 8MB</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {file && (
        <button
          onClick={upload}
          disabled={uploading}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {uploading
            ? <><Loader2 size={15} className="animate-spin" /> Subiendo...</>
            : <><Upload size={15} /> Enviar comprobante</>
          }
        </button>
      )}
    </div>
  );
}