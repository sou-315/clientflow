import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Leads from '../Leads'
import api from '../../api/api'

vi.mock('../../api/api')

const mockLeadsResponse = {
  data: {
    leads: [
      { id: 1, name: 'Acme Corp', email: 'contact@acme.com', phone: null, status: 'New', created_at: '2026-08-20 01:16:16' },
      { id: 2, name: 'Beta Industries', email: 'hello@beta.com', phone: '0796519199', status: 'Qualified', created_at: '2026-08-20 01:16:16' },
    ],
    pagination: { page: 1, limit: 10, total: 2, total_pages: 1 },
  },
}

describe('Leads page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading message while fetching, then renders the leads', async () => {
    api.get.mockResolvedValueOnce(mockLeadsResponse)

    render(<Leads />)

    expect(screen.getByText(/loading leads/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    expect(screen.getByText('Beta Industries')).toBeInTheDocument()
    expect(screen.getByText('2 leads')).toBeInTheDocument()
  })

  it('renders an error message when the API call fails', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'))

    render(<Leads />)

    await waitFor(() => {
      expect(screen.getByText(/could not load leads/i)).toBeInTheDocument()
    })
  })

  it('renders an empty state when there are no leads', async () => {
    api.get.mockResolvedValueOnce({
      data: { leads: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } },
    })

    render(<Leads />)

    await waitFor(() => {
      expect(screen.getByText(/no leads found/i)).toBeInTheDocument()
    })
  })

  it('sends a search param to the API when typing in the search box', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(mockLeadsResponse)

    render(<Leads />)

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())

    const searchInput = screen.getByPlaceholderText(/search by name or email/i)
    await user.type(searchInput, 'Acme')

    await waitFor(() => {
      const lastCall = api.get.mock.calls[api.get.mock.calls.length - 1]
      expect(lastCall[0]).toBe('/leads')
      expect(lastCall[1].params.search).toBe('Acme')
    }, { timeout: 1000 })
  })

  it('sends a status filter param when a status is selected', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(mockLeadsResponse)

    render(<Leads />)

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())

    const statusSelect = screen.getByDisplayValue(/all statuses/i)
    await user.selectOptions(statusSelect, 'Qualified')

    await waitFor(() => {
      const lastCall = api.get.mock.calls[api.get.mock.calls.length - 1]
      expect(lastCall[1].params.status).toBe('Qualified')
    })
  })

  it('resets to page 1 when a filter changes', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({
      data: {
        leads: [mockLeadsResponse.data.leads[0]],
        pagination: { page: 2, limit: 10, total: 15, total_pages: 2 },
      },
    })

    render(<Leads />)

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    const statusSelect = screen.getByDisplayValue(/all statuses/i)
    await user.selectOptions(statusSelect, 'New')

    await waitFor(() => {
      const lastCall = api.get.mock.calls[api.get.mock.calls.length - 1]
      expect(lastCall[1].params.page).toBe(1)
    })
  })

  it('disables the Prev button on the first page', async () => {
    api.get.mockResolvedValueOnce(mockLeadsResponse)

    render(<Leads />)

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())

    const prevButton = screen.getByRole('button', { name: /prev/i })
    expect(prevButton).toBeDisabled()
  })

  it('disables the Next button on the last page', async () => {
    api.get.mockResolvedValueOnce(mockLeadsResponse)

    render(<Leads />)

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())

    const nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeDisabled()
  })

  it('opens the lead detail panel with the correct lead data when a row is clicked', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValueOnce(mockLeadsResponse)

    render(<Leads />)

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())

    await user.click(screen.getByText('Acme Corp'))

    expect(screen.getByText('Lead details')).toBeInTheDocument()

    const panel = document.querySelector('.lead-panel')
    expect(panel).not.toBeNull()
    expect(panel).toHaveTextContent('Acme Corp')
    expect(panel).toHaveTextContent('contact@acme.com')

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  it('closes the lead detail panel when the close button is clicked', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValueOnce(mockLeadsResponse)

    render(<Leads />)

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())

    await user.click(screen.getByText('Acme Corp'))
    expect(screen.getByText('Lead details')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /close/i }))

    await waitFor(() => {
      expect(screen.queryByText('Lead details')).not.toBeInTheDocument()
    })
  })

  it('opens the New Lead modal when the button is clicked', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValueOnce(mockLeadsResponse)

    render(<Leads />)

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /new lead/i }))

    // LeadModal's own content isn't verified here since we don't have that
    // component's source yet — this just confirms the trigger doesn't crash.
  })
})
