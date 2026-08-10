"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type AttachmentUploadModalProps = {
  onAdd: (files: File[]) => void;
  onClose: () => void;
};

export function AttachmentUploadModal({ onAdd, onClose }: AttachmentUploadModalProps) {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    const urls = stagedFiles.map((f) => URL.createObjectURL(f));
    setObjectUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [stagedFiles]);

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const files = items
        .filter((item) => item.kind === "file" && (item.type.startsWith("image/") || item.type.startsWith("video/")))
        .map((item) => {
          const blob = item.getAsFile();
          if (!blob) return null;
          const ext = item.type.split("/")[1] ?? "png";
          return new File([blob], `paste-${Date.now()}.${ext}`, { type: item.type });
        })
        .filter((f): f is File => f !== null);
      if (files.length > 0) {
        setStagedFiles((prev) => [...prev, ...files]);
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setStagedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    setInputKey((k) => k + 1);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
    );
    if (files.length > 0) {
      setStagedFiles((prev) => [...prev, ...files]);
    }
  }

  function handleRemove(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAdd() {
    onAdd(stagedFiles);
    onClose();
  }

  const addLabel =
    stagedFiles.length === 0
      ? "Add files"
      : stagedFiles.length === 1
        ? "Add 1 file"
        : `Add ${stagedFiles.length} files`;

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add attachments"
    >
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-[1401] w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[color:var(--border-soft)] px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Add attachments</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-[color:var(--paper-muted)]"
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <input
            key={inputKey}
            id="attachment-file-input"
            type="file"
            multiple
            accept="image/*,video/*"
            className="sr-only"
            onChange={handleFileInputChange}
          />
          <label
            htmlFor="attachment-file-input"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border-2 border-dashed py-10 transition-colors ${
              isDragOver
                ? "border-[color:var(--accent-primary)] bg-orange-50"
                : "border-[color:var(--border-soft)] bg-[color:var(--paper-muted)] hover:border-[color:var(--accent-primary)] hover:bg-orange-50"
            }`}
          >
            <p className="text-sm font-medium text-slate-700">Drop files here or click to browse</p>
            <p className="-mt-1 text-xs text-slate-500">Ctrl+V to paste from clipboard</p>
          </label>

          {stagedFiles.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {stagedFiles.map((file, index) => {
                const isVideo = file.type.startsWith("video/");
                const url = objectUrls[index];
                return (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-muted)]"
                  >
                    {isVideo ? (
                      <div className="flex h-full w-full items-center justify-center bg-slate-800">
                        <svg aria-hidden="true" className="h-6 w-6 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    ) : url ? (
                      <Image src={url} alt={file.name} fill unoptimized loader={({ src }) => src} className="object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[color:var(--paper-muted)]" />
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => handleRemove(index)}
                      className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <svg aria-hidden="true" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 6l12 12" />
                        <path d="M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[color:var(--border-soft)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[color:var(--paper-muted)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={stagedFiles.length === 0}
            className="rounded-[var(--radius-md)] bg-[color:var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-primary-strong)] disabled:opacity-50"
          >
            {addLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
