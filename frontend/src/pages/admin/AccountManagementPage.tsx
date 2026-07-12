import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin.api';
import type { AdminUserListDTO, AdminUserDetailsDTO, PaginatedList, GetUsersRequest } from '../../api/admin.api';
import { Shield, AlertCircle, CheckCircle, Search, X, Store, User as UserIcon, ArrowUpDown, ArrowUp, ArrowDown, Filter, ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Select } from '@/components/ui/Select';

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


function RoleFilterSelect({ roleValue, staffRoleValue, onChange }: { roleValue: string, staffRoleValue: string, onChange: (role: string, staffRole: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const getLabel = () => {
    if (roleValue === 'All') return 'Tất cả Vai trò';
    if (roleValue === 'ADMIN') return 'Quản trị viên (Admin)';
    if (roleValue === 'Customer') return 'Khách hàng';
    if (roleValue === 'STORE') {
      if (staffRoleValue === '0') return 'Cửa hàng - Chủ';
      if (staffRoleValue === '1') return 'Cửa hàng - Quản lý';
      if (staffRoleValue === '2') return 'Cửa hàng - Nhân viên';
      return 'Cửa hàng';
    }
    return roleValue;
  }

  return (
    <div className="relative inline-block text-left" onMouseLeave={() => setHoveredOption(null)}>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between min-w-[180px] bg-mint-canvas border border-mint-hairline text-mint-ink text-[14px] rounded-[8px] h-[40px] px-3 focus:outline-none focus:border-mint-brand-green hover:border-mint-steel transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          <Filter className="w-4 h-4 text-mint-stone" />
          {getLabel()}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-mint-stone transition-transform shrink-0", open ? "rotate-180" : "")} />
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
          <div className="absolute z-20 mt-1 w-full min-w-[180px] bg-mint-canvas border border-mint-hairline rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-visible animate-in fade-in slide-in-from-top-1 duration-100">
            <div className="py-1">
              <button
                onClick={() => { onChange('All', 'All'); setOpen(false); }}
                onMouseEnter={() => setHoveredOption('All')}
                className={cn(
                  "w-full text-left px-3 py-2 text-[14px] transition-colors flex items-center justify-between",
                  roleValue === 'All' ? "bg-mint-surface-soft text-mint-ink font-medium" : "text-mint-steel hover:bg-mint-surface hover:text-mint-ink"
                )}
              >
                Tất cả Vai trò
                {roleValue === 'All' && <div className="w-1.5 h-1.5 rounded-full bg-mint-brand-green"></div>}
              </button>

              <button
                onClick={() => { onChange('ADMIN', 'All'); setOpen(false); }}
                onMouseEnter={() => setHoveredOption('ADMIN')}
                className={cn(
                  "w-full text-left px-3 py-2 text-[14px] transition-colors flex items-center justify-between",
                  roleValue === 'ADMIN' ? "bg-mint-surface-soft text-mint-ink font-medium" : "text-mint-steel hover:bg-mint-surface hover:text-mint-ink"
                )}
              >
                Quản trị viên (Admin)
                {roleValue === 'ADMIN' && <div className="w-1.5 h-1.5 rounded-full bg-mint-brand-green"></div>}
              </button>

              <div 
                className="relative"
                onMouseEnter={() => setHoveredOption('STORE')}
              >
                <button
                  onClick={() => { onChange('STORE', 'All'); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[14px] transition-colors flex items-center justify-between",
                    roleValue === 'STORE' ? "bg-mint-surface-soft text-mint-ink font-medium" : "text-mint-steel hover:bg-mint-surface hover:text-mint-ink"
                  )}
                >
                  Cửa hàng
                  <ChevronRight className="w-4 h-4 text-mint-stone" />
                </button>
                
                {hoveredOption === 'STORE' && (
                  <div className="absolute left-[100%] top-[-8px] ml-1 w-full min-w-[160px] bg-mint-canvas border border-mint-hairline rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1">
                    <button
                      onClick={() => { onChange('STORE', 'All'); setOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[14px] transition-colors flex items-center justify-between",
                        roleValue === 'STORE' && staffRoleValue === 'All' ? "bg-mint-surface-soft text-mint-ink font-medium" : "text-mint-steel hover:bg-mint-surface hover:text-mint-ink"
                      )}
                    >
                      Tất cả vai trò cửa hàng
                      {roleValue === 'STORE' && staffRoleValue === 'All' && <div className="w-1.5 h-1.5 rounded-full bg-mint-brand-green"></div>}
                    </button>
                    <button
                      onClick={() => { onChange('STORE', '0'); setOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[14px] transition-colors flex items-center justify-between",
                        roleValue === 'STORE' && staffRoleValue === '0' ? "bg-mint-surface-soft text-mint-ink font-medium" : "text-mint-steel hover:bg-mint-surface hover:text-mint-ink"
                      )}
                    >
                      Chủ cửa hàng
                      {roleValue === 'STORE' && staffRoleValue === '0' && <div className="w-1.5 h-1.5 rounded-full bg-mint-brand-green"></div>}
                    </button>
                    <button
                      onClick={() => { onChange('STORE', '1'); setOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[14px] transition-colors flex items-center justify-between",
                        roleValue === 'STORE' && staffRoleValue === '1' ? "bg-mint-surface-soft text-mint-ink font-medium" : "text-mint-steel hover:bg-mint-surface hover:text-mint-ink"
                      )}
                    >
                      Quản lý
                      {roleValue === 'STORE' && staffRoleValue === '1' && <div className="w-1.5 h-1.5 rounded-full bg-mint-brand-green"></div>}
                    </button>
                    <button
                      onClick={() => { onChange('STORE', '2'); setOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[14px] transition-colors flex items-center justify-between",
                        roleValue === 'STORE' && staffRoleValue === '2' ? "bg-mint-surface-soft text-mint-ink font-medium" : "text-mint-steel hover:bg-mint-surface hover:text-mint-ink"
                      )}
                    >
                      Nhân viên
                      {roleValue === 'STORE' && staffRoleValue === '2' && <div className="w-1.5 h-1.5 rounded-full bg-mint-brand-green"></div>}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => { onChange('Customer', 'All'); setOpen(false); }}
                onMouseEnter={() => setHoveredOption('Customer')}
                className={cn(
                  "w-full text-left px-3 py-2 text-[14px] transition-colors flex items-center justify-between",
                  roleValue === 'Customer' ? "bg-mint-surface-soft text-mint-ink font-medium" : "text-mint-steel hover:bg-mint-surface hover:text-mint-ink"
                )}
              >
                Khách hàng
                {roleValue === 'Customer' && <div className="w-1.5 h-1.5 rounded-full bg-mint-brand-green"></div>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AddUserModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', roleCode: 'Customer' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminApi.addUser(formData);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add user');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-mint-primary/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-inter">
      <div className="bg-mint-canvas rounded-[12px] shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12)] border border-mint-hairline w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-mint-canvas/80 backdrop-blur-md border-b border-mint-hairline-soft px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[18px] font-semibold text-mint-ink">Thêm người dùng mới</h2>
          <button onClick={onClose} className="p-2 hover:bg-mint-surface rounded-full transition-colors text-mint-stone hover:text-mint-ink">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-[#d45656]/10 text-[#d45656] text-[13px] px-3 py-2 rounded-md">{error}</div>}
          
          <div>
            <label className="block text-[13px] font-medium text-mint-ink mb-1">Họ và tên</label>
            <input required type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 bg-mint-canvas border border-mint-hairline rounded-[8px] text-[14px] focus:outline-none focus:border-mint-brand-green focus:border-2"
              placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-mint-ink mb-1">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-mint-canvas border border-mint-hairline rounded-[8px] text-[14px] focus:outline-none focus:border-mint-brand-green focus:border-2"
              placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-mint-ink mb-1">Mật khẩu</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 bg-mint-canvas border border-mint-hairline rounded-[8px] text-[14px] focus:outline-none focus:border-mint-brand-green focus:border-2"
              placeholder="Tối thiểu 6 ký tự" minLength={6} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-mint-ink mb-1">Vai trò</label>
            <Select 
              value={formData.roleCode} 
              onChange={(val) => setFormData({ ...formData, roleCode: val.toString() })}
              options={[
                { label: "Khách hàng", value: "Customer" },
                { label: "Cửa hàng", value: "STORE" },
                { label: "Quản trị viên", value: "ADMIN" }
              ]}
              className="w-full"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-mint-steel hover:text-mint-ink transition-colors">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-[14px] font-medium bg-mint-brand-green hover:bg-mint-brand-green-deep text-mint-primary rounded-[8px] transition-colors disabled:opacity-50">
              {loading ? 'Đang tạo...' : 'Tạo người dùng'}
            </button>
          </div>
        </form>
      </div>
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
          <p className="text-mint-steel font-medium font-inter text-[14px]">Đang tải dữ liệu...</p>
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
            Chi tiết người dùng
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
                    <span className="block text-mint-stone mb-1 font-medium">Số điện thoại</span>
                    <span className="font-geist text-mint-ink bg-mint-surface-soft border border-mint-hairline px-2 py-0.5 rounded-[4px]">{details.phoneNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-mint-stone mb-1 font-medium">Ngày tham gia</span>
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
                  {details.status === 0 ? 'HOẠT ĐỘNG' : details.status === 1 ? 'KHÔNG HOẠT ĐỘNG' : 'BỊ CẤM'}
                </span>
                
                <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                  {details.roles.map(role => (
                    <span key={role.code} className="bg-[rgba(55,114,207,0.15)] text-[#3772cf] px-2 py-0.5 rounded-[6px] text-[13px] font-semibold">
                      {role.name}
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
                Các cửa hàng liên kết
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
                        Trạng thái: {store.storeStatus === 0 ? 'Hoạt động' : store.storeStatus === 3 ? 'Chờ duyệt' : store.storeStatus === 4 ? 'Bị từ chối' : store.storeStatus === 1 ? 'Bị đình chỉ' : 'Đóng cửa'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <section className="pt-6 border-t border-mint-hairline-soft">
            <h3 className="text-[11px] font-semibold text-mint-steel uppercase tracking-[0.5px] mb-4">Vùng nguy hiểm</h3>
            <div className="flex gap-4">
              {details.status !== 2 ? (
                <button 
                  onClick={() => handleUpdateStatus(2)}
                  className="flex-1 bg-transparent hover:bg-[#d45656]/5 text-[#d45656] font-medium py-[10px] px-[20px] rounded-[9999px] transition-colors border border-mint-hairline hover:border-[#d45656] flex items-center justify-center gap-2 text-[14px]"
                >
                  <AlertCircle className="w-4 h-4" />
                  Cấm người dùng
                </button>
              ) : (
                <button 
                  onClick={() => handleUpdateStatus(0)}
                  className="flex-1 bg-mint-brand-green hover:bg-mint-brand-green-deep text-mint-primary font-medium py-[10px] px-[20px] rounded-[9999px] transition-colors flex items-center justify-center gap-2 text-[14px]"
                >
                  <CheckCircle className="w-4 h-4" />
                  Kích hoạt lại
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PaginatedList<AdminUserListDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const highlightRef = useRef<HTMLTableRowElement | null>(null);
  
  // Extract from URL
  const highlightId = searchParams.get('highlightId');
  const search = highlightId ? '' : (searchParams.get('search') || '');
  const [localSearch, setLocalSearch] = useState(search);
  const roleFilter = highlightId ? 'All' : (searchParams.get('roleFilter') || 'All');
  const staffRoleFilter = highlightId ? 'All' : (searchParams.get('staffRoleFilter') || 'All');
  const statusFilter = highlightId ? 'All' : (searchParams.get('statusFilter') || 'All');
  const sortBy = highlightId ? '' : (searchParams.get('sortBy') || '');
  const sortDirection = highlightId ? 'desc' : (searchParams.get('sortDirection') || 'desc');
  const currentPage = parseInt(searchParams.get('pageNumber') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const request: GetUsersRequest = {
          search: search || undefined,
          roleFilter: roleFilter !== 'All' ? roleFilter : undefined,
          staffRoleFilter: roleFilter === 'STORE' && staffRoleFilter !== 'All' ? parseInt(staffRoleFilter, 10) : undefined,
          statusFilter: statusFilter !== 'All' ? statusFilter : undefined,
          sortBy: sortBy || undefined,
          sortDirection: sortBy ? sortDirection : undefined,
          pageNumber: currentPage,
          pageSize: pageSize
        };

        const result = await adminApi.getUsers(request);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [search, roleFilter, staffRoleFilter, statusFilter, sortBy, sortDirection, currentPage, pageSize]);

  useEffect(() => {
    if (data && highlightId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [data, highlightId]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'All' && value !== '') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('highlightId');
    newParams.set('pageNumber', '1');
    setSearchParams(newParams);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearch !== (searchParams.get('search') || '')) {
        updateFilter('search', localSearch);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [localSearch, searchParams]); // searchParams is needed to get the latest value, but it might cause issues? Let's just use the 'search' variable.

  // Re-sync local state if the URL changes externally (e.g., back button)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('pageNumber', page.toString());
    newParams.delete('highlightId');
    setSearchParams(newParams);
  };

  const requestSort = (key: string) => {
    if (key === 'roles') return; // Disabled sorting on roles
    let direction = 'asc';
    if (sortBy === key && sortDirection === 'asc') {
      direction = 'desc';
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortBy', key);
    newParams.set('sortDirection', direction);
    newParams.set('pageNumber', '1');
    newParams.delete('highlightId');
    setSearchParams(newParams);
  };

  const getSortIcon = (key: string) => {
    if (key === 'roles') return null;
    if (sortBy !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline text-mint-stone opacity-50 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-3.5 h-3.5 ml-1 inline text-mint-ink" /> : 
      <ArrowDown className="w-3.5 h-3.5 ml-1 inline text-mint-ink" />;
  };

  const statusOptions = [
    { label: 'Tất cả trạng thái', value: 'All' },
    { label: 'Hoạt động', value: '0' },
    { label: 'Không hoạt động', value: '1' },
    { label: 'Bị cấm', value: '2' }
  ];

  return (
    <div className="p-8 max-w-[1280px] mx-auto font-inter bg-mint-surface-soft min-h-[calc(100vh-64px)] rounded-tl-[16px] border-t border-l border-mint-hairline shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[36px] font-semibold text-mint-ink tracking-[-0.5px] flex items-center gap-3">
            <Shield className="w-8 h-8 text-mint-ink" />
            Quản lý tài khoản
          </h1>
          <p className="text-[16px] text-mint-steel mt-2">Xem và quản lý tất cả người dùng, nhân viên và chủ cửa hàng trên hệ thống.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-mint-brand-green hover:bg-mint-brand-green-deep text-mint-primary font-medium py-[10px] px-[20px] rounded-[8px] transition-colors flex items-center gap-2 text-[14px] shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm người dùng
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-mint-canvas p-4 rounded-[12px] border border-mint-hairline shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mint-steel" />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-mint-canvas border border-mint-hairline text-mint-ink rounded-[8px] focus:outline-none focus:border-mint-brand-green focus:border-2 text-[14px] h-[40px] transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <RoleFilterSelect 
            roleValue={roleFilter}
            staffRoleValue={staffRoleFilter}
            onChange={(newRole, newStaffRole) => {
              const newParams = new URLSearchParams(searchParams);
              if (newRole && newRole !== 'All') {
                newParams.set('roleFilter', newRole);
              } else {
                newParams.delete('roleFilter');
              }
              if (newRole === 'STORE' && newStaffRole !== 'All') {
                newParams.set('staffRoleFilter', newStaffRole);
              } else {
                newParams.delete('staffRoleFilter');
              }
              newParams.set('pageNumber', '1');
              setSearchParams(newParams);
            }}
          />
          <CustomSelect 
            value={statusFilter}
            onChange={(val) => updateFilter('statusFilter', val)}
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
                  Người dùng {getSortIcon('fullName')}
                </th>
                <th className="px-6 py-4 font-medium select-none">
                  Vai trò
                </th>
                <th className="px-6 py-4 font-medium group cursor-pointer hover:text-mint-ink select-none" onClick={() => requestSort('status')}>
                  Trạng thái {getSortIcon('status')}
                </th>
                <th className="px-6 py-4 font-medium group cursor-pointer hover:text-mint-ink select-none" onClick={() => requestSort('createdAt')}>
                  Ngày tham gia {getSortIcon('createdAt')}
                </th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-mint-steel border-b border-mint-hairline-soft">
                    <div className="inline-block w-6 h-6 border-[2px] border-mint-brand-green border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-mint-steel border-b border-mint-hairline-soft text-[14px]">
                    Không tìm thấy người dùng nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                data.items.map(user => (
                  <tr 
                    key={user.id} 
                    ref={user.id.toLowerCase() === highlightId?.toLowerCase() ? highlightRef : null}
                    className={cn(
                      "transition-colors group border-b border-mint-hairline-soft last:border-0",
                      user.id.toLowerCase() === highlightId?.toLowerCase() ? "bg-yellow-100 hover:bg-yellow-200" : "hover:bg-mint-surface"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-mint-ink text-[14px]">{user.fullName}</div>
                      <div className="text-mint-steel text-[13px] mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.roles.length > 0 ? user.roles.map(r => (
                          <span key={r.code} className="bg-[rgba(55,114,207,0.15)] text-[#3772cf] px-2 py-0.5 rounded-[6px] text-[13px] font-semibold">
                            {r.name}
                          </span>
                        )) : <span className="text-mint-stone italic">Không có</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-[6px] text-[11px] font-semibold tracking-[0.5px] uppercase",
                        user.status === 0 ? "bg-[#7cebcb]/20 text-[#1ba673]" :
                        user.status === 1 ? "bg-[#c37d0d]/10 text-[#c37d0d]" :
                        "bg-[#d45656]/10 text-[#d45656]"
                      )}>
                        {user.status === 0 ? 'HOẠT ĐỘNG' : user.status === 1 ? 'KHÔNG H.ĐỘNG' : 'BỊ CẤM'}
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
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {data && data.totalCount > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-mint-hairline-soft bg-mint-surface/50 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-[13px] text-mint-stone">
                Hiển thị {(data.pageNumber - 1) * data.pageSize + 1} đến {Math.min(data.pageNumber * data.pageSize, data.totalCount)} trên tổng số {data.totalCount} người dùng
              </span>
              <div className="flex items-center gap-2 text-[13px] text-mint-stone">
                Hiển thị:
                <select
                  className="bg-mint-canvas border border-mint-hairline text-mint-ink rounded pl-2 pr-8 py-1 text-[13px] cursor-pointer focus:outline-none focus:border-mint-brand-green"
                  value={pageSize}
                  onChange={(e) => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('pageSize', e.target.value);
                    newParams.set('pageNumber', '1');
                    setSearchParams(newParams);
                  }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(data.pageNumber - 1)}
                disabled={!data.hasPreviousPage}
                className="p-1 rounded-[6px] hover:bg-mint-canvas border border-transparent hover:border-mint-hairline text-mint-stone hover:text-mint-ink disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "w-7 h-7 rounded-[6px] text-[13px] font-medium transition-colors flex items-center justify-center",
                      data.pageNumber === page ? "bg-mint-canvas border border-mint-hairline text-mint-ink shadow-sm" : "text-mint-stone hover:bg-mint-surface hover:text-mint-ink border border-transparent"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => handlePageChange(data.pageNumber + 1)}
                disabled={!data.hasNextPage}
                className="p-1 rounded-[6px] hover:bg-mint-canvas border border-transparent hover:border-mint-hairline text-mint-stone hover:text-mint-ink disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedUserId && (
        <UserDetailsModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}

      {showAddModal && (
        <AddUserModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchUsersRef.current();
          }}
        />
      )}
    </div>
  );
}
