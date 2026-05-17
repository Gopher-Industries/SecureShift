import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../logo.png';
import './Login.css';
import http from '../lib/http';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const getErrorMessage = (err, fallback) => {
    return err?.response?.data?.message || err?.message || fallback;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);

    try {
      const { data } = await http.post('/auth/login', { email, password });

      if (data?.token) {
        localStorage.setItem('token', data.token);
        if (data?.role) localStorage.setItem('userRole', data.role);
        if (data?.id) localStorage.setItem('userId', data.id);
        navigate('/employer-dashboard');
        return;
      }

      // If backend requires OTP, keep the login UI and show OTP section below.
      setOtpMode(true);
      setOtp('');
      setOtpNotice(`OTP sent to ${email}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the OTP sent to your email.');
      return;
    }

    setVerifyLoading(true);
    try {
      const { data } = await http.post('/auth/verify-otp', { email, otp: otp.trim() });

      localStorage.setItem('token', data.token);
      if (data?.role) localStorage.setItem('userRole', data.role);
      if (data?.id) localStorage.setItem('userId', data.id);

      navigate('/employer-dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'OTP verification failed'));
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      {/* Left side - Login Form */}
      <div className="loginFormSection">
        <div className="formContainer">
          <div className="headerSection">
            <p className="employerText">Employer</p>
            <h1 className="loginTitle">Log In</h1>
            <p className="welcomeText">Welcome Back!</p>
          </div>

          <form onSubmit={handleLogin} className="loginForm">
            <div className="inputGroup">
              <label className="inputLabel" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="formInput"
                disabled={loginLoading || verifyLoading}
              />
            </div>

            <div className="inputGroup">
              <label className="inputLabel" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="formInput"
                disabled={loginLoading || verifyLoading}
              />
            </div>

            {error && !otpMode && <div className="errorMessage">{error}</div>}
            {loginLoading && <div className="loadingMessage">Sending OTP...</div>}

            <button type="submit" className="loginButton" disabled={loginLoading || verifyLoading}>
              {loginLoading ? 'Please wait...' : 'Log In'}
            </button>

            {otpMode && otpNotice && <div className="otpNotice">{otpNotice}</div>}
          </form>

          {otpMode && (
            <form onSubmit={handleVerifyOtp} className="loginForm otpForm">
              <div className="inputGroup">
                <label className="inputLabel" htmlFor="login-otp">
                  Enter OTP
                </label>
                <input
                  id="login-otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="formInput"
                  disabled={loginLoading || verifyLoading}
                />
              </div>

              {error && <div className="errorMessage">{error}</div>}
              {verifyLoading && <div className="loadingMessage">Verifying OTP...</div>}

              <button
                type="submit"
                className="loginButton"
                disabled={loginLoading || verifyLoading}
              >
                {verifyLoading ? 'Please wait...' : 'Verify OTP'}
              </button>
            </form>
          )}

          <div className="partnerLink">
            <a href="/expression-of-interest" className="partnerText">
              Want to partner with us? Submit an expression of interest!
            </a>
          </div>
        </div>
      </div>

      {/* Right side - Logo/Brand */}
      <div className="brandSection">
        <div className="logoContainer">
          <img src={logo} alt="Secure Shift Logo" className="logoImage" />
        </div>
      </div>
    </div>
  );
}
