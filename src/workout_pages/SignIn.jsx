"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import "../App.css"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Sign In:", { email, password, rememberMe })
  }

  return (
    <div className="signin-container">
      <div className="signin-logo">
        <h1>
          <span className="signin-logo-emoji">💪</span> FLEXFIT
        </h1>
      </div>

      <div className="signin-main">
        <div className="signin-card">
          <h2 className="signin-title">Welcome Back to FLEXFIT</h2>
          <p className="signin-subtitle">Sign in to continue your fitness journey</p>

          <form onSubmit={handleSubmit} className="signin-form">
            <div className="signin-field">
              <label htmlFor="email" className="signin-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="signin-input"
                required
              />
            </div>

            <div className="signin-field">
              <label htmlFor="password" className="signin-label">
                Password
              </label>
              <inputs
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="signin-input"
                required
              />
            </div>

            <div className="signin-checkbox-wrapper">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="signin-checkbox"
              />
              <label htmlFor="remember" className="signin-checkbox-label">
                Remember me
              </label>
            </div>

            <button type="submit" className="signin-button">
              Sign In
            </button>
          </form>

          <div className="signin-forgot">
            <Link to="#" className="signin-forgot">
              Forgot Password?
            </Link>
          </div>

          <div className="signin-divider">
            <p className="signin-signup-text">
              Don't have an account?{" "}
              <Link to="/signup" className="signin-signup-link">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        <div className="signin-decor-1"></div>
        <div className="signin-decor-2"></div>
      </div>
    </div>
  )
}
