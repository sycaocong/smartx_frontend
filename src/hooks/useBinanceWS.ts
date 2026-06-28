import { useEffect, useRef, useCallback } from 'react'
import { useMarketStore } from '../stores/marketStore'
import type { Trade, OrderBook, OrderBookLevel } from '../types/market'

export function useMatchingEngineWS(symbol: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const orderBookRef = useRef<OrderBook | null>(null)

  const { addRecentTrade, setOrderBook, setCurrentPrice } = useMarketStore()

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)

      if (data.type === 'trade' || data.e === 'trade') {
        const trade: Trade = {
          id: String(data.data?.id || data.t || data.T || Date.now()),
          price: String(data.data?.price || data.p || data.price || '0'),
          quantity: String(data.data?.quantity || data.q || '0'),
          time: data.data?.timestamp || data.T || data.timestamp || Date.now(),
          isBuyerMaker: data.data?.is_buyer_maker || data.m || false,
        }
        addRecentTrade(trade)
        setCurrentPrice(String(data.data?.price || data.p || data.c || '0'))
      } else if (data.type === 'depth' || data.e === 'depth' || data.e === 'depthUpdate') {
        const newBids: OrderBookLevel[] = ((data.data?.bids || data.bids) || []).map((item: [number | string, number | string]) => ({
          price: String(item[0]),
          quantity: String(item[1])
        }))
        const newAsks: OrderBookLevel[] = ((data.data?.asks || data.asks) || []).map((item: [number | string, number | string]) => ({
          price: String(item[0]),
          quantity: String(item[1])
        }))

        const mergedBids = [...(orderBookRef.current?.bids || []), ...newBids]
          .filter((b) => parseFloat(b.quantity) > 0)
          .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
          .slice(0, 20)

        const mergedAsks = [...(orderBookRef.current?.asks || []), ...newAsks]
          .filter((a) => parseFloat(a.quantity) > 0)
          .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
          .slice(0, 20)

        const updated: OrderBook = {
          lastUpdateId: data.data?.version || data.u || data.lastUpdateId || Date.now(),
          bids: mergedBids,
          asks: mergedAsks,
        }
        orderBookRef.current = updated
        setOrderBook(updated)
      } else if (data.type === 'ticker' || data.e === '24hrTicker') {
        setCurrentPrice(String(data.data?.last_price || data.c || '0'))
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }, [addRecentTrade, setOrderBook, setCurrentPrice])

  useEffect(() => {
    if (!symbol) return

    let ws: WebSocket | null = null
    let reconnectTimer: number | null = null
    let reconnectCount = 0
    const maxReconnectAttempts = 10

    const wsUrl = String((import.meta.env as Record<string, unknown>).VITE_WS_URL || 'ws://localhost:8080/ws')

    const connect = () => {
      if (reconnectCount >= maxReconnectAttempts) {
        console.error('Max reconnect attempts reached')
        return
      }

      ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Connected to matching engine WebSocket')
        reconnectCount = 0
        
        if (ws?.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({
              method: 'SUBSCRIBE',
              params: [`${symbol.toUpperCase()}@trade`, `${symbol.toUpperCase()}@depth@100ms`],
              id: 1,
            }))
          } catch (e) {
            console.error('Failed to send subscribe:', e)
          }
        }
      }

      ws.onmessage = handleMessage

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('WebSocket closed')
        if (!reconnectTimer) {
          reconnectCount++
          const delay = Math.min(3000 * reconnectCount, 30000)
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null
            if (symbol) {
              connect()
            }
          }, delay)
        }
      }
    }

    connect()

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({
              method: 'UNSUBSCRIBE',
              params: [`${symbol.toUpperCase()}@trade`, `${symbol.toUpperCase()}@depth@100ms`],
              id: 2,
            }))
          } catch (e) {
            console.warn('Failed to send unsubscribe:', e)
          }
        }
        
        try {
          ws.close(1000, 'Normal closure')
        } catch (e) {
          console.warn('Failed to close WebSocket:', e)
        }
        
        ws = null
      }
      
      wsRef.current = null
      orderBookRef.current = null
    }
  }, [symbol, handleMessage])
}

export function useInitialOrderBook(symbol: string) {
  const { setOrderBook } = useMarketStore()

  useEffect(() => {
    if (!symbol) return

    let isCancelled = false

    const fetchOrderBook = async () => {
      try {
        const baseUrl = (import.meta.env as Record<string, unknown>).VITE_API_BASE_URL || 'http://localhost:8080'
        const response = await fetch(`${baseUrl}/api/v1/market/orderbook/${symbol}?limit=100`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (isCancelled) return
        
        if (!data) {
          console.warn('Invalid order book data received')
          return
        }
        
        const orderBook: OrderBook = {
          lastUpdateId: data.version || data.lastUpdateId || 0,
          bids: Array.isArray(data.bids) ? data.bids.map(([price, qty]: [number, number]) => ({ 
            price: String(price), 
            quantity: String(qty) 
          })) : [],
          asks: Array.isArray(data.asks) ? data.asks.map(([price, qty]: [number, number]) => ({ 
            price: String(price), 
            quantity: String(qty) 
          })) : [],
        }
        
        setOrderBook(orderBook)
      } catch (error) {
        console.error('Failed to fetch initial order book:', error)
      }
    }

    fetchOrderBook()
    
    return () => {
      isCancelled = true
    }
  }, [symbol, setOrderBook])
}
