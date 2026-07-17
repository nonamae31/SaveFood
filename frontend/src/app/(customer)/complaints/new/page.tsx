import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { STORAGE_KEYS } from '@/lib/constants';
import { useNavigate, useSearchParams } from 'react-router-dom';

export interface ComplaintResponse {
  id: string;
}

const DEFAULT_STORE_ID = "21000000-0000-0000-0000-000000000001";
const COMPLAINT_TYPE_FOOD_ERROR = 5;
import { apiClient } from '@/lib/apiClient';
import { getDisplayError } from '@/utils/apiErrorHandler';
import StepDetailView from './StepDetailView';
import StepUploadView from './StepUploadView';

const complaintSchema = z.object({
  orderId: z.string().min(1, "Vui lòng chọn đơn hàng"),
  title: z.string().min(5, "Tiêu đề ít nhất 5 ký tự").max(100, "Tiêu đề tối đa 100 ký tự"),
  description: z.string().min(10, "Mô tả ít nhất 10 ký tự").max(1000, "Mô tả tối đa 1000 ký tự"),
  files: z.array(typeof window === 'undefined' ? z.any() : z.instanceof(File)).min(1, "Vui lòng chọn ít nhất 1 file")
});

export type ComplaintFormValues = z.infer<typeof complaintSchema>;

export default function ComplaintFormContainer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get('orderId');

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgresses, setUploadProgresses] = useState<Record<number, number>>({});

  const methods = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      orderId: orderIdParam || '',
      title: 'Lỗi món ăn không đúng',
      description: 'Tôi đặt bánh mì nhưng lại nhận được bánh bao.',
      files: []
    },
    mode: 'onTouched'
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof ComplaintFormValues)[] = [];
    if (currentStep === 1) fieldsToValidate = ['title', 'description'];

    const isStepValid = await methods.trigger(fieldsToValidate);
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 2));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: ComplaintFormValues) => {
    try {
      setIsSubmitting(true);
      
      // XSS Sanitize as per Defensive Programming Directive 1
      const safeTitle = DOMPurify.sanitize(data.title);
      const safeDescription = DOMPurify.sanitize(data.description);
      
      const evidences: { fileUrl: string; fileType: string }[] = [];
      const filesToUpload = data.files || [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const url = await new Promise<string>((resolve, reject) => {
          const baseApi = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5101/api').replace(/\/api\/?$/, '') + '/api';
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${baseApi}/v1/complaints/upload`);
          xhr.withCredentials = true;
          
          // Defensive Programming Directive 2: SPA thuần túy không có BFF nên đành lưu ở localStorage.
          // Tối ưu nhất là nên dùng HttpOnly Cookie set từ server.
          const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploadProgresses(prev => ({ ...prev, [i]: percentComplete }));
            }
          };
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const res = JSON.parse(xhr.responseText);
                const uploadedUrl = typeof res.data === 'string' ? res.data : (res.data?.url || res.url || res.secureUrl || res);
                resolve(uploadedUrl);
              } catch (e) {
                resolve(xhr.responseText);
              }
            } else {
              reject(new Error(`Upload failed với status ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error during upload'));
          
          const formData = new FormData();
          formData.append('file', file);
          xhr.send(formData);
        });
        
        evidences.push({ fileUrl: url, fileType: file.type || 'image/jpeg' });
      }
      
      const payload = {
        ...data,
        title: safeTitle,
        description: safeDescription,
        evidences: evidences
      };

      const response = await apiClient<ComplaintResponse>('/v1/complaints', {
        method: 'POST',
        body: JSON.stringify({
          storeId: DEFAULT_STORE_ID,
          orderId: payload.orderId || null, // Đặt null để tránh lỗi validation Guid nếu cần
          title: payload.title,
          description: payload.description,
          type: COMPLAINT_TYPE_FOOD_ERROR,
          evidences: payload.evidences
        })
      });
      
      console.log('Submitted Payload:', payload);
      toast.success('Gửi khiếu nại thành công!');
      
      if (response && response.id) {
        navigate('/complaints/' + response.id);
      } else {
        navigate('/complaints');
      }
    } catch (error: any) {
      // API Error handling as per Defensive Programming Directive 4
      const errorMsg = getDisplayError(error);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!orderIdParam) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Lỗi: Không tìm thấy Đơn hàng</h1>
        <p className="text-gray-600 mb-6">Bạn phải chọn một đơn hàng từ danh sách trước khi khiếu nại.</p>
        <button 
          onClick={() => navigate('/profile?tab=orders')} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Quay lại Danh sách Đơn hàng
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Tạo Khiếu Nại Mới</h1>
      
      {/* Stepper Header */}
      <div className="flex items-center mb-8">
        <div className={`flex-1 text-center font-semibold ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>1. Chi Tiết</div>
        <div className="flex-1 text-center font-semibold text-gray-300">-----</div>
        <div className={`flex-1 text-center font-semibold ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>2. Tải Lên</div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 1 && <StepDetailView />}
          {currentStep === 2 && <StepUploadView uploadProgresses={uploadProgresses} isSubmitting={isSubmitting} />}

          <div className="flex justify-between mt-8 pt-4 border-t">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Quay lại
            </button>
            
            {currentStep < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi Khiếu Nại'}
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
