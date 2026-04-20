import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
}

// Opens the rear camera (environment-facing), shows a live preview, and
// captures a full-resolution still to a Blob. Handles stream cleanup.
export function CameraCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Camera unavailable. Check browser permissions.',
        );
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const snap = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => blob && onCapture(blob), 'image/jpeg', 0.92);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-5 py-16 text-center">
        <Camera size={40} className="text-muted-foreground" />
        <p className="max-w-[28ch] text-sm text-muted-foreground">{error}</p>
        <Button variant="secondary" onClick={onCancel}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex-1">
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-full w-full bg-black object-cover"
      />
      {/* Framing guide */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="aspect-[1.586/1] w-[85%] rounded-xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 px-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
      >
        <button
          onClick={onCancel}
          className="rounded-full bg-black/40 px-4 py-2 text-sm text-white backdrop-blur"
        >
          Cancel
        </button>
        <button
          onClick={snap}
          disabled={!ready}
          aria-label="Capture"
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 backdrop-blur transition-transform active:scale-95 disabled:opacity-50"
        >
          <div className="h-12 w-12 rounded-full bg-white" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white/70">
          <RefreshCw size={14} />
        </div>
      </div>
    </div>
  );
}
