namespace SaveFoodBackend.Common;

/// <summary>
/// Cấu trúc dữ liệu phân trang dùng chung cho tất cả API danh sách.
/// Tất cả endpoint GET (list) PHẢI trả về PaginatedList thay vì List thuần.
/// </summary>
public class PaginatedList<T>
{
    public IEnumerable<T> Items { get; }
    public int TotalCount { get; }
    public int PageNumber { get; }
    public int PageSize { get; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;

    public PaginatedList(IEnumerable<T> items, int totalCount, int pageNumber, int pageSize)
        => (Items, TotalCount, PageNumber, PageSize) = (items, totalCount, pageNumber, pageSize);

    /// <summary>
    /// Factory method tạo PaginatedList từ IQueryable (thực hiện truy vấn DB).
    /// Dùng trong Repository khi cần phân trang trực tiếp từ DB query.
    /// </summary>
    public static async Task<PaginatedList<T>> CreateAsync(
        IQueryable<T> query,
        int pageNumber,
        int pageSize,
        CancellationToken ct = default)
    {
        var totalCount = await Task.FromResult(query.Count());
        var items = await Task.FromResult(
            query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList()
        );
        return new PaginatedList<T>(items, totalCount, pageNumber, pageSize);
    }
}
