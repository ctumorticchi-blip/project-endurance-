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
    // "Explosif et moderne" rebrand (M1.9, athlete feedback: the Garmin
    // navy/blue read as calm/corporate, not energetic). Deep aubergine
    // ground instead of navy, a vivid coral-orange as the primary
    // brand/action color instead of blue, and a bright teal accent instead
    // of green — same three-surface-tier structure, same text/border
    // roles, only the hues moved. See docs/design-system.md for the full
    // WCAG contrast recalculation behind every value here (nothing was
    // carried over unverified just because a similarly-named token existed
    // before).
    background: '#160F23',
    surface: '#211935',
    surfaceMuted: '#2A2140',
    surfaceRaised: '#2D2444',
    primary: '#FF6B4A',
    primaryMuted: '#B34426',
    accent: '#2FE6B0',
    text: '#FBF7FF',
    textMuted: '#B6A9C9',
    textFaint: '#A093B8',
    border: '#3A2E52',
    borderStrong: '#4E3F6D',
    warning: '#FFC24B',
    danger: '#FF6767',
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
    themeColor: '#160F23',
  },
} as const

export type Brand = typeof brand
