import slugifyLib from 'slugify';

/**
 * Generate a unique slug from a title by appending a timestamp.
 * Example: "Introduction Python" -> "introduction-python-1705334567"
 */
export function generateSlug(title: string): string {
  const base = slugifyLib(title, {
    lower: true,
    strict: true,
    trim: true,
  });
  const timestamp = Math.floor(Date.now() / 1000);
  return `${base}-${timestamp}`;
}
