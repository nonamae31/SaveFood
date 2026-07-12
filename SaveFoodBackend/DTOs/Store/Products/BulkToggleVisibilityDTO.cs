using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.Store.Products;

public class BulkToggleVisibilityDTO
{
    public IEnumerable<Guid> ProductIds { get; set; } = new List<Guid>();
    public bool IsHidden { get; set; }
}
