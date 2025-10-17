import React,{ useState} from "react";
import {FaHome, FaChartLine, FaDumbbell, FaCog, FaClipboardList,  FaBars} from  "react-icons/fa";
 // we have to install react icons for this "npm install react-icons" 
import './App.css';
import { Link } from "react-router-dom";


function Sidebar({ open, setOpen }){

    
    return (

        <aside className={open? "sidebar":"sidebar collapsed"} >
            <button className="toggle-btn" onClick={()=>setOpen(!open)}>
                <FaBars/>
            </button>
            <Link to="/" className="noLink">                    
             <button id="sidebarButton"  ><FaHome/><span className="label">Home</span></button><br/>
            </Link>
            <Link to="/workouts" className="noLink">            
              <button id="sidebarButton" ><FaDumbbell/><span className="label">Workouts Library</span></button><br/>
            </Link>
            <Link to="/plans" className="noLink">
              <button id="sidebarButton" ><FaClipboardList/><span className="label">My Plans</span> </button><br/>
            </Link>
            <Link to="/progress" className="noLink">
             <button id="sidebarButton" >< FaChartLine/><span className="label">Progress Tracker</span> </button><br/>
            </Link>
            <Link to="/settings" className="noLink">
            <button id="sidebarButton" >< FaCog/> <span className="label">Settings</span> </button>
            </Link>
        </aside>
    );
}
export default Sidebar;