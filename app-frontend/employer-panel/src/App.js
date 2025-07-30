import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';


function App() {
  return (
    <Router>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
