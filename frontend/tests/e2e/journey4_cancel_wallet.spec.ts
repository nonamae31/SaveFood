import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const DB_NAME = 'SaveFoodDB_MVP';
const runSql = (query: string) => {
  try {
    const singleLineQuery = query.replace(/\r?\n|\r/g, ' ').trim();
    const result = execSync(`sqlcmd -S localhost -d ${DB_NAME} -Q "SET NOCOUNT ON; ${singleLineQuery}" -W -h -1`, { encoding: 'utf8' });
    return result.trim();
  } catch (error: any) {
    console.error('SQL Execution Error:', error?.stdout?.toString() || error.message);
    throw new Error('SQL Execution failed: ' + (error?.stdout?.toString() || error.message));
  }
};

const uniqueId = Date.now().toString().slice(-6);
const testUser = {
  username: `cus4_${uniqueId}`,
  email: `cus4_${uniqueId}@example.com`,
  password: 'Password123!',
  fullName: 'Journey4 Customer',
  phoneNumber: '0944444444'
};

test.describe('Journey 4: Order Cancellation & Wallet Operations', () => {

  test.afterAll(async () => {
    // Dọn dẹp dữ liệu
    const userId = runSql(`SELECT Id FROM Users WHERE Email = '${testUser.email}'`);
    if (userId && userId.length === 36) {
      runSql(`DELETE FROM OrderItems WHERE OrderId IN (SELECT Id FROM Orders WHERE UserId = '${userId}')`);
      runSql(`DELETE FROM Payments WHERE OrderId IN (SELECT Id FROM Orders WHERE UserId = '${userId}')`);
      runSql(`DELETE FROM CustomerWalletTransactions WHERE OrderId IN (SELECT Id FROM Orders WHERE UserId = '${userId}')`);
      runSql(`DELETE FROM Orders WHERE UserId = '${userId}'`);
      runSql(`DELETE FROM CartItems WHERE CartId IN (SELECT Id FROM Carts WHERE UserId = '${userId}')`);
      runSql(`DELETE FROM Carts WHERE UserId = '${userId}'`);
      runSql(`DELETE FROM WithdrawalRequests WHERE CustomerWalletId IN (SELECT Id FROM CustomerWallets WHERE UserId = '${userId}')`);
      runSql(`DELETE FROM CustomerWalletTransactions WHERE CustomerWalletId IN (SELECT Id FROM CustomerWallets WHERE UserId = '${userId}')`);
      runSql(`DELETE FROM CustomerWallets WHERE UserId = '${userId}'`);
      runSql(`DELETE FROM EmailVerifications WHERE UserId = '${userId}'`);
      runSql(`DELETE FROM RefreshTokens WHERE UserId = '${userId}'`);
      runSql(`DELETE FROM Users WHERE Id = '${userId}'`);
    }
  });

  test('Should cancel an order and process wallet refund/withdrawal', async ({ page }) => {
    test.setTimeout(45000);

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
    await page.waitForTimeout(2000); 
    const otpCode = runSql(`SELECT TOP 1 VerificationCode FROM EmailVerifications WHERE UserId IN (SELECT Id FROM Users WHERE Email = '${testUser.email}') ORDER BY CreatedAt DESC`);
    expect(otpCode).toHaveLength(6);
    
    const firstOtpInput = page.locator('input[type="text"]').first();
    await firstOtpInput.focus();
    await page.keyboard.type(otpCode);
    await page.getByRole('button', { name: 'Xác nhận' }).click();

    // Sửa cờ trong DB để active tài khoản (EmailVerified = 4, Status = 0)
    runSql(`UPDATE Users SET UserFlags = 4, Status = 0 WHERE Email = '${testUser.email}'`);

    // Tạo CustomerWallet bằng SQL với 1.000.000đ để thanh toán
    const userId = runSql(`SELECT Id FROM Users WHERE Email = '${testUser.email}'`);
    runSql(`
      INSERT INTO CustomerWallets (Id, UserId, Balance, CreatedAt, UpdatedAt) VALUES (NEWID(), '${userId}', 1000000, GETDATE(), GETDATE());
    `);

    // 2. Đăng nhập
    await page.getByLabel('Email', { exact: true }).fill(testUser.email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(testUser.password);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL('/');

    // 3. Thêm vào giỏ hàng & Đặt hàng bằng Ví SaveFood
    await page.goto('/products');
    await page.waitForSelector('button[title="Thêm vào giỏ hàng"]', { state: 'visible', timeout: 10000 });
    await page.locator('button[title="Thêm vào giỏ hàng"]').first().click();
    await expect(page.getByText('Đã thêm vào giỏ hàng').first()).toBeVisible();

    await page.locator('a[title="Giỏ hàng"]').click();
    await page.getByText(/Chọn tất cả/).click();
    await page.getByRole('button', { name: 'Mua hàng ngay' }).click();

    // Chọn thanh toán Wallet
    await page.locator('label', { hasText: 'Ví SaveFood' }).click();
    
    // Đồng ý chính sách
    await page.getByLabel(/Tôi hiểu và đồng ý/).check({ force: true });
    await expect(page.getByRole('button', { name: 'Xác nhận thanh toán' })).toBeEnabled();
    await page.getByRole('button', { name: 'Xác nhận thanh toán' }).click();

    const acceptWarningBtn = page.getByRole('button', { name: 'Chấp nhận đặt hàng' });
    if (await acceptWarningBtn.isVisible()) {
      await acceptWarningBtn.click();
    }

    await expect(page).toHaveURL(/.*\/checkout\/success\?orderCode=.*/);

    // 4. Vào danh sách đơn hàng
    await page.goto('/my-orders');
    await expect(page.getByText('Đã thanh toán').first()).toBeVisible();

    // Vào chi tiết đơn hàng
    await page.getByText('Xem chi tiết').first().click();
    await expect(page.getByText('Mã nhận hàng')).toBeVisible();

    // 5. Hủy đơn hàng
    await page.getByRole('button', { name: 'Hủy đơn hàng' }).click();
    await page.getByPlaceholder('Vui lòng cho biết lý do').fill('Thay đổi ý định mua');
    await page.getByRole('button', { name: 'Xác nhận Hủy đơn' }).click();

    // Verify toast & status updated
    await expect(page.getByText('Hủy đơn hàng và gửi yêu cầu hoàn tiền thành công.').first()).toBeVisible();
    await expect(page.getByText('Đã huỷ')).toBeVisible();

    // 6. Kiểm tra Ví (Wallet)
    await page.goto('/my-wallet');
    // Chờ số dư update (Đã nạp 1M, mua món X, hoàn lại món X -> về lại 1M)
    await expect(page.getByText('1.000.000 đ').first()).toBeVisible();

    // Lịch sử giao dịch ví: Có Thanh toán và Hoàn tiền
    await expect(page.getByText('Thanh toán đơn hàng').first()).toBeVisible();
    await expect(page.getByText('Hoàn tiền').first()).toBeVisible();

    // 7. Rút tiền (Withdraw)
    await page.getByRole('button', { name: 'Rút tiền' }).click();
    await page.getByPlaceholder('Nhập số tiền...').fill('50000');
    await page.getByPlaceholder('Nhập tên ngân hàng...').fill('Vietcombank');
    await page.getByPlaceholder('Nhập số tài khoản...').fill('0123456789');
    await page.getByPlaceholder('NGUYEN VAN A').fill('NGUYEN VAN A');
    await page.getByRole('button', { name: 'Xác nhận rút' }).click();

    await expect(page.getByText('Gửi yêu cầu rút tiền thành công').first()).toBeVisible();
    
    // Balance should be updated to 50000
    await expect(page.getByText('50.000 đ').first()).toBeVisible();
  });
});
