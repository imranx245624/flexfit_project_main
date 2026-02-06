// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import "./App.css";
import "./SignIN_Popup.css";
import "./HomeContent.css";
import "./styles/theme.css"; // new global theme
import TopNav from "./components/TopNav.jsx";

import HWorkout from "./workout_pages/HomeWorkout.jsx";
import GWorkout from "./workout_pages/GymWorkout.jsx";
import Workouts from "./sidebar_pages/Workout_library.jsx";
import Plans from "./sidebar_pages/My_Plans.jsx";
import Progress from "./sidebar_pages/Progress_tracker.jsx";
import Leaderboard from "./sidebar_pages/Leaderboard.jsx";
import Settings from "./sidebar_pages/Setting.jsx";
import SignIn from "./workout_pages/SignIn.jsx";

import AIWorkout from "./workout_pages/AIWorkout.jsx";
import Profile from "./navbar_pages/ProfilePage.jsx";

/* TODO: DO NOT CHANGE API CALLS (supabase) */
import { supabase } from "./utils/supabaseClient";

function App() {
  const [hideShell, setHideShell] = useState(false); // NEW: when true, hide NavBar + Sidebar

  const [showSignIn, setShowSignIn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // store current user object from Supabase Auth
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // initial check: prefer session then user
    const init = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        if (session?.user) {
          setCurrentUser(session.user);
          setShowSignIn(false);
          return;
        }
        // if no session, try getUser fallback
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          setCurrentUser(userData.user);
          setShowSignIn(false);
          return;
        }
        // otherwise optionally show sign-in modal after short delay
        const timer = setTimeout(() => setShowSignIn(true), 1500);
        return () => clearTimeout(timer);
      } catch (err) {
        console.error("init auth check error:", err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    // auth state listener
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === "SIGNED_IN" && session?.user) {
          const user = session.user;
          setCurrentUser(user);

          // Upsert minimal profiles row (so RLS & FK works)
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

          setShowSignIn(false);
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(null);
        } else {
          // other events - ignore
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

  // Listen for the custom event to hide/show NavBar & Sidebar
  useEffect(() => {
    const handler = (e) => {
      // detail true => hide shell; false => show
      setHideShell(Boolean(e.detail));
    };
    window.addEventListener("flexfit-hide-shell", handler);
    return () => window.removeEventListener("flexfit-hide-shell", handler);
  }, []);

  function HomeContent() {
    const gymWorkouts = [
      { title: "Bench Press", detail: "Strength - est. 6 kcal/min - 20-30 min" },
      { title: "Lat Pulldown", detail: "Back focus - est. 5 kcal/min - 15-25 min" },
      { title: "Leg Press", detail: "Lower body - est. 7 kcal/min - 15-25 min" },
      { title: "Cable Row", detail: "Posture & back - est. 5 kcal/min - 15-20 min" },
    ];

    const homeWorkouts = [
      { title: "Push Ups", detail: "Bodyweight - est. 7-8 kcal/min - 10-20 min" },
      { title: "Squats", detail: "Lower body - est. 5-7 kcal/min - 12-20 min" },
      { title: "Planks", detail: "Core stability - est. 3-4 kcal/min - 3-8 min" },
      { title: "Burpees", detail: "Full body - est. 8-10 kcal/min - 8-15 min" },
    ];

    const calorieGuide = [
      { title: "Push Ups", detail: "10-15 min - 70-120 kcal" },
      { title: "Squats", detail: "15-20 min - 90-140 kcal" },
      { title: "Planks", detail: "4-6 min - 15-25 kcal" },
      { title: "Burpees", detail: "8-12 min - 80-120 kcal" },
      { title: "Jumping Jacks", detail: "12-18 min - 90-140 kcal" },
    ];

    return (
      <>
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-panel">
              <div className="hero-tag mono">AI FITNESS CONSOLE</div>
              <h1 className="hero-title">Welcome to FlexFit</h1>
              <p className="hero-sub">
                AI-powered workouts, posture correction, and progress tracking in a single dashboard.
              </p>
              <div className="hero-actions">
                <Link to="/HWorkout" className="btn">Train with AI</Link>
                <Link to="/workouts" className="btn ghost">Workout Library</Link>
              </div>
              <div className="hero-highlights">
                <strong>Highlights:</strong>
                <ul>
                  <li>Real-time posture correction (webcam)</li>
                  <li>3D muscle visualization</li>
                  <li>Session reports & leaderboards</li>
                </ul>
              </div>
            </div>

            <div className="hero-media">
              {/* Asset: place /public/assets/hero-designed.png */}
              <img
                src="/assets/hero-designed.png"
                alt="FlexFit hero"
              />
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="container">
            <div className="section-head">
              <h2>Gym Workouts</h2>
              <p>Equipment-based sessions with higher intensity and progressive overload.</p>
            </div>
            <div className="workout-grid">
              {gymWorkouts.map((w) => (
                <div key={w.title} className="workout-card glow-hover">
                  <div className="workout-icon" />
                  <div>
                    <div className="workout-title">{w.title}</div>
                    <div className="workout-sub">{w.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section alt">
          <div className="container">
            <div className="section-head">
              <h2>Home Workouts</h2>
              <p>Minimal equipment, maximum results. Perfect for quick sessions.</p>
            </div>
            <div className="workout-grid">
              {homeWorkouts.map((w) => (
                <div key={w.title} className="workout-card glow-hover">
                  <div className="workout-icon accent" />
                  <div>
                    <div className="workout-title">{w.title}</div>
                    <div className="workout-sub">{w.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="container">
            <div className="section-head">
              <h2>Calorie / Time Guide</h2>
              <p>Use these quick ranges to plan your sessions.</p>
            </div>
            <div className="calorie-grid">
              {calorieGuide.map((c) => (
                <div key={c.title} className="calorie-card">
                  <div className="calorie-title">{c.title}</div>
                  <div className="calorie-sub">{c.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }

  // callback used by Profile to close popup + clear app user state after signout
  const handleProfileSignOut = () => {
    setShowProfile(false);
    setCurrentUser(null);
    // optional: also show sign-in modal if you want
    // setShowSignIn(true);
  };

  return (
    <Router>
      {/* Top navigation (replaces sidebar) */}
      {!hideShell && (
        <TopNav
          currentUser={currentUser}
          setShowProfile={setShowProfile}
          setShowSignIn={setShowSignIn}
        />
      )}

      {/* If shell is hidden, make main take full height (so AIWorkout can become full-screen) */}
      <main
        className={`mainPart ${hideShell ? "" : "main-with-topnav"}`}
        style={{ paddingTop: hideShell ? 0 : undefined }}
      >
        <Routes>
          <Route path="/" element={<HomeContent />} />
          <Route path="/HWorkout" element={<HWorkout />} />
          <Route path="/GWorkout" element={<GWorkout />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/AIWorkout" element={<AIWorkout />} />
        </Routes>
      </main>

      {/* SignIn modal only */}
      {showSignIn && (
        <div className="popup-overlay">
          <div className="popup-box">
            <SignIn setShowSignIn={setShowSignIn} />
          </div>
        </div>
      )}

      {/* Profile popup */}
      {showProfile && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button className="close-btn" onClick={() => setShowProfile(false)}>
              X
            </button>
            {/* pass a callback so Profile component can close the popup & clear currentUser */}
            <Profile onSignOut={handleProfileSignOut} />
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
