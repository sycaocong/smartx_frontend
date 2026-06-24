export interface WalletBalance {
  asset: string
  free: string
  locked: string
}

export interface TransactionRecord {
  id: string
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRADE'
  asset: string
  amount: string
  status: 'SUCCESS' | 'PENDING' | 'FAILED'
  createTime: number
  address?: string
  txId?: string
  fee?: string
}

export interface DepositAddress {
  asset: string
  address: string
  tag?: string
}

export interface WithdrawRequest {
  asset: string
  address: string
  amount: string
  tag?: string
  fee: string
}
