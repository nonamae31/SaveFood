using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Carts;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Services;

public class CartService : ICartService
{
    private readonly SaveFoodDbContext _ctx;

    public CartService(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<IEnumerable<CartItemDTO>> GetMyCartAsync(Guid userId, CancellationToken ct = default)
    {
        var cart = await GetOrCreateCartAsync(userId, ct);

        return cart.CartItems.Select(MapToDTO).ToList();
    }

    public async Task<CartItemDTO> AddToCartAsync(Guid userId, AddToCartRequestDTO req, CancellationToken ct = default)
    {
        var cart = await GetOrCreateCartAsync(userId, ct);

        // Check if listing exists and is available
        var listing = await _ctx.ClearanceListings
            .Include(l => l.Product)
                .ThenInclude(p => p.Store)
                    .ThenInclude(s => s.StoreStaffs)
            .Include(l => l.ListingImages)
            .FirstOrDefaultAsync(l => l.Id == req.ListingId, ct);

        if (listing == null)
            throw new Exception("Sản phẩm không tồn tại.");

        if (listing.Product.Store.Status != (byte)SaveFoodBackend.Models.Enums.StoreStatus.Active)
            throw new Exception("Cửa hàng hiện đang tạm đóng cửa.");

        if (listing.Product.Store.StoreStaffs.Any(s => s.UserId == userId))
            throw new Exception("Bạn không thể mua hàng từ cửa hàng của chính mình.");

        if (listing.QuantityAvailable <= 0)
            throw new Exception("Sản phẩm đã hết hàng.");
            
        if (listing.ExpiryDate <= DateTime.UtcNow)
            throw new Exception("Sản phẩm đã hết hạn.");

        // Check if item already in cart
        var existingItem = cart.CartItems.FirstOrDefault(ci => ci.ListingId == req.ListingId);

        if (existingItem != null)
        {
            var newQuantity = existingItem.Quantity + req.Quantity;
            if (newQuantity > listing.QuantityAvailable)
                throw new Exception($"Chỉ còn {listing.QuantityAvailable} sản phẩm trong kho.");

            existingItem.Quantity = newQuantity;
            await _ctx.SaveChangesAsync(ct);
            return MapToDTO(existingItem);
        }
        else
        {
            if (req.Quantity > listing.QuantityAvailable)
                throw new Exception($"Chỉ còn {listing.QuantityAvailable} sản phẩm trong kho.");

            var newItem = new CartItem
            {
                Id = Guid.NewGuid(),
                CartId = cart.Id,
                ListingId = req.ListingId,
                Quantity = req.Quantity
            };

            _ctx.CartItems.Add(newItem);
            await _ctx.SaveChangesAsync(ct);
            
            newItem.Listing = listing; // Set sau khi save để map DTO
            return MapToDTO(newItem);
        }
    }

    public async Task<CartItemDTO> UpdateCartItemAsync(Guid userId, Guid cartItemId, UpdateCartItemRequestDTO req, CancellationToken ct = default)
    {
        var cart = await GetOrCreateCartAsync(userId, ct);
        
        var cartItem = cart.CartItems.FirstOrDefault(ci => ci.Id == cartItemId);
        if (cartItem == null)
            throw new Exception("Không tìm thấy sản phẩm trong giỏ hàng.");

        if (req.Quantity > cartItem.Listing.QuantityAvailable)
            throw new Exception($"Chỉ còn {cartItem.Listing.QuantityAvailable} sản phẩm trong kho.");

        cartItem.Quantity = req.Quantity;
        await _ctx.SaveChangesAsync(ct);

        return MapToDTO(cartItem);
    }

    public async Task RemoveFromCartAsync(Guid userId, Guid cartItemId, CancellationToken ct = default)
    {
        var cart = await GetOrCreateCartAsync(userId, ct);
        
        var cartItem = cart.CartItems.FirstOrDefault(ci => ci.Id == cartItemId);
        if (cartItem != null)
        {
            _ctx.CartItems.Remove(cartItem);
            await _ctx.SaveChangesAsync(ct);
        }
    }

    private async Task<Cart> GetOrCreateCartAsync(Guid userId, CancellationToken ct)
    {
        var cart = await _ctx.Carts
            .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Listing)
                    .ThenInclude(l => l.Product)
                        .ThenInclude(p => p.Store)
            .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Listing)
                    .ThenInclude(l => l.Product)
                        .ThenInclude(p => p.ProductImages)
            .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Listing)
                    .ThenInclude(l => l.ListingImages)
            .FirstOrDefaultAsync(c => c.UserId == userId, ct);

        if (cart == null)
        {
            cart = new Cart
            {
                Id = Guid.NewGuid(),
                UserId = userId
            };
            _ctx.Carts.Add(cart);
            await _ctx.SaveChangesAsync(ct);
        }

        return cart;
    }

    private static CartItemDTO MapToDTO(CartItem item)
    {
        var listing = item.Listing;
        var imageUrl = listing.ListingImages?.FirstOrDefault()?.ImageUrl 
                       ?? listing.Product.ProductImages?.FirstOrDefault()?.ImageUrl;
        
        return new CartItemDTO
        {
            Id = item.Id,
            ListingId = item.ListingId,
            Title = listing.Title,
            ImageUrl = imageUrl,
            SalePrice = listing.SalePrice,
            OriginalPrice = listing.Product.OriginalPrice,
            StoreId = listing.Product.StoreId,
            StoreName = listing.Product.Store.Name,
            StoreLatitude = listing.Product.Store.Latitude,
            StoreLongitude = listing.Product.Store.Longitude,
            Quantity = item.Quantity,
            AvailableQuantity = listing.QuantityAvailable,
            ExpiryDate = listing.ExpiryDate
        };
    }
}
