// src/workout_pages/AIWorkout.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import { useLocation } from "react-router-dom";

function AIWorkout() {
  const location = useLocation();
  const rawWorkoutName = String(location.state?.workoutName || "Push Ups");
  const workoutLabel = rawWorkoutName;
  const workoutName = rawWorkoutName.trim().toLowerCase();

  // ---------------- REFS ----------------
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const busyRef = useRef(false);
  const processingRef = useRef(false);

  // Internal counters
  const lastState = useRef("up");
  const repsRef = useRef(0);
  const lastRepTime = useRef(0);
  
  // Smoothing & Buffers
  const angleHistory = useRef([]);
  const missingPoseFramesRef = useRef(0); 
  const badFormFramesRef = useRef(0);     

  // Plank timer
  const startTimeRef = useRef(null);

  // Session Control Refs
  const lastMovementRef = useRef(Date.now());
  const holdStartRef = useRef(null); 
  
  // 🟢 FIX: This was missing in your code, causing the error
  const lastActiveTimeRef = useRef(Date.now());

  // Summary Tracking Refs
  const totalFramesRef = useRef(0);
  const goodFormFramesRef = useRef(0);

  // ---------------- CONSTANTS ----------------
  const HOLD_THRESHOLD = 2000; // 2 seconds to start
  const STOP_THRESHOLD = 4000; // 4s inactivity to stop
  const FRAME_INTERVAL = 66;   // ~15 FPS

  // ---------------- UI STATE ----------------
  const [showIntro, setShowIntro] = useState(true);
  const [poseStatus, setPoseStatus] = useState("Hold still...");
  const [formScore, setFormScore] = useState(100);
  const [poseConfidence, setPoseConfidence] = useState(0);
  const [reps, setReps] = useState(0);
  const [showBigGo, setShowBigGo] = useState(false);
  const [startProgress, setStartProgress] = useState(0); 
  
  const [exerciseStats, setExerciseStats] = useState({
    avgAngle: 0,
    maxAngle: 0,
    minAngle: 180,
    depthPercentage: 0,
  });

  const [alerts, setAlerts] = useState([]);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Session State
  const [sessionState, setSessionState] = useState("IDLE"); 
  const [showSavePopup, setShowSavePopup] = useState(false);

  // ---------------- HELPER FUNCTIONS ----------------

  const voiceCooldownRef = useRef(0);
  const speak = useCallback((text) => {
    if (!("speechSynthesis" in window)) return;
    const now = Date.now();
    if (text === "Go!" || now - voiceCooldownRef.current > 1400) {
        voiceCooldownRef.current = now;
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utt);
    }
  }, []);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const accuracy =
    totalFramesRef.current === 0
      ? 0
      : Math.round(
          (goodFormFramesRef.current / totalFramesRef.current) * 100
        );

  /* --------------------- MATH HELPERS --------------------- */
  const getAngle = (a, b, c) => {
    if (!a || !b || !c) return 180;
    const abx = a.x - b.x, aby = a.y - b.y;
    const cbx = c.x - b.x, cby = c.y - b.y;
    const dot = abx * cbx + aby * cby;
    const magA = Math.hypot(abx, aby) || 1;
    const magC = Math.hypot(cbx, cby) || 1;
    const cos = Math.min(1, Math.max(-1, dot / (magA * magC)));
    return (Math.acos(cos) * 180) / Math.PI;
  };
  const getDistance = (p1, p2) => {
    if (!p1 || !p2) return 0;
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  };
  const calculateDepth = (kneeAngle) =>
    Math.max(0, Math.min(100, ((180 - kneeAngle) / 90) * 100));
  const getBodyStraightness = (kp) => {
    if (!kp[5] || !kp[11] || !kp[15] || kp[11].score < 0.3 || kp[15].score < 0.3) return 90;
    const s = kp[5], h = kp[11], a = kp[15];
    return Math.round(getAngle(s, h, a));
  };
  const getPullHeight = (kp) => {
    const shoulder = kp[5];
    const wrist = kp[9];
    if (!shoulder || !wrist) return 0;
    return Math.round(shoulder.y - wrist.y);
  };
  
  const checkGeometry = (keypoints, exercise) => {
    if (!keypoints) return false;
    const shoulderY = (keypoints[5].y + keypoints[6].y) / 2;
    const hipY = (keypoints[11].y + keypoints[12].y) / 2;
    
    if (keypoints[11].score < 0.3 && keypoints[12].score < 0.3) return false;

    if (exercise === "pushup" || exercise === "plank") {
      const isHorizontal = Math.abs(shoulderY - hipY) < 150; 
      return isHorizontal;
    } 
    if (exercise === "squat" || exercise === "lunge" || exercise === "pullup") {
      const isVertical = shoulderY < (hipY - 50); 
      return isVertical;
    }
    if (exercise === "burpee") return true;
    return true; 
  };

  const isPushupReady = (kp) => {
    if(kp[5].score < 0.3 || kp[7].score < 0.3 || kp[9].score < 0.3) return false; 
    const elbow = getAngle(kp[5], kp[7], kp[9]);
    const body = getBodyStraightness(kp);
    return elbow > 150 && body > 150;
  };
  const isPlankReady = (kp) => {
    const body = getBodyStraightness(kp);
    return body > 160;
  };
  const isSquatReady = (kp) => {
    const knee = getAngle(kp[11], kp[13], kp[15]);
    const body = getBodyStraightness(kp);
    return knee > 160 && body > 150;
  };
  const isLungeReady = (kp) => {
    const knee = getAngle(kp[11], kp[13], kp[15]);
    const body = getBodyStraightness(kp);
    return knee > 150 && body > 150;
  };
  const isBurpeeReady = (kp) => {
    const knee = getAngle(kp[11], kp[13], kp[15]);
    const body = getBodyStraightness(kp);
    return knee > 160 && body > 150;
  };
  const isPullupReady = (kp) => {
    const elbow = getAngle(kp[5], kp[7], kp[9]);
    return elbow > 150;
  };

  /* --------------------- DRAWING --------------------- */
  const drawPose = (pose, ctx) => {
    if (!pose?.keypoints || !ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const pairs = poseDetection.util.getAdjacentPairs(
      poseDetection.SupportedModels.MoveNet
    );

    pairs.forEach(([a, b]) => {
      const p1 = pose.keypoints[a];
      const p2 = pose.keypoints[b];
      if ((p1?.score ?? 0) > 0.35 && (p2?.score ?? 0) > 0.35) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = `rgba(0, 255, 0, 0.8)`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });

    pose.keypoints.forEach((kp) => {
      if ((kp.score ?? 0) > 0.35) {
        ctx.beginPath();
        ctx.fillStyle = "#fff";
        ctx.arc(kp.x, kp.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  /* --------------------- FORM ASSESSMENT --------------------- */
  const assessFormQuality = (pose, exerciseType) => {
    if (!pose?.keypoints) return 0; 
    let score = 100;
    const kp = pose.keypoints;
    const newAlerts = [];
    
    if (exerciseType !== "pullup" && (kp[11].score < 0.2 || kp[12].score < 0.2)) {
        return 40; 
    }

    const isHorizontal = Math.abs(kp[5].y - kp[11].y) < 150; 

    if (exerciseType === "pushup") {
      const straight = getBodyStraightness(kp);
      if (straight < 140) { score -= 60; newAlerts.push("Straighten your back!"); }
      if (!isHorizontal) score = 0; 
    } 
    else if (exerciseType === "plank") {
      const straight = getBodyStraightness(kp);
      if (straight < 150) { score = 40; newAlerts.push("Hips too low or high!"); }
      if (!isHorizontal) score = 0;
    } 
    else if (exerciseType === "squat") {
      if (Math.abs(kp[5].x - kp[15].x) > 120) { score -= 30; newAlerts.push("Keep chest up!"); }
      if (Math.abs(kp[13].x - kp[14].x) < 20) { score -= 20; newAlerts.push("Push knees outward"); }
    } 
    else if (exerciseType === "lunge") {
      if (Math.abs(kp[5].x - kp[11].x) > 80) { score -= 20; newAlerts.push("Keep torso upright"); }
    } 
    else if (exerciseType === "pullup") {
      if (Math.abs(kp[5].x - kp[11].x) > 60) { score -= 30; newAlerts.push("Stop swinging!"); }
    } 
    else if (exerciseType === "burpee") {
      if (isHorizontal) {
          const straight = getBodyStraightness(kp);
          if (straight < 130) { score -= 40; newAlerts.push("Plank phase: Straighten back"); }
      }
    }

    setAlerts(newAlerts);
    return Math.max(0, Math.round(score));
  };

  /* --------------------- PROCESS POSE --------------------- */
  const processPose = useCallback(
    (pose) => {
      if (!pose?.keypoints) return;
      if (processingRef.current) return;
      if (showSavePopup || sessionState === "SUMMARY") return;
      
      processingRef.current = true;

      try {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) drawPose(pose, ctx);

        const kp = pose.keypoints;
        const now = Date.now();

        // ---------------- EXERCISE TYPE ----------------
        let exerciseType = "pushup";
        if (workoutName.includes("plank")) exerciseType = "plank";
        else if (workoutName.includes("push")) exerciseType = "pushup";
        else if (workoutName.includes("squat")) exerciseType = "squat";
        else if (workoutName.includes("burpee")) exerciseType = "burpee";
        else if (workoutName.includes("lunge")) exerciseType = "lunge";
        else if (workoutName.includes("pull")) exerciseType = "pullup";

        // ---------------- ANGLES & SMOOTHING ----------------
        const leftShoulder = kp[5], leftElbow = kp[7], leftWrist = kp[9];
        const rightShoulder = kp[6], rightElbow = kp[8], rightWrist = kp[10];
        const leftHip = kp[11], leftKnee = kp[13], leftAnkle = kp[15];

        const leftElbowAngle = getAngle(leftShoulder, leftElbow, leftWrist);
        const rightElbowAngle = getAngle(rightShoulder, rightElbow, rightWrist);
        const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
        const kneeAngle = getAngle(leftHip, leftKnee, leftAnkle);

        angleHistory.current.push(avgElbowAngle || 0);
        if (angleHistory.current.length > 50) angleHistory.current.shift();

        const recentFrames = angleHistory.current.slice(-5);
        const smoothedAngle = recentFrames.reduce((a, b) => a + b, 0) / (recentFrames.length || 1);

        const maxAngle = Math.round(Math.max(...angleHistory.current));
        const minAngle = Math.round(Math.min(...angleHistory.current));
        const depthPercentage = exerciseType === "squat" ? Math.round(calculateDepth(kneeAngle)) : 0;
        setExerciseStats({ avgAngle: Math.round(smoothedAngle), maxAngle, minAngle, depthPercentage });

        // ---------------- READY CHECK ----------------
        let ready = false;
        if (exerciseType === "pushup") ready = isPushupReady(kp);
        else if (exerciseType === "plank") ready = isPlankReady(kp);
        else if (exerciseType === "squat") ready = isSquatReady(kp);
        else if (exerciseType === "lunge") ready = isLungeReady(kp);
        else if (exerciseType === "burpee") ready = isBurpeeReady(kp);
        else if (exerciseType === "pullup") ready = isPullupReady(kp);

        // ---------------- IDLE -> ACTIVE (BUFFERED) ----------------
        if (sessionState === "IDLE") {
            if (ready) {
                badFormFramesRef.current = 0; 

                if (!holdStartRef.current) holdStartRef.current = now;
                const holdTime = now - holdStartRef.current;
                const progress = Math.min(100, (holdTime / HOLD_THRESHOLD) * 100);
                setStartProgress(progress); 

                if (holdTime > HOLD_THRESHOLD) {
                    setSessionState("ACTIVE");
                    setShowBigGo(true);
                    setTimeout(() => setShowBigGo(false), 1500);
                    speak("Go!");
                    lastMovementRef.current = now;
                    holdStartRef.current = null;
                    setStartProgress(0);
                } else {
                    const remaining = Math.ceil((HOLD_THRESHOLD - holdTime) / 1000);
                    if(remaining > 0) setPoseStatus(`Hold... ${remaining}`);
                }
            } else {
                badFormFramesRef.current++;
                if (badFormFramesRef.current > 10) {
                    holdStartRef.current = null;
                    setStartProgress(0);
                    setPoseStatus("Get into start position");
                }
            }
            return; 
        }

        // ---------------- ACTIVE LOGIC ----------------
        if (sessionState === "ACTIVE") {
             
             // A. MOTION DETECTION
             const prevSmoothed = angleHistory.current[angleHistory.current.length - 15] || smoothedAngle;
             let isMoving = false;
             if (exerciseType === "plank") {
                 if (ready) isMoving = true;
             } else if (exerciseType === "burpee") {
                 if (poseConfidence > 60) isMoving = true; 
             } else {
                 if (Math.abs(smoothedAngle - prevSmoothed) > 3) isMoving = true;
             }

             if (isMoving) {
                 lastMovementRef.current = now;
             }

             // B. INACTIVITY CHECK
             if (now - lastMovementRef.current > STOP_THRESHOLD) {
                setShowSavePopup(true);
                speak("Workout paused due to inactivity.");
                return;
             }

             // C. ACCURACY MATH & GATEKEEPER
             const currentFormScore = assessFormQuality(pose, exerciseType);
             const isGeometryValid = checkGeometry(kp, exerciseType);

             totalFramesRef.current++;
             
             if (currentFormScore >= 80 && isGeometryValid) {
                 goodFormFramesRef.current++;
             }

             if (currentFormScore < 50 || !isGeometryValid) {
                 setPoseStatus("⚠️ Fix Form / Position");
                 return;
             }

             // D. COUNTING LOGIC
             if (exerciseType === "plank") {
                 if (!startTimeRef.current) startTimeRef.current = now;
                 setElapsedMs(now - startTimeRef.current);
                 setPoseStatus("Good Plank");
             } 
             else if (exerciseType === "pushup") {
               if (avgElbowAngle < 90 && lastState.current === "up") {
                 lastState.current = "down";
                 setPoseStatus("Down");
               } else if (avgElbowAngle > 160 && lastState.current === "down") {
                 lastState.current = "up";
                 repsRef.current++;
                 setReps(repsRef.current);
                 speak(repsRef.current.toString());
                 setPoseStatus("Up!");
                 lastRepTime.current = now;
               }
             } 
             else if (exerciseType === "squat") {
               if (kneeAngle < 100 && lastState.current === "up") {
                 lastState.current = "down";
                 setPoseStatus("Down");
               } else if (kneeAngle > 160 && lastState.current === "down") {
                 lastState.current = "up";
                 repsRef.current++;
                 setReps(repsRef.current);
                 speak(repsRef.current.toString());
                 setPoseStatus("Up!");
                 lastRepTime.current = now;
               }
             } 
             else if (exerciseType === "burpee") {
               const shoulderY = (kp[5].y + kp[6].y) / 2;
               if (shoulderY > 300 && lastState.current === "up") { 
                   lastState.current = "down";
                   setPoseStatus("Down");
               } else if (shoulderY < 200 && lastState.current === "down") {
                   lastState.current = "up";
                   repsRef.current++;
                   setReps(repsRef.current);
                   speak("Burpee!");
                   setPoseStatus("Jump!");
                   lastRepTime.current = now;
               }
             } 
             else if (exerciseType === "lunge") {
               const knee = getAngle(kp[11], kp[13], kp[15]);
               if (knee < 100 && lastState.current === "up") {
                 lastState.current = "down";
                 setPoseStatus("Down");
               } else if (knee > 160 && lastState.current === "down") {
                 lastState.current = "up";
                 repsRef.current++;
                 setReps(repsRef.current);
                 speak("Up");
                 setPoseStatus("Up!");
                 lastRepTime.current = now;
               }
             } 
             else if (exerciseType === "pullup") {
               const wristY = (kp[9].y + kp[10].y) / 2;
               const shoulderY = (kp[5].y + kp[6].y) / 2;
               if (shoulderY > wristY + 100 && lastState.current === "up") {
                 lastState.current = "down";
                 setPoseStatus("Hanging");
               } else if (shoulderY < wristY + 20 && lastState.current === "down") {
                 lastState.current = "up";
                 repsRef.current++;
                 setReps(repsRef.current);
                 speak("Pull!");
                 setPoseStatus("Chin Up!");
                 lastRepTime.current = now;
               }
             }
        }

      } catch (err) {
        console.error("processPose error:", err);
      } finally {
        processingRef.current = false;
      }
    },
    [workoutName, speak, sessionState, showSavePopup, poseConfidence]
  );

  /* --------------------- DETECTOR LOGIC --------------------- */
  const detectPose = useCallback(async () => {
    if (!detectorRef.current || !webcamRef.current) return;
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const video = webcamRef.current;
      const poses = await detectorRef.current.estimatePoses(video);
      
      // 1. If person found
      if (poses && poses.length > 0) {
        missingPoseFramesRef.current = 0; 
        setPoseConfidence(Math.round((poses[0].score || 0) * 100));
        processPose(poses[0]);
      } 
      // 2. If NO person found
      else {
        missingPoseFramesRef.current++; 
        
        if (missingPoseFramesRef.current > 15) {
            setPoseStatus("No person detected");
            setPoseConfidence(0);
            
            if (sessionState === "ACTIVE") {
                 const now = Date.now();
                 if (now - lastMovementRef.current > STOP_THRESHOLD) {
                     setShowSavePopup(true);
                     speak("Workout paused. No user detected.");
                 }
            }
        }
      }
    } catch (err) {
      console.error("detectPose error:", err);
    } finally {
      busyRef.current = false;
    }
  }, [processPose, sessionState, speak]);

  const runDetector = useCallback(async () => {
    try {
      if (detectorRef.current) return;
      await tf.setBackend("webgl");
      await tf.ready();
      detectorRef.current = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );
      setPoseStatus("Model loaded");
    } catch (err) {
      console.error("runDetector error:", err);
      setPoseStatus("Error loading model");
    }
  }, []);

  /* --------------------- LIFECYCLE --------------------- */
  useEffect(() => {
    if (showIntro) return;
    let stream = null;
    // Removed unused 'canceled' variable

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        const video = webcamRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        try { video.play().catch(() => {}); } catch {}

        try {
          const canvas = canvasRef.current;
          if (canvas && video.videoWidth && video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          } else if (canvas) {
            canvas.width = 640;
            canvas.height = 480;
          }
        } catch (e) {}

        await runDetector();
        
        const loop = (time) => {
          rafRef.current = requestAnimationFrame(loop);
          if (!lastFrameTimeRef.current) lastFrameTimeRef.current = time;
          const delta = time - lastFrameTimeRef.current;
          if (delta < FRAME_INTERVAL) return;
          lastFrameTimeRef.current = time;
          if (detectorRef.current) detectPose();
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        console.error("Camera / detector init failed:", err);
        setPoseStatus("Error initializing camera");
      }
    })();

    return () => {
      try { if (rafRef.current) cancelAnimationFrame(rafRef.current); } catch {}
      try { if (stream) stream.getTracks().forEach((t) => t.stop()); } catch {}
      try { if (detectorRef.current?.dispose) detectorRef.current.dispose(); } catch {}
      detectorRef.current = null;
    };
  }, [showIntro, runDetector, detectPose]);

  return (
    <>
    {/* 🟢 "GO!" OVERLAY */}
    {showBigGo && (
      <div style={{ position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000, pointerEvents: "none" }}>
        <h1 style={{ fontSize: "12rem", color: "#00ff00", textShadow: "0 0 20px black", fontWeight: "900", animation: "popIn 0.5s ease-out" }}>GO!</h1>
      </div>
    )}

    {/* 💾 SAVE SESSION POPUP */}
    {showSavePopup && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999 }}>
        <div style={{ background: "#1c1e26", padding: "30px", borderRadius: "20px", width: "360px", border: "2px solid #76ff03", textAlign: "center" }}>
          <h2 style={{ color: "#76ff03", marginBottom: "10px" }}>🏁 Workout Finished</h2>
          <p style={{ color: "#ccc", marginBottom: "25px" }}>Do you want to save this session?</p>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
            <button onClick={() => { setShowSavePopup(false); setSessionState("IDLE"); speak("Session discarded"); }} style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "#444", color: "#fff", cursor: "pointer" }}>❌ Discard</button>
            <button onClick={() => { setShowSavePopup(false); setSessionState("SUMMARY"); speak("Session saved"); }} style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "#76ff03", color: "#000", fontWeight: "bold", cursor: "pointer" }}>💾 Save</button>
          </div>
        </div>
      </div>
    )}

    {/* 📊 WORKOUT SUMMARY */}
    {sessionState === "SUMMARY" && (
      <div style={{ position: "fixed", inset: 0, backgroundColor: "#1c1e26", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }}>
        <div style={{ background: "#2a2d34", padding: "30px", borderRadius: "20px", width: "380px", border: "2px solid #76ff03", textAlign: "center" }}>
          <h2 style={{ color: "#76ff03", marginBottom: "20px" }}>📈 Workout Summary</h2>
          <div style={{ textAlign: "left", fontSize: "16px", color: "#fff" }}>
            <p>🏋️ Exercise: <b>{workoutLabel}</b></p>
            <p>🔁 Reps: <b>{reps}</b></p>
            {workoutName.includes("plank") && (<p>⏱ Time: <b>{formatTime(elapsedMs)}</b></p>)}
            <p>🎯 Accuracy: <b style={{ color: accuracy > 80 ? "#00ff00" : "#ffcc00" }}>{accuracy}%</b></p>
          </div>
          <button onClick={() => { setSessionState("IDLE"); setReps(0); startTimeRef.current = null; repsRef.current = 0; totalFramesRef.current = 0; goodFormFramesRef.current = 0; lastActiveTimeRef.current = Date.now(); setElapsedMs(0); setStartProgress(0); }} style={{ marginTop: "25px", padding: "12px 25px", borderRadius: "12px", border: "none", background: "#76ff03", color: "#000", fontWeight: "bold", cursor: "pointer" }}>🔁 Start New Session</button>
        </div>
      </div>
    )}

    {/* 🟢 INTRO SCREEN */}
    {showIntro && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "#2a2d34", padding: "40px", borderRadius: "20px", textAlign: "center", border: "2px solid #76ff03", width: "340px" }}>
            <h2 style={{ color: "#76ff03", marginBottom: "10px" }}>{workoutLabel}</h2>
            <p style={{ color: "#ccc", marginBottom: "20px" }}>Get ready to start</p>
            <button onClick={() => setShowIntro(false)} style={{ padding: "12px 25px", fontSize: "16px", borderRadius: "10px", border: "none", cursor: "pointer", background: "#76ff03", color: "#000", fontWeight: "bold" }}>▶ START WORKOUT</button>
          </div>
        </div>
    )}

      {/* 🔽 MAIN UI */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#1c1e26", color: "white", minHeight: "100vh", padding: "20px", gap: "30px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", width: "640px" }}>
          <h2 style={{ color: "#76ff03", marginBottom: "10px" }}>🎥 Pose Detection ({workoutLabel})</h2>
          <div style={{ position: "relative", width: 640, height: 480 }}>
            <video ref={webcamRef} muted playsInline autoPlay style={{ position: "absolute", width: 640, height: 480, borderRadius: 15, transform: "scaleX(-1)", objectFit: "cover", border: sessionState === "ACTIVE" ? "4px solid #00ff00" : "4px solid #444" }} />
            <canvas ref={canvasRef} width={640} height={480} style={{ position: "absolute", borderRadius: 15, transform: "scaleX(-1)", pointerEvents: "none" }} />
          </div>
          <div style={{ marginTop: "15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {workoutName.includes("plank") ? (
                <> <span style={{ fontSize: "2rem" }}>⏱️</span> <h1 style={{ margin: 0, color: "#ffff00", fontSize: "2.5rem" }}>Plank: {formatTime(elapsedMs)}</h1> </>
              ) : (
                <> <span style={{ fontSize: "2rem" }}>📊</span> <h1 style={{ margin: 0, color: "#ffff00", fontSize: "2.5rem" }}>Reps: {reps}</h1> </>
              )}
            </div>
            
            {/* 🟢 START PROGRESS BAR */}
            {sessionState === "IDLE" && startProgress > 0 && (
                <div style={{ width: "100%", background: "#444", height: "10px", borderRadius: "5px", marginTop: "10px", overflow: "hidden" }}>
                    <div style={{ width: `${startProgress}%`, height: "100%", background: "#76ff03", transition: "width 0.1s linear" }}></div>
                </div>
            )}

            <h3 style={{ margin: "5px 0 0 0", color: sessionState === "ACTIVE" ? "#00ff00" : "#ffcc00", fontSize: "1.5rem" }}>{poseStatus}</h3>
          </div>
        </div>

        {/* 🟢 RIGHT COLUMN */}
        <div style={{ backgroundColor: "#2a2d34", padding: "20px", borderRadius: "15px", border: "2px solid #76ff03", minWidth: "300px", display: "flex", flexDirection: "column", gap: "15px", alignSelf: "flex-start", marginTop: "50px" }}>
          <h3 style={{ color: "#76ff03", marginTop: 0 }}>📊 Performance Metrics</h3>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}><span>✅ Form Quality:</span><span style={{ color: formScore > 80 ? "#00ff00" : formScore > 60 ? "#ffff00" : "#ff6600" }}>{formScore}%</span></div>
            <div style={{ backgroundColor: "#1c1e26", borderRadius: "8px", height: "15px", overflow: "hidden" }}><div style={{ height: "100%", backgroundColor: formScore > 80 ? "#00ff00" : formScore > 60 ? "#ffff00" : "#ff6600", width: `${formScore}%`, transition: "width 0.3s" }} /></div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}><span>📍 Pose Confidence:</span><span style={{ color: "#00ccff" }}>{poseConfidence}%</span></div>
            <div style={{ backgroundColor: "#1c1e26", borderRadius: "8px", height: "15px", overflow: "hidden" }}><div style={{ height: "100%", backgroundColor: "#00ccff", width: `${poseConfidence}%`, transition: "width 0.3s" }} /></div>
          </div>
          <div style={{ backgroundColor: "#1c1e26", padding: "10px", borderRadius: "8px" }}>
            <h4 style={{ color: "#76ff03", margin: "0 0 10px 0" }}>Exercise Stats:</h4>
            <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
              <div>🎯 Avg Angle: <span style={{ color: "#00ff00" }}>{exerciseStats.avgAngle}°</span></div>
              <div>📈 Max Angle: <span style={{ color: "#ffff00" }}>{exerciseStats.maxAngle}°</span></div>
              <div>📉 Min Angle: <span style={{ color: "#ff6600" }}>{exerciseStats.minAngle}°</span></div>
              {workoutName.includes("squat") && (<div>⬇️ Depth: <span style={{ color: "#00ccff" }}>{Math.round(exerciseStats.depthPercentage)}%</span></div>)}
            </div>
          </div>
          {alerts.length > 0 && (
            <div style={{ backgroundColor: "#1c1e26", padding: "10px", borderRadius: "8px", borderLeft: "4px solid #ff6600" }}>
              <h4 style={{ color: "#ff6600", margin: "0 0 8px 0" }}>Form Tips:</h4>
              {alerts.map((alert, idx) => (<div key={idx} style={{ fontSize: "12px", marginBottom: "5px", color: "#ffff00" }}>{alert}</div>))}
            </div>
          )}
          {alerts.length === 0 && (<div style={{ backgroundColor: "#1c1e26", padding: "10px", borderRadius: "8px", borderLeft: "4px solid #00ff00", textAlign: "center" }}><span style={{ color: "#00ff00", fontWeight: "bold" }}>✅ Great form! Keep it up!</span></div>)}
        </div>
      </div>
    </>
  );
}

export default AIWorkout;