interface Props { title: string; size?: 'sm' | 'lg'; }

const COLORS = ['#2a4a5e', '#3a3a5c', '#4a2a3a', '#2a4a3a', '#4a3a2a'];

function colorFor(title: string) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}

export function PosterPlaceholder({ title, size = 'sm' }: Props) {
  const initials = title.split(' ').filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const bg = colorFor(title);
  const fs = size === 'lg' ? 48 : 28;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 8,
    }}>
      {/* Sprocket holes top */}
      <div style={{ display: 'flex', gap: 6, opacity: 0.3 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--text)' }} />)}
      </div>
      <span style={{ fontFamily: "'Anton', sans-serif", fontSize: fs, color: 'rgba(242,236,221,0.7)', letterSpacing: '0.05em' }}>
        {initials || '?'}
      </span>
      {/* Sprocket holes bottom */}
      <div style={{ display: 'flex', gap: 6, opacity: 0.3 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--text)' }} />)}
      </div>
    </div>
  );
}
