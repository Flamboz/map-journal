"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import StarRating from "../components/StarRating";
import {
  EventDateRangeFields,
  EventDescriptionField,
  EventLabelsField,
  EventNameField,
  EventVisitCompanyField,
} from "../components/EventFormFields";
import { EMPTY_FORM_STATE } from "./mapViewConstants";
import { eventDraftValidationSchema } from "./mapViewHelpers";
import type { EventFormState } from "./mapViewTypes";

type EventDraftFormProps = {
  draftPosition: { lat: number; lng: number } | null;
  isResolvingAddress: boolean;
  draftAddress: string | null;
  saveError: string | null;
  isSaving: boolean;
  labelOptions: string[];
  visitCompanyOptions: string[];
  onCancel: () => void;
  onSave: (formState: EventFormState) => void | Promise<void>;
};

export function EventDraftForm({
  draftPosition,
  isResolvingAddress,
  draftAddress,
  saveError,
  isSaving,
  labelOptions,
  visitCompanyOptions,
  onCancel,
  onSave,
}: EventDraftFormProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(EMPTY_FORM_STATE.rating);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(EMPTY_FORM_STATE.labels);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>(EMPTY_FORM_STATE.photos);
  const [startDateMin, setStartDateMin] = useState<string>(EMPTY_FORM_STATE.startDate);
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<EventFormState>({
    resolver: zodResolver(eventDraftValidationSchema),
    defaultValues: EMPTY_FORM_STATE,
  });

  if (!draftPosition) {
    return null;
  }

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

  return (
    <aside className="absolute right-4 top-4 z-[1100] max-h-[calc(100%-2rem)] w-[min(28rem,calc(100%-2rem))] overflow-auto rounded-lg bg-white p-4 shadow-lg">
      <h2 className="text-lg font-semibold text-slate-900">Create event</h2>
      <p className="mt-1 text-sm text-slate-600">
        {isResolvingAddress
          ? "Resolving address..."
          : draftAddress ?? `Pin at ${draftPosition.lat.toFixed(5)}, ${draftPosition.lng.toFixed(5)}`}
      </p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit(handleValidSubmit)}>
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
          <p className="mb-1 text-sm font-medium text-slate-800">Rating</p>
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

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-photos">
            Photos
          </label>
          <input
            id="event-photos"
            type="file"
            multiple
            accept="image/*"
            onChange={(event) => setSelectedPhotos(event.target.files ? Array.from(event.target.files) : [])}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
      </form>

      {saveError && <p className="mt-3 text-sm text-red-600">{saveError}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit(handleValidSubmit)}
          className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </aside>
  );
}
