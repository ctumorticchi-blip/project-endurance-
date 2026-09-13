interface PlaceholderPageProps {
  title: string
  description: string
}

/** Temporary stand-in for a feature page not yet built in the current milestone. */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-2 px-4 py-8">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  )
}
