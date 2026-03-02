// src/navbar_pages/CompleteProfile.jsx
import React, { useState } from "react";
/* TODO: DO NOT CHANGE API CALLS (supabase) */
import { supabase } from "../utils/supabaseClient"; // adjust path if needed
import "./completeProfile.css";

export default function CompleteProfile({ profile, onClose, onComplete }) {
  // profile: { id, email, full_name, username, profile_completed }
  const emailFromProfile = profile?.email || "";
  const [username, setUsername] = useState(profile?.username || "");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [type, setType] = useState(""); // error | success | info

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setMsg("");
    setType("");

    // validation
    if (!username.trim()) {
      setType("error");
      setMsg("Please choose a username.");
      return;
    }
    if (password && password.length < 8) {
      setType("error");
      setMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setType("error");
      setMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // 1) ensure username not taken by someone else (unless it's current user's username)
      const { data: existingData, error: existingErr } = await supabase
        .from("users")
        .select("username, email")
        .eq("username", username)
        .maybeSingle();

      if (existingErr) {
        // if error reading mapping table, log but try to continue
        console.warn("users mapping read error:", existingErr);
      } else if (existingData && existingData.username) {
        // existing mapping found
        if (existingData.email !== emailFromProfile) {
          setType("error");
          setMsg("Username already taken. Choose another.");
          setLoading(false);
          return;
        }
        // else existing mapping points to same email (owner) -> allowed
      }

      // 2) update password for current signed-in user (if provided)
      if (password) {
        const { error: updErr } = await supabase.auth.updateUser({
          password: password,
        });
        if (updErr) {
          setType("error");
          setMsg(updErr.message || "Could not update password.");
          setLoading(false);
          return;
        }
      }

      // 3) upsert profile row (profiles table) to mark profile completed
      const upsertBody = {
        id: profile?.id, // should match auth user id
        email: emailFromProfile,
        full_name: fullName,
        username: username,
        profile_completed: true,
      };

      const { error: upsertErr } = await supabase.from("profiles").upsert(upsertBody);
      if (upsertErr) {
        setType("error");
        setMsg("Failed to save profile: " + upsertErr.message);
        setLoading(false);
        return;
      }

      // 4) ensure username->email mapping exists in 'users' mapping table
      try {
        await supabase.from("users").insert([{ username, email: emailFromProfile }], { returning: "minimal" });
      } catch (insErr) {
        // not fatal (RLS or duplicate)
        console.warn("users mapping insert failed:", insErr);
      }

      setType("success");
      setMsg("Profile updated successfully.");
      // trigger parent refresh
      if (typeof onComplete === "function") onComplete();
      // small delay before closing so user sees message
      setTimeout(() => {
        if (typeof onClose === "function") onClose();
      }, 700);
    } catch (err) {
      setType("error");
      setMsg(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-overlay">
      <div className="cp-modal">
        <button className="cp-close" type="button" onClick={() => onClose && onClose()} aria-label="Close">
          x
        </button>

        <h2 className="cp-title">Complete your profile</h2>
        <p className="cp-sub">Add a username and (optionally) a password so you can sign in directly.</p>

        <form className="cp-form" onSubmit={handleSubmit}>
          <div className="cp-row">
            <div className="cp-field">
              <label>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="choose a username (e.g. _imranx_)"
                required
                autoComplete="username"
              />
            </div>

            <div className="cp-field">
              <label>Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
          </div>

          <div className="cp-row">
            <div className="cp-field">
              <label>Password (optional)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" autoComplete="new-password" />
            </div>

            <div className="cp-field">
              <label>Confirm Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Retype password" autoComplete="new-password" />
            </div>
          </div>

          <div className="cp-field">
            <label>Email</label>
            <input value={emailFromProfile} readOnly className="readonly" />
            <small className="muted">Email is provided by your OAuth provider and cannot be changed here.</small>
          </div>

          {msg && <div className={`cp-msg ${type === "error" ? "error" : "success"}`}>{msg}</div>}

          <div className="cp-actions">
            <button type="button" className="btn secondary" onClick={() => onClose && onClose()} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Saving..." : "Save & Complete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
