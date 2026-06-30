using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Application.Features.Finance.Commands;

public class ProcessWithdrawalCommand : IRequest<string>
{
    public Guid RequestId { get; set; }
    public Guid AdminId { get; set; }
    public bool IsApproved { get; set; }
    public string? AdminNote { get; set; }
}

public class ProcessWithdrawalCommandHandler : IRequestHandler<ProcessWithdrawalCommand, string>
{
    private readonly IFinanceRepository _financeRepo;
    private readonly IUnitOfWork _uow;
    private readonly INotificationService _notifService;

    public ProcessWithdrawalCommandHandler(IFinanceRepository financeRepo, IUnitOfWork uow, INotificationService notifService)
    {
        _financeRepo = financeRepo;
        _uow = uow;
        _notifService = notifService;
    }

    public async Task<string> Handle(ProcessWithdrawalCommand request, CancellationToken cancellationToken)
    {
        await _uow.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted, cancellationToken);
        try
        {
            var withdrawal = await _financeRepo.GetWithdrawalWithStoreWalletAsync(request.RequestId, cancellationToken);

            if (withdrawal == null) throw new InvalidOperationException("Withdrawal request not found.");
            if (withdrawal.Status != (byte)WithdrawalStatusEnum.Pending && withdrawal.Status != (byte)WithdrawalStatusEnum.Processing)
                throw new InvalidOperationException("Withdrawal request has already been processed.");

            withdrawal.AdminNote = request.AdminNote;
            withdrawal.ProcessedAt = DateTime.UtcNow;

            if (withdrawal.StoreId.HasValue)
            {
                var wallet = withdrawal.Store?.StoreWallet;
                if (wallet == null) throw new InvalidOperationException("Store wallet not found.");

                var pendingTx = await _financeRepo.GetPendingWalletTransactionByReferenceIdAsync(withdrawal.Id, cancellationToken);
                if (pendingTx == null) throw new InvalidOperationException("Pending store wallet transaction not found.");

                if (request.IsApproved)
                {
                    withdrawal.Status = (byte)WithdrawalStatusEnum.Paid;
                    pendingTx.Status = (byte)TransactionStatusEnum.Completed;
                    pendingTx.Description = "Withdrawal Processed";
                }
                else
                {
                    withdrawal.Status = (byte)WithdrawalStatusEnum.Rejected;
                    wallet.AvailableBalance += withdrawal.Amount;
                    pendingTx.Status = (byte)TransactionStatusEnum.Failed;
                    pendingTx.Description = "Rút tiền bị từ chối: " + request.AdminNote;

                    var refundTx = new WalletTransaction
                    {
                        Id = Guid.NewGuid(),
                        StoreWalletId = wallet.Id,
                        Amount = withdrawal.Amount,
                        Type = (byte)TransactionTypeEnum.Refund,
                        Status = (byte)TransactionStatusEnum.Completed,
                        ReferenceId = withdrawal.Id,
                        Description = "Hoàn tiền rút tiền bị từ chối: " + request.AdminNote,
                        CreatedAt = DateTime.UtcNow
                    };
                    _financeRepo.AddWalletTransaction(refundTx);
                }
            }
            else if (withdrawal.UserId.HasValue)
            {
                var customerWallet = withdrawal.User?.CustomerWallet;
                if (customerWallet == null) throw new InvalidOperationException("Customer wallet not found.");

                var pendingTx = await _financeRepo.GetPendingCustomerWalletTransactionByReferenceIdAsync(withdrawal.Id, cancellationToken);
                if (pendingTx == null) throw new InvalidOperationException("Pending customer wallet transaction not found.");

                if (request.IsApproved)
                {
                    withdrawal.Status = (byte)WithdrawalStatusEnum.Paid;
                    pendingTx.Status = 1; // Completed
                    pendingTx.Description = "Rút tiền thành công";
                }
                else
                {
                    withdrawal.Status = (byte)WithdrawalStatusEnum.Rejected;
                    customerWallet.Balance += withdrawal.Amount;
                    pendingTx.Status = 2; // Failed
                    pendingTx.Description = "Rút tiền bị từ chối: " + request.AdminNote;

                    var refundTx = new CustomerWalletTransaction
                    {
                        Id = Guid.NewGuid(),
                        CustomerWalletId = customerWallet.Id,
                        Amount = withdrawal.Amount,
                        Type = 3, // Refund
                        Status = 1, // Completed
                        ReferenceId = withdrawal.Id,
                        Description = "Hoàn tiền rút tiền bị từ chối: " + request.AdminNote,
                        CreatedAt = DateTime.UtcNow
                    };
                    _financeRepo.AddCustomerWalletTransaction(refundTx);
                }
            }
            else
            {
                throw new InvalidOperationException("Invalid withdrawal request type.");
            }

            await _uow.SaveChangesAsync(cancellationToken);
            await _uow.CommitTransactionAsync(cancellationToken);

            // Gửi thông báo cho user sau khi xử lý rút tiền
            Guid? recipientUserId = null;
            if (withdrawal.StoreId.HasValue)
            {
                var ownerStaff = withdrawal.Store?.StoreStaffs?.FirstOrDefault(s => s.StaffRole == 1 || s.StaffRole == 2);
                recipientUserId = ownerStaff?.UserId;
            }
            else if (withdrawal.UserId.HasValue)
            {
                recipientUserId = withdrawal.UserId;
            }

            if (recipientUserId.HasValue)
            {
                var title = request.IsApproved ? "Rút tiền thành công ✅" : "Yêu cầu rút tiền bị từ chối";
                var body = request.IsApproved
                    ? $"Yêu cầu rút {withdrawal.Amount:N0}₫ của bạn đã được xử lý thành công."
                    : $"Yêu cầu rút {withdrawal.Amount:N0}₫ đã bị từ chối. Lý do: {request.AdminNote} Số tiền đã được hoàn vào tài khoản.";
                await _notifService.SendAsync(recipientUserId.Value, title, body, "WITHDRAWAL_PROCESSED", withdrawal.Id);
            }

            return request.IsApproved ? "Withdrawal paid successfully." : "Withdrawal rejected.";
        }
        catch
        {
            await _uow.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }
}
