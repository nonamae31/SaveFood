import React, { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';
import type { ComplaintFormValues } from './page';

export default function StepUploadView({ uploadProgresses = {}, isSubmitting = false }: { uploadProgresses?: Record<number, number>, isSubmitting?: boolean }) {
  const { setValue, watch, formState: { errors } } = useFormContext<ComplaintFormValues>();
  const files = watch('files') || [];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Append new files to existing ones
    setValue('files', [...files, ...acceptedFiles], { shouldValidate: true, shouldDirty: true });
  }, [files, setValue]);

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setValue('files', newFiles, { shouldValidate: true, shouldDirty: true });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.mov']
    },
    maxSize: 52428800, // 50MB
    disabled: isSubmitting
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Tải Lên Bằng Chứng</h2>
      <p className="text-gray-500 text-sm">Cung cấp hình ảnh hoặc video để chúng tôi hỗ trợ tốt hơn (tối đa 50MB/file).</p>

      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors ${
          isSubmitting ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : 'cursor-pointer'
        } ${
          isDragActive && !isSubmitting ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
        {isDragActive ? (
          <p className="text-blue-500 font-medium">Kéo thả file vào đây...</p>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 font-medium">Kéo thả file hoặc click để chọn</p>
            <p className="text-gray-400 text-sm mt-1">Hỗ trợ JPG, PNG, WEBP, MP4, MOV</p>
          </div>
        )}
      </div>

      {errors.files && <p className="text-red-500 text-sm font-medium">{errors.files.message as string}</p>}
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">File đã chọn ({files.length}):</h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {files.map((file: File, index: number) => {
              const isImage = file.type.startsWith('image/');
              const isVideo = file.type.startsWith('video/');
              const previewUrl = URL.createObjectURL(file);

              return (
                <li key={index} className="relative flex items-center gap-3 p-3 bg-gray-50 border rounded-lg overflow-hidden group">
                  <div className="w-16 h-16 shrink-0 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center relative">
                    {isImage && (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    {isVideo && (
                      <video src={previewUrl} className="w-full h-full object-cover" muted />
                    )}
                    {!isImage && !isVideo && (
                      <span className="text-xs text-gray-500">File</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    disabled={isSubmitting}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 bg-white/80 rounded-full p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
                    title="Xóa"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {uploadProgresses[index] !== undefined && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10">
                      <div className="relative w-8 h-8 mb-1">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-gray-200 stroke-current" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="text-blue-600 stroke-current" strokeWidth="4" fill="none" strokeDasharray={`${uploadProgresses[index]}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-blue-600">{uploadProgresses[index]}%</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
