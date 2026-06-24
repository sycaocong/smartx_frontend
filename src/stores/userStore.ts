import { create } from 'zustand'
import type { UserInfo, UserStats, Announcement } from '../types/user'
import { getItem, setItem } from '../utils/storage'

interface UserState {
  user: UserInfo | null
  stats: UserStats | null
  announcements: Announcement[]
  language: 'zh' | 'en'
  isAuthenticated: boolean

  setUser: (user: UserInfo) => void
  setStats: (stats: UserStats) => void
  setAnnouncements: (announcements: Announcement[]) => void
  setLanguage: (language: 'zh' | 'en') => void
  toggleLanguage: () => void
  markAnnouncementAsRead: (id: string) => void
  login: () => void
  logout: () => void
}

const demoUser: UserInfo = {
  id: 'demo-user-001',
  username: 'SmartX_Demo',
  email: 'demo@smartx.com',
  phone: '13800138000',
  country: 'CN',
  isVip: false,
  isVerified: true,
  level: 1,
  accountType: 'DEMO',
  createdAt: Date.now() - 86400000 * 30,
  twoFactorEnabled: false,
}

const demoStats: UserStats = {
  totalTrades: 156,
  totalVolume: '2580000',
  totalProfit: '12500',
  profitPercent: '+4.98',
}

const initialAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'SmartX 新币上线',
    content: 'ADA/USDT 交易对已正式上线交易',
    date: Date.now() - 86400000,
    type: 'LISTING',
    isRead: false,
  },
  {
    id: '2',
    title: '系统升级通知',
    content: '本周六凌晨2点将进行系统维护升级，预计持续2小时',
    date: Date.now() - 86400000 * 2,
    type: 'MAINTENANCE',
    isRead: false,
  },
  {
    id: '3',
    title: '手续费优惠活动',
    content: '现货交易手续费限时5折优惠',
    date: Date.now() - 86400000 * 3,
    type: 'SYSTEM',
    isRead: true,
  },
]

export const useUserStore = create<UserState>((set, get) => ({
  user: getItem<UserInfo>('user') || demoUser,
  stats: getItem<UserStats>('stats') || demoStats,
  announcements: getItem<Announcement[]>('announcements') || initialAnnouncements,
  language: getItem<'zh' | 'en'>('language') || 'zh',
  isAuthenticated: true,

  setUser: (user) => {
    setItem('user', user)
    set({ user })
  },

  setStats: (stats) => {
    setItem('stats', stats)
    set({ stats })
  },

  setAnnouncements: (announcements) => {
    setItem('announcements', announcements)
    set({ announcements })
  },

  setLanguage: (language) => {
    setItem('language', language)
    set({ language })
  },

  toggleLanguage: () => {
    const { language } = get()
    const newLanguage = language === 'zh' ? 'en' : 'zh'
    setItem('language', newLanguage)
    set({ language: newLanguage })
  },

  markAnnouncementAsRead: (id) => {
    const { announcements } = get()
    const newAnnouncements = announcements.map((a) =>
      a.id === id ? { ...a, isRead: true } : a
    )
    setItem('announcements', newAnnouncements)
    set({ announcements: newAnnouncements })
  },

  login: () => {
    setItem('user', demoUser)
    setItem('stats', demoStats)
    set({ user: demoUser, stats: demoStats, isAuthenticated: true })
  },

  logout: () => {
    setItem('user', null)
    setItem('stats', null)
    set({ user: null, stats: null, isAuthenticated: false })
  },
}))
