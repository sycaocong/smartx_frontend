import { create } from 'zustand'
import type { Order } from '../types/order'
import { getItem, setItem } from '../utils/storage'

interface OrderState {
  orders: Order[]

  addOrder: (order: Order) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  cancelOrder: (id: string) => void
  clearOrders: () => void
  getOrdersByPair: (pair: string) => Order[]
  getOpenOrders: (pair?: string) => Order[]
  getHistoryOrders: (pair?: string) => Order[]
}

const generateOrderId = () => `ORD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: getItem<Order[]>('orders') || [],

  addOrder: (orderData) => {
    const order: Order = {
      ...orderData,
      id: generateOrderId(),
      createTime: Date.now(),
      filled: '0',
      status: 'NEW',
    }
    const { orders } = get()
    const newOrders = [order, ...orders]
    setItem('orders', newOrders)
    set({ orders: newOrders })
  },

  updateOrder: (id, updates) => {
    const { orders } = get()
    const newOrders = orders.map((order) =>
      order.id === id ? { ...order, ...updates } : order
    )
    setItem('orders', newOrders)
    set({ orders: newOrders })
  },

  cancelOrder: (id) => {
    const { orders } = get()
    const newOrders = orders.map((order) =>
      order.id === id ? { ...order, status: 'CANCELED' as const } : order
    )
    setItem('orders', newOrders)
    set({ orders: newOrders })
  },

  clearOrders: () => {
    setItem('orders', [])
    set({ orders: [] })
  },

  getOrdersByPair: (pair) => {
    const { orders } = get()
    return orders.filter((order) => order.pair === pair)
  },

  getOpenOrders: (pair) => {
    const { orders } = get()
    const filtered = orders.filter((o) => o.status === 'NEW' || o.status === 'PARTIALLY_FILLED')
    return pair ? filtered.filter((o) => o.pair === pair) : filtered
  },

  getHistoryOrders: (pair) => {
    const { orders } = get()
    const filtered = orders.filter((o) => o.status === 'FILLED' || o.status === 'CANCELED')
    return pair ? filtered.filter((o) => o.pair === pair) : filtered
  },
}))
