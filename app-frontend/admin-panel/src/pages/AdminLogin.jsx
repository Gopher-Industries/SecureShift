import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';
import FormField from '../components/FormField';
import { required, isEmail, composeValidators, validateForm, isValid } from '../utils/validation';

const btn = {
  width: '100%',
  padding: 10,
  background: '#274b93',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
};

// Field-level validation rules — kept close to the form so it's obvious
// what "valid" means here. Reuse required()/isEmail()/composeValidators()
// from utils/validation.js for other forms (branch, user, SMTP, etc.).
const rules = {
  email: composeValidators(required('Email is required'), isEmail()),
  password: required('Password is required'),
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validateForm({ email, password }, rules);
    setFieldErrors(errors);
    if (!isValid(errors)) return; // block submit on invalid input

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
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
      }}
    >
      <form
        onSubmit={onSubmit}
        noValidate
        style={{
          background: '#fff',
          padding: 32,
          borderRadius: 8,
          width: 340,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#274b93' }}>SecureShift Admin</h2>
        {error && <p style={{ color: '#c00' }}>{error}</p>}

        <FormField
          id="admin-email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />
        <FormField
          id="admin-password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />

        <button disabled={loading} style={{ ...btn, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
