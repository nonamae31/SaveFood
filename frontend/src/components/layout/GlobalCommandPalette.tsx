import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/api/admin.api';
import type { AdminUserListDTO, AdminStoreListDTO } from '@/api/admin.api';
import { Search, Store, User, X } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

// A simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  const [users, setUsers] = useState<AdminUserListDTO[]>([]);
  const [stores, setStores] = useState<AdminStoreListDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fetch data when debounced search changes
  const fetchSearchResults = useCallback(async (query: string) => {
    if (!query) {
      setUsers([]);
      setStores([]);
      return;
    }
    
    setLoading(true);
    try {
      const [usersRes, storesRes] = await Promise.all([
        adminApi.getUsers({ search: query, pageSize: 5 }),
        adminApi.getStores({ search: query, pageSize: 5 })
      ]);
      
      setUsers(usersRes.items || []);
      setStores(storesRes.items || []);
    } catch (error) {
      console.error('Failed to fetch search results:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSearchResults(debouncedSearch);
  }, [debouncedSearch, fetchSearchResults]);

  // Navigate and close
  const onSelectUser = (user: AdminUserListDTO) => {
    setOpen(false);
    setSearch('');
    // Chuyển hướng tới trang Quản lý User với query search là email
    navigate(`${ROUTES.ADMIN_ACCOUNTS}?search=${encodeURIComponent(user.email)}`);
  };

  const onSelectStore = (store: AdminStoreListDTO) => {
    setOpen(false);
    setSearch('');
    // Chuyển hướng tới trang Quản lý Store với query search là tên
    navigate(`${ROUTES.ADMIN_APPROVALS}?search=${encodeURIComponent(store.name)}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[10vh]" onClick={() => setOpen(false)}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Global Command Menu" shouldFilter={false}>
          <div className="flex items-center border-b border-gray-100 px-3">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <Command.Input 
              value={search}
              onValueChange={setSearch}
              placeholder="Tìm kiếm người dùng, cửa hàng... (Gõ để tìm trên máy chủ)" 
              className="flex-1 px-3 py-4 bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
            />
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {loading && <Command.Loading className="p-4 text-sm text-gray-500 text-center">Đang tìm kiếm...</Command.Loading>}
            {!loading && search && users.length === 0 && stores.length === 0 && (
              <Command.Empty className="p-4 text-sm text-gray-500 text-center">Không tìm thấy kết quả nào cho "{search}".</Command.Empty>
            )}

            {!loading && users.length > 0 && (
              <Command.Group heading="Người dùng" className="px-2 py-1 text-xs font-semibold text-gray-500">
                {users.map((user) => (
                  <Command.Item 
                    key={user.id} 
                    onSelect={() => onSelectUser(user)}
                    value={user.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium truncate">{user.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {!loading && stores.length > 0 && (
              <Command.Group heading="Cửa hàng" className="px-2 py-1 text-xs font-semibold text-gray-500 mt-2">
                {stores.map((store) => (
                  <Command.Item 
                    key={store.id} 
                    onSelect={() => onSelectStore(store)}
                    value={store.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900"
                  >
                    <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium truncate">{store.name}</p>
                      <p className="text-xs text-gray-500 truncate">{store.addressLine}</p>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
