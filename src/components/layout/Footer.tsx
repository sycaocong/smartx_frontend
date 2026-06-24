import { useUserStore } from '../../stores/userStore'

export function Footer() {
  const { language } = useUserStore()

  const footerLinks = {
    zh: {
      company: ['关于我们', '帮助中心', '联系我们', '加入我们'],
      services: ['现货交易', '合约交易', '资产管理', 'API服务'],
      support: ['常见问题', '反馈建议', '服务条款', '隐私政策'],
    },
    en: {
      company: ['About Us', 'Help Center', 'Contact Us', 'Careers'],
      services: ['Spot Trading', 'Futures', 'Asset Management', 'API'],
      support: ['FAQ', 'Feedback', 'Terms', 'Privacy'],
    },
  }

  const currentLinks = footerLinks[language]

  return (
    <footer className="bg-bg-card border-t border-border-color mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-bg-dark font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-text-primary">SmartX</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed mb-4 max-w-md">
              {language === 'zh'
                ? 'SmartX是专业的数字资产交易平台，提供安全、稳定、高效的加密货币交易服务。'
                : 'SmartX is a professional digital asset trading platform providing secure, stable, and efficient cryptocurrency trading services.'}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green rounded-full animate-pulse" />
                <span className="text-sm text-green">{language === 'zh' ? '系统正常' : 'System Normal'}</span>
              </div>
              <span className="text-sm text-text-muted">
                {language === 'zh' ? '24/7 服务' : '24/7 Support'}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-text-primary font-semibold mb-4">
              {language === 'zh' ? '公司' : 'Company'}
            </h3>
            <ul className="space-y-3">
              {currentLinks.company.map((link) => (
                <li key={link}>
                  <a href="#" className="text-text-secondary text-sm hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-text-primary font-semibold mb-4">
              {language === 'zh' ? '服务' : 'Services'}
            </h3>
            <ul className="space-y-3">
              {currentLinks.services.map((link) => (
                <li key={link}>
                  <a href="#" className="text-text-secondary text-sm hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border-color mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">
            © {new Date().getFullYear()} SmartX. {language === 'zh' ? '保留所有权利。' : 'All rights reserved.'}
          </p>
          <div className="flex items-center gap-6">
            {currentLinks.support.map((link) => (
              <a key={link} href="#" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
