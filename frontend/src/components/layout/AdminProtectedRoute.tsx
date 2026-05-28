import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/constants';

export function AdminProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const isAdmin = user.roles?.some(r => r.toUpperCase() === 'ADMIN');

  if (!isAdmin) {
    // If not admin, redirect to home or dashboard
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}
