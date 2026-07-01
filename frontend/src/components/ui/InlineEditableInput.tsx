import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function InlineEditableInput({
  id, label, value, type = 'text', onSave, disabled = false, className = ''
}: {
  id: string; label: string; value: string; type?: string; onSave?: (val: string) => Promise<void>; disabled?: boolean; className?: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => { setLocalValue(value); }, [value]);

  const handleBlur = async () => {
    if (disabled || !onSave) return;
    if (localValue === value) return; // no change
    setStatus('saving');
    try {
      await onSave(localValue);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (_error: any) {
      setStatus('error');
      let msg = _error?.message || 'Lưu thất bại';
      if (msg.startsWith('Dữ liệu không hợp lệ: ')) {
        msg = msg.replace('Dữ liệu không hợp lệ: ', '').trim();
      }
      setErrorMessage(msg);
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 4000);
      setLocalValue(value); // revert on error
    }
  };

  return (
    <div className="relative">
      <Input
        id={id} label={label} type={type} value={localValue}
        onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur}
        disabled={disabled || status === 'saving'} className={className}
        error={status === 'error' ? errorMessage : undefined}
      />
      <div className="absolute right-3 top-9 flex items-center justify-center pointer-events-none">
        {status === 'saving' && <Loader2 className="animate-spin text-[--color-brand-600]" size={18} />}
        {status === 'success' && <CheckCircle className="text-green-500" size={18} />}
        {status === 'error' && <XCircle className="text-red-500" size={18} />}
      </div>
    </div>
  );
}
