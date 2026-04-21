import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from './ui/sheet';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useCreateEvent } from '../data/events';
import { todayISODate, errorMessage } from '../lib/utils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (eventId: string) => void;
}

export function NewEventSheet({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(todayISODate());
  const [location, setLocation] = useState('');
  const [setActive, setSetActive] = useState(true);

  const createEvent = useCreateEvent();

  const reset = () => {
    setName('');
    setDate(todayISODate());
    setLocation('');
    setSetActive(true);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const event = await createEvent.mutateAsync({
        name: trimmed,
        date,
        location: location.trim() || null,
        is_active: setActive,
      });
      toast.success(`${event.name} created`);
      reset();
      onOpenChange(false);
      onCreated?.(event.id);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <SheetContent className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New event</SheetTitle>
          <SheetDescription>
            Name the conference, dinner, or meetup — contacts you capture land here.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3 px-5">
          <div className="space-y-1.5">
            <Label htmlFor="event-name">Event name</Label>
            <Input
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SaaStr Annual"
              autoFocus
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-date">Date</Label>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-loc">Location (optional)</Label>
            <Input
              id="event-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Mateo, CA"
              maxLength={160}
            />
          </div>

          <label className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <div className="text-sm font-medium">Set as active event</div>
              <div className="text-xs text-muted-foreground">New scans default here</div>
            </div>
            <Toggle checked={setActive} onChange={setSetActive} />
          </label>
        </div>

        <SheetFooter className="mt-5">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!name.trim() || createEvent.isPending}
          >
            {createEvent.isPending ? 'Creating…' : 'Create event'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? 'bg-gold' : 'bg-muted'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-card shadow-soft transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}
