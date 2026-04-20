import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export interface VoiceRecordingResult {
  blob: Blob;
  // Live transcript from the Web Speech API. Empty string if the browser
  // doesn't support it (e.g. Firefox) — caller can then fall back to a
  // server-side transcription.
  liveTranscript: string;
}

interface Props {
  onRecorded: (result: VoiceRecordingResult) => void;
}

function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

function createSpeechRecognition(): any | null {
  const Ctor =
    (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';
  return rec;
}

export function VoiceRecorder({ onRecorded }: Props) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechRef = useRef<any>(null);
  const liveRef = useRef<string>('');

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: number | null = null;
    if (recording) {
      const started = Date.now();
      timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 250);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [recording]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      try {
        speechRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Parallel: Web Speech streams interim text while MediaRecorder
      // captures audio. When it's unsupported (Firefox), liveTranscript
      // stays empty and the caller can fall back to /api/transcribe.
      liveRef.current = '';
      const speech = createSpeechRecognition();
      if (speech) {
        speech.onresult = (e: any) => {
          let transcript = '';
          for (let i = 0; i < e.results.length; i++) {
            transcript += e.results[i][0].transcript;
          }
          liveRef.current = transcript.trim();
        };
        speech.onerror = () => {
          /* swallow — we still have the audio blob */
        };
        try {
          speech.start();
        } catch {
          /* already started */
        }
        speechRef.current = speech;
      }

      const mimeType = pickMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const out = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setBlob(out);
        onRecorded({ blob: out, liveTranscript: liveRef.current });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        try {
          speechRef.current?.stop();
        } catch {
          /* noop */
        }
        speechRef.current = null;
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setElapsed(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone unavailable');
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const reset = () => {
    setBlob(null);
    setElapsed(0);
    liveRef.current = '';
  };

  if (blob) {
    const url = URL.createObjectURL(blob);
    const mm = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const ss = (elapsed % 60).toString().padStart(2, '0');
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-xs uppercase tracking-[0.12em] text-ember">Recorded · {mm}:{ss}</div>
        <audio controls src={url} className="w-full max-w-xs" />
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Trash2 size={14} /> Re-record
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={recording ? stop : start}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-95',
          recording
            ? 'bg-destructive text-destructive-foreground shadow-lift animate-pulse'
            : 'bg-ember text-ember-foreground shadow-lift',
        )}
      >
        {recording ? <Square size={28} fill="currentColor" /> : <Mic size={28} />}
      </button>
      <div className="text-sm text-muted-foreground">
        {recording
          ? `Recording… ${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`
          : 'Tap to record a short note'}
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
    </div>
  );
}
