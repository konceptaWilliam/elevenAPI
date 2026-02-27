export function sanitizeFileStem(text: string) {
  // Keep Unicode letters/numbers (including Swedish letters) in filenames.
  const stem = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}_-]/gu, "");

  if (!stem) {
    return "audio";
  }

  return stem.slice(0, 64);
}

export function toMp3FileName(text: string) {
  return `${sanitizeFileStem(text)}.mp3`;
}
