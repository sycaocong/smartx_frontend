import { useState } from 'react'
import { User, Bell, Shield, Globe, Lock, Mail, Phone, MapPin } from 'lucide-react'
import { useUserStore } from '../stores/userStore'
import { useWalletStore } from '../stores/walletStore'
import { formatPrice } from '../utils/format'

function AccountInfo() {
  const { user } = useUserStore()
  const { totalBalance } = useWalletStore()

  if (!user) return null

  return (
    <div className="card p-6">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-text-primary">{user.username}</h2>
          <p className="text-text-muted">{user.email}</p>
          <div className="flex items-center gap-4 mt-4">
            <span className="px-3 py-1 bg-green-bg text-green text-sm rounded-full">
              {user.isVerified ? '已验证' : '未验证'}
            </span>
            <span className="text-text-secondary text-sm">
              会员等级: VIP{user.level}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-text-muted text-sm">总资产</div>
          <div className="text-2xl font-bold text-text-primary">${formatPrice(totalBalance)}</div>
        </div>
      </div>
    </div>
  )
}

function SecuritySettings() {
  const { user } = useUserStore()

  if (!user) return null

  const securityItems = [
    {
      icon: Lock,
      title: '登录密码',
      description: '设置登录密码保护账户安全',
      status: '已设置',
      isActive: true,
    },
    {
      icon: Phone,
      title: '手机验证',
      description: `${user.phone?.slice(0, 3)}****${user.phone?.slice(-4) || '未绑定'}`,
      status: user.phone ? '已绑定' : '未绑定',
      isActive: !!user.phone,
    },
    {
      icon: Mail,
      title: '邮箱验证',
      description: `${user.email.slice(0, 2)}****${user.email.slice(user.email.indexOf('@'))}`,
      status: user.isVerified ? '已验证' : '未验证',
      isActive: user.isVerified,
    },
    {
      icon: Shield,
      title: '两步验证',
      description: '开启双重认证提高账户安全性',
      status: user.twoFactorEnabled ? '已开启' : '未开启',
      isActive: user.twoFactorEnabled,
    },
  ]

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        安全设置
      </h3>
      <div className="space-y-4">
        {securityItems.map((item) => (
          <div key={item.title} className="flex items-center justify-between p-4 bg-bg-hover rounded-lg">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.isActive ? 'bg-green-bg' : 'bg-bg-primary'}`}>
                <item.icon className={`w-5 h-5 ${item.isActive ? 'text-green' : 'text-text-muted'}`} />
              </div>
              <div>
                <div className="font-medium text-text-primary">{item.title}</div>
                <div className="text-text-muted text-sm">{item.description}</div>
              </div>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full ${item.isActive ? 'bg-green-bg text-green' : 'bg-bg-primary text-text-muted'}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PersonalInfo() {
  const { user, setUser } = useUserStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || '',
  })

  const handleSave = () => {
    if (user) {
      setUser({ ...user, ...formData })
    }
    setIsEditing(false)
  }

  if (!user) return null

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          个人信息
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn-secondary-sm"
        >
          {isEditing ? '取消' : '编辑'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-text-secondary text-sm mb-2">用户名</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input-field"
            />
          ) : (
            <div className="text-text-primary">{user.username}</div>
          )}
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-2">邮箱</label>
          <div className="text-text-primary">{user.email}</div>
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            手机号码
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field"
            />
          ) : (
            <div className="text-text-primary">{user.phone || '-'}</div>
          )}
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            国家/地区
          </label>
          {isEditing ? (
            <select className="input-field" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })}>
              <option value="">选择国家/地区</option>
              <option value="CN">中国</option>
              <option value="US">美国</option>
              <option value="JP">日本</option>
              <option value="KR">韩国</option>
              <option value="SG">新加坡</option>
            </select>
          ) : (
            <div className="text-text-primary">{user.country || '-'}</div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setIsEditing(false)} className="btn-secondary-sm">
            取消
          </button>
          <button onClick={handleSave} className="btn-primary-sm">
            保存
          </button>
        </div>
      )}
    </div>
  )
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    marketing: false,
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
  }

  const notificationItems = [
    { key: 'email' as const, title: '邮件通知', description: '接收交易确认、账户更新等邮件' },
    { key: 'sms' as const, title: '短信通知', description: '接收重要账户活动的短信提醒' },
    { key: 'push' as const, title: '推送通知', description: '接收浏览器推送通知' },
    { key: 'marketing' as const, title: '营销邮件', description: '接收产品更新和促销信息' },
  ]

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        通知设置
      </h3>
      <div className="space-y-4">
        {notificationItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-bg-hover rounded-lg">
            <div>
              <div className="font-medium text-text-primary">{item.title}</div>
              <div className="text-text-muted text-sm">{item.description}</div>
            </div>
            <button
              onClick={() => toggleNotification(item.key)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                notifications[item.key] ? 'bg-primary' : 'bg-bg-primary'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  notifications[item.key] ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function LanguageSettings() {
  const { language, setLanguage } = useUserStore()

  const languages = [
    { value: 'zh', label: '简体中文', flag: 'CN' },
    { value: 'en', label: 'English', flag: 'US' },
  ]

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary" />
        语言设置
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {languages.map((lang) => (
          <button
            key={lang.value}
            onClick={() => setLanguage(lang.value as 'zh' | 'en')}
            className={`p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
              language === lang.value
                ? 'border-primary bg-primary/10'
                : 'border-border-color hover:border-primary/50'
            }`}
          >
            <span className="text-2xl">🌏</span>
            <span className="text-text-primary font-medium">{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">个人中心</h1>
          <p className="text-text-secondary text-sm mt-1">管理您的账户设置和个人信息</p>
        </div>
      </div>

      <AccountInfo />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <SecuritySettings />
        <PersonalInfo />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <NotificationSettings />
        <LanguageSettings />
      </div>
    </div>
  )
}
