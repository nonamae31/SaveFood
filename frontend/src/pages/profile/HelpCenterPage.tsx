import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Image as ImageIcon, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/api/client';

export function HelpCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Vui lòng điền tiêu đề và nội dung');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('Title', title);
      formData.append('Message', message);
      if (imageFile) {
        formData.append('Image', imageFile);
      }

      const data = await apiClient<any>('/support', {
        method: 'POST',
        body: formData
      });

      if (data.success) {
        toast.success('Gửi yêu cầu hỗ trợ thành công!');
        setTitle('');
        setMessage('');
        removeImage();
        navigate(-1);
      } else {
        toast.error(data.message || 'Có lỗi xảy ra khi gửi yêu cầu');
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi kết nối tới máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-[--color-ink-secondary] hover:text-[--color-brand-600] transition-colors font-medium text-sm mb-6"
      >
        <ArrowLeft size={18} /> Quay lại
      </button>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 bg-brand-50/30">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trung tâm trợ giúp</h1>
          <p className="text-gray-600">Gửi yêu cầu hỗ trợ hoặc báo lỗi cho đội ngũ SaveFood. Chúng tôi sẽ phản hồi sớm nhất qua email của bạn.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <Input
            id="title"
            label="Tiêu đề yêu cầu"
            placeholder="Ví dụ: Lỗi thanh toán, Quán không giao hàng..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-bold text-gray-700">
              Nội dung chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white shadow-sm resize-none"
              placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Ảnh đính kèm (không bắt buộc)
            </label>
            
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <p className="text-sm font-medium">Bấm để chọn ảnh minh họa</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG tối đa 5MB</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg" 
                  onChange={handleImageChange}
                />
              </label>
            ) : (
              <div className="relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-40 rounded-xl object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button 
              type="submit" 
              isLoading={isSubmitting} 
              className="w-full md:w-auto flex items-center justify-center gap-2"
            >
              <Send size={18} /> Gửi yêu cầu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
