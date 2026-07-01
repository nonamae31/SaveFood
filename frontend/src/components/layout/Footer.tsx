import { Leaf, Mail, Phone, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import toast from 'react-hot-toast';

// ─── Footer Component ─────────────────────────────────────────────────────────
// Chân trang dùng chung cho toàn bộ ứng dụng.

const FOOTER_LINKS = {
    product: [
        { label: "Khám phá món ăn", href: ROUTES.PRODUCTS },
        { label: "Cửa hàng đối tác", href: ROUTES.STORES },
        { label: "Giỏ hàng của bạn", href: ROUTES.CART },
    ],
    partner: [
        { label: "Mở cửa hàng trực tuyến", href: ROUTES.STORE_REGISTER },
    ],
    support: [
        { label: "Trung tâm hỗ trợ", href: ROUTES.HELP_CENTER, isRouter: true },
        { label: "Câu hỏi thường gặp (FAQ)", href: "#faq" },
        { label: "Điều khoản dịch vụ", href: ROUTES.POLICY, isRouter: true },
        { label: "Chính sách bảo mật", href: ROUTES.POLICY, isRouter: true },
    ],
};

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[--color-surface-strong] text-[--color-ink-inverse] relative overflow-hidden">
            {/* Subtle top accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[--color-brand-500] to-transparent"></div>

            <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* ── Brand Column ── */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center">
                                <Leaf width={20} height={20} className="text-[#8ced7f]" aria-hidden="true" />
                            </div>
                            <span className="font-bold text-lg font-[--font-display]">SaveFood</span>
                        </div>
                        <p className="text-[--text-body-sm] text-gray-400 mb-5 leading-relaxed">
                            Nền tảng kết nối người mua với cửa hàng bán thực phẩm cận date, giúp giảm lãng phí và tiết
                            kiệm chi phí.
                        </p>

                        {/* Contact */}
                        <div className="space-y-2 text-[--text-body-sm] text-gray-400">
                            <a
                                href="mailto:savefood.work247@gmail.com"
                                className="flex items-center gap-2 hover:text-[--color-brand-400] transition-colors"
                            >
                                <Mail width={15} height={15} aria-hidden="true" />
                                savefood.work247@gmail.com
                            </a>
                            <a
                                href="tel:+84901234567"
                                className="flex items-center gap-2 hover:text-[--color-brand-400] transition-colors"
                            >
                                <Phone width={15} height={15} aria-hidden="true" />
                                0901 234 567
                            </a>
                        </div>
                    </div>

                    {/* ── Product Links ── */}
                    <div>
                        <h3 className="text-[--text-body-md] font-semibold mb-4">Sản phẩm</h3>
                        <ul className="space-y-2.5">
                            {FOOTER_LINKS.product.map((link) => (
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
                            {FOOTER_LINKS.partner.map((link) => (
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
                            {FOOTER_LINKS.support.map((link) => (
                                <li key={link.label}>
                                    {link.isRouter ? (
                                        <Link
                                            to={link.href}
                                            className="text-[--text-body-sm] text-gray-400 hover:text-[--color-brand-400] transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    ) : (
                                        <a
                                            href={link.href}
                                            className="text-[--text-body-sm] text-gray-400 hover:text-[--color-brand-400] transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ── Bottom Bar ── */}
                <div className="mt-14 pt-6 border-t border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[--text-caption] text-gray-500">
                        © {currentYear} SaveFood. Góp phần giảm lãng phí thực phẩm. 🌿
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center gap-3">
                        <a
                            href="https://www.facebook.com/profile.php?id=61590551916006"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook Fanpage"
                            className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center text-white hover:bg-[#8ced7f] hover:text-[#0f2913] transition-all duration-300"
                        >
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
