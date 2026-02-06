// src/navbar_pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
/* TODO: DO NOT CHANGE API CALLS (supabase) */
import { supabase } from "../utils/supabaseClient";
import CompleteProfile from "./CompleteProfile";
import "./profilePage.css";

function ProfilePage({ onSignOut }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComplete, setShowComplete] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, created_at, username, profile_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !data) {
        setProfile({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || "",
          avatar_url: user.user_metadata?.avatar_url || null,
          username: null,
          profile_completed: false,
        });
      } else {
        setProfile({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          created_at: data.created_at,
          username: data.username,
          profile_completed: data.profile_completed,
        });
      }
    } catch (err) {
      console.error("fetchProfile error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });
    return () => subscription?.unsubscribe?.();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
      if (typeof onSignOut === "function") {
        onSignOut();
      }
    } catch (err) {
      console.error("Sign out error:", err);
      alert("Sign out failed: " + (err.message || err));
    }
  };

  if (loading) return <div className="profile-loading">Loading...</div>;
  if (!profile) return <div className="profile-loading">No profile (please sign in)</div>;

  const incomplete = !profile.username || profile.profile_completed === false;

  return (
    <div className="profile-shell">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-id">
            <img
              src={profile.avatar_url || "/default-avatar.png"}
              alt="avatar"
              className="profile-avatar"
            />
            <div>
              <div className="profile-name">{profile.full_name || profile.username || profile.email}</div>
              <div className="profile-email">{profile.email}</div>
              <div className="profile-username">{profile.username ? `@${profile.username}` : "Username not set"}</div>
            </div>
          </div>

          <div className="profile-actions">
            {incomplete ? (
              <button className="btn small" onClick={() => setShowComplete(true)}>Complete profile</button>
            ) : null}
            <Link to="/reports" className="btn ghost small">View Reports</Link>
            <button className="btn ghost small" onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <div className="stat-label">Total Sessions</div>
            <div className="stat-value">0</div>
          </div>
          <div className="profile-stat">
            <div className="stat-label">Avg Accuracy</div>
            <div className="stat-value">--</div>
          </div>
          <div className="profile-stat">
            <div className="stat-label">ECA Points</div>
            <div className="stat-value">0</div>
          </div>
        </div>

        <div className="profile-placeholder">
          You haven't completed any sessions yet. Start a workout to see progress here.
        </div>

        <div className="profile-details">
          <div>
            <div className="detail-label">Member Since</div>
            <div className="detail-value">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "--"}</div>
          </div>
          <div>
            <div className="detail-label">Status</div>
            <div className="detail-value">{incomplete ? "Incomplete" : "Active"}</div>
          </div>
        </div>
      </div>

      {showComplete && (
        <CompleteProfile
          profile={profile}
          onClose={() => {
            setShowComplete(false);
          }}
          onComplete={() => {
            fetchProfile();
          }}
        />
      )}
    </div>
  );
}

export default ProfilePage;
