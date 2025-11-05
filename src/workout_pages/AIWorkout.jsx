import React, { useEffect, useRef, useState } from "react";
import { init } from "../utils/initAIWorker";

export default function AIWorkout() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cleanup;
    const drawSkeleton = (keypoints) => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      ctx.fillStyle = "red";
      keypoints[0][0].keypoints.forEach((kp) => {
        if (kp.score > 0.4) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    };

    (async () => {
      cleanup = await init(videoRef.current, (keypoints) => {
        drawSkeleton(keypoints);
      });
      setReady(true);
    })();

    return () => cleanup && cleanup();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-white mt-10 relative">
      <h1 className="text-2xl font-bold mb-4">AI Workout</h1>

      {!ready && <p>Loading Pose Model...</p>}

      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          width="480"
          height="360"
          className="rounded-2xl border border-gray-500"
          style={{ display: ready ? "block" : "none" }}
        />
        <canvas
          ref={canvasRef}
          width="480"
          height="360"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 10,
          }}
        ></canvas>
      </div>
    </div>
  );
}
