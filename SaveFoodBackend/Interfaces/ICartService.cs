using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Customer.Carts;

namespace SaveFoodBackend.Interfaces;

public interface ICartService
{
    Task<IEnumerable<CartItemDTO>> GetMyCartAsync(Guid userId, CancellationToken ct = default);
    Task<CartItemDTO> AddToCartAsync(Guid userId, AddToCartRequestDTO req, CancellationToken ct = default);
    Task<CartItemDTO> UpdateCartItemAsync(Guid userId, Guid cartItemId, UpdateCartItemRequestDTO req, CancellationToken ct = default);
    Task RemoveFromCartAsync(Guid userId, Guid cartItemId, CancellationToken ct = default);
}
