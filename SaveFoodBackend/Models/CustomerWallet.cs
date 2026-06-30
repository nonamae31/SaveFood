using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class CustomerWallet
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public decimal Balance { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
    public virtual ICollection<CustomerWalletTransaction> CustomerWalletTransactions { get; set; } = new List<CustomerWalletTransaction>();
}
