using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using Microsoft.Extensions.DependencyInjection;

class Program
{
    static async System.Threading.Tasks.Task Main(string[] args)
    {
        var services = new ServiceCollection();
        services.AddDbContext<SaveFoodDbContext>(options =>
            options.UseSqlServer("Server=localhost;Database=SaveFoodDB_MVP;Trusted_Connection=True;TrustServerCertificate=True;"));
        var provider = services.BuildServiceProvider();
        var ctx = provider.GetRequiredService<SaveFoodDbContext>();

        long orderCode = 1782886140737;
        
        var order = await ctx.Orders.FirstOrDefaultAsync(o => o.OrderCode == orderCode);
        var payment = order != null ? await ctx.Payments.FirstOrDefaultAsync(p => p.OrderId == order.Id && p.Status == 1) : null;
        var sub = await ctx.StoreSubscriptions.FirstOrDefaultAsync(s => s.OrderCode == orderCode && s.Status == 1);

        Console.WriteLine($"Payment: {payment != null}");
        Console.WriteLine($"Sub: {sub != null}");

        if (payment == null && sub == null)
        {
            Console.WriteLine("Not found payment or sub");
            return;
        }

        var targetId = payment?.Id.ToString() ?? sub?.Id.ToString();
        var targetDate = payment?.PaidAt ?? payment?.CreatedAt ?? sub?.CreatedAt;
        Console.WriteLine($"targetId: {targetId}, targetDate: {targetDate}");
    }
}
