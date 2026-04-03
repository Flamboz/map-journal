"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { searchPlaces, type PlaceSearchResult } from "./api";
import StarRating from "../components/StarRating";
import {
  EventDateRangeFields,
  EventDescriptionField,
  EventLabelsField,
  EventNameField,
  EventVisitCompanyField,
} from "../components/EventFormFields";
import { EventVisibilityFields } from "../components/EventVisibilityFields";
import { EMPTY_FORM_STATE } from "./mapViewConstants";
import { eventDraftValidationSchema } from "./mapViewHelpers";
import type { EventFormState } from "./mapViewTypes";

type EventDraftFormProps = {
  authToken: string | null;
  draftPosition: { lat: number; lng: number } | null;
  isResolvingAddress: boolean;
  draftAddress: string | null;
  saveError: string | null;
  isSaving: boolean;
  currentUserEmail: string | null;
  labelOptions: string[];
  visitCompanyOptions: string[];
  onCancel: () => void;
  onSave: (formState: EventFormState) => void | Promise<void>;
  onPlaceSelect: (place: PlaceSearchResult) => void;
};

export function EventDraftForm({
  authToken,
  draftPosition,
  isResolvingAddress,
  draftAddress,
  saveError,
  isSaving,
  currentUserEmail,
  labelOptions,
  visitCompanyOptions,
  onCancel,
  onSave,
  onPlaceSelect,
}: EventDraftFormProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(EMPTY_FORM_STATE.rating);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(EMPTY_FORM_STATE.labels);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>(EMPTY_FORM_STATE.photos);
  const [startDateMin, setStartDateMin] = useState<string>(EMPTY_FORM_STATE.startDate);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormState>({
    resolver: zodResolver(eventDraftValidationSchema),
    defaultValues: EMPTY_FORM_STATE,
  });
  const visibility = watch("visibility");
  const sharedWithEmails = watch("sharedWithEmails");

  function getTodayLocalDateString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const prevDraftPositionRef = useRef<typeof draftPosition>(null);
  useEffect(() => {
    const prev = prevDraftPositionRef.current;
    
    if (!prev && draftPosition) {
      reset(EMPTY_FORM_STATE);
      setHoveredRating(null);
      setSelectedRating(EMPTY_FORM_STATE.rating);
      setSelectedLabels(EMPTY_FORM_STATE.labels);
      setSelectedPhotos(EMPTY_FORM_STATE.photos);
      setStartDateMin(EMPTY_FORM_STATE.startDate);
      setSearchQuery("");
      setSearchResults([]);
      setSearchError(null);
    }

    prevDraftPositionRef.current = draftPosition;
  }, [draftPosition, reset]);

  useEffect(() => {
    if (!draftPosition) return;

    const today = getTodayLocalDateString();

    const currentStart = getValues("startDate");
    if (!currentStart) {
      setValue("startDate", today, { shouldValidate: true, shouldDirty: true });
    }

    if (!startDateMin) {
      setStartDateMin(today);
    }

  }, [draftPosition, getValues, setValue, startDateMin]);

  function handleCancel() {
    reset(EMPTY_FORM_STATE);
    setHoveredRating(null);
    setSelectedRating(EMPTY_FORM_STATE.rating);
    setSelectedLabels(EMPTY_FORM_STATE.labels);
    setSelectedPhotos(EMPTY_FORM_STATE.photos);
    setStartDateMin(EMPTY_FORM_STATE.startDate);
    onCancel();
  }

  async function handleValidSubmit(values: EventFormState) {
    await onSave({
      ...values,
      rating: selectedRating,
      labels: selectedLabels,
      photos: selectedPhotos,
    });
  }

  async function handlePlaceSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      setSearchResults([]);
      setSearchError("Enter a place to search.");
      return;
    }

    setIsSearchingPlaces(true);
    setSearchError(null);

    try {
      const places = await searchPlaces(normalizedQuery);
      setSearchResults(places);

      if (places.length === 0) {
        setSearchError("No places found.");
      }
    } catch {
      setSearchResults([]);
      setSearchError("Unable to search places right now.");
    } finally {
      setIsSearchingPlaces(false);
    }
  }

  return (
    <section className="paper-card flex h-full min-h-0 flex-col overflow-y-auto p-4">
      <h2 className="text-2xl text-slate-900">New Event</h2>
      <p className="mt-2 inline-flex max-w-full items-center rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-muted)] px-3 py-1 text-sm text-slate-700">
        {draftPosition
          ? isResolvingAddress
            ? "Resolving address..."
            : draftAddress ?? `Pin at ${draftPosition.lat.toFixed(5)}, ${draftPosition.lng.toFixed(5)}`
          : "Click on the map or search a place to start."}
      </p>

      <form className="mt-3" onSubmit={handlePlaceSearch}>
        <div className="relative">
          <div className="flex gap-2">
            <input
              id="event-panel-place-search"
              name="event-panel-place-search"
              type="text"
              value={searchQuery}
              onChange={(searchInputEvent) => {
                setSearchQuery(searchInputEvent.target.value);
                if (searchError) {
                  setSearchError(null);
                }
              }}
              placeholder="City, address, or landmark..."
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-sm text-slate-900"
              aria-label="Search place in event form"
            />
            <button
              type="submit"
              className="rounded-[var(--radius-md)] bg-[color:var(--topbar-bg)] px-4 py-2 text-sm font-semibold text-[color:var(--topbar-text)] transition hover:translate-y-[-1px] hover:bg-[color:var(--topbar-ctrl-hover)] disabled:opacity-60"
              disabled={isSearchingPlaces}
            >
              {isSearchingPlaces ? "..." : "Go"}
            </button>
          </div>

          {searchResults.length > 0 && (
            <ul
              className="absolute left-0 right-0 z-20 mt-2 max-h-44 space-y-2 overflow-y-auto rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] p-2 shadow-[var(--shadow-soft)]"
              aria-label="Event form place search results"
            >
              {searchResults.map((place, placeIndex) => (
                <li key={`${place.displayName}-${place.lat}-${place.lng}-${placeIndex}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onPlaceSelect(place);
                      setSearchResults([]);
                      setSearchError(null);
                    }}
                    className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-left text-sm text-slate-900 transition hover:bg-[color:var(--paper-muted)]"
                  >
                    {place.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>

      {searchError && <p className="mt-2 text-sm text-red-600">{searchError}</p>}

      {draftPosition && (
        <form className="mt-3 space-y-3" onSubmit={handleSubmit(handleValidSubmit)}>
          <EventNameField register={register} errors={errors} />

          <EventDateRangeFields
            register={register}
            errors={errors}
            startDateMin={startDateMin}
            onStartDateChange={(nextStartDate) => {
              setStartDateMin(nextStartDate);
              const currentEndDate = getValues("endDate");

              if (currentEndDate && nextStartDate && currentEndDate < nextStartDate) {
                setValue("endDate", "", { shouldValidate: true, shouldDirty: true });
              }
            }}
          />

          <EventDescriptionField register={register} />

          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-700">Rating</p>
            <StarRating
              rating={selectedRating}
              hoveredRating={hoveredRating}
              onHoveredRatingChange={setHoveredRating}
              onRatingChange={setSelectedRating}
            />
          </div>

          <EventLabelsField
            labelOptions={labelOptions}
            selectedLabels={selectedLabels}
            onLabelsChange={setSelectedLabels}
          />

          <EventVisitCompanyField register={register} visitCompanyOptions={visitCompanyOptions} />

          <EventVisibilityFields
            authToken={authToken}
            currentUserEmail={currentUserEmail}
            visibility={visibility}
            sharedWithEmails={sharedWithEmails}
            sharedWithError={errors.sharedWithEmails?.message}
            disabled={isSaving}
            onVisibilityChange={(nextVisibility) =>
              setValue("visibility", nextVisibility, { shouldDirty: true, shouldValidate: true })
            }
            onSharedWithEmailsChange={(nextSharedWithEmails) =>
              setValue("sharedWithEmails", nextSharedWithEmails, { shouldDirty: true, shouldValidate: true })
            }
          />

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800" htmlFor="event-photos">
              Attachments (photos and videos)
            </label>
            <input
              id="event-photos"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(event) => setSelectedPhotos(event.target.files ? Array.from(event.target.files) : [])}
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-sm text-slate-900"
            />
          </div>
        </form>
      )}

      {saveError && <p className="mt-3 text-sm text-red-600">{saveError}</p>}

      {draftPosition && (
        <div className="mt-4 flex justify-end gap-2 border-t border-[color:var(--border-soft)] pt-3">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[color:var(--paper-muted)]"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(handleValidSubmit)}
            className="rounded-[var(--radius-md)] bg-[color:var(--accent-primary)] px-6 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-[color:var(--accent-primary-strong)] hover:shadow-[0_10px_24px_rgba(180,72,42,0.35)] disabled:opacity-60"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Event"}
          </button>
        </div>
      )}
    </section>
  );
}
