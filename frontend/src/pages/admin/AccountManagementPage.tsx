import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../../api/admin.api';
import type { AdminUserListDTO, AdminUserDetailsDTO } from '../../api/admin.api';
import { Shield, AlertCircle, CheckCircle, Search, X, Store, User as UserIcon, ArrowUpDown, ArrowUp, ArrowDown, Filter, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function CustomSelect({ value, onChange, options, icon }: { value: string, onChange: (val: string) => void, options: {label: string, value: string}[], icon?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || value;
  
  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between min-w-[180px] bg-mint-canvas border border-mint-hairline text-mint-ink text-[14px] rounded-[8px] h-[40px] px-3 focus:outline-none focus:border-mint-brand-green hover:border-mint-steel transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          {icon}
          {selectedLabel}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-mint-stone transition-transform shrink-0", open ? "rotate-180" : "")} />
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
          <div className="absolute z-20 mt-1 w-full bg-mint-canvas border border-mint-hairline rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[14px] transition-colors flex items-center justify-between",
                    value === opt.value ? "bg-mint-surface-soft text-mint-ink font-medium" : "text-mint-steel hover:bg-mint-surface hover:text-mint-ink"
                  )}
                >
                  {opt.label}
                  {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-mint-brand-green"></div>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
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
      <div className="fixed inset-0 bg-mint-primary/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-mint-canvas p-8 rounded-[12px] border border-mint-hairline shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12)] flex flex-col items-center">
          <div className="w-8 h-8 border-[3px] border-mint-brand-green border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-mint-steel font-medium font-inter text-[14px]">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!details) return null;

  return (
    <div className="fixed inset-0 bg-mint-primary/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-inter">
      <div className="bg-mint-canvas rounded-[12px] shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12)] border border-mint-hairline w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-mint-canvas/80 backdrop-blur-md border-b border-mint-hairline-soft px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[22px] font-semibold text-mint-ink flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-mint-steel" />
            User Details
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-mint-surface rounded-full transition-colors text-mint-stone hover:text-mint-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {/* Basic Info */}
          <section className="bg-mint-surface rounded-[12px] p-8 border border-mint-hairline">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-mint-canvas border border-mint-hairline shrink-0 flex items-center justify-center">
                    {details.avatarUrl ? (
                      <img src={details.avatarUrl} alt={details.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-8 h-8 text-mint-stone" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-[28px] font-semibold text-mint-ink tracking-tight mb-1 leading-none">{details.fullName}</h3>
                    <p className="text-[16px] text-mint-steel">{details.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 text-[14px]">
                  <div>
                    <span className="block text-mint-stone mb-1 font-medium">Phone Number</span>
                    <span className="font-geist text-mint-ink bg-mint-surface-soft border border-mint-hairline px-2 py-0.5 rounded-[4px]">{details.phoneNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-mint-stone mb-1 font-medium">Joined Date</span>
                    <span className="font-medium text-mint-ink">{new Date(details.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 items-end">
                <span className={cn(
                  "px-2 py-1 rounded-[6px] text-[11px] font-semibold uppercase tracking-[0.5px]",
                  details.status === 0 ? "bg-[#7cebcb]/20 text-[#1ba673]" :
                  details.status === 1 ? "bg-[#c37d0d]/10 text-[#c37d0d]" :
                  "bg-[#d45656]/10 text-[#d45656]"
                )}>
                  {details.status === 0 ? 'ACTIVE' : details.status === 1 ? 'INACTIVE' : 'BANNED'}
                </span>
                
                <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                  {details.roles.map(role => (
                    <span key={role} className="bg-[rgba(55,114,207,0.15)] text-[#3772cf] px-2 py-0.5 rounded-[6px] text-[13px] font-semibold">
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
              <h3 className="text-[11px] font-semibold text-mint-steel uppercase tracking-[0.5px] mb-4 flex items-center gap-2">
                <Store className="w-3.5 h-3.5" />
                Store Affiliations
              </h3>
              <div className="grid gap-4">
                {details.storeAffiliations.map(store => (
                  <div key={store.storeId} className="bg-mint-canvas border border-mint-hairline rounded-[12px] p-6 flex items-center justify-between hover:border-mint-brand-green transition-colors">
                    <div>
                      <h4 className="font-semibold text-[16px] text-mint-ink">{store.storeName}</h4>
                      <p className="text-[14px] text-mint-steel mt-1">{store.addressLine}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded-[6px] text-[13px] font-semibold",
                        store.staffRole === 0 ? "bg-mint-surface text-mint-ink" :
                        store.staffRole === 1 ? "bg-mint-surface text-mint-steel" :
                        "bg-mint-surface text-mint-stone"
                      )}>
                        {store.staffRole === 0 ? 'OWNER' : store.staffRole === 1 ? 'MANAGER' : 'STAFF'}
                      </span>
                      <p className="text-[13px] text-mint-stone mt-2 font-medium">
                        Status: {store.storeStatus === 0 ? 'Active' : store.storeStatus === 3 ? 'Pending' : store.storeStatus === 4 ? 'Rejected' : store.storeStatus === 1 ? 'Suspended' : 'Closed'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <section className="pt-6 border-t border-mint-hairline-soft">
            <h3 className="text-[11px] font-semibold text-mint-steel uppercase tracking-[0.5px] mb-4">Danger Zone</h3>
            <div className="flex gap-4">
              {details.status !== 2 ? (
                <button 
                  onClick={() => handleUpdateStatus(2)}
                  className="flex-1 bg-transparent hover:bg-[#d45656]/5 text-[#d45656] font-medium py-[10px] px-[20px] rounded-[9999px] transition-colors border border-mint-hairline hover:border-[#d45656] flex items-center justify-center gap-2 text-[14px]"
                >
                  <AlertCircle className="w-4 h-4" />
                  Ban User
                </button>
              ) : (
                <button 
                  onClick={() => handleUpdateStatus(0)}
                  className="flex-1 bg-mint-brand-green hover:bg-mint-brand-green-deep text-mint-primary font-medium py-[10px] px-[20px] rounded-[9999px] transition-colors flex items-center justify-center gap-2 text-[14px]"
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
  
  // Filtering states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: keyof AdminUserListDTO, direction: 'asc' | 'desc' } | null>(null);
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    users.forEach(u => u.roles.forEach(r => roles.add(r)));
    return Array.from(roles).sort();
  }, [users]);

  const requestSort = (key: keyof AdminUserListDTO) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof AdminUserListDTO) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline text-mint-stone opacity-50 group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="w-3.5 h-3.5 ml-1 inline text-mint-ink" /> : 
      <ArrowDown className="w-3.5 h-3.5 ml-1 inline text-mint-ink" />;
  };

  const processedUsers = useMemo(() => {
    let filtered = users.filter(u => 
      (u.email.toLowerCase().includes(search.toLowerCase()) || 
       u.fullName.toLowerCase().includes(search.toLowerCase()))
    );

    if (roleFilter !== 'All') {
      filtered = filtered.filter(u => u.roles.includes(roleFilter));
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(u => u.status.toString() === statusFilter);
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'roles') {
          aVal = a.roles.join(', ');
          bVal = b.roles.join(', ');
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [users, search, roleFilter, statusFilter, sortConfig]);

  const roleOptions = [
    { label: 'All Roles', value: 'All' },
    ...uniqueRoles.map(role => ({ label: role, value: role }))
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'All' },
    { label: 'Active', value: '0' },
    { label: 'Inactive', value: '1' },
    { label: 'Banned', value: '2' }
  ];

  return (
    <div className="p-8 max-w-[1280px] mx-auto font-inter bg-mint-surface-soft min-h-[calc(100vh-64px)] rounded-tl-[16px] border-t border-l border-mint-hairline shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[36px] font-semibold text-mint-ink tracking-[-0.5px] flex items-center gap-3">
            <Shield className="w-8 h-8 text-mint-ink" />
            Account Management
          </h1>
          <p className="text-[16px] text-mint-steel mt-2">View and manage all users, staff, and store owners in the system.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-mint-canvas p-4 rounded-[12px] border border-mint-hairline shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mint-steel" />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-mint-canvas border border-mint-hairline text-mint-ink rounded-[8px] focus:outline-none focus:border-mint-brand-green focus:border-2 text-[14px] h-[40px] transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <CustomSelect 
            value={roleFilter}
            onChange={setRoleFilter}
            options={roleOptions}
            icon={<Filter className="w-4 h-4 text-mint-stone" />}
          />
          <CustomSelect 
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-mint-canvas rounded-[12px] border border-mint-hairline shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="text-mint-steel border-b border-mint-hairline bg-mint-surface/50">
              <tr>
                <th className="px-6 py-4 font-medium group cursor-pointer hover:text-mint-ink select-none" onClick={() => requestSort('fullName')}>
                  User {getSortIcon('fullName')}
                </th>
                <th className="px-6 py-4 font-medium group cursor-pointer hover:text-mint-ink select-none" onClick={() => requestSort('roles')}>
                  Roles {getSortIcon('roles')}
                </th>
                <th className="px-6 py-4 font-medium group cursor-pointer hover:text-mint-ink select-none" onClick={() => requestSort('status')}>
                  Status {getSortIcon('status')}
                </th>
                <th className="px-6 py-4 font-medium group cursor-pointer hover:text-mint-ink select-none" onClick={() => requestSort('createdAt')}>
                  Joined Date {getSortIcon('createdAt')}
                </th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-mint-steel border-b border-mint-hairline-soft">
                    <div className="inline-block w-6 h-6 border-[2px] border-mint-brand-green border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : processedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-mint-steel border-b border-mint-hairline-soft text-[14px]">
                    No users found matching your filters
                  </td>
                </tr>
              ) : (
                processedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-mint-surface transition-colors group border-b border-mint-hairline-soft last:border-0">
                    <td className="px-6 py-4">
                      <div className="font-medium text-mint-ink text-[14px]">{user.fullName}</div>
                      <div className="text-mint-steel text-[13px] mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.roles.length > 0 ? user.roles.map(r => (
                          <span key={r} className="bg-[rgba(55,114,207,0.15)] text-[#3772cf] px-2 py-0.5 rounded-[6px] text-[13px] font-semibold">
                            {r}
                          </span>
                        )) : <span className="text-mint-stone italic">None</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-[6px] text-[11px] font-semibold tracking-[0.5px] uppercase",
                        user.status === 0 ? "bg-[#7cebcb]/20 text-[#1ba673]" :
                        user.status === 1 ? "bg-[#c37d0d]/10 text-[#c37d0d]" :
                        "bg-[#d45656]/10 text-[#d45656]"
                      )}>
                        {user.status === 0 ? 'ACTIVE' : user.status === 1 ? 'INACTIVE' : 'BANNED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-mint-steel text-[14px]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedUserId(user.id)}
                        className="bg-transparent text-mint-ink font-medium hover:bg-mint-surface px-[12px] py-[8px] rounded-[8px] transition-colors text-[14px] border border-transparent hover:border-mint-hairline"
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
