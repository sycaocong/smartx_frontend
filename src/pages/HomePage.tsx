import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowRight, Bell, Coins, Zap, Shield, BarChart3, Activity, DollarSign } from 'lucide-react'
import { useMarketStore } from '../stores/marketStore'
import { useUserStore } from '../stores/userStore'
import { useWalletStore } from '../stores/walletStore'
import { formatPrice, formatPercent, formatLargeNumber, getPriceColorClass } from '../utils/format'
import { TRADING_PAIRS } from '../constants/tradingPairs'

function PriceCard({ ticker, index }: { ticker: any; index: number }) {
  const isUp = parseFloat(ticker.priceChangePercent) >= 0
  const colorClass = getPriceColorClass(ticker.priceChangePercent)

  return (
    <Link
      to={`/trade/${ticker.symbol}`}
      className="card p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <span className="text-primary font-bold">{ticker.symbol.slice(0, 2)}</span>
          </div>
          <span className="text-text-secondary text-sm font-medium">{ticker.symbol}</span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${colorClass}`}>
          {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {formatPercent(ticker.priceChangePercent)}
        </div>
      </div>
      <div className="text-2xl font-bold text-text-primary mb-2">
        ${formatPrice(ticker.lastPrice)}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border-color">
        <div className="flex items-center gap-1.5 text-text-muted text-xs">
          <Activity className="w-3 h-3" />
          <span>24h Volume:</span>
          <span className="text-text-secondary">${formatLargeNumber(parseFloat(ticker.quoteVolume))}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
      </div>
    </Link>
  )
}

function GainersLosers({ title, data, isGainers }: { title: string; data: any[]; isGainers: boolean }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {isGainers ? (
            <TrendingUp className="w-5 h-5 text-green" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red" />
          )}
          <h3 className="text-text-primary font-semibold text-lg">{title}</h3>
        </div>
        <Link
          to="/market"
          className="text-sm text-text-muted hover:text-primary transition-colors"
        >
          查看全部
        </Link>
      </div>
      <div className="space-y-3">
        {data.map((ticker, index) => (
          <Link
            key={ticker.symbol}
            to={`/trade/${ticker.symbol}`}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-hover transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isGainers ? 'bg-green-bg text-green' : 'bg-red-bg text-red'
              }`}>
                {index + 1}
              </span>
              <span className="text-text-primary text-sm font-medium w-24">{ticker.symbol}</span>
              <span className="text-text-secondary text-sm hidden sm:block">${formatPrice(ticker.lastPrice)}</span>
            </div>
            <span className={`text-sm font-semibold ${isGainers ? 'text-green' : 'text-red'}`}>
              {isGainers ? '+' : ''}{ticker.priceChangePercent}%
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function MarketStats() {
  const { tickers } = useMarketStore()
  const totalVolume = tickers.reduce((sum, t) => sum + parseFloat(t.quoteVolume), 0)

  const stats = [
    {
      icon: Coins,
      label: '市场总市值',
      value: '$2.84T',
      change: '+2.3%',
      changeClass: 'text-green',
      bgClass: 'bg-primary/20',
      iconClass: 'text-primary',
    },
    {
      icon: Zap,
      label: '24h交易量',
      value: `$${(totalVolume / 1e9).toFixed(2)}B`,
      change: '+15.8%',
      changeClass: 'text-green',
      bgClass: 'bg-green-bg',
      iconClass: 'text-green',
    },
    {
      icon: BarChart3,
      label: '活跃币种',
      value: '2,847',
      change: '+12 本周',
      changeClass: 'text-text-muted',
      bgClass: 'bg-blue-500/20',
      iconClass: 'text-blue-400',
    },
    {
      icon: Shield,
      label: '交易对',
      value: '6,234',
      change: '+8 本周',
      changeClass: 'text-text-muted',
      bgClass: 'bg-purple-500/20',
      iconClass: 'text-purple-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="card p-5 hover:border-primary/30 transition-all duration-300 animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 ${stat.bgClass} rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.iconClass}`} />
            </div>
            <span className="text-text-muted text-sm">{stat.label}</span>
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">{stat.value}</div>
          <div className={`text-xs ${stat.changeClass}`}>{stat.change}</div>
        </div>
      ))}
    </div>
  )
}

function AnnouncementCarousel() {
  const { announcements, markAnnouncementAsRead, language } = useUserStore()
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [announcements.length])

  if (announcements.length === 0) return null

  const current = announcements[currentIndex]

  const typeColors = {
    SYSTEM: 'bg-blue-500',
    UPGRADE: 'bg-orange-500',
    LISTING: 'bg-green',
    MAINTENANCE: 'bg-red',
  }

  const typeLabels = {
    SYSTEM: '系统通知',
    UPGRADE: '系统升级',
    LISTING: '新币上线',
    MAINTENANCE: '维护公告',
  }

  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
        <Bell className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2 h-2 rounded-full ${typeColors[current.type]}`} />
          <span className="text-xs text-text-muted">{typeLabels[current.type]}</span>
          <span className="text-text-primary text-sm font-medium truncate">{current.title}</span>
        </div>
        <p className="text-text-secondary text-sm truncate">{current.content}</p>
      </div>
      <button
        onClick={() => markAnnouncementAsRead(current.id)}
        className="text-primary text-sm font-medium hover:underline flex-shrink-0"
      >
        {language === 'zh' ? '详情' : 'View'}
      </button>
    </div>
  )
}

function AccountOverview() {
  const { totalBalance } = useWalletStore()
  const { language } = useUserStore()

  return (
    <div className="card p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
        <div className="text-center lg:text-left">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-text-muted text-sm">
              {language === 'zh' ? '总资产价值' : 'Total Assets'}
            </span>
          </div>
          <div className="text-4xl font-bold text-text-primary mb-2">
            ${formatPrice(totalBalance)}
          </div>
          <div className="flex items-center gap-2 text-green text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+2.4% {language === 'zh' ? '本周' : 'this week'}</span>
          </div>
        </div>
        <div className="flex gap-4">
          <Link to="/trade" className="btn-primary flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            {language === 'zh' ? '开始交易' : 'Start Trading'}
          </Link>
          <Link to="/wallet" className="btn-secondary flex items-center gap-2">
            <Coins className="w-4 h-4" />
            {language === 'zh' ? '查看钱包' : 'View Wallet'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  const { tickers, isLoading } = useMarketStore()
  const { language } = useUserStore()

  const mainPairs = TRADING_PAIRS.map((p) => p.symbol) as string[]
  const filteredTickers = tickers.filter((t) => mainPairs.includes(t.symbol))

  const sortedTickers = [...tickers].sort((a, b) =>
    parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent)
  )
  const topGainers = sortedTickers.slice(0, 5)
  const topLosers = [...sortedTickers].reverse().slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          {language === 'zh' ? '市场概览' : 'Market Overview'}
        </h1>
        <p className="text-text-secondary">
          {language === 'zh' ? '实时追踪市场动态，把握投资机会' : 'Track market trends in real-time'}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted">{language === 'zh' ? '加载中...' : 'Loading...'}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <AccountOverview />
          </div>

          <MarketStats />

          <div className="mt-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-text-primary">
                  {language === 'zh' ? '热门币种' : 'Popular Pairs'}
                </h2>
              </div>
              <Link
                to="/market"
                className="text-primary text-sm font-medium hover:underline"
              >
                {language === 'zh' ? '查看全部' : 'View All'}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredTickers.map((ticker, index) => (
                <PriceCard key={ticker.symbol} ticker={ticker} index={index} />
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GainersLosers
              title={language === 'zh' ? '24h 涨幅榜' : 'Top Gainers'}
              data={topGainers}
              isGainers={true}
            />
            <GainersLosers
              title={language === 'zh' ? '24h 跌幅榜' : 'Top Losers'}
              data={topLosers}
              isGainers={false}
            />
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {language === 'zh' ? '平台公告' : 'Announcements'}
            </h2>
            <AnnouncementCarousel />
          </div>
        </>
      )}
    </div>
  )
}
