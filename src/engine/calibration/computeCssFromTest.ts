/**
 * Critical Swim Speed from a two-distance time trial (typically 400m then
 * 200m, swum on the same session with rest between): the pace over the
 * "extra" distance between the two swims approximates the pace an athlete
 * can sustain indefinitely. Standard, documented, coarse — not a lab test.
 */
export function computeCssSecPer100m(
  longerDistanceM: number,
  longerTimeSec: number,
  shorterDistanceM: number,
  shorterTimeSec: number,
): number {
  const distanceDiff = longerDistanceM - shorterDistanceM
  const timeDiff = longerTimeSec - shorterTimeSec
  if (distanceDiff <= 0 || timeDiff <= 0) {
    throw new Error('The longer swim must cover more distance in more time than the shorter one')
  }
  return Math.round((timeDiff / distanceDiff) * 100)
}
