import ErrorPage from '../components/ErrorPage';

export default function NotFound() {
  return (
    <ErrorPage
      code="ERROR 404"
      icon="?"
      title="Page not found"
      description="The Admin Panel page you are looking for does not exist, may have been moved, or the address may be incorrect."
      primaryAction={{
        to: '/dashboard',
        label: 'Back to dashboard',
      }}
      secondaryAction={{
        to: '/login',
        label: 'Admin sign in',
      }}
    />
  );
}
