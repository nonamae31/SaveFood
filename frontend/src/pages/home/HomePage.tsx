import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { useListings } from '@/hooks/useListings';
import { ListingCard } from '@/components/listings/ListingCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useAuthContext } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { GlobalSearchBar } from '@/components/ui/search/GlobalSearchBar';

export function HomePage() {
  const { data: listings, isLoading, isError } = useListings();
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  const handlePartnerClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.error('Bạn cần đăng nhập để trở thành đối tác!');
      navigate(ROUTES.LOGIN, { state: { from: ROUTES.STORE_REGISTER } });
    }
  };

  return (
    <div className="bg-[--color-surface-base] min-h-screen">
      {/* 1. Cinematic Hero Section (Light Theme) */}
      <section className="relative overflow-hidden bg-[#111814] min-h-screen flex flex-col items-center justify-center text-center px-6 group">

        {/* Background Video Layer */}
        <video
          src="/hero.mp4"
          className="absolute inset-0 w-full h-full object-cover object-left md:object-center z-0 animate-fade-rise"
          muted
          autoPlay
          loop
          playsInline
        />

        {/* Gradient Overlays */}
        {/* Left-to-right gradient to make text readable while preserving right-side visuals */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#111814]/80 via-[#111814]/40 to-transparent z-0 pointer-events-none"></div>
        {/* Top gradient for Navbar visibility */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#111814]/60 to-transparent z-0 pointer-events-none"></div>
        {/* Bottom fade to blend with the next section */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[--color-surface-base] to-transparent z-0 pointer-events-none"></div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-[--spacing-container] mx-auto w-full px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-start pt-24 pb-20">

          <div className="w-full md:w-2/3 lg:w-[60%] flex flex-col items-start text-left animate-fade-rise">
            {/* Elegant Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-white/70 text-sm font-medium mb-8">
              <svg className="w-4 h-4 text-[#8ced7f]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Cùng nhau giảm lãng phí thực phẩm
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-[4.5rem] font-bold font-[--font-display] text-white leading-[1.1] tracking-tight text-left w-full">
              Một bữa ăn<br />
              được cứu <span className="text-[#8ced7f]">là một</span><br />
              <span className="text-[#8ced7f]">tương lai xanh hơn</span>
            </h1>

            <p className="text-base sm:text-lg text-white/70 mt-6 leading-relaxed max-w-sm text-left">
              Hàng ngàn món ăn chất lượng đang chờ được thưởng thức thay vì bị bỏ phí.
            </p>

            <GlobalSearchBar variant="hero" />

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-10 w-full sm:w-auto self-start">
              <Link
                to={ROUTES.PRODUCTS}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full px-6 py-3.5 text-base font-bold bg-[#8ced7f] text-[#0f2913] hover:scale-105 hover:bg-[#7bde6c] transition-all duration-300 group"
              >
                <div className="bg-[#0f2913] text-[#8ced7f] rounded-full p-1 border border-[#8ced7f]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                Cứu món ăn ngay
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
              <Link
                to={ROUTES.STORES}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full px-6 py-3.5 text-base font-bold bg-white/5 border border-white/20 text-white hover:bg-white/10 hover:scale-105 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                Bắt đầu khám phá
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Deals */}
      <section className="py-16 md:py-24 bg-[--color-brand-50]">
        <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 shadow-sm"></div>
                <span className="text-sm font-medium text-[--color-brand-600] uppercase tracking-wider">Ưu đãi hôm nay</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-[--font-display] text-[--color-ink-primary] leading-tight">
                Giải cứu ngay, <span className="font-[--font-display] italic font-normal text-[--color-brand-600]">tiết kiệm ngay</span>
              </h2>
              <p className="text-[--color-ink-secondary] mt-3 max-w-md">Nhanh tay cứu những phần ăn hấp dẫn nhất trước khi hết hạn.</p>
            </div>
            <Link
              to={ROUTES.PRODUCTS}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold border border-[--color-brand-500] text-[--color-brand-600] hover:bg-[--color-brand-500] hover:text-white transition-all duration-300 whitespace-nowrap group w-full sm:w-auto"
            >
              Xem tất cả
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {isLoading ? (
              <SkeletonCard count={4} />
            ) : isError || !listings || listings.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[--color-ink-secondary]">
                Hiện tại chưa có ưu đãi nào. Hãy quay lại sau nhé!
              </div>
            ) : (
              listings.slice(0, 4).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* 3. How It Works */}
      <section className="py-16 md:py-28 bg-[--color-surface-base] relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        <div className="relative max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 shadow-sm"></div>
              <span className="text-sm font-medium text-[--color-brand-600] uppercase tracking-wider">Quy trình</span>
              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 shadow-sm"></div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-[--font-display] text-[--color-ink-primary]">
              Đơn giản như <span className="text-[--color-brand-600]">1, 2, 3</span>
            </h2>
          </div>

          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-8 relative overflow-x-auto md:overflow-visible pb-6 md:pb-0 hide-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-[--color-brand-200] via-[--color-brand-400] to-[--color-brand-200] z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center group min-w-[260px] md:min-w-0 snap-center bg-white md:bg-transparent p-6 md:p-0 rounded-3xl md:rounded-none shadow-sm md:shadow-none border border-gray-100 md:border-none">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[--color-brand-50] border-2 border-[--color-brand-200] rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:bg-[--color-brand-100] transition-all duration-300 shadow-sm shrink-0">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-[--color-brand-600]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <span className="text-[--color-brand-500] font-medium text-base md:text-lg mb-1">Bước 1</span>
              <h3 className="font-bold text-lg md:text-xl text-[--color-ink-primary] font-[--font-display] mb-2">Khám phá</h3>
              <p className="text-[--color-ink-secondary] text-sm leading-relaxed max-w-[200px] md:max-w-xs mx-auto">Tìm kiếm các món ăn hoặc túi bất ngờ đang được giảm giá gần bạn.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center group min-w-[260px] md:min-w-0 snap-center bg-white md:bg-transparent p-6 md:p-0 rounded-3xl md:rounded-none shadow-sm md:shadow-none border border-gray-100 md:border-none">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[--color-brand-50] border-2 border-[--color-brand-200] rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:bg-[--color-brand-100] transition-all duration-300 shadow-sm shrink-0">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-[--color-brand-600]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <span className="text-[--color-brand-500] font-medium text-base md:text-lg mb-1">Bước 2</span>
              <h3 className="font-bold text-lg md:text-xl text-[--color-ink-primary] font-[--font-display] mb-2">Đặt trước</h3>
              <p className="text-[--color-ink-secondary] text-sm leading-relaxed max-w-[200px] md:max-w-xs mx-auto">Đặt hàng ngay trên ứng dụng với mức giá ưu đãi đến 50–70%.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center group min-w-[260px] md:min-w-0 snap-center bg-white md:bg-transparent p-6 md:p-0 rounded-3xl md:rounded-none shadow-sm md:shadow-none border border-gray-100 md:border-none">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[--color-brand-50] border-2 border-[--color-brand-200] rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:bg-[--color-brand-100] transition-all duration-300 shadow-sm shrink-0">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-[--color-brand-600]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-[--color-brand-500] font-medium text-base md:text-lg mb-1">Bước 3</span>
              <h3 className="font-bold text-lg md:text-xl text-[--color-ink-primary] font-[--font-display] mb-2">Giải cứu</h3>
              <p className="text-[--color-ink-secondary] text-sm leading-relaxed max-w-[200px] md:max-w-xs mx-auto">Đến cửa hàng nhận món trong khung giờ quy định và thưởng thức.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Partner Stores & CTA */}
      <section className="py-16 md:py-24 bg-[--color-surface-subtle]">
        <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8">
          {/* CTA Block */}
          <div className="bg-gradient-to-br from-[#0f2913] to-[#1a3d20] rounded-[2rem] p-8 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold font-[--font-display] text-white leading-tight">
                Bạn sở hữu <span className="text-[#8ced7f]">cửa hàng?</span>
              </h2>
              <p className="text-white/70 mt-3 max-w-md text-base leading-relaxed">
                Tham gia SaveFood để giảm lãng phí, tăng doanh thu và kết nối với hàng ngàn khách hàng mới mỗi ngày.
              </p>
            </div>
            <Link
              to={ROUTES.STORE_REGISTER}
              onClick={handlePartnerClick}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-3 rounded-full px-8 py-4 text-lg font-bold bg-[#8ced7f] text-[#0f2913] hover:scale-105 hover:bg-[#7bde6c] transition-all duration-300 whitespace-nowrap group shrink-0"
            >
              Trở thành đối tác
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
