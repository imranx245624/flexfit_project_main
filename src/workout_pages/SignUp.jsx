// src/workout_pages/SignUp.jsx
import React, { useState } from "react";
import "./Authentication.css";
/* TODO: DO NOT CHANGE API CALLS (supabase) */
import { supabase } from "../utils/supabaseClient";
import { Link } from "react-router-dom";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

function SignUp({ setShowSignIn, setShowSignUp }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const savePendingProfile = () => {
    const pending = { username: username || "" };
    localStorage.setItem("pending_profile", JSON.stringify(pending));
  };

  const handleSignUp = async () => {
    setMsg("");
    setType("");
    if (!username.trim()) {
      setType("error");
      setMsg("Please enter a username.");
      return;
    }
    if (password.length < 8) {
      setType("error");
      setMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setType("error");
      setMsg("Passwords do not match.");
      return;
    }
    if (!isValidEmail(email)) {
      setType("error");
      setMsg("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: username },
        },
      });

      if (error) {
        setType("error");
        setMsg(error.message);
      } else {
        // attempt to insert username->email mapping; may fail due to RLS
        try {
          await supabase.from("users").insert([{ username: username, email }]);
        } catch (insErr) {
          console.warn("profile insert failed (client-side):", insErr);
        }

        savePendingProfile();
        setType("success");
        setMsg("Signed up. Check your email to confirm. After confirmation, sign in to complete your profile.");
      }
    } catch (err) {
      setType("error");
      setMsg(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setMsg("");
    setType("");
    setLoading(true);
    try {
      try { sessionStorage.setItem("ff-auth-redirect", "/profile"); } catch (e) {}
      const redirectTo = new URL("/", window.location.origin).toString();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        setType("error");
        setMsg(error.message);
      } else {
        setType("info");
        setMsg("Redirecting to Google...");
      }
    } catch (err) {
      setType("error");
      setMsg(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <header className="auth-header">
        <div className="brand-head">
          <h1 className="brand-title">FlexFit</h1>
          <p className="brand-sub">AI-powered workouts &amp; progress tracking</p>
        </div>
      </header>

      <div className="auth-card">
        <div className="auth-left">
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-sub">Sign up quickly and start your fitness journey</p>

          <div className="auth-form form-grid" aria-label="Sign up form">
            <div className="form-col">
              <label className="auth-label" htmlFor="su-username">Username</label>
              <input
                id="su-username"
                className="auth-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. _imranx_"
                autoComplete="username"
              />

              <label className="auth-label" htmlFor="su-password">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="su-password"
                  className="auth-input with-toggle"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-col">
              <label className="auth-label" htmlFor="su-confirm">Confirm Password</label>
              <div className="auth-input-wrap">
                <input
                  id="su-confirm"
                  className="auth-input with-toggle"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Retype password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-toggle"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>

              <label className="auth-label" htmlFor="su-email">Email</label>
              <input
                id="su-email"
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="full-col">
              <button className="auth-btn primary full" onClick={handleSignUp} disabled={loading}>
                {loading ? "Signing up..." : "Create account"}
              </button>
            </div>
          </div>

          <div className="or-divider"><span>OR</span></div>

          <button className="auth-btn oauth" onClick={handleGoogleSignUp} disabled={loading}>
            <img src="/google-icon.svg" alt="google" className="oauth-icon" />
            Continue with Google
          </button>

          {msg && <div className={`auth-msg ${type === "error" ? "error" : type === "success" ? "success" : "info"}`}>{msg}</div>}

          <div className="auth-footer">
            <span>Already have an account?</span>&nbsp;
            <Link to="/signin" onClick={() => { setShowSignIn(true); setShowSignUp(false); }} className="link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
