import { useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function Hello() {
  useEffect(() => {
    window.electron.store.set('test', 'persistentData');
    window.electron.store.get('test');
  }, []);
  return (
    <div>
      <p>AHMAD</p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
