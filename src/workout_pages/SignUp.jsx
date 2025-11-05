"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import "../App.css"

export default function SignUp() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("Passwords do not match!")
      return
    }
    console.log("Sign Up:", { fullName, email, password })
  }

  return (
    <div className="signup-container">
      <div className="signup-logo">
        <h1>
          <span className="signup-logo-emoji">💪</span> FLEXFIT
        </h1>
      </div>

      <div className="signup-main">
        <div className="signup-card">
          <h2 className="signup-title">Create Your FLEXFIT Account</h2>
          <p className="signup-subtitle">Join millions achieving their fitness goals</p>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="signup-field">
              <label htmlFor="fullName" className="signup-label">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="signup-input"
                required
              />
            </div>

            <div className="signup-field">
              <label htmlFor="email" className="signup-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="signup-input"
                required
              />
            </div>

            <div className="signup-field">
              <label htmlFor="password" className="signup-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="signup-input"
                required
              />
            </div>

            <div className="signup-field">
              <label htmlFor="confirmPassword" className="signup-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="signup-input"
                required
              />
            </div>

            <button type="submit" className="signup-button">
              Sign Up
            </button>
          </form>

          <div className="signup-divider">
            <p className="signup-signin-text">
              Already have an account?{" "}
              <Link to="/signin" className="signup-signin-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="signup-decor-1"></div>
        <div className="signup-decor-2"></div>
      </div>
    </div>
  )
}
