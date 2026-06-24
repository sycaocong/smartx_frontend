import { create } from 'zustand'
import type { Ticker24hr, KlineData, OrderBook, Trade, CandlestickData } from '../types/market'
import { TRADING_PAIRS, DEFAULT_PAIR } from '../constants/tradingPairs'
import { getItem, setItem } from '../utils/storage'

interface MarketState {
  selectedPair: string
  tickers: Ticker24hr[]
  klines: KlineData[]
  candlesticks: CandlestickData[]
  orderBook: OrderBook | null
  recentTrades: Trade[]
  currentPrice: string
  chartInterval: string
  favoritePairs: string[]
  isLoading: boolean
  error: string | null

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
}))
