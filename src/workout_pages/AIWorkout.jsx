// src/workout_pages/AIWorkout.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

function AIWorkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const rawWorkoutName = String(location.state?.workoutName || "Push Ups");
  const workoutLabel = rawWorkoutName;
  const workoutName = rawWorkoutName.trim().toLowerCase();
  const isPlankWorkout = workoutName.includes("plank");
  const isCrunchWorkout = workoutName.includes("crunch");
  const isSumoWorkout = workoutName.includes("sumo");
  const isLegRaiseWorkout =
    workoutName.includes("leg raise") || workoutName.includes("legraise");

  // ---------------- REFS ----------------
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const busyRef = useRef(false);
  const processingRef = useRef(false);
  const pausedForSaveRef = useRef(false);
  const plankActiveRef = useRef(false);
  const missingPoseFramesRef = useRef(0);
  const missingPoseStartRef = useRef(null);
  const missingPoseCueCountRef = useRef(0);
  const validPoseFramesRef = useRef(0);
  const readyFramesRef = useRef(0);
  const initTokenRef = useRef(0);

  // SMOOTHING REFS
  const smoothAnglesRef = useRef({
    elbow: 180,
    knee: 180,
    shoulderY: 0,
    hipY: 0
  });
  const prevSmoothAnglesRef = useRef({ elbow: 180, knee: 180, shoulderY: 0, hipY: 0 });

  // Internal counters
  const lastState = useRef("up");
  const repsRef = useRef(0);
  const repAccuraciesRef = useRef([]);
  const lastRepTime = useRef(0);
  const goodRepStreakRef = useRef(0);
  const goodRepMilestoneStepRef = useRef(0);
  const pushupGoodRepStreakRef = useRef(0);
  const pushupMilestoneStepRef = useRef(0);
  const lungeGoodRepStreakRef = useRef(0);
  const lungeMilestoneStepRef = useRef(0);
  const burpeeGoodRepStreakRef = useRef(0);
  const burpeeMilestoneStepRef = useRef(0);
  const pushupRepStartRef = useRef(null);
  const pushupMinElbowRef = useRef(180);
  const pushupCueCooldownRef = useRef(0);
  const pushupStartLegCueCountRef = useRef(0);
  const pushupLegInvalidFramesRef = useRef(0);
  const lungeRepStartRef = useRef(null);
  const lungeMinKneeRef = useRef(180);
  const lungeCueCooldownRef = useRef(0);
  const lungeHalfCueStepRef = useRef(0);
  const lungeDownStableFramesRef = useRef(0);
  const burpeeCueCooldownRef = useRef(0);
  const burpeeHalfCueStepRef = useRef(0);
  const burpeeRepAttemptRef = useRef(false);
  const burpeeFloorReachedRef = useRef(false);
  const burpeeMinElbowRef = useRef(180);
  const burpeeStandingShoulderRef = useRef(null);
  const burpeeMaxJumpRiseRef = useRef(0);
  const burpeeTopCaptureStartRef = useRef(null);
  const pullupGoodRepStreakRef = useRef(0);
  const pullupMilestoneStepRef = useRef(0);
  const pullupRepAttemptRef = useRef(false);
  const pullupMinDistRef = useRef(999);
  const pullupCueCooldownRef = useRef(0);
  const pullupHalfCueStepRef = useRef(0);
  const crunchGoodRepStreakRef = useRef(0);
  const crunchMilestoneStepRef = useRef(0);
  const legRaiseGoodRepStreakRef = useRef(0);
  const legRaiseMilestoneStepRef = useRef(0);
  const crunchRepAttemptRef = useRef(false);
  const crunchMaxDistanceRef = useRef(0);
  const crunchCueCooldownRef = useRef(0);
  const crunchHalfCueStepRef = useRef(0);
  const crunchUpPhaseAttemptRef = useRef(false);
  const crunchMinDistanceFromUpRef = useRef(999);
  const crunchDownStableFramesRef = useRef(0);
  const crunchStartSideCueCountRef = useRef(0);
  const legRaiseRepAttemptRef = useRef(false);
  const legRaiseMaxLiftRef = useRef(0);
  const legRaiseCueCooldownRef = useRef(0);
  const legRaiseHalfCueStepRef = useRef(0);
  const legRaiseDownStableFramesRef = useRef(0);
  const legRaiseUpPhaseAttemptRef = useRef(false);
  const legRaiseMinLiftFromUpRef = useRef(999);
  const legRaiseSideCueCountRef = useRef(0);
  const jumpingJackGoodRepStreakRef = useRef(0);
  const jumpingJackMilestoneStepRef = useRef(0);
  const jumpingJackRepAttemptRef = useRef(false);
  const jumpingJackCueCooldownRef = useRef(0);
  const jumpingJackHalfCueStepRef = useRef(0);
  const jumpingJackLastCueRef = useRef("");
  const squatRepStartRef = useRef(null);
  const squatMinKneeRef = useRef(180);
  const squatCueCooldownRef = useRef(0);
  const sumoStartCueGivenRef = useRef(false);
  const angleHistory = useRef([]);

  // Plank timer
  const startTimeRef = useRef(null);
  const plankBreakStartRef = useRef(null);
  const plankCueCooldownRef = useRef(0);
  const plankNextMilestoneRef = useRef(15);
  const plankNextBreathCueRef = useRef(20);
  const plankBreathStepRef = useRef(0);
  const plankLastCorrectionCueRef = useRef("");
  const plankSideSetupStartRef = useRef(null);
  const crunchSideSetupStartRef = useRef(null);
  const plankStartWallTimeRef = useRef(null);
  const plankElapsedCarryRef = useRef(0);

  // Session Control Refs
  const lastMovementRef = useRef(Date.now());
  const holdStartRef = useRef(null); 

  // Summary Tracking Refs
  const totalFramesRef = useRef(0);
  const goodFormFramesRef = useRef(0);
  const savingRef = useRef(false);

  // ---------------- CONSTANTS ----------------
  const HOLD_THRESHOLD = 2000; 
  const STOP_THRESHOLD = 6000; 
  const NO_PERSON_STOP_MS = 6500;
  const NO_PERSON_CUE_1_MS = 1500;
  const NO_PERSON_CUE_2_MS = 4000;
  const PLANK_BREAK_STOP_MS = 2200;
  const PLANK_CAMERA_ADJUST_MS = 4500;
  const PLANK_SEVERE_BREAK_STOP_MS = 900;
  const PLANK_START_GRACE_MS = 3000;
  const PLANK_SIDE_SETUP_HINT_DELAY_MS = 2000;
  const FRAME_INTERVAL = 66;   

  // ---------------- UI STATE ----------------
  const [showIntro, setShowIntro] = useState(true);
  const [poseStatus, setPoseStatus] = useState("Get into Position...");
  const [formScore, setFormScore] = useState(100);
  const [poseConfidence, setPoseConfidence] = useState(0);
  const [reps, setReps] = useState(0);
  const [, setStartProgress] = useState(0);
  const [buttonLocked, setButtonLocked] = useState(false);
  const [sessionState, setSessionState] = useState("IDLE"); 
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [mirrorView, setMirrorView] = useState(true);

  
  const [exerciseStats, setExerciseStats] = useState({
    avgAngle: 0,
    maxAngle: 0,
    minAngle: 180,
    depthPercentage: 0,
  });

  const [alerts, setAlerts] = useState([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [ecaPoints, setEcaPoints] = useState(0);
  const [weightKg, setWeightKg] = useState(55);
  const [finalElapsedMs, setFinalElapsedMs] = useState(0);
  const [saveError, setSaveError] = useState("");
  
  // ---------------- HELPER FUNCTIONS ----------------

  const voiceCooldownRef = useRef(0);
  const speak = useCallback((text) => {
    if (!("speechSynthesis" in window)) return;
    const now = Date.now();
    if (now - voiceCooldownRef.current < 1200) return;
    voiceCooldownRef.current = now;
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.1; 
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }, []);


  const pauseTrackingForSave = useCallback(() => {
    if (pausedForSaveRef.current) return;
    pausedForSaveRef.current = true;

    try {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    } catch {}

    try {
      if (webcamRef.current?.srcObject) {
        webcamRef.current.srcObject.getTracks().forEach((t) => t.stop());
        webcamRef.current.srcObject = null;
      }
    } catch {}

    try {
      if (detectorRef.current?.dispose) detectorRef.current.dispose();
    } catch {}
    detectorRef.current = null;
  }, []);
  const updateRepMilestoneFeedback = useCallback((exerciseType, currentFormScore) => {
    if (exerciseType === "pushup") {
      pushupGoodRepStreakRef.current += 1;
      if (pushupGoodRepStreakRef.current >= 3) {
        pushupMilestoneStepRef.current = (pushupMilestoneStepRef.current % 4) + 1;
        let message = "Nice! That's three clean pushups!";
        if (pushupMilestoneStepRef.current === 2) message = "Good form! Keep that chest low!";
        if (pushupMilestoneStepRef.current === 3) message = "That's how champions train!";
        if (pushupMilestoneStepRef.current === 4) message = "Clean reps! No shortcuts!";
        setPoseStatus(message);
        speak(message);
        pushupGoodRepStreakRef.current = 0;
        return true;
      }
      return false;
    }
    if (exerciseType === "lunge") {
      lungeGoodRepStreakRef.current += 1;
      if (lungeGoodRepStreakRef.current >= 3) {
        lungeMilestoneStepRef.current = (lungeMilestoneStepRef.current % 4) + 1;
        let message = "Good! That's three solid lunges!";
        if (lungeMilestoneStepRef.current === 2) message = "Strong legs! Keep stepping!";
        if (lungeMilestoneStepRef.current === 3) message = "That's what I'm talking about!";
        if (lungeMilestoneStepRef.current === 4) message = "Beautiful reps - stay focused!";
        setPoseStatus(message);
        speak(message);
        lungeGoodRepStreakRef.current = 0;
        return true;
      }
      return false;
    }
    if (exerciseType === "burpee") {
      burpeeGoodRepStreakRef.current += 1;
      if (burpeeGoodRepStreakRef.current >= 3) {
        burpeeMilestoneStepRef.current = (burpeeMilestoneStepRef.current % 4) + 1;
        let message = "That’s three perfect burpees!";
        if (burpeeMilestoneStepRef.current === 2) message = "That’s how burpees are done!";
        if (burpeeMilestoneStepRef.current === 3) message = "Explosive! I love it!";
        if (burpeeMilestoneStepRef.current === 4) message = "Solid control and power!";
        setPoseStatus(message);
        speak(message);
        burpeeGoodRepStreakRef.current = 0;
        return true;
      }
      return false;
    }
    if (exerciseType === "pullup") {
      pullupGoodRepStreakRef.current += 1;
      if (pullupGoodRepStreakRef.current >= 3) {
        pullupMilestoneStepRef.current = (pullupMilestoneStepRef.current % 4) + 1;
        let message = "That's three perfect reps!";
        if (pullupMilestoneStepRef.current === 2) message = "Strong and strict - love it!";
        if (pullupMilestoneStepRef.current === 3) message = "Elite form right there!";
        if (pullupMilestoneStepRef.current === 4) message = "You're locked in!";
        setPoseStatus(message);
        speak(message);
        pullupGoodRepStreakRef.current = 0;
        return true;
      }
      return false;
    }
    if (exerciseType === "crunch") {
      crunchGoodRepStreakRef.current += 1;
      if (crunchGoodRepStreakRef.current >= 3) {
        crunchMilestoneStepRef.current = (crunchMilestoneStepRef.current % 4) + 1;
        let message = "That's three clean crunches!";
        if (crunchMilestoneStepRef.current === 2) message = "That's how you work your abs!";
        if (crunchMilestoneStepRef.current === 3) message = "Abs on fire - love it!";
        if (crunchMilestoneStepRef.current === 4) message = "You're crushing those reps!";
        setPoseStatus(message);
        speak(message);
        crunchGoodRepStreakRef.current = 0;
        return true;
      }
      return false;
    }
    if (exerciseType === "legraise") {
      if (currentFormScore < 80) {
        legRaiseGoodRepStreakRef.current = 0;
        return false;
      }
      legRaiseGoodRepStreakRef.current += 1;
      if (legRaiseGoodRepStreakRef.current >= 3) {
        legRaiseMilestoneStepRef.current = (legRaiseMilestoneStepRef.current % 4) + 1;
        let message = "Great control. Three clean leg raises.";
        if (legRaiseMilestoneStepRef.current === 2) message = "Excellent tempo. Keep it smooth.";
        if (legRaiseMilestoneStepRef.current === 3) message = "Perfect reps. Stay steady.";
        if (legRaiseMilestoneStepRef.current === 4) message = "Very clean leg raises. Nice control.";
        setPoseStatus(message);
        speak(message);
        legRaiseGoodRepStreakRef.current = 0;
        return true;
      }
      return false;
    }
    if (exerciseType === "jumpingjack") {
      if (currentFormScore < 80) {
        jumpingJackGoodRepStreakRef.current = 0;
        return false;
      }
      jumpingJackGoodRepStreakRef.current += 1;
      if (jumpingJackGoodRepStreakRef.current >= 3) {
        jumpingJackMilestoneStepRef.current = (jumpingJackMilestoneStepRef.current % 3) + 1;
        let message = "Nice rhythm. Three clean jumping jacks.";
        if (jumpingJackMilestoneStepRef.current === 2) message = "Great control. Keep it smooth.";
        if (jumpingJackMilestoneStepRef.current === 3) message = "Excellent form. Keep this pace.";
        setPoseStatus(message);
        speak(message);
        jumpingJackGoodRepStreakRef.current = 0;
        return true;
      }
      return false;
    }
    if (currentFormScore >= 80) {
      goodRepStreakRef.current += 1;
      if (goodRepStreakRef.current >= 3) {
        goodRepMilestoneStepRef.current = (goodRepMilestoneStepRef.current % 3) + 1;
        let message = "Excellent 3 reps";
        if (goodRepMilestoneStepRef.current === 2) message = "Doing good reps";
        if (goodRepMilestoneStepRef.current === 3) message = "Keep doing like that";
        setPoseStatus(message);
        speak(message);
        goodRepStreakRef.current = 0;
        return true;
      }
      return false;
    }
    goodRepStreakRef.current = 0;
    return false;
  }, [speak]);
  const registerRep = useCallback((exerciseType, now, currentFormScore, voiceText, statusText = "Up!") => {
    repsRef.current++;
    setReps(repsRef.current);
    repAccuraciesRef.current.push(Number(currentFormScore) || 0);
    const accuracyList = repAccuraciesRef.current;
    const avg =
      accuracyList.length === 0
        ? 0
        : Math.round(accuracyList.reduce((sum, val) => sum + val, 0) / accuracyList.length);
    setAvgAccuracy(avg);
    setEcaPoints(Math.round(repsRef.current * avg));
    const hitMilestone = updateRepMilestoneFeedback(exerciseType, currentFormScore);
    if (!hitMilestone) {
      speak(voiceText || repsRef.current.toString());
      setPoseStatus(statusText);
    }
    lastRepTime.current = now;
  }, [speak, updateRepMilestoneFeedback]);
  const cueStrictPushup = useCallback((statusText, voiceText = statusText) => {
    const now = Date.now();
    if (now - pushupCueCooldownRef.current < 2200) return false;
    pushupCueCooldownRef.current = now;
    setPoseStatus(statusText);
    speak(voiceText);
    return true;
  }, [speak]);
  const cueStrictLunge = useCallback((statusText, voiceText = statusText) => {
    const now = Date.now();
    if (now - lungeCueCooldownRef.current < 2200) return;
    lungeCueCooldownRef.current = now;
    setPoseStatus(statusText);
    speak(voiceText);
  }, [speak]);
  const cueStrictBurpee = useCallback((statusText, voiceText = statusText) => {
    const now = Date.now();
    if (now - burpeeCueCooldownRef.current < 2200) return;
    burpeeCueCooldownRef.current = now;
    setPoseStatus(statusText);
    speak(voiceText);
  }, [speak]);
  const cueStrictPullup = useCallback((statusText, voiceText = statusText) => {
    const now = Date.now();
    if (now - pullupCueCooldownRef.current < 2200) return;
    pullupCueCooldownRef.current = now;
    setPoseStatus(statusText);
    speak(voiceText);
  }, [speak]);
  const cueStrictCrunch = useCallback((statusText, voiceText = statusText) => {
    const now = Date.now();
    if (now - crunchCueCooldownRef.current < 2200) return false;
    crunchCueCooldownRef.current = now;
    setPoseStatus(statusText);
    speak(voiceText);
    return true;
  }, [speak]);
  const cueStrictLegRaise = useCallback((statusText, voiceText = statusText) => {
    const now = Date.now();
    if (now - legRaiseCueCooldownRef.current < 3000) return false;
    legRaiseCueCooldownRef.current = now;
    setPoseStatus(statusText);
    speak(voiceText);
    return true;
  }, [speak]);
  const cueStrictJumpingJack = useCallback((statusText, voiceText = statusText) => {
    const now = Date.now();
    const sameCue = jumpingJackLastCueRef.current === voiceText;
    const cooldownMs = sameCue ? 6500 : 3200;
    if (now - jumpingJackCueCooldownRef.current < cooldownMs) {
      setPoseStatus(statusText);
      return false;
    }
    jumpingJackCueCooldownRef.current = now;
    jumpingJackLastCueRef.current = voiceText;
    setPoseStatus(statusText);
    speak(voiceText);
    return true;
  }, [speak]);
  const cueStrictSquat = useCallback((statusText, voiceText = statusText) => {
    const now = Date.now();
    if (now - squatCueCooldownRef.current < 2200) return false;
    squatCueCooldownRef.current = now;
    setPoseStatus(statusText);
    speak(voiceText);
    return true;
  }, [speak]);
  const cueStrictPlank = useCallback((statusText, voiceText = statusText, cooldownMs = 5000, force = false) => {
    const now = Date.now();
    setPoseStatus(statusText);
    if (!force && now - plankCueCooldownRef.current < cooldownMs) return;
    if (!force && "speechSynthesis" in window && window.speechSynthesis.speaking) return;
    plankCueCooldownRef.current = now;
    speak(voiceText);
  }, [speak]);
  const resetWorkoutSession = async () => {
  // stop loop
  if (rafRef.current) {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  // stop camera
  if (webcamRef.current?.srcObject) {
    webcamRef.current.srcObject.getTracks().forEach(t => t.stop());
    webcamRef.current.srcObject = null;
  }

  // dispose detector
  if (detectorRef.current?.dispose) {
    detectorRef.current.dispose();
  }
  detectorRef.current = null;
  pausedForSaveRef.current = false;
  setSessionState("IDLE");
  setShowSavePopup(false);
 // reset refs
  initTokenRef.current += 1;
  lastState.current = "up";
  repsRef.current = 0;
  repAccuraciesRef.current = [];
  goodRepStreakRef.current = 0;
  goodRepMilestoneStepRef.current = 0;
  pushupGoodRepStreakRef.current = 0;
  pushupMilestoneStepRef.current = 0;
  lungeGoodRepStreakRef.current = 0;
  lungeMilestoneStepRef.current = 0;
  burpeeGoodRepStreakRef.current = 0;
  burpeeMilestoneStepRef.current = 0;
  pullupGoodRepStreakRef.current = 0;
  pullupMilestoneStepRef.current = 0;
  crunchGoodRepStreakRef.current = 0;
  crunchMilestoneStepRef.current = 0;
  legRaiseGoodRepStreakRef.current = 0;
  legRaiseMilestoneStepRef.current = 0;
  jumpingJackGoodRepStreakRef.current = 0;
  jumpingJackMilestoneStepRef.current = 0;
  pushupRepStartRef.current = null;
  pushupMinElbowRef.current = 180;
  pushupCueCooldownRef.current = 0;
  pushupStartLegCueCountRef.current = 0;
  pushupLegInvalidFramesRef.current = 0;
  lungeRepStartRef.current = null;
  lungeMinKneeRef.current = 180;
  lungeCueCooldownRef.current = 0;
  lungeHalfCueStepRef.current = 0;
  lungeDownStableFramesRef.current = 0;
  burpeeCueCooldownRef.current = 0;
  burpeeHalfCueStepRef.current = 0;
  burpeeRepAttemptRef.current = false;
  burpeeFloorReachedRef.current = false;
  burpeeMinElbowRef.current = 180;
  burpeeStandingShoulderRef.current = null;
  burpeeMaxJumpRiseRef.current = 0;
  burpeeTopCaptureStartRef.current = null;
  pullupRepAttemptRef.current = false;
  pullupMinDistRef.current = 999;
  pullupCueCooldownRef.current = 0;
  pullupHalfCueStepRef.current = 0;
  crunchRepAttemptRef.current = false;
  crunchMaxDistanceRef.current = 0;
  crunchCueCooldownRef.current = 0;
  crunchHalfCueStepRef.current = 0;
  crunchUpPhaseAttemptRef.current = false;
  crunchMinDistanceFromUpRef.current = 999;
  crunchDownStableFramesRef.current = 0;
  crunchStartSideCueCountRef.current = 0;
  legRaiseRepAttemptRef.current = false;
  legRaiseMaxLiftRef.current = 0;
  legRaiseCueCooldownRef.current = 0;
  legRaiseHalfCueStepRef.current = 0;
  legRaiseDownStableFramesRef.current = 0;
  legRaiseUpPhaseAttemptRef.current = false;
  legRaiseMinLiftFromUpRef.current = 999;
  legRaiseSideCueCountRef.current = 0;
  jumpingJackRepAttemptRef.current = false;
  jumpingJackCueCooldownRef.current = 0;
  jumpingJackHalfCueStepRef.current = 0;
  jumpingJackLastCueRef.current = "";
  squatRepStartRef.current = null;
  squatMinKneeRef.current = 180;
  squatCueCooldownRef.current = 0;
  sumoStartCueGivenRef.current = false;
  lastRepTime.current = 0;
  angleHistory.current = [];
  startTimeRef.current = null;
  plankBreakStartRef.current = null;
  plankCueCooldownRef.current = 0;
  plankNextMilestoneRef.current = 15;
  plankNextBreathCueRef.current = 20;
  plankBreathStepRef.current = 0;
  plankLastCorrectionCueRef.current = "";
  plankSideSetupStartRef.current = null;
  crunchSideSetupStartRef.current = null;
  plankStartWallTimeRef.current = null;
  plankElapsedCarryRef.current = 0;
  holdStartRef.current = null;
  readyFramesRef.current = 0;
  plankActiveRef.current = false;
  lastMovementRef.current = Date.now();
  busyRef.current = false;
  processingRef.current = false;
  missingPoseFramesRef.current = 0;
  missingPoseStartRef.current = null;
  missingPoseCueCountRef.current = 0;
  validPoseFramesRef.current = 0;
  lastFrameTimeRef.current = 0;
  prevSmoothAnglesRef.current = { elbow: 180, knee: 180, shoulderY: 0, hipY: 0 };
  smoothAnglesRef.current = { elbow: 180, knee: 180, shoulderY: 0, hipY: 0 };

  totalFramesRef.current = 0;
  goodFormFramesRef.current = 0;
  savingRef.current = false;

  // reset UI
  setReps(0);
  setElapsedMs(0);
  setAvgAccuracy(0);
  setEcaPoints(0);
  setFinalElapsedMs(0);
  setPoseStatus("Get into starting position");
  setPoseConfidence(0);
  setAlerts([]);
  setExerciseStats({
    avgAngle: 0,
  maxAngle: 0,
  minAngle: 180,
  depthPercentage: 0,
});
  };
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAvgAccuracy = () => {
    const list = repAccuraciesRef.current || [];
    if (list.length === 0) return 0;
    return Math.round(list.reduce((sum, val) => sum + (Number(val) || 0), 0) / list.length);
  };

  const getFinalElapsedMs = useCallback(() => {
    if (isPlankWorkout) {
      return Math.max(plankElapsedCarryRef.current || 0, elapsedMs || 0);
    }
    if (startTimeRef.current) {
      return Math.max(0, Date.now() - startTimeRef.current);
    }
    return Math.max(0, elapsedMs || 0);
  }, [elapsedMs, isPlankWorkout]);

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

  const finalizeAndShowSave = useCallback((reason = "Session ended") => {
    if (showSavePopup) return;
    const count = repsRef.current || 0;
    const avg = getAvgAccuracy();
    const eca = Math.round(count * avg);
    setAvgAccuracy(avg);
    setEcaPoints(eca);
    const finalMs = getFinalElapsedMs();
    setFinalElapsedMs(finalMs);
    setSaveError("");
    setShowSavePopup(true);
  }, [showSavePopup, getFinalElapsedMs]);

  const checkDailyCountForWorkout = async (userId, workoutNameNormalized) => {
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

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

  const ensureProfileRow = async (user) => {
    if (!user?.id) return { ok: false, message: "No user id" };
    try {
      const payload = {
        id: user.id,
        email: user.email || null,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        username: user.user_metadata?.username || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      };
      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) {
        console.warn("profiles upsert error:", error);
        return { ok: false, message: error.message || "profiles upsert failed" };
      }
      return { ok: true };
    } catch (err) {
      console.warn("profiles upsert threw:", err);
      return { ok: false, message: err.message || String(err) };
    }
  };

  const saveToDatabase = async () => {
    if (savingRef.current) {
      console.warn("Save already in progress");
      return { ok: false, message: "Save already in progress. Please wait." };
    }
    savingRef.current = true;

    try {
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
        return { ok: false, message: "Not signed in - cannot save. Please sign in first." };
      }

      const profileSync = await ensureProfileRow(user);
      if (!profileSync.ok) {
        return { ok: false, message: profileSync.message || "Profile sync failed. Check profiles RLS policies." };
      }

      const normalizedWorkoutName = String(workoutLabel || "").trim().toUpperCase();
      const repsCount = repsRef.current || 0;
      const avg = getAvgAccuracy();
      const eca = Math.round(repsCount * avg);
      const elapsedForSave = finalElapsedMs || getFinalElapsedMs();

      setAvgAccuracy(avg);
      setEcaPoints(eca);
      setFinalElapsedMs(elapsedForSave);

      const check = await checkDailyCountForWorkout(user.id, normalizedWorkoutName);
      if (check.ok && check.count >= 5) {
        return {
          ok: false,
          message: `Daily limit reached: you already saved ${check.count} sessions for "${normalizedWorkoutName}" today. (Max 5 allowed between 00:00 and 23:59)`
        };
      } else if (!check.ok) {
        console.warn("Daily count check failed; continuing to save anyway.", check.error);
      }

      const sessionPayload = {
        user_id: user.id,
        workout_name: normalizedWorkoutName,
        workout_type: isPlankWorkout ? "TIME" : "REPS",
        reps: repsCount,
        time_seconds: Math.floor(elapsedForSave / 1000),
        weight_kg: Number(parseFloat(weightKg) || 0),
        accuracy: avg,
        eca_points: eca,
        created_at: new Date().toISOString(),
      };

      let { error: insertErr } = await supabase
        .from("workout_sessions")
        .insert([sessionPayload]);

      if (insertErr) {
        console.error("workout_sessions insert error:", insertErr);
        // Retry once after ensuring profile row (helps with FK constraints)
        await ensureProfileRow(user);
        const { error: retryErr } = await supabase
          .from("workout_sessions")
          .insert([sessionPayload]);
        if (!retryErr) {
          return { ok: true };
        }
        insertErr = retryErr;
        saveSessionToStorage({ ...sessionPayload, note: "insert failed, saved locally", dbError: insertErr });
        return { ok: false, message: "Could not save session - DB error: " + (insertErr.message || JSON.stringify(insertErr)) };
      }

      return { ok: true };
    } catch (err) {
      console.error("Unexpected saveToDatabase error:", err);
      saveSessionToStorage({
        user_id: null,
        workout_name: String(workoutLabel || "").trim().toUpperCase(),
        reps: repsRef.current || 0,
        accuracy: getAvgAccuracy(),
        eca_points: Math.round((repsRef.current || 0) * getAvgAccuracy()),
        time_seconds: Math.floor((finalElapsedMs || getFinalElapsedMs()) / 1000),
        weight_kg: Number(parseFloat(weightKg) || 0),
        created_at: new Date().toISOString(),
        note: "unexpected save error",
        error: err,
      });
      return { ok: false, message: "Unexpected error saving session. Check console." };
    } finally {
      savingRef.current = false;
    }
  };

  const handleSaveClick = async () => {
    if (buttonLocked) return;
    setButtonLocked(true);
    setSaveError("");
    try {
      const result = await saveToDatabase();
      if (result.ok) {
        alert("Session saved!");
        speak("Workout saved");
        setShowSavePopup(false);
        setSessionState("SUMMARY");
      } else {
        const msg = result.message || "Save failed. Please try again.";
        setSaveError(msg);
        alert(msg);
      }
    } finally {
      setButtonLocked(false);
    }
  };

  const handleDiscard = async () => {
    if (buttonLocked) return;
    setButtonLocked(true);
    speak("Workout discarded");
    setShowSavePopup(false);
    await resetWorkoutSession();
    setSessionState("IDLE");
    setButtonLocked(false);
  };

  const handleExit = () => {
    const returnTo =
      location.state?.returnTo ||
      location.state?.from ||
      (location.state?.origin === "gym" ? "/GWorkout" : "/HWorkout");
    navigate(returnTo || "/HWorkout");
  };


  useEffect(() => {
    const shouldHideShell = !showIntro;
    try {
      window.dispatchEvent(new CustomEvent("flexfit-hide-shell", { detail: shouldHideShell }));
    } catch (e) {}
    try {
      document.body.style.overflow = shouldHideShell ? "hidden" : "";
      document.documentElement.style.overflow = shouldHideShell ? "hidden" : "";
    } catch (e) {}
    return () => {
      try {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      } catch (e) {}
      try {
        window.dispatchEvent(new CustomEvent("flexfit-hide-shell", { detail: false }));
      } catch (e) {}
    };
  }, [showIntro]);

  useEffect(() => {
    if (showSavePopup) {
      pauseTrackingForSave();
    }
  }, [showSavePopup, pauseTrackingForSave]);

  /* --------------------- MATH HELPERS --------------------- */
  
  const smoothValue = (newVal, oldVal, alpha = 0.2) => {
    return (newVal * alpha) + (oldVal * (1 - alpha));
  };

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
  const getVideoHeight = () => {
    const h = canvasRef.current?.height;
    return typeof h === "number" && h > 0 ? h : 480;
  };
  const getVideoWidth = () => {
    const w = canvasRef.current?.width;
    return typeof w === "number" && w > 0 ? w : 640;
  };
  const getStanceRatio = (kp) => {
    if (!kp || !kp[5] || !kp[6] || !kp[15] || !kp[16]) return 0;
    const shoulderSpan = Math.abs((kp[5].x || 0) - (kp[6].x || 0));
    if (shoulderSpan < 1) return 0;
    const ankleSpan = Math.abs((kp[15].x || 0) - (kp[16].x || 0));
    return ankleSpan / shoulderSpan;
  };
  const isSumoStanceReady = (kp) => getStanceRatio(kp) > 1.3;
  const getBestBodySidePoints = (kp) => {
    if (!kp || kp.length < 17) return null;
    const leftReady = !!(kp[5] && kp[11] && kp[15]);
    const rightReady = !!(kp[6] && kp[12] && kp[16]);
    if (!leftReady && !rightReady) return null;

    const leftScore = leftReady
      ? (kp[5].score || 0) + (kp[11].score || 0) + (kp[15].score || 0)
      : -1;
    const rightScore = rightReady
      ? (kp[6].score || 0) + (kp[12].score || 0) + (kp[16].score || 0)
      : -1;

    if (rightScore > leftScore) {
      return { shoulder: kp[6], hip: kp[12], ankle: kp[16], side: "right" };
    }
    return { shoulder: kp[5], hip: kp[11], ankle: kp[15], side: "left" };
  };
  const getBodyStraightness = (kp) => {
    const sidePoints = getBestBodySidePoints(kp);
    if (!sidePoints) return 0;
    return Math.round(getAngle(sidePoints.shoulder, sidePoints.hip, sidePoints.ankle));
  };
  const getTrackedHipOffset = (kp) => {
    const sidePoints = getBestBodySidePoints(kp);
    if (!sidePoints) return 0;
    return (sidePoints.hip.y || 0) - (sidePoints.shoulder.y || 0);
  };
  const getTrackedTorsoLength = (kp) => {
    const sidePoints = getBestBodySidePoints(kp);
    if (!sidePoints) return 80;
    return (
      Math.hypot(
        (sidePoints.shoulder.x || 0) - (sidePoints.hip.x || 0),
        (sidePoints.shoulder.y || 0) - (sidePoints.hip.y || 0)
      ) || 80
    );
  };
  const isPlankSideView = (kp) => {
    if (!kp || !kp[5] || !kp[6] || !kp[11] || !kp[12]) return false;
    const shoulderSpan = Math.abs((kp[5].x || 0) - (kp[6].x || 0));
    const hipSpan = Math.abs((kp[11].x || 0) - (kp[12].x || 0));
    const shoulderMidX = ((kp[5].x || 0) + (kp[6].x || 0)) / 2;
    const shoulderMidY = ((kp[5].y || 0) + (kp[6].y || 0)) / 2;
    const hipMidX = ((kp[11].x || 0) + (kp[12].x || 0)) / 2;
    const hipMidY = ((kp[11].y || 0) + (kp[12].y || 0)) / 2;
    const torsoLength = Math.hypot(shoulderMidX - hipMidX, shoulderMidY - hipMidY) || 1;
    const avgSpan = (shoulderSpan + hipSpan) / 2;
    const normalizedSpan = avgSpan / torsoLength;
    const absoluteSpan = avgSpan / getVideoWidth();
    return normalizedSpan < 0.95 && absoluteSpan < 0.24;
  };
  const isCrunchSideView = (kp) => {
    return isPlankSideView(kp);
  };
  const isReliablePersonPose = (pose) => {
    if (!pose?.keypoints) return false;
    const kp = pose.keypoints;
    const poseScore = pose.score || 0;
    if (poseScore < 0.32) return false;

    const minScore = 0.35;
    const leftCoreVisible = (kp[5]?.score || 0) >= minScore && (kp[11]?.score || 0) >= minScore;
    const rightCoreVisible = (kp[6]?.score || 0) >= minScore && (kp[12]?.score || 0) >= minScore;
    if (!leftCoreVisible && !rightCoreVisible) return false;

    const confidentCount = kp.filter((p) => (p?.score || 0) >= minScore).length;
    const minConfidentCount = leftCoreVisible && rightCoreVisible ? 7 : 5;
    if (confidentCount < minConfidentCount) return false;

    const torsoLens = [];
    if (leftCoreVisible) {
      torsoLens.push(
        Math.hypot(
          (kp[5]?.x || 0) - (kp[11]?.x || 0),
          (kp[5]?.y || 0) - (kp[11]?.y || 0)
        )
      );
    }
    if (rightCoreVisible) {
      torsoLens.push(
        Math.hypot(
          (kp[6]?.x || 0) - (kp[12]?.x || 0),
          (kp[6]?.y || 0) - (kp[12]?.y || 0)
        )
      );
    }
    const torsoLen =
      torsoLens.length > 0
        ? torsoLens.reduce((sum, len) => sum + len, 0) / torsoLens.length
        : 0;
    const shoulderSpan =
      (kp[5]?.score || 0) >= minScore && (kp[6]?.score || 0) >= minScore
        ? Math.abs((kp[5]?.x || 0) - (kp[6]?.x || 0))
        : 0;
    const minBodyScale = Math.max(18, getVideoHeight() * 0.04);
    if (torsoLen < minBodyScale && shoulderSpan < minBodyScale * 0.55) return false;

    return true;
  };
const calculateDepth = (kneeAngle) => {
  return Math.max(0, Math.min(100, ((180 - kneeAngle) / 90) * 100));
};
const isPushupLegsStraight = (kp) => {
  if (!kp || kp.length < 17) return true;

  const MIN_SCORE = 0.3;
  const angles = [];

  const leftReady =
    (kp[11]?.score ?? 0) > MIN_SCORE &&
    (kp[13]?.score ?? 0) > MIN_SCORE &&
    (kp[15]?.score ?? 0) > MIN_SCORE;
  if (leftReady) angles.push(getAngle(kp[11], kp[13], kp[15]));

  const rightReady =
    (kp[12]?.score ?? 0) > MIN_SCORE &&
    (kp[14]?.score ?? 0) > MIN_SCORE &&
    (kp[16]?.score ?? 0) > MIN_SCORE;
  if (rightReady) angles.push(getAngle(kp[12], kp[14], kp[16]));

  // If legs are not confidently visible, don't hard-block workout start.
  if (angles.length === 0) return true;

  const kneeAngle = angles.reduce((sum, a) => sum + a, 0) / angles.length;
  const hipPointsReady =
    (kp[11]?.score ?? 0) > MIN_SCORE &&
    (kp[12]?.score ?? 0) > MIN_SCORE &&
    ((kp[13]?.score ?? 0) > MIN_SCORE || (kp[14]?.score ?? 0) > MIN_SCORE);
  let hipToKneeDrop = 0;
  if (hipPointsReady) {
    const hipY = (kp[11].y + kp[12].y) / 2;
    const kneeYs = [];
    if ((kp[13]?.score ?? 0) > MIN_SCORE) kneeYs.push(kp[13].y);
    if ((kp[14]?.score ?? 0) > MIN_SCORE) kneeYs.push(kp[14].y);
    if (kneeYs.length > 0) {
      const kneeY = kneeYs.reduce((sum, y) => sum + y, 0) / kneeYs.length;
      hipToKneeDrop = kneeY - hipY;
    }
  }

  const severeKneeBend = kneeAngle < 132;
  const severeKneesDropped = hipToKneeDrop > Math.max(52, getVideoHeight() * 0.13);
  const moderateShortcut =
    kneeAngle < 142 && hipToKneeDrop > Math.max(40, getVideoHeight() * 0.1);

  if (severeKneeBend || severeKneesDropped || moderateShortcut) return false;
  return true;
};
const isPushupReady = (kp) => {
  const elbow = getAngle(kp[5], kp[7], kp[9]);
  return elbow > 138;
};

  const isPlankReady = (kp) => {
  const body = getBodyStraightness(kp);
  const hipOffset = getTrackedHipOffset(kp);
  const torsoLength = getTrackedTorsoLength(kp);
  const hipThreshold = Math.max(20, torsoLength * 0.24);
  return body > 148 && hipOffset > -hipThreshold && hipOffset < hipThreshold;
};

const isSquatReady = (kp, requireSumoStance = false) => {
  const leftKnee = getAngle(kp[11], kp[13], kp[15]);
  const rightKnee = getAngle(kp[12], kp[14], kp[16]);
  const knee = (leftKnee + rightKnee) / 2;
  const body = getBodyStraightness(kp);
  const shoulderY = (kp[5].y + kp[6].y) / 2;
  const hipY = (kp[11].y + kp[12].y) / 2;
  const torsoVertical = shoulderY < hipY - 25;
  const stanceOK = !requireSumoStance || isSumoStanceReady(kp);
  return knee > 160 && body > 145 && torsoVertical && stanceOK;
};

const isLungeReady = (kp) => {
  const knee = getAngle(kp[11], kp[13], kp[15]);
  return knee > 145;
};

const isBurpeeReady = () => {
  return true; // burpee starts dynamically
};

const isPullupReady = (kp) => {
  const elbow = getAngle(kp[5], kp[7], kp[9]);
  return elbow > 150;
};
// ---------------- CRUNCH READY ----------------
const isCrunchReady = (kp) => {
  if (!kp[5] || !kp[6] || !kp[11] || !kp[12]) return false;

  // Shoulders and hips visible
  if (kp[5].score < 0.3 || kp[6].score < 0.3 || kp[11].score < 0.3 || kp[12].score < 0.3) return false;

  // Body mostly horizontal (lying down)
  const shoulderY = (kp[5].y + kp[6].y) / 2;
  const hipY = (kp[11].y + kp[12].y) / 2;

  return Math.abs(shoulderY - hipY) < 120;
};
const isLegRaiseReady = (kp) => {
  if (!kp[5] || !kp[6] || !kp[11] || !kp[12] || !kp[15] || !kp[16]) return false;
  const coreReady =
    (kp[5].score || 0) > 0.3 &&
    (kp[6].score || 0) > 0.3 &&
    (kp[11].score || 0) > 0.3 &&
    (kp[12].score || 0) > 0.3;
  if (!coreReady) return false;
  const legReady = (kp[15].score || 0) > 0.3 || (kp[16].score || 0) > 0.3;
  if (!legReady) return false;

  const shoulderY = (kp[5].y + kp[6].y) / 2;
  const hipY = (kp[11].y + kp[12].y) / 2;
  return Math.abs(shoulderY - hipY) < 135;
};
const isJumpingJackReady = (kp) => {
  if (!kp[5] || !kp[6] || !kp[11] || !kp[12] || !kp[15] || !kp[16]) return false;
  const bodyVertical = ((kp[5].y + kp[6].y) / 2) < ((kp[11].y + kp[12].y) / 2) - 14;
  const shoulderSpan = Math.abs((kp[5].x || 0) - (kp[6].x || 0)) || 1;
  const ankleSpread = Math.abs((kp[15].x || 0) - (kp[16].x || 0));
  const neutralFeet = ankleSpread < shoulderSpan * 1.9;
  return bodyVertical && neutralFeet;
};

  // ---------------- GEOMETRY VALIDATION ----------------
const checkGeometry = (kp, exerciseType) => {
  if (!kp || kp.length < 17) return false;

  const shoulderY = (kp[5]?.y + kp[6]?.y) / 2;
  const hipY = (kp[11]?.y + kp[12]?.y) / 2;

  if (!shoulderY || !hipY) return false;

  // PUSHUPS & PLANK ? body should be horizontal
  if (exerciseType === "pushup") {
    return Math.abs(shoulderY - hipY) < 175;
  }
  if (exerciseType === "plank") {
    return Math.abs(shoulderY - hipY) < 140;
  }
  if (exerciseType === "crunch" || exerciseType === "legraise") {
    return Math.abs(shoulderY - hipY) < 170;
  }

  // SQUAT / LUNGE / PULLUP ? body vertical
  if (exerciseType === "squat") {
    return shoulderY < hipY - 25;
  }
  if (exerciseType === "lunge" || exerciseType === "pullup" || exerciseType === "jumpingjack") {
    return shoulderY < hipY - 30;
  }

  // BURPEE ? mixed movement, allow
  if (exerciseType === "burpee") return true;

  return true;
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
        const avg = ((p1.score || 0) + (p2.score || 0)) / 2;
        ctx.lineWidth = 2 + avg * 3;
        ctx.strokeStyle = `rgba(0,200,255,${Math.min(0.95, avg + 0.1)})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });

    pose.keypoints.forEach((kp) => {
      if ((kp.score ?? 0) > 0.35) {
        ctx.beginPath();
        ctx.fillStyle = "#76ff03";
        ctx.arc(kp.x, kp.y, 5, 0, Math.PI * 2);
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
    const isHorizontal = Math.abs(kp[5].y - kp[11].y) < 150; 

    if (exerciseType === "pushup") {
      const straight = getBodyStraightness(kp);
      const legsStraight = isPushupLegsStraight(kp);
      if (straight < 140) {
          score -= 60; 
          newAlerts.push("Straighten your back!");
      }
      if (!legsStraight) {
          score -= 45;
          newAlerts.push("Keep your legs and body straight, no shortcuts.");
      }
      if (!isHorizontal) score = 0; 
    } 
    else if (exerciseType === "plank") {
      const straight = getBodyStraightness(kp);
      const hipOffset = getTrackedHipOffset(kp);
      const torsoLength = getTrackedTorsoLength(kp);
      const hipThreshold = Math.max(14, torsoLength * 0.18);

      if (hipOffset < -hipThreshold) {
          score = 45;
          newAlerts.push("Hips too high! Lower a bit.");
      } else if (hipOffset > hipThreshold) {
          score = 40;
          newAlerts.push("Hips dropping! Lift slightly.");
      } else if (straight < 155) {
          score = 45; 
          newAlerts.push("Lock your core and keep a straight line.");
      }
      if (!isHorizontal) score = 0;
    } 
    else if (exerciseType === "squat") {
      const shoulderX = kp[5].x;
      const ankleX = kp[15].x;
      if (Math.abs(shoulderX - ankleX) > 120) {
          score -= 30;
          newAlerts.push("Keep chest up!");
      }
      const leftKneeX = kp[13].x;
      const rightKneeX = kp[14].x;
      if (Math.abs(leftKneeX - rightKneeX) < 20) {
          score -= 20;
          newAlerts.push("Push knees outward");
      }
      if (isSumoWorkout) {
        const stanceRatio = getStanceRatio(kp);
        if (stanceRatio < 1.4) {
          score -= 35;
          newAlerts.push("Sumo squat: widen your stance.");
        }
      }
    } 
    else if (exerciseType === "lunge") {
      const shoulderX = kp[5].x;
      const hipX = kp[11].x;
      if (Math.abs(shoulderX - hipX) > 80) {
          score -= 20;
          newAlerts.push("Keep torso upright");
      }
    } 
    else if (exerciseType === "pullup") {
      const shoulderX = kp[5].x;
      const hipX = kp[11].x;
      if (Math.abs(shoulderX - hipX) > 60) {
          score -= 30;
          newAlerts.push("Stop swinging!");
      }
    } 
    else if (exerciseType === "burpee") {
      if (isHorizontal) {
          const straight = getBodyStraightness(kp);
          if (straight < 130) {
             score -= 40;
             newAlerts.push("Plank phase: Straighten back");
          }
      }
    }
    else if (exerciseType === "legraise") {
      const leftKnee = getAngle(kp[11], kp[13], kp[15]);
      const rightKnee = getAngle(kp[12], kp[14], kp[16]);
      const avgKnee = (leftKnee + rightKnee) / 2;
      if (avgKnee < 155) {
        score -= 35;
        newAlerts.push("Keep your legs straight.");
      }
      if (!isHorizontal) {
        score -= 25;
        newAlerts.push("Stay side-on and keep your core tight.");
      }
    }
    else if (exerciseType === "jumpingjack") {
      const shoulderMidX = (kp[5].x + kp[6].x) / 2;
      const hipMidX = (kp[11].x + kp[12].x) / 2;
      const torsoLean = Math.abs(shoulderMidX - hipMidX);
      if (torsoLean > 70) {
        score -= 25;
        newAlerts.push("Keep your torso upright, avoid leaning.");
      }
      const shoulderSpan = Math.abs((kp[5].x || 0) - (kp[6].x || 0)) || 1;
      const ankleSpread = Math.abs((kp[15].x || 0) - (kp[16].x || 0));
      const wristY = (kp[9].y + kp[10].y) / 2;
      const shoulderY = (kp[5].y + kp[6].y) / 2;
      const openLegs = ankleSpread > shoulderSpan * 2.1;
      const armsHigh = wristY < shoulderY - 20;

      if (openLegs && !armsHigh) {
        score -= 20;
        newAlerts.push("Raise your hands overhead when feet open.");
      }
      if (armsHigh && ankleSpread < shoulderSpan * 1.2) {
        score -= 20;
        newAlerts.push("Jump your feet wider with your arm raise.");
      }
    }

    const finalScore = Math.max(0, Math.round(score));
    setFormScore(finalScore);
    setAlerts(newAlerts);
    return finalScore;
  };

 /* --------------------- PROCESS POSE (FIXED INACTIVITY) --------------------- */
const processPose = useCallback((pose) => {
  if (!pose?.keypoints) return;
  if (processingRef.current) return;
  if (showSavePopup || sessionState === "SUMMARY") return;

  processingRef.current = true;

      try {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) drawPose(pose, ctx);

        const kp = pose.keypoints;
        const now = Date.now();
        const score = pose.score || 0;
        const canCount = now - lastRepTime.current > 600;
        setPoseConfidence(Math.round(score * 100));
        
        // ---------------- DETERMINE EXERCISE TYPE ----------------
        let exerciseType = "pushup";
        if (workoutName.includes("plank")) exerciseType = "plank";
        else if (workoutName.includes("push")) exerciseType = "pushup";
        else if (workoutName.includes("sumo")) exerciseType = "squat";
        else if (workoutName.includes("squat")) exerciseType = "squat";
        else if (workoutName.includes("burpee")) exerciseType = "burpee";
        else if (workoutName.includes("lunge")) exerciseType = "lunge";
        else if (workoutName.includes("pull")) exerciseType = "pullup";
        else if (workoutName.includes("jumping jack") || workoutName.includes("jumpingjack") || workoutName.includes("jacks")) exerciseType = "jumpingjack";
        else if (workoutName.includes("leg raise") || workoutName.includes("legraise")) exerciseType = "legraise";
        else if (workoutName.includes("crunch")) exerciseType = "crunch";
// ---------------- 1. CALCULATE & SMOOTH DATA ----------------
        const leftElbow = getAngle(kp[5], kp[7], kp[9]);
        const rightElbow = getAngle(kp[6], kp[8], kp[10]);
        const avgElbowRaw = (leftElbow + rightElbow) / 2;
        
        const leftKnee = getAngle(kp[11], kp[13], kp[15]);
        const rightKnee = getAngle(kp[12], kp[14], kp[16]);
        const avgKneeRaw = (leftKnee + rightKnee) / 2;

        const shoulderYRaw = (kp[5].y + kp[6].y) / 2;
        const hipYRaw = (kp[11].y + kp[12].y) / 2;

        // Apply Smoothing
        const smooth = smoothAnglesRef.current;
        smooth.elbow = smoothValue(avgElbowRaw, smooth.elbow, 0.3);
        smooth.knee = smoothValue(avgKneeRaw, smooth.knee, 0.3);
        smooth.shoulderY = smoothValue(shoulderYRaw, smooth.shoulderY, 0.3);
        smooth.hipY = smoothValue(hipYRaw, smooth.hipY, 0.3);

        // Stats
        angleHistory.current.push(avgElbowRaw || 0);
        if (angleHistory.current.length > 100) angleHistory.current.shift();
        
        setExerciseStats({ 
            avgAngle: Math.round((exerciseType.includes("squat") || exerciseType === "legraise") ? smooth.knee : smooth.elbow),
            maxAngle: Math.round(Math.max(...angleHistory.current)),
            minAngle: Math.round(Math.min(...angleHistory.current)),
            depthPercentage: exerciseType.includes("squat") ? Math.round(calculateDepth(smooth.knee)) : 0
        });
       // ================= IDLE STATE =================
const geometryOK = checkGeometry(kp, exerciseType);
const plankSideViewOK = exerciseType === "plank" ? isPlankSideView(kp) : true;
const crunchSideViewOK = (exerciseType === "crunch" || exerciseType === "legraise") ? isCrunchSideView(kp) : true;
const rawPushupLegsStraightOK = exerciseType === "pushup" ? isPushupLegsStraight(kp) : true;
if (exerciseType === "pushup") {
  if (!rawPushupLegsStraightOK) {
    pushupLegInvalidFramesRef.current = Math.min(pushupLegInvalidFramesRef.current + 1, 30);
  } else {
    pushupLegInvalidFramesRef.current = Math.max(pushupLegInvalidFramesRef.current - 2, 0);
  }
} else {
  pushupLegInvalidFramesRef.current = 0;
}
const pushupLegsBlocked = exerciseType === "pushup" && pushupLegInvalidFramesRef.current >= 12;

let ready = false;
if (exerciseType === "pushup") ready = isPushupReady(kp) && geometryOK;
else if (exerciseType === "plank") ready = isPlankReady(kp) && geometryOK && plankSideViewOK;
else if (exerciseType === "squat") ready = isSquatReady(kp, isSumoWorkout) && geometryOK;
else if (exerciseType === "lunge") ready = isLungeReady(kp) && geometryOK;
else if (exerciseType === "burpee") ready = isBurpeeReady(kp);
else if (exerciseType === "pullup") ready = isPullupReady(kp) && geometryOK;
else if (exerciseType === "crunch") ready = isCrunchReady(kp) && geometryOK && crunchSideViewOK;
else if (exerciseType === "legraise") ready = isLegRaiseReady(kp) && geometryOK && crunchSideViewOK;
else if (exerciseType === "jumpingjack") ready = isJumpingJackReady(kp) && geometryOK;

if (sessionState === "IDLE") {
if (!ready) {
  readyFramesRef.current = 0;
  holdStartRef.current = null;
  setStartProgress(0);
  if (exerciseType === "pushup") {
    pushupStartLegCueCountRef.current = 0;
    setPoseStatus("Get into starting position");
  } else if (exerciseType === "squat" && isSumoWorkout && !isSumoStanceReady(kp)) {
    if (!sumoStartCueGivenRef.current) {
      const spoke = cueStrictSquat("Take wide stance for sumo squat", "Take wide stance for sumo squat");
      if (spoke) {
        sumoStartCueGivenRef.current = true;
      } else {
        setPoseStatus("Take wide stance for sumo squat");
      }
    } else {
      setPoseStatus("Take wide stance for sumo squat");
    }
  } else if (exerciseType === "plank" && !plankSideViewOK) {
    if (!plankSideSetupStartRef.current) plankSideSetupStartRef.current = now;
    const setupWaitMs = now - plankSideSetupStartRef.current;
    if (setupWaitMs < PLANK_SIDE_SETUP_HINT_DELAY_MS) {
      const remainingMs = Math.max(0, PLANK_SIDE_SETUP_HINT_DELAY_MS - setupWaitMs);
      const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
      setPoseStatus(`Hold still ${remainingSec}s`);
    } else {
      cueStrictPlank(
        "Turn sideways to camera for planks",
        "Turn sideways to camera for planks",
        7000
      );
    }
  } else if ((exerciseType === "crunch" || exerciseType === "legraise") && !crunchSideViewOK) {
    if (!crunchSideSetupStartRef.current) crunchSideSetupStartRef.current = now;
    const setupWaitMs = now - crunchSideSetupStartRef.current;
    const sideCueText =
      exerciseType === "legraise"
        ? "Please turn sideways to the camera for leg raises."
        : "Turn sideways to camera for crunches";
    if (setupWaitMs < PLANK_SIDE_SETUP_HINT_DELAY_MS) {
      const remainingMs = Math.max(0, PLANK_SIDE_SETUP_HINT_DELAY_MS - setupWaitMs);
      const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
      setPoseStatus(`Hold still ${remainingSec}s`);
    } else {
      if (exerciseType === "legraise") {
        if (legRaiseSideCueCountRef.current < 2) {
          const spoke = cueStrictLegRaise(sideCueText, sideCueText);
          if (spoke) legRaiseSideCueCountRef.current += 1;
        } else {
          setPoseStatus(sideCueText);
        }
      } else {
        if (crunchStartSideCueCountRef.current < 2) {
          const spoke = cueStrictCrunch(sideCueText, sideCueText);
          if (spoke) crunchStartSideCueCountRef.current += 1;
        } else {
          setPoseStatus(sideCueText);
        }
      }
    }
  } else {
    plankSideSetupStartRef.current = null;
    crunchSideSetupStartRef.current = null;
    crunchStartSideCueCountRef.current = 0;
    setPoseStatus("Get into starting position");
  }
  return;
}
pushupStartLegCueCountRef.current = 0;
plankSideSetupStartRef.current = null;
crunchSideSetupStartRef.current = null;
crunchStartSideCueCountRef.current = 0;
readyFramesRef.current += 1;

const readyFrameTarget = exerciseType === "pushup" ? 3 : 10;
if (readyFramesRef.current < readyFrameTarget) {
  setPoseStatus("Adjust position");
  return;
}
if (!holdStartRef.current) holdStartRef.current = now;

const holdTime = now - holdStartRef.current;
const holdThresholdMs = exerciseType === "pushup" ? 600 : HOLD_THRESHOLD;
const progress = Math.min(100, (holdTime / holdThresholdMs) * 100);
setStartProgress(progress);

if (holdTime < holdThresholdMs) {
  const remainingMs = Math.max(0, holdThresholdMs - holdTime);
  const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
  setPoseStatus(`Hold steady ${remainingSec}s`);
  return;
}

// START WORKOUT
setSessionState("ACTIVE");
if (exerciseType !== "plank" && !startTimeRef.current) {
  startTimeRef.current = now;
}
if (isSumoWorkout && exerciseType === "squat") {
  setPoseStatus("Take wide stance for sumo squat");
  speak("Take wide stance for sumo squat");
} else {
  speak("Go!");
}
lastMovementRef.current = now;

// reset buffers
readyFramesRef.current = 0;
holdStartRef.current = null;
setStartProgress(0);
return;

}
  // ---------------- 3. ACTIVE STATE ----------------
        if (sessionState === "ACTIVE") {
              
              // ? FIXED: MOTION DETECTION
              // Only reset the timer if angles CHANGED significantly compared to last frame
              const prev = prevSmoothAnglesRef.current;
              const motion = Math.abs(smooth.elbow - prev.elbow) + 
                             Math.abs(smooth.knee - prev.knee) + 
                             Math.abs(smooth.shoulderY - prev.shoulderY);

              // If total motion across joints > 1.5 (arbitrary units of movement), we are active
              // If you stand perfectly still, motion will be ~0.1, and timer will tick.
              if (motion > 1.5) {
                  lastMovementRef.current = now;
              }

              // Update previous frame reference
              prevSmoothAnglesRef.current = { ...smooth };

              // Check Time Difference
              if (now - lastMovementRef.current > STOP_THRESHOLD) {
                speak("Workout paused.");
                finalizeAndShowSave("Inactivity timeout");
                return; // Stop processing
              }

              // Assess Form
              const currentFormScore = assessFormQuality(pose, exerciseType);
              
              totalFramesRef.current++;
              if (currentFormScore >= 80) goodFormFramesRef.current++;

              if (currentFormScore < 40) {
                  setPoseStatus("Fix form");
                  // Even if form is bad, if they are moving, we don't pause. 
                  // But we might not count reps.
              }

              // Counting Logic
	      if (exerciseType === "plank") {
  const hipOffset = getTrackedHipOffset(kp);
  const torsoLength = getTrackedTorsoLength(kp);
  const centerShoulderY = (kp[5].y + kp[6].y) / 2;
  const centerHipY = (kp[11].y + kp[12].y) / 2;
  const centerHipOffset = centerHipY - centerShoulderY;
  const minSideScore = 0.22;
  const leftHipOffset =
    (kp[5]?.score || 0) > minSideScore && (kp[11]?.score || 0) > minSideScore
      ? kp[11].y - kp[5].y
      : centerHipOffset;
  const rightHipOffset =
    (kp[6]?.score || 0) > minSideScore && (kp[12]?.score || 0) > minSideScore
      ? kp[12].y - kp[6].y
      : centerHipOffset;
  const maxHipDropOffset = Math.max(hipOffset, centerHipOffset, leftHipOffset, rightHipOffset);
  const minHipRiseOffset = Math.min(hipOffset, centerHipOffset, leftHipOffset, rightHipOffset);
  const hipWarnThreshold = Math.max(10, torsoLength * 0.13);
  const hipThreshold = Math.max(14, torsoLength * 0.18);
  const severeHipDropThreshold = Math.max(16, torsoLength * 0.18);
  const severeHipRiseThreshold = Math.max(24, torsoLength * 0.26);
  const severeHipDrop = maxHipDropOffset > severeHipDropThreshold;
  const severeHipRise = minHipRiseOffset < -severeHipRiseThreshold;
  const severeBreak = severeHipDrop || severeHipRise;
  const plankReadyNow = isPlankReady(kp) && geometryOK && plankSideViewOK && !severeBreak;
  const inStartGrace =
    !!plankStartWallTimeRef.current &&
    now - plankStartWallTimeRef.current < PLANK_START_GRACE_MS;

  if (plankActiveRef.current && severeHipDrop) {
    if (startTimeRef.current) {
      const finalElapsed = now - startTimeRef.current;
      plankElapsedCarryRef.current = Math.max(plankElapsedCarryRef.current, finalElapsed);
      setElapsedMs(plankElapsedCarryRef.current);
    }
    plankActiveRef.current = false;
    plankStartWallTimeRef.current = null;
    plankBreakStartRef.current = now;
    startTimeRef.current = null;
    setPoseStatus("Plank broken");
    voiceCooldownRef.current = 0;
    speak("Plank broken");
    finalizeAndShowSave("Plank broken");
    return;
  }

  if (plankReadyNow) {
    const hadStarted = !!startTimeRef.current;
    if (!startTimeRef.current) {
      const carriedMs = Math.max(0, plankElapsedCarryRef.current || 0);
      const canResumeElapsed = carriedMs > 0 && !showSavePopup;
      startTimeRef.current = canResumeElapsed ? now - carriedMs : now;
      plankStartWallTimeRef.current = now;

      const carriedSec = Math.floor(carriedMs / 1000);
      if (canResumeElapsed) {
        if (carriedSec < 15) plankNextMilestoneRef.current = 15;
        else if (carriedSec < 30) plankNextMilestoneRef.current = 30;
        else if (carriedSec < 45) plankNextMilestoneRef.current = 45;
        else if (carriedSec < 60) plankNextMilestoneRef.current = 60;
        else plankNextMilestoneRef.current = (Math.floor(carriedSec / 30) + 1) * 30;

        plankNextBreathCueRef.current = (Math.floor(carriedSec / 20) + 1) * 20;
      } else {
        plankNextMilestoneRef.current = 15;
        plankNextBreathCueRef.current = 20;
        plankBreathStepRef.current = 0;
        cueStrictPlank(
          "Set elbows under shoulders and hold.",
          "Set your elbows under shoulders. Breathe and hold.",
          3000
        );
      }
    }
    if (plankBreakStartRef.current && hadStarted) {
      startTimeRef.current += now - plankBreakStartRef.current;
      cueStrictPlank("Good correction, keep steady.", "Good correction, keep steady.", 5000);
    }
    plankBreakStartRef.current = null;
    plankLastCorrectionCueRef.current = "";
    plankActiveRef.current = true;

    const elapsed = now - startTimeRef.current;
    const stableElapsed = Math.max(plankElapsedCarryRef.current, elapsed);
    plankElapsedCarryRef.current = stableElapsed;
    setElapsedMs(stableElapsed);
    const elapsedSec = Math.floor(stableElapsed / 1000);

    if (maxHipDropOffset > hipWarnThreshold) {
      cueStrictPlank(
        "Lift hips a little to stay in line.",
        "Hips are dropping. Lift a little.",
        3600
      );
    } else if (minHipRiseOffset < -hipWarnThreshold) {
      cueStrictPlank(
        "Lower hips a little to stay in line.",
        "Hips are a bit high. Lower a little.",
        3600
      );
    } else if (elapsedSec >= plankNextMilestoneRef.current) {
      const milestone = plankNextMilestoneRef.current;
      let milestoneCue = "Strong plank, stay tight.";
      if (milestone === 15) milestoneCue = "15 seconds, keep going.";
      else if (milestone === 30) milestoneCue = "30 seconds, excellent control.";
      else if (milestone === 45) milestoneCue = "45 seconds, almost there.";
      else if (milestone === 60) milestoneCue = "1 minute, great plank.";
      cueStrictPlank(milestoneCue, milestoneCue, 5000);

      if (milestone === 15) plankNextMilestoneRef.current = 30;
      else if (milestone === 30) plankNextMilestoneRef.current = 45;
      else if (milestone === 45) plankNextMilestoneRef.current = 60;
      else plankNextMilestoneRef.current += 30;
    } else if (elapsedSec >= plankNextBreathCueRef.current) {
      plankBreathStepRef.current = (plankBreathStepRef.current % 2) + 1;
      const breathCue =
        plankBreathStepRef.current === 1
          ? "Slow inhale through your nose."
          : "Exhale and tighten your abs.";
      cueStrictPlank(breathCue, breathCue, 5000);
      plankNextBreathCueRef.current += 20;
    } else if (Date.now() - plankCueCooldownRef.current > 1400) {
      setPoseStatus("Hold steady.");
    }
    lastMovementRef.current = now;
		  } else {
		    const straight = getBodyStraightness(kp);
		    let correctionCue = "Adjust slowly and reset your plank.";

		    if (!plankSideViewOK) correctionCue = "Turn side-on to camera for plank tracking.";
		    else if (severeHipRise) correctionCue = "Hips are high. Lower with control.";
		    else if (severeHipDrop) correctionCue = "Hips dropped. Lift and reset.";
		    else if (minHipRiseOffset < -hipThreshold) correctionCue = "Lower hips a little.";
		    else if (maxHipDropOffset > hipThreshold) correctionCue = "Lift hips a little.";
		    else if (straight < 155) correctionCue = "Brace your core and keep a straight line.";
		    else if (!geometryOK) correctionCue = "Keep shoulders over elbows.";
	    const correctionChanged = plankLastCorrectionCueRef.current !== correctionCue;
	    const correctionCooldown = correctionChanged ? 3800 : 9000;
	    plankLastCorrectionCueRef.current = correctionCue;

	    if (!plankBreakStartRef.current) {
	      plankBreakStartRef.current = now;
	      cueStrictPlank(correctionCue, correctionCue, correctionCooldown, true);
	    } else {
	      setPoseStatus(correctionCue);
	      cueStrictPlank(correctionCue, correctionCue, correctionCooldown);
	    }

	      const plankStopThreshold = severeBreak
	        ? PLANK_SEVERE_BREAK_STOP_MS
	        : !plankSideViewOK
	        ? PLANK_CAMERA_ADJUST_MS
	        : PLANK_BREAK_STOP_MS;

	    if (
	      plankActiveRef.current &&
	      (severeBreak || !inStartGrace) &&
	      now - plankBreakStartRef.current >= plankStopThreshold
	    ) {
      if (startTimeRef.current) {
        const finalElapsed = now - startTimeRef.current;
        plankElapsedCarryRef.current = Math.max(plankElapsedCarryRef.current, finalElapsed);
        setElapsedMs(plankElapsedCarryRef.current);
      }
      plankActiveRef.current = false;
      plankStartWallTimeRef.current = null;
      startTimeRef.current = null;
      setPoseStatus("Plank broken");
      voiceCooldownRef.current = 0;
      speak("Plank broken");
      finalizeAndShowSave("Plank broken");
    }
  }
  return;
}              else if (exerciseType === "pushup") {
                const pushupLegsStraightNow = !pushupLegsBlocked;
                if (lastState.current === "up") {
                  if (smooth.elbow < 130 && !pushupRepStartRef.current) {
                    pushupRepStartRef.current = now;
                  }
                  if (pushupRepStartRef.current) {
                    pushupMinElbowRef.current = Math.min(pushupMinElbowRef.current, smooth.elbow);
                  }
                }

                if (smooth.elbow < 90 && lastState.current === "up") {
                  lastState.current = "down";
                  setPoseStatus("Down");
                } else if (smooth.elbow > 155 && lastState.current === "down" && canCount) {
                  lastState.current = "up";
                  if (!pushupLegsStraightNow) {
                    cueStrictPushup(
                      "Keep your legs and body straight, no shortcuts.",
                      "Keep your legs and body straight, no shortcuts."
                    );
                  } else {
                    registerRep(exerciseType, now, currentFormScore);
                  }
                  pushupRepStartRef.current = null;
                  pushupMinElbowRef.current = 180;
                } else if (
                  lastState.current === "up" &&
                  pushupRepStartRef.current &&
                  !pushupLegsStraightNow &&
                  smooth.elbow > 145
                ) {
                  cueStrictPushup(
                    "Keep your legs and body straight, no shortcuts.",
                    "Keep your legs and body straight, no shortcuts."
                  );
                  pushupRepStartRef.current = null;
                  pushupMinElbowRef.current = 180;
                } else if (
                  lastState.current === "up" &&
                  pushupRepStartRef.current &&
                  smooth.elbow > 145 &&
                  pushupMinElbowRef.current > 96
                ) {
                  cueStrictPushup(
                    "Go deep and fully retract your chest",
                    "Go deep and fully retract your chest"
                  );
                  pushupRepStartRef.current = null;
                  pushupMinElbowRef.current = 180;
                }
              } 
              else if (exerciseType === "squat") {
                const sumoReadyNow = isSumoStanceReady(kp);
                const depthTarget = isSumoWorkout ? 108 : 102;
                const downThreshold = isSumoWorkout ? 108 : 95;

                if (lastState.current === "up") {
                  if (smooth.knee < 135 && !squatRepStartRef.current) {
                    squatRepStartRef.current = now;
                  }
                  if (squatRepStartRef.current) {
                    squatMinKneeRef.current = Math.min(squatMinKneeRef.current, smooth.knee);
                  }
                }

                if (smooth.knee < downThreshold && lastState.current === "up") {
                  lastState.current = "down";
                  setPoseStatus("Deep. Drive up slow");
                } else if (smooth.knee > 165 && lastState.current === "down" && canCount) {
                  const repDuration = squatRepStartRef.current ? (now - squatRepStartRef.current) : 0;
                  const deepEnough = squatMinKneeRef.current <= depthTarget;
                  lastState.current = "up";
                  if (isSumoWorkout && !sumoReadyNow) {
                    cueStrictSquat("Widen stance for sumo squat", "Widen stance for sumo squat");
                  } else if (repDuration > 0 && repDuration < 1600) {
                    cueStrictSquat(
                      "Doing too fast",
                      "Doing too fast"
                    );
                  } else if (!deepEnough) {
                    cueStrictSquat(
                      isSumoWorkout ? "Go deeper" : "Go deeper",
                      isSumoWorkout
                        ? "Go deeper."
                        : "Go deeper and do it slow. Mind muscle connection."
                    );
                  } else if (currentFormScore < 80) {
                    cueStrictSquat("Fix form before counting");
                  } else {
                    registerRep(exerciseType, now, currentFormScore);
                  }
                  squatRepStartRef.current = null;
                  squatMinKneeRef.current = 180;
                } else if (
                  lastState.current === "up" &&
                  squatRepStartRef.current &&
                  smooth.knee > 148 &&
                  squatMinKneeRef.current > depthTarget
                ) {
                  cueStrictSquat(
                    isSumoWorkout ? "Go deeper" : "Go deeper",
                    isSumoWorkout
                      ? "Go deeper."
                      : "Go deeper and do it slow. Mind muscle connection."
                  );
                  squatRepStartRef.current = null;
                  squatMinKneeRef.current = 180;
                } else if (
                  isSumoWorkout &&
                  lastState.current === "up" &&
                  smooth.knee > 150 &&
                  !sumoReadyNow
                ) {
                  cueStrictSquat("Widen stance for sumo squat", "Widen stance for sumo squat");
                  squatRepStartRef.current = null;
                  squatMinKneeRef.current = 180;
                }
                
              } 
              else if (exerciseType === "burpee") {
                // Use raw shoulder Y here so fast jump peaks are less likely to be smoothed away.
                const shoulderY = shoulderYRaw;
                const hipY = smooth.hipY;
                const videoH = getVideoHeight();
                const jumpCueThreshold = Math.max(4, videoH * 0.008);
                const jumpMinThreshold = Math.max(2, videoH * 0.005);
                const jumpCaptureWindowMs = 180;

                // Standing: shoulders clearly above hips (vertical)
                const isStanding = shoulderY < hipY - 12;

                // Floor/plank: shoulders and hips nearly level (horizontal)
                const standingShoulder = burpeeStandingShoulderRef.current;
                const shoulderDrop = standingShoulder == null ? 0 : shoulderY - standingShoulder;
                const downDropThreshold = Math.max(38, videoH * 0.08);
                const minDropForLowCue = Math.max(16, videoH * 0.035);
                const deepElbow = avgElbowRaw < 122; // require real push-up depth
                const startedDown = shoulderDrop > minDropForLowCue;
                const reachedDown = startedDown;
                const isFloor = startedDown && deepElbow && shoulderDrop > downDropThreshold;
                const returnedUp =
                  standingShoulder == null
                    ? isStanding
                    : shoulderDrop < Math.max(8, videoH * 0.02);

                if (isStanding && lastState.current === "up" && !burpeeRepAttemptRef.current) {
                  if (burpeeStandingShoulderRef.current == null) {
                    burpeeStandingShoulderRef.current = shoulderY;
                  } else {
                    burpeeStandingShoulderRef.current = smoothValue(
                      shoulderY,
                      burpeeStandingShoulderRef.current,
                      0.12
                    );
                  }
                }

                if (reachedDown && lastState.current === "up") {
                  burpeeRepAttemptRef.current = true;
                  burpeeMaxJumpRiseRef.current = 0;
                  burpeeTopCaptureStartRef.current = null;
                }

                if (isFloor && lastState.current === "up") {
                  lastState.current = "down";
                  setPoseStatus("Down");
                  burpeeFloorReachedRef.current = true;
                  burpeeMinElbowRef.current = Math.min(burpeeMinElbowRef.current, avgElbowRaw);
                } else if (lastState.current === "down") {
                  burpeeMinElbowRef.current = Math.min(burpeeMinElbowRef.current, avgElbowRaw);
                  const currentJumpRise = standingShoulder == null ? 0 : standingShoulder - shoulderY;
                  burpeeMaxJumpRiseRef.current = Math.max(burpeeMaxJumpRiseRef.current, currentJumpRise);
                  if (returnedUp && burpeeRepAttemptRef.current && burpeeFloorReachedRef.current) {
                    if (burpeeTopCaptureStartRef.current == null) {
                      burpeeTopCaptureStartRef.current = now;
                    }
                    const topCaptureDone = now - burpeeTopCaptureStartRef.current >= jumpCaptureWindowMs;
                    if (topCaptureDone && canCount) {
                      lastState.current = "up";
                      const jumpedEnoughToCount = burpeeMaxJumpRiseRef.current > jumpMinThreshold;
                      const jumpedHighEnough = burpeeMaxJumpRiseRef.current > jumpCueThreshold;
                      const deepEnough = burpeeMinElbowRef.current < 122;

                      if (deepEnough && jumpedEnoughToCount) {
                        registerRep(exerciseType, now, currentFormScore, "Burpee!", "Rep counted!");
                        if (!jumpedHighEnough) {
                          cueStrictBurpee("Good rep. Add a bit more jump at the top.");
                        }
                      } else if (!deepEnough) {
                        cueStrictBurpee("Chest down first, then jump.");
                      } else {
                        cueStrictBurpee("Finish with a small jump at the top.");
                      }
                      burpeeRepAttemptRef.current = false;
                      burpeeFloorReachedRef.current = false;
                      burpeeMinElbowRef.current = 180;
                      burpeeMaxJumpRiseRef.current = 0;
                      burpeeTopCaptureStartRef.current = null;
                    }
                  } else {
                    burpeeTopCaptureStartRef.current = null;
                  }
                } else if (
                  returnedUp &&
                  lastState.current === "up" &&
                  burpeeRepAttemptRef.current &&
                  !burpeeFloorReachedRef.current
                ) {
                  const halfCue = "Chest down first, then jump.";
                  cueStrictBurpee(halfCue, halfCue);
                  burpeeRepAttemptRef.current = false;
                  burpeeFloorReachedRef.current = false;
                  burpeeMinElbowRef.current = 180;
                  burpeeMaxJumpRiseRef.current = 0;
                  burpeeTopCaptureStartRef.current = null;
                } else if (false && returnedUp && lastState.current === "down" && canCount) {
                  lastState.current = "up";
                  const jumpDelta = standingShoulder == null ? jumpCueThreshold + 1 : standingShoulder - shoulderY;
                  const jumpedHighEnough = jumpDelta > jumpCueThreshold;

                  if (!burpeeFloorReachedRef.current) {
                    cueStrictBurpee("Don’t rush it — complete the rep.");
                  } else if (!jumpedHighEnough) {
                    registerRep(exerciseType, now, currentFormScore, "Burpee!", "Rep counted!");
                    cueStrictBurpee("Jump higher at the top.");
                  } else {
                    registerRep(exerciseType, now, currentFormScore, "Burpee!", "Rep counted!");
                  }

                  burpeeRepAttemptRef.current = false;
                  burpeeFloorReachedRef.current = false;
                  burpeeMinElbowRef.current = 180;
                }
              } 
              else if (exerciseType === "lunge") {
                if (lastState.current === "up") {
                  if (smooth.knee < 130 && !lungeRepStartRef.current) {
                    lungeRepStartRef.current = now;
                  }
                  if (lungeRepStartRef.current) {
                    lungeMinKneeRef.current = Math.min(lungeMinKneeRef.current, smooth.knee);
                  }
                }

                if (smooth.knee < 100 && lastState.current === "up") {
                  lastState.current = "down";
                  setPoseStatus("Down");
                  lungeDownStableFramesRef.current = 1;
                } else if (lastState.current === "down" && smooth.knee < 108) {
                  lungeDownStableFramesRef.current = Math.min(lungeDownStableFramesRef.current + 1, 20);
                } else if (smooth.knee > 150 && lastState.current === "down" && canCount) {
                  const repDuration = lungeRepStartRef.current ? (now - lungeRepStartRef.current) : 0;
                  const deepEnough = lungeMinKneeRef.current < 102;
                  const downWasStable = lungeDownStableFramesRef.current >= 2;
                  lastState.current = "up";
                  if (!downWasStable || !deepEnough) {
                    lungeHalfCueStepRef.current = (lungeHalfCueStepRef.current % 3) + 1;
                    let halfCue = "Go a little deeper.";
                    if (lungeHalfCueStepRef.current === 2) halfCue = "Lower a little more with control.";
                    if (lungeHalfCueStepRef.current === 3) halfCue = "Nice balance. Give me more depth.";
                    cueStrictLunge(halfCue, halfCue);
                  } else if (repDuration > 0 && repDuration < 1500) {
                    cueStrictLunge("Too fast. Slow the rep down.", "Too fast. Slow and controlled.");
                  } else {
                    registerRep(exerciseType, now, currentFormScore, "Up");
                  }
                  lungeRepStartRef.current = null;
                  lungeMinKneeRef.current = 180;
                  lungeDownStableFramesRef.current = 0;
                } else if (
                  lastState.current === "up" &&
                  lungeRepStartRef.current &&
                  smooth.knee > 145 &&
                  lungeMinKneeRef.current > 104
                ) {
                  lungeHalfCueStepRef.current = (lungeHalfCueStepRef.current % 3) + 1;
                  let halfCue = "Go a little deeper.";
                  if (lungeHalfCueStepRef.current === 2) halfCue = "You can go deeper - control it.";
                  if (lungeHalfCueStepRef.current === 3) halfCue = "Nice balance - give me more depth.";
                  cueStrictLunge(halfCue, halfCue);
                  lungeRepStartRef.current = null;
                  lungeMinKneeRef.current = 180;
                  lungeDownStableFramesRef.current = 0;
                }
              } 
              else if (exerciseType === "pullup") {
                const wristY = (kp[9].y + kp[10].y) / 2;
                const dist = smooth.shoulderY - wristY; 
                if (lastState.current === "down") {
                  if (dist < 70) {
                    pullupRepAttemptRef.current = true;
                    pullupMinDistRef.current = Math.min(pullupMinDistRef.current, dist);
                  }
                  if (
                    pullupRepAttemptRef.current &&
                    dist > 78 &&
                    pullupMinDistRef.current > 24
                  ) {
                    pullupHalfCueStepRef.current = (pullupHalfCueStepRef.current % 3) + 1;
                    let halfCue = "Complete the full range of motion.";
                    if (pullupHalfCueStepRef.current === 2) halfCue = "No shortcuts - full reps only!";
                    if (pullupHalfCueStepRef.current === 3) halfCue = "Stretch fully, then pull strong.";
                    cueStrictPullup(halfCue, halfCue);
                    pullupRepAttemptRef.current = false;
                    pullupMinDistRef.current = 999;
                  }
                }
                if (dist > 80 && lastState.current === "up") {
                  lastState.current = "down";
                  setPoseStatus("Hanging");
                  pullupRepAttemptRef.current = false;
                  pullupMinDistRef.current = 999;
                } else if (dist < 20 && lastState.current === "down" && canCount) {
                  lastState.current = "up"; 
                  registerRep(exerciseType, now, currentFormScore, "Pull!", "Chin Up!");
                  pullupRepAttemptRef.current = false;
                  pullupMinDistRef.current = 999;
                }
              }
              else if (exerciseType === "crunch") {
                const crunchCanCount = now - lastRepTime.current > 1100;
                if (!crunchSideViewOK) {
                  cueStrictCrunch(
                    "Turn sideways to camera for crunch tracking.",
                    "Turn sideways to camera for crunch tracking."
                  );
                  crunchRepAttemptRef.current = false;
                  crunchMaxDistanceRef.current = 0;
                  crunchUpPhaseAttemptRef.current = false;
                  crunchMinDistanceFromUpRef.current = 999;
                  crunchDownStableFramesRef.current = 0;
                } else {
                  // Use smoothed values to reduce jitter-based false counts.
                  const shoulderY = smooth.shoulderY;
                  const hipY = smooth.hipY;
                  const crunchDistance = hipY - shoulderY;
                  const torsoLength = getTrackedTorsoLength(kp);

                  // Stricter thresholds to reject short reps.
                  const downThreshold = Math.max(18, torsoLength * 0.17);
                  const upMinThreshold = Math.max(downThreshold + 20, torsoLength * 0.5);
                  const upCueThreshold = Math.max(upMinThreshold + 12, torsoLength * 0.62);
                  const upDropStartThreshold = Math.max(downThreshold + 10, upMinThreshold - 12);
                  const upReturnThreshold = Math.max(upMinThreshold - 6, downThreshold + 12);

                  if (crunchDistance < downThreshold) {
                    crunchDownStableFramesRef.current = Math.min(crunchDownStableFramesRef.current + 1, 10);
                  } else {
                    crunchDownStableFramesRef.current = 0;
                  }
                  const downStable = crunchDownStableFramesRef.current >= 3;

                  // From UP position: require full return to DOWN, otherwise cue half rep from top.
                  if (lastState.current === "up") {
                    if (crunchDistance < upDropStartThreshold) {
                      crunchUpPhaseAttemptRef.current = true;
                      crunchMinDistanceFromUpRef.current = Math.min(
                        crunchMinDistanceFromUpRef.current,
                        crunchDistance
                      );
                    }

                    if (downStable) {
                      lastState.current = "down";
                      setPoseStatus("Down");
                      crunchRepAttemptRef.current = false;
                      crunchMaxDistanceRef.current = 0;
                      crunchUpPhaseAttemptRef.current = false;
                      crunchMinDistanceFromUpRef.current = 999;
                    } else if (
                      crunchUpPhaseAttemptRef.current &&
                      crunchDistance > upReturnThreshold &&
                      crunchMinDistanceFromUpRef.current > downThreshold + 4
                    ) {
                      crunchHalfCueStepRef.current = (crunchHalfCueStepRef.current % 3) + 1;
                      let topHalfCue = "Lower fully before coming up.";
                      if (crunchHalfCueStepRef.current === 2) topHalfCue = "Go all the way down, then crunch up.";
                      if (crunchHalfCueStepRef.current === 3) topHalfCue = "Half rep from top - lower fully first.";
                      cueStrictCrunch(topHalfCue, topHalfCue);
                      crunchUpPhaseAttemptRef.current = false;
                      crunchMinDistanceFromUpRef.current = 999;
                    } else if (crunchDistance > upReturnThreshold + 2) {
                      crunchUpPhaseAttemptRef.current = false;
                      crunchMinDistanceFromUpRef.current = 999;
                    }
                  }

                  // From DOWN position: require enough lift to count, otherwise cue half rep.
                  if (lastState.current === "down") {
                    if (crunchDistance > downThreshold + 8) {
                      crunchRepAttemptRef.current = true;
                      crunchMaxDistanceRef.current = Math.max(crunchMaxDistanceRef.current, crunchDistance);
                    }

                    if (
                      crunchRepAttemptRef.current &&
                      downStable &&
                      crunchMaxDistanceRef.current > downThreshold + 8 &&
                      crunchMaxDistanceRef.current < upMinThreshold
                    ) {
                      crunchHalfCueStepRef.current = (crunchHalfCueStepRef.current % 3) + 1;
                      let halfCue = "That's a half rep - finish it!";
                      if (crunchHalfCueStepRef.current === 2) halfCue = "Lower fully before the next rep.";
                      if (crunchHalfCueStepRef.current === 3) halfCue = "Good effort! Squeeze at the top.";
                      cueStrictCrunch(halfCue, halfCue);
                      crunchRepAttemptRef.current = false;
                      crunchMaxDistanceRef.current = 0;
                    }

                    if (
                      crunchRepAttemptRef.current &&
                      crunchDistance > upMinThreshold &&
                      crunchCanCount
                    ) {
                      lastState.current = "up";
                      registerRep(exerciseType, now, currentFormScore, undefined, "Crunch!");
                      if (crunchDistance < upCueThreshold) {
                        cueStrictCrunch("Good rep. Lift a little higher for a full squeeze.");
                      }
                      crunchRepAttemptRef.current = false;
                      crunchMaxDistanceRef.current = 0;
                      crunchUpPhaseAttemptRef.current = false;
                      crunchMinDistanceFromUpRef.current = 999;
                      crunchDownStableFramesRef.current = 0;
                    }
                  }
                }
              }
              else if (exerciseType === "legraise") {
                const legRaiseCanCount = now - lastRepTime.current > 1300;
                const sideCueText = "Please turn sideways to the camera for leg raises.";
                if (!crunchSideViewOK) {
                  if (legRaiseSideCueCountRef.current < 2) {
                    const spoke = cueStrictLegRaise(sideCueText, sideCueText);
                    if (spoke) legRaiseSideCueCountRef.current += 1;
                  } else {
                    setPoseStatus(sideCueText);
                  }
                  legRaiseRepAttemptRef.current = false;
                  legRaiseMaxLiftRef.current = 0;
                  legRaiseDownStableFramesRef.current = 0;
                  legRaiseUpPhaseAttemptRef.current = false;
                  legRaiseMinLiftFromUpRef.current = 999;
                } else {
                  const hipY = smooth.hipY;
                  const leftAnkleY = kp[15]?.y ?? hipY;
                  const rightAnkleY = kp[16]?.y ?? hipY;
                  const ankleY = (leftAnkleY + rightAnkleY) / 2;
                  const legLift = hipY - ankleY;
                  const torsoLength = getTrackedTorsoLength(kp);

                  const downThreshold = Math.max(8, torsoLength * 0.09);
                  const upMinThreshold = Math.max(downThreshold + 34, torsoLength * 0.74);
                  const repCountThreshold = Math.max(upMinThreshold + 8, torsoLength * 0.8);
                  const upCueThreshold = Math.max(repCountThreshold + 8, torsoLength * 0.88);
                  const upDropStartThreshold = Math.max(downThreshold + 12, upMinThreshold - 14);
                  const upReturnThreshold = Math.max(upMinThreshold - 6, downThreshold + 14);

                  if (legLift < downThreshold) {
                    legRaiseDownStableFramesRef.current = Math.min(legRaiseDownStableFramesRef.current + 1, 10);
                  } else {
                    legRaiseDownStableFramesRef.current = 0;
                  }
                  const downStable = legRaiseDownStableFramesRef.current >= 3;

                  if (lastState.current === "up") {
                    if (legLift < upDropStartThreshold) {
                      legRaiseUpPhaseAttemptRef.current = true;
                      legRaiseMinLiftFromUpRef.current = Math.min(
                        legRaiseMinLiftFromUpRef.current,
                        legLift
                      );
                    }

                    if (downStable) {
                      lastState.current = "down";
                      setPoseStatus("Legs down");
                      legRaiseRepAttemptRef.current = false;
                      legRaiseMaxLiftRef.current = 0;
                      legRaiseUpPhaseAttemptRef.current = false;
                      legRaiseMinLiftFromUpRef.current = 999;
                    } else if (
                      legRaiseUpPhaseAttemptRef.current &&
                      legLift > upReturnThreshold &&
                      legRaiseMinLiftFromUpRef.current > downThreshold + 4
                    ) {
                      legRaiseHalfCueStepRef.current = (legRaiseHalfCueStepRef.current % 3) + 1;
                      let topHalfCue = "Lower all the way down before the next rep.";
                      if (legRaiseHalfCueStepRef.current === 2) topHalfCue = "Please lower fully, then lift.";
                      if (legRaiseHalfCueStepRef.current === 3) topHalfCue = "Half rep from top. Lower fully first.";
                      cueStrictLegRaise(topHalfCue, topHalfCue);
                      legRaiseUpPhaseAttemptRef.current = false;
                      legRaiseMinLiftFromUpRef.current = 999;
                    } else if (legLift > upReturnThreshold + 3) {
                      legRaiseUpPhaseAttemptRef.current = false;
                      legRaiseMinLiftFromUpRef.current = 999;
                    }
                  }

                  if (lastState.current === "down") {
                    if (legLift > downThreshold + 8) {
                      legRaiseRepAttemptRef.current = true;
                      legRaiseMaxLiftRef.current = Math.max(legRaiseMaxLiftRef.current, legLift);
                    }

                    if (
                      legRaiseRepAttemptRef.current &&
                      downStable &&
                      legRaiseMaxLiftRef.current > downThreshold + 8 &&
                      legRaiseMaxLiftRef.current < repCountThreshold
                    ) {
                      legRaiseHalfCueStepRef.current = (legRaiseHalfCueStepRef.current % 3) + 1;
                      let halfCue = "Half rep. Lift a little higher.";
                      if (legRaiseHalfCueStepRef.current === 2) halfCue = "Almost there. Raise your legs a bit more.";
                      if (legRaiseHalfCueStepRef.current === 3) halfCue = "Good try. Lift higher for a full rep.";
                      cueStrictLegRaise(halfCue, halfCue);
                      legRaiseRepAttemptRef.current = false;
                      legRaiseMaxLiftRef.current = 0;
                    }

                    if (
                      legRaiseRepAttemptRef.current &&
                      legLift > repCountThreshold &&
                      legRaiseMaxLiftRef.current > repCountThreshold &&
                      legRaiseCanCount
                    ) {
                      lastState.current = "up";
                      registerRep(exerciseType, now, currentFormScore, undefined, "Rep counted!");
                      if (legLift < upCueThreshold) {
                        cueStrictLegRaise("Nice rep. Lift just a bit higher next time.");
                      }
                      legRaiseRepAttemptRef.current = false;
                      legRaiseMaxLiftRef.current = 0;
                      legRaiseUpPhaseAttemptRef.current = false;
                      legRaiseMinLiftFromUpRef.current = 999;
                      legRaiseDownStableFramesRef.current = 0;
                    }
                  }
                }
              }
              else if (exerciseType === "jumpingjack") {
                if (lastState.current !== "open" && lastState.current !== "closed") {
                  lastState.current = "closed";
                }
                const jumpingJackCanCount = now - lastRepTime.current > 800;

                const shoulderSpan = Math.abs((kp[5].x || 0) - (kp[6].x || 0)) || 1;
                const ankleSpread = Math.abs((kp[15].x || 0) - (kp[16].x || 0));
                const wristY = (kp[9].y + kp[10].y) / 2;
                const shoulderY = (kp[5].y + kp[6].y) / 2;
                const armsHigh = wristY < shoulderY - Math.max(14, getVideoHeight() * 0.02);
                const armsLowered = wristY > shoulderY - 8;
                const feetWide = ankleSpread > shoulderSpan * 2.0;
                const feetClosed = ankleSpread < shoulderSpan * 1.5;
                const feetNearlyClosed = ankleSpread < shoulderSpan * 1.62;
                const openPose = armsHigh && feetWide;
                const closedPose = armsLowered && feetClosed;

                if (lastState.current === "closed") {
                  if (openPose) {
                    lastState.current = "open";
                    jumpingJackRepAttemptRef.current = true;
                    setPoseStatus("Open");
                  } else if (feetWide && !armsHigh) {
                    jumpingJackHalfCueStepRef.current = (jumpingJackHalfCueStepRef.current % 2) + 1;
                    const cue =
                      jumpingJackHalfCueStepRef.current === 1
                        ? "Nice and steady. Lift your hands overhead."
                        : "Lift hands and feet together.";
                    cueStrictJumpingJack(cue, cue);
                  } else if (armsHigh && !feetWide) {
                    jumpingJackHalfCueStepRef.current = (jumpingJackHalfCueStepRef.current % 2) + 1;
                    const cue =
                      jumpingJackHalfCueStepRef.current === 1
                        ? "Open your feet a little wider."
                        : "A little wider with your feet.";
                    cueStrictJumpingJack(cue, cue);
                  }
                } else if (lastState.current === "open") {
                  const returnedClosedEnough = armsLowered && feetNearlyClosed;
                  if ((closedPose || returnedClosedEnough) && jumpingJackCanCount && jumpingJackRepAttemptRef.current) {
                    lastState.current = "closed";
                    registerRep(exerciseType, now, currentFormScore, undefined, "Rep counted!");
                    jumpingJackRepAttemptRef.current = false;
                  } else if (jumpingJackRepAttemptRef.current && !closedPose && feetClosed && armsHigh) {
                    cueStrictJumpingJack("Bring your hands down smoothly to finish.");
                  } else if (jumpingJackRepAttemptRef.current && !closedPose && !feetClosed && !armsHigh) {
                    cueStrictJumpingJack("Bring your feet back together to finish.");
                  }
                }
              }
              }
          } catch (err) {
        console.error("processPose error:", err);
      } finally {
        processingRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workoutName, speak, sessionState, showSavePopup, finalizeAndShowSave, registerRep, cueStrictSquat, cueStrictPushup, cueStrictLunge, cueStrictBurpee, cueStrictPullup, cueStrictCrunch, cueStrictLegRaise, cueStrictJumpingJack, cueStrictPlank]
  );
  
  /* --------------------- DETECTOR LOGIC --------------------- */
  const detectPose = useCallback(async () => {
  if (!detectorRef.current || !webcamRef.current) return;
  if (busyRef.current) return;

  busyRef.current = true;

  try {
    const video = webcamRef.current;
    const poses = await detectorRef.current.estimatePoses(video);
    const primaryPose = poses && poses.length > 0 ? poses[0] : null;
    const reliablePersonDetected = isReliablePersonPose(primaryPose);

    // ? RELIABLE PERSON DETECTED
    if (reliablePersonDetected && primaryPose) {
      validPoseFramesRef.current = Math.min(validPoseFramesRef.current + 1, 10);
      if (validPoseFramesRef.current >= 2) {
        missingPoseFramesRef.current = 0;
        missingPoseStartRef.current = null;
        missingPoseCueCountRef.current = 0;
      }
      processPose(primaryPose);
    } 
    // ? NO RELIABLE PERSON
    else {
      const now = Date.now();
      validPoseFramesRef.current = 0;
      missingPoseFramesRef.current += 1;
      if (!missingPoseStartRef.current) missingPoseStartRef.current = now;
      const missingMs = now - missingPoseStartRef.current;
      const activePlankTrackingLost =
        isPlankWorkout && sessionState === "ACTIVE" && plankActiveRef.current;

      // If plank tracking is lost while actively holding, stop quickly.
      if (activePlankTrackingLost && missingPoseFramesRef.current >= 4) {
        if (startTimeRef.current) {
          const finalElapsed = now - startTimeRef.current;
          plankElapsedCarryRef.current = Math.max(plankElapsedCarryRef.current, finalElapsed);
          setElapsedMs(plankElapsedCarryRef.current);
        }
        plankActiveRef.current = false;
        plankStartWallTimeRef.current = null;
        startTimeRef.current = null;
        setPoseStatus("Plank broken");
        setPoseConfidence(0);
        voiceCooldownRef.current = 0;
        speak("Plank broken");
        finalizeAndShowSave("Plank broken");
        return;
      }

      // Small debounce for smoother transitions.
      if (missingPoseFramesRef.current > 10) {
        const legRaiseIdleSidePrompt =
          sessionState === "IDLE" && isLegRaiseWorkout;
        const plankTrackingPrompt = isPlankWorkout;

        if (legRaiseIdleSidePrompt) {
          const sidePrompt = "Turn camera to your side angle for leg raises.";
          setPoseStatus(sidePrompt);
          setPoseConfidence(0);

          if (
            legRaiseSideCueCountRef.current < 2 &&
            missingMs >= NO_PERSON_CUE_1_MS &&
            now - legRaiseCueCooldownRef.current >= 3000
          ) {
            legRaiseCueCooldownRef.current = now;
            speak(sidePrompt);
            legRaiseSideCueCountRef.current += 1;
          }
          return;
        }
        if (plankTrackingPrompt) {
          const sidePrompt = "Turn side-on to camera and stay in frame for plank.";
          setPoseStatus(sidePrompt);
          setPoseConfidence(0);

          if (
            missingPoseCueCountRef.current < 1 &&
            missingMs >= NO_PERSON_CUE_1_MS
          ) {
            speak(sidePrompt);
            missingPoseCueCountRef.current = 1;
          } else if (
            missingPoseCueCountRef.current < 2 &&
            missingMs >= NO_PERSON_CUE_2_MS
          ) {
            speak(sidePrompt);
            missingPoseCueCountRef.current = 2;
          }

          if (missingMs >= NO_PERSON_STOP_MS) {
            finalizeAndShowSave("No person detected");
          }
          return;
        }

        setPoseStatus("No person detected");
        setPoseConfidence(0);

        if (
          missingPoseCueCountRef.current < 1 &&
          missingMs >= NO_PERSON_CUE_1_MS
        ) {
          speak("No person detected");
          missingPoseCueCountRef.current = 1;
        } else if (
          missingPoseCueCountRef.current < 2 &&
          missingMs >= NO_PERSON_CUE_2_MS
        ) {
          speak("No person detected");
          missingPoseCueCountRef.current = 2;
        }

        if (missingMs >= NO_PERSON_STOP_MS) {
          finalizeAndShowSave("No person detected");
        }
      }
    }
  } catch (err) {
    console.error("detectPose error:", err);
  } finally {
    busyRef.current = false;
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [processPose, sessionState, speak, isLegRaiseWorkout, isPlankWorkout, finalizeAndShowSave]);
const runDetector = useCallback(async () => {
  try {
    // ? Prevent re-loading model
    if (detectorRef.current) return;

    await tf.setBackend("webgl");
    await tf.ready();

    detectorRef.current = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      }
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
    if (sessionState === "SUMMARY" || showSavePopup) return;
    let stream = null;
    let canceled = false;
    const initToken = initTokenRef.current + 1;
    initTokenRef.current = initToken;
    setPoseStatus("Initializing camera...");

	    (async () => {
	      try {
          const cameraAttempts = (isPlankWorkout || isCrunchWorkout || isLegRaiseWorkout)
            ? [
                { video: { facingMode: { ideal: "environment" } }, audio: false },
                { video: { facingMode: "user" }, audio: false },
                { video: true, audio: false },
              ]
            : [
                { video: { facingMode: "user" }, audio: false },
                { video: true, audio: false },
              ];

          let lastCameraError = null;
          for (const constraints of cameraAttempts) {
            try {
              stream = await navigator.mediaDevices.getUserMedia(constraints);
              break;
            } catch (cameraErr) {
              lastCameraError = cameraErr;
            }
          }
          if (!stream) throw lastCameraError || new Error("Unable to initialize camera");
	        if (canceled || initToken !== initTokenRef.current) {
	          if (stream) stream.getTracks().forEach((t) => t.stop());
	          return;
	        }
          const facingMode = stream.getVideoTracks?.()[0]?.getSettings?.()?.facingMode;
          setMirrorView(facingMode !== "environment");
	        const video = webcamRef.current;
	        if (!video) {
	          if (stream) stream.getTracks().forEach((t) => t.stop());
	          return;
        }
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;

        try {
          await new Promise((resolve) => {
            if (video.readyState >= 2) return resolve();
            const onLoaded = () => {
              video.removeEventListener("loadedmetadata", onLoaded);
              resolve();
            };
            video.addEventListener("loadedmetadata", onLoaded);
          });
        } catch {}
        if (canceled || initToken !== initTokenRef.current) return;
        
        try {
          const p = video.play();
          if (p && typeof p.then === "function") {
            await p.catch((e) => {
              if (e?.name !== "AbortError") console.warn("video.play() rejected", e);
            });
          }
        } catch {}

        try {
          if (canceled || initToken !== initTokenRef.current) return;
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
        if (canceled || initToken !== initTokenRef.current) return;
        
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
      canceled = true;
      initTokenRef.current += 1;
      try { if (rafRef.current) cancelAnimationFrame(rafRef.current); } catch {}
      try { if (stream) stream.getTracks().forEach((t) => t.stop()); } catch {}
      try { if (detectorRef.current?.dispose) detectorRef.current.dispose(); } catch {}
      detectorRef.current = null;
    };
	  }, [showIntro, sessionState, runDetector, detectPose, isPlankWorkout, isCrunchWorkout, isLegRaiseWorkout, showSavePopup]);

  return (
    <>
   {/* SAVE SESSION POPUP */}
      {showSavePopup && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10000,
    }}
  >
    <div
      style={{
        background: "#1c1e26",
        padding: "28px",
        borderRadius: "18px",
        width: "360px",
        border: "2px solid #76ff03",
        textAlign: "center",
        boxShadow: "0 0 30px rgba(0,0,0,0.6)",
      }}
    >
      <h2 style={{ color: "#76ff03", marginBottom: "16px" }}>
        Save Session
      </h2>

      <div style={{ textAlign: "left", fontSize: "14px", color: "#fff", marginBottom: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #333" }}>
          <span>Workout:</span>
          <strong>{workoutLabel}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #333" }}>
          <span>Reps:</span>
          <strong>{reps}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #333" }}>
          <span>Avg Accuracy:</span>
          <strong>{avgAccuracy}%</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #333" }}>
          <span>ECA Points:</span>
          <strong>{ecaPoints}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #333" }}>
          <span>Time:</span>
          <strong>{formatTime(finalElapsedMs || elapsedMs)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
          <span>Weight:</span>
          <strong>{Number(parseFloat(weightKg) || 0)} kg</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          disabled={buttonLocked}
          onClick={handleSaveClick}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            background: "#76ff03",
            color: "#000",
            fontWeight: "bold",
            cursor: "pointer",
            opacity: buttonLocked ? 0.6 : 1,
          }}
        >
          Save
        </button>

        <button
          disabled={buttonLocked}
          onClick={handleDiscard}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            background: "#444",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            opacity: buttonLocked ? 0.6 : 1,
          }}
        >
          Cancel
        </button>

        <button
          disabled={buttonLocked}
          onClick={handleExit}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            background: "#222",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            opacity: buttonLocked ? 0.6 : 1,
          }}
        >
          Exit
        </button>
      </div>

      {saveError && (
        <div style={{ marginTop: "14px", color: "#ff8bb0", fontSize: "12px", lineHeight: 1.4 }}>
          {saveError}
        </div>
      )}
    </div>
  </div>
)}


{/* WORKOUT SUMMARY */}
{sessionState === "SUMMARY" && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "#1c1e26",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10000,
    }}
  >
    <div
      style={{
        background: "#2a2d34",
        padding: "30px",
        borderRadius: "20px",
        width: "380px",
        border: "2px solid #76ff03",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "#76ff03", marginBottom: "20px" }}>
        Workout Summary
      </h2>

      {/* SUMMARY DETAILS */}
      <div style={{ textAlign: "left", fontSize: "16px", color: "#fff" }}>
        <p>
          Exercise: <b>{workoutLabel}</b>
        </p>

        {!isPlankWorkout && (
          <p>
            Reps: <b>{reps}</b>
          </p>
        )}

        <p>
          Time: <b>{formatTime(finalElapsedMs || elapsedMs)}</b>
        </p>

        <p>
          Avg Accuracy:{" "}
          <b
            style={{
              color: avgAccuracy > 80 ? "#00ff00" : "#ffcc00",
            }}
          >
            {avgAccuracy}%
          </b>
        </p>

        <p>
          ECA Points: <b>{ecaPoints}</b>
        </p>

        <p>
          Weight: <b>{Number(parseFloat(weightKg) || 0)} kg</b>
        </p>
      </div>

      {/* START NEW SESSION (STEP 4 - FIXED) */}
      <button
        disabled={buttonLocked}
       onClick={async () => {
  if (buttonLocked) return;
  setButtonLocked(true);
  await resetWorkoutSession();
  setSessionState("IDLE");
  speak("New session started");
  setTimeout(() => setButtonLocked(false), 300);
}}       
          style={{
          marginTop: "25px",
          padding: "12px 25px",
          borderRadius: "12px",
          border: "none",
          background: "#76ff03",
          color: "#000",
          fontWeight: "bold",
          cursor: "pointer",
          width: "100%",
        }}
      >
        Start New Session
      </button>
    </div>
  </div>
)}
    {/* MAIN UI */}
    {showIntro && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#2a2d34",
              padding: "40px",
              borderRadius: "20px",
              textAlign: "center",
              border: "2px solid #76ff03",
              width: "340px",
            }}
          >
            <h2 style={{ color: "#76ff03", marginBottom: "10px" }}>
              {workoutLabel}
            </h2>
            <p style={{ color: "#ccc", marginBottom: "20px" }}>
                {(isPlankWorkout || isCrunchWorkout || isLegRaiseWorkout)
                  ? "Set camera to your side profile before starting."
                  : "Get ready to start"}
              </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <label style={{ color: "#ccc", fontSize: "14px" }}>Weight (kg):</label>
              <input
                type="number"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                style={{
                  width: "90px",
                  padding: "6px 8px",
                  borderRadius: "8px",
                  border: "1px solid #555",
                  background: "#1c1e26",
                  color: "#fff",
                }}
              />
            </div>
            <button
              onClick={() => setShowIntro(false)}
              style={{
                padding: "12px 25px",
                fontSize: "16px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                background: "#76ff03",
                color: "#000",
                fontWeight: "bold",
              }}
            >
              Start Workout
            </button>
          </div>
        </div>
      )}

      {/* WORKOUT LAYOUT */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1c1e26",
          color: "white",
          minHeight: "100vh",
          padding: "20px",
          gap: "30px",
          flexWrap: "wrap",
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", width: "min(640px, 100%)", flex: "1 1 320px" }}>
          <h2 style={{ color: "#76ff03", marginBottom: "10px" }}>
            Pose Detection ({workoutLabel})
          </h2>

          <div style={{ position: "relative", width: "100%", maxWidth: "640px", aspectRatio: "4 / 3" }}>
            <video
              ref={webcamRef}
              muted
              playsInline
              autoPlay
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 15,
                transform: mirrorView ? "scaleX(-1)" : "none",
                objectFit: "cover",
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 15,
                transform: mirrorView ? "scaleX(-1)" : "none",
                pointerEvents: "none",
              }}
            />
          </div>

          <div style={{ marginTop: "15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {isPlankWorkout ? (
                <>
                  <h1 style={{ margin: 0, color: "#ffff00", fontSize: "clamp(1.8rem, 5vw, 2.5rem)" }}>
                    Plank: {formatTime(elapsedMs)}
                  </h1>
                </>
              ) : (
                <>
                  <h1 style={{ margin: 0, color: "#ffff00", fontSize: "clamp(1.8rem, 5vw, 2.5rem)" }}>
                    Reps: {reps}
                  </h1>
                </>
              )}
            </div>
            <h3 style={{ margin: "5px 0 0 0", color: "#76ff03", fontSize: "clamp(1.1rem, 3vw, 1.5rem)" }}>
              {poseStatus}
            </h3>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            backgroundColor: "#2a2d34",
            padding: "20px",
            borderRadius: "15px",
            border: "2px solid #76ff03",
            width: "min(360px, 100%)",
            flex: "1 1 280px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            alignSelf: "stretch",
            marginTop: 0
          }}
        >
          <h3 style={{ color: "#76ff03", marginTop: 0 }}>Performance Metrics</h3>

          <div style={{ backgroundColor: "#1c1e26", padding: "10px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span>Reps:</span>
              <span style={{ color: "#ffff00" }}>{reps}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span>Avg Accuracy:</span>
              <span style={{ color: avgAccuracy > 80 ? "#00ff00" : "#ffcc00" }}>{avgAccuracy}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total ECA:</span>
              <span style={{ color: "#00ccff" }}>{ecaPoints}</span>
            </div>
          </div>

          {/* Form Quality Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span>Form Quality:</span>
              <span style={{ color: formScore > 80 ? "#00ff00" : formScore > 60 ? "#ffff00" : "#ff6600" }}>
                {formScore}%
              </span>
            </div>
            <div style={{ backgroundColor: "#1c1e26", borderRadius: "8px", height: "15px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  backgroundColor: formScore > 80 ? "#00ff00" : formScore > 60 ? "#ffff00" : "#ff6600",
                  width: `${formScore}%`,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>

          {/* Confidence Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span>Pose Confidence:</span>
              <span style={{ color: "#00ccff" }}>{poseConfidence}%</span>
            </div>
            <div style={{ backgroundColor: "#1c1e26", borderRadius: "8px", height: "15px", overflow: "hidden" }}>
              <div style={{ height: "100%", backgroundColor: "#00ccff", width: `${poseConfidence}%`, transition: "width 0.3s" }} />
            </div>
          </div>

          {/* Exercise Stats */}
          <div style={{ backgroundColor: "#1c1e26", padding: "10px", borderRadius: "8px" }}>
            <h4 style={{ color: "#76ff03", margin: "0 0 10px 0" }}>Exercise Stats:</h4>
            <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
              <div>Avg Angle: <span style={{ color: "#00ff00" }}>{exerciseStats.avgAngle} deg</span></div>
              <div>Max Angle: <span style={{ color: "#ffff00" }}>{exerciseStats.maxAngle} deg</span></div>
              <div>Min Angle: <span style={{ color: "#ff6600" }}>{exerciseStats.minAngle} deg</span></div>
              {workoutName.includes("squat") && (
                <div>Depth: <span style={{ color: "#00ccff" }}>{Math.round(exerciseStats.depthPercentage)}%</span></div>
              )}
            </div>
          </div>

          {/* Alerts / Form Tips */}
          {alerts.length > 0 && (
            <div style={{ backgroundColor: "#1c1e26", padding: "10px", borderRadius: "8px", borderLeft: "4px solid #ff6600" }}>
              <h4 style={{ color: "#ff6600", margin: "0 0 8px 0" }}>Form Tips:</h4>
              {alerts.map((alert, idx) => (
                <div key={idx} style={{ fontSize: "12px", marginBottom: "5px", color: "#ffff00" }}>
                  {alert}
                </div>
              ))}
            </div>
          )}

          {/* Good Form Message */}
          {alerts.length === 0 && (
            <div style={{ backgroundColor: "#1c1e26", padding: "10px", borderRadius: "8px", borderLeft: "4px solid #00ff00", textAlign: "center" }}>
              <span style={{ color: "#00ff00", fontWeight: "bold" }}>Great form! Keep it up!</span>
            </div>
          )}

          {/* STOP BUTTON */}
          <button
            onClick={() => {
              speak("Workout paused.");
              finalizeAndShowSave("Manual stop");
            }}
            style={{
              marginTop: "auto", 
              padding: "12px",
              width: "100%",
              borderRadius: "10px",
              border: "2px solid #ff4444",
              background: "rgba(255, 68, 68, 0.1)",
              color: "#ff4444",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "16px",
              transition: "background 0.2s"
            }}
          >
            Stop Workout
          </button>
        </div>
      </div>
    </>
  );
}
export default AIWorkout;

