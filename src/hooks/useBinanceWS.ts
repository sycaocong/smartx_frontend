import { useEffect, useRef, useCallback } from 'react'
import { createTradeWebSocket, createDepthWebSocket } from '../utils/binance'
import { useMarketStore } from '../stores/marketStore'
import type { Trade, OrderBook, OrderBookLevel } from '../types/market'

export function useBinanceWS(symbol: string) {
  const tradeWsRef = useRef<WebSocket | null>(null)
  const depthWsRef = useRef<WebSocket | null>(null)
  const orderBookRef = useRef<OrderBook | null>(null)
  
  const { addRecentTrade, setOrderBook, setCurrentPrice } = useMarketStore()

  const handleTrade = useCallback((data: any) => {
    const trade: Trade = {
      id: data.t,
      price: data.p,
      qty: data.q,
      time: data.T,
      isBuyerMaker: data.m,
    }
    addRecentTrade(trade)
    setCurrentPrice(data.p)
  }, [addRecentTrade, setCurrentPrice])

  const handleDepth = useCallback((data: any) => {
    const updateOrderBook = (book: OrderBook | null, bids: string[][], asks: string[][]): OrderBook => {
      const newBids: OrderBookLevel[] = bids.map(([price, qty]) => ({ price, quantity: qty }))
      const newAsks: OrderBookLevel[] = asks.map(([price, qty]) => ({ price, quantity: qty }))

      if (!book) {
        return {
          lastUpdateId: data.U,
          bids: newBids,
          asks: newAsks,
        }
      }

      const mergedBids = [...book.bids]
      const mergedAsks = [...book.asks]

      newBids.forEach((newBid) => {
        const index = mergedBids.findIndex((b) => b.price === newBid.price)
        if (index >= 0) {
          if (parseFloat(newBid.quantity) === 0) {
            mergedBids.splice(index, 1)
          } else {
            mergedBids[index] = newBid
          }
        } else {
          mergedBids.push(newBid)
        }
      })

      newAsks.forEach((newAsk) => {
        const index = mergedAsks.findIndex((a) => a.price === newAsk.price)
        if (index >= 0) {
          if (parseFloat(newAsk.quantity) === 0) {
            mergedAsks.splice(index, 1)
          } else {
            mergedAsks[index] = newAsk
          }
        } else {
          mergedAsks.push(newAsk)
        }
      })

      mergedBids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      mergedAsks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))

      return {
        lastUpdateId: data.u,
        bids: mergedBids.slice(0, 20),
        asks: mergedAsks.slice(0, 20),
      }
    }

    const updated = updateOrderBook(orderBookRef.current, data.b, data.a)
    orderBookRef.current = updated
    setOrderBook(updated)
  }, [setOrderBook])

  useEffect(() => {
    if (!symbol) return

    tradeWsRef.current = createTradeWebSocket(symbol, handleTrade)
    depthWsRef.current = createDepthWebSocket(symbol, handleDepth)

    return () => {
      if (tradeWsRef.current) {
        tradeWsRef.current.close()
        tradeWsRef.current = null
      }
      if (depthWsRef.current) {
        depthWsRef.current.close()
        depthWsRef.current = null
      }
      orderBookRef.current = null
    }
  }, [symbol, handleTrade, handleDepth])
}

export function useInitialOrderBook(symbol: string) {
  const { setOrderBook } = useMarketStore()

  useEffect(() => {
    if (!symbol) return

    const fetchOrderBook = async () => {
      try {
        const response = await fetch(`/api/v3/depth?symbol=${symbol}&limit=100`)
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
