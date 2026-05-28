import { useState } from 'react'
import { Plus, Edit2, Trash2, PackageSearch } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useStoreProducts, useCreateStoreProduct, useUpdateStoreProduct, useDeleteStoreProduct, useUploadStoreProductImage, useDeleteStoreProductImage } from '@/hooks/useStoreProducts'
import { ProductModal } from '@/components/dashboard/ProductModal'
import type { ProductResponseDTO, CreateProductDTO, UpdateProductDTO } from '@/types/store.types'

export default function DashboardProductsPage() {
  const { user } = useAuthContext()
  const storeId = user?.storeId ?? undefined

  const { data: products, isLoading } = useStoreProducts(storeId)
  const createMutation = useCreateStoreProduct()
  const updateMutation = useUpdateStoreProduct()
  const deleteMutation = useDeleteStoreProduct()
  const uploadImageMutation = useUploadStoreProductImage()
  const deleteImageMutation = useDeleteStoreProductImage()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductResponseDTO | null>(null)

  if (!storeId) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin cửa hàng</h2>
        <p className="text-gray-500">Tài khoản của bạn chưa được liên kết với cửa hàng nào.</p>
      </div>
    )
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleEdit = (product: ProductResponseDTO) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Các đợt giảm giá liên quan có thể bị ảnh hưởng.')) {
      await deleteMutation.mutateAsync({ storeId, productId })
    }
  }

  const handleSubmit = async (payload: CreateProductDTO | UpdateProductDTO, newImages: File[], removedImageIds: string[]) => {
    try {
      let currentProductId = editingProduct?.id
      
      if (editingProduct) {
        await updateMutation.mutateAsync({ storeId, productId: editingProduct.id, payload: payload as UpdateProductDTO })
      } else {
        const result = await createMutation.mutateAsync({ storeId, payload: payload as CreateProductDTO })
        currentProductId = result.id
      }
      
      // Upload new images
      if (newImages.length > 0 && currentProductId) {
        const formData = new FormData()
        newImages.forEach(file => formData.append('images', file))
        await uploadImageMutation.mutateAsync({ storeId, productId: currentProductId, formData })
      }
      
      // Delete removed images
      if (removedImageIds.length > 0 && currentProductId) {
        for (const imageId of removedImageIds) {
          await deleteImageMutation.mutateAsync({ storeId, productId: currentProductId, imageId })
        }
      }
      
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to save product', error)
      alert('Có lỗi xảy ra khi lưu sản phẩm')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Sản phẩm gốc</h1>
          <p className="text-sm text-gray-500 mt-1">Danh mục các món ăn cơ bản của cửa hàng để tạo đợt giảm giá.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Thêm sản phẩm
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Đang tải dữ liệu...</div>
      ) : products?.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageSearch className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có sản phẩm nào</h3>
          <p className="text-gray-500 mb-6">Hãy thêm sản phẩm gốc đầu tiên để có thể tạo tin đăng giảm giá.</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" /> Thêm sản phẩm ngay
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Tên sản phẩm</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Giá gốc</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Túi bất ngờ</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products?.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{product.description || 'Không có mô tả'}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-green-600">
                      {product.originalPrice.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.isSurpriseBag ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Surprise Bag
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.isHidden ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Đã ẩn
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Hiển thị
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingProduct}
        isLoading={createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending || deleteImageMutation.isPending}
      />
    </div>
  )
}
