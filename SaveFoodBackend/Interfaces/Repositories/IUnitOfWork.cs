using System;
using System.Data;
using System.Threading;
using System.Threading.Tasks;

namespace SaveFoodBackend.Interfaces.Repositories;

public interface IUnitOfWork : IDisposable
{
    Task BeginTransactionAsync(IsolationLevel isolationLevel = IsolationLevel.ReadCommitted, CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
