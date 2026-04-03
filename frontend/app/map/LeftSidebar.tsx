"use client";

import type { MapEvent } from "./api";
import { EventSearchFilterPanel } from "./EventSearchFilterPanel";

type LeftSidebarProps = {
  labelOptions: string[];
  visitCompanyOptions: string[];
  onResultsLoaded: (events: MapEvent[]) => void;
  onResultClick: (event: MapEvent) => void;
};

export function LeftSidebar({
  labelOptions,
  visitCompanyOptions,
  onResultsLoaded,
  onResultClick,
}: LeftSidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col gap-4 overflow-y-auto bg-[color:var(--paper-muted)] p-4 md:w-[22rem] md:min-w-[22rem] md:border-r md:border-[color:var(--border-soft)] lg:w-[25rem] lg:min-w-[25rem]">
      <EventSearchFilterPanel
        labelOptions={labelOptions}
        visitCompanyOptions={visitCompanyOptions}
        onResultsLoaded={onResultsLoaded}
        onResultClick={onResultClick}
      />
    </aside>
  );
}
