// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import "./styles/theme.css"; // new global theme (kept)
import "./App.css";
import "./HomeContent.css"; // updated file
import NavBar from "./NavBar.jsx";
import SideBar from "./SideBar.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

import HWorkout from "./workout_pages/HomeWorkout.jsx";
import GWorkout from "./workout_pages/GymWorkout.jsx";
import ExerciseDetail from "./workout_pages/ExerciseDetail.jsx";
import Workouts from "./sidebar_pages/Workout_library.jsx";
import Plans from "./sidebar_pages/My_Plans.jsx";
import Leaderboard from "./sidebar_pages/Leaderboard.jsx";
import AIWorkout from "./workout_pages/AIWorkout.jsx";
import AIWorkoutLibrary from "./workout_pages/AIWorkoutLibrary.jsx";
import Profile from "./navbar_pages/ProfilePage.jsx";
import Progress from "./sidebar_pages/Progress_tracker.jsx";
import Setting from "./sidebar_pages/Setting.jsx";

/* TODO: DO NOT CHANGE API CALLS (supabase) */
import { supabase } from "./utils/supabaseClient";
import { useAuth } from "./utils/auth";

function RouterWrapper() {
  const [hideShell, setHideShell] = useState(false);
  const [, setCurrentUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        if (session?.user) {
          setCurrentUser(session.user);
          return;
        }
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          setCurrentUser(userData.user);
          return;
        }
      } catch (err) {
        console.error("init auth check error:", err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === "SIGNED_IN" && session?.user) {
          const user = session.user;
          setCurrentUser(user);
          try {
            await supabase.from("profiles").upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || null,
              avatar_url: user.user_metadata?.avatar_url || null,
            });
          } catch (err) {
            console.error("Profile upsert error:", err);
          }
          // keep user in place after login; route guard will allow access
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("onAuthStateChange handler error:", err);
      }
    });

    return () => {
      try {
        subscription?.unsubscribe?.();
      } catch (e) {}
    };
  }, []);

  // keep session fresh to avoid unexpected logouts
  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const refreshIfNeeded = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (!session) return;
        const expiresAtMs = (session.expires_at || 0) * 1000;
        const timeLeft = expiresAtMs - Date.now();
        if (timeLeft < 2 * 60 * 1000) {
          await supabase.auth.refreshSession();
        }
      } catch (err) {
        if (mounted) {
          console.warn("session refresh failed:", err);
        }
      }
    };

    const onFocus = () => refreshIfNeeded();
    const onVisible = () => { if (document.visibilityState === "visible") refreshIfNeeded(); };

    refreshIfNeeded();
    intervalId = setInterval(refreshIfNeeded, 5 * 60 * 1000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      setHideShell(Boolean(e.detail));
    };
    window.addEventListener("flexfit-hide-shell", handler);
    return () => window.removeEventListener("flexfit-hide-shell", handler);
  }, []);

  /* --------------------- NEW HomeContent (redesigned) --------------------- */
  function HomeContent() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const guardNavigate = (path) => {
      if (!user) {
        alert("Sign in first");
        try { window.dispatchEvent(new CustomEvent("flexfit-open-signin")); } catch (e) {}
        return;
      }
      navigate(path);
    };

    const goHomeWorkout = () => guardNavigate("/HWorkout");
    const goGymWorkout = () => guardNavigate("/GWorkout");
    const goAI = () => guardNavigate("/AIWorkoutLibrary");
    const goLibrary = () => guardNavigate("/workouts");

    const features = [
      {
        title: "Real-time Pose Detection",
        desc: "Tracks key body joints using your webcam and measures form and angles on-device.",
      },
      {
        title: "Instant Voice Feedback",
        desc: "Live cues help you correct posture and stay on tempo while you train.",
      },
      {
        title: "Workout Library",
        desc: "Home + Gym routines with exercise details, targets, and safe technique tips.",
      },
      {
        title: "Progress & Reports",
        desc: "Session summaries, accuracy, ECA points, and performance insights.",
      },
      {
        title: "3D Muscle Visuals",
        desc: "See which muscles work during each movement (expanding module).",
      },
      {
        title: "Privacy First",
        desc: "Video stays on your device; no raw camera stream is stored by default.",
      },
    ];

    const steps = [
      { step: "01", title: "Choose a Workout", desc: "Pick Home, Gym, or AI workouts from the library." },
      { step: "02", title: "Allow Camera", desc: "Enable webcam to start live pose tracking." },
      { step: "03", title: "Train with Feedback", desc: "Get real-time tips, rep counts, and form scoring." },
      { step: "04", title: "Save Your Session", desc: "Store progress and review performance any time." },
    ];

    const audiences = [
      { title: "Beginners & Home Users", desc: "Train safely without a personal trainer." },
      { title: "Campus Wellness", desc: "Motivate students with challenges and leaderboards." },
      { title: "Remote Coaching", desc: "Guided workouts when live trainers are unavailable." },
    ];

    return (
      <div className="home-shell">
        <section className="ff-hero-block with-video">
          <video
            className="ff-hero-video-bg"
            src="/assets/workouts/hero.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="ff-hero-video-overlay" />
          <div className="ff-hero-left">
            <span className="hero-badge">FlexFit AI</span>
            <h1>AI-Powered Fitness Assistant</h1>
            <div className="hero-actions">
              <button className="btn-primary" onClick={goAI}>Train with AI</button>
              <button className="btn-ghost" onClick={goLibrary}>Workout Library</button>
            </div>
            <div className="hero-pills">
              <span>Webcam + AI</span>
              <span>Live Corrections</span>
              <span>Privacy Focused</span>
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="section-head">
            <h2>Core Features</h2>
            <p>FlexFit combines AI guidance, a workout library, and progress insights to simulate a personal trainer experience.</p>
          </div>
          <div className="feature-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section alt">
          <div className="section-head">
            <h2>How FlexFit Works</h2>
            <p>Simple steps to start guided training with AI feedback.</p>
          </div>
          <div className="steps-grid">
            {steps.map((s) => (
              <div key={s.step} className="step-card">
                <div className="step-number">{s.step}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="section-head">
            <h2>Who It?s For</h2>
            <p>FlexFit is built for beginners, home users, campus fitness programs, and remote coaching.</p>
          </div>
          <div className="audience-grid">
            {audiences.map((a) => (
              <div key={a.title} className="audience-card">
                <div className="audience-title">{a.title}</div>
                <div className="audience-desc">{a.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section start">
          <div className="section-head">
            <h2>Start Your Workout</h2>
            <p>Choose Home Workout for bodyweight routines or Gym Workout for equipment training.</p>
          </div>
          <div className="hero-card-row">
            <div className="hero-card home" onClick={goHomeWorkout} role="button" tabIndex={0} onKeyDown={(e)=>{ if (e.key === "Enter") goHomeWorkout(); }}>
              <div>
                <div className="hero-card-title">Home Workout</div>
                <div className="hero-card-sub">Start your bodyweight journey</div>
              </div>
              <button className="hero-pill">Start</button>
            </div>
            <div className="hero-card gym" onClick={goGymWorkout} role="button" tabIndex={0} onKeyDown={(e)=>{ if (e.key === "Enter") goGymWorkout(); }}>
              <div>
                <div className="hero-card-title">Gym Workout</div>
                <div className="hero-card-sub">Build strength with equipment</div>
              </div>
              <button className="hero-pill">Start</button>
            </div>
          </div>
        </section>
      </div>
    );
  }
  /* ------------------- end HomeContent ------------------- */

  const handleProfileSignOut = () => {
    // profile page will call this on sign-out
    setCurrentUser(null);
  };

  return (
    <>
      {!hideShell && (
        <>
          <NavBar />
          <SideBar />
        </>
      )}

      <main
        className={`mainPart ${hideShell ? "" : "app-main-content"}`}
        style={{ paddingTop: hideShell ? 0 : undefined }}
      >
        <Routes>
          <Route path="/" element={<HomeContent />} />
          <Route path="/HWorkout" element={<RequireAuth><HWorkout /></RequireAuth>} />
          <Route path="/GWorkout" element={<RequireAuth><GWorkout /></RequireAuth>} />
          <Route path="/exercise/:slug" element={<RequireAuth><ExerciseDetail /></RequireAuth>} />
          <Route path="/workouts" element={<RequireAuth><Workouts /></RequireAuth>} />
          <Route path="/plans" element={<RequireAuth><Plans /></RequireAuth>} />
          <Route path="/leaderboard" element={<RequireAuth><Leaderboard /></RequireAuth>} />
          <Route path="/AIWorkoutLibrary" element={<RequireAuth><AIWorkoutLibrary /></RequireAuth>} />
          <Route path="/AIWorkout" element={<RequireAuth><AIWorkout /></RequireAuth>} />
          {/* PROFILE AS A STANDALONE PAGE */}
          <Route path="/profile" element={<RequireAuth><Profile onSignOut={handleProfileSignOut} /></RequireAuth>} />
          <Route path="/progress" element={<RequireAuth><Progress /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Setting /></RequireAuth>} />
        </Routes>
      </main>

      {!hideShell && (
        <footer className="site-footer container">
          <div className="footer-brand">FlexFit</div>
          <div className="footer-text">AI-powered fitness guidance. Train smarter, safer, and anywhere.</div>
        </footer>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <RouterWrapper />
    </Router>
  );
}

export default App;
