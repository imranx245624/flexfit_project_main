// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Link, useLocation } from "react-router-dom";

import "./styles/theme.css"; // new global theme (kept)
import "./App.css";
import "./HomeContent.css"; // updated file
import NavBar from "./NavBar.jsx";
import SideBar from "./SideBar.jsx";

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

function RouterWrapper() {
  const [hideShell, setHideShell] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [, setCurrentUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Always reset to top on route change (no full page reload needed)
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch (e) {}
  }, [location.pathname]);

  // Show a short loading notice on every route change
  useEffect(() => {
    let alive = true;
    setRouteLoading(true);
    const timer = setTimeout(() => {
      if (alive) setRouteLoading(false);
    }, 4000);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [location.pathname]);

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
  }, [navigate]);

  useEffect(() => {
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === "SIGNED_IN" && session?.user) {
          const user = session.user;
          setCurrentUser(user);
          try {
            const dest = sessionStorage.getItem("ff-auth-redirect");
            if (dest) {
              sessionStorage.removeItem("ff-auth-redirect");
              navigate(dest);
            }
          } catch (e) {}
          try {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("flexfit-install-hint"));
            }, 2000);
          } catch (e) {}
          try {
            await supabase.from("profiles").upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || null,
              username: user.user_metadata?.username || null,
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
  }, [navigate]);

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
    const goHomeWorkout = () => navigate("/HWorkout");
    const goGymWorkout = () => navigate("/GWorkout");
    const goAI = () => navigate("/AIWorkoutLibrary");
    const goLibrary = () => navigate("/workouts");

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
        title: "3D Body Model (Coming Soon)",
        desc: "Planned muscle visualization to explain form and engagement.",
      },
      {
        title: "Privacy First",
        desc: "Video stays on your device; no raw camera stream is stored by default.",
      },
    ];

    const steps = [
      { step: "01", title: "Choose a Workout", desc: "Pick AI workouts from the Train with AI section." },
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
            <span className="hero-badge">FlexFit</span>
            <h1>AI-Powered Fitness Assistant</h1>
            {/* <p className="hero-lead">
              FlexFit AI is a privacy-first fitness assistant that uses your webcam for real-time pose detection
              and voice feedback. Explore home and gym workouts, track accuracy and reps, and review progress
              reports. 3D body model visualization is coming soon.
            </p> */}
            <div className="hero-actions">
              <button className="btn-primary ai-cta" onClick={goAI}>Train with AI</button>
              <button className="btn-ghost" onClick={goLibrary}>Workout Library</button>
            </div>
            <div className="hero-pills">
              <span>Webcam + AI</span>
              <span>Live Corrections</span>
              <span>Privacy Focused</span>
            </div>
          </div>
        </section>

        <section className="home-section start">
          <div className="section-head">
            <h2>Explore Workout Library</h2>
            <p>Pick a category to view exercises, tips, and routines</p>
          </div>
          <div className="hero-card-row">
            <div className="hero-card home" onClick={goHomeWorkout} role="button" tabIndex={0} onKeyDown={(e)=>{ if (e.key === "Enter") goHomeWorkout(); }}>
              <div>
                <div className="hero-card-title">Home Workout Library</div>
                <div className="hero-card-sub">Bodyweight routines and beginner-friendly plans</div>
              </div>
              <button className="hero-pill"> View</button>
            </div>
            <div className="hero-card gym" onClick={goGymWorkout} role="button" tabIndex={0} onKeyDown={(e)=>{ if (e.key === "Enter") goGymWorkout(); }}>
              <div>
                <div className="hero-card-title">Gym Workout Library</div>
                <div className="hero-card-sub">Machine + free‑weight workouts and progressive plans.</div>
              </div>
              <button className="hero-pill"> View</button>
            </div>
          </div>
        </section>


        <section className="home-section">
          <div className="section-head">
            <h2>Core Features</h2>
            {/* <p>FlexFit combines AI guidance, a workout library, and progress insights to simulate a personal trainer experience.</p> */}
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
            <h2>Who It's For</h2>
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
      {!hideShell && <NavBar />}

      <div className={`app-shell ${hideShell ? "shell-hidden" : ""}`}>
        {!hideShell && <SideBar />}

        <main
          className={`mainPart ${hideShell ? "" : "app-main-content"}`}
          style={{ paddingTop: hideShell ? 0 : undefined }}
        >
          {routeLoading && (
            <div className="route-notice" role="status" aria-live="polite">
              <span className="route-notice-dot" aria-hidden="true" />
              <div className="route-notice-text">
                <strong>Loading page...</strong>
                <span>If this page takes time or looks stuck, please refresh.</span>
              </div>
            </div>
          )}
          <Routes>
            <Route path="/" element={<HomeContent />} />
            <Route path="/HWorkout" element={<HWorkout />} />
            <Route path="/GWorkout" element={<GWorkout />} />
            <Route path="/exercise/:slug" element={<ExerciseDetail />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/AIWorkoutLibrary" element={<AIWorkoutLibrary />} />
            <Route path="/AIWorkout" element={<AIWorkout />} />
            {/* PROFILE AS A STANDALONE PAGE */}
            <Route path="/profile" element={<Profile onSignOut={handleProfileSignOut} />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Setting />} />
          </Routes>
        </main>
      </div>

      {!hideShell && (
        <footer className="site-footer">
          <div className="footer-top">
            <div className="footer-brand-block">
              <div className="footer-brand">FlexFit</div>
              <div className="footer-tagline">
                AI-powered fitness guidance with live form feedback, smart libraries, and progress tracking.
              </div>
              <div className="footer-pill-row">
                <span>Pose AI</span>
                <span>Workout Library</span>
                <span>MY Progress</span>
              </div>
            </div>

            <div className="footer-col">
              <div className="footer-title">Explore</div>
              <Link to="/" className="footer-link">Home</Link>
              <Link to="/workouts" className="footer-link">Workout Library</Link>
              <Link to="/AIWorkoutLibrary" className="footer-link">AI Library</Link>
              <Link to="/plans" className="footer-link">Plans</Link>
            </div>

            <div className="footer-col">
              <div className="footer-title">Training</div>
              <Link to="/HWorkout" className="footer-link">Home Workouts</Link>
              <Link to="/GWorkout" className="footer-link">Gym Workouts</Link>
              <Link to="/progress" className="footer-link">MY Progress</Link>
              <Link to="/leaderboard" className="footer-link">Leaderboard</Link>
            </div>

            <div className="footer-col">
              <div className="footer-title">Account</div>
              <Link to="/profile" className="footer-link">Profile</Link>
              <Link to="/settings" className="footer-link">Settings</Link>
              <span className="footer-link muted">Secure sign-in with Google</span>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-legal">© 2026 FlexFit. Train smarter, safer, anywhere.</div>
            <div className="footer-credits">Made for everyday athletes.</div>
          </div>
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
