/** 'General Medicine & Care' -> 'general-medicine-care' (lowercase letters, digits, hyphen). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
