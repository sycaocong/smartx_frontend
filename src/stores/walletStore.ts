import { create } from 'zustand'
import type { WalletBalance, TransactionRecord, DepositAddress } from '../types/wallet'
import { DEMO_BALANCES } from '../constants/tradingPairs'
import { getItem, setItem } from '../utils/storage'
import { smartXApi } from '../services/api'
import type { Balance, Transaction, ChainID } from '../services/api'

/**
 * 钱包状态管理接口
 * [Design: WalletStore](../DESIGN.md#53-walletstore)
 */
interface WalletState {
  balances: Record<string, WalletBalance>       // 账户余额映射
  transactions: TransactionRecord[]             // 交易记录列表
  depositAddresses: Record<string, DepositAddress> // 充值地址映射
  totalBalance: string                          // 总资产(USDT)
  isLoading: boolean                            // 加载状态
  error: string | null                          // 错误信息

  setBalances: (balances: Record<string, WalletBalance>) => void
  updateBalance: (asset: string, free: string, locked: string) => void
  addTransaction: (transaction: TransactionRecord) => void
  setDepositAddress: (asset: string, address: DepositAddress) => void
  calculateTotal: (prices: Record<string, string>) => void
  resetToDemo: () => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  fetchBalances: (chainId: ChainID, address: string) => Promise<void>
  fetchTransactions: (chainId: ChainID, address: string, page?: number) => Promise<void>
  fetchDepositAddress: (chainId: ChainID, asset: string, address: string) => Promise<DepositAddress>
  submitDeposit: (chainId: ChainID, asset: string, address: string) => Promise<boolean>
  submitWithdraw: (chainId: ChainID, asset: string, fromAddress: string, toAddress: string, amount: string, privateKey: string) => Promise<boolean>
  submitTransfer: (chainId: ChainID, asset: string, fromAddress: string, toAddress: string, amount: string, privateKey: string) => Promise<boolean>
}

/**
 * 生成唯一交易ID
 */
const generateTxId = () => `TX${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`

/**
 * 生成模拟交易记录
 * @param count 生成数量，默认20条
 * @returns 模拟交易记录列表
 * [Design: Mock数据策略](../DESIGN.md#7-mock-数据策略)
 */
function generateMockTransactions(count: number = 20): TransactionRecord[] {
  const types: ('DEPOSIT' | 'WITHDRAW' | 'TRADE')[] = ['DEPOSIT', 'WITHDRAW', 'TRADE']
  const assets = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL', 'XRP']
  const statuses: ('SUCCESS' | 'PENDING' | 'FAILED')[] = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'PENDING', 'FAILED']
  
  const transactions: TransactionRecord[] = []
  const now = Date.now()
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const asset = assets[Math.floor(Math.random() * assets.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const amount = (Math.random() * 10000 + 1).toFixed(asset === 'BTC' ? 4 : 2)
    
    transactions.push({
      id: generateTxId(),
      type,
      asset,
      amount,
      status,
      createTime: now - i * Math.random() * 86400000 * 7,
      address: type !== 'TRADE' ? `${asset.toLowerCase()}1qxxxxxxxxx${Math.random().toString(36).substr(2, 15)}` : undefined,
      txId: type !== 'TRADE' && status === 'SUCCESS' ? `0x${Math.random().toString(16).substr(2, 64)}` : undefined,
      fee: (Math.random() * 5).toFixed(4),
    })
  }
  
  return transactions
}

/**
 * 生成模拟充值地址
 * @param asset 资产符号
 * @returns 模拟充值地址
 */
function generateMockDepositAddress(asset: string): DepositAddress {
  const prefixes: Record<string, string> = {
    BTC: 'bc1q',
    ETH: '0x',
    USDT: '0x',
    BNB: 'bnb1',
    SOL: 'So11111111111111111111111111111111111111111',
    XRP: 'r',
    DOGE: 'D',
    ADA: 'addr1',
    AVAX: '0x',
  }
  
  return {
    asset,
    address: `${prefixes[asset] || ''}${Math.random().toString(36).substr(2, 30)}`,
    tag: ['XRP', 'AVAX'].includes(asset) ? Math.floor(Math.random() * 100000).toString() : undefined,
  }
}

/**
 * 将API余额转换为钱包余额格式
 * @param apiBalance API返回的余额数据
 * @returns 钱包余额格式
 */
function convertApiBalance(apiBalance: Balance): WalletBalance {
  return {
    asset: apiBalance.token.symbol,
    free: apiBalance.display,
    locked: '0',
  }
}

/**
 * 将API交易记录转换为钱包交易记录格式
 * @param apiTx API返回的交易记录
 * @returns 钱包交易记录格式
 */
function convertApiTransaction(apiTx: Transaction): TransactionRecord {
  const txTypeMap: Record<string, 'DEPOSIT' | 'WITHDRAW' | 'TRADE'> = {
    'deposit': 'DEPOSIT',
    'withdraw': 'WITHDRAW',
    'transfer': 'TRADE',
  }
  
  const statusMap: Record<string, 'SUCCESS' | 'PENDING' | 'FAILED'> = {
    'confirmed': 'SUCCESS',
    'finalized': 'SUCCESS',
    'pending': 'PENDING',
    'reverted': 'FAILED',
    'failed': 'FAILED',
  }
  
  return {
    id: apiTx.id,
    type: txTypeMap[apiTx.tx_type] || 'TRADE',
    asset: apiTx.token.symbol,
    amount: apiTx.display,
    status: statusMap[apiTx.status] || 'SUCCESS',
    createTime: new Date(apiTx.created_at).getTime(),
    address: apiTx.to,
    txId: apiTx.tx_hash,
    fee: apiTx.fee_display,
  }
}

/**
 * 钱包状态管理 Store
 * 使用 Zustand 创建，支持持久化存储
 * [Design: 状态管理](../DESIGN.md#5-状态管理)
 */
export const useWalletStore = create<WalletState>((set, get) => ({
  balances: getItem<Record<string, WalletBalance>>('balances') || DEMO_BALANCES,
  transactions: getItem<TransactionRecord[]>('transactions') || generateMockTransactions(),
  depositAddresses: {},
  totalBalance: '0',
  isLoading: false,
  error: null,

  setBalances: (balances) => {
    setItem('balances', balances)
    set({ balances })
  },

  updateBalance: (asset, free, locked) => {
    const { balances } = get()
    const newBalances = {
      ...balances,
      [asset]: { asset, free, locked },
    }
    setItem('balances', newBalances)
    set({ balances: newBalances })
  },

  addTransaction: (transaction) => {
    const { transactions } = get()
    const newTransaction: TransactionRecord = {
      ...transaction,
      id: generateTxId(),
      createTime: Date.now(),
    }
    const newTransactions = [newTransaction, ...transactions]
    setItem('transactions', newTransactions)
    set({ transactions: newTransactions })
  },

  setDepositAddress: (asset, address) => {
    const { depositAddresses } = get()
    set({ depositAddresses: { ...depositAddresses, [asset]: address } })
  },

  calculateTotal: (prices) => {
    const { balances } = get()
    let total = 0
    Object.keys(balances).forEach((asset) => {
      const balance = balances[asset]
      const free = parseFloat(balance.free)
      const locked = parseFloat(balance.locked)
      const totalBalance = free + locked

      if (asset === 'USDT') {
        total += totalBalance
      } else {
        const price = parseFloat(prices[`${asset}USDT`] || '0')
        total += totalBalance * price
      }
    })
    set({ totalBalance: total.toFixed(2) })
  },

  resetToDemo: () => {
    setItem('balances', DEMO_BALANCES)
    set({ balances: DEMO_BALANCES })
  },

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  /**
   * 获取账户余额
   * @param chainId 链ID
   * @param address 钱包地址
   */
  fetchBalances: async (chainId, address) => {
    set({ isLoading: true, error: null })
    try {
      const response = await smartXApi.wallet.getBalances({
        chain_id: chainId,
        address: address,
      })
      
      if (response.success && response.data && Array.isArray(response.data)) {
        const balances: Record<string, WalletBalance> = {}
        response.data.forEach((apiBalance: Balance) => {
          const walletBalance = convertApiBalance(apiBalance)
          balances[walletBalance.asset] = walletBalance
        })
        setItem('balances', balances)
        set({ balances, isLoading: false })
      } else {
        console.warn('Wallet API returned empty or invalid data, using mock')
        const demoBalances = getItem<Record<string, WalletBalance>>('balances') || DEMO_BALANCES
        set({ balances: demoBalances, isLoading: false })
      }
    } catch (error) {
      console.warn('Failed to fetch balances from API, using mock:', error)
      const demoBalances = getItem<Record<string, WalletBalance>>('balances') || DEMO_BALANCES
      set({ balances: demoBalances, isLoading: false })
    }
  },

  /**
   * 获取交易记录
   * @param chainId 链ID
   * @param address 钱包地址
   * @param page 页码，默认1
   */
  fetchTransactions: async (chainId, address, page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const response = await smartXApi.wallet.getTransactions({
        chain_id: chainId,
        address: address,
        page: page,
        page_size: 20,
      })
      
      if (response.success && response.data && response.data.data) {
        const transactions: TransactionRecord[] = response.data.data.map((apiTx: Transaction) => 
          convertApiTransaction(apiTx)
        )
        if (transactions.length > 0) {
          set({ transactions, isLoading: false })
        } else {
          console.warn('Wallet transactions API returned empty, using mock')
          const mockTransactions = generateMockTransactions()
          set({ transactions: mockTransactions, isLoading: false })
        }
      } else {
        console.warn('Wallet transactions API failed, using mock')
        const mockTransactions = generateMockTransactions()
        set({ transactions: mockTransactions, isLoading: false })
      }
    } catch (error) {
      console.warn('Failed to fetch transactions from API, using mock:', error)
      const mockTransactions = generateMockTransactions()
      set({ transactions: mockTransactions, isLoading: false })
    }
  },

  /**
   * 获取充值地址
   * @param chainId 链ID
   * @param asset 资产符号
   * @param address 钱包地址
   * @returns 充值地址
   */
  fetchDepositAddress: async (chainId, asset, address) => {
    set({ isLoading: true, error: null })
    try {
      const response = await smartXApi.wallet.deposit({
        chain_id: chainId,
        address: address,
        token: '',
      })
      
      if (response.success && response.data) {
        const depositAddress: DepositAddress = {
          asset,
          address: response.data.address,
        }
        set({ depositAddresses: { ...get().depositAddresses, [asset]: depositAddress }, isLoading: false })
        return depositAddress
      }
    } catch (error) {
      console.warn('Failed to fetch deposit address, using mock:', error)
    }
    
    const mockAddress = generateMockDepositAddress(asset)
    set({ depositAddresses: { ...get().depositAddresses, [asset]: mockAddress }, isLoading: false })
    return mockAddress
  },

  /**
   * 提交充值请求
   * @param chainId 链ID
   * @param asset 资产符号
   * @param address 钱包地址
   * @returns 是否成功
   */
  submitDeposit: async (chainId, asset, address) => {
    set({ isLoading: true, error: null })
    try {
      const response = await smartXApi.wallet.deposit({
        chain_id: chainId,
        address: address,
        token: '',
      })
      
      if (response.success) {
        get().addTransaction({
          id: generateTxId(),
          type: 'DEPOSIT',
          asset,
          amount: '0',
          status: 'PENDING',
          createTime: Date.now(),
          address: response.data?.address || address,
        })
        
        set({ isLoading: false })
        return true
      } else {
        set({ error: response.error || 'Deposit failed', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Deposit failed', isLoading: false })
      return false
    }
  },

  /**
   * 提交提现请求
   * @param chainId 链ID
   * @param asset 资产符号
   * @param fromAddress 提现地址
   * @param toAddress 目标地址
   * @param amount 提现金额
   * @param privateKey 私钥
   * @returns 是否成功
   */
  submitWithdraw: async (chainId, asset, fromAddress, toAddress, amount, privateKey) => {
    set({ isLoading: true, error: null })
    try {
      const response = await smartXApi.wallet.withdraw({
        chain_id: chainId,
        address: fromAddress,
        to: toAddress,
        value: amount,
        private_key: privateKey,
      })
      
      if (response.success) {
        get().addTransaction({
          id: generateTxId(),
          type: 'WITHDRAW',
          asset,
          amount,
          status: 'PENDING',
          createTime: Date.now(),
          address: toAddress,
          txId: response.data?.tx_hash,
        })
        
        const { balances } = get()
        const currentBalance = balances[asset] || { asset, free: '0', locked: '0' }
        const newFree = Math.max(0, parseFloat(currentBalance.free) - parseFloat(amount)).toFixed(4)
        get().updateBalance(asset, newFree, currentBalance.locked)
        
        set({ isLoading: false })
        return true
      } else {
        set({ error: response.error || 'Withdraw failed', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Withdraw failed', isLoading: false })
      return false
    }
  },

  /**
   * 提交转账请求
   * @param chainId 链ID
   * @param asset 资产符号
   * @param fromAddress 转出地址
   * @param toAddress 转入地址
   * @param amount 转账金额
   * @param privateKey 私钥
   * @returns 是否成功
   */
  submitTransfer: async (chainId, asset, fromAddress, toAddress, amount, privateKey) => {
    set({ isLoading: true, error: null })
    try {
      const response = await smartXApi.wallet.transfer({
        chain_id: chainId,
        from: fromAddress,
        to: toAddress,
        value: amount,
        private_key: privateKey,
      })
      
      if (response.success) {
        get().addTransaction({
          id: generateTxId(),
          type: 'TRADE',
          asset,
          amount,
          status: 'SUCCESS',
          createTime: Date.now(),
          address: toAddress,
          txId: response.data?.tx_hash,
        })
        
        const { balances } = get()
        const currentBalance = balances[asset] || { asset, free: '0', locked: '0' }
        const newFree = Math.max(0, parseFloat(currentBalance.free) - parseFloat(amount)).toFixed(4)
        get().updateBalance(asset, newFree, currentBalance.locked)
        
        set({ isLoading: false })
        return true
      } else {
        set({ error: response.error || 'Transfer failed', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Transfer failed', isLoading: false })
      return false
    }
  },
}))