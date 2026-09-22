/**
 * Automatically converts human-viewable cloud links (Google Drive, Dropbox)
 * into direct raw file streaming URLs for HTML5 <video> elements.
 *
 * Supported Google Drive formats:
 *   https://drive.google.com/file/d/FILE_ID/view
 *   https://drive.google.com/file/d/FILE_ID/preview
 *   https://drive.google.com/open?id=FILE_ID&usp=drive_copy   ← paste format
 *   https://drive.google.com/uc?id=FILE_ID
 *
 * Bandwidth: videos that have been compressed and committed to
 * `public/videos/<driveId>.mp4` (see `scripts/compress-videos.sh`) are served
 * as static files from the CDN instead of being proxied byte-by-byte through
 * the `/api/video/stream` serverless function. Any Drive ID that is not in the
 * manifest still falls back to the proxy, so new CMS uploads keep working.
 */

import localVideos from "@/../public/videos/manifest.json";

const LOCAL_VIDEO_IDS = new Set<string>(localVideos as string[]);

/**
 * Optional external host for the compressed media (e.g. a Cloudflare R2 bucket
 * with the contents of `public/videos/` uploaded to it). When set, video bytes
 * are served from there instead of the site's own CDN, so they don't count
 * against the site host's bandwidth at all.
 *   NEXT_PUBLIC_MEDIA_BASE_URL=https://media.example.com
 */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "").replace(/\/$/, "");

/** Extract the raw Drive file ID from any Google Drive URL */
export function extractDriveId(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();

  // Already resolved to a static file: [MEDIA_BASE]/videos/FILE_ID.mp4
  const localMatch = trimmed.match(/\/videos\/([a-zA-Z0-9_-]+)\.mp4$/);
  if (localMatch?.[1]) return localMatch[1];

  if (!trimmed.includes("drive.google.com") && !trimmed.includes("/api/video/stream")) return undefined;

  // Already a stream proxy URL: /api/video/stream?id=FILE_ID
  const proxyMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (proxyMatch?.[1]) return proxyMatch[1];

  // /file/d/FILE_ID/...
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch?.[1]) return fileMatch[1];

  return undefined;
}

/** Static path for a Drive ID if a compressed copy is bundled, else undefined */
export function getLocalVideoPath(driveId?: string): string | undefined {
  if (!driveId) return undefined;
  return LOCAL_VIDEO_IDS.has(driveId) ? `${MEDIA_BASE}/videos/${driveId}.mp4` : undefined;
}

/** Poster image (WebP, first frame) for a bundled video, else undefined */
export function getLocalPosterPath(driveId?: string): string | undefined {
  if (!driveId) return undefined;
  return LOCAL_VIDEO_IDS.has(driveId) ? `${MEDIA_BASE}/videos/posters/${driveId}.webp` : undefined;
}

/** Returns the cheapest streaming URL for use in HTML5 <video> */
export function getDirectVideoUrl(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  // 1. Google Drive → compressed static copy if we have one, otherwise the proxy
  if (trimmed.includes("drive.google.com")) {
    const id = extractDriveId(trimmed);
    if (id) return getLocalVideoPath(id) ?? `/api/video/stream?id=${id}`;
  }

  // 2. Dropbox
  if (trimmed.includes("dropbox.com")) {
    return trimmed.replace(/[?&]dl=0/, "?raw=1").replace(/[?&]dl=1/, "?raw=1");
  }

  return trimmed;
}

/**
 * Returns the Google Drive iframe embed URL (loads instantly in browser,
 * no server proxy needed — best for lightbox playback).
 */
export function getDriveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Returns a direct image URL for use in HTML5 <img>, supporting Google Drive.
 * Drive's `uc?export=view` serves the original upload untouched (often multi-MB);
 * the thumbnail endpoint returns a server-resized JPEG instead.
 */
export function getDirectImageUrl(url?: string, width = 1200): string {
  if (!url) return "";
  const trimmed = url.trim();

  if (trimmed.includes("drive.google.com")) {
    const fileId = extractDriveId(trimmed);
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
    }
  }
  return trimmed;
}
