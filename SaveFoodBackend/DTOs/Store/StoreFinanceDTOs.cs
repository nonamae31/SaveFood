using System;
using System.ComponentModel.DataAnnotations;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.DTOs.Store;

public class StoreWalletDTO
{
    public Guid Id { get; set; }
    public decimal AvailableBalance { get; set; }
    public decimal PendingBalance { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class WalletTransactionListDTO
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public TransactionTypeEnum Type { get; set; }
    public TransactionStatusEnum Status { get; set; }
    public Guid? OrderId { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WithdrawalRequestListDTO
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public WithdrawalStatusEnum Status { get; set; }
    public string BankName { get; set; } = null!;
    public string BankAccountNumber { get; set; } = null!;
    public string BankAccountName { get; set; } = null!;
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public class CreateWithdrawalRequestDTO
{
    [Required]
    [Range(50000, 1000000000, ErrorMessage = "Amount must be at least 50,000.")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Bank Name is required")]
    [MaxLength(100)]
    public string BankName { get; set; } = null!;

    [Required(ErrorMessage = "Bank Account Number is required")]
    [MaxLength(50)]
    public string BankAccountNumber { get; set; } = null!;

    [Required(ErrorMessage = "Bank Account Name is required")]
    [MaxLength(100)]
    public string BankAccountName { get; set; } = null!;
}
