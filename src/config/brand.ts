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
    // Premium / sporty / calm / precise. Kept intentionally small: a
    // full design system arrives in M1.
    background: '#0B0F14',
    surface: '#121821',
    surfaceMuted: '#1A222E',
    primary: '#3DDC97',
    primaryMuted: '#245C43',
    accent: '#4EA1FF',
    text: '#F4F7FA',
    textMuted: '#9AA7B4',
    border: '#26303C',
    warning: '#F2B84B',
    danger: '#F2665C',
  },
  metadata: {
    titleSuffix: ' · Project Endurance',
    themeColor: '#0B0F14',
  },
} as const

export type Brand = typeof brand
