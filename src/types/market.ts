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

export interface Trade {
  id: number
  price: string
  qty: string
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
