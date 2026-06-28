import { binanceApi, matchingEngineApi, type TickerResponse } from '../services/api'
import type { Ticker24hr, OrderBook } from '../types/market'

export async function getTickers24hr(): Promise<{ data: Ticker24hr[] }> {
  const response = await binanceApi.get24hrTicker()
  if (response.success && response.data) {
    return { data: response.data as Ticker24hr[] }
  }
  return { data: [] }
}

export async function getKlines(symbol: string, interval: string, limit: number = 100): Promise<{ data: number[][] }> {
  const response = await binanceApi.getKlines(symbol, interval, limit.toString())
  if (response.success && response.data) {
    return { data: response.data as number[][] }
  }
  return { data: generateMockKlines(interval, limit) }
}

export async function getOrderBook(symbol: string, limit: number = 100): Promise<{ data: { bids: [string, string][]; asks: [string, string][] } | null }> {
  const response = await binanceApi.getOrderBook(symbol, limit.toString())
  if (response.success && response.data) {
    return { data: response.data as { bids: [string, string][]; asks: [string, string][] } }
  }
  return { data: null }
}

export async function getPrice(symbol: string): Promise<{ data: { symbol: string; price: string } | null }> {
  const response = await binanceApi.getPrice(symbol)
  if (response.success && response.data) {
    return { data: response.data as { symbol: string; price: string } }
  }
  return { data: null }
}

export async function getMatchingEngineTicker(symbol: string): Promise<TickerResponse | null> {
  const response = await matchingEngineApi.getTicker(symbol)
  if (response.success && response.data) {
    return response.data
  }
  return null
}

export async function getMatchingEngineOrderBook(symbol: string, limit: number = 100): Promise<OrderBook | null> {
  const response = await matchingEngineApi.getOrderBook(symbol, limit)
  if (response.success && response.data) {
    const data = response.data
    return {
      lastUpdateId: data.version || 0,
      bids: data.bids.map(([price, qty]: [number, number]) => ({
        price: String(price),
        quantity: String(qty)
      })),
      asks: data.asks.map(([price, qty]: [number, number]) => ({
        price: String(price),
        quantity: String(qty)
      }))
    }
  }
  return null
}

export function createTradeWebSocket(symbol: string, callback: (data: any) => void): WebSocket {
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`)
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    callback(data)
  }
  return ws
}

export function createDepthWebSocket(symbol: string, callback: (data: any) => void): WebSocket {
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth`)
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    callback(data)
  }
  return ws
}

function generateMockKlines(interval: string, limit: number): number[][] {
  const result: number[][] = []
  const now = Date.now()
  const intervalMs = getIntervalMs(interval)
  
  let basePrice = 67000
  let volume = 100

  for (let i = limit; i >= 0; i--) {
    const time = now - i * intervalMs
    const open = basePrice + (Math.random() - 0.5) * 1000
    const close = open + (Math.random() - 0.5) * 500
    const high = Math.max(open, close) + Math.random() * 200
    const low = Math.min(open, close) - Math.random() * 200
    const vol = volume + (Math.random() - 0.5) * 50

    result.push([
      time,
      parseFloat(open.toFixed(2)),
      parseFloat(high.toFixed(2)),
      parseFloat(low.toFixed(2)),
      parseFloat(close.toFixed(2)),
      parseFloat(vol.toFixed(4)),
      time + intervalMs - 1,
      parseFloat((vol * close).toFixed(2)),
      Math.floor(Math.random() * 1000),
    ])

    basePrice = close
  }

  return result
}

function getIntervalMs(interval: string): number {
  const map: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '8h': 8 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  }
  return map[interval] || 60 * 60 * 1000
}

export function generateMockOrderBook(basePrice: number): OrderBook {
  const bids: { price: string; quantity: string }[] = []
  const asks: { price: string; quantity: string }[] = []

  for (let i = 0; i < 20; i++) {
    const bidPrice = basePrice - (i + 1) * 10
    const askPrice = basePrice + (i + 1) * 10
    bids.push({
      price: bidPrice.toFixed(2),
      quantity: (Math.random() * 2 + 0.1).toFixed(4)
    })
    asks.push({
      price: askPrice.toFixed(2),
      quantity: (Math.random() * 2 + 0.1).toFixed(4)
    })
  }

  return {
    lastUpdateId: Date.now(),
    bids,
    asks
  }
}

export function generateMockTicker(symbol: string): TickerResponse {
  const basePrice = 67000 + Math.random() * 5000
  const priceChange = (Math.random() - 0.5) * 2000
  const priceChangePct = (priceChange / (basePrice - priceChange)) * 100

  return {
    symbol,
    last_price: parseFloat(basePrice.toFixed(2)),
    bid_price: parseFloat((basePrice - 5).toFixed(2)),
    ask_price: parseFloat((basePrice + 5).toFixed(2)),
    bid_qty: parseFloat((Math.random() * 2 + 0.1).toFixed(4)),
    ask_qty: parseFloat((Math.random() * 2 + 0.1).toFixed(4)),
    volume_24h: parseFloat((Math.random() * 10000 + 5000).toFixed(2)),
    quote_volume_24h: parseFloat((Math.random() * 1e9 + 5e8).toFixed(2)),
    high_24h: parseFloat((basePrice + Math.random() * 1000).toFixed(2)),
    low_24h: parseFloat((basePrice - Math.random() * 1000).toFixed(2)),
    price_change: parseFloat(priceChange.toFixed(2)),
    price_change_pct: parseFloat(priceChangePct.toFixed(2)),
    timestamp: Date.now()
  }
}
