import { useState } from 'react'
import { GLOSSARY_ENTRIES } from '@/config/glossary'
import { Field } from '@/shared/components/Field'
import { INPUT_CLASSES } from '@/shared/components/inputStyles'

function matches(entry: { term: string; definition: string }, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return (
    entry.term.toLowerCase().includes(normalized) || entry.definition.toLowerCase().includes(normalized)
  )
}

export function GlossaryPage() {
  const [query, setQuery] = useState('')
  const entries = GLOSSARY_ENTRIES.filter((entry) => matches(entry, query))

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Glossaire</h1>
        <p className="text-sm text-text-muted">
          Les termes techniques utilisés dans tes séances, expliqués simplement.
        </p>
      </div>

      <Field label="Rechercher un terme">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="RPE, seuil, catch-up..."
          className={INPUT_CLASSES}
        />
      </Field>

      {entries.length === 0 ? (
        <p className="text-sm text-text-muted">Aucun terme ne correspond à ta recherche.</p>
      ) : (
        <dl className="flex flex-col gap-3">
          {entries.map((entry) => (
            <div key={entry.term} className="border-b border-border pb-3 last:border-b-0">
              <dt className="text-sm font-semibold">{entry.term}</dt>
              <dd className="mt-1 text-sm text-text-muted">{entry.definition}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
