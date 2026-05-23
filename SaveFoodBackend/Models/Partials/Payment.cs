using System.ComponentModel.DataAnnotations.Schema;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Models;

public partial class Payment
{
    [NotMapped]
    public PaymentMethodEnum PaymentMethodEnum
    {
        get => (PaymentMethodEnum)PaymentMethod;
        set => PaymentMethod = (byte)value;
    }

    [NotMapped]
    public PaymentStatusEnum StatusEnum
    {
        get => (PaymentStatusEnum)Status;
        set => Status = (byte)value;
    }
}
