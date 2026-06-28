export interface Order {
  id: string
  pair: string
  type: 'LIMIT' | 'MARKET'
  side: 'BUY' | 'SELL'
  price: string
  quantity: string
  filled: string
  status: 'NEW' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED'
  createTime: number
}

export interface OrderFormData {
  side: 'BUY' | 'SELL'
  type: 'LIMIT' | 'MARKET'
  price: string
  quantity: string
  pair: string
}

export interface OrderResponse {
  order_id: string
  symbol: string
  side: number
  type: number
  price: number
  quantity: number
  filled_quantity: number
  avg_fill_price: number
  status: number
  timestamp: number
  client_order_id: string
}

export type OrderStatus = Order['status']
export type OrderType = Order['type']
export type OrderSide = Order['side']
