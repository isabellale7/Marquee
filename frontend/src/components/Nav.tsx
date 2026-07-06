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
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        gap: 12,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: '#fff',
          }}>MARQUEE</span>
        </Link>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Link to="/browse" style={navLinkStyle}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            Browse
          </Link>

          {user ? (
            <>
              <Link to="/for-you" style={navLinkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                For you
              </Link>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface)', borderRadius: 20,
                padding: '5px 14px', fontSize: 13, marginLeft: 8,
                border: '1px solid var(--border)',
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {user.display_name}
                </span>
                <button onClick={onLogout} style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: 12, padding: 0,
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-2)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                  leave
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => navigate('/join')} style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 600,
              marginLeft: 8,
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}>
              Join free
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

const navLinkStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 14,
  padding: '6px 12px',
  borderRadius: 6,
  transition: 'color 0.15s',
};
