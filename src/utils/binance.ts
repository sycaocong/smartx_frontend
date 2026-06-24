import { binanceApi } from '../services/api'
import type { Ticker24hr } from '../types/market'

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
  return { data: [] }
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
