import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../layouts/AuthLayout'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/login', { email, password })
      const { token, user } = response.data

      login(token, user)

      navigate('/dashboard')
    } catch (err) {
      const message = err.response?.data?.error || 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="login-card">
        <h2 className="login-card__title">Welcome back </h2>
        <p className="login-card__subtitle">Sign in to continue to your account</p>

        <form onSubmit={handleSubmit} className="login-card__form">
          <label htmlFor="email">Email</label>
          <div className="login-card__input-wrapper">
            <Mail size={18} className="login-card__input-icon" />
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="login-card__input-wrapper">
            <Lock size={18} className="login-card__input-icon" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="login-card__toggle-password"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="login-card__error">{error}</p>}

          <button type="submit" className="login-card__submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="login-card__switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default Login