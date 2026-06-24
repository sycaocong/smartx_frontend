import { create } from 'zustand'
import type { WalletBalance, TransactionRecord, DepositAddress } from '../types/wallet'
import { DEMO_BALANCES } from '../constants/tradingPairs'
import { getItem, setItem } from '../utils/storage'

interface WalletState {
  balances: Record<string, WalletBalance>
  transactions: TransactionRecord[]
  depositAddresses: Record<string, DepositAddress>
  totalBalance: string

  setBalances: (balances: Record<string, WalletBalance>) => void
  updateBalance: (asset: string, free: string, locked: string) => void
  addTransaction: (transaction: TransactionRecord) => void
  setDepositAddress: (asset: string, address: DepositAddress) => void
  calculateTotal: (prices: Record<string, string>) => void
  resetToDemo: () => void
}

const generateTxId = () => `TX${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`

export const useWalletStore = create<WalletState>((set, get) => ({
  balances: getItem<Record<string, WalletBalance>>('balances') || DEMO_BALANCES,
  transactions: getItem<TransactionRecord[]>('transactions') || [],
  depositAddresses: {},
  totalBalance: '0',

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
}))
