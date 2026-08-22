const VIDEO_FILE_EXTENSIONS = new Set(["mp4", "webm", "ogg", "mov", "mkv", "m4v"]);

type MediaDescriptor = {
  url?: string;
  media_type?: "photo" | "video";
  mime_type?: string;
};

export function isVideoMedia(media: MediaDescriptor): boolean {
  if (media.media_type) {
    return media.media_type === "video";
  }

  if (media.mime_type) {
    return media.mime_type.startsWith("video/");
  }

  const extension = media.url?.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_FILE_EXTENSIONS.has(extension);
}

/**
 * Browsers only paint a video frame once one has been decoded, so a bare <video>
 * shows a black box until playback starts. Pointing at a media fragment makes the
 * browser seek to (and render) the first frame while it is still just loading metadata.
 */
export function getVideoPosterSrc(url: string): string {
  return url.includes("#") ? url : `${url}#t=0.1`;
}
