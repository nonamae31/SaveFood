import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Users, UserPlus, Trash2, Loader2, Mail, Crown, Shield, UserX, Search
} from 'lucide-react';
import { storeStaffApi, type StoreStaffDTO } from '@/api/store.staff.api';
import { Virtuoso } from 'react-virtuoso';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RoleBadge({ role, label }: { role: number; label: string }) {
  if (role === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Crown size={11} />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
      <Shield size={11} />
      {label}
    </span>
  );
}

function StaffCard({
  member,
  currentUserId,
  onRemove,
  isRemoving,
}: {
  member: StoreStaffDTO;
  currentUserId: string;
  onRemove: (userId: string, name: string) => void;
  isRemoving: boolean;
}) {
  const isOwner = member.staffRole === 0;
  const isSelf = member.userId === currentUserId;

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
      {/* Avatar */}
      <div className="relative shrink-0">
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={member.fullName}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
          />
        ) : (
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow ${
            isOwner ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {getInitials(member.fullName)}
          </div>
        )}
        {isOwner && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
            <Crown size={9} className="text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 truncate">{member.fullName}</p>
          {isSelf && (
            <span className="text-xs text-gray-400 font-normal">(bạn)</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
          <Mail size={11} />
          {member.email}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Tham gia: {formatDate(member.joinedAt)}
        </p>
      </div>

      {/* Role badge */}
      <div className="shrink-0">
        <RoleBadge role={member.staffRole} label={member.staffRoleLabel} />
      </div>

      {/* Remove button — chỉ hiển thị cho Staff (không phải Owner, không phải chính mình) */}
      {!isOwner && !isSelf && (
        <button
          id={`remove-staff-${member.userId}`}
          onClick={() => onRemove(member.userId, member.fullName)}
          disabled={isRemoving}
          className="ml-2 shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Xóa ${member.fullName}`}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

// ── Add Staff Modal ────────────────────────────────────────────────────────────

function AddStaffModal({
  onAdd,
  onClose,
  isAdding,
}: {
  onAdd: (email: string) => Promise<void>;
  onClose: () => void;
  isAdding: boolean;
}) {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-[--animate-fade-in]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <UserPlus size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Thêm nhân viên mới</h3>
            <p className="text-xs text-gray-500 mt-0.5">Nhập email tài khoản SaveFood của nhân viên</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="staff-email-input">
              Địa chỉ Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="staff-email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vd: nhanvien@example.com"
                required
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Nhân viên phải có tài khoản SaveFood trước. Sau khi thêm, họ có thể đăng nhập để tạo đợt giảm giá và nhận hàng.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              id="submit-add-staff-btn"
              type="submit"
              disabled={isAdding || !email.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAdding ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
              {isAdding ? 'Đang thêm...' : 'Thêm nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Confirm Remove Modal ──────────────────────────────────────────────────────

function ConfirmRemoveModal({
  staffName,
  onConfirm,
  onClose,
  isRemoving,
}: {
  staffName: string;
  onConfirm: () => void;
  onClose: () => void;
  isRemoving: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <UserX size={20} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Xác nhận xóa nhân viên</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Bạn có chắc muốn xóa <span className="font-semibold text-gray-900">{staffName}</span> khỏi cửa hàng? Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            id="confirm-remove-staff-btn"
            onClick={onConfirm}
            disabled={isRemoving}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isRemoving ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {isRemoving ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardStaffPage() {
  const { user } = useAuthContext();
  const storeId = user?.storeId ?? '';
  const currentUserId = user?.id ?? '';

  const [staffList, setStaffList] = useState<StoreStaffDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // ── Fetch staff list ──────────────────────────────────────────────────────────
  const fetchStaff = useCallback(async () => {
    if (!storeId) return;
    setIsLoading(true);
    try {
      const data = await storeStaffApi.getStoreStaff(storeId);
      setStaffList(data);
    } catch {
      toast.error('Không thể tải danh sách nhân viên.');
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // ── Add staff ─────────────────────────────────────────────────────────────────
  const handleAddStaff = async (email: string) => {
    if (!storeId) return;
    setIsAdding(true);
    try {
      const newMember = await storeStaffApi.addStoreStaff(storeId, { email });
      setStaffList(prev => [...prev, newMember]);
      setShowAddModal(false);
      toast.success(`Đã thêm ${newMember.fullName} vào cửa hàng!`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm nhân viên.';
      toast.error(msg);
    } finally {
      setIsAdding(false);
    }
  };

  // ── Remove staff ──────────────────────────────────────────────────────────────
  const handleConfirmRemove = async () => {
    if (!storeId || !removeTarget) return;
    setIsRemoving(true);
    try {
      await storeStaffApi.removeStoreStaff(storeId, removeTarget.userId);
      setStaffList(prev => prev.filter(s => s.userId !== removeTarget.userId));
      toast.success(`Đã xóa ${removeTarget.name} khỏi cửa hàng.`);
      setRemoveTarget(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa nhân viên.';
      toast.error(msg);
    } finally {
      setIsRemoving(false);
    }
  };

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filteredStaff = searchQuery.trim()
    ? staffList.filter(s =>
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : staffList;

  const ownerCount = staffList.filter(s => s.staffRole === 0).length;
  const staffCount = staffList.filter(s => s.staffRole === 2).length;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhân viên</h1>
          <p className="text-sm text-gray-500 mt-1">
            Thêm và quản lý các thành viên trong cửa hàng của bạn.
          </p>
        </div>
        <button
          id="add-staff-btn"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors shadow-sm shrink-0"
        >
          <UserPlus size={16} />
          Thêm nhân viên
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{staffList.length}</p>
              <p className="text-xs text-gray-500">Tổng nhân sự</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Crown size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{ownerCount}</p>
              <p className="text-xs text-gray-500">Chủ cửa hàng</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Shield size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{staffCount}</p>
              <p className="text-xs text-gray-500">Nhân viên</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff list card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-500" />
            <h2 className="text-base font-bold text-gray-900">Danh sách nhân viên</h2>
          </div>
          {/* Search */}
          <div className="relative sm:ml-auto w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="staff-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="animate-spin w-6 h-6 mr-2" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-medium text-gray-500">
              {searchQuery ? 'Không tìm thấy nhân viên nào.' : 'Chưa có nhân viên nào.'}
            </p>
            {!searchQuery && (
              <p className="text-xs text-gray-400 mt-1">Nhấn "Thêm nhân viên" để bắt đầu.</p>
            )}
          </div>
        ) : (
          <div className="p-4">
            <Virtuoso
              style={{ height: 'min(60vh, 480px)' }}
              data={filteredStaff}
              itemContent={(_, member) => (
                <div className="pb-3 last:pb-0">
                  <StaffCard
                    member={member}
                    currentUserId={currentUserId}
                    onRemove={(userId, name) => setRemoveTarget({ userId, name })}
                    isRemoving={isRemoving && removeTarget?.userId === member.userId}
                  />
                </div>
              )}
            />
          </div>
        )}
      </div>

      {/* Permissions info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Shield size={15} />
          Phân quyền nhân viên
        </h3>
        <ul className="text-xs text-blue-700 space-y-1.5">
          <li className="flex items-start gap-2">
            <Crown size={11} className="mt-0.5 shrink-0 text-amber-500" />
            <span><strong>Owner (Chủ cửa hàng):</strong> Toàn quyền quản lý: sản phẩm, đợt giảm giá, đơn hàng, nhân viên, cài đặt và thanh toán.</span>
          </li>
          <li className="flex items-start gap-2">
            <Shield size={11} className="mt-0.5 shrink-0 text-blue-500" />
            <span><strong>Staff (Nhân viên):</strong> Chỉ có thể tạo đợt giảm giá, xem đơn hàng và thực hiện nhận hàng tại quầy.</span>
          </li>
        </ul>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddStaffModal
          onAdd={handleAddStaff}
          onClose={() => setShowAddModal(false)}
          isAdding={isAdding}
        />
      )}

      {removeTarget && (
        <ConfirmRemoveModal
          staffName={removeTarget.name}
          onConfirm={handleConfirmRemove}
          onClose={() => setRemoveTarget(null)}
          isRemoving={isRemoving}
        />
      )}
    </div>
  );
}
