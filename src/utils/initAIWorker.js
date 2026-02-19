// initAIWorker.js — sets up webcam + worker communication
export async function init(videoEl, onPredictionCallback, onReadyCallback, modelUrl) {
  const worker = new Worker(
    new URL('../workers/poseWorker.js', import.meta.url),
    { type: 'module' }
  );
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoEl.srcObject = stream;
  await videoEl.play();

  // Send LOAD_MODEL and optionally a preferred modelUrl (e.g. '/models/movenet/model.json')
  worker.postMessage({ type: 'LOAD_MODEL', modelUrl });

  worker.onmessage = (e) => {
    const { type, keypoints, error, stack } = e.data;
    if (type === 'MODEL_READY') {
      if (typeof onReadyCallback === 'function') onReadyCallback();
    }
    if (type === 'PREDICTION' && keypoints && typeof onPredictionCallback === 'function') {
      // keypoints is normalized [y,x,score] per worker above — convert to pixel coords
      const vw = videoEl.videoWidth || videoEl.width || 640;
      const vh = videoEl.videoHeight || videoEl.height || 480;
      const converted = keypoints.map(k => ({ x: (k[1] || 0) * vw, y: (k[0] || 0) * vh, score: k[2] || 0 }));
      onPredictionCallback(converted);
    }
    if (type === 'PREDICTION_ERROR') {
      console.error('Worker prediction error:', error, stack);
    }
    if (type === 'MODEL_ERROR') {
      console.error('Worker model error:', error, stack);
    }
  };
  let lastFrame = 0;
  const process = async (t) => {
    if (t - lastFrame > 150) { // ~6 FPS
      const bitmap = await createImageBitmap(videoEl);
      worker.postMessage({ type: 'PREDICT', imageBitmap: bitmap }, [bitmap]);
      lastFrame = t;
    }
    requestAnimationFrame(process);
  };
  requestAnimationFrame(process);

  return () => {
    worker.postMessage({ type: 'STOP' });
    worker.terminate();
    stream.getTracks().forEach(t => t.stop());
  };
}
