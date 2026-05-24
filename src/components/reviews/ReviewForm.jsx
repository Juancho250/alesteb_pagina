import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, Loader2, ImagePlus, CheckCircle2, Trash2 } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import ReviewStars from "./ReviewStars";

const MAX_IMAGES = 3;
const MAX_MB = 3;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ReviewForm({ productId, onSuccess }) {
  const { user, isAuthenticated } = useAuth();

  const [checking, setChecking] = useState(true);
  const [existing, setExisting] = useState(null);
  const [deletingExisting, setDeletingExisting] = useState(false);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState([]);

  const [status, setStatus] = useState("idle");
  const [formError, setFormError] = useState("");

  const fileRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !productId) {
      setChecking(false);
      return;
    }
    let alive = true;
    setChecking(true);

    api
      .get(`/reviews/my/${productId}`, { headers: authHeaders() })
      .then(({ data }) => {
        if (!alive) return;
        const review = data?.data ?? data;
        setExisting(review?.id ? review : null);
      })
      .catch(() => {
        if (alive) setExisting(null);
      })
      .finally(() => {
        if (alive) setChecking(false);
      });

    return () => {
      alive = false;
    };
  }, [isAuthenticated, productId]);

  const uploadImage = async (file, idx) => {
    setImages((prev) =>
      prev.map((img, i) =>
        i === idx ? { ...img, uploading: true, error: "" } : img
      )
    );
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/upload", fd, {
        headers: {
          ...authHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });
      const url = data?.data?.url ?? data?.url ?? data?.secure_url;
      const public_id = data?.data?.public_id ?? data?.public_id;
      setImages((prev) =>
        prev.map((img, i) =>
          i === idx ? { ...img, uploading: false, url, public_id } : img
        )
      );
    } catch (err) {
      const msg =
        err.response?.data?.message ?? "Error al subir la imagen";
      setImages((prev) =>
        prev.map((img, i) =>
          i === idx ? { ...img, uploading: false, error: msg } : img
        )
      );
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (images.length >= MAX_IMAGES) return;
    if (!ACCEPTED.includes(file.type)) {
      setFormError("Solo se aceptan imágenes JPG, PNG o WebP");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setFormError(`Cada imagen debe pesar menos de ${MAX_MB}MB`);
      return;
    }
    setFormError("");
    const preview = URL.createObjectURL(file);
    const idx = images.length;
    setImages((prev) => [
      ...prev,
      { file, preview, url: null, public_id: null, uploading: false, error: "" },
    ]);
    uploadImage(file, idx);
  };

  const removeImage = (idx) => {
    setImages((prev) => {
      const img = prev[idx];
      if (img?.preview) URL.revokeObjectURL(img.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setFormError("Por favor selecciona una calificación");
      return;
    }
    if (images.some((img) => img.uploading)) {
      setFormError("Espera a que terminen de subir las imágenes");
      return;
    }

    const uploadedImages = images
      .filter((img) => img.url && img.public_id)
      .map(({ url, public_id }) => ({ url, public_id }));

    setStatus("submitting");
    setFormError("");

    try {
      await api.post(
        "/reviews",
        {
          product_id: productId,
          rating,
          ...(title.trim() && { title: title.trim() }),
          ...(body.trim() && { body: body.trim() }),
          images: uploadedImages,
        },
        { headers: authHeaders() }
      );
      setStatus("success");
      onSuccess?.();
    } catch (err) {
      setFormError(
        err.response?.data?.message ?? "Error al publicar la reseña"
      );
      setStatus("error");
    }
  };

  const handleDeleteExisting = async () => {
    if (!existing?.id) return;
    if (!window.confirm("¿Eliminar tu reseña?")) return;
    setDeletingExisting(true);
    try {
      await api.delete(`/reviews/${existing.id}`, {
        headers: authHeaders(),
        data: { user_id: user?.id },
      });
      setExisting(null);
      setRating(0);
      setTitle("");
      setBody("");
      setImages([]);
      onSuccess?.();
    } catch (err) {
      alert(err.response?.data?.message ?? "Error al eliminar la reseña");
    } finally {
      setDeletingExisting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
        <p className="text-sm font-bold text-slate-500 mb-4">
          Inicia sesión para compartir tu opinión
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white
            rounded-2xl text-[11px] font-black tracking-widest uppercase
            hover:bg-blue-600 transition-all active:scale-95"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-slate-300" size={20} />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 size={36} className="text-emerald-500" />
        <p className="text-sm font-black text-slate-900">¡Gracias por tu reseña!</p>
        <p className="text-xs text-slate-400">Tu opinión ayuda a otros compradores</p>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Tu reseña
          </p>
          <button
            onClick={handleDeleteExisting}
            disabled={deletingExisting}
            className="flex items-center gap-1.5 text-[10px] font-black text-red-400
              hover:text-red-600 transition-colors disabled:opacity-50"
          >
            {deletingExisting ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Trash2 size={11} />
            )}
            Eliminar
          </button>
        </div>
        <ReviewStars rating={existing.rating} size="sm" />
        {existing.title && (
          <p className="text-sm font-bold text-slate-800">{existing.title}</p>
        )}
        {existing.body && (
          <p className="text-sm text-slate-500 leading-relaxed">{existing.body}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
          Tu calificación *
        </label>
        <ReviewStars rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          Título{" "}
          <span className="text-slate-300 normal-case font-medium text-[10px]">
            (opcional)
          </span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Resumen de tu experiencia..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl
            text-sm text-slate-800 placeholder-slate-300 font-medium
            focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Reseña{" "}
            <span className="text-slate-300 normal-case font-medium">(opcional)</span>
          </label>
          <span className="text-[10px] text-slate-300 font-medium">
            {body.length}/500
          </span>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 500))}
          rows={4}
          placeholder="Cuéntanos más sobre el producto..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl
            text-sm text-slate-800 placeholder-slate-300 font-medium resize-none
            focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          Fotos{" "}
          <span className="text-slate-300 normal-case font-medium">
            (hasta {MAX_IMAGES}, máx {MAX_MB}MB c/u)
          </span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-100 shrink-0"
            >
              <img
                src={img.preview}
                alt=""
                className="w-full h-full object-cover"
              />
              {img.uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                </div>
              )}
              {img.error && (
                <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center p-1">
                  <span className="text-[9px] text-red-500 font-bold text-center leading-tight">
                    {img.error}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 bg-slate-900/70 text-white
                  rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200
                flex flex-col items-center justify-center gap-1 text-slate-400
                hover:border-blue-300 hover:bg-blue-50/40 transition-all shrink-0"
            >
              <ImagePlus size={18} />
              <span className="text-[9px] font-bold">Foto</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            handleFileSelect(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>

      {formError && (
        <p className="text-xs text-red-500 font-bold">{formError}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting" || rating === 0}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black
          text-[10px] tracking-[0.25em] uppercase flex items-center justify-center gap-2
          hover:bg-blue-600 transition-all duration-300 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Publicando...
          </>
        ) : (
          "Publicar reseña"
        )}
      </button>
    </form>
  );
}
