"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AttachmentPreviewModal } from "./AttachmentPreviewModal";
import { AttachmentUploadModal } from "./AttachmentUploadModal";

type AttachmentGridProps = {
  files: File[];
  onChange: (files: File[]) => void;
};

export function AttachmentGrid({ files, onChange }: AttachmentGridProps) {
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [quickInputKey, setQuickInputKey] = useState(0);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setObjectUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function handleQuickUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    onChange([...files, ...Array.from(e.target.files)]);
    setQuickInputKey((k) => k + 1);
  }

  function handleRemove(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <>
      <input
        key={quickInputKey}
        id="attachment-quick-input"
        type="file"
        multiple
        accept="image/*,video/*"
        className="sr-only"
        onChange={handleQuickUpload}
      />

      <div className="grid grid-cols-3 gap-2">
        {files.map((file, index) => {
          const isVideo = file.type.startsWith("video/");
          const url = objectUrls[index];

          return (
            <div
              key={index}
              className="relative aspect-square cursor-pointer overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-muted)]"
              onClick={() => setPreviewFile(file)}
            >
              {isVideo ? (
                <div className="flex h-full w-full items-center justify-center bg-slate-800">
                  <svg aria-hidden="true" className="h-8 w-8 text-white/70" viewBox="0 0 24 24" fill="currentColor">
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <svg
                  aria-hidden="true"
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>
          );
        })}

        <button
          type="button"
          aria-label="Add attachment"
          onClick={() => setIsUploadModalOpen(true)}
          className="aspect-square flex items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] text-slate-500 transition-colors hover:border-[color:var(--accent-primary)] hover:text-[color:var(--accent-primary)]"
        >
          <svg
            aria-hidden="true"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <label
        htmlFor="attachment-quick-input"
        className="mt-1 cursor-pointer text-xs text-[color:var(--accent-primary)] underline underline-offset-2 hover:text-[color:var(--accent-primary-strong)]"
      >
        Quick upload
      </label>

      {previewFile && (
        <AttachmentPreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {isUploadModalOpen && (
        <AttachmentUploadModal
          onAdd={(newFiles) => onChange([...files, ...newFiles])}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </>
  );
}
