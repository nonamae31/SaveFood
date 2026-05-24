import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import type { AdminUserListDTO, AdminUserDetailsDTO } from '../../api/admin.api';
import { Shield, AlertCircle, CheckCircle, Search, X, Store, User as UserIcon } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function UserDetailsModal({ userId, onClose }: { userId: string, onClose: () => void }) {
  const [details, setDetails] = useState<AdminUserDetailsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getUserDetails(userId)
      .then(setDetails)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleUpdateStatus = async (newStatus: number) => {
    if (!details) return;
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      setDetails({ ...details, status: newStatus });
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!details) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-indigo-500" />
            User Details
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {/* Basic Info */}
          <section className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{details.fullName}</h3>
                <p className="text-gray-500">{details.email}</p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-gray-400 mb-1">Phone Number</span>
                    <span className="font-medium text-gray-800">{details.phoneNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-1">Joined Date</span>
                    <span className="font-medium text-gray-800">{new Date(details.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 items-end">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
                  details.status === 0 ? "bg-emerald-100 text-emerald-700" :
                  details.status === 1 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                )}>
                  {details.status === 0 ? 'Active' : details.status === 1 ? 'Inactive' : 'Banned'}
                </span>
                
                <div className="flex gap-1 mt-1">
                  {details.roles.map(role => (
                    <span key={role} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium border border-indigo-100">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Store Affiliations */}
          {details.storeAffiliations.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Store className="w-4 h-4 text-gray-400" />
                Store Affiliations
              </h3>
              <div className="grid gap-4">
                {details.storeAffiliations.map(store => (
                  <div key={store.storeId} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="font-semibold text-gray-900">{store.storeName}</h4>
                      <p className="text-sm text-gray-500 mt-1">{store.addressLine}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "inline-block px-3 py-1 rounded-full text-xs font-bold",
                        store.staffRole === 0 ? "bg-purple-100 text-purple-700" :
                        store.staffRole === 1 ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {store.staffRole === 0 ? 'OWNER' : store.staffRole === 1 ? 'MANAGER' : 'STALL'}
                      </span>
                      <p className="text-xs text-gray-400 mt-2">
                        Status: {store.storeStatus === 0 ? 'Active' : store.storeStatus === 3 ? 'Pending' : store.storeStatus === 4 ? 'Rejected' : store.storeStatus === 1 ? 'Suspended' : 'Closed'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Danger Zone</h3>
            <div className="flex gap-3">
              {details.status !== 2 ? (
                <button 
                  onClick={() => handleUpdateStatus(2)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 px-4 rounded-xl transition-colors border border-red-200 flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Ban User
                </button>
              ) : (
                <button 
                  onClick={() => handleUpdateStatus(0)}
                  className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-semibold py-2.5 px-4 rounded-xl transition-colors border border-emerald-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Re-activate User
                </button>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default function AccountManagementPage() {
  const [users, setUsers] = useState<AdminUserListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            Account Management
          </h1>
          <p className="text-gray-500 mt-2">View and manage all users, staff, and store owners in the system.</p>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-72 shadow-sm"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Roles</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Joined Date</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found matching "{search}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{user.fullName}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? user.roles.map(r => (
                          <span key={r} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-xs font-medium">
                            {r}
                          </span>
                        )) : <span className="text-gray-400 italic">None</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        user.status === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        user.status === 1 ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {user.status === 0 ? 'Active' : user.status === 1 ? 'Inactive' : 'Banned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedUserId(user.id)}
                        className="text-indigo-600 font-medium hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUserId && (
        <UserDetailsModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}
    </div>
  );
}
