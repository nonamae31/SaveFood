using SaveFoodBackend.Data;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Repositories
{
    public class ProductRepository(SaveFoodDbContext ctx) : BaseRepository<Product>(ctx), IProductRepository
    {
    }
}
