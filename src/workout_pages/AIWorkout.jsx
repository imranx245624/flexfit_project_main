// src/workout_pages/AIWorkout.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import { useLocation, useNavigate } from "react-router-dom";
/* TODO: DO NOT CHANGE API CALLS (supabase) */
import { supabase } from "../utils/supabaseClient";
import "./aiWorkout.css";

function AIWorkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const rawWorkoutName = String(location.state?.workoutName || "Push Ups");
  const workoutLabel = rawWorkoutName;
  const workoutName = rawWorkoutName.trim().toLowerCase();

  // REFS & STATE
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const busyRef = useRef(false);

  const lastState = useRef("up");
  const repsRef = useRef(0);
  const repAccuraciesRef = useRef([]);
  const lastMovementRef = useRef(Date.now());
  const lastRepTime = useRef(0);

  const inactivityTimerRef = useRef(null);
  const postRepTimerRef = useRef(null);
  const startCountdownRef = useRef(null);

  const startTimeRef = useRef(null);
  const angleHistory = useRef([]);
  const missingPoseFramesRef = useRef(0);

  // UI
  const [sessionState, setSessionState] = useState("IDLE"); // 'IDLE' | 'PREPARING' | 'ACTIVE' | 'SUMMARY'
  const [showIntro, setShowIntro] = useState(true);
  const [poseStatus, setPoseStatus] = useState("Press Start to begin");
  const [poseConfidence, setPoseConfidence] = useState(0);
  const [reps, setReps] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [exerciseStats, setExerciseStats] = useState({ avgAngle: 0, maxAngle: 0, minAngle: 180, depthPercentage: 0 });
  const [alerts, setAlerts] = useState([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [ecaPoints, setEcaPoints] = useState(0);
  const [startCountdown, setStartCountdown] = useState(0);

  // weight input on start overlay
  const [weightKg, setWeightKg] = useState(55);

  // small: video scale (0.8 => zoomed out a bit). change value here only if needed.
  const VIDEO_SCALE = 0.8;

  // prevent double save
  const savingRef = useRef(false);

  // voice
  const voiceCooldownRef = useRef(0);
  const speak = useCallback((text) => {
    if (!("speechSynthesis" in window)) return;
    const now = Date.now();
    if (text === "Go!" || now - voiceCooldownRef.current > 1200) {
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
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  /* ---------------- Math helpers ----------------- */
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
  const getBodyStraightness = (kp) => {
    if (!kp[5] || !kp[11]) return 90;
    return Math.round(getAngle(kp[5], kp[11], kp[15] || kp[14] || kp[13] || kp[12]));
  };

  /* ---------------- readiness & form ---------------- */
  const isPushupReady = (kp) => {
    if (!kp[5] || !kp[7] || !kp[9]) return false;
    if (kp[5].score < 0.25 || kp[7].score < 0.25 || kp[9].score < 0.25) return false;
    const elbow = getAngle(kp[5], kp[7], kp[9]);
    const body = getBodyStraightness(kp);
    return elbow > 140 && body > 140;
  };
  const isPlankReady = (kp) => getBodyStraightness(kp) > 150;
  const isSquatReady = (kp) => {
    if (!kp[11] || !kp[13] || !kp[15]) return false;
    const knee = getAngle(kp[11], kp[13], kp[15]);
    return knee > 160 && getBodyStraightness(kp) > 140;
  };
  const isLungeReady = (kp) => {
    if (!kp[11] || !kp[13] || !kp[15]) return false;
    const knee = getAngle(kp[11], kp[13], kp[15]);
    return knee > 150 && getBodyStraightness(kp) > 140;
  };

  const assessFormQuality = (pose, exerciseType) => {
    if (!pose?.keypoints) return 0;
    const kp = pose.keypoints;
    let score = 100;
    const newAlerts = [];

    if ((kp[11]?.score ?? 0) < 0.2 && exerciseType !== "pullup") {
      setAlerts(["Move closer to camera"]);
      return 30;
    }

    const horizontal = Math.abs((kp[5]?.y ?? 0) - (kp[11]?.y ?? 0)) < 150;

    if (exerciseType === "pushup") {
      const straight = getBodyStraightness(kp);
      if (straight < 140) {
        score -= 50;
        newAlerts.push("Straighten your back");
      }
      if (!horizontal) score = 0;
    } else if (exerciseType === "plank") {
      const straight = getBodyStraightness(kp);
      if (straight < 150) {
        score = 40;
        newAlerts.push("Hips too low/high");
      }
      if (!horizontal) score = 0;
    } else if (exerciseType === "squat") {
      if (Math.abs((kp[5]?.x ?? 0) - (kp[15]?.x ?? 0)) > 120) {
        score -= 30;
        newAlerts.push("Keep chest up");
      }
    }

    setAlerts(newAlerts);
    return Math.max(0, Math.round(score));
  };

  /* ----------------- Save session to localStorage (fallback) ------------------ */
  const saveSessionToStorage = (payload) => {
    try {
      const key = "flexfit_sessions";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push(payload);
      localStorage.setItem(key, JSON.stringify(existing));
      console.info("Saved session to localStorage fallback.");
    } catch (err) {
      console.error("saveSession failed:", err);
    }
  };

  /* ---------------- timers ------------------ */
  const resetInactivityTimer = () => {
    try { if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current); } catch {}
    inactivityTimerRef.current = setTimeout(() => {
      setPoseStatus("No activity — session ending");
      finalizeAndShowSave("Inactivity timeout");
    }, 10000);
  };

  const startPostRepTimer = () => {
    try { if (postRepTimerRef.current) clearTimeout(postRepTimerRef.current); } catch {}
    postRepTimerRef.current = setTimeout(() => {
      finalizeAndShowSave("Post-rep timeout");
    }, 7000);
  };

  const clearAllTimers = () => {
    try { if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current); } catch {}
    try { if (postRepTimerRef.current) clearTimeout(postRepTimerRef.current); } catch {}
    try { if (startCountdownRef.current) clearInterval(startCountdownRef.current); } catch {}
  };

  /* ---------------- finalize & show save popup ---------------- */
  const finalizeAndShowSave = (reason) => {
    clearAllTimers();
    const count = repsRef.current;
    const accuracies = repAccuraciesRef.current.slice();
    const avg = accuracies.length ? Math.round((accuracies.reduce((a,b)=>a+b,0)/accuracies.length)) : 0;
    setAvgAccuracy(avg);
    const eca = Math.round(count * avg);
    setEcaPoints(eca);

    const elapsed = startTimeRef.current ? Math.max(0, Date.now() - startTimeRef.current) : 0;

    const sessionObj = {
      date: new Date().toISOString(),
      workoutName: workoutLabel,
      repetitions: count,
      accuracy: avg,
      ecaPoints: eca,
      elapsedMs: elapsed,
      elapsedFormatted: formatTime(elapsed),
      reason,
      weightKg,
    };

    // keep local copy as fallback
    saveSessionToStorage(sessionObj);

    setShowSavePopup(true);
    setSessionState("SUMMARY");
  };

  /* ---------------- process pose ---------------- */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const processPose = useCallback((pose) => {
    if (!pose || !pose.keypoints) {
      missingPoseFramesRef.current++;
      if (missingPoseFramesRef.current > 15) {
        setPoseStatus("No person detected");
        setPoseConfidence(0);
      }
      return;
    }
    missingPoseFramesRef.current = 0;

    // draw
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      try {
        const pairs = [
          [5,6],[5,7],[7,9],[6,8],[8,10],[11,12],[5,11],[6,12],[11,13],[13,15]
        ];
        ctx.lineWidth = 3;
        for (const [a,b] of pairs) {
          const p1 = pose.keypoints[a];
          const p2 = pose.keypoints[b];
          if ((p1?.score ?? 0) > 0.25 && (p2?.score ?? 0) > 0.25) {
            ctx.strokeStyle = "#00ff88";
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
        pose.keypoints.forEach((kp) => {
          if ((kp?.score ?? 0) > 0.25) {
            ctx.beginPath();
            ctx.fillStyle = "#fff";
            ctx.arc(kp.x, kp.y, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      } catch (err) { /* ignore drawing errors */ }
    }

    // update pose confidence & angle smoothing (same)
    const conf = Math.round((pose.keypoints.reduce((a,k)=>a+(k.score||0),0)/pose.keypoints.length)*100);
    setPoseConfidence(conf);

    const leftShoulder = pose.keypoints[5], leftElbow = pose.keypoints[7], leftWrist = pose.keypoints[9];
    const rightShoulder = pose.keypoints[6], rightElbow = pose.keypoints[8], rightWrist = pose.keypoints[10];
    const leftElbowAngle = getAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = getAngle(rightShoulder, rightElbow, rightWrist);
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
    angleHistory.current.push(avgElbowAngle || 0);
    if (angleHistory.current.length > 60) angleHistory.current.shift();
    const recent = angleHistory.current.slice(-6);
    const smoothed = recent.reduce((a,b)=>a+b,0)/Math.max(1,recent.length);
    const maxAng = Math.round(Math.max(...angleHistory.current));
    const minAng = Math.round(Math.min(...angleHistory.current));
    setExerciseStats({ avgAngle: Math.round(smoothed), maxAngle: maxAng, minAngle: minAng, depthPercentage: 0 });

    // determine exercise
    let exerciseType = "pushup";
    if (workoutName.includes("plank")) exerciseType = "plank";
    else if (workoutName.includes("push")) exerciseType = "pushup";
    else if (workoutName.includes("squat")) exerciseType = "squat";
    else if (workoutName.includes("burpee")) exerciseType = "burpee";
    else if (workoutName.includes("lunge")) exerciseType = "lunge";
    else if (workoutName.includes("pull")) exerciseType = "pullup";

    const readyFn = {
      pushup: isPushupReady,
      plank: isPlankReady,
      squat: isSquatReady,
      lunge: isLungeReady,
    }[exerciseType] || (() => true);

    if (sessionState === "PREPARING") {
      if (readyFn(pose.keypoints)) {
        setPoseStatus("Hold start position");
        resetInactivityTimer();
      } else {
        setPoseStatus("Get into start position");
      }
      return;
    }

    if (sessionState === "IDLE") {
      const ready = readyFn(pose.keypoints);
      if (ready) {
        if (!lastRepTime.current) lastRepTime.current = Date.now();
        const holdTime = Date.now() - lastRepTime.current;
        if (holdTime > 1200) {
          setSessionState("ACTIVE");
          speak("Go!");
          setPoseStatus("Active");
          lastMovementRef.current = Date.now();
          resetInactivityTimer();
          if (exerciseType === "plank" && !startTimeRef.current) {
            startTimeRef.current = Date.now();
          }
        } else {
          setPoseStatus("Get ready...");
        }
      } else {
        setPoseStatus("Get into start position");
      }
      return;
    }

    if (sessionState === "ACTIVE") {
      const prev = angleHistory.current[angleHistory.current.length - 12] || smoothed;
      let isMoving = Math.abs(smoothed - prev) > 4;
      if (exerciseType === "plank") isMoving = true;
      if (isMoving) lastMovementRef.current = Date.now();

      resetInactivityTimer();

      const currentFormScore = assessFormQuality(pose, exerciseType);
      setFormScore(currentFormScore);

      if (exerciseType === "pushup") {
        if (avgElbowAngle < 100 && lastState.current === "up") {
          lastState.current = "down";
          setPoseStatus("Down");
        } else if (avgElbowAngle > 150 && lastState.current === "down") {
          lastState.current = "up";
          repsRef.current += 1;
          if (!startTimeRef.current) startTimeRef.current = Date.now();
          setReps(repsRef.current);
          repAccuraciesRef.current.push(currentFormScore);
          lastRepTime.current = Date.now();
          startPostRepTimer();
          speak(String(repsRef.current));
          setPoseStatus("Rep!");
        }
      } else if (exerciseType === "squat") {
        const kneeAngle = getAngle(pose.keypoints[11], pose.keypoints[13], pose.keypoints[15]);
        if (kneeAngle < 100 && lastState.current === "up") {
          lastState.current = "down";
          setPoseStatus("Down");
        } else if (kneeAngle > 160 && lastState.current === "down") {
          lastState.current = "up";
          repsRef.current += 1;
          if (!startTimeRef.current) startTimeRef.current = Date.now();
          setReps(repsRef.current);
          repAccuraciesRef.current.push(currentFormScore);
          lastRepTime.current = Date.now();
          startPostRepTimer();
          speak(String(repsRef.current));
          setPoseStatus("Rep!");
        }
      } else if (exerciseType === "plank") {
        if (!startTimeRef.current) startTimeRef.current = Date.now();
        setElapsedMs(Date.now() - startTimeRef.current);
      } else if (exerciseType === "lunge" || exerciseType === "burpee" || exerciseType === "pullup") {
        if (avgElbowAngle < 110 && lastState.current === "up") {
          lastState.current = "down";
        } else if (avgElbowAngle > 150 && lastState.current === "down") {
          lastState.current = "up";
          repsRef.current += 1;
          if (!startTimeRef.current) startTimeRef.current = Date.now();
          setReps(repsRef.current);
          repAccuraciesRef.current.push(currentFormScore);
          lastRepTime.current = Date.now();
          startPostRepTimer();
          speak(String(repsRef.current));
          setPoseStatus("Rep!");
        }
      }

      const accList = repAccuraciesRef.current;
      const avgAcc = accList.length ? Math.round(accList.reduce((a,b)=>a+b,0)/accList.length) : 0;
      setAvgAccuracy(avgAcc);
      setEcaPoints(Math.round(repsRef.current * avgAcc));

      if (startTimeRef.current) {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
    }
  }, [sessionState, workoutName, speak, workoutLabel]);

  /* ---------------- DETECTOR ---------------- */
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
      setPoseStatus("Error loading model (main thread)");
    }
  }, []);

  /* ---------------- main loop ---------------- */
  useEffect(() => {
    let stream = null;
    let mounted = true;

    const startCameraAndRun = async () => {
      try {
        // request typical camera but also allow smaller resolution to make person smaller in view
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false
        });

        const video = webcamRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        try { await video.play(); } catch {}
        const canvas = canvasRef.current;
        // set canvas intrinsic size to video size so drawing coordinates match,
        // but visual will be scaled by CSS (VIDEO_SCALE).
        if (canvas && video.videoWidth && video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          // also set video element width/height attributes for correct layout
          video.width = video.videoWidth;
          video.height = video.videoHeight;
        } else if (canvas) {
          canvas.width = 640;
          canvas.height = 480;
          video.width = 640;
          video.height = 480;
        }

        await runDetector();

        const loop = async () => {
          if (!mounted) return;
          rafRef.current = requestAnimationFrame(loop);
          if (!detectorRef.current || !webcamRef.current) return;
          if (busyRef.current) return;
          busyRef.current = true;
          try {
            const poses = await detectorRef.current.estimatePoses(webcamRef.current);
            if (poses && poses.length) {
              const p = poses[0];
              const poseObj = {
                keypoints: (p.keypoints || []).map(k => ({ x: k.x, y: k.y, score: k.score })),
                score: p.score ?? (p.keypoints ? (p.keypoints.reduce((a,b)=>a+(b.score||0),0)/p.keypoints.length) : 0)
              };
              processPose(poseObj);
            } else {
              processPose(null);
            }
          } catch (err) {
            console.error("estimatePoses err:", err);
          } finally {
            busyRef.current = false;
          }
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        console.error("Camera / detector init failed:", err);
        setPoseStatus("Error initializing camera");
      }
    };

    if (!showIntro && sessionState !== "SUMMARY") {
      startCameraAndRun();
    }

    return () => {
      mounted = false;
      try { if (rafRef.current) cancelAnimationFrame(rafRef.current); } catch {}
      try { if (stream) stream.getTracks().forEach((t) => t.stop()); } catch {}
      try { if (detectorRef.current?.dispose) detectorRef.current.dispose(); } catch {}
      detectorRef.current = null;
      clearAllTimers();
      startTimeRef.current = null;
      try { window.dispatchEvent(new CustomEvent("flexfit-hide-shell", { detail: false })); } catch (e) {}
    };
  }, [showIntro, runDetector, processPose, sessionState]);

  /* ---------------- Start ---------------- */
  const handleStart = () => {
    setShowSavePopup(false);
    setAvgAccuracy(0);
    setEcaPoints(0);
    repsRef.current = 0;
    repAccuraciesRef.current = [];
    setReps(0);
    setFormScore(100);
    setExerciseStats({ avgAngle: 0, maxAngle: 0, minAngle: 180, depthPercentage: 0 });
    startTimeRef.current = null;
    setElapsedMs(0);

    try { window.dispatchEvent(new CustomEvent("flexfit-hide-shell", { detail: true })); } catch (e) {}
    setShowIntro(false);
    setSessionState("PREPARING");
    setPoseStatus("Preparing... Get into frame");
    setStartCountdown(10);
    let timeLeft = 10;
    setStartCountdown(timeLeft);
    startCountdownRef.current = setInterval(() => {
      timeLeft -= 1;
      setStartCountdown(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(startCountdownRef.current);
        if (poseConfidence < 30) {
          speak("Please come into the frame");
          setPoseStatus("No person detected. Please come into frame");
        } else {
          setPoseStatus("Ready");
        }
        setSessionState("IDLE");
        lastState.current = "up";
        lastRepTime.current = Date.now();
        resetInactivityTimer();
      }
    }, 1000);
  };

  /* ---------------- DB: check count for today per workout_name ---------------- */
  const checkDailyCountForWorkout = async (userId, workoutNameNormalized) => {
    try {
      // day window: user's timezone considered by server; using ISO timestamps from client as a conservative approach
      const start = new Date();
      start.setHours(0,0,0,0);
      const end = new Date();
      end.setHours(23,59,59,999);

      const { data, error, count } = await supabase
        .from("workout_sessions")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("workout_name", workoutNameNormalized)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (error) {
        console.error("checkDailyCountForWorkout select error:", error);
        return { ok: false, error };
      }

      const cnt = typeof count === "number" ? count : (Array.isArray(data) ? data.length : 0);
      return { ok: true, count: cnt };
    } catch (err) {
      console.error("checkDailyCountForWorkout threw:", err);
      return { ok: false, error: err };
    }
  };

  /* ---------------- SAVE flow with checks & detailed logging ---------------- */
  const saveToDatabase = async () => {
    if (savingRef.current) {
      console.warn("Save already in progress");
      return false;
    }
    savingRef.current = true;

    try {
      // get user (prefer getSession)
      let user = null;
      try {
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) {
          console.warn("getSession error:", sessionErr);
        } else if (sessionData?.session?.user) {
          user = sessionData.session.user;
        }
      } catch (e) {
        console.warn("getSession threw", e);
      }

      if (!user) {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error("getUser error:", userErr);
        } else if (userData?.user) {
          user = userData.user;
        }
      }

      if (!user) {
        alert("Not signed in — cannot save. Please sign in first.");
        savingRef.current = false;
        return false;
      }

      // normalize and store normalized value (client-side normalization)
      const normalizedWorkoutName = String(workoutLabel || "").trim().toUpperCase();

      console.log("DEBUG: attempting save", {
        user_id: user.id,
        normalizedWorkoutName,
        reps: repsRef.current,
        time_seconds: startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current)/1000) : Math.floor(elapsedMs/1000),
        weight_kg: Number(parseFloat(weightKg) || 0),
        accuracy: avgAccuracy,
        eca_points: ecaPoints,
        created_at: new Date().toISOString(),
      });

      // pre-check: how many already today
      const check = await checkDailyCountForWorkout(user.id, normalizedWorkoutName);
      if (!check.ok) {
        console.error("Pre-check failed:", check.error);
        alert("Could not verify daily count before saving. See console for details.");
        savingRef.current = false;
        return false;
      }
      if (check.count >= 5) {
        alert(`Daily limit reached: you already saved ${check.count} sessions for "${normalizedWorkoutName}" today. (Max 5 allowed between 00:00 and 23:59)`);
        savingRef.current = false;
        return false;
      }

      const sessionPayload = {
        user_id: user.id,
        workout_name: normalizedWorkoutName,
        workout_type: workoutName.includes("plank") ? "TIME" : "REPS",
        reps: repsRef.current || 0,
        time_seconds: startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current)/1000) : Math.floor(elapsedMs/1000),
        weight_kg: Number(parseFloat(weightKg) || 0),
        accuracy: avgAccuracy,
        eca_points: ecaPoints,
        created_at: new Date().toISOString(),
      };

      const { data: insertData, error: insertErr } = await supabase
        .from("workout_sessions")
        .insert([sessionPayload])
        .select();

      if (insertErr) {
        console.error("workout_sessions insert error:", insertErr);
        alert("Could not save session — DB error: " + (insertErr.message || JSON.stringify(insertErr)));
        saveSessionToStorage({ ...sessionPayload, note: "insert failed, saved locally", dbError: insertErr });
        savingRef.current = false;
        return false;
      }

      // success
      console.log("Insert result:", insertData);
      alert("Session saved!");
      setShowSavePopup(false);
      try { window.dispatchEvent(new CustomEvent("flexfit-hide-shell", { detail: false })); } catch (e) {}

      // reset local UI
      repsRef.current = 0;
      repAccuraciesRef.current = [];
      setReps(0);
      setAvgAccuracy(0);
      setEcaPoints(0);
      setSessionState("IDLE");
      startTimeRef.current = null;
      setElapsedMs(0);

      savingRef.current = false;
      return true;
    } catch (err) {
      console.error("Unexpected saveToDatabase error:", err);
      alert("Unexpected error saving session. Check console.");
      saveSessionToStorage({
        user_id: null,
        workoutName: workoutLabel,
        reps: repsRef.current,
        accuracy: avgAccuracy,
        eca_points: ecaPoints,
        time_seconds: startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current)/1000) : Math.floor(elapsedMs/1000),
        created_at: new Date().toISOString(),
        note: "unexpected save error",
        error: err
      });
      savingRef.current = false;
      return false;
    }
  };

  const handleDiscard = () => {
    setShowSavePopup(false);
    try { window.dispatchEvent(new CustomEvent("flexfit-hide-shell", { detail: false })); } catch (e) {}
    repsRef.current = 0;
    repAccuraciesRef.current = [];
    setReps(0);
    setAvgAccuracy(0);
    setEcaPoints(0);
    setSessionState("IDLE");
    startTimeRef.current = null;
    setElapsedMs(0);
  };

  // debug logging inside handleSaveClick (minimal change)
  const handleSaveClick = async () => {
    console.log("DEBUG: handleSaveClick called");
    try {
      const ok = await saveToDatabase();
      console.log("DEBUG: saveToDatabase returned ->", ok);
    } catch (e) {
      console.error("DEBUG handleSaveClick error:", e);
    }
  };

  const handleExit = (fromPopup = false) => {
    try { window.dispatchEvent(new CustomEvent("flexfit-hide-shell", { detail: false })); } catch (e) {}
    const returnTo = location.state?.returnTo || location.state?.from || (location.state?.origin === "gym" ? "/GWorkout" : "/HWorkout");
    navigate(returnTo || "/HWorkout");
  };

  useEffect(() => {
    try {
      if (showIntro) {
        window.dispatchEvent(new CustomEvent("flexfit-hide-shell", { detail: false }));
      } else if (showSavePopup) {
        window.dispatchEvent(new CustomEvent("flexfit-hide-shell", { detail: false }));
      } else {
        window.dispatchEvent(new CustomEvent("flexfit-hide-shell", { detail: true }));
      }
    } catch (e) {}
  }, [showIntro, showSavePopup]);

  return (
    <>
      {!showIntro && (
        <button
          className="ai-exit-top"
          aria-label="Back"
          onClick={() => handleExit(false)}
        >
          ←
        </button>
      )}

      {showIntro && (
        <div className="ai-intro-overlay">
          <div className="ai-intro-card">
            <h2 className="ai-intro-title">{workoutLabel}</h2>
            <p className="ai-intro-sub">Press START then get into position within 10s.</p>

            <div className="ai-intro-row">
              <label className="ai-intro-label">Weight (kg):</label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="ai-intro-weight"
              />
            </div>

            <div className="ai-intro-actions">
              <button className="ai-btn-start" onClick={handleStart}>▶ START</button>
              <button className="ai-btn-exit" onClick={() => handleExit(false)}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {showSavePopup && (
        <div className="ai-popup-backdrop">
          <div className="ai-popup">
            <h3>Save Session</h3>
            <div className="ai-popup-row"><span>Workout:</span><strong>{workoutLabel}</strong></div>
            <div className="ai-popup-row"><span>Reps:</span><strong>{repsRef.current}</strong></div>
            <div className="ai-popup-row"><span>Avg Accuracy:</span><strong>{avgAccuracy}%</strong></div>
            <div className="ai-popup-row"><span>ECA Points:</span><strong>{ecaPoints}</strong></div>
            <div className="ai-popup-row"><span>Time:</span><strong>{formatTime(startTimeRef.current ? (Date.now() - startTimeRef.current) : 0)}</strong></div>
            <div className="ai-popup-row"><span>Weight:</span><strong>{Number(parseFloat(weightKg) || 0)} kg</strong></div>

            <div className="ai-popup-actions">
              <button className="ai-btn ai-btn-save" onClick={handleSaveClick}>Save</button>
              <button className="ai-btn ai-btn-cancel" onClick={handleDiscard}>Cancel</button>
              <button className="ai-btn ai-btn-exit" onClick={() => handleExit(true)}>Exit</button>
            </div>
          </div>
        </div>
      )}

      <div className={`ai-root ${showIntro ? "ai-with-shell" : "ai-fullscreen"}`}>
        <div className="ai-video-area">
          <video
            ref={webcamRef}
            className="ai-video"
            playsInline
            muted
            style={{ transform: `scaleX(-1) scale(${VIDEO_SCALE})` }}
          />
          <canvas
            ref={canvasRef}
            className="ai-canvas"
            style={{ transform: `scaleX(-1) scale(${VIDEO_SCALE})` }}
          />
        </div>

        <div className="ai-left-stats">
          <div className="stat small">
            <div className="stat-label">Reps</div>
            <div className="stat-value">{reps}</div>
          </div>

          <div className="stat small">
            <div className="stat-label">Accuracy</div>
            <div className="stat-value">{avgAccuracy}%</div>
          </div>

          <div className="stat small">
            <div className="stat-label">ECA</div>
            <div className="stat-value">{ecaPoints}</div>
          </div>

          <div className="stat small stat-status">
            <div className="stat-label">Status</div>
            <div className="stat-value">{poseStatus}</div>
          </div>
        </div>

        <aside className="ai-right-panel">
          <h4 className="ai-right-title">Performance</h4>
          <div className="ai-right-row">Pose Confidence: <strong>{poseConfidence}%</strong></div>
          <div className="ai-right-row small"><span>Avg Angle</span><strong>{exerciseStats.avgAngle}°</strong></div>
          <div className="ai-right-row small"><span>Max / Min</span><strong>{exerciseStats.maxAngle}° / {exerciseStats.minAngle}°</strong></div>

          <div className="ai-right-tips">
            <div className="tips-title">Form Tips</div>
            {alerts.length ? alerts.map((a, i) => <div key={i} className="tip-item">• {a}</div>) : <div className="tip-item">All good</div>}
          </div>
        </aside>

        <div className="ai-bottom-bar">
          <div className="formbar">
            <div className="formbar-label">Form Score</div>
            <div className="formbar-track"><div className="formbar-fill" style={{ width: `${formScore}%` }} /></div>
            <div className="formbar-prep">{sessionState === "PREPARING" ? `Preparing... ${startCountdown}s` : (sessionState === "ACTIVE" ? `Time: ${formatTime(elapsedMs)}` : "")}</div>
          </div>

          <div className="ai-bottom-actions">
            <button className="ai-btn-save-fixed" onClick={() => { setShowSavePopup(true); try { window.dispatchEvent(new CustomEvent("flexfit-hide-shell", { detail: false })); } catch (e) {} }}>Save Session</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AIWorkout;
