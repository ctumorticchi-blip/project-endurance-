/**
 * Single source of truth for product identity.
 *
 * The commercial name is not finalized yet ("Project Endurance" is an
 * internal codename). Every user-facing string, color, and metadata value
 * must be read from here so the brand can change without touching feature
 * code. Never hardcode the product name in components.
 */

export const brand = {
  name: 'Project Endurance',
  shortName: 'Endurance',
  tagline: 'Ton entraînement s’adapte à ta progression, ta récupération et ta vraie vie.',
  description:
    'Un coach numérique personnel pour sportifs d’endurance : programme adaptatif, explicable, et centré sur ta vraie vie.',
  domainVersion: 1,
  colors: {
    // Sporty / precise, Garmin-inspired: navy-blue ground, blue as the
    // primary brand/action color instead of green. See
    // docs/design-system.md for the contrast math behind every value here.
    background: '#0D1B2A',
    surface: '#142437',
    surfaceMuted: '#1C2E44',
    surfaceRaised: '#1D2F46',
    primary: '#4EA1FF',
    primaryMuted: '#1E5A96',
    accent: '#3DDC97',
    text: '#F2F6F9',
    textMuted: '#9AA7B4',
    textFaint: '#9098A0',
    border: '#2B3F56',
    borderStrong: '#3D5A78',
    warning: '#F2B84B',
    danger: '#F5776D',
  },
  /**
   * A deliberate, network-independent type stack: a humanist sans for
   * clarity at a glance (falls back cleanly if the named face isn't
   * installed — no webfont fetch, no FOUT, no external dependency) and
   * tabular numerals for anything a user reads as a live-updating metric
   * (timers, paces, watts).
   */
  typography: {
    sans: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    numeric: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  /** 4px base scale, named rather than referenced by raw Tailwind numbers
   * wherever spacing carries semantic meaning (card padding, section gaps). */
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
  },
  metadata: {
    titleSuffix: ' · Project Endurance',
    themeColor: '#0D1B2A',
  },
} as const

export type Brand = typeof brand
