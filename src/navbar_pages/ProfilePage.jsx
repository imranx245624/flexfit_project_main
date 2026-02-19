// src/navbar_pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
/* TODO: DO NOT CHANGE API CALLS (supabase) */
import { supabase } from "../utils/supabaseClient";
import CompleteProfile from "./CompleteProfile";
import Progress from "../sidebar_pages/Progress_tracker.jsx";
import Setting from "../sidebar_pages/Setting.jsx";
import "./profilePage.css";
import ConfirmSignOutModal from "../components/ConfirmSignOutModal.jsx";
import { clearSupabaseAuthStorage } from "../utils/supabaseAuthStorage";

const VALID_TABS = new Set(["overview", "progress", "settings"]);

function ProfilePage({ onSignOut, initialTab = "overview" }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComplete, setShowComplete] = useState(false);
  const [tab, setTab] = useState(VALID_TABS.has(initialTab) ? initialTab : "overview");
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (VALID_TABS.has(initialTab)) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      alert("Signed out");
      setProfile(null);
      if (typeof onSignOut === "function") {
        onSignOut();
      }
    } catch (err) {
      console.error("Sign out error:", err);
      alert("Sign out failed: " + (err.message || err));
    } finally {
      clearSupabaseAuthStorage();
      try { navigate("/", { replace: true }); } catch (e) {}
      try { window.location.replace("/"); } catch (e) {}
    }
  };

  const confirmAndSignOut = async () => {
    setShowConfirm(false);
    await handleSignOut();
  };

  if (loading) return <div className="profile-loading">Loading...</div>;
  if (!profile) return <div className="profile-loading">No profile (please sign in)</div>;

  const incomplete = !profile.username || profile.profile_completed === false;

  return (
    <div className="profile-dashboard container">
      <div className="profile-header">
        <h1>Dashboard</h1>
        <div className="profile-tabs">
          <button
            className={tab === "overview" ? "active" : ""}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          <button
            className={tab === "progress" ? "active" : ""}
            onClick={() => setTab("progress")}
          >
            Progress
          </button>
          <button
            className={tab === "settings" ? "active" : ""}
            onClick={() => setTab("settings")}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="profile-content">
        {tab === "overview" && (
          <div className="ff-profile">
            <div className="ff-profile-card">
              <div className="ff-profile-header">
                <div className="ff-profile-meta">
                  <img
                    src={profile.avatar_url || "/default-avatar.png"}
                    alt="avatar"
                    className="ff-profile-avatar"
                  />
                  <div className="ff-profile-text">
                    <div className="ff-profile-name">{profile.full_name || profile.username || profile.email}</div>
                    <div className="ff-profile-email">{profile.email}</div>
                    <div className="ff-profile-username">{profile.username ? `@${profile.username}` : "Username not set"}</div>
                  </div>
                </div>

                <div className="ff-profile-kpis">
                  <div className="kpi">
                    <div className="value">0</div>
                    <div className="small-muted">Sessions this week</div>
                  </div>
                  <div className="kpi">
                    <div className="value">--</div>
                    <div className="small-muted">Best score</div>
                  </div>
                </div>
              </div>

              <div className="ff-profile-actions">
                {incomplete ? (
                  <button className="btn-primary" onClick={() => setShowComplete(true)}>Complete profile</button>
                ) : null}
                <Link to="/reports" className="btn-ghost">View Reports</Link>
                <button className="btn-ghost" onClick={() => setShowConfirm(true)}>Sign Out</button>
              </div>

              <div className="ff-profile-stats">
                <div className="ff-profile-stat">
                  <div className="stat-label">Total Sessions</div>
                  <div className="stat-value">0</div>
                </div>
                <div className="ff-profile-stat">
                  <div className="stat-label">Avg Accuracy</div>
                  <div className="stat-value">--</div>
                </div>
                <div className="ff-profile-stat">
                  <div className="stat-label">ECA Points</div>
                  <div className="stat-value">0</div>
                </div>
              </div>

              <div className="ff-profile-placeholder">
                You haven't completed any sessions yet. Start a workout to see progress here.
              </div>

              <div className="ff-profile-details">
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
          </div>
        )}

        {tab === "progress" && (
          <div>
            <Progress />
          </div>
        )}

        {tab === "settings" && (
          <div>
            <Setting />
          </div>
        )}
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

      <ConfirmSignOutModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmAndSignOut}
      />
    </div>
  );
}

export default ProfilePage;
