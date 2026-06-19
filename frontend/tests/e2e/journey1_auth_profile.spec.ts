import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const DB_NAME = 'SaveFoodDB_MVP';
const runSql = (query: string) => {
  try {
    const result = execSync(`sqlcmd -S localhost -d ${DB_NAME} -Q "${query}" -W -h -1`, { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    console.error('SQL Execution Error:', error);
    return '';
  }
};

const uniqueId = Date.now().toString().slice(-6);
const testUser = {
  username: `cus_${uniqueId}`,
  email: `cus_${uniqueId}@example.com`,
  password: 'Password123!',
  fullName: 'E2E Customer',
  phoneNumber: '0912345678'
};

test.describe('Journey 1: Authentication & Profile Setup', () => {

  test.afterAll(async () => {
    // Clean up sau khi test xong
    runSql(`DELETE FROM EmailVerifications WHERE UserId IN (SELECT Id FROM Users WHERE Email = '${testUser.email}')`);
    runSql(`DELETE FROM Users WHERE Email = '${testUser.email}'`);
  });

  test('Should register successfully and verify OTP', async ({ page }) => {
    // 1. Đăng ký
    await page.goto('/register');
    await page.getByLabel('Username').fill(testUser.username);
    await page.getByLabel('Họ và tên').fill(testUser.fullName);
    await page.getByLabel('Số điện thoại').fill(testUser.phoneNumber);
    await page.getByLabel('Email', { exact: true }).fill(testUser.email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(testUser.password);
    await page.getByLabel('Xác nhận mật khẩu').fill(testUser.password);
    await page.getByRole('button', { name: 'Đăng ký' }).click();

    // 2. Chờ chuyển hướng sang trang Verify OTP
    await expect(page).toHaveURL(/.*\/verify-otp/);
    await expect(page.getByText('Xác thực tài khoản')).toBeVisible();

    // 3. Lấy OTP từ Database
    await page.waitForTimeout(2000); // Đợi backend lưu OTP
    const otpQuery = `SELECT TOP 1 ev.VerificationCode FROM EmailVerifications ev JOIN Users u ON ev.UserId = u.Id WHERE u.Email = '${testUser.email}' ORDER BY ev.CreatedAt DESC`;
    const otpCode = runSql(otpQuery).split('\n')[0].trim();
    
    expect(otpCode).toHaveLength(6);

    // 4. Nhập OTP
    // Form xác thực thường có 6 ô input, chúng ta sẽ gửi toàn bộ OTP vào ô đầu tiên
    const firstOtpInput = page.locator('input[type="text"]').first();
    await firstOtpInput.focus();
    await page.keyboard.type(otpCode);
    
    await page.getByRole('button', { name: 'Xác nhận' }).click();

    // 5. Kiểm tra chuyển hướng về trang Đăng nhập
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Should login, update profile, change password and logout', async ({ page }) => {
    // Đảm bảo user đã verify (phòng trường hợp test 1 thất bại)
    runSql(`UPDATE Users SET UserFlags = 4, Status = 0 WHERE Email = '${testUser.email}'`);

    // 1. Đăng nhập
    await page.goto('/login');
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(testUser.password);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // Chờ chuyển hướng về trang chủ
    await expect(page).toHaveURL('/');
    
    // 2. Truy cập trang Profile
    await page.goto('/profile');
    
    // Cập nhật thông tin cơ bản
    const newName = 'E2E Customer Updated';
    await page.getByLabel('Họ và tên').fill(newName);
    await page.getByRole('button', { name: 'Lưu thông tin' }).click();
    
    // Đợi thông báo thành công (có thể là toast)
    // Giả sử có chữ "thành công"
    // await expect(page.getByText(/thành công/i)).toBeVisible();

    // 3. Đổi mật khẩu
    await page.getByLabel('Mật khẩu hiện tại').fill(testUser.password);
    const newPassword = 'Password123!@#';
    await page.getByLabel('Mật khẩu mới', { exact: true }).fill(newPassword);
    await page.getByLabel('Xác nhận mật khẩu mới').fill(newPassword);
    await page.getByRole('button', { name: 'Đổi mật khẩu' }).click();
    
    // await expect(page.getByText(/thành công/i)).toBeVisible();

    // 4. Đăng xuất
    // Click nút "Thoát" trên Navbar
    await page.getByText('Thoát').click();
    await expect(page).toHaveURL(/.*\/login/);
  });
});
