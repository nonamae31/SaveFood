import { Leaf, Mail, Phone, Share2, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'

// ─── Footer Component ─────────────────────────────────────────────────────────
// Chân trang dùng chung cho toàn bộ ứng dụng.

const FOOTER_LINKS = {
  product: [
    { label: 'Đồ ăn cận date',   href: ROUTES.PRODUCTS },
    { label: 'Danh sách cửa hàng', href: ROUTES.STORES },
    { label: 'Đặt hàng',         href: ROUTES.CART },
  ],
  partner: [
    { label: 'Đăng ký cửa hàng', href: ROUTES.REGISTER },
    { label: 'Bảng giá',         href: '#pricing' },
    { label: 'Dashboard',        href: ROUTES.DASHBOARD },
  ],
  support: [
    { label: 'Câu hỏi thường gặp', href: '#faq' },
    { label: 'Liên hệ hỗ trợ',  href: '#contact' },
    { label: 'Điều khoản dịch vụ', href: '#terms' },
    { label: 'Chính sách bảo mật', href: '#privacy' },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[--color-surface-strong] text-[--color-ink-inverse]">
      <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* ── Brand Column ── */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-[--radius-button] bg-[--color-brand-500] flex items-center justify-center">
                <Leaf width={18} height={18} className="text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-[--text-heading-sm] font-[--font-display]">
                SaveFood
              </span>
            </div>
            <p className="text-[--text-body-sm] text-gray-400 mb-5 leading-relaxed">
              Nền tảng kết nối người mua với cửa hàng bán thực phẩm cận date,
              giúp giảm lãng phí và tiết kiệm chi phí.
            </p>

            {/* Contact */}
            <div className="space-y-2 text-[--text-body-sm] text-gray-400">
              <a href="mailto:hello@savefood.vn" className="flex items-center gap-2 hover:text-[--color-brand-400] transition-colors">
                <Mail width={15} height={15} aria-hidden="true" />
                hello@savefood.vn
              </a>
              <a href="tel:+84901234567" className="flex items-center gap-2 hover:text-[--color-brand-400] transition-colors">
                <Phone width={15} height={15} aria-hidden="true" />
                0901 234 567
              </a>
            </div>
          </div>

          {/* ── Product Links ── */}
          <div>
            <h3 className="text-[--text-body-md] font-semibold mb-4">Sản phẩm</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.product.map(link => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-[--text-body-sm] text-gray-400 hover:text-[--color-brand-400] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Partner Links ── */}
          <div>
            <h3 className="text-[--text-body-md] font-semibold mb-4">Đối tác</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.partner.map(link => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-[--text-body-sm] text-gray-400 hover:text-[--color-brand-400] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Support Links ── */}
          <div>
            <h3 className="text-[--text-body-md] font-semibold mb-4">Hỗ trợ</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.support.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[--text-body-sm] text-gray-400 hover:text-[--color-brand-400] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="mt-12 pt-6 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[--text-caption] text-gray-500">
            © {currentYear} SaveFood. Góp phần giảm lãng phí thực phẩm. 🌿
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {[
              { Icon: Share2,       href: '#', label: 'Mạng xã hội' },
              { Icon: ExternalLink, href: '#', label: 'Website' },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-[--color-brand-500] hover:text-white transition-all duration-200"
              >
                <Icon width={16} height={16} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
