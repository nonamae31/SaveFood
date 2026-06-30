using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.Customer.Stores;

public class CustomerStoreDetailDTO : CustomerStoreDTO
{
    public string Phone { get; set; } = string.Empty;
    public string OpeningHours { get; set; } = string.Empty;
    public string CoverImage { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
