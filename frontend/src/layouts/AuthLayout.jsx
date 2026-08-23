import { Leaf, Users, TrendingUp, ShieldCheck } from 'lucide-react'
import './AuthLayout.css'

function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__panel">
        <div className="auth-layout__decor auth-layout__decor--circle-1"></div>
        <div className="auth-layout__decor auth-layout__decor--circle-2"></div>
        <div className="auth-layout__decor auth-layout__decor--dots"></div>

        <div className="auth-layout__panel-content">
          <div className="auth-layout__brand">
            <span className="auth-layout__brand-icon">
              <Leaf size={22} />
            </span>
            <span className="auth-layout__brand-text">
              Client<span className="auth-layout__brand-accent">Flow</span>
            </span>
          </div>

          <h1 className="auth-layout__headline">
            Manage leads.<br />
            Close deals.<br />
            <span className="auth-layout__headline-accent">Grow relationships.</span>
          </h1>

          <p className="auth-layout__description">
            ClientFlow is the all-in-one CRM that helps you organize your
            pipeline, track customer interactions, and grow your business.
          </p>

          <div className="auth-layout__stats">
            <div className="auth-layout__stat">
              <span className="auth-layout__stat-icon">
                <Users size={18} />
              </span>
              <div>
                <div className="auth-layout__stat-value">10K+</div>
                <div className="auth-layout__stat-label">Happy Users</div>
              </div>
            </div>

            <div className="auth-layout__stat">
              <span className="auth-layout__stat-icon">
                <TrendingUp size={18} />
              </span>
              <div>
                <div className="auth-layout__stat-value">25%</div>
                <div className="auth-layout__stat-label">More Deals Closed</div>
              </div>
            </div>

            <div className="auth-layout__stat">
              <span className="auth-layout__stat-icon">
                <ShieldCheck size={18} />
              </span>
              <div>
                <div className="auth-layout__stat-value">99.9%</div>
                <div className="auth-layout__stat-label">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-layout__form-side">
        {children}
      </div>
    </div>
  )
}

export default AuthLayout