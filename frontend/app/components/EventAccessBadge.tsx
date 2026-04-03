import type { MapEvent } from "../map/api";

type EventAccessBadgeProps = {
  event: Pick<MapEvent, "accessLevel" | "ownerEmail">;
};

export function EventAccessBadge({ event }: EventAccessBadgeProps) {
  if (event.accessLevel === "shared") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
        {event.ownerEmail ? `Shared by ${event.ownerEmail}` : "Shared"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
      Owned
    </span>
  );
}
