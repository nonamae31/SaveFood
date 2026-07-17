import React, { useState } from 'react'
import { X, Search, Clock, PlusCircle } from 'lucide-react'
import { useStoreRuleTemplates } from '@/hooks/useStoreListings'
import { useAuthContext } from '@/contexts/AuthContext'
import type { RuleTemplateDTO, DiscountRuleDTO } from '@/types/store.types'

interface RuleTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (rules: DiscountRuleDTO[]) => void
}

export function RuleTemplateModal({ isOpen, onClose, onSelectTemplate }: RuleTemplateModalProps) {
  const { user } = useAuthContext()
  const storeId = user?.storeId ?? undefined

  const { data: templates = [], isLoading, error } = useStoreRuleTemplates(storeId)

  const [searchTerm, setSearchTerm] = useState('')

  if (!isOpen) return null

  // Filter theo title hoặc tên sản phẩm
  const filteredTemplates = templates.filter(t => {
    const term = searchTerm.toLowerCase()
    return t.listingTitle.toLowerCase().includes(term) || t.productName.toLowerCase().includes(term)
  })

  const handleSelect = (template: RuleTemplateDTO) => {
    // Map DTO back to input format for the form
    const formRules: DiscountRuleDTO[] = template.rules.map(r => ({
      ruleOrder: r.ruleOrder,
      discountPercent: r.discountPercent,
      targetPrice: r.targetPrice,
      triggerValue: r.triggerValue,
      triggerType: r.triggerType
    }))

    onSelectTemplate(formRules)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl flex flex-col h-[80vh] max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Nhập từ lịch sử</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b shrink-0 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên bài đăng hoặc tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent mr-2"></div>
              Đang tải danh sách mẫu...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              Lỗi tải danh sách mẫu từ lịch sử.
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
              <Clock size={40} className="text-gray-300" />
              <p>Không tìm thấy bài đăng lịch sử nào.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredTemplates.map(template => (
                <div
                  key={template.listingId}
                  className="p-3 border rounded-xl hover:border-brand-500 hover:shadow-md transition-all cursor-pointer bg-white group flex items-start justify-between"
                  onClick={() => handleSelect(template)}
                >
                  <div className="flex flex-col gap-1">
                    <h4 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                      {template.listingTitle}
                    </h4>
                    <span className="text-xs text-gray-500">Sp: {template.productName}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {template.rules.map((rule, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {rule.triggerType === 0
                            ? `Trước ${rule.triggerValue} phút`
                            : `Còn ${rule.triggerValue} phần`}
                          {' -> '}
                          {rule.discountPercent ? `-${rule.discountPercent}%` : `${rule.targetPrice}đ`}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button className="mt-1 shrink-0 w-8 h-8 rounded-full bg-gray-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                    <PlusCircle size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
