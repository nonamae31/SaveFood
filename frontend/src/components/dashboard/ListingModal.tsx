import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { CreateListingDTO, UpdateListingDTO, ListingResponseDTO, DiscountRuleDTO, ProductResponseDTO } from '@/types/store.types'

interface ListingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: any) => void
  initialData?: ListingResponseDTO | null
  products: ProductResponseDTO[]
  isLoading?: boolean
}

// Helper: format a Date object to "YYYY-MM-DDTHH:mm" in LOCAL time (for datetime-local input)
const toLocalInputFormat = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Helper: parse a UTC date string from backend (no 'Z') and convert to local input format
const utcStringToLocalInput = (utcStr: string): string => {
  // Backend returns without 'Z', so we append it to force UTC interpretation
  const normalized = utcStr.endsWith('Z') || utcStr.includes('+') ? utcStr : utcStr + 'Z'
  return toLocalInputFormat(new Date(normalized))
}

export function ListingModal({ isOpen, onClose, onSubmit, initialData, products, isLoading }: ListingModalProps) {
  const [formData, setFormData] = useState<CreateListingDTO | UpdateListingDTO>({
    productId: '',
    title: '',
    salePrice: 0,
    quantityAvailable: 1,
    expiryDate: toLocalInputFormat(new Date(Date.now() + 86400000)), // Tomorrow in local time
    discountRules: [],
    ...(initialData && { status: initialData.status })
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        productId: initialData.productId,
        title: initialData.title,
        salePrice: initialData.salePrice,
        quantityAvailable: initialData.quantityAvailable,
        expiryDate: utcStringToLocalInput(initialData.expiryDate),
        status: initialData.status,
        discountRules: initialData.discountRules.map(r => ({
          discountPercent: r.discountPercent,
          targetPrice: r.targetPrice,
          triggerValue: r.triggerValue,
          triggerType: r.triggerType,
          ruleOrder: r.ruleOrder
        }))
      } as UpdateListingDTO)
    } else {
      setFormData({
        productId: products.length > 0 ? products[0].id : '',
        title: '',
        salePrice: 0,
        quantityAvailable: 1,
        expiryDate: toLocalInputFormat(new Date(Date.now() + 86400000)),
        discountRules: [],
      })
    }
  }, [initialData, isOpen, products])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // formData.expiryDate is "YYYY-MM-DDTHH:mm" in LOCAL time (from datetime-local input)
    // new Date() treats strings without timezone as LOCAL time, so .toISOString() gives correct UTC
    const payload = { ...formData, expiryDate: new Date(formData.expiryDate).toISOString() }
    onSubmit(payload)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    let val: any = value
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked
    } else if (type === 'number') {
      val = value === '' ? '' : Number(value)
    }
    
    // Auto-fill title if product changes and we are creating
    if (name === 'productId' && !initialData) {
      const prod = products.find(p => p.id === value)
      if (prod) {
        setFormData(prev => ({ ...prev, [name]: val, title: prod.name, salePrice: prod.originalPrice * 0.5 }))
        return
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: val }))
  }

  const addDiscountRule = () => {
    setFormData(prev => ({
      ...prev,
      discountRules: [
        ...prev.discountRules,
        {
          triggerType: 0, // TimeBeforeExpiry
          triggerValue: 120, // 2 hours
          discountPercent: 50,
          ruleOrder: prev.discountRules.length
        }
      ]
    }))
  }

  const removeDiscountRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      discountRules: prev.discountRules.filter((_, i) => i !== index)
    }))
  }

  const handleRuleChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newRules = [...prev.discountRules]
      newRules[index] = { ...newRules[index], [field]: Number(value) }
      return { ...prev, discountRules: newRules }
    })
  }

  const handleRuleDiscountTypeChange = (index: number, type: 'percent' | 'price') => {
    setFormData(prev => {
      const newRules = [...prev.discountRules]
      if (type === 'percent') {
        newRules[index] = { ...newRules[index], targetPrice: undefined, discountPercent: newRules[index].discountPercent || 50 }
      } else {
        newRules[index] = { ...newRules[index], discountPercent: undefined, targetPrice: newRules[index].targetPrice || 0 }
      }
      return { ...prev, discountRules: newRules }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Sửa Đợt Giảm Giá' : 'Tạo Tin Đăng Mới'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form id="listing-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm gốc *</label>
              <select
                required
                name="productId"
                value={(formData as CreateListingDTO).productId || ''}
                onChange={handleChange}
                disabled={!!initialData} // Cannot change product when updating
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="" disabled>-- Chọn sản phẩm --</option>
                {products.filter(p => !p.isHidden || initialData?.productId === p.id).map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Gốc: {p.originalPrice.toLocaleString()}đ)</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề hiển thị *</label>
              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán giảm (VNĐ) *</label>
              <input
                required
                type="number"
                name="salePrice"
                min="0"
                value={formData.salePrice}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng *</label>
              <input
                required
                type="number"
                name="quantityAvailable"
                min="0"
                value={formData.quantityAvailable}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hạn sử dụng *</label>
              <input
                required
                type="datetime-local"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            {initialData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  name="status"
                  value={(formData as UpdateListingDTO).status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value={0}>Nháp (Draft)</option>
                  <option value={1}>Đang bán (Published)</option>
                  <option value={2}>Đã bán hết (SoldOut)</option>
                </select>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Luật giảm giá tự động (Tùy chọn)</h3>
              <button 
                type="button" 
                onClick={addDiscountRule}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm luật
              </button>
            </div>

            {formData.discountRules.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Chưa có luật giảm giá nào. (Ví dụ: Giảm thêm 50% nếu còn dưới 2 giờ)</p>
            ) : (
              <div className="space-y-3">
                {formData.discountRules.map((rule, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl items-end sm:items-center">
                    <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Loại điều kiện</label>
                        <select
                          value={rule.triggerType}
                          onChange={(e) => handleRuleChange(idx, 'triggerType', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white"
                        >
                          <option value={0}>Trước khi hết hạn (phút)</option>
                          <option value={1}>Tồn kho còn dưới (phần)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Giá trị kích hoạt</label>
                        <input
                          type="number"
                          min="1"
                          value={rule.triggerValue}
                          onChange={(e) => handleRuleChange(idx, 'triggerValue', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white"
                        />
                      </div>
                      {/* Discount type toggle: mutually exclusive */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Kiểu giảm giá</label>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`discountType-${idx}`}
                              checked={rule.discountPercent != null}
                              onChange={() => handleRuleDiscountTypeChange(idx, 'percent')}
                              className="text-green-600"
                            />
                            <span className="text-sm text-gray-700">% giảm giá</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`discountType-${idx}`}
                              checked={rule.targetPrice != null}
                              onChange={() => handleRuleDiscountTypeChange(idx, 'price')}
                              className="text-green-600"
                            />
                            <span className="text-sm text-gray-700">Giá đích (VNĐ)</span>
                          </label>
                        </div>
                      </div>

                      {/* Show only the relevant input */}
                      {rule.discountPercent != null ? (
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Phần trăm giảm (%)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={rule.discountPercent || ''}
                            onChange={(e) => handleRuleChange(idx, 'discountPercent', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-green-400"
                            placeholder="Ví dụ: 50"
                          />
                          <p className="text-xs text-gray-400 mt-1">Giảm {rule.discountPercent || 0}% so với giá bán hiện tại</p>
                        </div>
                      ) : (
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Giá đích (VNĐ)</label>
                          <input
                            type="number"
                            min="0"
                            value={rule.targetPrice ?? ''}
                            onChange={(e) => handleRuleChange(idx, 'targetPrice', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-400"
                            placeholder="Ví dụ: 50000"
                          />
                          <p className="text-xs text-gray-400 mt-1">Khi kích hoạt, giá sẽ xuống còn {(rule.targetPrice || 0).toLocaleString('vi-VN')}đ</p>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDiscountRule(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg sm:mt-5"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
        
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="listing-form"
            disabled={isLoading || (!initialData && products.length === 0)}
            className="flex-1 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Đang lưu...' : 'Lưu lại'}
          </button>
        </div>
      </div>
    </div>
  )
}
