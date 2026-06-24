interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: number
}

export async function apiGet<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
  try {
    const baseUrl = (import.meta.env as Record<string, unknown>).VITE_API_BASE_URL || '/api'
    const url = new URL(`${baseUrl}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    const response = await fetch(url.toString(), {
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

export async function apiPost<T>(endpoint: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
  try {
    const baseUrl = (import.meta.env as Record<string, unknown>).VITE_API_BASE_URL || '/api'
    const response = await fetch(`${baseUrl}${endpoint}`, {
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

export async function apiPut<T>(endpoint: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
  try {
    const baseUrl = (import.meta.env as Record<string, unknown>).VITE_API_BASE_URL || '/api'
    const response = await fetch(`${baseUrl}${endpoint}`, {
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

export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const baseUrl = (import.meta.env as Record<string, unknown>).VITE_API_BASE_URL || '/api'
    const response = await fetch(`${baseUrl}${endpoint}`, {
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

export const binanceApi = {
  get24hrTicker: () => apiGet<unknown[]>('/v3/ticker/24hr'),
  getKlines: (symbol: string, interval: string, limit?: string) =>
    apiGet<unknown[]>(`/v3/klines`, { symbol, interval, limit: limit || '100' }),
  getOrderBook: (symbol: string, limit?: string) =>
    apiGet<unknown>(`/v3/depth`, { symbol, limit: limit || '100' }),
  getPrice: (symbol: string) => apiGet<unknown>(`/v3/ticker/price`, { symbol }),
}

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
    getBalances: () => apiGet('/wallet/balances'),
    getTransactions: (page?: number, limit?: number) =>
      apiGet('/wallet/transactions', {
        page: page?.toString() || '1',
        limit: limit?.toString() || '20',
      }),
    deposit: (asset: string, amount: string) =>
      apiPost('/wallet/deposit', { asset, amount }),
    withdraw: (asset: string, amount: string, address: string) =>
      apiPost('/wallet/withdraw', { asset, amount, address }),
    transfer: (asset: string, amount: string, toAddress: string) =>
      apiPost('/wallet/transfer', { asset, amount, toAddress }),
    getDepositAddress: (asset: string) => apiGet(`/wallet/deposit-address/${asset}`),
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
