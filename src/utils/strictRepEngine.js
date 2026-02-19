// src/utils/strictRepEngine.js

export function inferExerciseType(workoutNameLower) {
  const w = String(workoutNameLower || "").toLowerCase();

  const isSumo = w.includes("sumo");
  if (w.includes("plank")) return { exerciseType: "plank", flags: { isSumo: false } };
  if (w.includes("jumping jack") || w.includes("jumpingjack") || w.includes("jacks") || w.includes("jack")) {
    return { exerciseType: "jumpingjack", flags: { isSumo: false } };
  }
  if (w.includes("leg raise") || w.includes("legraise")) return { exerciseType: "legraise", flags: { isSumo: false } };
  if (w.includes("crunch")) return { exerciseType: "crunch", flags: { isSumo: false } };
  if (w.includes("pull")) return { exerciseType: "pullup", flags: { isSumo: false } };
  if (w.includes("lunge")) return { exerciseType: "lunge", flags: { isSumo: false } };
  if (w.includes("burpee")) return { exerciseType: "burpee", flags: { isSumo: false } };
  if (w.includes("squat") || isSumo) return { exerciseType: "squat", flags: { isSumo } };
  if (w.includes("push")) return { exerciseType: "pushup", flags: { isSumo: false } };

  return { exerciseType: "pushup", flags: { isSumo: false } };
}

// Workouts detected from the *visible* new AIWorkout.jsx logic.
// If your other "new files" contain more workouts, add them here.
export const WORKOUT_CATALOGUE = [
  { id: "pushup", name: "Push Ups" },
  { id: "plank", name: "Plank" },
  { id: "squat", name: "Squat" },
  { id: "sumo_squat", name: "Sumo Squat" },
  { id: "lunge", name: "Lunge" },
  { id: "burpee", name: "Burpee" },
  { id: "pullup", name: "Pull-up" },
  { id: "crunch", name: "Crunch" },
  { id: "legraise", name: "Leg Raise" },
  { id: "jumpingjack", name: "Jumping Jack" }
];

export function createStrictRepEngine() {
  const s = {
    lastState: "up",

    // milestone streaks
    streak: {
      pushup: 0, squat: 0, lunge: 0, burpee: 0, pullup: 0,
      crunch: 0, legraise: 0, jumpingjack: 0, generic: 0
    },
    milestoneStep: {
      pushup: 0, squat: 0, lunge: 0, burpee: 0, pullup: 0,
      crunch: 0, legraise: 0, jumpingjack: 0, generic: 0
    },

    // cue cooldown trackers
    cueAt: {
      pushup: 0, squat: 0, lunge: 0, burpee: 0, pullup: 0,
      crunch: 0, legraise: 0, jumpingjack: 0, generic: 0
    },
    jumpingJackLastCue: "",

    // pushup strictness
    pushupRepStart: null,
    pushupMinElbow: 180,
    pushupLegInvalidFrames: 0,

    // squat strictness
    squatRepStart: null,
    squatMinKnee: 180,

    // lunge strictness
    lungeRepStart: null,
    lungeMinKnee: 180,

    // burpee strictness
    burpeeRepAttempt: false,
    burpeeFloorReached: false,
    burpeeMinElbow: 180,
    burpeeStandingShoulder: null,
    burpeeMaxJumpRise: 0,
    burpeeTopCaptureStart: null,

    // leg raise strictness
    legRaiseMaxLift: 0,

    // crunch strictness
    crunchMaxDistance: 0
  };

  function reset() {
    s.lastState = "up";

    Object.keys(s.streak).forEach(k => { s.streak[k] = 0; });
    Object.keys(s.milestoneStep).forEach(k => { s.milestoneStep[k] = 0; });
    Object.keys(s.cueAt).forEach(k => { s.cueAt[k] = 0; });
    s.jumpingJackLastCue = "";

    s.pushupRepStart = null;
    s.pushupMinElbow = 180;
    s.pushupLegInvalidFrames = 0;

    s.squatRepStart = null;
    s.squatMinKnee = 180;

    s.lungeRepStart = null;
    s.lungeMinKnee = 180;

    s.burpeeRepAttempt = false;
    s.burpeeFloorReached = false;
    s.burpeeMinElbow = 180;
    s.burpeeStandingShoulder = null;
    s.burpeeMaxJumpRise = 0;
    s.burpeeTopCaptureStart = null;

    s.legRaiseMaxLift = 0;
    s.crunchMaxDistance = 0;
  }

  function canCue(exerciseType, now, cooldownMs) {
    const last = s.cueAt[exerciseType] || 0;
    if (now - last < cooldownMs) return false;
    s.cueAt[exerciseType] = now;
    return true;
  }

  function milestoneMessage(exerciseType, formScore) {
    // Mirrors the new file’s “3 good reps” concept, with special handling
    // for legraise/jumpingjack requiring >=80 formScore.
    const needsGoodForm = (exerciseType === "legraise" || exerciseType === "jumpingjack");
    if (needsGoodForm && formScore < 80) {
      s.streak[exerciseType] = 0;
      return null;
    }

    s.streak[exerciseType] = (s.streak[exerciseType] || 0) + 1;
    if (s.streak[exerciseType] < 3) return null;

    s.streak[exerciseType] = 0;
    s.milestoneStep[exerciseType] = ((s.milestoneStep[exerciseType] || 0) % 4) + 1;

    const step = s.milestoneStep[exerciseType];

    if (exerciseType === "pushup") {
      if (step === 1) return "Nice! That's three clean pushups!";
      if (step === 2) return "Good form! Keep that chest low!";
      if (step === 3) return "That's how champions train!";
      return "Clean reps! No shortcuts!";
    }
    if (exerciseType === "lunge") {
      if (step === 1) return "Good! That's three solid lunges!";
      if (step === 2) return "Strong legs! Keep stepping!";
      if (step === 3) return "That's what I'm talking about!";
      return "Beautiful reps - stay focused!";
    }
    if (exerciseType === "burpee") {
      if (step === 1) return "That’s three perfect burpees!";
      if (step === 2) return "That’s how burpees are done!";
      if (step === 3) return "Explosive! I love it!";
      return "Solid control and power!";
    }
    if (exerciseType === "pullup") {
      if (step === 1) return "That's three perfect reps!";
      if (step === 2) return "Strong and strict - love it!";
      if (step === 3) return "Elite form right there!";
      return "You're locked in!";
    }
    if (exerciseType === "crunch") {
      if (step === 1) return "That's three clean crunches!";
      if (step === 2) return "That's how you work your abs!";
      if (step === 3) return "Abs on fire - love it!";
      return "You're crushing those reps!";
    }
    if (exerciseType === "legraise") {
      if (step === 1) return "Great control. Three clean leg raises.";
      if (step === 2) return "Excellent tempo. Keep it smooth.";
      if (step === 3) return "Perfect reps. Stay steady.";
      return "Very clean leg raises. Nice control.";
    }
    if (exerciseType === "jumpingjack") {
      if (step === 1) return "Nice rhythm. Three clean jumping jacks.";
      if (step === 2) return "Great control. Keep it smooth.";
      return "Excellent form. Keep this pace.";
    }

    // generic fallback
    if (formScore >= 80) {
      s.milestoneStep.generic = (s.milestoneStep.generic % 3) + 1;
      if (s.milestoneStep.generic === 1) return "Excellent 3 reps";
      if (s.milestoneStep.generic === 2) return "Doing good reps";
      return "Keep doing like that";
    }
    return null;
  }

  function repEvent(exerciseType, now, formScore, defaultVoiceText, defaultStatusText) {
    const msg = milestoneMessage(exerciseType, formScore);
    if (msg) {
      return { type: "rep", statusText: msg, voiceText: msg };
    }
    return { type: "rep", statusText: defaultStatusText, voiceText: defaultVoiceText };
  }

  function cueEvent(exerciseType, now, statusText, voiceText, cooldownMs) {
    const ok = canCue(exerciseType, now, cooldownMs);
    return {
      type: ok ? "cue" : "status",
      statusText,
      voiceText: ok ? voiceText : null
    };
  }

  function endAttemptPushup() {
    s.pushupRepStart = null;
    s.pushupMinElbow = 180;
  }

  function endAttemptSquat() {
    s.squatRepStart = null;
    s.squatMinKnee = 180;
  }

  function endAttemptLunge() {
    s.lungeRepStart = null;
    s.lungeMinKnee = 180;
  }

  function resetBurpee() {
    s.burpeeRepAttempt = false;
    s.burpeeFloorReached = false;
    s.burpeeMinElbow = 180;
    s.burpeeMaxJumpRise = 0;
    s.burpeeTopCaptureStart = null;
  }

  function update(frame) {
    const {
      exerciseType,
      flags,
      now,
      canCount,
      formScore,

      // commonly used smooth/raw angles
      smoothElbow,
      smoothKnee,
      avgElbowRaw,
      shoulderYRaw,
      hipY,

      // video + extra metrics
      videoH,
      legsStraightRaw,           // pushup cheat gate
      sumoStanceReady,           // sumo stance gate

      // jumping jack metrics
      shoulderSpan,
      ankleSpan,
      wristsY,
      shouldersY,

      // leg raise metrics
      legRaiseLift,
      torsoLen
    } = frame;

    if (exerciseType === "pushup") {
      // Stable blocking: require multiple consecutive invalid frames.
      if (!legsStraightRaw) s.pushupLegInvalidFrames = Math.min(s.pushupLegInvalidFrames + 1, 30);
      else s.pushupLegInvalidFrames = Math.max(s.pushupLegInvalidFrames - 2, 0);

      const legsBlocked = s.pushupLegInvalidFrames >= 12;

      if (s.lastState === "up") {
        if (smoothElbow < 130 && s.pushupRepStart == null) s.pushupRepStart = now;
        if (s.pushupRepStart != null) s.pushupMinElbow = Math.min(s.pushupMinElbow, smoothElbow);
      }

      if (smoothElbow < 90 && s.lastState === "up") {
        s.lastState = "down";
        return { type: "status", statusText: "Down", voiceText: null };
      }

      if (smoothElbow > 155 && s.lastState === "down" && canCount) {
        s.lastState = "up";

        if (legsBlocked) {
          endAttemptPushup();
          return cueEvent("pushup", now, "Keep your legs and body straight, no shortcuts.", "Keep your legs and body straight, no shortcuts.", 2200);
        }

        if (s.pushupMinElbow > 96) {
          endAttemptPushup();
          return cueEvent("pushup", now, "Go deep and fully retract your chest", "Go deep and fully retract your chest", 2200);
        }

        endAttemptPushup();
        return repEvent("pushup", now, formScore, null, "Up!");
      }

      // Half-rep / cheat detection
      if (s.lastState === "up" && s.pushupRepStart != null && smoothElbow > 145) {
        if (legsBlocked) {
          endAttemptPushup();
          return cueEvent("pushup", now, "Keep your legs and body straight, no shortcuts.", "Keep your legs and body straight, no shortcuts.", 2200);
        }
        if (s.pushupMinElbow > 96) {
          endAttemptPushup();
          return cueEvent("pushup", now, "Go deep and fully retract your chest", "Go deep and fully retract your chest", 2200);
        }
      }

      return null;
    }

    if (exerciseType === "squat") {
      const isSumo = !!(flags && flags.isSumo);
      const depthTarget = isSumo ? 108 : 102;
      const downThreshold = isSumo ? 108 : 95;

      if (s.lastState === "up") {
        if (smoothKnee < 135 && s.squatRepStart == null) s.squatRepStart = now;
        if (s.squatRepStart != null) s.squatMinKnee = Math.min(s.squatMinKnee, smoothKnee);
      }

      if (smoothKnee < downThreshold && s.lastState === "up") {
        s.lastState = "down";
        return { type: "status", statusText: "Deep. Drive up slow", voiceText: null };
      }

      if (smoothKnee > 165 && s.lastState === "down" && canCount) {
        const repDuration = s.squatRepStart ? (now - s.squatRepStart) : 0;
        const deepEnough = s.squatMinKnee <= depthTarget;

        s.lastState = "up";

        if (isSumo && !sumoStanceReady) {
          endAttemptSquat();
          return cueEvent("squat", now, "Widen stance for sumo squat", "Widen stance for sumo squat", 2200);
        }
        if (repDuration > 0 && repDuration < 1600) {
          endAttemptSquat();
          return cueEvent("squat", now, "Doing too fast", "Doing too fast", 2200);
        }
        if (!deepEnough) {
          endAttemptSquat();
          return cueEvent("squat", now, "Go deeper", "Go deeper", 2200);
        }
        if (formScore < 80) {
          endAttemptSquat();
          return cueEvent("squat", now, "Fix form before counting", "Fix form before counting", 2200);
        }

        endAttemptSquat();
        return repEvent("squat", now, formScore, null, "Up!");
      }

      // Half rep (came back up without hitting depth)
      if (s.lastState === "up" && s.squatRepStart != null && smoothKnee > 148 && s.squatMinKnee > depthTarget) {
        endAttemptSquat();
        return cueEvent("squat", now, "Go deeper", "Go deeper", 2200);
      }

      return null;
    }

    if (exerciseType === "lunge") {
      if (s.lastState === "up") {
        if (smoothKnee < 135 && s.lungeRepStart == null) s.lungeRepStart = now;
        if (s.lungeRepStart != null) s.lungeMinKnee = Math.min(s.lungeMinKnee, smoothKnee);
      }

      if (smoothKnee < 110 && s.lastState === "up") {
        s.lastState = "down";
        return { type: "status", statusText: "Down", voiceText: null };
      }

      if (smoothKnee > 145 && s.lastState === "down" && canCount) {
        const deepEnough = s.lungeMinKnee <= 110;
        s.lastState = "up";

        if (!deepEnough) {
          endAttemptLunge();
          return cueEvent("lunge", now, "Go deeper on the lunge", "Go deeper on the lunge", 2200);
        }
        if (formScore < 80) {
          endAttemptLunge();
          return cueEvent("lunge", now, "Fix form before counting", "Fix form before counting", 2200);
        }

        endAttemptLunge();
        return repEvent("lunge", now, formScore, null, "Up!");
      }

      return null;
    }

    if (exerciseType === "pullup") {
      // Uses the old-file style: shoulder minus wrist vertical distance.
      const dist = (shouldersY || 0) - (wristsY || 0);

      if (dist > 70 && s.lastState === "up") {
        s.lastState = "down";
        return { type: "status", statusText: "Hanging", voiceText: null };
      }
      if (dist < 30 && s.lastState === "down" && canCount) {
        s.lastState = "up";
        if (formScore < 80) {
          return cueEvent("pullup", now, "Stop swinging / fix form", "Stop swinging", 2200);
        }
        return repEvent("pullup", now, formScore, "Pull!", "Chin Up!");
      }
      return null;
    }

    if (exerciseType === "crunch") {
      // Crunch distance: hipY - shoulderY, same as your old logic.
      const crunchDistance = (hipY || 0) - (shouldersY || 0);
      const downThreshold = Math.max(25, (videoH || 480) * 0.08);
      const upThreshold = Math.max(55, (videoH || 480) * 0.18);

      s.crunchMaxDistance = Math.max(s.crunchMaxDistance, crunchDistance);

      if (crunchDistance < downThreshold && s.lastState === "up") {
        s.lastState = "down";
        return { type: "status", statusText: "Down", voiceText: null };
      }
      if (crunchDistance > upThreshold && s.lastState === "down" && canCount) {
        s.lastState = "up";
        if (formScore < 80) {
          return cueEvent("crunch", now, "Fix form before counting", "Fix form before counting", 2200);
        }
        return repEvent("crunch", now, formScore, null, "Crunch!");
      }
      return null;
    }

    if (exerciseType === "legraise") {
      // legRaiseLift recommended as (hipY - ankleYmin).
      const tLen = Math.max(60, torsoLen || 60);
      const upThreshold = Math.max(55, tLen * 0.65);
      const downThreshold = Math.max(25, tLen * 0.28);

      if (s.lastState === "up") {
        s.legRaiseMaxLift = Math.max(s.legRaiseMaxLift, legRaiseLift || 0);
      }
      if ((legRaiseLift || 0) > upThreshold && s.lastState === "up") {
        s.lastState = "down";
        return { type: "status", statusText: "Up", voiceText: null };
      }
      if ((legRaiseLift || 0) < downThreshold && s.lastState === "down" && canCount) {
        s.lastState = "up";
        const liftedEnough = s.legRaiseMaxLift > upThreshold;

        if (!liftedEnough) {
          s.legRaiseMaxLift = 0;
          return cueEvent("legraise", now, "Lift higher and control the descent", "Lift higher and control the descent", 3000);
        }
        if (formScore < 80) {
          s.legRaiseMaxLift = 0;
          return cueEvent("legraise", now, "Keep legs straight and core tight", "Keep legs straight and core tight", 3000);
        }

        s.legRaiseMaxLift = 0;
        return repEvent("legraise", now, formScore, null, "Rep counted!");
      }
      return null;
    }

    if (exerciseType === "jumpingjack") {
      const sh = Math.max(1, shoulderSpan || 1);
      const ankles = ankleSpan || 0;
      const armsHigh = (wristsY || 9999) < (shouldersY || 9999) - 20;

      const openLegs = ankles > sh * 2.1;
      const closedLegs = ankles < sh * 1.2;

      const isOpen = openLegs && armsHigh;
      const isClosed = closedLegs && !armsHigh;

      if (isOpen && s.lastState === "up") {
        s.lastState = "down";
        return { type: "status", statusText: "Open", voiceText: null };
      }
      if (isClosed && s.lastState === "down" && canCount) {
        s.lastState = "up";
        if (formScore < 80) {
          return cueEvent("jumpingjack", now, "Keep arms and legs in sync", "Keep arms and legs in sync", 3200);
        }
        return repEvent("jumpingjack", now, formScore, null, "Good!");
      }

      // Coaching when half-open
      if (openLegs && !armsHigh) {
        const text = "Raise your hands overhead when feet open.";
        const sameCue = s.jumpingJackLastCue === text;
        s.jumpingJackLastCue = text;
        return cueEvent("jumpingjack", now, text, text, sameCue ? 6500 : 3200);
      }
      if (armsHigh && !openLegs) {
        const text = "Jump your feet wider with your arm raise.";
        const sameCue = s.jumpingJackLastCue === text;
        s.jumpingJackLastCue = text;
        return cueEvent("jumpingjack", now, text, text, sameCue ? 6500 : 3200);
      }

      return null;
    }

    if (exerciseType === "burpee") {
      const vh = videoH || 480;

      const isStanding = (shoulderYRaw || 0) < (hipY || 0) - 12;

      // Keep a baseline shoulder height when standing
      if (isStanding && s.lastState === "up" && !s.burpeeRepAttempt) {
        if (s.burpeeStandingShoulder == null) s.burpeeStandingShoulder = shoulderYRaw || 0;
        else {
          const alpha = 0.12;
          s.burpeeStandingShoulder = (shoulderYRaw || 0) * alpha + s.burpeeStandingShoulder * (1 - alpha);
        }
      }

      const standingShoulder = s.burpeeStandingShoulder;
      const shoulderDrop = standingShoulder == null ? 0 : (shoulderYRaw || 0) - standingShoulder;

      const downDropThreshold = Math.max(38, vh * 0.08);
      const minDropForLowCue = Math.max(16, vh * 0.035);

      const deepElbow = (avgElbowRaw || 180) < 122;
      const startedDown = shoulderDrop > minDropForLowCue;
      const isFloor = startedDown && deepElbow && shoulderDrop > downDropThreshold;

      const returnedUp = standingShoulder == null
        ? isStanding
        : shoulderDrop < Math.max(8, vh * 0.02);

      const jumpCueThreshold = Math.max(4, vh * 0.008);
      const jumpMinThreshold = Math.max(2, vh * 0.005);
      const jumpCaptureWindowMs = 180;

      if (startedDown && s.lastState === "up") {
        s.burpeeRepAttempt = true;
        s.burpeeMaxJumpRise = 0;
        s.burpeeTopCaptureStart = null;
      }

      if (isFloor && s.lastState === "up") {
        s.lastState = "down";
        s.burpeeFloorReached = true;
        s.burpeeMinElbow = Math.min(s.burpeeMinElbow, avgElbowRaw || 180);
        return { type: "status", statusText: "Down", voiceText: null };
      }

      if (s.lastState === "down") {
        s.burpeeMinElbow = Math.min(s.burpeeMinElbow, avgElbowRaw || 180);

        const currentJumpRise = standingShoulder == null ? 0 : standingShoulder - (shoulderYRaw || 0);
        s.burpeeMaxJumpRise = Math.max(s.burpeeMaxJumpRise, currentJumpRise);

        if (returnedUp && s.burpeeRepAttempt && s.burpeeFloorReached) {
          if (s.burpeeTopCaptureStart == null) s.burpeeTopCaptureStart = now;
          const topCaptureDone = now - s.burpeeTopCaptureStart >= jumpCaptureWindowMs;

          if (topCaptureDone && canCount) {
            s.lastState = "up";

            const jumpedEnoughToCount = s.burpeeMaxJumpRise > jumpMinThreshold;
            const jumpedHighEnough = s.burpeeMaxJumpRise > jumpCueThreshold;
            const deepEnough = s.burpeeMinElbow < 122;

            if (deepEnough && jumpedEnoughToCount) {
              const evt = repEvent("burpee", now, formScore, "Burpee!", "Rep counted!");
              resetBurpee();
              if (!jumpedHighEnough) {
                // extra coaching, but don’t override the rep event
                return evt;
              }
              return evt;
            }

            // Not countable
            const msg = !deepEnough ? "Chest down first, then jump." : "Finish with a small jump at the top.";
            resetBurpee();
            return cueEvent("burpee", now, msg, msg, 2200);
          }
        } else {
          s.burpeeTopCaptureStart = null;
        }
      }

      if (returnedUp && s.lastState === "up" && s.burpeeRepAttempt && !s.burpeeFloorReached) {
        const msg = "Chest down first, then jump.";
        resetBurpee();
        return cueEvent("burpee", now, msg, msg, 2200);
      }

      return null;
    }

    // plank is handled in the component (time-based), so engine does nothing.
    return null;
  }

  return { reset, update };
}
