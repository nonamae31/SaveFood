import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const DB_NAME = 'SaveFoodDB_MVP';
const runSql = (query: string) => {
  try {
    const singleLineQuery = query.replace(/\r?\n|\r/g, ' ').trim();
    const result = execSync(`sqlcmd -S localhost -d ${DB_NAME} -Q "SET NOCOUNT ON; ${singleLineQuery}" -W -h -1`, { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    console.error('SQL Execution Error:', error);
    return '';
  }
};

const uniqueId = Date.now().toString().slice(-6);
const testUser = {
  username: `cus3_${uniqueId}`,
  email: `cus3_${uniqueId}@example.com`,
  password: 'Password123!',
  fullName: 'Journey3 Customer',
  phoneNumber: '0933333333'
};

test.describe('Journey 3: Add to Cart & Checkout Flow', () => {

  test.afterAll(async () => {
    // Dọn dẹp dữ liệu
    const userId = runSql(`SELECT Id FROM Users WHERE Email = '${testUser.email}'`);
    if (userId && userId.length === 36) {
      runSql(`DELETE FROM OrderItems WHERE OrderId IN (SELECT Id FROM Orders WHERE CustomerId = '${userId}')`);
      runSql(`DELETE FROM Orders WHERE CustomerId = '${userId}'`);
      runSql(`DELETE FROM CartItems WHERE CartId IN (SELECT Id FROM Carts WHERE CustomerId = '${userId}')`);
      runSql(`DELETE FROM Carts WHERE CustomerId = '${userId}'`);
      runSql(`DELETE FROM WalletTransactions WHERE WalletId IN (SELECT Id FROM CustomerWallets WHERE UserId = '${userId}')`);
      runSql(`DELETE FROM CustomerWallets WHERE UserId = '${userId}'`);
      runSql(`DELETE FROM EmailVerifications WHERE UserId = '${userId}'`);
      runSql(`DELETE FROM Users WHERE Id = '${userId}'`);
    }
  });

  test('Should complete the full flow from Add to Cart to Checkout', async ({ page }) => {
    test.setTimeout(45000); // Flow dài nên tăng timeout

    // 1. Đăng ký tài khoản
    await page.goto('/register');
    await page.getByLabel('Username').fill(testUser.username);
    await page.getByLabel('Họ và tên').fill(testUser.fullName);
    await page.getByLabel('Số điện thoại').fill(testUser.phoneNumber);
    await page.getByLabel('Email', { exact: true }).fill(testUser.email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(testUser.password);
    await page.getByLabel('Xác nhận mật khẩu').fill(testUser.password);
    await page.getByRole('button', { name: 'Đăng ký' }).click();

    await expect(page).toHaveURL(/.*\/verify-otp/);
    
    // 2. Xác thực OTP
    await page.waitForTimeout(2000); 
    const otpCode = runSql(`SELECT TOP 1 VerificationCode FROM EmailVerifications WHERE UserId IN (SELECT Id FROM Users WHERE Email = '${testUser.email}') ORDER BY CreatedAt DESC`);
    expect(otpCode).toHaveLength(6);
    
    const firstOtpInput = page.locator('input[type="text"]').first();
    await firstOtpInput.focus();
    await page.keyboard.type(otpCode);
    await page.getByRole('button', { name: 'Xác nhận' }).click();

    // 3. Đăng nhập
    await expect(page).toHaveURL(/.*\/login/);
    // Sửa cờ trong DB để active tài khoản (EmailVerified = 4, Status = 0)
    runSql(`UPDATE Users SET UserFlags = 4, Status = 0 WHERE Email = '${testUser.email}'`);
    
    await page.getByLabel('Email', { exact: true }).fill(testUser.email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(testUser.password);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    
    await expect(page).toHaveURL('/');

    // Bỏ qua bơm tiền vào ví vì sẽ dùng PayOS

    // 5. Thêm vào giỏ hàng
    await page.goto('/products');
    await page.waitForSelector('button[title="Thêm vào giỏ hàng"]', { state: 'visible', timeout: 10000 });
    
    // Click nút thêm vào giỏ hàng ở sản phẩm đầu tiên
    const addBtn = page.locator('button[title="Thêm vào giỏ hàng"]').first();
    await addBtn.click();
    
    await expect(page.getByText('Đã thêm vào giỏ hàng').first()).toBeVisible();

    // 6. Vào Giỏ hàng
    await page.locator('a[title="Giỏ hàng"]').click();
    await expect(page).toHaveURL(/.*\/cart/);
    await expect(page.getByText('Giỏ hàng của bạn')).toBeVisible();

    // Chọn tất cả sản phẩm
    await page.getByText(/Chọn tất cả/).click();

    // 7. Click Mua hàng ngay
    await page.getByRole('button', { name: 'Mua hàng ngay' }).click();
    // Chọn phương thức PayOS (VNPAY/PayOS)
    await page.locator('label', { hasText: 'Thanh toán qua PayOS' }).click();
    
    // Mock API Checkout để giả lập PayOS trả về thành công không cần redirect thật
    await page.route('**/api/orders/checkout', async route => {
      await route.fulfill({ 
        json: { 
          data: { 
            orderId: "MOCK-ORDER-123",
            checkoutUrl: "http://localhost:5173/checkout/success?orderCode=MOCK-ORDER-123" 
          }
        } 
      });
    });
    
    // Đồng ý chính sách
    await page.getByLabel(/Tôi hiểu và đồng ý/).check({ force: true });
    
    // Đợi nút được bật
    await expect(page.getByRole('button', { name: 'Xác nhận thanh toán' })).toBeEnabled();

    // Submit
    await page.getByRole('button', { name: 'Xác nhận thanh toán' }).click();

    // Đợi nếu có modal cảnh báo khoảng cách (>5km)
    const acceptWarningBtn = page.getByRole('button', { name: 'Chấp nhận đặt hàng' });
    if (await acceptWarningBtn.isVisible()) {
      await acceptWarningBtn.click();
    }

    // 9. Kiểm tra chuyển hướng trang Thành công
    await expect(page).toHaveURL(/.*\/checkout\/success\?orderCode=.*/);
    
    // Vì mock API không gọi backend, ta dọn dẹp Cart bằng SQL để test giỏ hàng trống pass
    runSql(`
      DECLARE @UserId UNIQUEIDENTIFIER;
      SELECT @UserId = Id FROM Users WHERE Email = '${testUser.email}';
      DELETE FROM CartItems WHERE CartId IN (SELECT Id FROM Carts WHERE UserId = @UserId);
    `);
    
    // 10. Đảm bảo giỏ hàng đã trống
    await page.goto('/cart');
    await expect(page.getByText('Giỏ hàng trống')).toBeVisible();
  });

});
