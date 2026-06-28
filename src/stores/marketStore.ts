import { create } from 'zustand'
import type { Ticker24hr, KlineData, OrderBook, Trade, CandlestickData } from '../types/market'
import { TRADING_PAIRS, DEFAULT_PAIR } from '../constants/tradingPairs'
import { getItem, setItem } from '../utils/storage'

/**
 * 价格预警接口
 * [Design: MarketStore](../DESIGN.md#51-marketstore)
 */
interface PriceAlert {
  id: string                    // 预警ID
  symbol: string                // 交易对
  price: number                 // 预警价格
  direction: 'up' | 'down' | 'both' // 预警方向
  enabled: boolean              // 是否启用
  createdAt: number             // 创建时间
}

/**
 * 市场状态管理接口
 * [Design: MarketStore](../DESIGN.md#51-marketstore)
 */
interface MarketState {
  selectedPair: string                              // 当前选中交易对
  tickers: Ticker24hr[]                             // 行情列表
  klines: KlineData[]                               // K线数据
  candlesticks: CandlestickData[]                   // 蜡烛图数据
  orderBook: OrderBook | null                       // 订单簿数据
  recentTrades: Trade[]                             // 成交记录
  currentPrice: string                              // 当前价格
  chartInterval: string                             // 图表周期
  favoritePairs: string[]                           // 收藏交易对
  isLoading: boolean                                // 加载状态
  error: string | null                              // 错误信息
  priceAlerts: PriceAlert[]                         // 价格预警列表
  showAlertsPanel: boolean                          // 是否显示预警面板

  setSelectedPair: (pair: string) => void
  setTickers: (tickers: Ticker24hr[]) => void
  setKlines: (klines: KlineData[]) => void
  setCandlesticks: (candlesticks: CandlestickData[]) => void
  setOrderBook: (orderBook: OrderBook) => void
  addRecentTrade: (trade: Trade) => void
  setCurrentPrice: (price: string) => void
  setChartInterval: (interval: string) => void
  toggleFavorite: (pair: string) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getTradingPairs: () => typeof TRADING_PAIRS
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void
  removePriceAlert: (id: string) => void
  togglePriceAlert: (id: string) => void
  setShowAlertsPanel: (show: boolean) => void
}

export const useMarketStore = create<MarketState>((set, get) => ({
  selectedPair: getItem<string>('selectedPair') || DEFAULT_PAIR,
  tickers: [],
  klines: [],
  candlesticks: [],
  orderBook: null,
  recentTrades: [],
  currentPrice: '0',
  chartInterval: '1h',
  favoritePairs: getItem<string[]>('favoritePairs') || [],
  isLoading: true,
  error: null,
  priceAlerts: getItem<PriceAlert[]>('priceAlerts') || [],
  showAlertsPanel: false,

  setSelectedPair: (pair) => {
    setItem('selectedPair', pair)
    set({ selectedPair: pair })
  },

  setTickers: (tickers) => set({ tickers, isLoading: false }),

  setKlines: (klines) => set({ klines }),

  setCandlesticks: (candlesticks) => set({ candlesticks }),

  setOrderBook: (orderBook) => set({ orderBook }),

  addRecentTrade: (trade) => {
    const { recentTrades } = get()
    const newTrades = [trade, ...recentTrades].slice(0, 100)
    set({ recentTrades: newTrades })
  },

  setCurrentPrice: (price) => set({ currentPrice: price }),

  setChartInterval: (interval) => set({ chartInterval: interval }),

  toggleFavorite: (pair) => {
    const { favoritePairs } = get()
    const newFavorites = favoritePairs.includes(pair)
      ? favoritePairs.filter((p) => p !== pair)
      : [...favoritePairs, pair]
    setItem('favoritePairs', newFavorites)
    set({ favoritePairs: newFavorites })
  },

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  getTradingPairs: () => TRADING_PAIRS,

  addPriceAlert: (alert) => {
    const { priceAlerts } = get()
    const newAlert: PriceAlert = {
      ...alert,
      id: Date.now().toString(),
      createdAt: Date.now(),
    }
    const newAlerts = [...priceAlerts, newAlert]
    setItem('priceAlerts', newAlerts)
    set({ priceAlerts: newAlerts })
  },

  removePriceAlert: (id) => {
    const { priceAlerts } = get()
    const newAlerts = priceAlerts.filter((a) => a.id !== id)
    setItem('priceAlerts', newAlerts)
    set({ priceAlerts: newAlerts })
  },

  togglePriceAlert: (id) => {
    const { priceAlerts } = get()
    const newAlerts = priceAlerts.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    )
    setItem('priceAlerts', newAlerts)
    set({ priceAlerts: newAlerts })
  },

  setShowAlertsPanel: (show) => set({ showAlertsPanel: show }),
}))
