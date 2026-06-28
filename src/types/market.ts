export interface TradingPair {
  symbol: string
  baseAsset: string
  quoteAsset: string
  pricePrecision: number
  quantityPrecision: number
  minQuantity: number
  maxQuantity: number
  status: 'TRADING' | 'PRE_TRADING' | 'POST_TRADING' | 'CANCEL_ONLY' | 'FAIL_TRADING'
}

export interface Ticker24hr {
  symbol: string
  priceChange: string
  priceChangePercent: string
  weightedAvgPrice: string
  lastPrice: string
  lastQty: string
  bidPrice: string
  bidQty: string
  askPrice: string
  askQty: string
  openPrice: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  openTime: number
  closeTime: number
  firstTradeId: number
  lastTradeId: number
  totalTrades: number
}

export interface TickerData {
  symbol: string
  last_price: number
  bid_price: number
  ask_price: number
  bid_qty: number
  ask_qty: number
  volume_24h: number
  quote_volume_24h: number
  high_24h: number
  low_24h: number
  price_change: number
  price_change_pct: number
  timestamp: number
}

export interface KlineData {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteVolume: string
  trades: number
}

export interface OrderBookLevel {
  price: string
  quantity: string
}

export interface OrderBook {
  lastUpdateId: number
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
}

export interface OrderBookResponse {
  symbol: string
  version: number
  timestamp: number
  bids: [number, number][]
  asks: [number, number][]
}

export interface Trade {
  id: string
  price: string
  quantity: string
  time: number
  isBuyerMaker: boolean
}

export interface CandlestickData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface SparklineData {
  time: number
  price: number
}

export interface WSMessage {
  type: string
  topic: string
  symbol: string
  data: any
  time: number
}
