import re

file_path = r'd:\blackmyth\folder3\session8\prn232\project\SaveFood\SaveFoodBackend\Services\UserService.cs'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('using Microsoft.EntityFrameworkCore;\n', '')
content = content.replace('using SaveFoodBackend.Data;\n', '')

content = content.replace('private readonly SaveFoodDbContext _context;', 'private readonly IUserRepository _userRepo;\n        private readonly IStoreStaffRepository _storeStaffRepo;')
content = content.replace('UserService(SaveFoodDbContext context,', 'UserService(IUserRepository userRepo, IStoreStaffRepository storeStaffRepo,')
content = content.replace('_context = context;', '_userRepo = userRepo;\n            _storeStaffRepo = storeStaffRepo;')

# GetProfileAsync
old_getprofile = """            var user = await _context.Users
                .AsNoTracking()
                .AsSplitQuery()
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);"""
content = content.replace(old_getprofile, "            var user = await _userRepo.GetByIdAsync(userId);")
content = content.replace('var storeStaff = await _context.StoreStaffs.AsNoTracking().FirstOrDefaultAsync(ss => ss.UserId == userId);', 'var storeStaff = await _storeStaffRepo.GetFirstStoreStaffByUserIdAsync(userId);')

# ChangePasswordAsync
content = content.replace('var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);', 'var user = await _userRepo.GetByIdAsync(userId);')
# In ChangePasswordAsync, UpdateProfileAsync, UpdateLocationAsync, it uses await _context.SaveChangesAsync();
content = content.replace('await _context.SaveChangesAsync();', '_userRepo.Update(user);\n            await _userRepo.SaveChangesAsync();')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
