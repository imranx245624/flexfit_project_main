/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */

// poseWorker.js — runs TensorFlow model in background
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl');

let model;

onmessage = async (e) => {
  const { type, imageBitmap } = e.data;

  if (type === 'LOAD_MODEL') {
    await tf.setBackend('webgl');
    await tf.ready();
    model = await tf.loadGraphModel(
      'https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4',
      { fromTFHub: true }
    );
    postMessage({ type: 'MODEL_READY' });
  }

  if (type === 'PREDICT' && model && imageBitmap) {
    const tensor = tf.browser.fromPixels(imageBitmap).resizeBilinear([192, 192]).expandDims(0).toFloat();
    const output = await model.executeAsync(tensor);
    const keypoints = await output.array();
    tf.dispose([tensor, output]);
    postMessage({ type: 'PREDICTION', keypoints });
  }

  if (type === 'STOP') {
    close(); // terminate worker
  }
};
