import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useMarketStore } from '../stores/marketStore'
import { useOrderStore } from '../stores/orderStore'
import { useWalletStore } from '../stores/walletStore'
import { useUserStore } from '../stores/userStore'
import { useBinanceWS, useInitialOrderBook } from '../hooks/useBinanceWS'
import { getKlines } from '../utils/binance'
import { formatPrice, formatQuantity, getPriceColorClass } from '../utils/format'
import { TRADING_PAIRS, CHART_INTERVALS } from '../constants/tradingPairs'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType } from 'lightweight-charts'

function ChartComponent({ symbol, interval }: { symbol: string; interval: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return
    if (chartRef.current) {
      chartRef.current.remove()
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid' as ColorType, color: '#1E2329' },
        textColor: '#848E9C',
      },
      grid: {
        vertLines: { color: '#2B3139' },
        horzLines: { color: '#2B3139' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#2B3139',
      },
      timeScale: {
        borderColor: '#2B3139',
      },
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#0ECB81',
      downColor: '#F6465D',
      borderUpColor: '#0ECB81',
      borderDownColor: '#F6465D',
    })

    const volumeSeries = chart.addHistogramSeries({
      color: '#F0B90B',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  useEffect(() => {
    const fetchKlines = async () => {
      const response = await getKlines(symbol, interval, 100)
      if (response.data && candlestickSeriesRef.current && volumeSeriesRef.current) {
        const candlestickData: CandlestickData<Time>[] = response.data.map((kline: any) => ({
          time: Math.floor(kline[0] / 1000) as Time,
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
        }))

        const volumeData = response.data.map((kline: any) => ({
          time: Math.floor(kline[0] / 1000) as Time,
          value: parseFloat(kline[5]),
          color: parseFloat(kline[4]) >= parseFloat(kline[1]) ? '#0ECB81' : '#F6465D',
        }))

        candlestickSeriesRef.current.setData(candlestickData)
        volumeSeriesRef.current.setData(volumeData)
      }
    }

    fetchKlines()
  }, [symbol, interval])

  return <div ref={chartContainerRef} className="w-full h-[400px]" />
}

function OrderBookComponent() {
  const { orderBook, selectedPair } = useMarketStore()
  const pairInfo = TRADING_PAIRS.find((p) => p.symbol === selectedPair)

  if (!orderBook || !pairInfo) return null

  const bids = orderBook.bids.slice(0, 10)
  const asks = orderBook.asks.slice(0, 10).reverse()

  const totalBidAmount = bids.reduce((sum, bid) => sum + parseFloat(bid.price) * parseFloat(bid.quantity), 0)
  const totalAskAmount = asks.reduce((sum, ask) => sum + parseFloat(ask.price) * parseFloat(ask.quantity), 0)

  return (
    <div className="card p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold">
          {pairInfo.baseAsset} / {pairInfo.quoteAsset}
        </h3>
      </div>

      <div className="flex justify-between text-xs text-text-muted mb-2">
        <span>数量 {pairInfo.baseAsset}</span>
        <span>价格 {pairInfo.quoteAsset}</span>
        <span>总额</span>
      </div>

      <div className="space-y-1 mb-4">
        {asks.map((ask, index) => {
          const percent = (parseFloat(ask.price) * parseFloat(ask.quantity)) / totalAskAmount * 100
          return (
            <div key={index} className="flex items-center justify-between text-xs relative">
              <span className="text-text-secondary w-24 truncate">{formatQuantity(ask.quantity, pairInfo.quantityPrecision)}</span>
              <span className="text-red w-24 text-right">{formatPrice(ask.price, pairInfo.pricePrecision)}</span>
              <span className="text-text-muted w-20 text-right">
                {formatPrice((parseFloat(ask.price) * parseFloat(ask.quantity)).toFixed(2))}
              </span>
              <div className="absolute right-0 h-full bg-red-bg" style={{ width: `${percent}%` }} />
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center py-2 border-y border-border-color">
        <span className="text-text-muted text-xs">Ask</span>
        <span className="text-red font-semibold">
          ${formatPrice(orderBook.asks[0]?.price || '0', pairInfo.pricePrecision)}
        </span>
      </div>

      <div className="flex justify-between items-center py-2">
        <span className="text-text-muted text-xs">Bid</span>
        <span className="text-green font-semibold">
          ${formatPrice(orderBook.bids[0]?.price || '0', pairInfo.pricePrecision)}
        </span>
      </div>

      <div className="space-y-1 mt-4">
        {bids.map((bid, index) => {
          const percent = (parseFloat(bid.price) * parseFloat(bid.quantity)) / totalBidAmount * 100
          return (
            <div key={index} className="flex items-center justify-between text-xs relative">
              <span className="text-text-secondary w-24 truncate">{formatQuantity(bid.quantity, pairInfo.quantityPrecision)}</span>
              <span className="text-green w-24 text-right">{formatPrice(bid.price, pairInfo.pricePrecision)}</span>
              <span className="text-text-muted w-20 text-right">
                {formatPrice((parseFloat(bid.price) * parseFloat(bid.quantity)).toFixed(2))}
              </span>
              <div className="absolute right-0 h-full bg-green-bg" style={{ width: `${percent}%` }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TradeFormComponent() {
  const { selectedPair, currentPrice } = useMarketStore()
  const { addOrder } = useOrderStore()
  const { balances, addTransaction } = useWalletStore()
  const { language } = useUserStore()

  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [type, setType] = useState<'LIMIT' | 'MARKET'>('LIMIT')
  const [price, setPrice] = useState(currentPrice)
  const [quantity, setQuantity] = useState('')
  const [amount, setAmount] = useState('')

  const pairInfo = TRADING_PAIRS.find((p) => p.symbol === selectedPair)
  if (!pairInfo) return null

  const baseBalance = balances[pairInfo.baseAsset]
  const quoteBalance = balances[pairInfo.quoteAsset]
  const availableBase = baseBalance ? parseFloat(baseBalance.free) : 0
  const availableQuote = quoteBalance ? parseFloat(quoteBalance.free) : 0

  const total = price && quantity ? (parseFloat(price) * parseFloat(quantity)).toFixed(2) : '0'

  useEffect(() => {
    setPrice(currentPrice)
  }, [currentPrice])

  const handlePercentClick = (percent: number) => {
    if (side === 'BUY') {
      const maxQty = (availableQuote / parseFloat(price || '1')) * (percent / 100)
      setQuantity(maxQty.toFixed(pairInfo.quantityPrecision))
    } else {
      const maxQty = availableBase * (percent / 100)
      setQuantity(maxQty.toFixed(pairInfo.quantityPrecision))
    }
  }

  const handleQuantityChange = (value: string) => {
    setQuantity(value)
    if (price) {
      setAmount((parseFloat(value) * parseFloat(price)).toFixed(2))
    }
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    if (price) {
      setQuantity((parseFloat(value) / parseFloat(price)).toFixed(pairInfo.quantityPrecision))
    }
  }

  const handleSubmit = () => {
    if (!quantity || !price) return

    addOrder({
      pair: selectedPair,
      type,
      side,
      price,
      quantity,
      filled: '0',
      status: 'NEW',
      id: '',
      createTime: Date.now(),
    })

    if (side === 'BUY') {
      const cost = parseFloat(price) * parseFloat(quantity)
      addTransaction({
        type: 'TRADE',
        asset: pairInfo.quoteAsset,
        amount: `-${cost.toFixed(2)}`,
        status: 'SUCCESS',
        id: '',
        createTime: Date.now(),
      })
    } else {
      addTransaction({
        type: 'TRADE',
        asset: pairInfo.baseAsset,
        amount: `-${quantity}`,
        status: 'SUCCESS',
        id: '',
        createTime: Date.now(),
      })
    }

    setQuantity('')
    setAmount('')
  }

  return (
    <div className="card p-4 h-full">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSide('BUY')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
            side === 'BUY' ? 'bg-green text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          {language === 'zh' ? '买入' : 'Buy'}
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
            side === 'SELL' ? 'bg-red text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          {language === 'zh' ? '卖出' : 'Sell'}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setType('LIMIT')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
            type === 'LIMIT' ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          {language === 'zh' ? '限价单' : 'Limit'}
        </button>
        <button
          onClick={() => setType('MARKET')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
            type === 'MARKET' ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          {language === 'zh' ? '市价单' : 'Market'}
        </button>
      </div>

      {type === 'LIMIT' && (
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <label className="text-text-secondary text-sm">
              {language === 'zh' ? '价格' : 'Price'} ({pairInfo.quoteAsset})
            </label>
            <span className="text-text-muted text-sm">
              {language === 'zh' ? '最新价' : 'Last Price'}: ${formatPrice(currentPrice)}
            </span>
          </div>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input-field w-full"
            placeholder="0.00"
          />
        </div>
      )}

      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <label className="text-text-secondary text-sm">
            {language === 'zh' ? '数量' : 'Quantity'} ({pairInfo.baseAsset})
          </label>
          <span className="text-text-muted text-sm">
            {language === 'zh' ? '可用' : 'Available'}: {formatQuantity(side === 'BUY' ? availableQuote.toString() : availableBase.toString())}
          </span>
        </div>
        <input
          type="number"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="input-field w-full"
          placeholder="0.00"
        />
        <div className="flex gap-2 mt-2">
          {[25, 50, 75, 100].map((p) => (
            <button
              key={p}
              onClick={() => handlePercentClick(p)}
              className="flex-1 py-1 bg-bg-hover rounded text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              {p}%
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <label className="text-text-secondary text-sm">
            {language === 'zh' ? '总额' : 'Total'} ({pairInfo.quoteAsset})
          </label>
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          className="input-field w-full"
          placeholder="0.00"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-text-muted">{language === 'zh' ? '手续费' : 'Fee'}:</span>
          <span className="text-text-primary ml-2">0.1%</span>
        </div>
        <div>
          <span className="text-text-muted">{language === 'zh' ? '预计总额' : 'Est. Total'}:</span>
          <span className={`ml-2 ${side === 'BUY' ? 'text-green' : 'text-red'}`}>${total}</span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!quantity || (type === 'LIMIT' && !price)}
        className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          side === 'BUY' ? 'bg-green text-bg-dark hover:opacity-90' : 'bg-red text-bg-dark hover:opacity-90'
        }`}
      >
        {language === 'zh' ? `${side === 'BUY' ? '买入' : '卖出'} ${pairInfo.baseAsset}` : `${side} ${pairInfo.baseAsset}`}
      </button>
    </div>
  )
}

function RecentTradesComponent() {
  const { recentTrades, selectedPair } = useMarketStore()
  const { language } = useUserStore()
  const pairInfo = TRADING_PAIRS.find((p) => p.symbol === selectedPair)

  if (!pairInfo) return null

  return (
    <div className="card p-4 h-full">
      <h3 className="text-text-primary font-semibold mb-4">
        {recentTrades.length > 0 ? `${language === 'zh' ? '最近成交' : 'Recent Trades'}` : `${language === 'zh' ? '暂无成交' : 'No Trades'}`}
      </h3>

      <div className="flex justify-between text-xs text-text-muted mb-2">
        <span>{language === 'zh' ? '价格' : 'Price'}</span>
        <span>{language === 'zh' ? '数量' : 'Qty'}</span>
        <span>{language === 'zh' ? '金额' : 'Total'}</span>
        <span>{language === 'zh' ? '时间' : 'Time'}</span>
      </div>

      <div className="space-y-1">
        {recentTrades.slice(0, 20).map((trade) => {
          const time = new Date(trade.time).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
          return (
            <div key={trade.id} className="flex items-center justify-between text-xs">
              <span className={trade.isBuyerMaker ? 'text-red' : 'text-green'}>
                ${formatPrice(trade.price, pairInfo.pricePrecision)}
              </span>
              <span className="text-text-secondary">
                {formatQuantity(trade.qty, pairInfo.quantityPrecision)}
              </span>
              <span className="text-text-muted">
                ${formatPrice((parseFloat(trade.price) * parseFloat(trade.qty)).toFixed(2))}
              </span>
              <span className="text-text-muted">{time}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OrderHistoryComponent() {
  const { selectedPair } = useMarketStore()
  const { orders, cancelOrder } = useOrderStore()
  const { language } = useUserStore()

  const pairInfo = TRADING_PAIRS.find((p) => p.symbol === selectedPair)
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open')

  const filteredOrders = orders.filter((o) => o.pair === selectedPair)
  const openOrders = filteredOrders.filter((o) => o.status === 'NEW' || o.status === 'PARTIALLY_FILLED')
  const historyOrders = filteredOrders.filter((o) => o.status === 'FILLED' || o.status === 'CANCELED')

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      NEW: language === 'zh' ? '待成交' : 'Pending',
      PARTIALLY_FILLED: language === 'zh' ? '部分成交' : 'Partially Filled',
      FILLED: language === 'zh' ? '已成交' : 'Filled',
      CANCELED: language === 'zh' ? '已取消' : 'Canceled',
      REJECTED: language === 'zh' ? '已拒绝' : 'Rejected',
      EXPIRED: language === 'zh' ? '已过期' : 'Expired',
    }
    return statusMap[status] || status
  }

  return (
    <div className="card p-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'open' ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          {language === 'zh' ? '当前委托' : 'Open Orders'} ({openOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'history' ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          {language === 'zh' ? '历史委托' : 'History'} ({historyOrders.length})
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-text-muted border-b border-border-color">
              <th className="text-left py-2">{language === 'zh' ? '方向' : 'Side'}</th>
              <th className="text-left py-2">{language === 'zh' ? '类型' : 'Type'}</th>
              <th className="text-right py-2">{language === 'zh' ? '价格' : 'Price'}</th>
              <th className="text-right py-2">{language === 'zh' ? '数量' : 'Qty'}</th>
              <th className="text-right py-2">{language === 'zh' ? '金额' : 'Total'}</th>
              <th className="text-center py-2">{language === 'zh' ? '状态' : 'Status'}</th>
              <th className="text-right py-2">{language === 'zh' ? '时间' : 'Time'}</th>
              <th className="text-right py-2">{language === 'zh' ? '操作' : 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'open' ? openOrders : historyOrders).map((order) => (
              <tr key={order.id} className="text-sm border-b border-border-color last:border-b-0">
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    order.side === 'BUY' ? 'bg-green-bg text-green' : 'bg-red-bg text-red'
                  }`}>
                    {order.side === 'BUY' ? (language === 'zh' ? '买入' : 'Buy') : (language === 'zh' ? '卖出' : 'Sell')}
                  </span>
                </td>
                <td className="py-2 text-text-secondary">
                  {order.type === 'LIMIT' ? (language === 'zh' ? '限价' : 'Limit') : (language === 'zh' ? '市价' : 'Market')}
                </td>
                <td className="py-2 text-right text-text-primary">
                  ${formatPrice(order.price, pairInfo?.pricePrecision || 2)}
                </td>
                <td className="py-2 text-right text-text-secondary">
                  {formatQuantity(order.quantity, pairInfo?.quantityPrecision || 4)}
                </td>
                <td className="py-2 text-right text-text-muted">
                  ${formatPrice((parseFloat(order.price) * parseFloat(order.quantity)).toFixed(2))}
                </td>
                <td className="py-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.status === 'FILLED' ? 'bg-green-bg text-green' :
                    order.status === 'CANCELED' ? 'bg-bg-hover text-text-muted' :
                    'bg-primary/20 text-primary'
                  }`}>
                    {formatStatus(order.status)}
                  </span>
                </td>
                <td className="py-2 text-right text-text-muted text-xs">
                  {new Date(order.createTime).toLocaleString('zh-CN')}
                </td>
                <td className="py-2 text-right">
                  {order.status === 'NEW' && (
                    <button onClick={() => cancelOrder(order.id)} className="text-red text-xs hover:underline">
                      {language === 'zh' ? '取消' : 'Cancel'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {((activeTab === 'open' ? openOrders : historyOrders).length === 0) && (
        <div className="text-center py-8 text-text-muted">
          {language === 'zh' ? '暂无委托记录' : 'No orders found'}
        </div>
      )}
    </div>
  )
}

function PairSelector() {
  const { selectedPair, setSelectedPair, getTradingPairs } = useMarketStore()
  const [isOpen, setIsOpen] = useState(false)

  const tradingPairs = getTradingPairs()
  const currentPair = tradingPairs.find((p) => p.symbol === selectedPair)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-bg-hover rounded-lg text-text-primary font-semibold"
      >
        <span>{currentPair?.symbol}</span>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-bg-card border border-border-color rounded-lg shadow-xl z-50">
          <div className="p-2">
            {tradingPairs.map((pair) => (
              <button
                key={pair.symbol}
                onClick={() => {
                  setSelectedPair(pair.symbol)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedPair === pair.symbol ? 'bg-primary text-bg-dark' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                {pair.symbol}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function TradePage() {
  const { pair } = useParams<{ pair: string }>()
  const { selectedPair, setSelectedPair, chartInterval, setChartInterval, tickers } = useMarketStore()
  const { language } = useUserStore()

  useEffect(() => {
    if (pair) {
      setSelectedPair(pair)
    }
  }, [pair, setSelectedPair])

  useBinanceWS(selectedPair)
  useInitialOrderBook(selectedPair)

  const currentTicker = tickers.find((t) => t.symbol === selectedPair)
  const pairInfo = TRADING_PAIRS.find((p) => p.symbol === selectedPair)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <PairSelector />
          {currentTicker && pairInfo && (
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-text-primary">
                ${formatPrice(currentTicker.lastPrice)}
              </span>
              <span className={`text-lg ${getPriceColorClass(currentTicker.priceChangePercent)}`}>
                {currentTicker.priceChangePercent}%
              </span>
              <span className="text-text-muted text-sm">
                {language === 'zh' ? '24h成交量' : '24h Volume'}: ${(parseFloat(currentTicker.quoteVolume) / 1e6).toFixed(2)}M
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {CHART_INTERVALS.map((interval) => (
            <button
              key={interval.value}
              onClick={() => setChartInterval(interval.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                chartInterval === interval.value ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
              }`}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="card p-4">
            <ChartComponent symbol={selectedPair} interval={chartInterval} />
          </div>

          <div className="mt-6">
            <OrderHistoryComponent />
          </div>
        </div>

        <div className="space-y-6">
          <OrderBookComponent />
          <TradeFormComponent />
          <RecentTradesComponent />
        </div>
      </div>
    </div>
  )
}
