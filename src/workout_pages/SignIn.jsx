// src/workout_pages/SignIn.jsx
import React, { useEffect, useState, useRef } from "react";
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
 */
function SignIn({ setShowSignIn }) {
  const [mode, setMode] = useState("email"); // "email" | "phone"
  const [inputValue, setInputValue] = useState(""); // email or phone
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [type, setType] = useState(""); // "error" | "success" | "info"

  // Phone-specific states
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const resendTimerRef = useRef(null);

  const close = () => {
    if (typeof setShowSignIn === "function") setShowSignIn(false);
  };

  useEffect(() => {
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

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

  // ---------- Email magic link ----------
  const handleEmailContinue = async (e) => {
    e?.preventDefault?.();
    setMsg("");
    setType("");

    const email = inputValue.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setType("error");
      setMsg("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        setType("error");
        setMsg(error.message || "Failed to send magic link.");
      } else {
        setType("success");
        setMsg("Magic link sent — check your inbox (and spam).");
      }
    } catch (err) {
      setType("error");
      setMsg(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // ---------- Phone: send OTP ----------
  const sendPhoneOtp = async (e) => {
    e?.preventDefault?.();
    setMsg("");
    setType("");

    const phone = inputValue.trim();
    if (!phone || !/^\+\d{7,15}$/.test(phone)) {
      setType("error");
      setMsg("Enter phone in international format, e.g. +919876543210");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        setType("error");
        setMsg(error.message || "Failed to send OTP.");
      } else {
        setType("success");
        setMsg("OTP sent to your phone. Enter it below.");
        setOtpSent(true);
        setOtpValue("");
        startResendCountdown(45); // 45s cooldown
      }
    } catch (err) {
      setType("error");
      setMsg(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // ---------- Phone: verify OTP ----------
  const verifyPhoneOtp = async (e) => {
    e?.preventDefault?.();
    setMsg("");
    setType("");

    const phone = inputValue.trim();
    const token = otpValue.trim();
    if (!token) {
      setType("error");
      setMsg("Enter the OTP you received.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });
      if (error) {
        setType("error");
        setMsg(error.message || "OTP verification failed.");
      } else {
        setType("success");
        setMsg("Phone verified — signed in.");
        // onAuthStateChange in App.js will handle profile upsert and modal close
      }
    } catch (err) {
      setType("error");
      setMsg(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const startResendCountdown = (secs) => {
    setResendCountdown(secs);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setResendCountdown((s) => {
        if (s <= 1) {
          clearInterval(resendTimerRef.current);
          resendTimerRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    await sendPhoneOtp();
  };

  // Unified submit for email/phone (sends)
  const handleContinue = (e) => {
    if (mode === "email") return handleEmailContinue(e);
    return sendPhoneOtp(e);
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

            <button className="close-x" onClick={close} aria-label="Close">✕</button>
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

            {/* Mode selector */}
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

            {/* Input & continue */}
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
              /* OTP input + verify + resend */
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
                        // allow user to go back/change phone
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
