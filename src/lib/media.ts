/**
 * Media detection and helper utilities.
 * Supports images (PNG, JPG, WebP, GIF, SVG) and MP4 videos (direct link, Cloudinary, S3, etc.)
 */

export function isVideoUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();

  // Data URI for video
  if (clean.startsWith('data:video/')) return true;

  // Cloudinary video URL pattern
  if (clean.includes('/video/upload/') || clean.includes('/video/authenticated/')) return true;

  // File extension check (ignoring query strings and hash anchors)
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?(#.*)?$/i.test(clean)) return true;

  // URL containing .mp4 anywhere in path
  try {
    const parsed = new URL(clean, 'https://vitalive.space');
    if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(parsed.pathname)) return true;
  } catch {
    // If not a full URL, fallback regex
    if (/\.(mp4|webm|ogg|mov|m4v)/i.test(clean)) return true;
  }

  return false;
}
