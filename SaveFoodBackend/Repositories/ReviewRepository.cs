using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Repositories
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly SaveFoodDbContext _context;
        private readonly DbSet<Review> _dbSet;

        public ReviewRepository(SaveFoodDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<Review>();
        }

        public async Task AddAsync(Review review, CancellationToken ct = default)
        {
            await _dbSet.AddAsync(review, ct);
        }

        public void Update(Review review)
        {
            _dbSet.Update(review);
        }

        public async Task SaveChangesAsync(CancellationToken ct = default)
        {
            await _context.SaveChangesAsync(ct);
        }

        public async Task<Review?> GetReviewWithImagesAsync(Guid reviewId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(r => r.ReviewImages)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi.Order)
                .FirstOrDefaultAsync(r => r.Id == reviewId && (r.ReviewFlags & (byte)ReviewFlagsEnum.IsDeleted) == 0, ct);
        }

        public async Task<Review?> GetReviewByOrderItemIdAsync(Guid orderItemId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(r => r.ReviewImages)
                .FirstOrDefaultAsync(r => r.OrderItemId == orderItemId, ct);
        }

        public async Task<IEnumerable<Review>> GetReviewsByListingIdAsync(Guid listingId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(r => r.ReviewImages)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi.Order)
                        .ThenInclude(o => o.User)
                .Where(r => r.OrderItem.ListingId == listingId && (r.ReviewFlags & (byte)ReviewFlagsEnum.IsDeleted) == 0)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Review>> GetReviewsByProductIdAsync(Guid productId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(r => r.ReviewImages)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi.Order)
                        .ThenInclude(o => o.User)
                .Include(r => r.OrderItem.Listing)
                .Where(r => r.OrderItem.Listing.ProductId == productId && (r.ReviewFlags & (byte)ReviewFlagsEnum.IsDeleted) == 0)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Review>> GetReviewsByStoreIdAsync(Guid storeId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(r => r.ReviewImages)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi.Order)
                        .ThenInclude(o => o.User)
                .Where(r => r.OrderItem.Order.StoreId == storeId && (r.ReviewFlags & (byte)ReviewFlagsEnum.IsDeleted) == 0)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(ct);
        }

        public async Task<OrderItem?> GetOrderItemWithOrderAsync(Guid orderItemId, CancellationToken ct = default)
        {
            return await _context.OrderItems
                .Include(oi => oi.Order)
                .FirstOrDefaultAsync(oi => oi.Id == orderItemId, ct);
        }

        public void RemoveReviewImages(IEnumerable<ReviewImage> images)
        {
            _context.ReviewImages.RemoveRange(images);
        }
    }
}
