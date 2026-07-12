import { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, User, Store, ShoppingBag, Package, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS, QUERY_KEYS, ROUTES } from '@/lib/constants';

interface SearchResults {
  users: Array<{ id: string; fullName: string; email: string; status: number }>;
  stores: Array<{ id: string; name: string; addressLine: string; status: number }>;
  orders: Array<{ id: string; orderCode: number | null; storeName: string; totalAmount: number; status: number }>;
  products: Array<{ id: string; title: string; storeName: string; salePrice: number; status: number }>;
}

export function CommandPalette() {
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
        return { users: [], stores: [], orders: [], products: [] };
      }
      const res = await apiClient.get<SearchResults>(API_ENDPOINTS.ADMIN_GLOBAL_SEARCH, {
        params: { keyword: debouncedValue }
      });
      return res.data;
    },
    enabled: open && debouncedValue.trim().length > 0,
  });

  const onSelect = useCallback((url: string) => {
    setOpen(false);
    navigate(url);
  }, [navigate]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Search"
      className="fixed inset-0 z-[9999] flex justify-center p-4 pt-[10vh] bg-black/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 h-[min(calc(100vh-20vh),600px)]">
        <div className="flex items-center border-b border-gray-100 px-3 py-2 text-brand-600 focus-within:ring-2 focus-within:ring-brand-500">
          <Search className="mr-2 shrink-0 opacity-50" size={20} />
          <Command.Input 
            value={inputValue}
            onValueChange={setInputValue}
            placeholder="Search users, stores, orders, products... (Ctrl+K)" 
            className="flex-1 bg-transparent py-3 outline-none placeholder:text-gray-400 text-gray-900 border-none focus:ring-0"
          />
          {isLoading && <Loader2 className="animate-spin text-gray-400 ml-2" size={18} />}
        </div>

        <Command.List className="overflow-y-auto p-2">
          {!isLoading && debouncedValue && data?.users.length === 0 && data?.stores.length === 0 && data?.orders.length === 0 && data?.products.length === 0 && (
            <Command.Empty className="py-6 text-center text-sm text-gray-500">No results found.</Command.Empty>
          )}

          {data?.users && data.users.length > 0 && (
            <Command.Group heading="Users" className="text-sm font-medium text-gray-500 mb-2 px-2 py-1">
              {data.users.map((user) => (
                <Command.Item 
                  key={user.id} 
                  onSelect={() => onSelect(`/admin/accounts?search=${encodeURIComponent(user.email)}`)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-900 rounded-lg cursor-pointer data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700 outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <User size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user.fullName}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {data?.stores && data.stores.length > 0 && (
            <Command.Group heading="Stores" className="text-sm font-medium text-gray-500 mb-2 mt-4 px-2 py-1">
              {data.stores.map((store) => (
                <Command.Item 
                  key={store.id}
                  onSelect={() => onSelect(ROUTES.STORE(store.id))}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-900 rounded-lg cursor-pointer data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700 outline-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <Store size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">{store.name}</span>
                    <span className="text-xs text-gray-500 truncate">{store.addressLine}</span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {data?.products && data.products.length > 0 && (
            <Command.Group heading="Products (Listings)" className="text-sm font-medium text-gray-500 mb-2 mt-4 px-2 py-1">
              {data.products.map((product) => (
                <Command.Item 
                  key={product.id}
                  onSelect={() => onSelect(ROUTES.PRODUCT_DETAIL(product.id))}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-900 rounded-lg cursor-pointer data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700 outline-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <Package size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">{product.title}</span>
                    <span className="text-xs text-gray-500">{product.storeName} - {product.salePrice.toLocaleString()}đ</span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {data?.orders && data.orders.length > 0 && (
            <Command.Group heading="Orders" className="text-sm font-medium text-gray-500 mb-2 mt-4 px-2 py-1">
              {data.orders.map((order) => (
                <Command.Item 
                  key={order.id}
                  onSelect={() => onSelect(ROUTES.ORDER_DETAIL(order.id))}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-900 rounded-lg cursor-pointer data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700 outline-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <ShoppingBag size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">Order #{order.orderCode}</span>
                    <span className="text-xs text-gray-500">{order.storeName} - {order.totalAmount.toLocaleString()}đ</span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
