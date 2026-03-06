import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { EventFormState } from "../../map/mapViewTypes";

type EventDetailsEditFormProps = {
  register: UseFormRegister<EventFormState>;
  errors: FieldErrors<EventFormState>;
  labelOptions: string[];
  visitCompanyOptions: string[];
  selectedLabels: string[];
  setSelectedLabels: (labels: string[]) => void;
  selectedRating: number | null;
  setSelectedRating: (rating: number | null) => void;
  hoveredRating: number | null;
  setHoveredRating: (rating: number | null) => void;
  saveError: string | null;
  isSaving: boolean;
  isPhotoActionRunning: boolean;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function EventDetailsEditForm({
  register,
  errors,
  labelOptions,
  visitCompanyOptions,
  selectedLabels,
  setSelectedLabels,
  selectedRating,
  setSelectedRating,
  hoveredRating,
  setHoveredRating,
  saveError,
  isSaving,
  isPhotoActionRunning,
  onCancel,
  onSubmit,
}: EventDetailsEditFormProps) {
  return (
    <form className="space-y-4 rounded-lg border border-gray-200 bg-white p-5" onSubmit={onSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-name">
          Name *
        </label>
        <input id="event-name" {...register("name")} className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900" />
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
            {...register("startDate")}
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
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 10 }).map((_, index) => {
            const value = index + 1;
            const activeRating = hoveredRating ?? selectedRating ?? 0;
            const isActive = value <= activeRating;

            return (
              <button
                key={value}
                type="button"
                aria-label={`Set rating to ${value}`}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(null)}
                onClick={() => setSelectedRating(value)}
                className={`text-xl leading-none ${isActive ? "text-yellow-400" : "text-slate-300"}`}
              >
                ★
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSelectedRating(null)}
            className="ml-2 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
          >
            Clear
          </button>
        </div>
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
                  onChange={(nextEvent) => {
                    const nextLabels = nextEvent.target.checked
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

      {saveError && <p className="text-sm text-red-600">{saveError}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving || isPhotoActionRunning}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || isPhotoActionRunning}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
