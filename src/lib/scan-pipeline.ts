import { api, type StructuredContact } from './api';
import { ocrLocal } from './ocr-local';
import { structureLocal } from './structure-local';

// Each step tries the paid server route first; on network/404/500/config
// errors we silently fall back to the free client-side implementation.
// This lets the scan flow work even when GOOGLE_VISION_API_KEY /
// ANTHROPIC_API_KEY / OPENAI_API_KEY aren't configured.

export type OcrSource = 'cloud' | 'local';
export type StructureSource = 'cloud' | 'local';
export type TranscribeSource = 'cloud' | 'browser' | 'none';

export async function runOcr(
  blob: Blob,
  storagePath: string,
): Promise<{ text: string; source: OcrSource }> {
  try {
    const { text } = await api.ocr(storagePath);
    if (text.trim()) return { text, source: 'cloud' };
    // Server returned empty — try Tesseract before giving up.
  } catch (err) {
    // Log but don't throw; local path handles the retry.
    // eslint-disable-next-line no-console
    console.info('[scan] /api/ocr unavailable, falling back to Tesseract:', err);
  }
  const text = await ocrLocal(blob);
  return { text, source: 'local' };
}

export async function runStructure(
  text: string,
): Promise<{ contact: StructuredContact; source: StructureSource }> {
  try {
    const contact = await api.structure(text);
    return { contact, source: 'cloud' };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.info('[scan] /api/structure unavailable, falling back to regex:', err);
    return { contact: structureLocal(text), source: 'local' };
  }
}

export async function runTranscribe(
  storagePath: string | null,
  liveTranscript: string,
): Promise<{ transcript: string; source: TranscribeSource }> {
  if (storagePath) {
    try {
      const { transcript } = await api.transcribe(storagePath);
      if (transcript.trim()) return { transcript, source: 'cloud' };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.info('[scan] /api/transcribe unavailable, using browser transcript:', err);
    }
  }
  if (liveTranscript.trim()) return { transcript: liveTranscript, source: 'browser' };
  return { transcript: '', source: 'none' };
}
