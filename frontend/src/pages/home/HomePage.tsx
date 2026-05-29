import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

export function HomePage() {
  return (
    <div className="bg-[--color-surface-base] min-h-screen">
      {/* 1. Cinematic Hero Section (Light Theme) */}
      <section className="relative overflow-hidden bg-[--color-surface-base] min-h-screen flex flex-col items-center justify-center text-center px-6 group">

        {/* Background Video Layer */}
        <video
          src="/hero.mp4"
          className="absolute inset-0 w-full h-full object-cover z-0 animate-fade-rise"
          muted
          autoPlay
          loop
          playsInline
        />

        {/* Gradient Overlays */}
        {/* Left-to-right gradient to make text readable while preserving right-side visuals */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#171a17]/90 via-[#171a17]/50 to-transparent z-0 pointer-events-none"></div>
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

            <h1 className="text-5xl sm:text-6xl md:text-[4.5rem] font-bold font-[--font-display] text-white leading-[1.1] tracking-tight text-left w-full">
              Một bữa ăn<br />
              được cứu <span className="font-serif italic font-normal text-[#8ced7f]">là một</span><br />
              <span className="text-[#8ced7f]">tương lai xanh hơn</span>
            </h1>

            <p className="text-base sm:text-lg text-white/70 mt-6 leading-relaxed max-w-sm text-left">
              Hàng ngàn món ăn chất lượng đang chờ được thưởng thức thay vì bị bỏ phí.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto self-start">
              <Link
                to={ROUTES.PRODUCTS}
                className="inline-flex items-center justify-center gap-3 rounded-full px-6 py-3.5 text-base font-bold bg-[#8ced7f] text-[#0f2913] hover:scale-105 hover:bg-[#7bde6c] transition-all duration-300 group"
              >
                <div className="bg-[#0f2913] text-[#8ced7f] rounded-full p-1 border border-[#8ced7f]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                Cứu món ăn ngay
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
              <Link
                to={ROUTES.STORES}
                className="inline-flex items-center justify-center gap-3 rounded-full px-6 py-3.5 text-base font-bold bg-white/5 border border-white/20 text-white hover:bg-white/10 hover:scale-105 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                Bắt đầu khám phá
              </Link>
            </div>

            {/* Stats */}
            {/* <div className="flex items-center gap-8 mt-14 animate-fade-rise-delay-2 self-start text-left">
              <div className="flex items-center gap-3">
                <div className="text-white/60">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </div>
                <div>
                  <div className="text-white font-bold text-lg">500+</div>
                  <div className="text-white/50 text-xs">cửa hàng đối tác</div>
                </div>
              </div>
              
              <div className="w-px h-10 bg-white/10"></div>
              
              <div className="flex items-center gap-3">
                <div className="text-white/60">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </div>
                <div>
                  <div className="text-white font-bold text-lg">10.000+</div>
                  <div className="text-white/50 text-xs">món ăn được cứu mỗi ngày</div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* 2. Featured Deals */}
      <section className="py-24 bg-[--color-surface-subtle]">
        <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-[3px] rounded-full bg-[--color-brand-500]"></div>
                <span className="text-sm font-medium text-[--color-brand-600] uppercase tracking-wider">Ưu đãi hôm nay</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-[--font-display] text-[--color-ink-primary] leading-tight">
                Giải cứu ngay, <span className="font-[--font-display] italic font-normal text-[--color-brand-600]">tiết kiệm ngay</span>
              </h2>
              <p className="text-[--color-ink-secondary] mt-3 max-w-md">Nhanh tay cứu những phần ăn hấp dẫn nhất trước khi hết hạn.</p>
            </div>
            <Link
              to={ROUTES.PRODUCTS}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold border border-[--color-brand-500] text-[--color-brand-600] hover:bg-[--color-brand-500] hover:text-white transition-all duration-300 whitespace-nowrap group"
            >
              Xem tất cả
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Mock Card 1 */}
            <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-[--shadow-card] hover:shadow-[--shadow-card-hover] transition-all duration-300 hover:-translate-y-1 group">
              <div className="h-52 bg-[--color-surface-muted] relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80" alt="Bánh mì Sourdough" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-[--color-brand-orange] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">-50%</div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-[--color-ink-primary] text-lg mb-0.5 font-[--font-display] line-clamp-1">Sourdough Hữu Cơ</h3>
                <p className="text-[--color-ink-secondary] text-sm mb-4">The Artisan Bakery</p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[--color-brand-700] text-xl">45.000đ</span>
                    <span className="text-[--color-ink-tertiary] line-through text-sm ml-2">90.000đ</span>
                  </div>
                  <button className="bg-[--color-brand-500] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[--color-brand-600] hover:shadow-md transition-all duration-300">
                    Chọn
                  </button>
                </div>
              </div>
            </div>
            {/* Mock Card 2 */}
            <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-[--shadow-card] hover:shadow-[--shadow-card-hover] transition-all duration-300 hover:-translate-y-1 group">
              <div className="h-52 bg-[--color-surface-muted] relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1555507036-ab1d4075c6f1?auto=format&fit=crop&q=80" alt="Croissant Hạnh Nhân" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-[--color-brand-orange] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">-40%</div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-[--color-ink-primary] text-lg mb-0.5 font-[--font-display] line-clamp-1">Croissant Hạnh Nhân</h3>
                <p className="text-[--color-ink-secondary] text-sm mb-4">Paris Baguette</p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[--color-brand-700] text-xl">30.000đ</span>
                    <span className="text-[--color-ink-tertiary] line-through text-sm ml-2">50.000đ</span>
                  </div>
                  <button className="bg-[--color-brand-500] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[--color-brand-600] hover:shadow-md transition-all duration-300">
                    Chọn
                  </button>
                </div>
              </div>
            </div>
            {/* Mock Card 3 */}
            <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-[--shadow-card] hover:shadow-[--shadow-card-hover] transition-all duration-300 hover:-translate-y-1 group">
              <div className="h-52 bg-[--color-surface-muted] relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80" alt="Pasta Ý" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-[--color-brand-orange] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">-60%</div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-[--color-ink-primary] text-lg mb-0.5 font-[--font-display] line-clamp-1">Pasta Carbonara</h3>
                <p className="text-[--color-ink-secondary] text-sm mb-4">Little Italy</p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[--color-brand-700] text-xl">35.000đ</span>
                    <span className="text-[--color-ink-tertiary] line-through text-sm ml-2">89.000đ</span>
                  </div>
                  <button className="bg-[--color-brand-500] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[--color-brand-600] hover:shadow-md transition-all duration-300">
                    Chọn
                  </button>
                </div>
              </div>
            </div>
            {/* Mock Card 4 */}
            <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-[--shadow-card] hover:shadow-[--shadow-card-hover] transition-all duration-300 hover:-translate-y-1 group">
              <div className="h-52 bg-[--color-surface-muted] relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80" alt="Bánh ngọt" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-[--color-brand-orange] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">-45%</div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-[--color-ink-primary] text-lg mb-0.5 font-[--font-display] line-clamp-1">Tiramisu Tươi</h3>
                <p className="text-[--color-ink-secondary] text-sm mb-4">Sweet Corner</p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[--color-brand-700] text-xl">55.000đ</span>
                    <span className="text-[--color-ink-tertiary] line-through text-sm ml-2">100.000đ</span>
                  </div>
                  <button className="bg-[--color-brand-500] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[--color-brand-600] hover:shadow-md transition-all duration-300">
                    Chọn
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works */}
      <section className="py-28 bg-[--color-surface-base] relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        <div className="relative max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-[3px] rounded-full bg-[--color-brand-500]"></div>
              <span className="text-sm font-medium text-[--color-brand-600] uppercase tracking-wider">Quy trình</span>
              <div className="w-8 h-[3px] rounded-full bg-[--color-brand-500]"></div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-[--font-display] text-[--color-ink-primary]">
              Đơn giản như <span className="font-serif italic font-normal text-[--color-brand-600]">1, 2, 3</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-[--color-brand-200] via-[--color-brand-400] to-[--color-brand-200] z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-[--color-brand-50] border-2 border-[--color-brand-200] rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[--color-brand-100] transition-all duration-300 shadow-sm">
                <svg className="w-10 h-10 text-[--color-brand-600]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <span className="font-serif italic text-[--color-brand-500] text-lg mb-1">Bước 1</span>
              <h3 className="font-bold text-xl text-[--color-ink-primary] font-[--font-display] mb-2">Khám phá</h3>
              <p className="text-[--color-ink-secondary] text-sm leading-relaxed max-w-xs">Tìm kiếm các món ăn hoặc túi bất ngờ đang được giảm giá gần bạn.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-[--color-brand-50] border-2 border-[--color-brand-200] rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[--color-brand-100] transition-all duration-300 shadow-sm">
                <svg className="w-10 h-10 text-[--color-brand-600]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <span className="font-serif italic text-[--color-brand-500] text-lg mb-1">Bước 2</span>
              <h3 className="font-bold text-xl text-[--color-ink-primary] font-[--font-display] mb-2">Đặt trước</h3>
              <p className="text-[--color-ink-secondary] text-sm leading-relaxed max-w-xs">Đặt hàng ngay trên ứng dụng với mức giá ưu đãi đến 50–70%.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-[--color-brand-50] border-2 border-[--color-brand-200] rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[--color-brand-100] transition-all duration-300 shadow-sm">
                <svg className="w-10 h-10 text-[--color-brand-600]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="font-serif italic text-[--color-brand-500] text-lg mb-1">Bước 3</span>
              <h3 className="font-bold text-xl text-[--color-ink-primary] font-[--font-display] mb-2">Giải cứu</h3>
              <p className="text-[--color-ink-secondary] text-sm leading-relaxed max-w-xs">Đến cửa hàng nhận món trong khung giờ quy định và thưởng thức.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Partner Stores & CTA */}
      <section className="py-24 bg-[--color-surface-subtle]">
        <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Partner logos */}
          {/* <div className="text-center mb-16">
            <span className="text-sm font-medium text-[--color-ink-tertiary] uppercase tracking-wider">Được tin tưởng bởi các cửa hàng</span>
            <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-16 mt-8 opacity-40 hover:opacity-70 transition-opacity duration-500">
              <span className="text-2xl sm:text-3xl font-bold font-[--font-display] text-[--color-ink-primary]">Highlands</span>
              <span className="text-2xl sm:text-3xl font-bold font-[--font-display] text-[--color-ink-primary]">KFC</span>
              <span className="text-2xl sm:text-3xl font-bold font-[--font-display] text-[--color-ink-primary]">Paris Baguette</span>
              <span className="text-2xl sm:text-3xl font-bold font-[--font-display] text-[--color-ink-primary]">Circle K</span>
              <span className="text-2xl sm:text-3xl font-bold font-[--font-display] text-[--color-ink-primary]">GS25</span>
            </div>
          </div> */}

          {/* CTA Block */}
          <div className="bg-gradient-to-br from-[#0f2913] to-[#1a3d20] rounded-[2rem] p-10 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold font-[--font-display] text-white leading-tight">
                Bạn sở hữu <span className="text-[#8ced7f] font-serif italic font-normal">cửa hàng?</span>
              </h2>
              <p className="text-white/70 mt-3 max-w-md text-base leading-relaxed">
                Tham gia SaveFood để giảm lãng phí, tăng doanh thu và kết nối với hàng ngàn khách hàng mới mỗi ngày.
              </p>
            </div>
            <Link
              to={ROUTES.REGISTER}
              className="inline-flex items-center gap-3 rounded-full px-8 py-4 text-lg font-bold bg-[#8ced7f] text-[#0f2913] hover:scale-105 hover:bg-[#7bde6c] transition-all duration-300 whitespace-nowrap group shrink-0"
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
