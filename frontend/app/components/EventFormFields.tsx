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

type FieldLabelProps = {
  htmlFor?: string;
  text: string;
  required?: boolean;
};

function FieldLabel({ htmlFor, text, required = false }: FieldLabelProps) {
  return (
    <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800" htmlFor={htmlFor}>
      {required && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#d65745]" />}
      <span>{text}</span>
    </label>
  );
}

export function EventNameField({ register, errors }: SharedFieldProps) {
  return (
    <div>
      <FieldLabel htmlFor="event-name" text="Name" required />
      <input
        id="event-name"
        {...register("name")}
        className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-sm text-slate-900"
      />
      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
    </div>
  );
}

export function EventDateRangeFields({ register, errors, startDateMin, onStartDateChange }: DateRangeFieldProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <FieldLabel htmlFor="event-start-date" text="Start date" required />
        <input
          id="event-start-date"
          type="date"
          lang="en-GB"
          {...register("startDate", {
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => onStartDateChange(event.target.value),
          })}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-sm text-slate-900"
        />
        {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
      </div>

      <div>
        <FieldLabel htmlFor="event-end-date" text="End date (optional)" />
        <input
          id="event-end-date"
          type="date"
          lang="en-GB"
          min={startDateMin || undefined}
          {...register("endDate")}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-sm text-slate-900"
        />
        {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>}
      </div>
    </div>
  );
}

export function EventDescriptionField({ register }: Pick<SharedFieldProps, "register">) {
  return (
    <div>
      <FieldLabel htmlFor="event-description" text="Description" />
      <textarea
        id="event-description"
        {...register("description")}
        rows={3}
        onInput={(event) => {
          const textarea = event.currentTarget;
          textarea.style.height = "auto";
          textarea.style.height = `${textarea.scrollHeight}px`;
        }}
        className="min-h-[84px] w-full resize-none overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-sm text-slate-900"
      />
    </div>
  );
}

export function EventLabelsField({ labelOptions, selectedLabels, onLabelsChange }: LabelsFieldProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold tracking-wide text-slate-700">Labels</p>
      <div className="flex flex-wrap gap-2">
        {labelOptions.map((label) => {
          const isActive = selectedLabels.includes(label);

          return (
            <button
              key={label}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                const nextLabels = isActive
                  ? selectedLabels.filter((currentLabel) => currentLabel !== label)
                  : [...selectedLabels, label];
                onLabelsChange(nextLabels);
              }}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                isActive
                  ? "border-[#d98770] bg-[#f8ddcf] text-[#8f3f22]"
                  : "border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] text-slate-700 hover:bg-[color:var(--paper-muted)]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EventVisitCompanyField({ register, visitCompanyOptions }: VisitCompanyFieldProps) {
  return (
    <div>
      <FieldLabel htmlFor="event-visit-company" text="Visit company" />
      <select
        id="event-visit-company"
        {...register("visitCompany")}
        className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-sm text-slate-900"
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