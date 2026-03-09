import type React from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { EventFormState } from "../map/mapViewTypes";

type SharedFieldProps = {
  register: UseFormRegister<EventFormState>;
  errors: FieldErrors<EventFormState>;
};

type DateRangeFieldProps = SharedFieldProps & {
  startDateMin: string;
  onStartDateChange: (startDate: string) => void;
};

type LabelsFieldProps = {
  labelOptions: string[];
  selectedLabels: string[];
  onLabelsChange: (labels: string[]) => void;
};

type VisitCompanyFieldProps = {
  register: UseFormRegister<EventFormState>;
  visitCompanyOptions: string[];
};

export function EventNameField({ register, errors }: SharedFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-name">
        Name *
      </label>
      <input id="event-name" {...register("name")} className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
    </div>
  );
}

export function EventDateRangeFields({ register, errors, startDateMin, onStartDateChange }: DateRangeFieldProps) {
  return (
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
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => onStartDateChange(event.target.value),
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
  );
}

export function EventDescriptionField({ register }: Pick<SharedFieldProps, "register">) {
  return (
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
  );
}

export function EventLabelsField({ labelOptions, selectedLabels, onLabelsChange }: LabelsFieldProps) {
  return (
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
                  onLabelsChange(nextLabels);
                }}
              />
              {label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function EventVisitCompanyField({ register, visitCompanyOptions }: VisitCompanyFieldProps) {
  return (
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
  );
}