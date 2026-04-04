import type { MapEventPhoto } from "../../map/api";

type EventDetailsMediaFallbackProps = {
  photos: MapEventPhoto[];
};

export default function EventDetailsMediaFallback({ photos }: EventDetailsMediaFallbackProps) {
  if (photos.length === 0) {
    return (
      <div className="h-72 rounded-2xl bg-[color:var(--empty-bg)] shadow-inner md:h-96 lg:h-[360px]">
        <div className="flex h-full items-center justify-center text-sm text-gray-600">No attachments available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading attachments">
      <div className="h-72 rounded-2xl bg-slate-100 shadow-sm md:h-96 lg:h-[360px]" />
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-slate-100" />
        <div className="h-4 w-36 rounded bg-slate-100" />
      </div>
    </div>
  );
}
