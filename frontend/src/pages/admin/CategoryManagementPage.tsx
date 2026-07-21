import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, Plus, X, Pencil, Trash2, RotateCcw, Search, Tag } from 'lucide-react';
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useRestoreCategory } from '@/api/category.api';
import type { Category } from '@/types/category.types';

// ─── Category Modal (Create / Edit) ──────────────────────────────────────────

function CategoryModal({
  category,
  onClose,
}: {
  category: Category | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [error, setError] = useState('');

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = name.trim();
    if (!trimmed) { setError('Tên danh mục không được để trống.'); return; }

    try {
      if (category) {
        await updateMutation.mutateAsync({ id: category.id, data: { name: trimmed } });
      } else {
        await createMutation.mutateAsync({ name: trimmed });
      }
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 bg-mint-primary/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-inter">
      <div className="bg-mint-canvas rounded-[12px] shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12)] border border-mint-hairline w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-mint-hairline-soft">
          <h2 className="text-[20px] font-semibold text-mint-ink flex items-center gap-2">
            <Tag className="w-5 h-5 text-mint-steel" />
            {category ? 'Sửa Danh mục' : 'Thêm Danh mục mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-mint-surface rounded-full transition-colors text-mint-stone hover:text-mint-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-mint-stone font-medium text-[14px] mb-1.5">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="Ví dụ: Rau củ quả, Bánh mì & Bánh ngọt..."
              maxLength={100}
              autoFocus
              className="w-full px-4 py-2.5 bg-mint-surface border border-mint-hairline text-mint-ink rounded-[8px] focus:outline-none focus:border-mint-brand-green focus:border-2 text-[14px] transition-all placeholder:text-mint-stone/60"
            />
            <div className="flex justify-between mt-1">
              {error ? (
                <p className="text-[12px] text-red-500">{error}</p>
              ) : <span />}
              <span className="text-[11px] text-mint-stone ml-auto">{name.length}/100</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-[8px] text-[14px] font-medium text-mint-ink hover:bg-mint-surface border border-mint-hairline transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-[8px] text-[14px] font-medium text-mint-primary bg-mint-brand-green hover:bg-mint-brand-green-deep transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-mint-primary border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
              ) : (category ? 'Lưu thay đổi' : 'Tạo danh mục')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  category,
  onConfirm,
  onClose,
  isPending,
}: {
  category: Category;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-mint-primary/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-inter">
      <div className="bg-mint-canvas rounded-[12px] shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12)] border border-mint-hairline w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-[17px] font-semibold text-mint-ink">Xóa danh mục?</h3>
        </div>
        <p className="text-[14px] text-mint-steel mb-1">
          Bạn muốn xóa danh mục <span className="font-semibold text-mint-ink">"{category.name}"</span>.
        </p>
        <p className="text-[13px] text-mint-stone mb-6">
          Danh mục sẽ bị ẩn khỏi hệ thống. Các sản phẩm thuộc danh mục này vẫn không bị ảnh hưởng. Bạn có thể khôi phục lại sau.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-mint-ink hover:bg-mint-surface rounded-[8px] border border-mint-hairline transition-colors">
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-[14px] font-medium text-white bg-red-500 hover:bg-red-600 rounded-[8px] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; category: Category }
  | { type: 'delete'; category: Category };

export default function CategoryManagementPage() {
  const { data: categories = [], isLoading } = useAdminCategories();
  const deleteMutation = useDeleteCategory();
  const restoreMutation = useRestoreCategory();

  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlightId');
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filtered = categories.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedCategories = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page when search changes
  useEffect(() => {
    if (!highlightId) setPage(1);
  }, [search]);

  // Handle Highlight ID Scroll & Pagination
  useEffect(() => {
    if (highlightId && categories.length > 0) {
      const index = filtered.findIndex(c => c.id.toString() === highlightId);
      if (index !== -1) {
        const targetPage = Math.floor(index / ITEMS_PER_PAGE) + 1;
        setPage(targetPage);
        
        setTimeout(() => {
          rowRefs.current[highlightId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          searchParams.delete('highlightId');
          setSearchParams(searchParams, { replace: true });
        }, 300);
      } else {
        searchParams.delete('highlightId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [highlightId, categories.length, filtered.length]);

  const activeCount = categories.filter(c => !c.isDeleted).length;
  const deletedCount = categories.filter(c => c.isDeleted).length;

  const handleDelete = async () => {
    if (modalState.type !== 'delete') return;
    await deleteMutation.mutateAsync(modalState.category.id);
    setModalState({ type: 'none' });
  };

  const handleRestore = async (id: string) => {
    await restoreMutation.mutateAsync(id);
  };

  return (
    <div className="p-8 max-w-[1280px] mx-auto font-inter bg-mint-surface-soft min-h-[calc(100vh-64px)] rounded-tl-[16px] border-t border-l border-mint-hairline shadow-sm">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[36px] font-semibold text-mint-ink tracking-[-0.5px] flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-mint-ink" />
            Quản lý Danh mục
          </h1>
          <p className="text-[16px] text-mint-steel mt-2">
            Quản lý các danh mục thực phẩm trên nền tảng.
          </p>
        </div>
        <button
          id="btn-add-category"
          onClick={() => setModalState({ type: 'create' })}
          className="bg-mint-ink hover:bg-black text-mint-canvas px-5 py-2.5 rounded-[8px] font-medium text-[14px] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm danh mục
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-mint-canvas rounded-[12px] border border-mint-hairline p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#7cebcb]/20 flex items-center justify-center">
            <Tag className="w-5 h-5 text-[#1ba673]" />
          </div>
          <div>
            <p className="text-[24px] font-bold text-mint-ink">{activeCount}</p>
            <p className="text-[13px] text-mint-steel">Danh mục đang hoạt động</p>
          </div>
        </div>
        <div className="bg-mint-canvas rounded-[12px] border border-mint-hairline p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-[24px] font-bold text-mint-ink">{deletedCount}</p>
            <p className="text-[13px] text-mint-steel">Đã xóa (có thể khôi phục)</p>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mint-stone" />
          <input
            id="input-search-category"
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-mint-canvas border border-mint-hairline rounded-[8px] text-[14px] text-mint-ink placeholder:text-mint-stone/60 focus:outline-none focus:border-mint-brand-green transition-all"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-mint-canvas rounded-[12px] border border-mint-hairline shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="text-mint-steel border-b border-mint-hairline bg-mint-surface/50">
              <tr>
                <th className="px-6 py-4 font-medium">Tên danh mục</th>
                <th className="px-6 py-4 font-medium">Số sản phẩm</th>
                <th className="px-6 py-4 font-medium">Ngày tạo</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-mint-steel">
                    <div className="inline-block w-6 h-6 border-[2px] border-mint-brand-green border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-mint-steel">
                      <LayoutGrid className="w-10 h-10 opacity-30" />
                      <p className="text-[14px]">
                        {search ? `Không tìm thấy danh mục khớp với "${search}"` : 'Chưa có danh mục nào.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCategories.map(cat => (
                  <tr
                    key={cat.id}
                    ref={(el) => { rowRefs.current[cat.id] = el; }}
                    className={`border-b border-mint-hairline-soft last:border-0 transition-colors duration-500 ${highlightId === cat.id.toString() ? 'bg-yellow-100' : cat.isDeleted ? 'opacity-60 bg-red-50/30' : 'hover:bg-mint-surface'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${cat.isDeleted ? 'bg-red-400' : 'bg-[#1ba673]'}`} />
                        <span className={`font-medium text-[15px] ${cat.isDeleted ? 'line-through text-mint-stone' : 'text-mint-ink'}`}>
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-mint-steel">
                      {cat.productCount > 0 ? (
                        <span className="bg-indigo-50 text-indigo-700 text-[12px] font-semibold px-2 py-0.5 rounded-[6px]">
                          {cat.productCount} sản phẩm
                        </span>
                      ) : (
                        <span className="text-mint-stone text-[13px]">Chưa có</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-mint-steel text-[13px]">
                      {new Date(cat.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {cat.isDeleted ? (
                        <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-semibold tracking-[0.5px] uppercase bg-red-100 text-red-600">
                          Đã xóa
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-semibold tracking-[0.5px] uppercase bg-[#7cebcb]/20 text-[#1ba673]">
                          Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {cat.isDeleted ? (
                          <button
                            onClick={() => handleRestore(cat.id)}
                            disabled={restoreMutation.isPending}
                            title="Khôi phục"
                            className="p-2 text-mint-stone hover:text-[#1ba673] hover:bg-[#7cebcb]/10 rounded-[8px] transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setModalState({ type: 'edit', category: cat })}
                              title="Sửa"
                              className="p-2 text-mint-stone hover:text-mint-ink hover:bg-mint-surface rounded-[8px] transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setModalState({ type: 'delete', category: cat })}
                              title="Xóa"
                              className="p-2 text-mint-stone hover:text-red-500 hover:bg-red-50 rounded-[8px] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!isLoading && totalPages > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-mint-hairline-soft bg-mint-surface/50">
            <span className="text-[13px] text-mint-stone">
              Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1} đến {Math.min(page * ITEMS_PER_PAGE, filtered.length)} trên tổng số {filtered.length} danh mục
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded-[6px] hover:bg-mint-canvas border border-transparent hover:border-mint-hairline text-mint-stone hover:text-mint-ink disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-[6px] text-[13px] font-medium transition-colors flex items-center justify-center ${
                      page === p ? "bg-mint-canvas border border-mint-hairline text-mint-ink shadow-sm" : "text-mint-stone hover:bg-mint-surface hover:text-mint-ink border border-transparent"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded-[6px] hover:bg-mint-canvas border border-transparent hover:border-mint-hairline text-mint-stone hover:text-mint-ink disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {(modalState.type === 'create') && (
        <CategoryModal
          category={null}
          onClose={() => setModalState({ type: 'none' })}
        />
      )}
      {(modalState.type === 'edit') && (
        <CategoryModal
          category={modalState.category}
          onClose={() => setModalState({ type: 'none' })}
        />
      )}
      {(modalState.type === 'delete') && (
        <ConfirmDialog
          category={modalState.category}
          onConfirm={handleDelete}
          onClose={() => setModalState({ type: 'none' })}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
