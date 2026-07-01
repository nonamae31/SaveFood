export const validatePasswordStrength = (pass: string): string | null => {
  if (pass.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
  if (!/[A-Z]/.test(pass)) return 'Mật khẩu phải chứa ít nhất một chữ hoa';
  if (!/[a-z]/.test(pass)) return 'Mật khẩu phải chứa ít nhất một chữ thường';
  if (!/[0-9]/.test(pass)) return 'Mật khẩu phải chứa ít nhất một số';
  if (!/[^A-Za-z0-9]/.test(pass)) return 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt';
  return null;
};
