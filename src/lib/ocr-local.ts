import { createWorker, type Worker } from 'tesseract.js';

// Keep one worker alive across scans — worker creation downloads ~10MB
// of trained data on the first run, and we don't want to pay that on
// every card.
let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng');
  }
  return workerPromise;
}

// Runs Tesseract.js on the blob entirely in the browser. Returns the
// flat text string — caller decides what to do with it.
export async function ocrLocal(blob: Blob): Promise<string> {
  const worker = await getWorker();
  const { data } = await worker.recognize(blob);
  return data.text ?? '';
}
