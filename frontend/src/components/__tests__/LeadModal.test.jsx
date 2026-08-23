import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LeadModal from '../LeadModal'
import api from '../../api/api'

vi.mock('../../api/api')

describe('LeadModal — form validation edge cases', () => {
  const onClose = vi.fn()
  const onSaved = vi.fn()

  beforeEach(() => {
    // resetAllMocks (not clearAllMocks) also clears queued
    // mockResolvedValueOnce/mockRejectedValueOnce implementations,
    // preventing leftover values from leaking into the next test.
    vi.resetAllMocks()
  })

  it('shows a client-side error when submitting with an empty name', async () => {
    const user = userEvent.setup()
    render(<LeadModal onClose={onClose} onSaved={onSaved} />)

    await user.click(screen.getByRole('button', { name: /create lead/i }))

    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('shows a client-side error when the name is only whitespace', async () => {
    const user = userEvent.setup()
    render(<LeadModal onClose={onClose} onSaved={onSaved} />)

    await user.type(screen.getByLabelText('Name'), '   ')
    await user.click(screen.getByRole('button', { name: /create lead/i }))

    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('surfaces the backend validation error for an invalid email format', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValueOnce({
      response: { data: { error: 'Invalid email format.' } },
    })

    render(<LeadModal onClose={onClose} onSaved={onSaved} />)

    await user.type(screen.getByLabelText('Name'), 'Acme Corp')
    // Uses a value that passes the browser's native type="email" constraint
    // (so the submit actually reaches our React handler) but is still the
    // kind of thing the backend's stricter filter_var() check would reject.
    await user.type(screen.getByLabelText('Email'), 'bad@email')
    await user.click(screen.getByRole('button', { name: /create lead/i }))

    expect(await screen.findByText('Invalid email format.')).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('shows a generic fallback error when the backend gives no error message', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValueOnce(new Error('Network Error'))

    render(<LeadModal onClose={onClose} onSaved={onSaved} />)

    await user.type(screen.getByLabelText('Name'), 'Acme Corp')
    await user.click(screen.getByRole('button', { name: /create lead/i }))

    expect(await screen.findByText('Could not save lead. Please try again.')).toBeInTheDocument()
  })

  it('submits successfully with just a name (email and phone are optional)', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValueOnce({ data: { message: 'Lead created successfully.', lead_id: 1 } })

    render(<LeadModal onClose={onClose} onSaved={onSaved} />)

    await user.type(screen.getByLabelText('Name'), 'Acme Corp')
    await user.click(screen.getByRole('button', { name: /create lead/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/leads', {
        name: 'Acme Corp',
        email: '',
        phone: '',
        status: 'New',
      })
    })

    expect(onSaved).toHaveBeenCalled()
  })

  it('disables the submit button and shows "Creating..." while the request is in flight', async () => {
    const user = userEvent.setup()
    let resolvePromise
    api.post.mockReturnValueOnce(new Promise((resolve) => { resolvePromise = resolve }))

    render(<LeadModal onClose={onClose} onSaved={onSaved} />)

    await user.type(screen.getByLabelText('Name'), 'Acme Corp')
    await user.click(screen.getByRole('button', { name: /create lead/i }))

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()

    resolvePromise({ data: { lead_id: 1 } })
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
  })

  it('closes the modal when the Cancel button is clicked, without saving', async () => {
    const user = userEvent.setup()
    render(<LeadModal onClose={onClose} onSaved={onSaved} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalled()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('closes the modal when the Escape key is pressed', async () => {
    const user = userEvent.setup()
    render(<LeadModal onClose={onClose} onSaved={onSaved} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })

  it('closes the modal when clicking the close (X) button', async () => {
    const user = userEvent.setup()
    render(<LeadModal onClose={onClose} onSaved={onSaved} />)

    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('does not close the modal when clicking inside the modal content', async () => {
    const user = userEvent.setup()
    render(<LeadModal onClose={onClose} onSaved={onSaved} />)

    await user.click(screen.getByText('New lead'))

    expect(onClose).not.toHaveBeenCalled()
  })
})
