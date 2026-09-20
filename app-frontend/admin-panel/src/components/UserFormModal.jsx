import { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import colors from '../theme/colors';

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'employer',
  phone: '',
  ABN: '',
  address: {
    street: '',
    suburb: '',
    state: '',
    postcode: '',
  },
};

const styles = {
  form: {
    width: '100%',
    maxWidth: 520,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    marginBottom: 5,
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 10px',
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    fontSize: 14,
    background: colors.white,
    color: colors.text,
  },
  error: {
    margin: '4px 0 0',
    color: colors.danger,
    fontSize: 12,
  },
  notice: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    color: colors.warning,
    fontSize: 13,
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 20,
  },
};

function getInitialForm(initialUser) {
  if (!initialUser) {
    return {
      ...EMPTY_FORM,
      address: { ...EMPTY_FORM.address },
    };
  }

  return {
    name: initialUser.name || '',
    email: initialUser.email || '',
    password: '',
    role: initialUser.role || 'employer',
    phone: initialUser.phone || '',
    ABN: initialUser.ABN || '',
    address: {
      street: initialUser.address?.street || '',
      suburb: initialUser.address?.suburb || '',
      state: initialUser.address?.state || '',
      postcode: initialUser.address?.postcode || '',
    },
  };
}

function validate(form, mode) {
  const errors = {};

  const name = form.name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const postcode = form.address.postcode.trim();
  const ABN = form.ABN.trim();

  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length < 2) {
    errors.name = 'Name must contain at least 2 characters.';
  } else if (!/^[A-Za-z\s'-]+$/.test(name)) {
    errors.name = 'Name can only contain letters, spaces, hyphens and apostrophes.';
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (mode === 'create') {
    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/.test(form.password)) {
      errors.password =
        'Use at least 6 characters with uppercase, lowercase, number and special character.';
    }
  }

  if (phone && !/^\+?\d{8,15}$/.test(phone)) {
    errors.phone = 'Phone must contain 8 to 15 digits and may start with +.';
  }

  if (postcode && !/^\d{4}$/.test(postcode)) {
    errors.postcode = 'Postcode must contain exactly 4 digits.';
  }

  if (form.role === 'employer' && !/^\d{11}$/.test(ABN)) {
    errors.ABN = 'Employer ABN must contain exactly 11 digits.';
  }

  return errors;
}

export default function UserFormModal({
  open,
  mode = 'create',
  initialUser = null,
  submitting = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(getInitialForm(initialUser));
  const [errors, setErrors] = useState({});

  const editing = mode === 'edit';

  useEffect(() => {
    if (open) {
      setForm(getInitialForm(initialUser));
      setErrors({});
    }
  }, [open, initialUser]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: '',
    }));
  };

  const updateAddress = (field, value) => {
    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
    }));

    setErrors((current) => ({
      ...current,
      [field]: '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (editing) return;

    const nextErrors = validate(form, mode);

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit(form);
  };

  return (
    <Modal open={open} title={editing ? 'Edit User' : 'Add User'} onClose={onClose}>
      <form style={styles.form} onSubmit={handleSubmit} noValidate>
        {editing ? (
          <div style={styles.notice}>
            The edit form is ready, but saving changes is temporarily disabled until the backend
            provides PATCH /admin/users/:id.
          </div>
        ) : (
          <div style={styles.notice}>
            The current backend supports creating Employer accounts. Admin account creation will be
            enabled when the dedicated Admin user-management endpoint is available.
          </div>
        )}

        <div style={styles.field}>
          <label style={styles.label} htmlFor="user-name">
            Name
          </label>

          <input
            id="user-name"
            style={styles.input}
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
          />

          {errors.name ? <p style={styles.error}>{errors.name}</p> : null}
        </div>

        <div style={styles.field}>
          <label style={styles.label} htmlFor="user-email">
            Email
          </label>

          <input
            id="user-email"
            type="email"
            style={styles.input}
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
          />

          {errors.email ? <p style={styles.error}>{errors.email}</p> : null}
        </div>

        {!editing ? (
          <div style={styles.field}>
            <label style={styles.label} htmlFor="user-password">
              Temporary Password
            </label>

            <input
              id="user-password"
              type="password"
              style={styles.input}
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
            />

            {errors.password ? <p style={styles.error}>{errors.password}</p> : null}
          </div>
        ) : null}

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="user-role">
              Role
            </label>

            <select
              id="user-role"
              style={styles.input}
              value={form.role}
              disabled={editing}
              onChange={(event) => updateField('role', event.target.value)}
            >
              <option value="employer">Employer</option>

              {editing && form.role === 'admin' ? (
                <option value="admin">Admin</option>
              ) : (
                <option value="admin" disabled>
                  Admin — backend pending
                </option>
              )}

              {editing && form.role === 'guard' ? (
                <option value="guard">Guard</option>
              ) : (
                <option value="guard" disabled>
                  Guard — separate registration workflow
                </option>
              )}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="user-phone">
              Phone
            </label>

            <input
              id="user-phone"
              style={styles.input}
              placeholder="+61400123456"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
            />

            {errors.phone ? <p style={styles.error}>{errors.phone}</p> : null}
          </div>
        </div>

        {form.role === 'employer' ? (
          <div style={styles.field}>
            <label style={styles.label} htmlFor="user-abn">
              ABN
            </label>

            <input
              id="user-abn"
              style={styles.input}
              maxLength={11}
              placeholder="11 digit ABN"
              value={form.ABN}
              onChange={(event) => updateField('ABN', event.target.value.replace(/\D/g, ''))}
            />

            {errors.ABN ? <p style={styles.error}>{errors.ABN}</p> : null}
          </div>
        ) : null}

        <div style={styles.field}>
          <label style={styles.label} htmlFor="user-street">
            Street
          </label>

          <input
            id="user-street"
            style={styles.input}
            value={form.address.street}
            onChange={(event) => updateAddress('street', event.target.value)}
          />
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="user-suburb">
              Suburb
            </label>

            <input
              id="user-suburb"
              style={styles.input}
              value={form.address.suburb}
              onChange={(event) => updateAddress('suburb', event.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="user-state">
              State
            </label>

            <input
              id="user-state"
              style={styles.input}
              value={form.address.state}
              onChange={(event) => updateAddress('state', event.target.value)}
            />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label} htmlFor="user-postcode">
            Postcode
          </label>

          <input
            id="user-postcode"
            style={styles.input}
            maxLength={4}
            value={form.address.postcode}
            onChange={(event) => updateAddress('postcode', event.target.value.replace(/\D/g, ''))}
          />

          {errors.postcode ? <p style={styles.error}>{errors.postcode}</p> : null}
        </div>

        <div style={styles.actions}>
          <Button type="submit" disabled={submitting || editing}>
            {editing ? 'Save unavailable' : submitting ? 'Creating…' : 'Create User'}
          </Button>

          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
