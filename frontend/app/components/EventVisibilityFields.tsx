"use client";

import { useEffect, useState } from "react";
import { lookupShareableUserEmail, type EventVisibility } from "../map/api";
import { useMapAuth } from "../map/MapAuthContext";

type EventVisibilityFieldsProps = {
  authToken?: string | null;
  currentUserEmail?: string | null;
  visibility: EventVisibility;
  sharedWithEmails: string[];
  sharedWithError?: string;
  disabled?: boolean;
  onVisibilityChange: (visibility: EventVisibility) => void;
  onSharedWithEmailsChange: (sharedWithEmails: string[]) => void;
};

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function EventVisibilityFields({
  authToken,
  currentUserEmail,
  visibility,
  sharedWithEmails,
  sharedWithError,
  disabled = false,
  onVisibilityChange,
  onSharedWithEmailsChange,
}: EventVisibilityFieldsProps) {
  const mapAuth = useMapAuth();
  const resolvedAuthToken = authToken ?? mapAuth.authToken;
  const resolvedCurrentUserEmail = currentUserEmail ?? mapAuth.currentUserEmail;
  const [pendingEmail, setPendingEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setAddError(null);
  }, [visibility]);

  async function handleAddRecipient() {
    const normalizedEmail = normalizeEmail(pendingEmail);

    if (!normalizedEmail) {
      setAddError("Enter an email address.");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setAddError("Enter a valid email address.");
      return;
    }

    if (!resolvedAuthToken) {
      setAddError("You need to sign in before sharing events.");
      return;
    }

    if (resolvedCurrentUserEmail && normalizedEmail === normalizeEmail(resolvedCurrentUserEmail)) {
      setAddError("You cannot share an event with your own email.");
      return;
    }

    if (sharedWithEmails.includes(normalizedEmail)) {
      setAddError("That email has already been added.");
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      const existingEmail = await lookupShareableUserEmail(resolvedAuthToken, normalizedEmail);
      if (!existingEmail) {
        setAddError("Only registered users can be added.");
        return;
      }

      onSharedWithEmailsChange([...sharedWithEmails, existingEmail]);
      setPendingEmail("");
    } catch {
      setAddError("Unable to verify that email right now.");
    } finally {
      setIsAdding(false);
    }
  }

  function removeRecipient(emailToRemove: string) {
    onSharedWithEmailsChange(sharedWithEmails.filter((email) => email !== emailToRemove));
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-800" htmlFor="event-visibility">
          Visibility
        </label>
        <select
          id="event-visibility"
          value={visibility}
          onChange={(event) => onVisibilityChange(event.target.value === "share_with" ? "share_with" : "private")}
          disabled={disabled}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-sm text-slate-900"
        >
          <option value="private">Private</option>
          <option value="share_with">Shared</option>
        </select>
      </div>

      {visibility === "share_with" && (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-muted)] p-3">
          <p className="text-sm text-slate-700">Add existing account emails. Shared users can view this event on their map with read-only access.</p>

          <div className="flex gap-2">
            <input
              id="event-share-email"
              type="email"
              value={pendingEmail}
              onChange={(event) => {
                setPendingEmail(event.target.value);
                if (addError) {
                  setAddError(null);
                }
              }}
              disabled={disabled || isAdding}
              placeholder="friend@example.com"
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-sm text-slate-900"
            />
            <button
              type="button"
              onClick={() => void handleAddRecipient()}
              disabled={disabled || isAdding}
              className="rounded-[var(--radius-md)] bg-[color:var(--topbar-bg)] px-4 py-2 text-sm font-semibold text-[color:var(--topbar-text)] transition hover:bg-[color:var(--topbar-ctrl-hover)] disabled:opacity-60"
            >
              {isAdding ? "Adding..." : "Add"}
            </button>
          </div>

          {(sharedWithEmails.length > 0 || addError || sharedWithError) && (
            <div className="space-y-2">
              {sharedWithEmails.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Shared with recipients">
                  {sharedWithEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent-weak)] bg-[color:var(--accent-weak-bg)] px-3 py-1 text-sm text-[color:var(--accent-weak-text)]"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
                        disabled={disabled}
                        className="rounded-full border border-current px-1.5 text-xs"
                        aria-label={`Remove ${email}`}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {addError && <p className="text-sm text-red-600">{addError}</p>}
              {!addError && sharedWithError && <p className="text-sm text-red-600">{sharedWithError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
