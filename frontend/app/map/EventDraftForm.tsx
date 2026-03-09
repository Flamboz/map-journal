"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import StarRating from "../components/StarRating";
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
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-name">
            Name *
          </label>
          <input
            id="event-name"
            {...register("name")}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-start-date">
              Date *
            </label>
            <input
              id="event-start-date"
              type="date"
              lang="en-GB"
              {...register("startDate", {
                onChange: (event) => {
                  const nextStartDate = event.target.value;
                  setStartDateMin(nextStartDate);
                  const currentEndDate = getValues("endDate");

                  if (currentEndDate && nextStartDate && currentEndDate < nextStartDate) {
                    setValue("endDate", "", { shouldValidate: true, shouldDirty: true });
                  }
                },
              })}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-end-date">
              End date (optional)
            </label>
            <input
              id="event-end-date"
              type="date"
              lang="en-GB"
              min={startDateMin || undefined}
              {...register("endDate")}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-description">
            Description
          </label>
          <textarea
            id="event-description"
            {...register("description")}
            rows={3}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-slate-800">Rating</p>
          <StarRating
            rating={selectedRating}
            hoveredRating={hoveredRating}
            onHoveredRatingChange={setHoveredRating}
            onRatingChange={setSelectedRating}
          />
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-slate-800">Labels</p>
          <div className="grid grid-cols-2 gap-2">
            {labelOptions.map((label) => {
              const isChecked = selectedLabels.includes(label);

              return (
                <label key={label} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(event) => {
                      const nextLabels = event.target.checked
                        ? [...selectedLabels, label]
                        : selectedLabels.filter((currentLabel) => currentLabel !== label);
                      setSelectedLabels(nextLabels);
                    }}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-visit-company">
            Visit company
          </label>
          <select
            id="event-visit-company"
            {...register("visitCompany")}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Select</option>
            {visitCompanyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

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
