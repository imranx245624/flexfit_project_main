import React from "react";
import './App.css';
function NavBar(){

    return(

        <header className="navbar">
            <h2 className="logo">FLEXFIT</h2>
            <div className="navDiv1"> 
                <button className="navbtn1">🔔</button>
                <img src="https://media.cgtrader.com/variants/EBG3JURk3etouQX4A6ADNDfk/e9402de08037e497d6e30785caf8580af777f2135dff941da887dc17effd7fe7/Virat%20Kohli_col.jpg"
                 alt="user" className="profile-pic" 
                 onClick={()=>setShowProfile(true)}
                 />
               
            </div>
        </header>
    );
}
export default NavBar;