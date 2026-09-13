import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the bottom navigation and redirects to Today', async () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(await screen.findByText('Aujourd’hui', { selector: 'h1' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument()
  })
})
