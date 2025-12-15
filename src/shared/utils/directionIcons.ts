// src/shared/utils/directionIcons.ts

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

/**
 * Get direction label in Korean
 * @param directionCode - Direction code (1 for up, 0 for down, null for unknown)
 * @returns Direction label
 */
export function getDirectionLabel(directionCode: number | null): string {
  if (directionCode === 1) return "상행";
  if (directionCode === 0) return "하행";
  return "방향 미상";
}
