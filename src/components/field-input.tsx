import * as React from 'react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface BaseProps {
  label: string;
}

export function FieldInput({
  label,
  ...props
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mb-2.5 block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-dim">
        {label}
      </span>
      <Input {...props} />
    </label>
  );
}

export function FieldTextarea({
  label,
  ...props
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="mb-2.5 block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-dim">
        {label}
      </span>
      <Textarea {...props} />
    </label>
  );
}
