import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProjectList from './pages/ProjectList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1> Taskboard</h1>
          <p>Project & Task Management System</p>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<ProjectList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
