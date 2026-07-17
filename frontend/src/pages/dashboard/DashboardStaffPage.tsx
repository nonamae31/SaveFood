import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Users, UserPlus, Trash2, Loader2, Mail, Crown, Shield, Search, CheckCheck
} from 'lucide-react';
import { storeStaffApi, type StoreStaffDTO } from '@/api/store.staff.api';
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

const ROLE_OPTIONS = [
  { value: 0, label: 'Owner', disabled: true },
  { value: 1, label: 'Manager' },
  { value: 2, label: 'Staff' },
];

function getRoleLabel(role: number) {
  return ROLE_OPTIONS.find(r => r.value === role)?.label ?? 'Staff';
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

// ── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  message,
  confirmLabel,
  isProcessing,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  isProcessing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-[--animate-fade-in]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {isProcessing ? 'Đang xóa...' : (confirmLabel || 'Xác nhận xóa')}
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

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    isProcessing?: boolean;
  } | null>(null);

  // Processing state
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

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

  // ── Selection ─────────────────────────────────────────────────────────────────
  const toggleSelect = (userId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableStaff.map(s => s.userId)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Inline role change ─────────────────────────────────────────────────────────
  const handleRoleChange = async (targetUserId: string, newRole: number) => {
    setProcessingIds(prev => new Set(prev).add(targetUserId));
    try {
      await storeStaffApi.batchUpdateRole(storeId, { userIds: [targetUserId], newRole });
      setStaffList(prev => prev.map(s =>
        s.userId === targetUserId ? { ...s, staffRole: newRole, staffRoleLabel: getRoleLabel(newRole) } : s
      ));
      toast.success('Đã cập nhật vai trò.');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra.';
      toast.error(msg);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  // ── Delete single staff ────────────────────────────────────────────────────────
  const handleRemove = (targetUserId: string, name: string) => {
    setConfirmModal({
      title: 'Xóa nhân viên',
      message: `Bạn có chắc muốn xóa ${name} khỏi cửa hàng? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setProcessingIds(prev => new Set(prev).add(targetUserId));
        try {
          await storeStaffApi.removeStoreStaff(storeId, targetUserId);
          setStaffList(prev => prev.filter(s => s.userId !== targetUserId));
          setSelectedIds(prev => { const n = new Set(prev); n.delete(targetUserId); return n; });
          toast.success(`Đã xóa ${name}.`);
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra.';
          toast.error(msg);
        } finally {
          setProcessingIds(prev => {
            const next = new Set(prev);
            next.delete(targetUserId);
            return next;
          });
        }
      },
    });
  };

  // ── Batch operations ───────────────────────────────────────────────────────────
  const handleBatchRoleChange = async (newRole: number) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setIsBatchProcessing(true);
    try {
      await storeStaffApi.batchUpdateRole(storeId, { userIds: ids, newRole });
      setStaffList(prev => prev.map(s =>
        ids.includes(s.userId) && s.staffRole !== 0
          ? { ...s, staffRole: newRole, staffRoleLabel: getRoleLabel(newRole) }
          : s
      ));
      toast.success(`Đã cập nhật vai trò cho ${ids.length} nhân viên.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra.';
      toast.error(msg);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchRemove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setConfirmModal({
      title: 'Xóa nhân viên hàng loạt',
      message: `Bạn có chắc muốn xóa ${ids.length} nhân viên đã chọn? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setIsBatchProcessing(true);
        try {
          await storeStaffApi.batchRemoveStaff(storeId, { userIds: ids });
          setStaffList(prev => prev.filter(s => !ids.includes(s.userId)));
          clearSelection();
          toast.success(`Đã xóa ${ids.length} nhân viên.`);
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra.';
          toast.error(msg);
        } finally {
          setIsBatchProcessing(false);
        }
      },
    });
  };

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

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filteredStaff = searchQuery.trim()
    ? staffList.filter(s =>
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : staffList;

  const selectableStaff = filteredStaff.filter(s => s.staffRole !== 0);
  const ownerCount = staffList.filter(s => s.staffRole === 0).length;
  const staffCount = staffList.filter(s => s.staffRole === 2).length;
  const allSelected = selectableStaff.length > 0 && selectedIds.size === selectableStaff.length;

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
        {/* Header + Search */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-500" />
            <h2 className="text-base font-bold text-gray-900">Danh sách nhân viên</h2>
          </div>
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

        {/* Bulk action toolbar */}
        {selectedIds.size > 0 && (
          <div className="px-6 py-3 bg-green-50 border-b border-green-100 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-green-800 flex items-center gap-1.5">
              <CheckCheck size={15} />
              Đã chọn: {selectedIds.size}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <select
                id="batch-role-select"
                disabled={isBatchProcessing}
                defaultValue=""
                onChange={e => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) handleBatchRoleChange(val);
                  e.target.value = '';
                }}
                className="text-xs px-3 py-1.5 min-w-[120px] border border-green-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 disabled:opacity-50"
              >
                <option value="" disabled>Đổi vai trò</option>
                <option value={1}>Manager</option>
                <option value={2}>Staff</option>
              </select>
              <button
                id="batch-remove-btn"
                onClick={handleBatchRemove}
                disabled={isBatchProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {isBatchProcessing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Xóa đã chọn
              </button>
              <button
                onClick={clearSelection}
                disabled={isBatchProcessing}
                className="text-xs text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
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
          <>
            {/* ── Desktop table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500/30 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Thành viên
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">
                      Vai trò
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                      Tham gia
                    </th>
                    <th className="w-12 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStaff.map(member => {
                    const isOwner = member.staffRole === 0;
                    const isSelf = member.userId === currentUserId;
                    const isPending = processingIds.has(member.userId);

                    return (
                      <tr
                        key={member.userId}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          selectedIds.has(member.userId) ? 'bg-green-50/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(member.userId)}
                            onChange={() => toggleSelect(member.userId)}
                            disabled={isOwner}
                            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500/30 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                        </td>

                        {/* Avatar + Name + Email */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {member.avatarUrl ? (
                                <img
                                  src={member.avatarUrl}
                                  alt={member.fullName}
                                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow"
                                />
                              ) : (
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow ${
                                  isOwner ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {getInitials(member.fullName)}
                                </div>
                              )}
                              {isOwner && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center border border-white">
                                  <Crown size={7} className="text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-gray-900 truncate">{member.fullName}</span>
                                {isSelf && (
                                  <span className="text-xs text-gray-400 font-normal shrink-0">(bạn)</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{member.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role (inline select) */}
                        <td className="px-3 py-3">
                          {isOwner ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Crown size={11} />
                              Owner
                            </span>
                          ) : (
                            <select
                              value={member.staffRole}
                              disabled={isPending}
                              onChange={e => handleRoleChange(member.userId, parseInt(e.target.value))}
                              className={`text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 disabled:opacity-50 cursor-pointer ${
                                member.staffRole === 1
                                  ? 'border-purple-200 text-purple-700'
                                  : 'border-blue-200 text-blue-700'
                              }`}
                            >
                              <option value={1}>Manager</option>
                              <option value={2}>Staff</option>
                            </select>
                          )}
                        </td>

                        {/* Joined date */}
                        <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(member.joinedAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          {!isOwner && !isSelf && (
                            <button
                              onClick={() => handleRemove(member.userId, member.fullName)}
                              disabled={isPending}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              title={`Xóa ${member.fullName}`}
                            >
                              {isPending ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="block md:hidden p-4 space-y-3">
              {filteredStaff.map(member => {
                const isOwner = member.staffRole === 0;
                const isSelf = member.userId === currentUserId;
                const isPending = processingIds.has(member.userId);

                return (
                  <div
                    key={member.userId}
                    className={`bg-white rounded-2xl border shadow-sm p-4 transition-colors ${
                      selectedIds.has(member.userId)
                        ? 'border-green-300 ring-1 ring-green-200 bg-green-50/30'
                        : 'border-gray-100'
                    }`}
                  >
                    {/* Row 1: checkbox + avatar + name/email + delete */}
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(member.userId)}
                          onChange={() => toggleSelect(member.userId)}
                          disabled={isOwner}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500/30 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="relative shrink-0">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.fullName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow ${
                            isOwner ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {getInitials(member.fullName)}
                          </div>
                        )}
                        {isOwner && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center border border-white">
                            <Crown size={7} className="text-white" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-900 truncate">{member.fullName}</span>
                          {isSelf && (
                            <span className="text-xs text-gray-400 font-normal shrink-0">(bạn)</span>
                          )}
                          {isOwner && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Crown size={9} />
                              Owner
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{member.email}</p>
                      </div>

                      {!isOwner && !isSelf && (
                        <button
                          onClick={() => handleRemove(member.userId, member.fullName)}
                          disabled={isPending}
                          className="p-1.5 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        >
                          {isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Row 2: role + joined date */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      {isOwner ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Crown size={11} />
                          Owner
                        </span>
                      ) : (
                        <select
                          value={member.staffRole}
                          disabled={isPending}
                          onChange={e => handleRoleChange(member.userId, parseInt(e.target.value))}
                          className={`text-xs px-2 py-1.5 rounded-lg border bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 disabled:opacity-50 cursor-pointer ${
                            member.staffRole === 1
                              ? 'border-purple-200 text-purple-700'
                              : 'border-blue-200 text-blue-700'
                          }`}
                        >
                          <option value={1}>Manager</option>
                          <option value={2}>Staff</option>
                        </select>
                      )}

                      <span className="text-xs text-gray-400">{formatDate(member.joinedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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
            <span><strong>Manager:</strong> Quản lý sản phẩm, đợt giảm giá, xem đơn hàng, nhưng không quản lý được nhân viên.</span>
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

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          isProcessing={isBatchProcessing || processingIds.size > 0}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
