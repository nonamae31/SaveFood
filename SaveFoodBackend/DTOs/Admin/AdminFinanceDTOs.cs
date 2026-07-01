using System;

namespace SaveFoodBackend.DTOs.Admin;

public class WalletTransactionDTO
{
    public Guid Id { get; set; }
    public Guid StoreWalletId { get; set; }
    public string StoreName { get; set; } = null!;
    public decimal Amount { get; set; }
    public byte Type { get; set; }
    public byte Status { get; set; }
    public Guid? OrderId { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WithdrawalRequestDTO
{
    public Guid Id { get; set; }
    public Guid RequesterId { get; set; }
    public string RequesterName { get; set; } = null!;
    public string RequesterType { get; set; } = null!;
    public decimal Amount { get; set; }
    public byte Status { get; set; }
    public string BankName { get; set; } = null!;
    public string BankAccountNumber { get; set; } = null!;
    public string BankAccountName { get; set; } = null!;
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}



public class ProcessFinanceRequestDTO
{
    public bool IsApproved { get; set; }
    public string? AdminNote { get; set; }
}
