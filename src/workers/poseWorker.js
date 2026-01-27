/* eslint-disable no-restricted-globals */

// -------------------------
// ES MODULE IMPORTS (REQUIRED FOR type:"module" WORKERS)
// -------------------------
import * as tf from "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js";
import "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl/dist/tf-backend-webgl.min.js";

let model = null;
let busy = false;

onmessage = async (e) => {
  const { type, imageBitmap, modelUrl } = e.data;

  // ---------------------
  // LOAD MODEL
  // ---------------------
  if (type === "LOAD_MODEL") {
    try {
      await tf.setBackend("webgl");
      await tf.ready();

      const tryUrls = [
        modelUrl,                                       // preferred (if provided)
        "/models/movenet/model.json",                   // local hosting (BEST)
        "/models/movenet/singlepose_lightning_4/model.json",
        "https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4?tfjs-format=file" // fallback
      ].filter(Boolean);

      let lastErr = null;

      for (const url of tryUrls) {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            lastErr = `Fetch failed for ${url}: ${res.status}`;
            continue;
          }

          try {
            model = await tf.loadGraphModel(url);
            postMessage({ type: "MODEL_READY", url });
            lastErr = null;
            break;
          } catch (err1) {
            lastErr = `loadGraphModel failed (${url}): ${err1.message}`;
            continue;
          }
        } catch (err2) {
          lastErr = err2.message;
          continue;
        }
      }

      if (!model) {
        postMessage({
          type: "MODEL_ERROR",
          error: `Unable to load MoveNet. Last error: ${lastErr}.`
        });
      }
    } catch (err) {
      postMessage({
        type: "MODEL_ERROR",
        error: err.message,
        stack: err.stack
      });
    }
    return;
  }

  // ---------------------
  // RUN PREDICTION
  // ---------------------
  if (type === "PREDICT") {
    if (!model) {
      postMessage({ type: "PREDICTION_ERROR", error: "Model not loaded" });
      return;
    }
    if (!imageBitmap) {
      postMessage({
        type: "PREDICTION_ERROR",
        error: "No imageBitmap provided"
      });
      return;
    }
    if (busy) return;
    busy = true;

    try {
      // MoveNet expects 192x192 input
      let input = tf.browser.fromPixels(imageBitmap).toFloat();
      const origW = imageBitmap.width;
      const origH = imageBitmap.height;

      input = tf.image.resizeBilinear(input, [192, 192]);
      input = input.expandDims(0);

      const output = await model.executeAsync(input);

      let keypoints = null;

      if (Array.isArray(output)) {
        const arrs = await Promise.all(output.map(t => t.array()));
        for (const a of arrs) {
          if (Array.isArray(a) && Array.isArray(a[0]) && a[0].length === 17) {
            keypoints = a[0];
            break;
          }
        }
        output.forEach(t => t.dispose());
      } else {
        const arr = await output.array();
        output.dispose();
        keypoints = arr[0] || arr;
      }

      if (!keypoints || !Array.isArray(keypoints)) {
        postMessage({
          type: "PREDICTION_ERROR",
          error: "Unexpected MoveNet output format"
        });
        busy = false;
        return;
      }

      // Normalize keypoints -> [y,x,score]
      const normalized = keypoints.map((kp) => {
        const y = kp[0] / origH;
        const x = kp[1] / origW;
        const score = kp[2] ?? 0;
        return [y, x, score];
      });

      postMessage({
        type: "PREDICTION",
        keypoints: normalized
      });

      tf.dispose(input);
    } catch (err) {
      postMessage({
        type: "PREDICTION_ERROR",
        error: err.message,
        stack: err.stack
      });
    } finally {
      busy = false;
    }
    return;
  }

  // ---------------------
  // STOP WORKER
  // ---------------------
  if (type === "STOP") {
    close();
  }
};
