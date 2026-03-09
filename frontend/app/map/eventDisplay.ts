export function getSafeRating(rating?: number | null, max = 10): number {
  return typeof rating === "number" && rating > 0 ? Math.min(max, Math.max(0, rating)) : 0;
}

export function formatRatingText(rating?: number | null): string {
  const safeRating = getSafeRating(rating);
  if (safeRating === 0) {
    return "Not rated";
  }

  return `${safeRating}/10`;
}

export function formatLabelsText(labels?: string[]): string {
  return labels && labels.length > 0 ? labels.join(", ") : "None";
}

export function formatVisitCompanyText(visitCompany?: string): string {
  return visitCompany?.trim() ? visitCompany : "None";
}