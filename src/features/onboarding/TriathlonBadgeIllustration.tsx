/**
 * Purely decorative hero graphic for the onboarding welcome screen — a
 * medal-style badge with a sunburst backdrop and the three disciplines
 * (wave / wheel / motion chevrons) stacked inside. Hand-drawn inline SVG,
 * not a fetched image: this is an offline-first PWA (see
 * `docs/architecture.md`), so a hero graphic can't depend on a network
 * request to a third-party image host, and licensing a stock photo isn't
 * worth it for one welcome screen. `aria-hidden` — the heading right next
 * to it already carries the meaning.
 */
export function TriathlonBadgeIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className="h-40 w-40"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sunburst backdrop */}
      <g opacity="0.16">
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30 * Math.PI) / 180
          const x1 = 100 + Math.cos(angle) * 62
          const y1 = 100 + Math.sin(angle) * 62
          const x2 = 100 + Math.cos(angle) * 96
          const y2 = 100 + Math.sin(angle) * 96
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeWidth="7"
              strokeLinecap="round"
              className={i % 2 === 0 ? 'stroke-primary' : 'stroke-accent'}
            />
          )
        })}
      </g>

      {/* Medal disc */}
      <circle cx="100" cy="100" r="58" className="fill-surface-raised stroke-primary" strokeWidth="3" />
      <circle cx="100" cy="100" r="48" className="fill-surface" />

      {/* Swim — wave */}
      <path
        d="M62 76c6-6 12-6 18 0s12 6 18 0 12-6 18 0 12 6 18 0"
        className="stroke-accent"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bike — wheel */}
      <circle cx="100" cy="100" r="15" className="stroke-primary" strokeWidth="5" fill="none" />
      <circle cx="100" cy="100" r="3" className="fill-primary" />
      <line x1="100" y1="88" x2="100" y2="112" className="stroke-primary" strokeWidth="3" />
      <line x1="88" y1="100" x2="112" y2="100" className="stroke-primary" strokeWidth="3" />

      {/* Run — motion chevrons */}
      <path
        d="M66 128l10-8 10 8M86 128l10-8 10 8M106 128l10-8 10 8"
        className="stroke-accent"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
