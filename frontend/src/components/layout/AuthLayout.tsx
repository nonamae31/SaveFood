import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[--color-surface-subtle] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Thêm logo hoặc các thành phần auth branding ở đây nếu cần */}
      <Outlet />
    </div>
  );
}
