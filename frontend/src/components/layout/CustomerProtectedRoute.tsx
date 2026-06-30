import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/constants';

export function CustomerProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login but save the attempted URL
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Khách hàng có thể truy cập nếu đã đăng nhập.
  // Nếu có yêu cầu role cụ thể, có thể check user.roles ở đây.
  // Tuy nhiên theo nghiệp vụ thì ai đăng nhập cũng có thể là khách hàng.

  return <Outlet />;
}
