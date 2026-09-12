// Reusable, composable validation helpers for admin-panel forms.
// Pattern: each validator is a function that takes a value and returns
// either an error message (string) or undefined (valid).
// Compose multiple validators per field with composeValidators().
//
// Usage:
//   const rules = {
//     email: composeValidators(required('Email is required'), isEmail()),
//     password: required('Password is required'),
//   };
//   const errors = validateForm({ email, password }, rules);
//   if (!isValid(errors)) { setFieldErrors(errors); return; }

export const required =
  (message = 'This field is required') =>
  (value) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return message;
    }
    return undefined;
  };

export const isEmail =
  (message = 'Enter a valid email address') =>
  (value) => {
    if (!value) return undefined; // empty handled by required()
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(value).trim()) ? undefined : message;
  };

export const minLength = (min, message) => (value) => {
  if (!value) return undefined;
  return String(value).length >= min ? undefined : message || `Must be at least ${min} characters`;
};

// Chains validators for a single field; returns the first error found.
export const composeValidators =
  (...validators) =>
  (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  };

// Runs a rules object ({ field: validatorFn }) against a values object.
// Returns an errors object: { field: errorMessage } (only failing fields).
export function validateForm(values, rules) {
  const errors = {};
  Object.keys(rules).forEach((field) => {
    const error = rules[field](values[field]);
    if (error) errors[field] = error;
  });
  return errors;
}

export function isValid(errors) {
  return Object.keys(errors).length === 0;
}
