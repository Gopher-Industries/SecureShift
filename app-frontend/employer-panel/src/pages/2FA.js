import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import http from '../lib/http';
import './TwoFA.css';

export default function TwoFA() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get email passed from Login page
  const email = location.state?.email;

  if (!email) {
    return <p className="tfa-error">Error: No email found. Please log in again.</p>;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await http.post('/auth/verify-otp', { email, otp });

      // Save JWT token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userId', data.id);

      // Redirect to employer dashboard
      navigate('/employer-dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tfa-container">
      <h2 className="tfa-heading">Enter OTP</h2>
      <p className="tfa-subtext">
        We sent a 6-digit code to <b className="tfa-email">{email}</b>
      </p>

      <form onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          className="tfa-input"
        />
        {error && <p className="tfa-error">{error}</p>}
        <button type="submit" className="tfa-submit-button" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>
    </div>
  );
}
