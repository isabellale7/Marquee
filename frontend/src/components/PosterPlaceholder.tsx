interface Props { title: string; size?: 'sm' | 'lg'; }

const GRADIENTS = [
  ['#1a1040', '#4a2d9c'],
  ['#0a1628', '#1a5c8a'],
  ['#1a0a28', '#7c2d82'],
  ['#0a1a10', '#1a6b3a'],
  ['#1a1010', '#8a2020'],
  ['#101a1a', '#1a6b6b'],
  ['#1a100a', '#8a4a0a'],
];

function gradientFor(title: string) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) & 0xffffffff;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

export function PosterPlaceholder({ title, size = 'sm' }: Props) {
  const initials = title.split(' ').filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const [from, to] = gradientFor(title);
  const fs = size === 'lg' ? 52 : 30;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{
        fontSize: fs,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.05em',
        userSelect: 'none',
      }}>
        {initials || '?'}
      </span>
    </div>
  );
}
