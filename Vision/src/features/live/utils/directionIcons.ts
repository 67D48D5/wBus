// src/features/live/utils/directionIcons.ts

import { ArrowUp, ArrowDown, HelpCircle } from "lucide-react";

/**
 * Get direction icon component based on direction code
 * @param directionCode - Direction code (1 for up, 0 for down, null for unknown)
 * @returns Direction icon component from lucide-react
 */
export function getDirectionIcon(directionCode: number | null) {
  if (directionCode === 1) return ArrowUp;
  if (directionCode === 0) return ArrowDown;
  return HelpCircle;
}
