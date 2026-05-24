import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useGetWishlist, useRemoveWishlistItem } from '@/hooks/useWishlist';
import { Button } from '@/components/ui/Button';
import { HeartCrack, Store, Tag } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export function WishlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { data: wishlistItems, isLoading: wishlistLoading, isError } = useGetWishlist();
  const removeMutation = useRemoveWishlistItem();

  if (authLoading) {
    return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const handleRemove = (productId: string) => {
    if (confirm('Bạn có chắc muốn xóa món này khỏi danh sách yêu thích?')) {
      removeMutation.mutate(productId);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="max-w-[--spacing-container] mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-heading-xl font-display font-bold text-ink-primary">Danh sách yêu thích</h1>
        <p className="text-body-md text-ink-secondary mt-2">
          Các món ăn và thực phẩm bạn đã lưu để xem lại sau.
        </p>
      </div>

      {isError ? (
        <div className="p-8 text-center bg-red-50 text-expiry-urgent rounded-xl border border-red-100">
          <p>Không thể tải danh sách yêu thích. (Có thể Backend chưa thiết lập API này).</p>
        </div>
      ) : wishlistLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-muted rounded-2xl h-80 w-full"></div>
          ))}
        </div>
      ) : wishlistItems && wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.productId} className="bg-surface-base rounded-2xl shadow-card overflow-hidden border border-surface-border group flex flex-col">
              <div className="relative h-48 bg-surface-muted overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-tertiary">No image</div>
                )}
                <div className="absolute top-3 left-3 bg-brand-500 text-white text-caption font-bold px-2 py-1 rounded-md shadow-sm">
                  -{Math.round((1 - item.price / item.originalPrice) * 100)}%
                </div>
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-body-lg text-ink-primary mb-1 line-clamp-1">{item.productName}</h3>
                
                <div className="flex items-center gap-1.5 text-ink-secondary text-body-sm mb-3">
                  <Store className="w-4 h-4" />
                  <span className="line-clamp-1">{item.storeName}</span>
                </div>
                
                <div className="mt-auto pt-3 border-t border-surface-border flex items-center justify-between">
                  <div>
                    <div className="text-body-lg font-bold text-brand-600">{formatPrice(item.price)}</div>
                    <div className="text-caption text-ink-tertiary line-through">{formatPrice(item.originalPrice)}</div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleRemove(item.productId)}
                    className="text-expiry-urgent hover:bg-red-50 hover:border-red-200"
                    title="Xóa khỏi yêu thích"
                    isLoading={removeMutation.isPending && removeMutation.variables === item.productId}
                  >
                    <HeartCrack className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface-base rounded-2xl border border-surface-border border-dashed">
          <HeartCrack className="w-12 h-12 mx-auto text-ink-tertiary mb-4" />
          <h3 className="text-heading-sm font-bold text-ink-primary">Danh sách trống</h3>
          <p className="text-body-sm text-ink-secondary mt-1 max-w-sm mx-auto mb-6">
            Bạn chưa có sản phẩm nào trong danh sách yêu thích. Hãy tiếp tục khám phá nhé!
          </p>
          <Link to={ROUTES.PRODUCTS}>
            <Button>Khám phá đồ ăn</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
