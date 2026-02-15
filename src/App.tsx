import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Game } from './game/Game';
import { LandingPage } from './pages/LandingPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/game"
          element={
            <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
              <Game />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
