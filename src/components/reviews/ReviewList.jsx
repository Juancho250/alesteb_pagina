import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import api from "../../services/api";
import ReviewCard from "./ReviewCard";

const SORT_OPTIONS = [
  { value: "recent", label: "Más reciente" },
  { value: "helpful", label: "Más útil" },
  { value: "highest", label: "Mayor calificación" },
  { value: "lowest", label: "Menor calificación" },
];

const LIMIT = 5;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function extractReviews(data) {
  const d = data?.data ?? data;
  if (Array.isArray(d)) return d;
  return (
    d?.reviews ??
    d?.items ??
    d?.rows ??
    []
  );
}

function extractTotal(data) {
  const d = data?.data ?? data;
  return (
    d?.pagination?.total ??
    d?.pagination?.totalItems ??
    d?.total ??
    d?.count ??
    0
  );
}

export default function ReviewList({
  productId,
  currentUserId,
  refreshKey = 0,
  onDeleteReview,
}) {
  const [reviews, setReviews] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState("recent");
  const [filterStar, setFilterStar] = useState(null);
  const [onlyVerified, setOnlyVerified] = useState(false);

  const countRef = useRef(0);
  const pageRef = useRef(1);

  const fetchReviews = async (pageNum, replace = false) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams({ page: pageNum, limit: LIMIT, sort });
    if (filterStar) params.set("rating", filterStar);
    if (onlyVerified) params.set("verified", "true");

    try {
      const { data } = await api.get(
        `/products/${productId}/reviews?${params}`
      );
      const items = extractReviews(data);
      const total = Number(extractTotal(data));

      if (replace) {
        countRef.current = items.length;
        setReviews(items);
      } else {
        countRef.current += items.length;
        setReviews((prev) => [...prev, ...items]);
      }
      pageRef.current = pageNum;
      setHasMore(items.length > 0 && countRef.current < total);
    } catch {
      if (replace) setReviews([]);
    } finally {
      if (replace) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    countRef.current = 0;
    pageRef.current = 1;
    setFilterStar(null);
    fetchReviews(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, refreshKey]);

  useEffect(() => {
    countRef.current = 0;
    pageRef.current = 1;
    fetchReviews(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, filterStar, onlyVerified]);

  const loadMore = () => fetchReviews(pageRef.current + 1, false);

  const handleDelete = (id) => {
    setReviews((prev) => {
      const next = prev.filter((r) => r.id !== id);
      countRef.current = next.length;
      return next;
    });
    onDeleteReview?.();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Ordenar
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-100
              rounded-xl px-3 py-2 focus:outline-none focus:border-blue-300 transition-colors"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() =>
                setFilterStar((prev) => (prev === star ? null : star))
              }
              className={`flex items-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-black
                transition-all active:scale-95
                ${filterStar === star
                  ? "bg-amber-400 text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
                }`}
            >
              {star}★
            </button>
          ))}

          <button
            onClick={() => setOnlyVerified((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black
              transition-all active:scale-95
              ${onlyVerified
                ? "bg-emerald-500 text-white"
                : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
              }`}
          >
            Solo verificadas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-300" size={24} />
        </div>
      ) : reviews.length === 0 ? (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-3 py-12 text-center"
        >
          <span className="text-4xl">✍️</span>
          <p className="text-sm font-black text-slate-400">
            {filterStar || onlyVerified
              ? "No hay reseñas con ese filtro"
              : "Sé el primero en reseñar este producto"}
          </p>
          {(filterStar || onlyVerified) && (
            <button
              onClick={() => {
                setFilterStar(null);
                setOnlyVerified(false);
              }}
              className="text-[11px] font-black text-blue-600 hover:text-blue-700 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <ReviewCard
                review={review}
                currentUserId={currentUserId}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100
              border border-slate-100 rounded-2xl text-[11px] font-black text-slate-600
              uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            {loadingMore && <Loader2 size={13} className="animate-spin" />}
            {loadingMore ? "Cargando..." : "Cargar más"}
          </button>
        </div>
      )}
    </div>
  );
}
