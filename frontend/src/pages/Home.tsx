import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Movie } from '../api/client';

export function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(() => {
      api.movies.browse({ search: query, page: 1 }).then(p => {
        setResults(p.items.slice(0, 8));
        setOpen(p.items.length > 0);
        setActiveIdx(-1);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const select = (m: Movie) => {
    setOpen(false);
    setQuery('');
    navigate(`/movies/${m.id}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeIdx >= 0) select(results[activeIdx]);
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)', letterSpacing: '0.18em', fontSize: 12, textTransform: 'uppercase', marginBottom: 14 }}>
          Now showing
        </p>
        <h1 style={{
          fontFamily: "'Anton', sans-serif",
          fontWeight: 400,
          textTransform: 'uppercase',
          fontSize: 'clamp(34px,6vw,58px)',
          lineHeight: 1.02,
          letterSpacing: '0.01em',
          marginBottom: 12,
        }}>
          Your next <span style={{ color: 'var(--accent)' }}>great</span><br />watch starts here.
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 480, lineHeight: 1.6 }}>
          Tell us a movie you love, and we'll find what to watch next — using genre similarity and what audiences with your taste rated highly.
        </p>
      </div>

      {/* Search combobox */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
          Search for a movie
        </label>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="e.g. Inception, The Godfather…"
          aria-autocomplete="list"
          aria-expanded={open}
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 18,
            padding: '16px 18px',
            borderRadius: 6,
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocusCapture={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlurCapture={e => (e.target.style.borderColor = 'var(--border)')}
        />
        {open && (
          <div role="listbox" style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6,
            maxHeight: 320, overflowY: 'auto', zIndex: 20,
            boxShadow: '0 12px 28px rgba(0,0,0,.35)',
          }}>
            {results.map((m, i) => (
              <div
                key={m.id}
                role="option"
                aria-selected={i === activeIdx}
                onMouseDown={() => select(m)}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  padding: '11px 16px',
                  cursor: 'pointer',
                  fontSize: 15,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  background: i === activeIdx ? 'rgba(232,163,61,0.14)' : 'transparent',
                }}
              >
                <span>{m.title}</span>
                <span style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, flexShrink: 0 }}>{m.year}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a href="/browse" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--text)', borderRadius: 6, padding: '10px 20px', fontSize: 14, fontWeight: 500,
        }}>Browse all movies →</a>
        <a href="/join" style={{
          background: 'var(--accent)', color: 'var(--bg)',
          borderRadius: 6, padding: '10px 20px', fontSize: 14, fontWeight: 600,
        }}>Create a taste profile</a>
      </div>

      {/* How it works */}
      <div style={{ marginTop: 72, paddingTop: 48, borderTop: '1px solid var(--border)' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)', letterSpacing: '0.15em', fontSize: 11, textTransform: 'uppercase', marginBottom: 24 }}>
          How it works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          {[
            { n: '01', title: 'Find a film', body: 'Search for any movie in our catalog of 9,700+ titles from MovieLens.' },
            { n: '02', title: 'Get similar picks', body: '"More like this" uses genre similarity. No account needed.' },
            { n: '03', title: 'Rate to unlock', body: 'Rate 3+ movies to switch to hybrid recommendations — what audiences like you loved.' },
          ].map(step => (
            <div key={step.n}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--accent)', marginBottom: 8 }}>{step.n}</div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, textTransform: 'uppercase', marginBottom: 6 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
