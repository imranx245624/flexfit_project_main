import React from "react";
import "./SignIn.css";

function SignIn() {
  return (
    <div className="sign-in-wrapper">
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
        <button className="signIN_button"> Sign IN</button>
      </div>

      {/* Add your form fields later */}
    </div>
  );
}
export default SignIn;