import React, { useState } from 'react';
import { Shield, Lock, FileText, HelpCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { Link } from 'react-router-dom';

const policySections = [
  {
    id: 'terms',
    icon: <FileText className="w-6 h-6 text-mint-brand-green" />,
    title: 'Điều khoản Dịch vụ',
    content: (
      <div className="space-y-4">
        <p className="text-mint-steel text-[15px] leading-relaxed">
          Bằng việc sử dụng nền tảng SaveFood, bạn đồng ý tuân thủ các điều khoản sau đây. SaveFood là cầu nối giữa các cửa hàng thực phẩm có thức ăn dư thừa chất lượng cao và người tiêu dùng muốn mua với giá ưu đãi.
        </p>
        <ul className="space-y-2">
          {['Người dùng phải trên 18 tuổi hoặc có sự giám sát của người lớn.', 'Nghiêm cấm bán lại thức ăn mua từ SaveFood.', 'Cửa hàng chịu trách nhiệm hoàn toàn về chất lượng an toàn thực phẩm.'].map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-mint-brand-green mt-1 shrink-0" />
              <span className="text-mint-ink text-[14px]">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  },
  {
    id: 'privacy',
    icon: <Lock className="w-6 h-6 text-mint-brand-green" />,
    title: 'Chính sách Bảo mật',
    content: (
      <div className="space-y-4">
        <p className="text-mint-steel text-[15px] leading-relaxed">
          Chúng tôi coi trọng dữ liệu cá nhân của bạn. Dữ liệu chỉ được sử dụng để tối ưu trải nghiệm và xử lý đơn hàng, tuyệt đối không mua bán cho bên thứ ba.
        </p>
        <div className="bg-mint-brand-green/5 p-4 rounded-xl border border-mint-brand-green/10">
          <h4 className="font-semibold text-mint-ink mb-2">Thông tin chúng tôi thu thập:</h4>
          <ul className="list-disc pl-5 text-mint-steel text-[14px] space-y-1">
            <li>Thông tin liên hệ (Tên, Email, SĐT)</li>
            <li>Dữ liệu vị trí (để tìm cửa hàng gần bạn)</li>
            <li>Lịch sử giao dịch và đánh giá</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'refund',
    icon: <Shield className="w-6 h-6 text-mint-brand-green" />,
    title: 'Chính sách Hoàn tiền & Hủy đơn',
    content: (
      <div className="space-y-4">
        <p className="text-mint-steel text-[15px] leading-relaxed">
          Để đảm bảo tính công bằng và tránh lãng phí thực phẩm, chúng tôi áp dụng chính sách hủy đơn nghiêm ngặt.
        </p>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
            <div>
              <strong className="text-mint-ink text-[14px]">Hủy bởi người mua:</strong>
              <p className="text-mint-steel text-[14px]">Khách hàng chỉ được hủy và nhận hoàn tiền khi đơn hàng đang ở trạng thái <strong>Chờ xác nhận (Pending)</strong>. Khi cửa hàng đã <strong>Chấp nhận</strong> hoặc đang <strong>Chuẩn bị</strong>, bạn sẽ không thể hủy đơn.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0"></div>
            <div>
              <strong className="text-mint-ink text-[14px]">Không đến nhận hàng (No-show):</strong>
              <p className="text-mint-steel text-[14px]">Vì thực phẩm có hạn sử dụng ngắn, nếu khách hàng không đến nhận trong thời gian quy định, đơn hàng sẽ được tính là <strong>Hoàn thành</strong> và tiền vẫn sẽ được chuyển cho cửa hàng. Khách hàng sẽ <strong>mất toàn bộ số tiền</strong> đã thanh toán.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-mint-brand-green mt-2 shrink-0"></div>
            <div>
              <strong className="text-mint-ink text-[14px]">Hoàn tiền:</strong>
              <p className="text-mint-steel text-[14px]">Tiền sẽ được <strong>hoàn lập tức 100% về Ví SaveFood</strong> của bạn nếu cửa hàng chủ động hủy đơn, hoặc nếu bạn hủy thành công lúc đơn còn đang chờ duyệt. Số dư trong Ví có thể dùng để mua hàng ở lần sau hoặc rút về ngân hàng.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'trust',
    icon: <HelpCircle className="w-6 h-6 text-mint-brand-green" />,
    title: 'Cam kết Tin cậy',
    content: (
      <div className="space-y-4">
        <p className="text-mint-steel text-[15px] leading-relaxed">
          100% đối tác của SaveFood đều phải trải qua quá trình xác minh giấy phép và hình ảnh thực tế. Hệ thống đánh giá dựa trên Trust Score giúp loại bỏ các cửa hàng không đạt chuẩn.
        </p>
        <Link to={ROUTES.STORES} className="inline-flex items-center gap-1 text-mint-primary hover:text-mint-primary-dark font-medium text-[14px] transition-colors">
          Khám phá các cửa hàng <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }
];

export function PolicyPage() {
  const [activeSection, setActiveSection] = useState(policySections[0].id);

  return (
    <div className="min-h-screen bg-mint-canvas pt-24 pb-16">
      <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center p-3 bg-mint-brand-green/10 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-mint-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-mint-ink mb-4 font-display tracking-tight">
            Chính sách <span className="text-mint-primary">&</span> Quy định
          </h1>
          <p className="text-lg text-mint-steel">
            Minh bạch, công bằng và an toàn là những tiêu chí hàng đầu tại SaveFood để bảo vệ cả người dùng và đối tác cửa hàng.
          </p>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative items-start">
          
          {/* Sidebar Nav (Sticky) */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-28 space-y-2 shrink-0">
            {policySections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 text-left border ${
                  activeSection === section.id
                    ? 'bg-white border-mint-primary/30 shadow-[0_4px_20px_rgba(30,166,114,0.12)] translate-x-1'
                    : 'bg-transparent border-transparent hover:bg-white/50 text-mint-stone hover:text-mint-ink'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  activeSection === section.id ? 'bg-mint-brand-green/10' : 'bg-transparent'
                }`}>
                  {React.cloneElement(section.icon, {
                    className: `w-5 h-5 ${activeSection === section.id ? 'text-mint-primary' : 'text-mint-stone'}`
                  })}
                </div>
                <span className={`font-semibold text-[15px] ${activeSection === section.id ? 'text-mint-ink' : ''}`}>
                  {section.title}
                </span>
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-mint-hairline-soft min-h-[400px]">
              {policySections.map((section) => (
                <div 
                  key={section.id} 
                  className={`transition-all duration-500 ${activeSection === section.id ? 'opacity-100 block animate-in fade-in slide-in-from-right-4' : 'opacity-0 hidden'}`}
                >
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-mint-hairline">
                    <div className="w-12 h-12 rounded-full bg-mint-brand-green/10 flex items-center justify-center">
                      {section.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-mint-ink">{section.title}</h2>
                  </div>
                  <div className="prose prose-mint max-w-none">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Contact Support Block */}
            <div className="mt-8 bg-gradient-to-r from-mint-brand-green to-[#158f60] rounded-3xl p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Bạn có câu hỏi khác?</h3>
                <p className="text-white/80 text-[15px]">Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp 24/7.</p>
              </div>
              <button className="px-6 py-3 bg-white text-mint-primary font-bold rounded-xl hover:bg-mint-canvas transition-colors shadow-sm shrink-0">
                Liên hệ Hỗ trợ
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
