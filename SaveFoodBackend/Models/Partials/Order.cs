using System.ComponentModel.DataAnnotations.Schema;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Models;

public partial class Order
{
    [NotMapped]
    public OrderStatusEnum OrderStatusEnum
    {
        get => (OrderStatusEnum)OrderStatus;
        set => OrderStatus = (byte)value;
    }
}
