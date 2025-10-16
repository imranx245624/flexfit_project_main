import React,{ useState} from "react";
import {FaHome, FaChartLine, FaDumbbell, FaCog, FaClipboardList,  FaBars} from  "react-icons/fa";
 // we have to install react icons for this "npm install react-icons" 
import './App.css';

function Sidebar({ open, setOpen }){

    
    return (

        <aside className={open? "sidebar":"sidebar collapsed"} >
            <button className="toggle-btn" onClick={()=>setOpen(!open)}>
                <FaBars/>
            </button>
            <button id="sidebarButton"  ><FaHome/><span className="label">Home</span></button><br/>
            <button id="sidebarButton" ><FaDumbbell/><span className="label">Workouts Library</span></button><br/>
            <button id="sidebarButton" ><FaClipboardList/><span className="label">My Plans</span> </button><br/>
            <button id="sidebarButton" >< FaChartLine/><span className="label">Progress Tracker</span> </button><br/>
            <button id="sidebarButton" >< FaCog/> <span className="label">Settings</span> </button>
        </aside>
    );
}
export default Sidebar;