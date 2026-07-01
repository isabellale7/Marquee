import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  onCreateProfile: (name: string) => Promise<unknown>;
  userId: number | null;
}

export function Join({ onCreateProfile, userId }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (userId) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>You already have a profile.</p>
        <button onClick={() => navigate('/for-you')} style={btnStyle}>Go to your recommendations →</button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter a display name.'); return; }
    setLoading(true);
    setError('');
    try {
      await onCreateProfile(trimmed);
      navigate('/for-you');
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px' }}>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
        Get started
      </p>
      <h1 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 'clamp(28px,5vw,42px)', textTransform: 'uppercase', lineHeight: 1.05, marginBottom: 12 }}>
        Create your<br /><span style={{ color: 'var(--accent)' }}>taste profile</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
        Pick a display name — that's it. No email or password needed. Rate a few movies and we'll build personalized recommendations from your taste.
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 28, padding: '10px 14px', background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)', lineHeight: 1.6 }}>
        ⚠ Profiles are not password-protected. Your taste profile is stored locally — if you clear your browser data, it's gone.
      </p>

      <form onSubmit={submit}>
        <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
          Display name
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Cinephile42"
          maxLength={50}
          style={{
            width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 18, padding: '14px 16px', borderRadius: 6,
            outline: 'none', marginBottom: 12,
          }}
          onFocusCapture={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlurCapture={e => (e.target.style.borderColor = 'var(--border)')}
        />
        {error && <p style={{ color: 'var(--accent-2)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ ...btnStyle, width: '100%', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Creating…' : 'Create profile →'}
        </button>
      </form>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'var(--accent)', color: 'var(--bg)', border: 'none',
  borderRadius: 6, padding: '13px 24px', fontSize: 15, fontWeight: 600,
  cursor: 'pointer', letterSpacing: '0.02em',
};
