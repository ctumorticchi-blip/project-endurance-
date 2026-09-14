import type { WorkoutBlock } from '@/core/training/WorkoutBlock'

/** A compact "3 x 8 min · récup 60s" style summary of a block's shape —
 * shared by every screen that lists a session's structure (Today, the
 * Session Player). */
export function formatBlock(block: WorkoutBlock): string {
  const parts: string[] = []
  if (block.repeat && block.repeat > 1) parts.push(`${block.repeat} x`)
  if (block.durationSec) parts.push(`${Math.round(block.durationSec / 60)} min`)
  if (block.distanceMeters) parts.push(`${block.distanceMeters} m`)
  if (block.restSec) parts.push(`récup ${block.restSec}s`)
  return parts.join(' ')
}
