import { useState } from 'react';

interface Props {
  value: number | null;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}

export function StarRating({ value, onChange, readonly = false, size = 20 }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const display = hover ?? value ?? 0;
  const stars = [1, 2, 3, 4, 5];

  const handleKey = (e: React.KeyboardEvent, star: number) => {
    if (readonly) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange?.(star); }
    if (e.key === 'ArrowRight') { e.preventDefault(); onChange?.(Math.min(5, (value ?? 0) + 0.5)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); onChange?.(Math.max(0.5, (value ?? 1) - 0.5)); }
  };

  return (
    <div
      role={readonly ? undefined : 'group'}
      aria-label={value ? `Rating: ${value} out of 5` : 'Rate this movie'}
      style={{ display: 'flex', gap: 2, alignItems: 'center', lineHeight: 1 }}
      onMouseLeave={() => !readonly && setHover(null)}
    >
      {stars.map(star => {
        const full = display >= star;
        const half = !full && display >= star - 0.5;
        return (
          <span
            key={star}
            role={readonly ? undefined : 'button'}
            tabIndex={readonly ? undefined : 0}
            aria-label={readonly ? undefined : `${star} star${star !== 1 ? 's' : ''}`}
            aria-pressed={readonly ? undefined : (value !== null && value >= star)}
            style={{
              display: 'inline-block',
              width: size,
              height: size,
              cursor: readonly ? 'default' : 'pointer',
              position: 'relative',
              fontSize: size,
              lineHeight: 1,
              borderRadius: 2,
            }}
            onMouseMove={e => {
              if (readonly) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              setHover(x < rect.width / 2 ? star - 0.5 : star);
            }}
            onClick={e => {
              if (readonly) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              onChange?.(x < rect.width / 2 ? star - 0.5 : star);
            }}
            onKeyDown={e => handleKey(e, star)}
          >
            {/* Base: empty star */}
            <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0 }} aria-hidden>
              <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27l-4.94 2.43.94-5.49-4-3.9 5.53-.8z"
                stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            {/* Filled portion */}
            {(full || half) && (
              <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', top: 0, left: 0 }} aria-hidden>
                <defs>
                  <clipPath id={`h${star}`}>
                    <rect x="0" y="0" width={half ? '10' : '20'} height="20" />
                  </clipPath>
                </defs>
                <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27l-4.94 2.43.94-5.49-4-3.9 5.53-.8z"
                  fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round"
                  clipPath={half ? `url(#h${star})` : undefined} />
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
}
