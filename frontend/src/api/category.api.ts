import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants'
import type { Category, CategoryRequest } from '@/types/category.types'

// ─── API functions ────────────────────────────────────────────────────────────

/** Lấy danh sách danh mục đang Active (dành cho Khách và Cửa hàng) */
const fetchCategories = (): Promise<Category[]> =>
  apiClient<Category[]>(API_ENDPOINTS.CATEGORIES)

/** [Admin] Lấy tất cả danh mục kể cả đã xóa mềm */
const fetchCategoriesForAdmin = (): Promise<Category[]> =>
  apiClient<Category[]>(API_ENDPOINTS.CATEGORIES_ADMIN_ALL)

/** [Admin] Tạo mới danh mục */
const createCategory = (data: CategoryRequest): Promise<Category> =>
  apiClient<Category>(API_ENDPOINTS.CATEGORIES, {
    method: 'POST',
    body: JSON.stringify(data),
  })

/** [Admin] Cập nhật tên danh mục */
const updateCategory = ({ id, data }: { id: string; data: CategoryRequest }): Promise<Category> =>
  apiClient<Category>(API_ENDPOINTS.CATEGORY(id), {
    method: 'PUT',
    body: JSON.stringify(data),
  })

/** [Admin] Xóa mềm danh mục */
const deleteCategory = (id: string): Promise<{ message: string }> =>
  apiClient<{ message: string }>(API_ENDPOINTS.CATEGORY(id), {
    method: 'DELETE',
  })

/** [Admin] Khôi phục danh mục đã xóa mềm */
const restoreCategory = (id: string): Promise<{ message: string }> =>
  apiClient<{ message: string }>(API_ENDPOINTS.CATEGORY_RESTORE(id), {
    method: 'PATCH',
  })

// ─── React Query Hooks ────────────────────────────────────────────────────────

/** Hook: Lấy danh mục Active (cho Khách / Cửa hàng) */
export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories.all(),
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 phút
  })
}

/** Hook: [Admin] Lấy toàn bộ danh mục kể cả đã xóa mềm */
export function useAdminCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories.adminAll(),
    queryFn: fetchCategoriesForAdmin,
    staleTime: 30 * 1000, // 30 giây
  })
}

/** Hook: [Admin] Tạo mới danh mục */
export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories.adminAll() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories.all() })
    },
  })
}

/** Hook: [Admin] Cập nhật tên danh mục */
export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories.adminAll() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories.all() })
    },
  })
}

/** Hook: [Admin] Xóa mềm danh mục */
export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories.adminAll() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories.all() })
    },
  })
}

/** Hook: [Admin] Khôi phục danh mục đã xóa mềm */
export function useRestoreCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: restoreCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories.adminAll() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories.all() })
    },
  })
}
