import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Tag } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { 
  useStoreListings, 
  useCreateStoreListing, 
  useUpdateStoreListing, 
  useDeleteStoreListing,
  useUploadStoreListingImages,
  useDeleteStoreListingImage,
  useToggleStoreListingVisibility
} from '@/hooks/useStoreListings'
import { useStoreProducts } from '@/hooks/useStoreProducts'
import { ListingModal } from '@/components/dashboard/ListingModal'
import type { ListingResponseDTO, CreateListingDTO, UpdateListingDTO } from '@/types/store.types'

export default function DashboardListingsPage() {
  const { user } = useAuthContext()
  const storeId = user?.storeId ?? undefined
  const queryClient = useQueryClient()

  const { data: listings, isLoading: isLoadingListings } = useStoreListings(storeId)
  const { data: products, isLoading: isLoadingProducts } = useStoreProducts(storeId)

  const createMutation = useCreateStoreListing()
  const updateMutation = useUpdateStoreListing()
  const deleteMutation = useDeleteStoreListing()
  const uploadImageMutation = useUploadStoreListingImages()
  const deleteImageMutation = useDeleteStoreListingImage()
  const toggleVisibilityMutation = useToggleStoreListingVisibility()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingListing, setEditingListing] = useState<ListingResponseDTO | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, listingId: string | null, message: React.ReactNode, isLoading: boolean }>({ isOpen: false, listingId: null, message: '', isLoading: false })

  if (!storeId) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin cửa hàng</h2>
        <p className="text-gray-500">Tài khoản của bạn chưa được liên kết với cửa hàng nào.</p>
      </div>
    )
  }

  const handleCreate = () => {
    setEditingListing(null)
    setIsModalOpen(true)
  }

  const handleEdit = (listing: ListingResponseDTO) => {
    setEditingListing(listing)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (listingId: string) => {
    setConfirmModal({
      isOpen: true,
      listingId,
      message: 'Bạn có chắc chắn muốn xóa tin đăng này? Thao tác này sẽ gỡ sản phẩm khỏi hệ thống.',
      isLoading: false
    })
  }

  const handleConfirmDelete = async () => {
    if (!storeId || !confirmModal.listingId) return
    
    setConfirmModal(prev => ({ ...prev, isLoading: true }))
    try {
      await deleteMutation.mutateAsync({ storeId, listingId: confirmModal.listingId })
      setConfirmModal({ isOpen: false, listingId: null, message: '', isLoading: false })
    } catch (error: any) {
      // Handle 409 Conflict with active orders
      if (error?.status === 409 && error?.details?.blockingOrderCodes) {
        const orderCodes = error.details.blockingOrderCodes.join(', ')
        setConfirmModal({
          isOpen: true,
          listingId: null, // Reset so they can only close the modal
          message: (
            <div className="text-red-600">
              <p className="font-semibold mb-2">Không thể xóa sản phẩm do đang có đơn hàng xử lý.</p>
              <p>Mã đơn hàng đang vướng: <strong>{orderCodes}</strong></p>
              <p className="mt-2 text-sm text-gray-500">Vui lòng hoàn thành hoặc hủy các đơn hàng này trước khi xóa.</p>
            </div>
          ),
          isLoading: false
        })
      } else {
        alert(error?.details?.message || error?.message || 'Có lỗi xảy ra khi xóa tin đăng')
        setConfirmModal({ isOpen: false, listingId: null, message: '', isLoading: false })
      }
    }
  }

  const handleToggleVisibility = async (listingId: string) => {
    if (!storeId) return
    try {
      await toggleVisibilityMutation.mutateAsync({ storeId, listingId })
    } catch (error) {
      alert('Không thể thay đổi trạng thái tin đăng.')
    }
  }

  const handleSubmit = async (payload: CreateListingDTO | UpdateListingDTO, newImages: File[], deletedImageIds: string[]) => {
    try {
      let currentListingId = editingListing?.id

      if (editingListing) {
        await updateMutation.mutateAsync({ storeId, listingId: editingListing.id, payload: payload as UpdateListingDTO })
      } else {
        const result = await createMutation.mutateAsync({ storeId, payload: payload as CreateListingDTO })
        currentListingId = result.id
      }

      // Delete removed images
      if (deletedImageIds.length > 0 && currentListingId) {
        for (const imgId of deletedImageIds) {
          await deleteImageMutation.mutateAsync({ storeId, listingId: currentListingId, imageId: imgId })
        }
      }

      // Upload new images
      if (newImages.length > 0 && currentListingId) {
        const formData = new FormData()
        newImages.forEach(file => formData.append('images', file))
        await uploadImageMutation.mutateAsync({ storeId, listingId: currentListingId, formData })
      }

      setIsModalOpen(false)
    } catch (error: unknown) {
      console.error('Failed to save listing', error)
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu tin đăng'
      alert(msg)
    }
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Nháp</span>
      case 1: return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Đang bán</span>
      case 2: return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Đã bán hết</span>
      case 3: return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Hết hạn</span>
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Unknown</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đợt Giảm Giá (Listings)</h1>
          <p className="text-sm text-gray-500 mt-1">Các tin đăng xả hàng cận date đang hoạt động.</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={!products || products.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title={(!products || products.length === 0) ? "Cần tạo sản phẩm gốc trước" : ""}
        >
          <Plus className="w-5 h-5" />
          Tạo tin đăng
        </button>
      </div>

      {(isLoadingListings || isLoadingProducts) ? (
        <div className="py-12 text-center text-gray-500">Đang tải dữ liệu...</div>
      ) : listings?.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có tin đăng nào</h3>
          <p className="text-gray-500 mb-6">Tạo tin đăng xả hàng để bắt đầu bán sản phẩm cận date.</p>
          <button
            onClick={handleCreate}
            disabled={!products || products.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
          >
            <Plus className="w-5 h-5" /> {(!products || products.length === 0) ? "Vui lòng tạo sản phẩm trước" : "Tạo tin đăng ngay"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Tiêu đề / Hết hạn lúc</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Giá bán</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Số lượng</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Đang bán</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings?.map((listing) => {
                  // Backend returns dates without 'Z', must append it to force UTC interpretation
                  const rawExpiry = listing.expiryDate
                  const normalized = rawExpiry.endsWith('Z') || rawExpiry.includes('+') ? rawExpiry : rawExpiry + 'Z'
                  const expiryDate = new Date(normalized)
                  const isExpired = expiryDate < new Date()

                  return (
                    <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{listing.title}</div>
                        <div className={`text-xs mt-1 ${isExpired ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                          Hết hạn: {expiryDate.toLocaleString('vi-VN')}
                        </div>
                        {listing.discountRules.length > 0 && (
                          <div className="mt-1 flex gap-1">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                              {listing.discountRules.length} luật giảm giá
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600">
                        {listing.salePrice.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {listing.quantityAvailable}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(listing.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer justify-center" title="Bật/Tắt (Draft <-> Published)">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={listing.status === 1} // 1 = Published
                            onChange={() => handleToggleVisibility(listing.id)}
                            disabled={listing.status === 2 || listing.status === 3}
                          />
                          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 ${(listing.status === 2 || listing.status === 3) ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                        </label>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(listing)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(listing.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ListingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingListing}
        products={products || []}
        isLoading={createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending || deleteImageMutation.isPending}
      />

      {/* ── CUSTOM CONFIRM MODAL ────────────────────────────────────────────── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm transform transition-all">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmModal.listingId ? 'Xác nhận xóa' : 'Lỗi xóa sản phẩm'}
            </h3>
            <div className="text-sm text-gray-600 mb-6">{confirmModal.message}</div>
            
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setConfirmModal({ isOpen: false, listingId: null, message: '', isLoading: false })}
                disabled={confirmModal.isLoading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {confirmModal.listingId ? 'Hủy' : 'Đóng'}
              </button>
              {confirmModal.listingId && (
                <button
                  onClick={handleConfirmDelete}
                  disabled={confirmModal.isLoading}
                  className="flex-1 px-4 py-2 font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {confirmModal.isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : 'Đồng ý xóa'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
