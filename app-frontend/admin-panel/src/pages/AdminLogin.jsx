import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';
import FormField from '../components/FormField';
import { required, isEmail, composeValidators, validateForm, isValid } from '../utils/validation';
import './AdminLogin.css';
import logo from '../logo.png';

const EMPLOYER_LOGIN_URL =
  process.env.REACT_APP_EMPLOYER_LOGIN_URL || 'http://localhost:3000/login';

// Field-level validation rules
const rules = {
  email: composeValidators(required('Email is required'), isEmail()),
  password: required('Password is required'),
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Show the expired-session message once, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get('sessionExpired') === '1') {
      setSessionExpired(true);
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validateForm({ email, password }, rules);
    setFieldErrors(errors);

    if (!isValid(errors)) return;

    setSessionExpired(false);
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      <div className="loginFormSection">
        <div className="formContainer">
          <div className="headerSection">
            <p className="adminText">Admin</p>
            <h1 className="loginTitle">Log In</h1>
            <p className="welcomeText">Welcome Back!</p>
          </div>

          <form onSubmit={onSubmit} noValidate className="loginForm">
            {sessionExpired && (
              <p role="status" className="sessionExpiredMessage">
                Your session has expired. Please log in again.
              </p>
            )}
            <div className="inputGroup">
              <FormField
                id="admin-email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
                required
              />
            </div>

            <div className="inputGroup">
              <FormField
                id="admin-password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
                required
              />
            </div>

            {error && <p className="errorMessage">{error}</p>}

            <button type="submit" disabled={loading} className="loginButton">
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          <div className="employerSignInSection">
            <span className="employerSignInPrompt">SecureShift employer?</span>

            <a
              href={EMPLOYER_LOGIN_URL}
              className="employerSignInLink"
              aria-label="Go to SecureShift Employer sign-in"
            >
              Employer sign-in
            </a>
          </div>
        </div>
      </div>

      <div className="brandSection">
        <div className="logoContainer">
          <img src={logo} alt="Secure Shift Logo" className="logoImage" />
        </div>
      </div>
    </div>
  );
}
