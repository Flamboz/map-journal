"use client";

type StarRatingProps = {
  rating?: number | null;
  max?: number;
  ariaLabel?: string;
  className?: string;
  showNumericValue?: boolean;
  numericClassName?: string;
  onRatingChange?: (rating: number | null) => void;
  hoveredRating?: number | null;
  onHoveredRatingChange?: (rating: number | null) => void;
  allowClear?: boolean;
  clearLabel?: string;
};

function getSafeRating(rating: number | null | undefined, max: number): number {
  if (typeof rating !== "number" || rating <= 0) {
    return 0;
  }

  return Math.min(max, Math.max(0, Math.round(rating)));
}

export default function StarRating({
  rating,
  max = 10,
  ariaLabel = "Event rating",
  className,
  showNumericValue = false,
  numericClassName,
  onRatingChange,
  hoveredRating,
  onHoveredRatingChange,
  allowClear = false,
  clearLabel = "Clear",
}: StarRatingProps) {
  const safeRating = getSafeRating(rating, max);
  const isInteractive = typeof onRatingChange === "function";
  const activeRating = isInteractive ? getSafeRating(hoveredRating ?? safeRating, max) : safeRating;
  const handleStarRowMouseLeave = isInteractive ? () => onHoveredRatingChange?.(null) : undefined;

  return (
    <div aria-label={ariaLabel} className={className}>
      <div className="flex flex-wrap items-center gap-1" onMouseLeave={handleStarRowMouseLeave}>
        {Array.from({ length: max }).map((_, index) => {
          const value = index + 1;
          const isActive = value <= activeRating;
          const starClassName = `text-2xl leading-none transition ${
            isActive ? "scale-105 text-[#e9a52f]" : "text-slate-300"
          }`;

          if (!isInteractive) {
            return (
              <span key={value} className={starClassName}>
                {isActive ? "★" : "☆"}
              </span>
            );
          }

          return (
            <button
              key={value}
              type="button"
              aria-label={`Set rating to ${value}`}
              onMouseEnter={() => onHoveredRatingChange?.(value)}
              onClick={() => onRatingChange(value)}
              className={`${starClassName} rounded-sm px-0.5 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d28d28]/50`}
            >
              ★
            </button>
          );
        })}

        {isInteractive && allowClear && (
          <button
            type="button"
            onClick={() => onRatingChange(null)}
            className="ml-2 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
          >
            {clearLabel}
          </button>
        )}
      </div>

      {showNumericValue && <span className={numericClassName}>({safeRating}/10)</span>}
    </div>
  );
}
