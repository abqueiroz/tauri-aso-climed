import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import NewTodoPage from './pages/NewTodoPage';
import ReportPage from './pages/ReportPage';

const navBase =
  'px-3 py-2 rounded-lg text-sm transition border border-transparent hover:border-zinc-700';
const navActive = 'bg-zinc-900 border-zinc-700';

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Tauri + Drizzle + Puppeteer</div>
          <nav className="flex gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `${navBase} ${isActive ? navActive : ''}`}
            >
              Home
            </NavLink>
            <NavLink
              to="/new"
              className={({ isActive }) => `${navBase} ${isActive ? navActive : ''}`}
            >
              Novo
            </NavLink>
            <NavLink
              to="/report"
              className={({ isActive }) => `${navBase} ${isActive ? navActive : ''}`}
            >
              Relatório
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/new" element={<NewTodoPage />} />
          <Route path="/report" element={<ReportPage />} />
        </Routes>
      </main>
    </div>
  );
}
