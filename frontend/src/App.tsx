import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { Nav } from './components/Nav';
import { Home } from './pages/Home';
import { Browse } from './pages/Browse';
import { MovieDetail } from './pages/MovieDetail';
import { Join } from './pages/Join';
import { ForYou } from './pages/ForYou';
import { useUser } from './hooks/useUser';

function AppInner() {
  const { user, userId, ratings, loading, createProfile, rateMovie, getRating, logout } = useUser();

  const handleRate = async (movieId: number, value: number): Promise<void> => {
    await rateMovie(movieId, value);
  };

  if (loading) return <div style={{ padding: 48, color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <>
      <Nav user={user} onLogout={logout} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse onRate={userId ? handleRate : undefined} getRating={getRating} />} />
          <Route path="/movies/:id" element={<MovieDetail onRate={userId ? handleRate : undefined} getRating={getRating} userId={userId} />} />
          <Route path="/join" element={<Join onCreateProfile={createProfile} userId={userId} />} />
          <Route path="/for-you" element={<ForYou userId={userId} ratings={ratings} onRate={userId ? handleRate : undefined} getRating={getRating} />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
