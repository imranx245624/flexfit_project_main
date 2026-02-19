/* eslint-disable no-restricted-globals */
/* eslint-env worker */

// Worker does NOT need poseDetection or tf anymore
// because MoveNet detector runs on main thread
// and worker only converts coordinates.

// This worker ONLY receives normalized coordinates [y, x, score]
// and converts them into pixel values.

self.onmessage = (event) => {
  const { type, pose, videoWidth = 640, videoHeight = 480 } = event.data;

  if (type === "init") {
    // No heavy model load here – only confirm worker is ready
    self.postMessage({ type: "ready" });
    return;
  }

  if (type === "raw-pose" && pose) {
    try {
      // pose = [[yNorm, xNorm, score], ...]
      const convertedPose = pose.map(([y, x, score]) => ({
        x: Math.min(Math.max(x, 0), 1) * videoWidth,
        y: Math.min(Math.max(y, 0), 1) * videoHeight,
        score: Math.min(Math.max(score || 0, 0), 1),
      }));

      // average confidence
      const avgScore =
        convertedPose.reduce((acc, kp) => acc + kp.score, 0) /
        convertedPose.length;

      self.postMessage({
        type: "pose-converted",
        convertedPose,
        score: Math.round(avgScore * 100),
      });
    } catch (err) {
      console.error("Worker pose conversion failed:", err);
    }
  }
};
