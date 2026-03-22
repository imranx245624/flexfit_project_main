import armCircles from "../assets/home-workout-videos/arm-circles.mp4";
import benchDips from "../assets/home-workout-videos/bench-dips.mp4";
import calfRaises from "../assets/home-workout-videos/calf-raises.mp4";
import crunchesVideo from "../assets/videos/crunches.mp4";
import jumpingJacksVideo from "../assets/videos/jumping-jacks.mp4";
import legRaisesVideo from "../assets/videos/leg-raises.mp4";
import lungesVideo from "../assets/videos/lunges.mp4";
import pikePushUpVideo from "../assets/videos/pike-push-up.mp4";
import squatVideo from "../assets/videos/squat.mp4";
import wallHandstandHoldVideo from "../assets/videos/wall-handstand-hold.mp4";
import diamondPushUp from "../assets/home-workout-videos/diamond-push-up.mp4";
import flutterKicks from "../assets/home-workout-videos/flutter-kicks.mp4";
import gluteKickbacks from "../assets/home-workout-videos/glute-kickbacks.mp4";
import inclinePushUp from "../assets/home-workout-videos/incline-push-up.mp4";
import isometricHold from "../assets/home-workout-videos/isometric-hold-bicep-curl.mp4";
import legRaises from "../assets/home-workout-videos/leg-raises.mp4";
import lunges from "../assets/home-workout-videos/lunges.mp4";
import pikePushUp from "../assets/home-workout-videos/pike-push-up.mp4";
import reverseCrunch from "../assets/home-workout-videos/reverse-crunch.mp4";
import reverseSnowAngel from "../assets/home-workout-videos/reverse-snow-angel.mp4";
import supermanHold from "../assets/home-workout-videos/superman-hold.mp4";
import towelCurl from "../assets/home-workout-videos/towel-curl.mp4";
import towelRow from "../assets/home-workout-videos/towel-row.mp4";
import wallSit from "../assets/home-workout-videos/wall-sit.mp4";

export const HOME_WORKOUT_VIDEOS = {
  "arm-circles": armCircles,
  "bench-dips": benchDips,
  "calf-raises": calfRaises,
  "crunches": crunchesVideo,
  "diamond-push-ups": diamondPushUp,
  "flutter-kicks": flutterKicks,
  "glute-kickbacks": gluteKickbacks,
  "incline-push-ups": inclinePushUp,
  "isometric-hold": isometricHold,
  "jumping-jacks": jumpingJacksVideo,
  "leg-raises": legRaisesVideo || legRaises,
  "lunges": lungesVideo || lunges,
  "pike-push-ups": pikePushUpVideo || pikePushUp,
  "reverse-crunch": reverseCrunch,
  "reverse-snow-angels": reverseSnowAngel,
  "superman-hold": supermanHold,
  "towel-curls": towelCurl,
  "towel-rows": towelRow,
  "squats": squatVideo,
  "wall-handstand-hold": wallHandstandHoldVideo,
  "wall-sit": wallSit,
};
