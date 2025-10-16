import React, { useState } from "react";
import {FaHome, FaChartLine, FaDumbbell, FaCog, FaClipboardList,  FaBars} from  "react-icons/fa";
import logo from './logo.svg';
import './App.css';
import NavBar from "./NavBar.js";
import Sidebar from "./SideBar.js";



function App() {
  const [open, setOpen] = useState(true);
  return (
    <div >
      
        <NavBar/>
        <Sidebar open={open} setOpen={setOpen} />
      {/* <main className={open? "mainPart" : "mainPart collapsed"}>  */}
      <main className="mainPart">
      <h1 style={{ color:'white'}}>Choose Your Workout</h1>
      <section className='section1'> 
        <div id="heading3"><FaHome/></div><br/>
        <p id='para'>Train in the confort  of your home with <br/> minimal equipment</p> 
        <button className="button1" >Home workout</button>
      </section>
      <section  className='section2'> 
        <div id="heading3"><FaDumbbell/></div><br/>
        <p id='para' >Access a wide range of equipment and <br/>maximize your training</p> 
        <button className="button2" >Gym workout</button>
      </section>
      </main>
    </div>

  );
}

export default App;
