export interface Order {
  id: string
  pair: string
  type: 'LIMIT' | 'MARKET'
  side: 'BUY' | 'SELL'
  price: string
  quantity: string
  filled: string
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED'
  createTime: number
}

export interface OrderFormData {
  side: 'BUY' | 'SELL'
  type: 'LIMIT' | 'MARKET'
  price: string
  quantity: string
  pair: string
}

export type OrderStatus = Order['status']
export type OrderType = Order['type']
export type OrderSide = Order['side']
