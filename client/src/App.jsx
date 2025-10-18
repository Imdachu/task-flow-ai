import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>📋 Taskboard</h1>
          <p>Project & Task Management System</p>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="home">
      <h2>Welcome to Taskboard!</h2>
      <p>Frontend is ready. Backend API running on port 4000.</p>
      <div className="status">
        <p>✅ Vite + React configured</p>
        <p>✅ React Router installed</p>
        <p>✅ Axios ready for API calls</p>
        <p>✅ DnD Kit ready for drag-and-drop</p>
      </div>
    </div>
  );
}

export default App;
