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


  // ---------- OAuth (Google) ----------
  const handleGoogle = async () => {
    setMsg("");
    setType("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
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
              <h2 className="auth-title">Log in or sign up</h2>
              <p className="auth-sub">You’ll get smarter responses and can upload files, images, and more.</p>
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

            {/* <div className="or-divider"><span>OR</span></div> */}

            {/*
            // Mode selector + Email/Phone flows (temporarily disabled)
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={() => { setMode("email"); setInputValue(""); setOtpSent(false); setMsg(""); setType(""); setOtpValue(""); }}
                style={{
                  background: mode === "email" ? "rgba(255,255,255,0.04)" : "transparent",
                  border: "none",
                  color: "#d6d6d6",
                  padding: "6px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Email
              </button>

              <button
                onClick={() => { setMode("phone"); setInputValue(""); setOtpSent(false); setMsg(""); setType(""); setOtpValue(""); }}
                style={{
                  background: mode === "phone" ? "rgba(255,255,255,0.04)" : "transparent",
                  border: "none",
                  color: "#d6d6d6",
                  padding: "6px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Phone
              </button>
            </div>

            {!otpSent ? (
              <form onSubmit={handleContinue} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  className="auth-input"
                  type="text"
                  placeholder={mode === "email" ? "Email address" : "Phone (e.g. +919876543210)"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  aria-label={mode === "email" ? "Email address" : "Phone number"}
                  autoComplete={mode === "email" ? "email" : "tel"}
                  style={{ padding: "12px 14px", borderRadius: 28 }}
                />

                <button className="auth-btn primary full" type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Continue"}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyPhoneOtp} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Enter OTP"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    aria-label="OTP"
                    style={{ padding: "12px 14px", borderRadius: 12, flex: 1 }}
                  />
                  <button className="auth-btn primary" type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Verify"}
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ color: "#9aa0a3", fontSize: 13 }}>
                    OTP sent to <strong>{inputValue}</strong>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleResend}
                      className="auth-btn oauth"
                      disabled={loading || resendCountdown > 0}
                      style={{ padding: "8px 12px", borderRadius: 12 }}
                    >
                      {resendCountdown > 0 ? `Resend (${resendCountdown}s)` : "Resend OTP"}
                    </button>

                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setOtpValue("");
                        setMsg("");
                        setType("");
                        if (resendTimerRef.current) { clearInterval(resendTimerRef.current); resendTimerRef.current = null; setResendCountdown(0); }
                      }}
                      className="auth-btn oauth"
                      style={{ padding: "8px 12px", borderRadius: 12 }}
                    >
                      Change number
                    </button>
                  </div>
                </div>
              </form>
            )}
            */}

            {msg && (
              <div className={`auth-msg ${type === "error" ? "error" : type === "success" ? "success" : "info"}`} style={{ marginTop: 6 }}>
                {msg}
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
