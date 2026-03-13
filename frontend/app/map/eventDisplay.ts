export function getSafeRating(rating?: number | null, max = 10): number {
  return typeof rating === "number" && rating > 0 ? Math.min(max, Math.max(0, rating)) : 0;
}