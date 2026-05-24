import { useState } from "react";
import { ThumbsUp, Trash2, Loader2, X, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import ReviewStars from "./ReviewStars";

const REPORT_REASONS = [
  { value: "spam", label: "Spam o publicidad" },
  { value: "ofensivo", label: "Contenido ofensivo" },
  { value: "falso", label: "Información falsa" },
  { value: "otro", label: "Otro motivo" },
];

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function relativeDate(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `hace ${Math.floor(diff / 86400)} días`;
  if (diff < 86400 * 30) return `hace ${Math.floor(diff / 86400 / 7)} sem`;
  if (diff < 86400 * 365) return `hace ${Math.floor(diff / 86400 / 30)} mes`;
  return `hace ${Math.floor(diff / 86400 / 365)} años`;
}

function abbrevName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Usuario";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20
          rounded-full flex items-center justify-center text-white transition-colors"
      >
        <X size={18} />
      </button>

      <img
        src={images[idx]?.url ?? images[idx]}
        alt=""
        className="max-w-full max-h-full object-contain rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setIdx(i);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-200
                ${i === idx ? "bg-white scale-125" : "bg-white/30 hover:bg-white/60"}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ReportModal({ reviewId, onClose }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState("idle");

  const submit = async () => {
    if (!reason) return;
    setStatus("submitting");
    try {
      await api.post(
        `/reviews/${reviewId}/report`,
        { reason, details },
        { headers: authHeaders() }
      );
      setStatus("done");
      setTimeout(onClose, 1500);
    } catch {
      setStatus("error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-black/60 flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Reportar reseña</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {status === "done" ? (
          <p className="text-sm text-emerald-600 font-bold text-center py-4">
            ¡Gracias por tu reporte!
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all
                    ${reason === r.value
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {reason === "otro" && (
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe el problema..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl
                  text-sm text-slate-800 placeholder-slate-300 resize-none
                  focus:outline-none focus:border-blue-300 transition-colors"
              />
            )}

            {status === "error" && (
              <p className="text-xs text-red-500 font-bold">
                Error al enviar. Intenta de nuevo.
              </p>
            )}

            <button
              onClick={submit}
              disabled={!reason || status === "submitting"}
              className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black
                tracking-widest uppercase flex items-center justify-center gap-2
                hover:bg-red-600 transition-colors active:scale-95 disabled:opacity-50"
            >
              {status === "submitting" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                "Enviar reporte"
              )}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

const TRUNCATE_LEN = 200;

export default function ReviewCard({ review, currentUserId, onDelete }) {
  const [helpful, setHelpful] = useState(
    review.user_vote_helpful ?? null
  );
  const [helpfulCount, setHelpfulCount] = useState(
    review.helpful_count ?? 0
  );
  const [voting, setVoting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reviewUserId = review.user_id ?? review.reviewer_id;
  const isOwn = Boolean(currentUserId && reviewUserId === currentUserId);
  const images = review.images ?? [];
  const body = review.body ?? "";
  const bodyLong = body.length > TRUNCATE_LEN;
  const displayBody =
    bodyLong && !expanded ? body.slice(0, TRUNCATE_LEN) + "…" : body;
  const userName =
    review.user_name ??
    review.reviewer_name ??
    review.user?.name ??
    "Usuario";

  const handleVote = async () => {
    if (voting || isOwn || !currentUserId) return;
    setVoting(true);
    const newHelpful = helpful === true ? false : true;
    try {
      await api.post(
        `/reviews/${review.id}/vote`,
        { helpful: newHelpful },
        { headers: authHeaders() }
      );
      setHelpfulCount((c) => (helpful === true ? c - 1 : c + 1));
      setHelpful(newHelpful ? true : null);
    } catch {
      // silently fail
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar esta reseña?")) return;
    setDeleting(true);
    try {
      await api.delete(`/reviews/${review.id}`, {
        headers: authHeaders(),
        data: { user_id: currentUserId },
      });
      onDelete?.(review.id);
    } catch {
      alert("Error al eliminar la reseña");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3 transition-colors hover:border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-50 to-slate-100
              flex items-center justify-center shrink-0">
              <span className="text-sm font-black text-blue-600">
                {userName[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{abbrevName(userName)}</p>
              <p className="text-[10px] text-slate-400 font-medium">
                {relativeDate(review.created_at)}
              </p>
            </div>
          </div>

          {review.is_verified_purchase && (
            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600
              bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg shrink-0">
              <ShieldCheck size={9} /> Compra verificada
            </span>
          )}
        </div>

        <ReviewStars rating={review.rating} size="sm" />

        {review.title && (
          <p className="text-sm font-black text-slate-900">{review.title}</p>
        )}

        {body && (
          <div>
            <p className="text-sm text-slate-500 leading-relaxed">{displayBody}</p>
            {bodyLong && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="mt-1 flex items-center gap-1 text-[11px] font-black text-blue-600
                  hover:text-blue-700 transition-colors"
              >
                {expanded ? (
                  <><ChevronUp size={12} /> Ver menos</>
                ) : (
                  <><ChevronDown size={12} /> Ver más</>
                )}
              </button>
            )}
          </div>
        )}

        {images.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIdx(i)}
                className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100
                  hover:border-slate-300 transition-colors"
              >
                <img
                  src={img?.url ?? img}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 pt-1 border-t border-slate-50">
          {isOwn ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-[11px] font-black text-red-400
                hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Trash2 size={11} />
              )}
              Eliminar mi reseña
            </button>
          ) : (
            <>
              <button
                onClick={handleVote}
                disabled={voting || !currentUserId}
                className={`flex items-center gap-1.5 text-[11px] font-black transition-colors disabled:opacity-40
                  ${helpful === true
                    ? "text-blue-600"
                    : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                <ThumbsUp
                  size={11}
                  fill={helpful === true ? "currentColor" : "none"}
                />
                Útil ({helpfulCount})
              </button>

              {currentUserId && (
                <button
                  onClick={() => setShowReport(true)}
                  className="ml-auto text-[11px] font-bold text-slate-300 hover:text-slate-500 transition-colors"
                >
                  Reportar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            images={images}
            startIdx={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReport && (
          <ReportModal
            reviewId={review.id}
            onClose={() => setShowReport(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
