import React from "react";
import {Link, link} from 'react-router-dom';
import "./Authentication.css";
import SignUp from "./SignUp";

function SignIn({ setShowSignIn, setShowSignUp }) {
  return (
    <div className="authentication_page">
      <header>
      <h2>Sign In</h2>
      <p className="para1"> Sign in to continue your fitness  journey </p>
      </header>
      <br/>
      <div >
      <p className="credential" > Email: </p>
      <input className="Email_textbox" type="email" placeholder="Enter your Email: "/>
      <p className="credential">Password: </p>
      <input className="Pass_textbox" type="password" placeholder="Enter your password"/>
      </div>
      <div>
        <button className="signIN_button">Sign IN</button>
      </div>
      <p>
   Don't have an account?{" "}
  {/* <button
    className="link-btn"
    onClick={() => {
      setShowSignIn(false);
      setShowSignUp(true);
    }}
  >
    Sign up
  </button> */}
  <Link to="/signup"  onClick={() => {
      setShowSignIn(false);
      setShowSignUp(true);
    }}>Sign Up</Link>
</p>


      {/* Add your form fields later */}
    </div>
  );
}
export default SignIn;