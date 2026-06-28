/**
 * API 响应通用接口
 * [Design: API接口设计](../DESIGN.md#6-api接口设计)
 */
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: number
}

/**
 * 发起 GET 请求
 * @param endpoint API 端点路径
 * @param params 查询参数
 * @returns API 响应
 */
export async function apiGet<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
  try {
    const baseUrl = String((import.meta.env as Record<string, unknown>).VITE_API_BASE_URL || '/api')
    
    let url = baseUrl + endpoint
    if (params) {
      const searchParams = new URLSearchParams(params)
      url += '?' + searchParams.toString()
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        code: response.status,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 发起 POST 请求
 * @param endpoint API 端点路径
 * @param body 请求体
 * @returns API 响应
 */
export async function apiPost<T>(endpoint: string, body?: Record<string, unknown> | object): Promise<ApiResponse<T>> {
  try {
    const baseUrl = String((import.meta.env as Record<string, unknown>).VITE_API_BASE_URL || '/api')
    const url = baseUrl + endpoint
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        code: response.status,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 发起 PUT 请求
 * @param endpoint API 端点路径
 * @param body 请求体
 * @returns API 响应
 */
export async function apiPut<T>(endpoint: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
  try {
    const baseUrl = String((import.meta.env as Record<string, unknown>).VITE_API_BASE_URL || '/api')
    const url = baseUrl + endpoint
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        code: response.status,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 发起 DELETE 请求
 * @param endpoint API 端点路径
 * @returns API 响应
 */
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const baseUrl = String((import.meta.env as Record<string, unknown>).VITE_API_BASE_URL || '/api')
    const url = baseUrl + endpoint
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        code: response.status,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Binance API 封装
 * 用于获取备用行情数据
 * [Design: 双数据源支持](../DESIGN.md#93-双数据源支持)
 */
export const binanceApi = {
  get24hrTicker: () => apiGet<unknown[]>('/binance/v3/ticker/24hr'),
  getKlines: (symbol: string, interval: string, limit?: string) =>
    apiGet<unknown[]>(`/binance/v3/klines`, { symbol, interval, limit: limit || '100' }),
  getOrderBook: (symbol: string, limit?: string) =>
    apiGet<unknown>(`/binance/v3/depth`, { symbol, limit: limit || '100' }),
  getPrice: (symbol: string) => apiGet<unknown>(`/binance/v3/ticker/price`, { symbol }),
}

/**
 * 创建订单请求接口
 * [Design: 订单管理](../DESIGN.md#61-后端-api)
 */
export interface CreateOrderRequest {
  symbol: string
  side: 'BUY' | 'SELL'
  type: 'LIMIT' | 'MARKET'
  price: number
  quantity: number
  client_order_id?: string
}

/**
 * 订单响应接口
 */
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

/**
 * 行情响应接口
 */
export interface TickerResponse {
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

/**
 * 订单簿响应接口
 */
export interface OrderBookResponse {
  symbol: string
  version: number
  timestamp: number
  bids: [number, number][]
  asks: [number, number][]
}

/**
 * 统计响应接口
 */
export interface StatsResponse {
  ws_clients: number
  ws_messages: number
  timestamp: number
}

export type ChainID = string

export type TokenType = 'native' | 'erc20'

/**
 * 代币信息接口
 */
export interface Token {
  chain_id: ChainID
  contract: string
  symbol: string
  name: string
  decimals: number
  type: TokenType
}

/**
 * 余额信息接口
 */
export interface Balance {
  chain_id: ChainID
  address: string
  token: Token
  balance: string
  display: string
  block_number: number
  updated_at: string
}

/**
 * 交易记录接口
 */
export interface Transaction {
  id: string
  chain_id: ChainID
  tx_hash: string
  from: string
  to: string
  token: Token
  value: string
  display: string
  fee: string
  fee_display: string
  block_number: number
  status: string
  tx_type: string
  created_at: string
  confirmed_at: string
}

/**
 * 获取余额请求接口
 */
export interface GetBalanceRequest {
  chain_id: ChainID
  address: string
  contract?: string
}

/**
 * 获取余额响应接口
 */
export interface GetBalanceResponse {
  success: boolean
  data: Balance
  error?: string
}

/**
 * 获取多个余额请求接口
 */
export interface GetBalancesRequest {
  chain_id: ChainID
  address: string
  tokens?: string[]
}

/**
 * 获取多个余额响应接口
 */
export interface GetBalancesResponse {
  success: boolean
  data: Balance[]
  error?: string
}

/**
 * 获取交易记录请求接口
 */
export interface GetTransactionsRequest {
  chain_id: ChainID
  address: string
  token?: string
  tx_type?: string
  start_time?: string
  end_time?: string
  page: number
  page_size: number
}

/**
 * 获取交易记录响应接口
 */
export interface GetTransactionsResponse {
  success: boolean
  data: Transaction[]
  total: number
  page: number
  page_size: number
  has_more: boolean
  error?: string
}

/**
 * 转账请求接口
 */
export interface TransferRequest {
  chain_id: ChainID
  from: string
  to: string
  contract?: string
  value: string
  private_key: string
  gas_limit?: number
  gas_price?: string
}

/**
 * 转账响应接口
 */
export interface TransferResponse {
  success: boolean
  tx_hash: string
  chain_id: ChainID
  error?: string
}

/**
 * 充值请求接口
 */
export interface DepositRequest {
  chain_id: ChainID
  address: string
  token?: string
}

/**
 * 充值响应接口
 */
export interface DepositResponse {
  success: boolean
  address: string
  chain_id: ChainID
  error?: string
}

/**
 * 提现请求接口
 */
export interface WithdrawRequest {
  chain_id: ChainID
  address: string
  to: string
  contract?: string
  value: string
  private_key: string
}

/**
 * 提现响应接口
 */
export interface WithdrawResponse {
  success: boolean
  tx_hash: string
  chain_id: ChainID
  error?: string
}

/**
 * 撮合引擎 API 封装
 * [Design: 后端API](../DESIGN.md#61-后端-api)
 */
export const matchingEngineApi = {
  health: () => apiGet<{ status: string }>('/health'),
  ready: () => apiGet<{ status: string }>('/ready'),
  
  getTicker: (symbol: string) => apiGet<TickerResponse>(`/api/v1/market/ticker/${symbol}`),
  
  getOrderBook: (symbol: string, limit?: number) =>
    apiGet<OrderBookResponse>(`/api/v1/market/orderbook/${symbol}`, limit ? { limit: limit.toString() } : undefined),
  
  getDepth: (symbol: string, limit?: number) =>
    apiGet<any>(`/api/v1/market/depth/${symbol}`, limit ? { limit: limit.toString() } : undefined),
  
  getTrades: (symbol: string) => apiGet<any>(`/api/v1/market/trades/${symbol}`),
  
  getKLine: (symbol: string, interval?: string, limit?: number) =>
    apiGet<any>(`/api/v1/market/kline/${symbol}`, { 
      interval: interval || '1m', 
      limit: limit?.toString() || '100' 
    }),
  
  createOrder: (order: CreateOrderRequest) => apiPost<OrderResponse>('/api/v1/orders', order),
  
  cancelOrder: (orderId: string) => apiDelete<any>(`/api/v1/orders/${orderId}`),
  
  getOrder: (orderId: string) => apiGet<any>(`/api/v1/orders/${orderId}`),
  
  getOrders: (symbol?: string, limit?: number) => 
    apiGet<any>('/api/v1/orders', { 
      symbol: symbol || '', 
      limit: limit?.toString() || '100' 
    }),
  
  getStats: () => apiGet<StatsResponse>('/api/v1/stats'),
  
  getShardStats: () => apiGet<any>('/api/v1/stats/shard'),
}

/**
 * SmartX 业务 API 封装
 * 包含认证、用户、钱包、交易、市场等模块
 * [Design: API接口设计](../DESIGN.md#6-api接口设计)
 */
export const smartXApi = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiPost('/auth/login', credentials),
    logout: () => apiPost('/auth/logout'),
    register: (data: { email: string; password: string; username: string }) =>
      apiPost('/auth/register', data),
  },
  user: {
    getProfile: () => apiGet('/user/profile'),
    updateProfile: (data: Partial<{ username: string; phone: string; country: string }>) =>
      apiPut('/user/profile', data),
    getStats: () => apiGet('/user/stats'),
  },
  wallet: {
    getBalance: (req: GetBalanceRequest) =>
      apiPost<GetBalanceResponse>('/api/v1/wallet/balance', req),
    getBalances: (req: GetBalancesRequest) =>
      apiPost<GetBalancesResponse>('/api/v1/wallet/balances', req),
    getTransactions: (req: GetTransactionsRequest) =>
      apiPost<GetTransactionsResponse>('/api/v1/wallet/transactions', req),
    transfer: (req: TransferRequest) =>
      apiPost<TransferResponse>('/api/v1/wallet/transfer', req),
    deposit: (req: DepositRequest) =>
      apiPost<DepositResponse>('/api/v1/wallet/deposit', req),
    withdraw: (req: WithdrawRequest) =>
      apiPost<WithdrawResponse>('/api/v1/wallet/withdraw', req),
  },
  trading: {
    createOrder: (order: {
      pair: string
      type: 'LIMIT' | 'MARKET'
      side: 'BUY' | 'SELL'
      price?: string
      quantity: string
    }) => apiPost('/trading/order', order),
    cancelOrder: (orderId: string) => apiDelete(`/trading/order/${orderId}`),
    getOrders: (pair?: string, status?: string) =>
      apiGet('/trading/orders', { pair: pair || '', status: status || '' }),
    getOrder: (orderId: string) => apiGet(`/trading/order/${orderId}`),
    getTradeHistory: (page?: number, limit?: number) =>
      apiGet('/trading/trades', {
        page: page?.toString() || '1',
        limit: limit?.toString() || '20',
      }),
  },
  market: {
    getPairs: () => apiGet('/market/pairs'),
    getTicker: (symbol: string) => apiGet(`/market/ticker/${symbol}`),
    getTickers: () => apiGet('/market/tickers'),
  },
}