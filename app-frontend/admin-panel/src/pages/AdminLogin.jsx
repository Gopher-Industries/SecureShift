import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';
import FormField from '../components/FormField';
import { required, isEmail, composeValidators, validateForm, isValid } from '../utils/validation';
import './AdminLogin.css';
import logo from '../logo.png';
import { useTheme } from '../theme/ThemeProvider';

const EMPLOYER_LOGIN_URL =
  process.env.REACT_APP_EMPLOYER_LOGIN_URL || 'http://localhost:3000/login';

// Field-level validation rules
const rules = {
  email: composeValidators(required('Email is required'), isEmail()),
  password: required('Password is required'),
};

export default function AdminLogin() {
  const { colors } = useTheme();

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
      <div className="loginFormSection" style={{ backgroundColor: colors.card }}>
        <div className="formContainer">
          <div className="headerSection">
            <p className="adminText" style={{ color: colors.muted }}>
              Admin
            </p>
            <h1 className="loginTitle" style={{ color: colors.text }}>
              Log In
            </h1>
            <p className="welcomeText" style={{ color: colors.mutedDark }}>
              Welcome Back!
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate className="loginForm">
            {sessionExpired && (
              <p
                role="status"
                className="sessionExpiredMessage"
                style={{ color: colors.warning, background: colors.warningBg }}
              >
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

            {error && (
              <p
                className="errorMessage"
                style={{
                  color: colors.danger,
                  backgroundColor: colors.dangerBg,
                  border: `1px solid ${colors.dangerBorder}`,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="loginButton"
              style={{ backgroundColor: colors.primaryDeep, color: colors.white }}
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          <div className="employerSignInSection">
            <span className="employerSignInPrompt" style={{ color: colors.muted }}>
              SecureShift employer?
            </span>

            <a
              href={EMPLOYER_LOGIN_URL}
              className="employerSignInLink"
              aria-label="Go to SecureShift Employer sign-in"
              style={{ color: colors.primaryDeep, '--focus-color': colors.primaryDeep }}
            >
              Employer sign-in
            </a>
          </div>
        </div>
      </div>

      <div className="brandSection" style={{ background: colors.loginBg }}>
        <div className="logoContainer">
          <img src={logo} alt="Secure Shift Logo" className="logoImage" />
        </div>
      </div>
    </div>
  );
}
