import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import Tasks from './pages/Tasks';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tasks" element={<Tasks />} />
      </Routes>
    </Router>
  );
}

export default App;