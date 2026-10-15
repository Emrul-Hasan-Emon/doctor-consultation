/** Escapes % _ \ so user input is matched literally inside LIKE/ILIKE. */
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');
