export interface UserInfo {
  id: string
  username: string
  email: string
  avatar?: string
  phone?: string
  country?: string
  isVip: boolean
  isVerified: boolean
  level: number
  accountType: 'DEMO' | 'REAL'
  createdAt: number
  twoFactorEnabled: boolean
}

export interface UserStats {
  totalTrades: number
  totalVolume: string
  totalProfit: string
  profitPercent: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  date: number
  type: 'SYSTEM' | 'UPGRADE' | 'LISTING' | 'MAINTENANCE'
  isRead: boolean
}
