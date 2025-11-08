import React, { useRef, useState } from "react";
import "./Authentication.css";
import { Input } from "postcss";

function SignUp() {
  const [image, setImage] = useState(null);
  const fileInputRef = useRef();
  const videoRef = useRef();
  const [cameraOpen, setCameraOpen] = useState(false);

  // open camera
  const openCamera = async () => {
    setCameraOpen(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  // capture photo
  const capturePhoto = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    setImage(dataUrl);
    stopCamera();
  };

  // stop camera
  const stopCamera = () => {
    let stream = videoRef.current.srcObject;
    let tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
    videoRef.current.srcObject = null;
    setCameraOpen(false);
  };

  // upload from device
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="authentication_page">
      <header>
        <h2>Create Your Account</h2>
        <p className="para1">Start your fitness journey Today</p>
      </header>

      <div className="profile-section">
        {image ? (
          <img src={image} alt="Profile" className="profile-img" />
        ) : (
          <div className="profile-placeholder"></div>
        )}

        {!cameraOpen && (
          <div className="pic_buttons_div">
            <button className="upload-btn" onClick={() => fileInputRef.current.click()}>
              Upload Picture
            </button>
            <button className="upload-btn" onClick={openCamera}>
              Open Camera
            </button>
          </div>
        )}

        {cameraOpen && (
          <div className="camera-container">
            <video ref={videoRef} autoPlay className="video-preview" />
            <button className="capture-btn" onClick={capturePhoto}>
              Capture Photo
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleUpload}
        />
         <br/><br/>
        </div>
        <div>
            <div className="credential_div">
                    <p className="credential">Username: </p>
                    <input className="username_textbox" type="username" placeholder="Username: like  _imranx_"/>
                </div><br/>
             <div className="credential_div">   
                    <p className="credential">Email: </p>
                    <input className="Email_textbox" type="email" placeholder="imran@gmail.com" />
            </div><br/>
            <div className="credential_div"> 

                    <p className="credential">Password</p>
                    <input className="Pass_textbox"  type="password" placeholder="Miniumum 8 characters" />
            </div><br/>
        </div>
        <div>
            <button className="SighUp_page">Sign Up</button>
        </div>
    </div>
  );
}

export default SignUp;
