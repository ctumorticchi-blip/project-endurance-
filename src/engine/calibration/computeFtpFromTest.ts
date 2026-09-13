/**
 * Standard 20-minute FTP test: FTP is estimated as 95% of the average
 * power held for 20 minutes — a well-known, documented approximation
 * (not a lab-grade measurement), which is exactly why it's disclosed here
 * rather than presented as a precise physiological reading (brief §34).
 */
const TWENTY_MIN_TEST_FACTOR = 0.95

export function computeFtpFromTwentyMinuteTest(avgWatts: number): number {
  return Math.round(avgWatts * TWENTY_MIN_TEST_FACTOR)
}
