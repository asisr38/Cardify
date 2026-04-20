import { useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from './ui/sheet';
import { Button } from './ui/button';
import {
  ContactFormFields,
  emptyContactForm,
  formToInsertPatch,
  useContactForm,
} from './contact-form';
import { useCreateContact } from '../data/contacts';
import { errorMessage } from '../lib/utils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
}

export function NewContactSheet({ open, onOpenChange, eventId }: Props) {
  const { form, setForm, set } = useContactForm(emptyContactForm);
  const createContact = useCreateContact();

  useEffect(() => {
    if (!open) setForm(emptyContactForm);
  }, [open, setForm]);

  const handleSave = async () => {
    if (!form.full_name.trim()) return;
    try {
      const contact = await createContact.mutateAsync({
        ...formToInsertPatch(form),
        event_id: eventId,
        voice_note_url: null,
        front_image_url: null,
        back_image_url: null,
      });
      toast.success(`${contact.full_name.split(' ')[0]} added`);
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add contact</SheetTitle>
          <SheetDescription>
            Type it in manually. Card scanning and OCR arrive in Milestone 3.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 px-5">
          <ContactFormFields form={form} set={set} />
        </div>

        <SheetFooter className="mt-5">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!form.full_name.trim() || createContact.isPending}
          >
            {createContact.isPending ? 'Saving…' : 'Save contact'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
