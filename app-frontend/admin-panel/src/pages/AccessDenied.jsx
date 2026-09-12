import ErrorPage from '../components/ErrorPage';

export default function AccessDenied() {
  return (
    <ErrorPage
      code="ACCESS RESTRICTED"
      icon="!"
      title="Access denied"
      description="Your session may have expired, or your account does not have permission to access the SecureShift Admin Panel. Please sign in with an authorised administrator account."
      primaryAction={{
        to: '/login',
        label: 'Return to admin sign in',
      }}
      footer="Administrator access only"
    />
  );
}
