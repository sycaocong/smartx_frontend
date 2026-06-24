import { Link } from 'react-router-dom'
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, ChevronRight, PieChart, TrendingUp, TrendingDown } from 'lucide-react'
import { useUserStore } from '../stores/userStore'
import { useWalletStore } from '../stores/walletStore'
import { useMarketStore } from '../stores/marketStore'
import { formatPrice, formatNumber } from '../utils/format'
import type { WalletBalance } from '../types/wallet'

function BalanceCard() {
  const { balances } = useWalletStore()
  const { tickers } = useMarketStore()
  const { language } = useUserStore()

  const totalBalance = Object.values(balances).reduce((sum, balance) => {
    const ticker = tickers.find((t) => t.symbol === `${balance.asset}USDT`)
    const price = ticker ? parseFloat(ticker.lastPrice) : (balance.asset === 'USDT' ? 1 : 0)
    return sum + parseFloat(balance.free) * price + parseFloat(balance.locked) * price
  }, 0)

  const stats = [
    {
      label: language === 'zh' ? '总资产估值' : 'Total Balance',
      value: `$${formatPrice(totalBalance.toString())}`,
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
    },
    {
      label: language === 'zh' ? '持币数量' : 'Assets',
      value: Object.keys(balances).length.toString(),
      icon: PieChart,
      color: 'text-green',
      bgColor: 'bg-green-bg',
    },
  ]

  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-primary/10 to-bg-card">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h2 className="text-text-primary font-semibold text-lg mb-2">
            {language === 'zh' ? '账户资产' : 'Account Balance'}
          </h2>
          <p className="text-text-secondary text-sm">
            {language === 'zh' ? '实时资产估值（基于当前市场价格）' : 'Real-time asset valuation based on current market prices'}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-4">
              <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <div className="text-text-muted text-xs">{stat.label}</div>
                <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AssetCard({ balance }: { balance: WalletBalance }) {
  const { tickers } = useMarketStore()
  const { language } = useUserStore()

  const ticker = tickers.find((t) => t.symbol === `${balance.asset}USDT`)
  const price = ticker ? parseFloat(ticker.lastPrice) : (balance.asset === 'USDT' ? 1 : 0)
  const total = parseFloat(balance.free) * price + parseFloat(balance.locked) * price

  const percent = balance.asset === 'USDT' ? '-' : ticker?.priceChangePercent || '-'
  const isUp = balance.asset !== 'USDT' && parseFloat(percent) >= 0

  return (
    <div className="card p-5 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
            <span className="text-primary font-bold text-lg">{balance.asset.slice(0, 2)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-text-primary font-semibold">{balance.asset}</span>
              {balance.asset === 'USDT' && (
                <span className="text-xs text-text-muted bg-green-bg text-green px-2 py-0.5 rounded-full">
                  {language === 'zh' ? '稳定币' : 'Stablecoin'}
                </span>
              )}
            </div>
            <div className="text-text-secondary text-sm">
              {formatNumber(balance.free)} {language === 'zh' ? '可用' : 'Available'}
              {parseFloat(balance.locked) > 0 && (
                <span className="ml-3">
                  {formatNumber(balance.locked)} {language === 'zh' ? '冻结' : 'Locked'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-text-primary font-semibold text-lg">${formatPrice(total.toString())}</div>
          {balance.asset !== 'USDT' && (
            <div className={`text-sm ${isUp ? 'text-green' : 'text-red'}`}>
              {isUp ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
              {percent}%
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border-color">
        <div className="flex items-center justify-between mb-3">
          <span className="text-text-muted text-sm">{language === 'zh' ? '资产分布' : 'Allocation'}</span>
          <span className="text-text-secondary text-sm">{total > 0 ? ((total / 10000).toFixed(2) + '%') : '0%'}</span>
        </div>
        <div className="h-2 bg-bg-input rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-green rounded-full transition-all duration-500"
            style={{ width: total > 0 ? `${Math.min((total / 10000) * 100, 100)}%` : '0%' }}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          to={`/wallet/deposit/${balance.asset}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-bg-input border border-border-color rounded-lg text-text-secondary hover:text-primary hover:border-primary transition-colors"
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span className="text-sm">{language === 'zh' ? '充值' : 'Deposit'}</span>
        </Link>
        <Link
          to={`/wallet/withdraw/${balance.asset}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-bg-input border border-border-color rounded-lg text-text-secondary hover:text-red hover:border-red transition-colors"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span className="text-sm">{language === 'zh' ? '提现' : 'Withdraw'}</span>
        </Link>
      </div>
    </div>
  )
}

function QuickActions() {
  const { language } = useUserStore()

  const actions = [
    {
      icon: ArrowDownLeft,
      label: language === 'zh' ? '充值' : 'Deposit',
      description: language === 'zh' ? '快速充值数字资产' : 'Quickly deposit digital assets',
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      link: '/wallet/deposit',
    },
    {
      icon: ArrowUpRight,
      label: language === 'zh' ? '提现' : 'Withdraw',
      description: language === 'zh' ? '安全提取您的资产' : 'Securely withdraw your assets',
      color: 'text-red',
      bgColor: 'bg-red-bg',
      link: '/wallet/withdraw',
    },
    {
      icon: RefreshCw,
      label: language === 'zh' ? '转账' : 'Transfer',
      description: language === 'zh' ? '内部账户转账' : 'Internal account transfer',
      color: 'text-green',
      bgColor: 'bg-green-bg',
      link: '/wallet/transfer',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.link}
          className="card p-5 hover:border-primary/30 transition-all duration-300 group"
        >
          <div className="flex items-start justify-between">
            <div className={`w-12 h-12 ${action.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <action.icon className={`w-6 h-6 ${action.color}`} />
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-text-primary font-semibold mt-4">{action.label}</h3>
          <p className="text-text-secondary text-sm mt-1">{action.description}</p>
        </Link>
      ))}
    </div>
  )
}

export function WalletPage() {
  const { balances } = useWalletStore()
  const { language } = useUserStore()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {language === 'zh' ? '资产管理' : 'Wallet'}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {language === 'zh' ? '查看和管理您的数字资产' : 'View and manage your digital assets'}
          </p>
        </div>
      </div>

      <BalanceCard />

      <QuickActions />

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-text-primary font-semibold text-lg">
            {language === 'zh' ? '我的资产' : 'My Assets'}
          </h2>
          <span className="text-text-muted text-sm">{Object.keys(balances).length} {language === 'zh' ? '种资产' : 'assets'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(balances).map((balance, index) => (
            <div
              key={balance.asset}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <AssetCard balance={balance} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
