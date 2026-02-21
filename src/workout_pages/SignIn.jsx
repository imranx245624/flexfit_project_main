// src/workout_pages/SignIn.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Authentication.css";
/* TODO: DO NOT CHANGE API CALLS (supabase) */
import { supabase } from "../utils/supabaseClient";

/**
 * SignIn modal:
 * - Google OAuth
 * - Email magic link (signInWithOtp({ email }))
 * - Phone OTP (signInWithOtp({ phone }) -> verifyOtp({ phone, token, type: 'sms' }))
 *
 * Props:
 *  - setShowSignIn(fn) : parent function to close modal
 *  - forceMode (bool)  : when true, hide close button and prevent closing
 *  - onSignedIn(user)  : optional callback after sign-in
 */
function SignIn({ setShowSignIn, forceMode = false, onSignedIn }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [type, setType] = useState(""); // "error" | "success" | "info"
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  const close = () => {
    if (forceMode) return;
    if (typeof setShowSignIn === "function") setShowSignIn(false);
  };

  useEffect(() => {
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        if (typeof onSignedIn === "function") onSignedIn(session.user);
        else navigate("/profile");
      }
    });
    return () => subscription?.unsubscribe?.();
  }, [navigate, onSignedIn]);

  const resetMessages = () => {
    setMsg("");
    setType("");
  };

  const switchMode = (next) => {
    setMode(next);
    setLoading(false);
    resetMessages();
    setOtpSent(false);
    setOtpEmail("");
    setOtpCode("");
  };

  const normalizeUsername = (value) => String(value || "").trim().toLowerCase();
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").toLowerCase());

  const resolveEmail = async (value) => {
    const raw = String(value || "").trim();
    if (!raw) throw new Error("Enter username or email.");
    if (raw.includes("@")) return raw.toLowerCase();

    const username = normalizeUsername(raw);
    const { data, error } = await supabase
      .from("usernames")
      .select("email")
      .eq("username", username)
      .single();

    if (error || !data?.email) {
      throw new Error("Username not found. Use email or sign up.");
    }
    return String(data.email).toLowerCase();
  };

  const handlePasswordSignIn = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      if (!identifier.trim() || !password) {
        setType("error");
        setMsg("Enter username/email and password.");
        return;
      }

      const email = await resolveEmail(identifier);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setType("error");
        setMsg(error.message || "Sign in failed");
      }
    } catch (err) {
      setType("error");
      setMsg(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    resetMessages();

    const username = normalizeUsername(signupName);
    if (!username) {
      setType("error");
      setMsg("Please enter a username.");
      return;
    }
    if (!isValidEmail(signupEmail)) {
      setType("error");
      setMsg("Please enter a valid email.");
      return;
    }
    if (signupPassword.length < 8) {
      setType("error");
      setMsg("Password must be at least 8 characters.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setType("error");
      setMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data: existing, error: lookupErr } = await supabase
        .from("usernames")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (lookupErr) {
        throw new Error("Username lookup failed. Configure DB first.");
      }
      if (existing?.username) {
        setType("error");
        setMsg("Username already taken.");
        return;
      }

      const email = signupEmail.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password: signupPassword,
        options: {
          data: { full_name: signupName.trim(), username },
        },
      });

      if (error) {
        setType("error");
        setMsg(error.message || "Sign up failed");
        return;
      }

      const { error: mapErr } = await supabase.from("usernames").insert([
        {
          username,
          email,
          user_id: data?.user?.id ?? null,
        },
      ]);

      if (mapErr) {
        setType("error");
        setMsg("Signup saved, but username mapping failed. Check DB policies.");
        return;
      }

      setType("success");
      setMsg("Account created. Check your email to confirm, then sign in.");
      setMode("signin");
    } catch (err) {
      setType("error");
      setMsg(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    resetMessages();
    const email = String(otpEmail || "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      setType("error");
      setMsg("Enter a valid email to receive OTP.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) {
        setType("error");
        setMsg(error.message || "Failed to send OTP");
        return;
      }
      setType("success");
      setMsg("OTP sent. Check your email.");
      setOtpSent(true);
    } catch (err) {
      setType("error");
      setMsg(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    resetMessages();
    const email = String(otpEmail || "").trim().toLowerCase();
    const token = String(otpCode || "").trim();
    if (!isValidEmail(email)) {
      setType("error");
      setMsg("Enter a valid email.");
      return;
    }
    if (!token) {
      setType("error");
      setMsg("Enter the OTP code.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error) {
        setType("error");
        setMsg(error.message || "OTP verification failed");
        return;
      }
      setType("success");
      setMsg("Verified. Signing you in...");
      if (data?.user && typeof onSignedIn === "function") {
        onSignedIn(data.user);
      } else {
        navigate("/profile");
      }
    } catch (err) {
      setType("error");
      setMsg(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };


  // ---------- OAuth (Google) ----------
  const handleGoogle = async () => {
    setMsg("");
    setType("");
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/profile`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        setType("error");
        setMsg(error.message || "Google sign-in error");
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
    <div className="auth-wrapper" role="dialog" aria-modal="true">
      <div className="auth-card narrow">
        <div className="auth-left" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 className="auth-title">
                {mode === "signup"
                  ? "Create your account"
                  : mode === "forgot"
                    ? "Forgot password"
                    : "Welcome back"}
              </h2>
              <p className="auth-sub">
                {mode === "signup"
                  ? "Create your account to save workouts, track progress, and unlock AI features."
                  : mode === "forgot"
                    ? "Enter your email to get an OTP and sign in."
                    : "Sign in to save workouts, track progress, and pick up where you left off."}
              </p>
            </div>

            {!forceMode && (
              <button className="close-x" onClick={close} aria-label="Close">✕</button>
            )}
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {/* Google */}
            <button
              className="auth-btn oauth full"
              onClick={handleGoogle}
              disabled={loading}
              aria-label="Continue with Google"
            >
              <img src="/google-icon.svg" alt="google" className="oauth-icon" />
              Continue with Google
            </button>

            <div className="or-divider"><span>OR</span></div>

            {mode === "signin" && (
              <form className="auth-stack" onSubmit={handlePasswordSignIn}>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Username or Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  aria-label="Username or Email"
                  autoComplete="username"
                />
                <div className="auth-input-wrap">
                  <input
                    className="auth-input with-toggle"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-label="Password"
                    autoComplete="current-password"
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
                <button className="auth-btn primary full" type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </button>
                <button type="button" className="auth-link subtle" onClick={() => switchMode("forgot")}>
                  Forgot password?
                </button>
              </form>
            )}

            {mode === "signup" && (
              <form className="auth-stack" onSubmit={handleEmailSignUp}>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Username"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  aria-label="Username"
                  autoComplete="username"
                />
                <input
                  className="auth-input"
                  type="email"
                  placeholder="Email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  aria-label="Email"
                  autoComplete="email"
                />
                <div className="auth-input-wrap">
                  <input
                    className="auth-input with-toggle"
                    type={showSignupPassword ? "text" : "password"}
                    placeholder="Password (min 8 chars)"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    aria-label="Password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowSignupPassword((v) => !v)}
                    aria-label={showSignupPassword ? "Hide password" : "Show password"}
                  >
                    {showSignupPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="auth-input-wrap">
                  <input
                    className="auth-input with-toggle"
                    type={showSignupConfirm ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    aria-label="Confirm Password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowSignupConfirm((v) => !v)}
                    aria-label={showSignupConfirm ? "Hide password" : "Show password"}
                  >
                    {showSignupConfirm ? "Hide" : "Show"}
                  </button>
                </div>
                <button className="auth-btn primary full" type="submit" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>
            )}

            {mode === "forgot" && (
              <form className="auth-stack" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="Email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  aria-label="Email"
                  autoComplete="email"
                />
                {otpSent && (
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Enter OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    aria-label="OTP code"
                    inputMode="numeric"
                  />
                )}
                <button className="auth-btn primary full" type="submit" disabled={loading}>
                  {loading ? (otpSent ? "Verifying..." : "Sending OTP...") : (otpSent ? "Verify OTP" : "Send OTP")}
                </button>
                {otpSent && (
                  <button type="button" className="auth-link subtle" onClick={handleSendOtp} disabled={loading}>
                    Resend OTP
                  </button>
                )}
                <button type="button" className="auth-link" onClick={() => switchMode("signin")}>
                  Back to sign in
                </button>
              </form>
            )}

            {msg && (
              <div className={`auth-msg ${type === "error" ? "error" : type === "success" ? "success" : "info"}`} style={{ marginTop: 6 }}>
                {msg}
              </div>
            )}

            {mode !== "forgot" && (
              <div className="auth-switch">
                {mode === "signin" ? (
                  <>
                    <span>New here?</span>
                    <button type="button" className="auth-link" onClick={() => switchMode("signup")}>
                      Create account
                    </button>
                  </>
                ) : (
                  <>
                    <span>Already have an account?</span>
                    <button type="button" className="auth-link" onClick={() => switchMode("signin")}>
                      Sign in
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="auth-legal">By continuing, you agree to our Terms and Privacy Policy.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
