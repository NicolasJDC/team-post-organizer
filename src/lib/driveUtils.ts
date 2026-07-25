/**
 * Converts Google Drive share/view links to direct image URLs.
 * Supports formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * Non-Drive URLs are returned as-is.
 */
export function toDirectImageUrl(url: string): string {
  // Match /file/d/FILE_ID
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (fileMatch) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }

  // Match open?id=FILE_ID or uc?id=FILE_ID
  const idMatch = url.match(/drive\.google\.com\/(?:open|uc)\?.*id=([^&#]+)/);
  if (idMatch) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }

  return url;
}
