// initAIWorker.js — sets up webcam + worker communication
export async function init(videoEl, callback) {
  const worker = new Worker(new URL('../workers/poseWorker.js', import.meta.url));
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoEl.srcObject = stream;
  await videoEl.play();

  worker.postMessage({ type: 'LOAD_MODEL' });

  worker.onmessage = (e) => {
    const { type, keypoints } = e.data;
    if (type === 'MODEL_READY') console.log('Model loaded successfully ✅');
    if (type === 'PREDICTION' && keypoints && callback) callback(keypoints);
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
