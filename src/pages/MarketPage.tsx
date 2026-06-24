import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Star, TrendingUp, TrendingDown, ArrowUpRight, Filter, ChevronDown } from 'lucide-react'
import { useMarketStore } from '../stores/marketStore'
import { useUserStore } from '../stores/userStore'
import { formatPrice, getPriceColorClass } from '../utils/format'
import { TRADING_PAIRS } from '../constants/tradingPairs'
import { getKlines } from '../utils/binance'
import { Sparkline } from '../components/common/Sparkline'

interface MiniChartProps {
  symbol: string
  interval: string
}

function MiniChart({ symbol, interval }: MiniChartProps) {
  const [data, setData] = useState<number[]>([])

  useEffect(() => {
    const fetchKlines = async () => {
      const response = await getKlines(symbol, interval, 20)
      if (response.data) {
        const prices = response.data.map((kline: any) => parseFloat(kline[4]))
        setData(prices)
      }
    }

    fetchKlines()
  }, [symbol, interval])

  const color = useMemo(() => {
    if (data.length < 2) return '#848E9C'
    const first = data[0]
    const last = data[data.length - 1]
    return last >= first ? '#0ECB81' : '#F6465D'
  }, [data])

  return <Sparkline data={data} width={100} height={40} color={color} />
}

const MemoizedMiniChart = React.memo(MiniChart)

function MarketTable() {
  const { tickers, favoritePairs, toggleFavorite } = useMarketStore()
  const { language } = useUserStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'volume' | 'change' | 'price'>('volume')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilter, setShowFilter] = useState(false)

  const filteredTickers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    return tickers.filter((ticker) => {
      const pairInfo = TRADING_PAIRS.find((p) => p.symbol === ticker.symbol)
      return (
        ticker.symbol.toLowerCase().includes(searchLower) ||
        (pairInfo?.baseAsset.toLowerCase().includes(searchLower) || false) ||
        (pairInfo?.quoteAsset.toLowerCase().includes(searchLower) || false)
      )
    })
  }, [tickers, searchTerm])

  const sortedTickers = useMemo(() => {
    return [...filteredTickers].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'volume': comparison = parseFloat(a.quoteVolume) - parseFloat(b.quoteVolume); break
        case 'change': comparison = parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent); break
        case 'price': comparison = parseFloat(a.lastPrice) - parseFloat(b.lastPrice); break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredTickers, sortBy, sortOrder])

  const handleSort = (column: 'volume' | 'change' | 'price') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  return (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'zh' ? '搜索交易对...' : 'Search trading pairs...'}
            className="input-field pl-10 w-full sm:w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-bg-input border border-border-color rounded-lg text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">{language === 'zh' ? '筛选' : 'Filter'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-bg-hover rounded-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-sm">{language === 'zh' ? '排序:' : 'Sort by:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'volume' | 'change' | 'price')}
              className="input-field text-sm"
            >
              <option value="volume">{language === 'zh' ? '成交量' : 'Volume'}</option>
              <option value="change">{language === 'zh' ? '涨跌幅' : 'Change'}</option>
              <option value="price">{language === 'zh' ? '价格' : 'Price'}</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-bg-card rounded-lg hover:bg-border-color transition-colors"
            >
              {sortOrder === 'asc' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-text-muted border-b border-border-color">
              <th className="text-left py-3 w-12"></th>
              <th className="text-left py-3">{language === 'zh' ? '交易对' : 'Pair'}</th>
              <th className="text-right py-3 hidden sm:block">{language === 'zh' ? '价格' : 'Price'}</th>
              <th className="text-right py-3">
                <button onClick={() => handleSort('change')} className="flex items-center justify-end gap-1 text-text-muted hover:text-text-primary">
                  {language === 'zh' ? '24h涨跌幅' : '24h Change'}
                </button>
              </th>
              <th className="text-right py-3 hidden md:block">
                <button onClick={() => handleSort('volume')} className="flex items-center justify-end gap-1 text-text-muted hover:text-text-primary">
                  {language === 'zh' ? '24h成交量' : '24h Volume'}
                </button>
              </th>
              <th className="text-right py-3 hidden lg:block">{language === 'zh' ? '走势图' : 'Chart'}</th>
              <th className="text-right py-3">{language === 'zh' ? '操作' : 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {sortedTickers.map((ticker) => {
              const pairInfo = TRADING_PAIRS.find((p) => p.symbol === ticker.symbol)
              const isFavorite = favoritePairs.includes(ticker.symbol)
              const isUp = parseFloat(ticker.priceChangePercent) >= 0

              return (
                <tr key={ticker.symbol} className="text-sm border-b border-border-color last:border-b-0 hover:bg-bg-hover/50 transition-colors">
                  <td className="py-4">
                    <button
                      onClick={() => toggleFavorite(ticker.symbol)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isFavorite ? 'text-yellow fill-yellow' : 'text-text-muted hover:text-yellow'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="py-4">
                    <Link
                      to={`/trade/${ticker.symbol}`}
                      className="flex items-center gap-3 text-text-primary hover:text-primary transition-colors"
                    >
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-bold text-xs">{pairInfo?.baseAsset.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{ticker.symbol}</div>
                        <div className="text-text-muted text-xs sm:hidden">${formatPrice(ticker.lastPrice)}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-4 text-right hidden sm:block">
                    <span className="text-text-primary font-medium">${formatPrice(ticker.lastPrice)}</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className={`flex items-center justify-end gap-1 ${getPriceColorClass(ticker.priceChangePercent)}`}>
                      {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {ticker.priceChangePercent}%
                    </span>
                  </td>
                  <td className="py-4 text-right hidden md:block">
                    <span className="text-text-secondary">${(parseFloat(ticker.quoteVolume) / 1e6).toFixed(2)}M</span>
                  </td>
                  <td className="py-4 text-right hidden lg:block">
                    <MemoizedMiniChart symbol={ticker.symbol} interval="1h" />
                  </td>
                  <td className="py-4 text-right">
                    <Link
                      to={`/trade/${ticker.symbol}`}
                      className="btn-primary-sm flex items-center gap-1"
                    >
                      {language === 'zh' ? '交易' : 'Trade'}
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredTickers.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{language === 'zh' ? '未找到匹配的交易对' : 'No trading pairs found'}</p>
        </div>
      )}
    </div>
  )
}

function MarketStats() {
  const { tickers } = useMarketStore()
  const { language } = useUserStore()

  const stats = useMemo(() => {
    const totalVolume = tickers.reduce((sum, t) => sum + parseFloat(t.quoteVolume), 0)
    const upCount = tickers.filter((t) => parseFloat(t.priceChangePercent) >= 0).length
    const downCount = tickers.length - upCount

    return [
      {
        label: language === 'zh' ? '市场交易对' : 'Market Pairs',
        value: tickers.length,
        icon: '📊',
        bgColor: 'bg-primary/20',
        textColor: 'text-primary',
      },
      {
        label: language === 'zh' ? '24h总成交额' : '24h Total Volume',
        value: `$${(totalVolume / 1e9).toFixed(2)}B`,
        icon: '💰',
        bgColor: 'bg-green-bg',
        textColor: 'text-green',
      },
      {
        label: language === 'zh' ? '上涨/下跌' : 'Up / Down',
        value: `${upCount}/${downCount}`,
        icon: '📈',
        bgColor: 'bg-yellow-bg',
        textColor: 'text-yellow',
      },
    ]
  }, [tickers, language])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="card p-6 hover:border-primary/30 transition-all duration-300 animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-text-muted text-sm mb-1">{stat.label}</div>
              <div className="text-3xl font-bold text-text-primary">{stat.value}</div>
            </div>
            <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
              <span className={`text-2xl ${stat.textColor}`}>{stat.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TopGainersLosers({ type }: { type: 'gainers' | 'losers' }) {
  const { tickers } = useMarketStore()
  const { language } = useUserStore()

  const top = useMemo(() => {
    return [...tickers]
      .sort((a, b) => {
        const changeA = parseFloat(a.priceChangePercent)
        const changeB = parseFloat(b.priceChangePercent)
        return type === 'gainers' ? changeB - changeA : changeA - changeB
      })
      .slice(0, 5)
  }, [tickers, type])

  return (
    <div className="card p-5">
      <h3 className={`text-text-primary font-semibold text-lg mb-5 flex items-center gap-2 ${type === 'gainers' ? 'text-green' : 'text-red'}`}>
        {type === 'gainers' ? (language === 'zh' ? '涨幅榜' : 'Top Gainers') : (language === 'zh' ? '跌幅榜' : 'Top Losers')}
      </h3>
      <div className="space-y-3">
        {top.map((ticker, index) => {
          const pairInfo = TRADING_PAIRS.find((p) => p.symbol === ticker.symbol)
          return (
            <Link
              key={ticker.symbol}
              to={`/trade/${ticker.symbol}`}
              className="flex items-center justify-between p-3 bg-bg-hover rounded-xl hover:bg-bg-hover/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-text-muted text-sm w-6">{index + 1}</span>
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-xs">{pairInfo?.baseAsset.slice(0, 2)}</span>
                </div>
                <span className="text-text-primary font-medium">{ticker.symbol}</span>
              </div>
              <div className="text-right">
                <div className="text-text-secondary text-sm">${formatPrice(ticker.lastPrice)}</div>
                <div className={getPriceColorClass(ticker.priceChangePercent)}>
                  {ticker.priceChangePercent}%
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const MemoizedTopGainersLosers = React.memo(TopGainersLosers)

export function MarketPage() {
  const { language } = useUserStore()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {language === 'zh' ? '市场行情' : 'Market'}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {language === 'zh' ? '查看所有交易对的实时行情数据' : 'View real-time market data for all trading pairs'}
          </p>
        </div>
      </div>

      <MarketStats />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-4">
          <MarketTable />
        </div>

        <div className="space-y-6">
          <MemoizedTopGainersLosers type="gainers" />
          <MemoizedTopGainersLosers type="losers" />
        </div>
      </div>
    </div>
  )
}

import React from 'react'
