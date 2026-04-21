import { cn } from '../lib/utils';
import type { FollowUpStatus } from '../types/database';

const MAP: Record<FollowUpStatus, { label: string; dot: boolean; className: string }> = {
  pending: {
    label: 'Follow up',
    dot: true,
    className: 'border-gold/30 bg-gold/15 text-gold',
  },
  sent: {
    label: 'Sent ✓',
    dot: false,
    className: 'border-emerald-500/20 bg-emerald-500/12 text-emerald-400',
  },
  skipped: {
    label: 'Skipped',
    dot: false,
    className: 'border-white/6 bg-white/5 text-white/35',
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: FollowUpStatus;
  className?: string;
}) {
  const cfg = MAP[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide',
        cfg.className,
        className,
      )}
    >
      {cfg.dot && (
        <span
          className="inline-block h-[5px] w-[5px] rounded-full animate-pulse-glow"
          style={{ background: 'currentColor' }}
        />
      )}
      {cfg.label}
    </span>
  );
}
