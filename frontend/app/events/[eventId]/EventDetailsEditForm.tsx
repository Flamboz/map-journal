import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { EventVisibilityFields } from "../../components/EventVisibilityFields";
import StarRating from "../../components/StarRating";
import {
  EventDateRangeFields,
  EventDescriptionField,
  EventLabelsField,
  EventNameField,
  EventVisitCompanyField,
} from "../../components/EventFormFields";
import type { EventFormState } from "../../map/mapViewTypes";
import type { EventVisibility } from "../../map/api";

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
  startDateMin: string;
  onStartDateChange: (startDate: string) => void;
  saveError: string | null;
  isSaving: boolean;
  isPhotoActionRunning: boolean;
  userId: string;
  currentUserEmail: string | null;
  visibility: EventVisibility;
  sharedWithEmails: string[];
  onVisibilityChange: (visibility: EventVisibility) => void;
  onSharedWithEmailsChange: (sharedWithEmails: string[]) => void;
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
  startDateMin,
  onStartDateChange,
  saveError,
  isSaving,
  isPhotoActionRunning,
  userId,
  currentUserEmail,
  visibility,
  sharedWithEmails,
  onVisibilityChange,
  onSharedWithEmailsChange,
  onCancel,
  onSubmit,
}: EventDetailsEditFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    onSubmit(e);
  };

  return (
    <form className="space-y-4 rounded-lg border border-gray-200 bg-white p-5" onSubmit={handleSubmit}>
      <EventNameField register={register} errors={errors} />

      <EventDateRangeFields
        register={register}
        errors={errors}
        startDateMin={startDateMin}
        onStartDateChange={onStartDateChange}
      />

      <EventDescriptionField register={register} />

      <div>
        <p className="mb-1 text-sm font-medium text-slate-800">Rating</p>
        <StarRating
          rating={selectedRating}
          hoveredRating={hoveredRating}
          onHoveredRatingChange={setHoveredRating}
          onRatingChange={setSelectedRating}
          allowClear
        />
      </div>

      <EventLabelsField
        labelOptions={labelOptions}
        selectedLabels={selectedLabels}
        onLabelsChange={setSelectedLabels}
      />

      <EventVisitCompanyField register={register} visitCompanyOptions={visitCompanyOptions} />

      <EventVisibilityFields
        userId={userId}
        currentUserEmail={currentUserEmail}
        visibility={visibility}
        sharedWithEmails={sharedWithEmails}
        sharedWithError={errors.sharedWithEmails?.message}
        disabled={isSaving || isPhotoActionRunning}
        onVisibilityChange={onVisibilityChange}
        onSharedWithEmailsChange={onSharedWithEmailsChange}
      />

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
