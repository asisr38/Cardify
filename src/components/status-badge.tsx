import { Badge } from './ui/badge';
import type { FollowUpStatus } from '../types/database';

const map: Record<FollowUpStatus, { label: string; variant: 'ember' | 'success' | 'muted' }> = {
  pending: { label: 'Pending', variant: 'ember' },
  sent: { label: 'Sent', variant: 'success' },
  skipped: { label: 'Skipped', variant: 'muted' },
};

export function StatusBadge({ status, className }: { status: FollowUpStatus; className?: string }) {
  const s = map[status];
  return (
    <Badge variant={s.variant} className={className}>
      {s.label}
    </Badge>
  );
}
