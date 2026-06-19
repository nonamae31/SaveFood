import { test, expect } from '@playwright/test';

test.describe('Journey 2: Search & Filter Flow', () => {

  test('Should search for products from homepage', async ({ page }) => {
    // 1. Điều hướng tới trang chủ
    await page.goto('/');

    // 2. Nhấn vào nút Tìm kiếm trên Navbar (nếu có)
    // Navbar ẩn thanh search trên desktop cho tới khi click vào icon Tìm kiếm
    const searchBtn = page.getByRole('button', { name: 'Tìm kiếm' });
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
    }

    // 3. Nhập từ khóa "Bánh mì"
    const searchInput = page.getByPlaceholder('Tìm món ăn...');
    await searchInput.fill('Bánh mì');

    // 4. Nhấn Enter
    await page.keyboard.press('Enter');

    // 5. Kiểm tra điều hướng
    await expect(page).toHaveURL(/.*\/products\?.*q=B%C3%A1nh%20m%C3%AC.*/i);
    
    // 6. Kiểm tra tiêu đề trang
    await expect(page.getByText('Kết quả tìm kiếm cho:')).toBeVisible();
  });

  test('Should filter and sort products', async ({ page }) => {
    // Truy cập trực tiếp trang danh sách
    await page.goto('/products');

    // Đợi UI tải xong
    await page.waitForTimeout(1000);

    // 1. Chọn Sắp xếp: Giá thấp nhất
    await page.getByRole('button', { name: 'Mặc định', exact: true }).click();
    await page.getByRole('button', { name: 'Giá thấp nhất', exact: true }).click();

    // 2. Chọn Loại sản phẩm: Túi bất ngờ
    await page.getByRole('button', { name: 'Tất cả loại', exact: true }).click();
    await page.getByRole('button', { name: 'Túi bất ngờ', exact: true }).click();

    // 3. Nhấn Lọc
    await page.getByRole('button', { name: 'Lọc' }).click();

    // 4. Kiểm tra URL đã cập nhật tham số
    await expect(page).toHaveURL(/.*sortBy=price_asc/);
    await expect(page).toHaveURL(/.*isSurpriseBag=true/);
  });

  test('Should view product details from listings', async ({ page }) => {
    // Truy cập trang danh sách
    await page.goto('/products');

    // Chờ sản phẩm load
    await page.waitForSelector('a[id^="listing-card-"]', { state: 'visible', timeout: 10000 });

    // Click vào thẻ sản phẩm đầu tiên
    const firstListing = page.locator('a[id^="listing-card-"]').first();
    await firstListing.click();

    // Kiểm tra điều hướng vào trang chi tiết sản phẩm
    await expect(page).toHaveURL(/.*\/products\/[a-zA-Z0-9-]{36}/);
  });
});
