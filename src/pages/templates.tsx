import { useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';
import { useTemplates, useCreateTemplate, useDeleteTemplate } from '../data/templates';
import { errorMessage } from '../lib/utils';
import { toast } from 'sonner';

export function Templates() {
  const { data: templates, isLoading, isError, error } = useTemplates();
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const [newOpen, setNewOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', subject: '', body: '' });

  const save = async () => {
    if (!draft.name.trim() || !draft.subject.trim() || !draft.body.trim()) {
      toast.error('Fill in all fields');
      return;
    }
    try {
      await createTemplate.mutateAsync(draft);
      toast.success('Template saved');
      setDraft({ name: '', subject: '', body: '' });
      setNewOpen(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="app-shell safe-bottom">
      <header className="safe-top px-5 pb-4">
        <h1 className="font-serif text-[30px] font-bold leading-[1.1] tracking-tight">Templates</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Reusable follow-up emails with merge fields.
        </p>
      </header>

      <section className="flex flex-col gap-2.5 px-5">
        {isLoading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {isError && (
          <div className="rounded-[14px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage(error)}
          </div>
        )}

        {templates?.map((t) => (
          <div
            key={t.id}
            className="rounded-[14px] border border-[hsl(40_54%_89%/0.08)] bg-card p-4"
          >
            <div className="mb-1 flex items-start justify-between gap-2">
              <div className="text-[14px] font-semibold text-foreground">{t.name}</div>
              <button
                onClick={async () => {
                  if (!confirm(`Delete "${t.name}"?`)) return;
                  try {
                    await deleteTemplate.mutateAsync(t.id);
                    toast.success('Deleted');
                  } catch (err) {
                    toast.error(errorMessage(err));
                  }
                }}
                className="text-muted-dim hover:text-destructive"
                aria-label="Delete template"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mb-1.5 text-[12px] italic text-gold">"{t.subject}"</div>
            <div className="text-[12px] leading-[1.5] text-muted-dim line-clamp-3 whitespace-pre-wrap">
              {t.body.slice(0, 120)}
              {t.body.length > 120 ? '…' : ''}
            </div>
          </div>
        ))}

        {templates && templates.length === 0 && (
          <div className="rounded-[14px] border border-[hsl(40_54%_89%/0.08)] bg-card p-8 text-center">
            <h3 className="mb-1 font-serif text-xl">No templates yet</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Save your favorite follow-up copy for one-tap sending.
            </p>
          </div>
        )}

        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center justify-center gap-2 rounded-[14px] border border-dashed border-[hsl(40_54%_89%/0.12)] p-3.5 text-sm text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
        >
          <Plus size={16} /> New Template
        </button>
      </section>

      <Sheet open={newOpen} onOpenChange={setNewOpen}>
        <SheetContent side="bottom" className="max-h-[86vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New template</SheetTitle>
            <SheetDescription>
              Use <code className="text-gold">{'{first_name}'}</code>,{' '}
              <code className="text-gold">{'{event}'}</code>, and{' '}
              <code className="text-gold">{'{voice_note_snippet}'}</code> in your copy — they'll be
              filled in when you compose.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="label-eyebrow mb-1.5 block">Name</span>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Conference Follow-up"
              />
            </label>
            <label className="block">
              <span className="label-eyebrow mb-1.5 block">Subject</span>
              <Input
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                placeholder="Great connecting at {event}"
              />
            </label>
            <label className="block">
              <span className="label-eyebrow mb-1.5 block">Body</span>
              <Textarea
                rows={10}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="Hi {first_name},&#10;&#10;So glad we met at {event}…"
              />
            </label>
          </div>

          <div className="mt-5 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setNewOpen(false)}>
              <X size={14} /> Cancel
            </Button>
            <Button
              variant="gold"
              className="flex-1"
              onClick={save}
              disabled={createTemplate.isPending}
            >
              {createTemplate.isPending ? <Loader2 className="animate-spin" /> : 'Save'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
