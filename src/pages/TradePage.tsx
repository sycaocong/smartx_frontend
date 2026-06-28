import { useEffect, useState, useRef, useMemo } from 'react'
import { useMarketStore } from '../stores/marketStore'
import { useOrderStore } from '../stores/orderStore'
import { useWalletStore } from '../stores/walletStore'
import { useUserStore } from '../stores/userStore'
import { useMatchingEngineWS, useInitialOrderBook } from '../hooks/useBinanceWS'
import { getKlines, getMatchingEngineTicker, generateMockOrderBook, generateMockTicker } from '../utils/binance'
import { formatPrice, formatQuantity } from '../utils/format'
import { TRADING_PAIRS, CHART_INTERVALS } from '../constants/tradingPairs'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType, LineData, HistogramData, CrosshairMode } from 'lightweight-charts'
import { matchingEngineApi } from '../services/api'
import type { Order } from '../types/order'
import type { TickerResponse } from '../services/api'

function SparklineChart({ data, color }: { data: number[]; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || data.length < 2) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 2

    ctx.clearRect(0, 0, width, height)

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * (width - padding * 2),
      y: height - padding - ((value - min) / range) * (height - padding * 2),
    }))

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, color + '40')
    gradient.addColorStop(1, color + '00')

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.lineTo(points[points.length - 1].x, height)
    ctx.lineTo(points[0].x, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()
  }, [data, color])

  return <canvas ref={canvasRef} width={120} height={40} className="w-30 h-10" />
}

function MiniPriceBoard({ symbol }: { symbol: string }) {
  const { tickers, recentTrades, setOrderBook, setCurrentPrice } = useMarketStore()
  const [tickerData, setTickerData] = useState<TickerResponse | null>(null)
  
  useEffect(() => {
    const loadTicker = async () => {
      const ticker = await getMatchingEngineTicker(symbol)
      if (ticker && ticker.last_price > 0) {
          setTickerData(ticker)
          setCurrentPrice(String(ticker.last_price))
          
          const mockOrderBook = generateMockOrderBook(ticker.last_price)
          setOrderBook(mockOrderBook)
        } else {
        const mockTicker = generateMockTicker(symbol)
        setTickerData(mockTicker)
        setCurrentPrice(String(mockTicker.last_price))
        const mockOrderBook = generateMockOrderBook(mockTicker.last_price)
        setOrderBook(mockOrderBook)
      }
    }
    
    loadTicker()
  }, [symbol, setCurrentPrice, setOrderBook])

  const ticker = tickers.find(t => t.symbol === symbol) || tickerData
  const pairInfo = TRADING_PAIRS.find(p => p.symbol === symbol)

  const priceHistory = useMemo(() => {
    return recentTrades.slice(0, 20).reverse().map(t => parseFloat(t.price))
  }, [recentTrades])

  const priceChange = ticker 
    ? typeof ticker === 'object' && 'priceChangePercent' in ticker 
      ? parseFloat(ticker.priceChangePercent) 
      : ticker.price_change_pct || 0
    : 0
  const isUp = priceChange >= 0

  if (!ticker || !pairInfo) return null

  const lastPrice = typeof ticker === 'object' && 'lastPrice' in ticker 
    ? ticker.lastPrice 
    : String(ticker.last_price || 0)

  const highPrice = typeof ticker === 'object' && 'highPrice' in ticker 
    ? ticker.highPrice 
    : String(ticker.high_24h || 0)

  const lowPrice = typeof ticker === 'object' && 'lowPrice' in ticker 
    ? ticker.lowPrice 
    : String(ticker.low_24h || 0)

  const priceChangeVal = typeof ticker === 'object' && 'priceChange' in ticker 
    ? ticker.priceChange 
    : String(ticker.price_change || 0)

  const quoteVolume = typeof ticker === 'object' && 'quoteVolume' in ticker 
    ? ticker.quoteVolume 
    : String(ticker.quote_volume_24h || 0)

  return (
    <div className="flex items-center gap-6 bg-bg-card p-4 rounded-lg border border-border-color">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold text-text-primary">
          ${formatPrice(lastPrice)}
        </div>
        <div className={`text-lg font-semibold ${isUp ? 'text-green' : 'text-red'}`}>
          {isUp ? '+' : ''}{priceChange}%
        </div>
      </div>

      <div className="flex-1 flex items-center gap-6">
        <div className="text-center">
          <div className="text-text-muted text-xs mb-1">{pairInfo.quoteAsset} {quoteVolume ? '24h成交额' : '24h Vol'}</div>
          <div className="text-text-primary font-semibold">
            ${(parseFloat(quoteVolume || '0') / 1e6).toFixed(2)}M
          </div>
        </div>
        <div className="text-center">
          <div className="text-text-muted text-xs mb-1">24h最高</div>
          <div className="text-text-primary font-semibold">${formatPrice(highPrice)}</div>
        </div>
        <div className="text-center">
          <div className="text-text-muted text-xs mb-1">24h最低</div>
          <div className="text-text-primary font-semibold">${formatPrice(lowPrice)}</div>
        </div>
        <div className="text-center">
          <div className="text-text-muted text-xs mb-1">24h涨跌额</div>
          <div className={`font-semibold ${isUp ? 'text-green' : 'text-red'}`}>
            {isUp ? '+' : ''}${formatPrice(priceChangeVal)}
          </div>
        </div>
      </div>

      <SparklineChart data={priceHistory} color={isUp ? '#0ECB81' : '#F6465D'} />
    </div>
  )
}

type ChartType = 'candlestick' | 'line'

function ChartComponent({ symbol, interval }: { symbol: string; interval: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ma7SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ma25SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ma99SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const macdSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const macdSignalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [showVolume, setShowVolume] = useState(true)
  const [showMA, setShowMA] = useState(true)
  const [showMACD, setShowMACD] = useState(false)
  const [showRSI, setShowRSI] = useState(false)

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
      height: 420,
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#2B3139',
      },
      timeScale: {
        borderColor: '#2B3139',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    if (chartType === 'candlestick') {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#0ECB81',
        downColor: '#F6465D',
        borderUpColor: '#0ECB81',
        borderDownColor: '#F6465D',
      })
      candlestickSeriesRef.current = candlestickSeries
    } else {
      const lineSeries = chart.addLineSeries({
        color: '#0ECB81',
        lineWidth: 2,
      })
      lineSeriesRef.current = lineSeries
    }

    const volumeSeries = chart.addHistogramSeries({
      color: '#F0B90B',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    })
    volumeSeriesRef.current = volumeSeries

    if (showMA) {
      const ma7 = chart.addLineSeries({
        color: '#F0B90B',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      const ma25 = chart.addLineSeries({
        color: '#FF6B9D',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      const ma99 = chart.addLineSeries({
        color: '#9B59B6',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      ma7SeriesRef.current = ma7
      ma25SeriesRef.current = ma25
      ma99SeriesRef.current = ma99
    }

    if (showMACD) {
      const macd = chart.addHistogramSeries({
        color: '#0ECB81',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      })
      const macdSignal = chart.addLineSeries({
        color: '#F6465D',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      macdSeriesRef.current = macd
      macdSignalSeriesRef.current = macdSignal
    }

    if (showRSI) {
      const rsi = chart.addLineSeries({
        color: '#3498DB',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      rsiSeriesRef.current = rsi
    }

    chartRef.current = chart

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
      // 清理所有 series refs
      candlestickSeriesRef.current = null
      lineSeriesRef.current = null
      volumeSeriesRef.current = null
      ma7SeriesRef.current = null
      ma25SeriesRef.current = null
      ma99SeriesRef.current = null
      macdSeriesRef.current = null
      macdSignalSeriesRef.current = null
      rsiSeriesRef.current = null
    }
  }, [chartType, showMA, showMACD, showRSI])

  useEffect(() => {
    let isCancelled = false

    const fetchKlines = async () => {
      try {
        const response = await getKlines(symbol, interval, 200)
        
        // 检查组件是否已卸载
        if (isCancelled || !chartRef.current) return
        if (!response.data) return

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

        if (chartType === 'candlestick' && candlestickSeriesRef.current) {
          candlestickSeriesRef.current.setData(candlestickData)
        } else if (chartType === 'line' && lineSeriesRef.current) {
          const lineData: LineData<Time>[] = candlestickData.map(d => ({ time: d.time, value: d.close }))
          lineSeriesRef.current.setData(lineData)
        }

        if (showVolume && volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(volumeData)
        }

        if (showMA) {
          if (ma7SeriesRef.current) ma7SeriesRef.current.setData(calculateMA(candlestickData, 7))
          if (ma25SeriesRef.current) ma25SeriesRef.current.setData(calculateMA(candlestickData, 25))
          if (ma99SeriesRef.current) ma99SeriesRef.current.setData(calculateMA(candlestickData, 99))
        }

        if (showMACD) {
          const closePrices = response.data.map((k: any) => parseFloat(k[4]))
          const macdResult = calculateMACD(closePrices)
          if (macdSeriesRef.current && macdSignalSeriesRef.current) {
            macdSeriesRef.current.setData(macdResult.macd)
            macdSignalSeriesRef.current.setData(macdResult.signal)
          }
        }

        if (showRSI) {
          const closePrices = response.data.map((k: any) => parseFloat(k[4]))
          const rsiData = calculateRSI(closePrices)
          if (rsiSeriesRef.current) {
            rsiSeriesRef.current.setData(rsiData)
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to fetch klines:', error)
        }
      }
    }

    fetchKlines()
    
    return () => {
      isCancelled = true
    }
  }, [symbol, interval, chartType, showVolume, showMA, showMACD, showRSI])

  const calculateMA = (data: CandlestickData<Time>[], period: number): LineData<Time>[] => {
    const result: LineData<Time>[] = []
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close
      }
      result.push({
        time: data[i].time,
        value: sum / period,
      })
    }
    return result
  }

  const calculateMACD = (prices: number[]): { macd: HistogramData<Time>[]; signal: LineData<Time>[] } => {
    const ema12 = calculateEMA(prices, 12)
    const ema26 = calculateEMA(prices, 26)
    const macd: number[] = []
    for (let i = 0; i < ema12.length && i < ema26.length; i++) {
      macd.push(ema12[i] - ema26[i])
    }
    const signal = calculateEMA(macd, 9)
    const macdData: HistogramData<Time>[] = macd.map((value, i) => ({
      time: Math.floor(Date.now() / 1000 - (macd.length - i) * getIntervalSeconds(interval)) as Time,
      value,
      color: value >= 0 ? '#0ECB81' : '#F6465D',
    }))
    const signalData: LineData<Time>[] = signal.map((value, i) => ({
      time: Math.floor(Date.now() / 1000 - (signal.length - i) * getIntervalSeconds(interval)) as Time,
      value,
    }))
    return { macd: macdData, signal: signalData }
  }

  const calculateEMA = (prices: number[], period: number): number[] => {
    const result: number[] = []
    const k = 2 / (period + 1)
    let ema = prices[0]
    result.push(ema)
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k)
      result.push(ema)
    }
    return result
  }

  const calculateRSI = (prices: number[], period: number = 14): LineData<Time>[] => {
    const result: LineData<Time>[] = []
    const gains: number[] = []
    const losses: number[] = []

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      gains.push(Math.max(0, change))
      losses.push(Math.max(0, -change))
    }

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      const rsi = 100 - (100 / (1 + rs))
      result.push({
        time: Math.floor(Date.now() / 1000 - (gains.length - i) * getIntervalSeconds(interval)) as Time,
        value: rsi,
      })
    }
    return result
  }

  const getIntervalSeconds = (interval: string): number => {
    const map: Record<string, number> = {
      '1m': 60, '5m': 300, '15m': 900, '30m': 1800,
      '1h': 3600, '4h': 14400, '8h': 28800, '1d': 86400,
      '1w': 604800
    }
    return map[interval] || 3600
  }

  const handleChartTypeChange = (type: ChartType) => {
    if (type !== chartType) {
      setChartType(type)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleChartTypeChange('candlestick')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              chartType === 'candlestick' ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
            }`}
          >
            K线
          </button>
          <button
            onClick={() => handleChartTypeChange('line')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              chartType === 'line' ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
            }`}
          >
            分时
          </button>
        </div>
        <div className="flex items-center gap-2">
          {showMA && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-yellow">MA7</span>
              <span className="text-pink">MA25</span>
              <span className="text-purple">MA99</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              showVolume ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-muted'
            }`}
          >
            成交量
          </button>
          <button
            onClick={() => setShowMA(!showMA)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              showMA ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-muted'
            }`}
          >
            MA
          </button>
          <button
            onClick={() => setShowMACD(!showMACD)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              showMACD ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-muted'
            }`}
          >
            MACD
          </button>
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              showRSI ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-muted'
            }`}
          >
            RSI
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-text-muted hover:text-text-primary transition-colors" title="画线">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
          <button className="text-text-muted hover:text-text-primary transition-colors" title="全屏">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      <div ref={chartContainerRef} className="w-full h-[420px]" />
    </div>
  )
}

function DepthChartComponent() {
  const { orderBook } = useMarketStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !orderBook) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const bids = orderBook.bids.slice(0, 50)
    const asks = orderBook.asks.slice(0, 50)

    if (bids.length === 0 && asks.length === 0) return

    const allPrices = [
      ...bids.map((b) => parseFloat(b.price)),
      ...asks.map((a) => parseFloat(a.price)),
    ]
    const minPrice = Math.min(...allPrices)
    const maxPrice = Math.max(...allPrices)
    const priceRange = maxPrice - minPrice || 1

    const totalBidVolume = bids.reduce((sum, b) => sum + parseFloat(b.quantity), 0)
    const totalAskVolume = asks.reduce((sum, a) => sum + parseFloat(a.quantity), 0)
    const maxVolume = Math.max(totalBidVolume, totalAskVolume) || 1

    let cumulativeBid = 0
    bids.forEach((bid) => {
      const price = parseFloat(bid.price)
      const quantity = parseFloat(bid.quantity)
      cumulativeBid += quantity

      const x = ((price - minPrice) / priceRange) * width
      const y = height - (cumulativeBid / maxVolume) * height * 0.8

      const gradient = ctx.createLinearGradient(x, height, x, y)
      gradient.addColorStop(0, 'rgba(14, 203, 129, 0)')
      gradient.addColorStop(1, 'rgba(14, 203, 129, 0.5)')

      ctx.fillStyle = gradient
      ctx.fillRect(x - 2, y, 4, height - y)
    })

    let cumulativeAsk = 0
    asks.forEach((ask) => {
      const price = parseFloat(ask.price)
      const quantity = parseFloat(ask.quantity)
      cumulativeAsk += quantity

      const x = ((price - minPrice) / priceRange) * width
      const y = (cumulativeAsk / maxVolume) * height * 0.8

      const gradient = ctx.createLinearGradient(x, 0, x, y)
      gradient.addColorStop(0, 'rgba(246, 70, 93, 0.5)')
      gradient.addColorStop(1, 'rgba(246, 70, 93, 0)')

      ctx.fillStyle = gradient
      ctx.fillRect(x - 2, 0, 4, y)
    })
  }, [orderBook])

  return (
    <canvas ref={canvasRef} width={300} height={60} className="w-full h-14" />
  )
}

function OrderBookComponent({ onPriceClick, onQuickTrade }: { onPriceClick: (price: string) => void; onQuickTrade: (price: string, side: 'BUY' | 'SELL') => void }) {
  const { orderBook, selectedPair } = useMarketStore()
  const { language } = useUserStore()
  const pairInfo = TRADING_PAIRS.find((p) => p.symbol === selectedPair)

  const [viewMode, setViewMode] = useState<'normal' | 'detail'>('normal')

  if (!orderBook || !pairInfo) return null

  const bids = orderBook.bids.slice(0, viewMode === 'detail' ? 20 : 15)
  const asks = orderBook.asks.slice(0, viewMode === 'detail' ? 20 : 15).reverse()

  const totalBidQty = bids.reduce((sum, b) => sum + parseFloat(b.quantity), 0)
  const totalAskQty = asks.reduce((sum, a) => sum + parseFloat(a.quantity), 0)
  const bidAskRatio = totalAskQty > 0 ? (totalBidQty / totalAskQty).toFixed(2) : '0'

  const totalBidAmount = bids.reduce((sum, bid) => sum + parseFloat(bid.price) * parseFloat(bid.quantity), 0)
  const totalAskAmount = asks.reduce((sum, ask) => sum + parseFloat(ask.price) * parseFloat(ask.quantity), 0)

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-text-primary font-semibold text-sm">
            {pairInfo.baseAsset} / {pairInfo.quoteAsset}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            {language === 'zh' ? '买卖比' : 'B/A Ratio'}: 
            <span className={`ml-1 font-medium ${parseFloat(bidAskRatio) >= 1 ? 'text-green' : 'text-red'}`}>
              {bidAskRatio}
            </span>
          </span>
          <button
            onClick={() => setViewMode(viewMode === 'normal' ? 'detail' : 'normal')}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {viewMode === 'normal' ? (language === 'zh' ? '详细' : 'Detail') : (language === 'zh' ? '简洁' : 'Simple')}
          </button>
        </div>
      </div>

      <DepthChartComponent />

      <div className="flex justify-between text-xs text-text-muted mb-2 mt-2">
        <span className="w-12">{language === 'zh' ? '数量' : 'Qty'}</span>
        <span className="w-16 text-right">{language === 'zh' ? '价格' : 'Price'}</span>
        <span className="w-14 text-right">{language === 'zh' ? '总额' : 'Total'}</span>
        <span className="w-10 text-center">{language === 'zh' ? '操作' : 'Act'}</span>
      </div>

      <div className="space-y-0.5 mb-2 max-h-44 overflow-y-auto">
        {asks.map((ask, index) => {
          const percent = totalAskAmount > 0 ? (parseFloat(ask.price) * parseFloat(ask.quantity)) / totalAskAmount * 100 : 0
          return (
            <div
              key={index}
              className="flex items-center justify-between text-xs relative cursor-pointer hover:bg-bg-hover/30 px-1 py-0.5 rounded transition-colors"
            >
              <span className="text-text-secondary w-12 truncate" onClick={() => onPriceClick(ask.price)}>
                {formatQuantity(ask.quantity, pairInfo.quantityPrecision)}
              </span>
              <span className="text-red w-16 text-right font-medium" onClick={() => onPriceClick(ask.price)}>
                ${formatPrice(ask.price, pairInfo.pricePrecision)}
              </span>
              <span className="text-text-muted w-14 text-right">
                ${formatPrice((parseFloat(ask.price) * parseFloat(ask.quantity)).toFixed(2))}
              </span>
              <button
                onClick={() => onQuickTrade(ask.price, 'BUY')}
                className="w-8 h-5 bg-green/20 text-green text-xs font-medium rounded hover:bg-green/30 transition-colors"
              >
                {language === 'zh' ? '买' : 'B'}
              </button>
              <div className="absolute right-0 h-full bg-red-bg/20" style={{ width: `${Math.min(percent, 100)}%` }} />
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center py-2 border-y border-border-color">
        <span className="text-text-muted text-xs">{language === 'zh' ? '卖一' : 'Ask'}</span>
        <span className="text-red font-bold text-lg">
          ${formatPrice(orderBook.asks[0]?.price || '0', pairInfo.pricePrecision)}
        </span>
        <span className="text-text-muted text-xs">
          {formatQuantity(orderBook.asks[0]?.quantity || '0', pairInfo.quantityPrecision)}
        </span>
      </div>

      <div className="flex justify-between items-center py-2">
        <span className="text-text-muted text-xs">{language === 'zh' ? '买一' : 'Bid'}</span>
        <span className="text-green font-bold text-lg">
          ${formatPrice(orderBook.bids[0]?.price || '0', pairInfo.pricePrecision)}
        </span>
        <span className="text-text-muted text-xs">
          {formatQuantity(orderBook.bids[0]?.quantity || '0', pairInfo.quantityPrecision)}
        </span>
      </div>

      <div className="space-y-0.5 mt-2 max-h-44 overflow-y-auto">
        {bids.map((bid, index) => {
          const percent = totalBidAmount > 0 ? (parseFloat(bid.price) * parseFloat(bid.quantity)) / totalBidAmount * 100 : 0
          return (
            <div
              key={index}
              className="flex items-center justify-between text-xs relative cursor-pointer hover:bg-bg-hover/30 px-1 py-0.5 rounded transition-colors"
            >
              <span className="text-text-secondary w-12 truncate" onClick={() => onPriceClick(bid.price)}>
                {formatQuantity(bid.quantity, pairInfo.quantityPrecision)}
              </span>
              <span className="text-green w-16 text-right font-medium" onClick={() => onPriceClick(bid.price)}>
                ${formatPrice(bid.price, pairInfo.pricePrecision)}
              </span>
              <span className="text-text-muted w-14 text-right">
                ${formatPrice((parseFloat(bid.price) * parseFloat(bid.quantity)).toFixed(2))}
              </span>
              <button
                onClick={() => onQuickTrade(bid.price, 'SELL')}
                className="w-8 h-5 bg-red/20 text-red text-xs font-medium rounded hover:bg-red/30 transition-colors"
              >
                {language === 'zh' ? '卖' : 'S'}
              </button>
              <div className="absolute right-0 h-full bg-green-bg/20" style={{ width: `${Math.min(percent, 100)}%` }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TradeFormComponent({ priceFromOrderBook, quickTradePrice, quickTradeSide }: { priceFromOrderBook: string; quickTradePrice: string; quickTradeSide: 'BUY' | 'SELL' | null }) {
  const { selectedPair, currentPrice } = useMarketStore()
  const { addOrder } = useOrderStore()
  const { balances, addTransaction } = useWalletStore()
  const { language } = useUserStore()

  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [type, setType] = useState<'LIMIT' | 'MARKET'>('LIMIT')
  const [price, setPrice] = useState(currentPrice)
  const [quantity, setQuantity] = useState('')
  const [amount, setAmount] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pairInfo = TRADING_PAIRS.find((p) => p.symbol === selectedPair)
  if (!pairInfo) return null

  const baseBalance = balances[pairInfo.baseAsset]
  const quoteBalance = balances[pairInfo.quoteAsset]
  const availableBase = baseBalance ? parseFloat(baseBalance.free) : 0
  const availableQuote = quoteBalance ? parseFloat(quoteBalance.free) : 0

  const total = price && quantity ? (parseFloat(price) * parseFloat(quantity)).toFixed(2) : '0'
  const fee = (parseFloat(total) * 0.001).toFixed(4)

  useEffect(() => {
    if (priceFromOrderBook) {
      setPrice(priceFromOrderBook)
    } else if (quickTradePrice && quickTradeSide) {
      setPrice(quickTradePrice)
      setSide(quickTradeSide)
    } else {
      setPrice(currentPrice)
    }
  }, [priceFromOrderBook, quickTradePrice, quickTradeSide, currentPrice])

  const handlePercentClick = (percent: number) => {
    if (side === 'BUY') {
      const maxQty = (availableQuote / parseFloat(price || '1')) * (percent / 100)
      setQuantity(maxQty.toFixed(pairInfo.quantityPrecision))
    } else {
      const maxQty = availableBase * (percent / 100)
      setQuantity(maxQty.toFixed(pairInfo.quantityPrecision))
    }
  }

  const handlePriceAdjust = (percent: number) => {
    const currentPriceNum = parseFloat(price || currentPrice || '0')
    const newPrice = currentPriceNum * (1 + percent / 100)
    setPrice(newPrice.toFixed(pairInfo.pricePrecision))
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

  const handleSubmit = async () => {
    if (!quantity || (type !== 'MARKET' && !price)) return
    setIsSubmitting(true)

    try {
      const response = await matchingEngineApi.createOrder({
        symbol: selectedPair,
        side,
        type,
        price: type !== 'MARKET' ? parseFloat(price) : 0,
        quantity: parseFloat(quantity),
      })

      if (response.success && response.data) {
        const order = response.data
        const statusMap: Record<number, Order['status']> = {
          0: 'NEW',
          1: 'OPEN',
          2: 'PARTIALLY_FILLED',
          3: 'FILLED',
          4: 'CANCELED',
          5: 'REJECTED',
          6: 'EXPIRED',
        }
        addOrder({
          pair: selectedPair,
          type,
          side,
          price: (order.price || 0).toString(),
          quantity: (order.quantity || 0).toString(),
          filled: (order.filled_quantity || 0).toString(),
          status: statusMap[order.status] || 'NEW',
          id: order.order_id || '',
          createTime: order.timestamp || Date.now(),
        })

        if (side === 'BUY') {
          const cost = parseFloat(price || '0') * parseFloat(quantity)
          addTransaction({
            type: 'TRADE',
            asset: pairInfo.quoteAsset,
            amount: `-${cost.toFixed(2)}`,
            status: 'SUCCESS',
            id: order.order_id || '',
            createTime: order.timestamp || Date.now(),
          })
        } else {
          addTransaction({
            type: 'TRADE',
            asset: pairInfo.baseAsset,
            amount: `-${quantity}`,
            status: 'SUCCESS',
            id: order.order_id || '',
            createTime: order.timestamp || Date.now(),
          })
        }

        setQuantity('')
        setAmount('')
      } else {
        console.error('Order creation failed:', response.error)
        alert(language === 'zh' ? '下单失败: ' + response.error : 'Order failed: ' + response.error)
      }
    } catch (error) {
      console.error('Order creation error:', error)
      alert(language === 'zh' ? '下单失败' : 'Order failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValidOrder = quantity && (type === 'MARKET' || price)

  return (
    <div className="card p-4">
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setSide('BUY')}
          className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${
            side === 'BUY' 
              ? 'bg-gradient-to-r from-green to-green/80 text-bg-dark shadow-lg shadow-green/30' 
              : 'bg-bg-hover text-text-secondary hover:text-green'
          }`}
        >
          {language === 'zh' ? '买入' : 'BUY'}
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${
            side === 'SELL' 
              ? 'bg-gradient-to-r from-red to-red/80 text-bg-dark shadow-lg shadow-red/30' 
              : 'bg-bg-hover text-text-secondary hover:text-red'
          }`}
        >
          {language === 'zh' ? '卖出' : 'SELL'}
        </button>
      </div>

      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setType('LIMIT')}
          className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
            type === 'LIMIT' ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          {language === 'zh' ? '限价单' : 'Limit'}
        </button>
        <button
          onClick={() => setType('MARKET')}
          className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
            type === 'MARKET' ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          {language === 'zh' ? '市价单' : 'Market'}
        </button>
      </div>

      {type === 'LIMIT' && (
        <div className="mb-3">
          <div className="flex justify-between mb-1.5">
            <label className="text-text-secondary text-xs font-medium">
              {language === 'zh' ? '委托价格' : 'Price'} ({pairInfo.quoteAsset})
            </label>
            <span className="text-text-muted text-xs">
              {language === 'zh' ? '最新价' : 'Last'}: <span className="text-primary">${formatPrice(currentPrice)}</span>
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-field flex-1 text-sm py-2"
              placeholder="0.00"
            />
            <div className="flex gap-1">
              <button
                onClick={() => handlePriceAdjust(-0.1)}
                className="px-2 py-1 bg-bg-hover rounded text-xs text-text-muted hover:text-red"
              >
                -0.1%
              </button>
              <button
                onClick={() => handlePriceAdjust(0.1)}
                className="px-2 py-1 bg-bg-hover rounded text-xs text-text-muted hover:text-green"
              >
                +0.1%
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="flex justify-between mb-1.5">
          <label className="text-text-secondary text-xs font-medium">
            {language === 'zh' ? '数量' : 'Quantity'} ({pairInfo.baseAsset})
          </label>
          <span className="text-text-muted text-xs">
            {language === 'zh' ? '可用' : 'Avail'}: <span className="text-text-primary">{formatQuantity(side === 'BUY' ? availableQuote.toString() : availableBase.toString())}</span>
          </span>
        </div>
        <input
          type="number"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="input-field w-full text-sm py-2"
          placeholder="0.00"
        />
        <div className="flex gap-1 mt-1.5">
          {[25, 50, 75, 100].map((p) => (
            <button
              key={p}
              onClick={() => handlePercentClick(p)}
              className="flex-1 py-1.5 bg-bg-hover rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover/80 transition-colors"
            >
              {p}%
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between mb-1.5">
          <label className="text-text-secondary text-xs font-medium">
            {language === 'zh' ? '总额' : 'Total'} ({pairInfo.quoteAsset})
          </label>
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          className="input-field w-full text-sm py-2"
          placeholder="0.00"
        />
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-text-muted text-xs mb-3 hover:text-text-secondary transition-colors flex items-center gap-1"
      >
        <span>{language === 'zh' ? (showAdvanced ? '▼' : '▶') : (showAdvanced ? '▼' : '▶')}</span>
        <span>{language === 'zh' ? (showAdvanced ? '收起' : '高级选项') : (showAdvanced ? 'Hide' : 'Advanced')}</span>
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-bg-hover rounded-lg text-xs">
          <div className="flex justify-between">
            <span className="text-text-muted">{language === 'zh' ? '手续费率' : 'Fee'}:</span>
            <span className="text-text-primary">0.1%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">{language === 'zh' ? '预估手续费' : 'Est. Fee'}:</span>
            <span className="text-text-primary">≈${fee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">{language === 'zh' ? '数量精度' : 'Qty Prec'}:</span>
            <span className="text-text-primary">{pairInfo.quantityPrecision}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">{language === 'zh' ? '价格精度' : 'Price Prec'}:</span>
            <span className="text-text-primary">{pairInfo.pricePrecision}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-sm mb-4 p-3 bg-bg-hover rounded-lg">
        <span className="text-text-muted">
          {language === 'zh' ? '预估总额' : 'Est. Total'}:
        </span>
        <span className={`font-bold text-lg ${side === 'BUY' ? 'text-green' : 'text-red'}`}>
          ${total}
        </span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValidOrder || isSubmitting}
        className={`w-full py-3.5 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          side === 'BUY' 
            ? 'bg-gradient-to-r from-green to-green/80 text-bg-dark hover:shadow-lg hover:shadow-green/40' 
            : 'bg-gradient-to-r from-red to-red/80 text-bg-dark hover:shadow-lg hover:shadow-red/40'
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {language === 'zh' ? '处理中...' : 'Processing...'}
          </span>
        ) : (
          language === 'zh' ? `${side === 'BUY' ? '买入' : '卖出'} ${pairInfo.baseAsset}` : `${side} ${pairInfo.baseAsset}`
        )}
      </button>
    </div>
  )
}

function RecentTradesComponent() {
  const { recentTrades, selectedPair } = useMarketStore()
  const { language } = useUserStore()
  const pairInfo = TRADING_PAIRS.find((p) => p.symbol === selectedPair)

  if (!pairInfo) return null

  const buyVolume = recentTrades.filter(t => !t.isBuyerMaker).reduce((sum, t) => sum + parseFloat(t.quantity), 0)
  const sellVolume = recentTrades.filter(t => t.isBuyerMaker).reduce((sum, t) => sum + parseFloat(t.quantity), 0)

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-primary font-semibold text-sm">
          {language === 'zh' ? '最新成交' : 'Recent Trades'}
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-green">▲ {formatQuantity(buyVolume.toString(), 2)}</span>
          <span className="text-red">▼ {formatQuantity(sellVolume.toString(), 2)}</span>
        </div>
      </div>

      <div className="flex justify-between text-xs text-text-muted mb-2">
        <span className="w-16">{language === 'zh' ? '价格' : 'Price'}</span>
        <span className="w-16 text-right">{language === 'zh' ? '数量' : 'Qty'}</span>
        <span className="text-right">{language === 'zh' ? '时间' : 'Time'}</span>
      </div>

      <div className="space-y-0.5 max-h-52 overflow-y-auto">
        {recentTrades.slice(0, 60).map((trade, index) => {
          const time = new Date(trade.time).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
          return (
            <div key={`${trade.id}-${index}`} className="flex items-center justify-between text-xs py-0.5">
              <span className={`w-16 font-medium ${trade.isBuyerMaker ? 'text-red' : 'text-green'}`}>
                ${formatPrice(trade.price, pairInfo.pricePrecision)}
              </span>
              <span className="text-text-secondary w-16 text-right">
                {formatQuantity(trade.quantity, pairInfo.quantityPrecision)}
              </span>
              <span className="text-text-muted text-right">{time}</span>
            </div>
          )
        })}
      </div>

      {recentTrades.length === 0 && (
        <div className="text-center py-6 text-text-muted text-xs">
          {language === 'zh' ? '暂无成交记录' : 'No trades yet'}
        </div>
      )}
    </div>
  )
}

function OrderHistoryComponent() {
  const { selectedPair } = useMarketStore()
  const { orders, cancelOrder } = useOrderStore()
  const { language } = useUserStore()

  const pairInfo = TRADING_PAIRS.find((p) => p.symbol === selectedPair)
  const [activeTab, setActiveTab] = useState<'open' | 'history' | 'tradeHistory'>('open')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const filteredOrders = orders.filter((o) => o.pair === selectedPair)
  const openOrders = filteredOrders.filter((o) => o.status === 'NEW' || o.status === 'PARTIALLY_FILLED')
  const historyOrders = filteredOrders.filter((o) => o.status === 'FILLED' || o.status === 'CANCELED')

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      NEW: language === 'zh' ? '待成交' : 'Pending',
      PARTIALLY_FILLED: language === 'zh' ? '部分成交' : 'Partial',
      FILLED: language === 'zh' ? '已成交' : 'Filled',
      CANCELED: language === 'zh' ? '已取消' : 'Canceled',
      REJECTED: language === 'zh' ? '已拒绝' : 'Rejected',
      EXPIRED: language === 'zh' ? '已过期' : 'Expired',
    }
    return statusMap[status] || status
  }

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId)
    try {
      const response = await matchingEngineApi.cancelOrder(orderId)
      if (response.success) {
        cancelOrder(orderId)
      } else {
        console.error('Cancel order failed:', response.error)
        alert(language === 'zh' ? '取消订单失败: ' + response.error : 'Cancel failed: ' + response.error)
      }
    } catch (error) {
      console.error('Cancel order error:', error)
      alert(language === 'zh' ? '取消订单失败' : 'Cancel failed')
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FILLED':
        return 'bg-green-bg text-green'
      case 'CANCELED':
      case 'EXPIRED':
        return 'bg-bg-hover text-text-muted'
      case 'PARTIALLY_FILLED':
        return 'bg-yellow-bg text-yellow'
      default:
        return 'bg-primary/20 text-primary'
    }
  }

  const displayOrders = activeTab === 'open' ? openOrders 
    : activeTab === 'history' ? historyOrders 
    : historyOrders.filter(o => o.status === 'FILLED')

  return (
    <div className="card p-4">
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'open' ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          {language === 'zh' ? '当前委托' : 'Open'} ({openOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'history' ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          {language === 'zh' ? '历史委托' : 'History'}
        </button>
        <button
          onClick={() => setActiveTab('tradeHistory')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'tradeHistory' ? 'bg-primary text-bg-dark' : 'bg-bg-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          {language === 'zh' ? '成交记录' : 'Trades'}
        </button>
      </div>

      <div className="overflow-x-auto">
        {displayOrders.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-text-muted border-b border-border-color">
                <th className="text-left py-2">{language === 'zh' ? '时间' : 'Time'}</th>
                <th className="text-left py-2">{language === 'zh' ? '方向' : 'Side'}</th>
                <th className="text-left py-2">{language === 'zh' ? '类型' : 'Type'}</th>
                <th className="text-right py-2">{language === 'zh' ? '价格' : 'Price'}</th>
                <th className="text-right py-2">{language === 'zh' ? '数量' : 'Qty'}</th>
                <th className="text-right py-2">{language === 'zh' ? '成交' : 'Filled'}</th>
                <th className="text-center py-2">{language === 'zh' ? '状态' : 'Status'}</th>
                {activeTab === 'open' && <th className="text-right py-2">{language === 'zh' ? '操作' : 'Act'}</th>}
              </tr>
            </thead>
            <tbody>
              {displayOrders.map((order) => {
                const filledPercent = order.quantity && order.filled 
                  ? (parseFloat(order.filled) / parseFloat(order.quantity) * 100).toFixed(0) 
                  : '0'
                return (
                  <tr key={order.id} className="border-b border-border-color/50 last:border-b-0 hover:bg-bg-hover/30">
                    <td className="py-2 text-text-muted text-xs">
                      {new Date(order.createTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        order.side === 'BUY' ? 'bg-green-bg text-green' : 'bg-red-bg text-red'
                      }`}>
                        {order.side === 'BUY' ? (language === 'zh' ? '买' : 'B') : (language === 'zh' ? '卖' : 'S')}
                      </span>
                    </td>
                    <td className="py-2 text-text-secondary text-xs">
                      {order.type === 'LIMIT' ? (language === 'zh' ? '限价' : 'Limit') : 
                       order.type === 'MARKET' ? (language === 'zh' ? '市价' : 'Market') : 
                       (language === 'zh' ? '止限价' : 'Stop')}
                    </td>
                    <td className="py-2 text-right text-text-primary">
                      ${formatPrice(order.price, pairInfo?.pricePrecision || 2)}
                    </td>
                    <td className="py-2 text-right text-text-secondary">
                      {formatQuantity(order.quantity, pairInfo?.quantityPrecision || 4)}
                    </td>
                    <td className="py-2 text-right">
                      <span className="text-text-secondary">{formatQuantity(order.filled, pairInfo?.quantityPrecision || 4)}</span>
                      <span className="text-text-muted ml-1">({filledPercent}%)</span>
                    </td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    {activeTab === 'open' && (
                      <td className="py-2 text-right">
                        <button 
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                          className="text-red text-xs px-2 py-1 rounded hover:bg-red-bg/50 disabled:opacity-50 transition-colors"
                        >
                          {cancellingId === order.id ? '...' : (language === 'zh' ? '撤单' : 'Cancel')}
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10 text-text-muted">
            {language === 'zh' ? '暂无记录' : 'No records'}
          </div>
        )}
      </div>
    </div>
  )
}

function PriceAlertComponent() {
  const { selectedPair, currentPrice, priceAlerts, addPriceAlert, removePriceAlert, togglePriceAlert, showAlertsPanel, setShowAlertsPanel } = useMarketStore()
  const { language } = useUserStore()

  const [alertPrice, setAlertPrice] = useState('')
  const [alertDirection, setAlertDirection] = useState<'up' | 'down' | 'both'>('both')

  const filteredAlerts = priceAlerts.filter(a => a.symbol === selectedPair)

  const handleAddAlert = () => {
    if (!alertPrice) return
    addPriceAlert({
      symbol: selectedPair,
      price: parseFloat(alertPrice),
      direction: alertDirection,
      enabled: true,
    })
    setAlertPrice('')
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-primary font-semibold text-sm">
          {language === 'zh' ? '价格预警' : 'Price Alerts'}
        </h3>
        <button 
          onClick={() => setShowAlertsPanel(!showAlertsPanel)}
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {language === 'zh' ? (showAlertsPanel ? '收起' : '+ 添加') : (showAlertsPanel ? 'Hide' : '+ Add')}
        </button>
      </div>

      {showAlertsPanel && (
        <div className="mb-3 p-3 bg-bg-hover rounded-lg">
          <div className="mb-2">
            <label className="text-text-muted text-xs mb-1 block">
              {language === 'zh' ? '预警价格' : 'Alert Price'}
            </label>
            <input
              type="number"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              className="input-field w-full text-sm py-2"
              placeholder={currentPrice}
            />
          </div>
          <div className="mb-2">
            <label className="text-text-muted text-xs mb-1 block">
              {language === 'zh' ? '触发条件' : 'Direction'}
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setAlertDirection('up')}
                className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                  alertDirection === 'up' ? 'bg-green text-bg-dark' : 'bg-bg-card text-text-secondary hover:text-text-primary'
                }`}
              >
                {language === 'zh' ? '价格上涨' : 'Price Up'}
              </button>
              <button
                onClick={() => setAlertDirection('down')}
                className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                  alertDirection === 'down' ? 'bg-red text-bg-dark' : 'bg-bg-card text-text-secondary hover:text-text-primary'
                }`}
              >
                {language === 'zh' ? '价格下跌' : 'Price Down'}
              </button>
              <button
                onClick={() => setAlertDirection('both')}
                className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                  alertDirection === 'both' ? 'bg-primary text-bg-dark' : 'bg-bg-card text-text-secondary hover:text-text-primary'
                }`}
              >
                {language === 'zh' ? '双向' : 'Both'}
              </button>
            </div>
          </div>
          <button
            onClick={handleAddAlert}
            disabled={!alertPrice}
            className="w-full py-2 bg-primary text-bg-dark rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {language === 'zh' ? '设置预警' : 'Set Alert'}
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {filteredAlerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`flex items-center justify-between p-2 rounded-lg ${alert.enabled ? 'bg-bg-hover' : 'bg-bg-card opacity-60'}`}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => togglePriceAlert(alert.id)}
                className={`w-3 h-3 rounded-full transition-colors ${alert.enabled ? 'bg-green' : 'bg-text-muted'}`}
              />
              <div>
                <div className="text-sm text-text-primary font-medium">${alert.price.toFixed(2)}</div>
                <div className={`text-xs px-1.5 py-0.5 rounded inline-block ${
                  alert.direction === 'up' ? 'bg-green-bg text-green' :
                  alert.direction === 'down' ? 'bg-red-bg text-red' :
                  'bg-primary/20 text-primary'
                }`}>
                  {alert.direction === 'up' ? (language === 'zh' ? '上涨' : '↑') :
                   alert.direction === 'down' ? (language === 'zh' ? '下跌' : '↓') :
                   (language === 'zh' ? '双向' : '↕')}
                </div>
              </div>
            </div>
            <button
              onClick={() => removePriceAlert(alert.id)}
              className="text-text-muted hover:text-red text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-4 text-text-muted text-xs">
          {language === 'zh' ? '暂无预警' : 'No alerts'}
        </div>
      )}
    </div>
  )
}

function TradePage() {
  const { selectedPair, setSelectedPair, chartInterval, setChartInterval } = useMarketStore()
  const { language } = useUserStore()
  
  const [priceFromOrderBook, setPriceFromOrderBook] = useState('')
  const [quickTradePrice, setQuickTradePrice] = useState('')
  const [quickTradeSide, setQuickTradeSide] = useState<'BUY' | 'SELL' | null>(null)

  useInitialOrderBook(selectedPair)
  useMatchingEngineWS(selectedPair)

  const handlePriceClick = (price: string) => {
    setPriceFromOrderBook(price)
  }

  const handleQuickTrade = (price: string, side: 'BUY' | 'SELL') => {
    setQuickTradePrice(price)
    setQuickTradeSide(side)
  }

  return (
    <div className="min-h-screen bg-bg-dark">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-text-primary text-xl font-bold">
              {language === 'zh' ? '现货交易' : 'Spot Trading'}
            </h1>
            <div className="flex items-center gap-1">
              {TRADING_PAIRS.map((pair) => (
                <button
                  key={pair.symbol}
                  onClick={() => setSelectedPair(pair.symbol)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedPair === pair.symbol 
                      ? 'bg-primary text-bg-dark' 
                      : 'bg-bg-card text-text-secondary hover:text-text-primary border border-border-color'
                  }`}
                >
                  {pair.baseAsset}/{pair.quoteAsset}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {CHART_INTERVALS.map((int) => (
              <button
                key={int.value}
                onClick={() => setChartInterval(int.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  chartInterval === int.value 
                    ? 'bg-primary text-bg-dark' 
                    : 'bg-bg-card text-text-secondary hover:text-text-primary'
                }`}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>

        <MiniPriceBoard symbol={selectedPair} />

        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-8 space-y-4">
            <ChartComponent symbol={selectedPair} interval={chartInterval} />
            <OrderHistoryComponent />
          </div>

          <div className="col-span-4 space-y-4">
            <OrderBookComponent onPriceClick={handlePriceClick} onQuickTrade={handleQuickTrade} />
            <TradeFormComponent priceFromOrderBook={priceFromOrderBook} quickTradePrice={quickTradePrice} quickTradeSide={quickTradeSide} />
            <RecentTradesComponent />
            <PriceAlertComponent />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TradePage