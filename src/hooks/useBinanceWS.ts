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

      switch (data.e) {
        case 'trade':
          const trade: Trade = {
            id: data.T.toString(),
            price: data.p,
            qty: data.q,
            time: data.T,
            isBuyerMaker: data.m,
          }
          addRecentTrade(trade)
          setCurrentPrice(data.p)
          break

        case 'depth':
          const newBids: OrderBookLevel[] = data.bids.map(([price, qty]: string[]) => ({ price, quantity: qty }))
          const newAsks: OrderBookLevel[] = data.asks.map(([price, qty]: string[]) => ({ price, quantity: qty }))

          const mergedBids = [...(orderBookRef.current?.bids || []), ...newBids]
            .filter((b) => parseFloat(b.quantity) > 0)
            .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
            .slice(0, 20)

          const mergedAsks = [...(orderBookRef.current?.asks || []), ...newAsks]
            .filter((a) => parseFloat(a.quantity) > 0)
            .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
            .slice(0, 20)

          const updated: OrderBook = {
            lastUpdateId: data.u,
            bids: mergedBids,
            asks: mergedAsks,
          }
          orderBookRef.current = updated
          setOrderBook(updated)
          break

        case '24hrTicker':
          setCurrentPrice(data.c)
          break
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }, [addRecentTrade, setOrderBook, setCurrentPrice])

  useEffect(() => {
    if (!symbol) return

    const ws = new WebSocket(`ws://localhost:8080/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      // 订阅交易对
      ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [`${symbol}@trade`, `${symbol}@depth@100ms`, `${symbol}@ticker`],
        id: 1,
      }))
    }

    ws.onmessage = handleMessage

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket closed')
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      orderBookRef.current = null
    }
  }, [symbol, handleMessage])
}

export function useInitialOrderBook(symbol: string) {
  const { setOrderBook } = useMarketStore()

  useEffect(() => {
    if (!symbol) return

    const fetchOrderBook = async () => {
      try {
        const response = await fetch(`/api/v1/market/orderbook/${symbol}?limit=100`)
        const data = await response.json()
        const orderBook: OrderBook = {
          lastUpdateId: data.lastUpdateId,
          bids: data.bids.map(([price, qty]: string[]) => ({ price, quantity: qty })),
          asks: data.asks.map(([price, qty]: string[]) => ({ price, quantity: qty })),
        }
        setOrderBook(orderBook)
      } catch (error) {
        console.error('Failed to fetch initial order book:', error)
      }
    }

    fetchOrderBook()
  }, [symbol, setOrderBook])
}