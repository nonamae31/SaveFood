import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { CreateProductDTO, UpdateProductDTO, ProductResponseDTO } from '@/types/store.types'
import { useCategories } from '@/api/category.api'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: any) => void
  initialData?: ProductResponseDTO | null
  isLoading?: boolean
}

export function ProductModal({ isOpen, onClose, onSubmit, initialData, isLoading }: ProductModalProps) {
  const { data: categories } = useCategories()

  const [formData, setFormData] = useState<CreateProductDTO | UpdateProductDTO>({
    categoryId: 'ca700000-0000-0000-0000-000000000001', // Default category ID
    name: '',
    description: '',
    originalPrice: 0,
    isSurpriseBag: false,
    ...(initialData && { isHidden: initialData.isHidden }) // Add isHidden if updating
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        categoryId: initialData.categoryId,
        name: initialData.name,
        description: initialData.description || '',
        originalPrice: initialData.originalPrice,
        isSurpriseBag: initialData.isSurpriseBag,
        isHidden: initialData.isHidden,
      } as UpdateProductDTO)
    } else {
      setFormData({
        categoryId: categories?.[0]?.id || 'ca700000-0000-0000-0000-000000000001',
        name: '',
        description: '',
        originalPrice: 0,
        isSurpriseBag: false,
      })
    }
  }, [initialData, isOpen, categories])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    let val: any = value
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked
    } else if (type === 'number') {
      val = value === '' ? '' : Number(value)
    }
    
    setFormData(prev => ({ ...prev, [name]: val }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Ví dụ: Bánh mì thịt nướng"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              >
                {categories ? (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <option value="ca700000-0000-0000-0000-000000000001">Bánh mì & Bánh ngọt (Mặc định)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc (VNĐ) *</label>
              <input
                required
                type="number"
                name="originalPrice"
                min="0"
                value={formData.originalPrice}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Mô tả thành phần, xuất xứ..."
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
              <input
                type="checkbox"
                id="isSurpriseBag"
                name="isSurpriseBag"
                checked={!!(formData as any).isSurpriseBag}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="isSurpriseBag" className="text-sm font-medium text-green-900">
                Đây là Túi Bất Ngờ (Surprise Bag)?
              </label>
            </div>
            
            {initialData && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  id="isHidden"
                  name="isHidden"
                  checked={(formData as UpdateProductDTO).isHidden}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                />
                <label htmlFor="isHidden" className="text-sm font-medium text-gray-900">
                  Ẩn sản phẩm này khỏi danh sách chọn?
                </label>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
