import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Loader2, SkipForward, X } from 'lucide-react';
import { toast } from 'sonner';
import { TopBar } from '../components/top-bar';
import { Button } from '../components/ui/button';
import { CameraCapture } from '../components/camera-capture';
import { VoiceRecorder } from '../components/voice-recorder';
import {
  ContactFormFields,
  emptyContactForm,
  formToInsertPatch,
  useContactForm,
  type ContactFormValues,
} from '../components/contact-form';
import { useAuth } from '../hooks/use-auth';
import { useCreateContact } from '../data/contacts';
import { useEvent } from '../data/events';
import { runOcr, runStructure, runTranscribe } from '../lib/scan-pipeline';
import { compressImage, randomId, uploadCardScan, uploadVoiceNote } from '../lib/storage';
import type { VoiceRecordingResult } from '../components/voice-recorder';
import { errorMessage } from '../lib/utils';

type Step = 'front' | 'back' | 'voice' | 'review';

interface Pipeline {
  scanId: string;
  frontPath: string | null;
  backPath: string | null;
  voicePath: string | null;
  ocrState: 'idle' | 'running' | 'done' | 'error';
  ocrError: string | null;
  voiceState: 'idle' | 'running' | 'done' | 'error';
  voiceError: string | null;
}

const initialPipeline: Pipeline = {
  scanId: '',
  frontPath: null,
  backPath: null,
  voicePath: null,
  ocrState: 'idle',
  ocrError: null,
  voiceState: 'idle',
  voiceError: null,
};

export function Scan() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: event } = useEvent(eventId);
  const createContact = useCreateContact();

  const [step, setStep] = useState<Step>('front');
  const [pipeline, setPipeline] = useState<Pipeline>(() => ({
    ...initialPipeline,
    scanId: randomId(),
  }));
  const { form, setForm, set } = useContactForm(emptyContactForm);

  // Merge any new structured fields from OCR, but don't overwrite anything
  // the user has already typed in review.
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const processingBanner = useMemo(() => {
    if (pipeline.ocrState === 'running') return 'Reading the card…';
    if (pipeline.voiceState === 'running') return 'Transcribing your note…';
    return null;
  }, [pipeline.ocrState, pipeline.voiceState]);

  const runOcrPipeline = async (compressedBlob: Blob, path: string) => {
    setPipeline((p) => ({ ...p, ocrState: 'running', ocrError: null }));
    try {
      const { text } = await runOcr(compressedBlob, path);
      if (!text.trim()) {
        setPipeline((p) => ({
          ...p,
          ocrState: 'error',
          ocrError: 'We couldn\'t read any text from the card. Fill in what you know.',
        }));
        return;
      }
      const { contact } = await runStructure(text);
      setForm((prev) => mergeFromOcr(prev, contact));
      setPipeline((p) => ({ ...p, ocrState: 'done' }));
    } catch (err) {
      setPipeline((p) => ({ ...p, ocrState: 'error', ocrError: errorMessage(err) }));
    }
  };

  const runVoicePipeline = async (path: string | null, liveTranscript: string) => {
    setPipeline((p) => ({ ...p, voiceState: 'running', voiceError: null }));
    try {
      const { transcript } = await runTranscribe(path, liveTranscript);
      if (transcript) {
        setForm((prev) =>
          prev.voice_note_transcript
            ? prev
            : { ...prev, voice_note_transcript: transcript.trim() },
        );
      }
      setPipeline((p) => ({ ...p, voiceState: 'done' }));
    } catch (err) {
      setPipeline((p) => ({ ...p, voiceState: 'error', voiceError: errorMessage(err) }));
    }
  };

  const handleFrontCapture = async (blob: Blob) => {
    if (!user) return;
    setStep('back');
    try {
      const compressed = await compressImage(blob);
      // Kick OCR off against the local blob immediately — don't wait for
      // the Storage upload to finish before Tesseract/Vision can start.
      const ocrTask = runOcrPipeline(compressed, `${user.id}/${pipeline.scanId}/front.jpg`);
      const path = await uploadCardScan(user.id, pipeline.scanId, 'front', compressed);
      setPipeline((p) => ({ ...p, frontPath: path }));
      await ocrTask;
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleBackCapture = async (blob: Blob) => {
    if (!user) return;
    setStep('voice');
    try {
      const compressed = await compressImage(blob);
      const path = await uploadCardScan(user.id, pipeline.scanId, 'back', compressed);
      setPipeline((p) => ({ ...p, backPath: path }));
    } catch (err) {
      toast.error(`Back upload failed: ${errorMessage(err)}`);
    }
  };

  const handleVoiceRecorded = async ({ blob, liveTranscript }: VoiceRecordingResult) => {
    if (!user) return;
    try {
      const voiceId = randomId();
      const path = await uploadVoiceNote(user.id, voiceId, blob);
      setPipeline((p) => ({ ...p, voicePath: path }));
      runVoicePipeline(path, liveTranscript);
    } catch (err) {
      // Upload failed but we still have the live transcript — use it.
      toast.error(`Voice upload failed: ${errorMessage(err)}`);
      runVoicePipeline(null, liveTranscript);
    }
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!user || !eventId) return;
    try {
      const patch = formToInsertPatch(form);
      const contact = await createContact.mutateAsync({
        ...patch,
        event_id: eventId,
        front_image_url: pipeline.frontPath,
        back_image_url: pipeline.backPath,
        voice_note_url: pipeline.voicePath,
      });
      toast.success('Contact saved');
      navigate(`/contacts/${contact.id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  // ── Camera steps fill the whole viewport; no mobile shell.
  if (step === 'front' || step === 'back') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        <div
          className="flex items-center justify-between px-4 py-3 text-white"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
        >
          <button onClick={() => navigate(-1)} aria-label="Close" className="rounded-full bg-white/10 p-2">
            <X size={18} />
          </button>
          <div className="text-sm">
            {step === 'front' ? 'Front of card' : 'Back of card (optional)'}
          </div>
          {step === 'back' ? (
            <button
              onClick={() => setStep('voice')}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white"
            >
              Skip <SkipForward size={12} />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
        <CameraCapture
          onCapture={step === 'front' ? handleFrontCapture : handleBackCapture}
          onCancel={() => navigate(-1)}
        />
      </div>
    );
  }

  // ── Voice step
  if (step === 'voice') {
    return (
      <div className="app-shell safe-bottom">
        <TopBar
          back
          title="Voice note"
          right={
            <button
              onClick={() => setStep('review')}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs"
            >
              Skip <SkipForward size={12} />
            </button>
          }
        />
        <section className="px-5">
          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 text-sm text-muted-foreground">
              Capture context while it's fresh — what they're working on, what stood out, the pitch
              they're chasing. We'll transcribe it for you.
            </div>
            <div className="py-4">
              <VoiceRecorder onRecorded={handleVoiceRecorded} />
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={() => setStep('review')}>
            Continue to review
          </Button>
        </section>
      </div>
    );
  }

  // ── Review step
  return (
    <div className="app-shell safe-bottom">
      <TopBar
        back
        title="Review"
        right={
          <Button size="sm" onClick={handleSave} disabled={createContact.isPending}>
            <Check size={14} />
            Save
          </Button>
        }
      />

      {processingBanner && (
        <div className="mx-5 mb-3 flex items-center gap-2 rounded-xl border border-ember/20 bg-ember/5 px-3 py-2 text-xs text-ember">
          <Loader2 size={14} className="animate-spin" /> {processingBanner}
        </div>
      )}

      {pipeline.ocrState === 'error' && (
        <div className="mx-5 mb-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {pipeline.ocrError}
        </div>
      )}
      {pipeline.voiceState === 'error' && (
        <div className="mx-5 mb-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {pipeline.voiceError}
        </div>
      )}

      <section className="px-5">
        {event && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-soft">
            <div>
              <div className="label-eyebrow">Saving to</div>
              <div className="mt-0.5 text-sm font-medium">{event.name}</div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <ContactFormFields form={form} set={set} />
        </div>

        <Button
          className="mt-5 w-full"
          size="lg"
          variant="ember"
          onClick={handleSave}
          disabled={createContact.isPending}
        >
          {createContact.isPending ? <Loader2 className="animate-spin" /> : <Check />}
          Save contact
        </Button>
      </section>
    </div>
  );
}

// Merge structured OCR results into the form without clobbering anything
// the user has edited during the capture → voice flow.
function mergeFromOcr(
  prev: ContactFormValues,
  next: {
    full_name: string;
    title: string | null;
    company: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    linkedin: string | null;
    address: string | null;
  },
): ContactFormValues {
  const take = (field: keyof ContactFormValues, incoming: string | null) =>
    prev[field] ? prev[field] : (incoming ?? '');
  return {
    ...prev,
    full_name: prev.full_name ? prev.full_name : next.full_name,
    title: take('title', next.title),
    company: take('company', next.company),
    email: take('email', next.email),
    phone: take('phone', next.phone),
    website: take('website', next.website),
    linkedin: take('linkedin', next.linkedin),
    address: take('address', next.address),
  };
}
