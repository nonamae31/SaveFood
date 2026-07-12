export function getDisplayError(error: unknown): string {
  // Log đầy đủ cho hệ thống monitoring (không hiển thị cho user)
  console.error('[API Error]', error);

  if (error instanceof Response) {
    const status = error.status;
    const errorMap: Record<number, string> = {
      400: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
      401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      403: 'Bạn không có quyền thực hiện thao tác này.',
      404: 'Không tìm thấy dữ liệu yêu cầu.',
      429: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
      500: 'Lỗi hệ thống. Chúng tôi đang khắc phục.',
    };
    return errorMap[status] ?? 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Không thể kết nối. Vui lòng kiểm tra mạng.';
}
