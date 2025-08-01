import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import CreateShift from './pages/createShift';// Import the CreateShift component

function App() {
  return (
    <Router>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
        <Link to="/create-shift">Create Shift</Link> 
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/create-shift" element={<CreateShift />} />
      </Routes>
    </Router>
  );
}

export default App;
