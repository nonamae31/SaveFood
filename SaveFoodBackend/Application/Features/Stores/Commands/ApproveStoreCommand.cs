using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Application.Features.Stores.Commands;

public class ApproveStoreCommand : IRequest<Unit>
{
    public Guid StoreId { get; set; }
    public Guid AdminId { get; set; }
}

public class ApproveStoreCommandHandler : IRequestHandler<ApproveStoreCommand, Unit>
{
    private readonly IStoreRepository _storeRepo;
    private readonly IUserRepository _userRepo;
    private readonly IUnitOfWork _uow;

    public ApproveStoreCommandHandler(IStoreRepository storeRepo, IUserRepository userRepo, IUnitOfWork uow)
    {
        _storeRepo = storeRepo;
        _userRepo = userRepo;
        _uow = uow;
    }

    public async Task<Unit> Handle(ApproveStoreCommand request, CancellationToken cancellationToken)
    {
        var store = await _storeRepo.GetStoreWithStaffsAsync(request.StoreId);
        if (store == null)
        {
            throw new InvalidOperationException($"Store with ID {request.StoreId} not found.");
        }

        if (store.Status != (byte)StoreStatus.Pending)
        {
            throw new InvalidOperationException($"Only pending stores can be approved. Current status: {store.Status}");
        }

        store.Status = (byte)StoreStatus.Active;
        store.StoreFlags |= (byte)StoreFlagsEnum.IsVerified;

        var ownerStaff = store.StoreStaffs.FirstOrDefault(ss => ss.StaffRole == (byte)StaffRole.Owner);
        if (ownerStaff != null)
        {
            var storeRole = await _userRepo.GetRoleByCodeAsync("STORE");
            if (storeRole != null)
            {
                var hasRole = await _userRepo.HasUserRoleAsync(ownerStaff.UserId, storeRole.Id);
                if (!hasRole)
                {
                    _userRepo.AddUserRole(new UserRole
                    {
                        UserId = ownerStaff.UserId,
                        RoleId = storeRole.Id
                    });
                }
            }
        }

        await _uow.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
