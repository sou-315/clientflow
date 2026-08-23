import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusPill from '../StatusPill'

describe('StatusPill', () => {
  it('renders the status text', () => {
    render(<StatusPill status="Open" />)
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('applies the correct colors for a known status', () => {
    render(<StatusPill status="Won" />)
    const pill = screen.getByText('Won')

    expect(pill).toHaveStyle({ color: '#3C7A4A' })
  })

  it('falls back to the New style for an unrecognized status', () => {
    render(<StatusPill status="SomeUnknownStatus" />)
    const pill = screen.getByText('SomeUnknownStatus')

    // New style colors, per statusStyles.New
    expect(pill).toHaveStyle({ color: '#4B5F5A' })
  })

  it('renders every defined status without crashing', () => {
    const statuses = [
      'Open', 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation',
      'Won', 'Lost', 'Low', 'Medium', 'High', 'Pending', 'In Progress', 'Done',
    ]

    statuses.forEach((status) => {
      const { unmount } = render(<StatusPill status={status} />)
      expect(screen.getByText(status)).toBeInTheDocument()
      unmount()
    })
  })

  it('has the status-pill class for styling hooks', () => {
    render(<StatusPill status="Open" />)
    const pill = screen.getByText('Open')

    expect(pill).toHaveClass('status-pill')
  })
})
