import { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, User, Store, ShoppingBag, Package, Loader2, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS, QUERY_KEYS, ROUTES } from '@/lib/constants';

interface SearchResults {
  users: Array<{ id: string; fullName: string; email: string; status: number }>;
  stores: Array<{ id: string; name: string; addressLine: string; status: number }>;
  orders: Array<{ id: string; orderCode: number | null; storeName: string; totalAmount: number; status: number }>;
  finance: Array<{ id: string; type: string; entityName: string; amount: number; status: number }>;
  categories: Array<{ id: string; name: string; status: number }>;
}

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const navigate = useNavigate();

  // Handle Ctrl+K
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

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data, isLoading } = useQuery<SearchResults>({
    queryKey: QUERY_KEYS.admin.search(debouncedValue),
    queryFn: async () => {
      if (!debouncedValue.trim()) {
        return { users: [], stores: [], orders: [], finance: [], categories: [] };
      }
      const res = await apiClient<SearchResults>(`${API_ENDPOINTS.ADMIN_GLOBAL_SEARCH}?keyword=${encodeURIComponent(debouncedValue)}`);
      return res;
    },
    enabled: open && debouncedValue.trim().length > 0,
  });

  const onSelect = useCallback((url: string) => {
    setOpen(false);
    navigate(url);
  }, [navigate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[10vh]" onClick={() => setOpen(false)}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Global Command Menu" shouldFilter={false}>
          <div className="flex items-center border-b border-gray-100 px-3 py-2">
            <Search className="w-5 h-5 text-gray-400 shrink-0 mr-2" />
            <Command.Input 
              value={inputValue}
              onValueChange={setInputValue}
              placeholder="Tìm kiếm người dùng, cửa hàng, đơn hàng, tài chính, danh mục... (Ctrl+K)" 
              className="flex-1 bg-transparent py-3 outline-none placeholder:text-gray-400 text-gray-900 border-none focus:ring-0"
              autoFocus
            />
            {isLoading && <Loader2 className="animate-spin text-gray-400 mr-2" size={18} />}
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {!isLoading && debouncedValue && data?.users.length === 0 && data?.stores.length === 0 && data?.orders.length === 0 && data?.finance.length === 0 && data?.categories.length === 0 && (
              <Command.Empty className="py-6 text-center text-sm text-gray-500">Không tìm thấy kết quả nào.</Command.Empty>
            )}

            {data?.users && data.users.length > 0 && (
              <Command.Group heading="Người dùng" className="px-2 py-1 text-xs font-semibold text-gray-500">
                {data.users.map((user) => (
                  <Command.Item 
                    key={user.id} 
                    onSelect={async () => {
                      try {
                        const res = await apiClient<any>(`/admin/search/locate?type=user&id=${user.id}&pageSize=10`);
                        if (res.found) {
                          const query = new URLSearchParams({
                            pageNumber: res.pageNumber.toString(),
                            highlightId: res.highlightId
                          }).toString();
                          onSelect(`${ROUTES.ADMIN_ACCOUNTS}?${query}`);
                        } else {
                          onSelect(`${ROUTES.ADMIN_ACCOUNTS}?search=${encodeURIComponent(user.email)}`);
                        }
                      } catch (err) {
                        onSelect(`${ROUTES.ADMIN_ACCOUNTS}?search=${encodeURIComponent(user.email)}`);
                      }
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-900 rounded-lg cursor-pointer data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700 outline-none hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <User size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700">{user.fullName}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {data?.stores && data.stores.length > 0 && (
              <Command.Group heading="Cửa hàng" className="px-2 py-1 text-xs font-semibold text-gray-500 mt-2">
                {data.stores.map((store) => (
                  <Command.Item 
                    key={store.id}
                    onSelect={async () => {
                      try {
                        const res = await apiClient<any>(`/admin/search/locate?type=store&id=${store.id}&pageSize=10`);
                        if (res.found) {
                          const query = new URLSearchParams({
                            page: res.pageNumber.toString(),
                            highlightId: res.highlightId
                          }).toString();
                          onSelect(`${ROUTES.ADMIN_APPROVALS}?${query}`);
                        } else {
                          onSelect(`${ROUTES.ADMIN_APPROVALS}?search=${encodeURIComponent(store.name)}`);
                        }
                      } catch (err) {
                        onSelect(`${ROUTES.ADMIN_APPROVALS}?search=${encodeURIComponent(store.name)}`);
                      }
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-900 rounded-lg cursor-pointer data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700 outline-none hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                      <Store size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700">{store.name}</span>
                      <span className="text-xs text-gray-500 truncate">{store.addressLine}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {data?.orders && data.orders.length > 0 && (
              <Command.Group heading="Đơn hàng / Kiểm toán" className="px-2 py-1 text-xs font-semibold text-gray-500 mt-2">
                {data.orders.map((order) => (
                  <Command.Item 
                    key={order.id}
                    onSelect={async () => {
                      if (!order.orderCode) {
                        onSelect(ROUTES.ADMIN_AUDIT);
                        return;
                      }
                      try {
                        const res = await apiClient<any>(`/admin/search/locate?type=order&id=${order.orderCode}&pageSize=50`);
                        if (res.found) {
                          const query = new URLSearchParams({
                            page: res.pageNumber.toString(),
                            highlightId: res.highlightId,
                            expanded: res.expandedDateRange ? 'true' : 'false',
                            from: res.effectiveFromDate ? new Date(res.effectiveFromDate).toISOString().split('T')[0] : '',
                            to: res.effectiveToDate ? new Date(res.effectiveToDate).toISOString().split('T')[0] : ''
                          }).toString();
                          onSelect(`${ROUTES.ADMIN_AUDIT}?${query}`);
                        } else {
                          onSelect(ROUTES.ADMIN_AUDIT);
                        }
                      } catch (err) {
                        onSelect(ROUTES.ADMIN_AUDIT);
                      }
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-900 rounded-lg cursor-pointer data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700 outline-none hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <ShoppingBag size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700">Đơn hàng #{order.orderCode}</span>
                      <span className="text-xs text-gray-500">{order.storeName} - {order.totalAmount.toLocaleString()}đ</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {data?.finance && data.finance.length > 0 && (
              <Command.Group heading="Tài chính" className="px-2 py-1 text-xs font-semibold text-gray-500 mt-2">
                {data.finance.map((fin) => (
                  <Command.Item 
                    key={fin.id}
                    onSelect={async () => {
                      try {
                        const res = await apiClient<any>(`/admin/search/locate?type=${fin.type}&id=${fin.id}&pageSize=15`);
                        if (res.found) {
                          const tab = fin.type === 'withdrawal' ? 'withdrawals' 
                                    : (fin.type === 'customer_wallet_transaction' ? 'customer-wallets' : 'ledger');
                          const query = new URLSearchParams({
                            tab: tab,
                            page: res.pageNumber.toString(),
                            highlightId: res.highlightId,
                            expanded: res.expandedDateRange ? 'true' : 'false',
                            from: res.effectiveFromDate ? new Date(res.effectiveFromDate).toISOString().split('T')[0] : '',
                            to: res.effectiveToDate ? new Date(res.effectiveToDate).toISOString().split('T')[0] : ''
                          });
                          if (res.statusFilter && res.statusFilter !== 'all') {
                             query.set('statusFilter', res.statusFilter);
                          }
                          onSelect(`${ROUTES.ADMIN_FINANCE}?${query.toString()}`);
                        } else {
                          onSelect(ROUTES.ADMIN_FINANCE);
                        }
                      } catch (err) {
                        onSelect(ROUTES.ADMIN_FINANCE);
                      }
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-900 rounded-lg cursor-pointer data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700 outline-none hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <Package size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700">{fin.type === 'withdrawal' ? 'Yêu cầu rút tiền' : 'Giao dịch ví'}</span>
                      <span className="text-xs text-gray-500">{fin.entityName} - {fin.amount.toLocaleString()}đ</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {data?.categories && data.categories.length > 0 && (
              <Command.Group heading="Danh mục" className="px-2 py-1 text-xs font-semibold text-gray-500 mt-2">
                {data.categories.map((cat) => (
                  <Command.Item 
                    key={cat.id}
                    onSelect={() => {
                      // Categories không phân trang nên FE chỉ việc scroll
                      onSelect(`${ROUTES.ADMIN_CATEGORIES}?highlightId=${cat.id}`);
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-900 rounded-lg cursor-pointer data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700 outline-none hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
                      <Package size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700">{cat.name}</span>
                      <span className="text-xs text-gray-500 truncate">{cat.status === 1 ? 'Hoạt động' : 'Đã xóa'}</span>
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
