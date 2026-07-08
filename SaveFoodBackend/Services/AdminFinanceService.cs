using System;
using System.Threading.Tasks;
using SaveFoodBackend.Common;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Services;

public class AdminFinanceService : IAdminFinanceService
{
    private readonly IFinanceRepository _financeRepo;
    private readonly INotificationService _notifService;

    public AdminFinanceService(IFinanceRepository financeRepo, INotificationService notifService)
    {
        _financeRepo = financeRepo;
        _notifService = notifService;
    }

    public async Task<PaginatedList<WalletTransactionDTO>> GetTransactionsAsync(int pageNumber, int pageSize, string? search = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        var (items, totalCount) = await _financeRepo.GetTransactionsAsync(pageNumber, pageSize, search, startDate, endDate);
        return new PaginatedList<WalletTransactionDTO>(items.ToList(), totalCount, pageNumber, pageSize);
    }

    public async Task<PaginatedList<WithdrawalRequestDTO>> GetWithdrawalsAsync(int pageNumber, int pageSize, byte? status, string? search = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        var (items, totalCount) = await _financeRepo.GetWithdrawalsAsync(pageNumber, pageSize, status, search, startDate, endDate);
        return new PaginatedList<WithdrawalRequestDTO>(items.ToList(), totalCount, pageNumber, pageSize);
    }

    public async Task<PaginatedList<CustomerWalletTransactionAdminDTO>> GetCustomerWalletTransactionsAsync(int pageNumber, int pageSize, string? search = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        var (items, totalCount) = await _financeRepo.GetCustomerWalletTransactionsAsync(pageNumber, pageSize, search, startDate, endDate);
        return new PaginatedList<CustomerWalletTransactionAdminDTO>(items.ToList(), totalCount, pageNumber, pageSize);
    }
}
