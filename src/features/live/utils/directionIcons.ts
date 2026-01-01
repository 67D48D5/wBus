// src/features/live/utils/directionIcons.ts

/**
 * Get direction icon based on direction code
 * @param directionCode - Direction code (1 for up, 0 for down, null for unknown)
 * @returns Direction icon emoji
 */
export function getDirectionIcon(directionCode: number | null): string {
  if (directionCode === 1) return "⬆️";
  if (directionCode === 0) return "⬇️";
  return "❓";
}
