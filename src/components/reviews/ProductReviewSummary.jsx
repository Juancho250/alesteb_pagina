import { useEffect, useState } from "react";
import { Star, ShieldCheck } from "lucide-react";
import api from "../../services/api";
import ReviewStars from "./ReviewStars";

function extractSummary(payload) {
  const d = payload?.data ?? payload;
  return {
    average:
      d?.summary?.average ??
      d?.average_rating ??
      d?.average ??
      d?.rating_average ??
      null,
    total:
      d?.summary?.total ??
      d?.pagination?.total ??
      d?.pagination?.totalItems ??
      d?.total ??
      d?.count ??
      null,
    verifiedCount:
      d?.summary?.verified_count ?? d?.verified_count ?? null,
    distribution:
      d?.summary?.distribution ??
      d?.distribution ??
      d?.rating_distribution ??
      null,
  };
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex items-center gap-4">
        <div className="h-12 w-16 bg-slate-100 rounded-2xl" />
        <div className="space-y-2">
          <div className="h-2.5 w-28 bg-slate-100 rounded-full" />
          <div className="h-2 w-20 bg-slate-100 rounded-full" />
        </div>
      </div>
      {[5, 4, 3, 2, 1].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-4 bg-slate-100 rounded-full" />
          <div className="h-1.5 flex-1 bg-slate-100 rounded-full" />
          <div className="h-2 w-4 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function ProductReviewSummary({
  productId,
  compact = false,
  refreshKey = 0,
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    let alive = true;
    setLoading(true);

    api
      .get(`/products/${productId}/reviews?limit=1`)
      .then(({ data }) => {
        if (!alive) return;
        setSummary(extractSummary(data));
      })
      .catch(() => {
        if (alive) setSummary(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [productId, refreshKey]);

  if (compact) {
    if (loading || !summary?.average || !summary?.total) return null;
    return (
      <p className="text-[11px] font-bold text-slate-400 mt-1 leading-none">
        <span className="text-amber-400">★</span>{" "}
        {Number(summary.average).toFixed(1)}
        <span className="text-slate-300"> ({summary.total})</span>
      </p>
    );
  }

  if (loading) return <Skeleton />;

  const { average, total, verifiedCount, distribution } = summary ?? {};
  if (!total || total === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="text-3xl">⭐</span>
        <p className="text-sm font-black text-slate-400">Sin reseñas aún</p>
        <p className="text-xs text-slate-300">
          Sé el primero en opinar sobre este producto
        </p>
      </div>
    );
  }

  const maxDist = distribution
    ? Math.max(...Object.values(distribution).map(Number), 1)
    : 1;

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
      <div className="flex flex-col items-center gap-2 min-w-[90px]">
        <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
          {average != null ? Number(average).toFixed(1) : "—"}
        </span>
        <ReviewStars rating={Math.round(average ?? 0)} size="sm" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
          {total} reseñas
        </span>
        {verifiedCount > 0 && (
          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
            <ShieldCheck size={9} /> {verifiedCount} verificadas
          </span>
        )}
      </div>

      {distribution && (
        <div className="flex-1 space-y-2 w-full">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = Number(distribution[star] ?? 0);
            const pct = (count / maxDist) * 100;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 w-3 text-right shrink-0">
                  {star}
                </span>
                <Star
                  size={9}
                  className="text-amber-400 shrink-0"
                  fill="currentColor"
                  strokeWidth={0}
                />
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-slate-400 w-4 text-right shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
