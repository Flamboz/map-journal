"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type AttachmentPreviewModalProps = {
  file: File;
  onClose: () => void;
};

export function AttachmentPreviewModal({ file, onClose }: AttachmentPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const isVideo = file.type.startsWith("video/");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!objectUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Attachment preview"
    >
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      <div className="relative z-[1301] w-full max-w-4xl">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 z-[1302] inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white shadow-md hover:bg-black/80"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </button>

        <div className="overflow-hidden rounded-xl bg-black">
          {isVideo ? (
            <video
              src={objectUrl}
              className="max-h-[80vh] w-full object-contain"
              controls
              autoPlay
            />
          ) : (
            <div className="relative h-[80vh]">
              <Image
                src={objectUrl}
                alt={file.name}
                fill
                unoptimized
                loader={({ src }) => src}
                className="object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
