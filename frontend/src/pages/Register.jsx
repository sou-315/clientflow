import { useState } from 'react'
import api from '../api/api'
import './Login.css'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/register', { name, email, password })
      setSuccess(true)
    } catch (err) {
      const message = err.response?.data?.error || 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-branding">
        <div className="auth-logo">
          <span className="logo-white">Client</span>
          <span className="logo-green">Flow</span>
        </div>
        <p className="auth-tagline">Manage leads. Close deals. Grow relationships.</p>
      </div>

      <div className="auth-form-panel">
        <h1>Create your account</h1>
        <p className="auth-subtitle">Start managing your customers today</p>

        {success ? (
          <p className="auth-success">
            Account created! You can now <a href="/login">sign in</a>.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}

        {!success && (
          <p className="auth-switch">
            Already have an account? <a href="/login">Sign in</a>
          </p>
        )}
      </div>
    </div>
  )
}

export default Register