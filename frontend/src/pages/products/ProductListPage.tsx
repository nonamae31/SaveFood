// ─── ProductListPage ─────────────────────────────────────────────────────────
// Route: /products
// Trang duyệt Clearance Listings cho Customer (Người 3).

import { useState } from 'react'
import { Leaf, Sparkles, RefreshCw } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ListingCard } from '@/components/listings/ListingCard'
import { ListingFilters } from '@/components/listings/ListingFilters'
import { useListings, useRecommendations } from '@/hooks/useListings'
import { useAuthContext } from '@/contexts/AuthContext'
import type { ListingFilter } from '@/types/listing.types'

export function ProductListPage() {
  const [filter, setFilter] = useState<ListingFilter>({})
  const { isAuthenticated } = useAuthContext()

  const {
    data: listings,
    isLoading,
    isError,
    error,
    refetch,
  } = useListings(filter)

  const {
    data: recommendations,
    isLoading: isRecsLoading,
  } = useRecommendations()

  const showRecs = isAuthenticated && !isRecsLoading && recommendations && recommendations.length > 0

  return (
    <div className="min-h-screen bg-[--color-surface-subtle] flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero Banner ── */}
        <section className="bg-gradient-to-br from-[--color-brand-600] to-[--color-brand-800] text-white">
          <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-[--radius-button] bg-white/20 flex items-center justify-center">
                <Leaf size={20} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <span className="text-[--text-body-sm] font-semibold uppercase tracking-wider text-white/80">
                SaveFood
              </span>
            </div>
            <h1 className="text-[--text-heading-xl] font-bold font-[--font-display] mb-2 leading-tight">
              Đồ ăn cận date
            </h1>
            <p className="text-[--text-body-md] text-white/80 max-w-xl">
              Tiết kiệm đến <strong className="text-white">70%</strong> cho thực phẩm sắp hết hạn từ các cửa hàng uy tín — vừa tiết kiệm, vừa bảo vệ môi trường.
            </p>
          </div>
        </section>

        <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* ── Gợi ý cá nhân hóa (chỉ hiển thị khi đã login và có data) ── */}
          {showRecs && (
            <section aria-labelledby="recommendations-heading">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-[--color-brand-600]" aria-hidden="true" />
                <h2
                  id="recommendations-heading"
                  className="text-[--text-heading-sm] font-bold text-[--color-ink-primary]"
                >
                  Gợi ý cho bạn
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recommendations.slice(0, 4).map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          {/* ── Filter Bar ── */}
          <ListingFilters
            filter={filter}
            onChange={setFilter}
            totalCount={listings?.length}
          />

          {/* ── Lưới sản phẩm ── */}
          <section aria-labelledby="listings-heading">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="listings-heading"
                className="text-[--text-heading-sm] font-bold text-[--color-ink-primary]"
              >
                Tất cả sản phẩm
              </h2>
              {!isLoading && !isError && (
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-1.5 text-[--text-body-sm] text-[--color-ink-secondary]
                             hover:text-[--color-ink-primary] transition-colors"
                  aria-label="Làm mới danh sách"
                >
                  <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
                  Làm mới
                </button>
              )}
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <SkeletonCard count={9} />
              </div>
            )}

            {/* Error */}
            {isError && !isLoading && (
              <ErrorState
                error={error}
                title="Không thể tải danh sách"
                onRetry={() => refetch()}
              />
            )}

            {/* Empty */}
            {!isLoading && !isError && listings && listings.length === 0 && (
              <EmptyState
                title="Không tìm thấy sản phẩm"
                description="Không có sản phẩm nào phù hợp với bộ lọc hiện tại. Hãy thử điều chỉnh tiêu chí lọc."
                action={
                  <button
                    onClick={() => setFilter({})}
                    className="px-4 py-2 rounded-[--radius-button] bg-[--color-brand-600] text-white
                               text-[--text-body-sm] font-semibold hover:bg-[--color-brand-700] transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                }
              />
            )}

            {/* Data */}
            {!isLoading && !isError && listings && listings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
