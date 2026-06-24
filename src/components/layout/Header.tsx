import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, Globe, Search, Menu, X, Wallet, User, TrendingUp, TrendingDown } from 'lucide-react'
import { useUserStore } from '../../stores/userStore'
import { useMarketStore } from '../../stores/marketStore'
import { formatPrice, getPriceColorClass } from '../../utils/format'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const location = useLocation()

  const { user, language, toggleLanguage, announcements } = useUserStore()
  const { tickers, selectedPair, setSelectedPair, getTradingPairs } = useMarketStore()

  const tradingPairs = getTradingPairs()
  const unreadCount = announcements.filter((a) => !a.isRead).length
  const currentTicker = tickers.find((t) => t.symbol === selectedPair)
  const isUp = currentTicker ? parseFloat(currentTicker.priceChangePercent) >= 0 : false

  const navItems = [
    { path: '/', label: language === 'zh' ? '首页' : 'Home' },
    { path: '/trade', label: language === 'zh' ? '交易' : 'Trade' },
    { path: '/market', label: language === 'zh' ? '市场' : 'Market' },
    { path: '/wallet', label: language === 'zh' ? '钱包' : 'Wallet' },
  ]

  return (
    <header className="bg-bg-card border-b border-border-color sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-bg-dark font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors">
                SmartX
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path || location.pathname.startsWith(item.path)
                      ? 'bg-primary text-bg-dark'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-2 px-4 py-2 bg-bg-input border border-border-color rounded-lg text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">{language === 'zh' ? '搜索交易对' : 'Search pairs'}</span>
            </button>

            {showSearch && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-96 bg-bg-card border border-border-color rounded-xl shadow-2xl z-50 p-2 animate-fade-in">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder={language === 'zh' ? '搜索交易对...' : 'Search pairs...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-bg-input border border-border-color rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {tradingPairs
                    .filter((p) =>
                      p.symbol.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((pair) => {
                      const ticker = tickers.find((t) => t.symbol === pair.symbol)
                      return (
                        <Link
                          key={pair.symbol}
                          to={`/trade/${pair.symbol}`}
                          onClick={() => {
                            setSelectedPair(pair.symbol)
                            setSearchQuery('')
                            setShowSearch(false)
                          }}
                          className="block px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors flex items-center justify-between"
                        >
                          <span className="font-medium">{pair.symbol}</span>
                          {ticker && (
                            <div className="flex items-center gap-2">
                              <span className="text-text-muted">${formatPrice(ticker.lastPrice)}</span>
                              <span
                                className={`text-xs flex items-center gap-0.5 ${getPriceColorClass(ticker.priceChangePercent)}`}
                              >
                                {parseFloat(ticker.priceChangePercent) >= 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {ticker.priceChangePercent}%
                              </span>
                            </div>
                          )}
                        </Link>
                      )
                    })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 px-4 py-2 bg-bg-hover rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted uppercase">{selectedPair}</span>
              </div>
              {currentTicker && (
                <>
                  <span className="text-lg font-bold text-text-primary">
                    ${formatPrice(currentTicker.lastPrice)}
                  </span>
                  <span className={`text-sm font-medium flex items-center gap-1 ${getPriceColorClass(currentTicker.priceChangePercent)}`}>
                    {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {isUp ? '+' : ''}{currentTicker.priceChangePercent}%
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              title={language === 'zh' ? 'English' : '中文'}
            >
              <Globe className="w-5 h-5" />
            </button>

            <button className="hidden sm:flex p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red rounded-full animate-pulse" />
              )}
            </button>

            <Link
              to="/wallet"
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-bg-hover rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <Wallet className="w-4 h-4" />
              <span>{language === 'zh' ? '钱包' : 'Wallet'}</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-2 bg-bg-hover rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-bg-dark" />
              </div>
              <span className="hidden sm:block font-medium">{user?.username}</span>
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-bg-card border-t border-border-color animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path || location.pathname.startsWith(item.path)
                    ? 'bg-primary text-bg-dark'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
