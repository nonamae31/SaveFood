import re

file_path = r'd:\blackmyth\folder3\session8\prn232\project\SaveFood\SaveFoodBackend\Repositories\StoreStaffRepository.cs'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_method = """        public async Task<StoreStaff?> GetFirstStoreStaffByUserIdAsync(Guid userId, CancellationToken ct = default)
        {
            return await _dbSet.AsNoTracking().FirstOrDefaultAsync(ss => ss.UserId == userId, ct);
        }
    }
}"""

content = content.replace('    }\n}', new_method)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
