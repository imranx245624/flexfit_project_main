// src/App.js
import React, { useState } from "react";
import {FaHome, FaChartLine, FaDumbbell, FaCog, FaClipboardList,  FaBars} from  "react-icons/fa";
import logo from './logo.svg';
import './App.css';
import NavBar from "./NavBar.jsx";
import Sidebar from "./SideBar.jsx";
import {BrowserRouter as Router ,Routes ,Route, Link} from 'react-router-dom';
// for this we have install 'react-router-dom' using command "npm install react-router-dom"
import HWorkout from "./workout_pages/HomeWorkout.jsx";
import GWorkout from "./workout_pages/GymWorkout.jsx";
// import { Link } from "react-router-dom";

import Workouts from "./sidebar_pages/Workout_library.jsx";
import Plans from "./sidebar_pages/My_Plans.jsx";
import Progress from "./sidebar_pages/Progress_tracker.jsx";
import Settings from "./sidebar_pages/Setting.jsx";



function App() {
  const [open, setOpen] = useState(true);

function HomeContent(){
  return (
    <>
    <h1 style={{ color:'white'}}>Choose Your Workout</h1>
      <section className='section1'> 
        <div id="heading3"><FaHome/></div><br/>
        <p id='para'>Train in the confort  of your home with <br/> minimal equipment</p> 
        <Link to="/HWorkout" className="noLink">
          <button className="button1">HomeWorkout</button>
        </Link>
      </section>
      <section  className='section2'> 
        <div id="heading3"><FaDumbbell/></div><br/>
        <p id='para' >Access a wide range of equipment and <br/>maximize your training</p> 
        <Link to="/GWorkout" className="noLink">
          <button className="button2">GymWorkout</button>
        </Link>
      </section>
      </>
  );
}


  return (
    <Router>
      
        <NavBar/>
        <Sidebar open={open} setOpen={setOpen} />

      <main className="mainPart">
      

      <Routes>
        <Route path="/" element={<HomeContent />} />
        <Route path="/HWorkout" element={<HWorkout />} />
        <Route path="/GWorkout" element={<GWorkout />} />
        <Route path="/workouts" element={<Workouts />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      </main>
    </Router>

  );
}

export default App;
