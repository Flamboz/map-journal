type DeleteEventConfirmationModalProps = {
  isDeletingEvent: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteEventConfirmationModal({
  isDeletingEvent,
  onCancel,
  onConfirm,
}: DeleteEventConfirmationModalProps) {
  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Delete event confirmation"
    >
      <button
        type="button"
        aria-label="Close delete confirmation backdrop"
        onClick={onCancel}
        className="absolute inset-0 bg-black/70"
      />

      <div className="relative z-[1301] w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">Delete event?</h2>
        <p className="mt-2 text-sm text-gray-600">This will permanently delete the event and all associated photos.</p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeletingEvent}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeletingEvent}
            className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeletingEvent ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
