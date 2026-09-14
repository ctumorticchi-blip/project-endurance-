import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'
import { Card } from './Card'
import { Field } from './Field'
import { StatTile } from './StatTile'

describe('Card', () => {
  it('renders as a div by default', () => {
    const { container } = render(<Card>content</Card>)
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('renders as an li when used inside a list', () => {
    render(
      <ul>
        <Card as="li">row</Card>
      </ul>,
    )
    expect(screen.getByRole('listitem')).toHaveTextContent('row')
  })
})

describe('Badge', () => {
  it('renders its text content', () => {
    render(<Badge>Clé</Badge>)
    expect(screen.getByText('Clé')).toBeInTheDocument()
  })
})

describe('StatTile', () => {
  it('renders label, value and optional hint', () => {
    render(<StatTile label="Séances" value="12" hint="ce mois-ci" />)
    expect(screen.getByText('Séances')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('ce mois-ci')).toBeInTheDocument()
  })
})

describe('Field', () => {
  it('associates its label with the child input via native label wrapping', () => {
    render(
      <Field label="Durée (minutes)">
        <input type="number" />
      </Field>,
    )
    expect(screen.getByLabelText('Durée (minutes)')).toBeInTheDocument()
  })
})
