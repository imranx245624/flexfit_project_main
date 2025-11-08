// src/App.js
import React, { useState,useEffect } from "react";
import {FaHome, FaChartLine, FaDumbbell, FaCog, FaClipboardList,  FaBars,FaVideo} from  "react-icons/fa";// icons for different button
import { GiWeightLiftingUp } from "react-icons/gi";

import {BrowserRouter as Router ,Routes ,Route, Link} from 'react-router-dom';
// for this we have install 'react-router-dom' using command "npm install react-router-dom"
//importing different pages 

//pages src->
import './App.css';
import './SignIN_Popup.css';
import './HomeContent.css';
import NavBar from "./NavBar.jsx";
import Sidebar from "./SideBar.jsx";

//pages src->workout_pages 
import HWorkout from "./workout_pages/HomeWorkout.jsx";
import GWorkout from "./workout_pages/GymWorkout.jsx";
import Workouts from "./sidebar_pages/Workout_library.jsx";
import Plans from "./sidebar_pages/My_Plans.jsx";
import Progress from "./sidebar_pages/Progress_tracker.jsx";
import Settings from "./sidebar_pages/Setting.jsx";
import SignIn from "./workout_pages/SignIn.jsx";
import SignUp from "./workout_pages/SignUp.jsx";

import AIWorkout from "./workout_pages/AIWorkout.jsx";

function App() {
  const [open, setOpen] = useState(true);

  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);


/*
useEffect(() => {
  const timer = setTimeout(() => {
    setShowSignIn(true);
  }, 2000); // 2 seconds delay

  return () => clearTimeout(timer);
}, []);*/

useEffect(() => {
  const timer = setTimeout(() => setShowSignIn(true), 2000);
  return () => clearTimeout(timer);
}, []);



function HomeContent(){

  return (
    <>
    <div className="home-container">
<header className="home-header">
<h1>Welcome to FlexFit</h1>
<p>Your AI-powered fitness companion</p>
</header>


<section className="home-intro">
<p>
Track your workouts, follow personalized plans, and monitor your progress —
all in one place.
</p>

<Link to= "/plans">
<button className="get-started">< FaVideo size={18}/>  Train with AI</button>
</Link>

</section>


<section className="home-features">
<div className="feature-card">
<h3>AI Workouts</h3>
<p>Generate smart workout plans based on your fitness level and goals.</p>
</div>


<div className="feature-card">
<h3>Progress Tracking</h3>
<p>Visualize your fitness journey and stay motivated.</p>
</div>


<div className="feature-card">
<h3>Workout Library</h3>
<p>Explore a collection of home and gym workouts designed by experts.</p>
</div>
</section>
</div>
     </>
  );
}
  return (
    <Router>
      
      <NavBar/>
      <Sidebar open={open} setOpen={setOpen} />

      <main className="mainPart"  style={{ marginLeft: open ? "180px" : "50px", transition: "margin-left 1s" }} >

        <Routes>
          {/* <Route path="/signin" element={<SignIn />} /> */}
          <Route path="/signup" element={<SignUp />} />

          <Route  path="/" element={<HomeContent />} />

          <Route path="/HWorkout" element={<HWorkout />} />
          <Route path="/GWorkout" element={<GWorkout />} />
          
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/AIWorkout" element={<AIWorkout/>}/>
          
        </Routes>

      </main>
      {showSignIn && (
        //popup css use here 
        <div className="popup-overlay">
          <div className="popup-box">
            <button className="close-btn" onClick={() => setShowSignIn(false)}>×</button>
            <SignIn setShowSignIn={setShowSignIn} setShowSignUp={setShowSignUp} />
          </div>
        </div>
      )} 

      {showSignUp && (
  <div className="popup-overlay">
    <div className="popup-box">
      <button className="close-btn" onClick={() => setShowSignUp(false)}>×</button>
      <SignUp />
    </div>
  </div>
)}
    </Router>

  );
}

 export default App;
