import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { ComplaintFormValues } from './page';

export default function StepDetailView() {
  const { register, formState: { errors } } = useFormContext<ComplaintFormValues>();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Chi Tiết Khiếu Nại</h2>
      <p className="text-gray-500 text-sm">Mô tả rõ vấn đề bạn đang gặp phải.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
          <input 
            type="text"
            {...register('title')}
            placeholder="Ví dụ: Món ăn bị hỏng"
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết <span className="text-red-500">*</span></label>
          <textarea 
            {...register('description')}
            rows={5}
            placeholder="Mô tả cụ thể về tình trạng món ăn, thái độ phục vụ..."
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
