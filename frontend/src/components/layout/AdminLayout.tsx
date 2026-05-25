import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Users, Store, LogOut, Menu, X, Shield, ChevronRight, CreditCard } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLogout } from '@/hooks/useAuth';
import { AdminProfileModal } from '../admin/AdminProfileModal';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AdminLayout() {
  const { user } = useAuthContext();
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate(ROUTES.LOGIN);
    } catch (e) {
      console.error(e);
      navigate(ROUTES.LOGIN);
    }
  };

  const navItems = [
    { name: 'Accounts', href: ROUTES.ADMIN_ACCOUNTS, icon: Users },
    { name: 'Approvals', href: ROUTES.ADMIN_APPROVALS, icon: Store },
    { name: 'Subscriptions', href: ROUTES.ADMIN_SUBSCRIPTIONS, icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-display text-gray-900 tracking-tight">SaveFood <span className="text-indigo-600">Admin</span></span>
          </div>
          <button 
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Management</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                    )} />
                    {item.name}
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-indigo-600" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Area */}
        <div className="p-4 border-t border-gray-100">
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors mb-2 group"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0 border border-indigo-200">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-indigo-700">
                  {user?.fullName?.charAt(0).toUpperCase() || 'A'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                {user?.fullName || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="ml-2 font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            SaveFood Admin
          </div>
        </header>

        {/* Outlet Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>

      <AdminProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
}
