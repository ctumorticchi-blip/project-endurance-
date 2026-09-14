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
    // Premium / sporty / calm / precise.
    background: '#0B0F14',
    surface: '#121821',
    surfaceMuted: '#1A222E',
    surfaceRaised: '#1B2330',
    primary: '#3DDC97',
    primaryMuted: '#245C43',
    accent: '#4EA1FF',
    text: '#F4F7FA',
    textMuted: '#9AA7B4',
    textFaint: '#868E98',
    border: '#26303C',
    borderStrong: '#37455A',
    warning: '#F2B84B',
    danger: '#F2665C',
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
    themeColor: '#0B0F14',
  },
} as const

export type Brand = typeof brand
