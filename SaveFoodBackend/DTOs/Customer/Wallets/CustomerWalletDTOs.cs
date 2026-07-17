using System;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Customer.Wallets;

public class CustomerWalletDTO
{
    public Guid Id { get; set; }
    public decimal Balance { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CustomerWalletTransactionDTO
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public byte Type { get; set; } // 0 = Deposit, 1 = Withdrawal, 2 = Payment, 3 = Refund
    public byte Status { get; set; } // 0 = Pending, 1 = Completed, 2 = Failed
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? OrderId { get; set; }
    public long? OrderCode { get; set; }
}

public class CustomerWithdrawRequest
{
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
}

public class TopUpRequest
{
    [Range(10000, 50000000, ErrorMessage = "Số tiền nạp phải từ 10,000đ đến 50,000,000đ")]
    public decimal Amount { get; set; }
}

public class TopUpResponse
{
    public string CheckoutUrl { get; set; } = string.Empty;
}

