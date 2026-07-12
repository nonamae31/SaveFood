using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

class Program
{
    static void Main(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<SaveFoodDbContext>();
        optionsBuilder.UseSqlServer("Server=localhost;Database=SaveFoodDB_MVP;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true;");
        
        using var db = new SaveFoodDbContext(optionsBuilder.Options);
        
        var order = db.Orders.FirstOrDefault(o => o.OrderCode == 1783410826608);
        if (order != null) {
            Console.WriteLine("Order exists! ID = " + order.Id);
        } else {
            Console.WriteLine("Order DOES NOT EXIST in DB!");
        }

        var storeWithMai = db.Stores.FirstOrDefault(s => EF.Functions.Collate(s.Name, "Vietnamese_CI_AI").Contains("mai"));
        if (storeWithMai != null) {
            Console.WriteLine("Store with mai exists! Name = " + storeWithMai.Name);
        } else {
            Console.WriteLine("Store DOES NOT EXIST!");
        }
        
        var userWithMai = db.Users.FirstOrDefault(u => EF.Functions.Collate(u.FullName, "Vietnamese_CI_AI").Contains("mai"));
        if (userWithMai != null) {
            Console.WriteLine("User with mai exists! FullName = " + userWithMai.FullName);
        } else {
            Console.WriteLine("User DOES NOT EXIST!");
        }
    }
}
