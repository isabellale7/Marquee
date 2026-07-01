import { Link, useNavigate } from 'react-router-dom';
import type { User } from '../api/client';

interface Props {
  user: User | null;
  onLogout: () => void;
}

export function Nav({ user, onLogout }: Props) {
  const navigate = useNavigate();

  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 16px',
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 52,
        gap: 12,
        flexWrap: 'wrap',
        padding: '6px 0',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Film sprocket icon */}
          <span style={{ fontSize: 22, lineHeight: 1 }}>🎞</span>
          <span style={{
            fontFamily: "'Anton', sans-serif",
            fontWeight: 400,
            fontSize: 22,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}>Marquee</span>
        </Link>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/browse" style={{ color: 'var(--text-muted)', fontSize: 14, padding: '6px 10px', borderRadius: 4, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            Browse
          </Link>

          {user ? (
            <>
              <Link to="/for-you" style={{ color: 'var(--text-muted)', fontSize: 14, padding: '6px 10px', borderRadius: 4, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                For You
              </Link>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface-2)', borderRadius: 6,
                padding: '4px 12px', fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {user.display_name}
                </span>
                <button onClick={onLogout} style={{
                  background: 'none', border: 'none', color: 'var(--accent-2)',
                  fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.05em', padding: 0,
                }}>leave</button>
              </div>
            </>
          ) : (
            <button onClick={() => navigate('/join')} style={{
              background: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 6,
              padding: '7px 16px',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.03em',
            }}>
              Get Started
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
