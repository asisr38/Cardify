import { supabase } from './supabase';

const CARD_BUCKET = 'card-scans';
const VOICE_BUCKET = 'voice-notes';

// Downscale + re-encode to JPEG. Keeps uploads comfortably under the 5MB
// server cap even when the device produced a 12MP original.
export async function compressImage(
  blob: Blob,
  { maxEdge = 1600, quality = 0.85 }: { maxEdge?: number; quality?: number } = {},
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (out) => (out ? resolve(out) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      quality,
    );
  });
}

export function randomId(): string {
  return (crypto as any).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Upload a card-scan image. Path is {user_id}/{scan_id}/{side}.jpg.
export async function uploadCardScan(
  userId: string,
  scanId: string,
  side: 'front' | 'back',
  blob: Blob,
): Promise<string> {
  const path = `${userId}/${scanId}/${side}.jpg`;
  const { error } = await supabase.storage.from(CARD_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

// Upload a voice note. Path is {user_id}/{voice_id}.{ext}.
export async function uploadVoiceNote(
  userId: string,
  voiceId: string,
  blob: Blob,
): Promise<string> {
  const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
  const path = `${userId}/${voiceId}.${ext}`;
  const { error } = await supabase.storage.from(VOICE_BUCKET).upload(path, blob, {
    contentType: blob.type || 'audio/webm',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

// Short-lived signed URL for rendering a private scan/voice note.
export async function signedUrl(
  bucket: 'card-scans' | 'voice-notes',
  path: string,
  expiresIn = 60 * 60,
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
