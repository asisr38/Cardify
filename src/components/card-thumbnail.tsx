import { cardPalette } from '../lib/card-visual';
import { cn } from '../lib/utils';

type Size = 'sm' | 'md' | 'lg';

const DIMS: Record<Size, { w: number; h: number; fs: number }> = {
  sm: { w: 130, h: 73, fs: 8 },
  md: { w: 168, h: 94, fs: 9.5 },
  lg: { w: 310, h: 174, fs: 13 },
};

interface Props {
  name: string;
  title?: string | null;
  company?: string | null;
  website?: string | null;
  size?: Size;
  selected?: boolean;
  seed?: string;
  className?: string;
}

export function CardThumbnail({
  name,
  title,
  company,
  website,
  size = 'md',
  selected = false,
  seed,
  className,
}: Props) {
  const { w, h, fs } = DIMS[size];
  const palette = cardPalette(seed ?? name);

  return (
    <div
      className={cn('relative flex-shrink-0 overflow-hidden transition-shadow', className)}
      style={{
        width: w,
        height: h,
        borderRadius: Math.round(w * 0.042),
        background: palette.bg,
        border: selected
          ? `1.5px solid hsl(var(--gold))`
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: selected
          ? `0 0 24px hsl(var(--gold-glow-strong)), 0 8px 24px rgba(0,0,0,0.5)`
          : '0 6px 20px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: Math.max(2, w * 0.025),
          background: palette.accent,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 60% at 85% 15%, ${palette.accent}22, transparent 65%)`,
        }}
      />
      <div
        style={{
          padding: `${h * 0.14}px ${w * 0.1}px`,
          color: '#fff',
          position: 'relative',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: fs * 1.35,
            letterSpacing: -0.3,
            marginBottom: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </div>
        {title && (
          <div
            style={{
              fontSize: fs,
              opacity: 0.6,
              fontWeight: 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: h * 0.1,
          left: w * 0.1,
          right: w * 0.08,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 6,
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {company && (
          <div
            style={{
              fontSize: fs * 1.05,
              fontWeight: 700,
              color: palette.accent,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {company}
          </div>
        )}
        {website && (
          <div
            style={{
              fontSize: fs * 0.8,
              opacity: 0.35,
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
          >
            {website}
          </div>
        )}
      </div>
    </div>
  );
}
