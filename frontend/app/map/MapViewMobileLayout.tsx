"use client";

import type { ReactNode } from "react";
import type { PlaceSearchResult, MapEvent } from "./api";
import { EventDraftForm } from "./EventDraftForm";
import { LeftSidebar } from "./LeftSidebar";
import type { DraftSaveStatus, EventFormState } from "./mapViewTypes";

type DraftCoordinates = {
  lat: number;
  lng: number;
};

type MapViewMobileLayoutProps = {
  mapCanvas: ReactNode;
  isLeftSidebarOpen: boolean;
  isMobileDraftOpen: boolean;
  draftPosition: DraftCoordinates | null;
  draftAddress: string | null;
  isResolvingAddress: boolean;
  saveError: string | null;
  isSaving: boolean;
  saveStatus: DraftSaveStatus | null;
  hasCreatedEvent: boolean;
  labelOptions: string[];
  visitCompanyOptions: string[];
  onCloseDraft: () => void;
  onCloseSidebar: () => void;
  onCancelDraft: () => void;
  onOpenDraft: () => void;
  onOpenSidebar: () => void;
  onPlaceSelect: (place: PlaceSearchResult) => void;
  onResultClick: (event: MapEvent) => void;
  onResultsLoaded: (events: MapEvent[]) => void;
  onSaveDraft: (formState: EventFormState) => Promise<void>;
};

export function MapViewMobileLayout({
  mapCanvas,
  isLeftSidebarOpen,
  isMobileDraftOpen,
  draftPosition,
  draftAddress,
  isResolvingAddress,
  saveError,
  isSaving,
  saveStatus,
  hasCreatedEvent,
  labelOptions,
  visitCompanyOptions,
  onCloseDraft,
  onCloseSidebar,
  onCancelDraft,
  onOpenDraft,
  onOpenSidebar,
  onPlaceSelect,
  onResultClick,
  onResultsLoaded,
  onSaveDraft,
}: MapViewMobileLayoutProps) {
  return (
    <>
      <button
        type="button"
        className="absolute left-3 top-3 z-[1200] rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow"
        onClick={onOpenSidebar}
      >
        Filters
      </button>

      {draftPosition && !isMobileDraftOpen && (
        <button
          type="button"
          className="absolute right-3 top-3 z-[1200] rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow"
          onClick={onOpenDraft}
        >
          Draft
        </button>
      )}

      {isLeftSidebarOpen && (
        <div className="absolute inset-0 z-[1190] bg-[color:var(--topbar-bg)]/35" onClick={onCloseSidebar} aria-hidden="true" />
      )}

      <div
        className={`absolute left-0 top-0 z-[1200] h-full w-[90%] max-w-[24rem] transition-transform duration-300 ${
          isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile filters drawer"
      >
        <button
          type="button"
          aria-label="Close filters panel"
          title="Close"
          className="absolute right-3 top-3 z-[1210] inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] text-slate-700 transition hover:bg-[color:var(--paper-muted)]"
          onClick={onCloseSidebar}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <LeftSidebar
          labelOptions={labelOptions}
          visitCompanyOptions={visitCompanyOptions}
          onResultsLoaded={onResultsLoaded}
          onResultClick={onResultClick}
        />
      </div>

      <div className="h-full">{mapCanvas}</div>

      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-[1300] h-full w-[90%] max-w-[24rem] transition-transform duration-300 ${
          draftPosition && isMobileDraftOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="pointer-events-auto relative h-full overflow-y-auto rounded-l-[var(--radius-lg)] border-l border-[color:var(--border-soft)] bg-[color:var(--paper-muted)] p-4">
          <button
            type="button"
            aria-label="Close draft panel"
            title="Close"
            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] text-slate-700 transition hover:bg-[color:var(--paper-muted)]"
            onClick={onCloseDraft}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <EventDraftForm
            draftPosition={draftPosition}
            isResolvingAddress={isResolvingAddress}
            draftAddress={draftAddress}
            saveError={saveError}
            isSaving={isSaving}
            saveStatus={saveStatus}
            hasCreatedEvent={hasCreatedEvent}
            labelOptions={labelOptions}
            visitCompanyOptions={visitCompanyOptions}
            onCancel={onCancelDraft}
            onSave={onSaveDraft}
            onPlaceSelect={onPlaceSelect}
          />
        </div>
      </div>
    </>
  );
}
