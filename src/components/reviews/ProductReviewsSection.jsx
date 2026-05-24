import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import ProductReviewSummary from "./ProductReviewSummary";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function ProductReviewsSection({ productId, productName }) {
  const { user } = useAuth();

  // refreshKey triggers full re-fetch of summary + list (after create)
  const [refreshKey, setRefreshKey] = useState(0);
  // summaryKey triggers only summary re-fetch (after delete from list)
  const [summaryKey, setSummaryKey] = useState(0);

  const refreshAll = () => setRefreshKey((k) => k + 1);
  const refreshSummary = () => setSummaryKey((k) => k + 1);

  if (!productId) return null;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="mt-20 pt-16 border-t border-slate-100"
      aria-label="Reseñas del producto"
    >
      <div className="mb-10">
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
          Reseñas
        </span>
        <h2 className="mt-3 text-2xl font-black text-slate-900 tracking-tighter">
          ¿Qué dicen nuestros clientes?
        </h2>
        {productName && (
          <p className="mt-1 text-sm text-slate-400 font-medium">{productName}</p>
        )}
      </div>

      <div className="mb-10">
        <ProductReviewSummary
          productId={productId}
          refreshKey={`${refreshKey}-${summaryKey}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16">
        <div className="lg:col-span-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">
            Deja tu opinión
          </p>
          <ReviewForm
            productId={productId}
            productName={productName}
            onSuccess={refreshAll}
          />
        </div>

        <div className="lg:col-span-6">
          <ReviewList
            productId={productId}
            currentUserId={user?.id}
            refreshKey={refreshKey}
            onDeleteReview={refreshSummary}
          />
        </div>
      </div>
    </motion.section>
  );
}
