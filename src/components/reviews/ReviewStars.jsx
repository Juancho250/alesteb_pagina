import { useState } from "react";
import { Star } from "lucide-react";

const SIZE_PX = { sm: 12, md: 16, lg: 24 };

export default function ReviewStars({
  rating = 0,
  size = "md",
  interactive = false,
  onChange,
}) {
  const [hovered, setHovered] = useState(0);
  const px = SIZE_PX[size] ?? SIZE_PX.md;
  const active = interactive ? hovered || rating : rating;

  if (!interactive) {
    return (
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`${rating} de 5 estrellas`}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={px}
            fill={i <= Math.round(active) ? "currentColor" : "none"}
            className={
              i <= Math.round(active) ? "text-amber-400" : "text-slate-200"
            }
            strokeWidth={1.5}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label="Selecciona una calificación"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} estrella${i > 1 ? "s" : ""}`}
          aria-pressed={rating === i}
          onMouseEnter={() => setHovered(i)}
          onClick={() => onChange?.(i)}
          className="transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
        >
          <Star
            size={px}
            fill={i <= active ? "currentColor" : "none"}
            className={i <= active ? "text-amber-400" : "text-slate-300"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
