"use client";

import type { ReactNode } from "react";
import type { PlaceSearchResult, MapEvent } from "./api";
import { EventDraftForm } from "./EventDraftForm";
import { LeftSidebar } from "./LeftSidebar";
import type { EventFormState } from "./mapViewTypes";

type DraftCoordinates = {
  lat: number;
  lng: number;
};

type MapViewDesktopLayoutProps = {
  mapCanvas: ReactNode;
  labelOptions: string[];
  visitCompanyOptions: string[];
  draftPosition: DraftCoordinates | null;
  draftAddress: string | null;
  isResolvingAddress: boolean;
  saveError: string | null;
  isSaving: boolean;
  onCancelDraft: () => void;
  onPlaceSelect: (place: PlaceSearchResult) => void;
  onResultClick: (event: MapEvent) => void;
  onResultsLoaded: (events: MapEvent[]) => void;
  onSaveDraft: (formState: EventFormState) => Promise<void>;
};

export function MapViewDesktopLayout({
  mapCanvas,
  labelOptions,
  visitCompanyOptions,
  draftPosition,
  draftAddress,
  isResolvingAddress,
  saveError,
  isSaving,
  onCancelDraft,
  onPlaceSelect,
  onResultClick,
  onResultsLoaded,
  onSaveDraft,
}: MapViewDesktopLayoutProps) {
  return (
    <div className="flex h-full">
      <LeftSidebar
        labelOptions={labelOptions}
        visitCompanyOptions={visitCompanyOptions}
        onResultsLoaded={onResultsLoaded}
        onResultClick={onResultClick}
      />

      <div className="h-full flex-1 p-4 lg:p-5">
        <div className="relative h-full overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--border-soft)] shadow-[var(--shadow-soft)]">
          {mapCanvas}
        </div>
      </div>

      <div className="h-full w-[23rem] min-w-[23rem] border-l border-[color:var(--border-soft)] bg-[color:var(--paper-muted)] p-4 lg:w-[26rem] lg:min-w-[26rem]">
        <EventDraftForm
          draftPosition={draftPosition}
          isResolvingAddress={isResolvingAddress}
          draftAddress={draftAddress}
          saveError={saveError}
          isSaving={isSaving}
          labelOptions={labelOptions}
          visitCompanyOptions={visitCompanyOptions}
          onCancel={onCancelDraft}
          onSave={onSaveDraft}
          onPlaceSelect={onPlaceSelect}
        />
      </div>
    </div>
  );
}
