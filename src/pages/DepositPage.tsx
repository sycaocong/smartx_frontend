import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowDownLeft, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react'
import { useUserStore } from '../stores/userStore'
import { useWalletStore } from '../stores/walletStore'
import { formatNumber } from '../utils/format'
import { ChainID } from '../services/api'

export function DepositPage() {
  const { asset } = useParams<{ asset: string }>()
  const navigate = useNavigate()
  const { language, user } = useUserStore()
  const { balances, fetchDepositAddress, depositAddresses, isLoading, error, clearError, submitDeposit } = useWalletStore()
  
  const [amount, setAmount] = useState('')
  const [copied, setCopied] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<string | null>(null)
  const [tag, setTag] = useState<string | null>(null)

  const DEFAULT_CHAIN_ID: ChainID = '1'
  const walletAddress = user?.walletAddress || '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA'

  useEffect(() => {
    if (asset) {
      const existingAddress = depositAddresses[asset]
      if (existingAddress) {
        setCurrentAddress(existingAddress.address)
        setTag(existingAddress.tag || null)
      } else {
        fetchDepositAddress(DEFAULT_CHAIN_ID, asset, walletAddress)
      }
    }
    clearError()
  }, [asset, depositAddresses, fetchDepositAddress, clearError, DEFAULT_CHAIN_ID, walletAddress])

  useEffect(() => {
    if (asset && depositAddresses[asset]) {
      setCurrentAddress(depositAddresses[asset].address)
      setTag(depositAddresses[asset].tag || null)
    }
  }, [asset, depositAddresses])

  const handleCopy = async () => {
    if (currentAddress) {
      await navigator.clipboard.writeText(currentAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSubmit = async () => {
    if (!asset || !amount || parseFloat(amount) <= 0) return
    
    const success = await submitDeposit(DEFAULT_CHAIN_ID, asset, walletAddress)
    if (success) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setAmount('')
        navigate('/wallet')
      }, 2000)
    }
  }

  const balance = balances[asset || '']
  const needsTag = ['XRP', 'AVAX', 'EOS'].includes(asset || '')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/wallet')}
            className="text-text-secondary hover:text-text-primary transition-colors mb-2 flex items-center gap-2"
          >
            ← {language === 'zh' ? '返回钱包' : 'Back to Wallet'}
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            {language === 'zh' ? '充值' : 'Deposit'} {asset}
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-bg text-red rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={clearError} className="ml-auto text-text-secondary hover:text-red">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-4">
            {language === 'zh' ? '充值地址' : 'Deposit Address'}
          </h2>

          {isLoading && !currentAddress && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {currentAddress && (
            <div className="space-y-4">
              <div className="bg-bg-input rounded-lg p-4 border border-border-color">
                <div className="text-text-muted text-xs mb-2">{language === 'zh' ? '钱包地址' : 'Address'}</div>
                <div className="flex items-center gap-3">
                  <code className="text-text-primary font-mono text-sm break-all flex-1">
                    {currentAddress}
                  </code>
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-bg text-green' : 'bg-bg-hover text-text-muted hover:text-primary'}`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {tag && needsTag && (
                <div className="bg-yellow-bg rounded-lg p-4 border border-yellow/30">
                  <div className="text-text-muted text-xs mb-2">{language === 'zh' ? 'Memo/标签' : 'Memo/Tag'}</div>
                  <div className="flex items-center gap-3">
                    <code className="text-text-primary font-mono text-sm">
                      {tag}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(tag)}
                      className="p-2 rounded-lg bg-bg-hover text-text-muted hover:text-primary transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-primary/10 rounded-lg p-4">
                <div className="text-text-muted text-xs mb-2">{language === 'zh' ? '充值提示' : 'Deposit Tips'}</div>
                <ul className="text-text-secondary text-sm space-y-1">
                  <li>• {language === 'zh' ? '请确认充值网络正确' : 'Please confirm the correct network'}</li>
                  <li>• {language === 'zh' ? '充值金额必须大于最低充值限额' : 'Deposit amount must exceed the minimum limit'}</li>
                  {needsTag && <li>• {language === 'zh' ? '请务必填写Memo/标签，否则资产将丢失' : 'Memo/Tag is required, otherwise assets will be lost'}</li>}
                  <li>• {language === 'zh' ? '充值到账时间取决于区块链确认数' : 'Deposit processing time depends on blockchain confirmations'}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-4">
            {language === 'zh' ? '充值金额' : 'Deposit Amount'}
          </h2>

          {showSuccess && (
            <div className="mb-4 p-4 bg-green-bg text-green rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5" />
              {language === 'zh' ? '充值请求已提交，等待区块确认' : 'Deposit request submitted, awaiting blockchain confirmation'}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-text-muted text-sm mb-2 block">
                {language === 'zh' ? '充值数量' : 'Amount'} ({asset})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`0.0000`}
                className="input-field w-full text-lg py-3"
                disabled={isLoading}
              />
            </div>

            {balance && (
              <div className="text-text-secondary text-sm">
                {language === 'zh' ? '当前余额' : 'Current Balance'}: {formatNumber(balance.free)} {asset}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {[0.25, 0.5, 0.75, 1].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => {
                    if (balance) {
                      const maxAmount = parseFloat(balance.free) * ratio
                      setAmount(maxAmount.toFixed(4))
                    }
                  }}
                  className="py-2 bg-bg-input border border-border-color rounded-lg text-text-secondary text-sm hover:text-primary hover:border-primary transition-colors"
                >
                  {ratio * 100}%
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0 || isLoading}
              className="w-full py-4 bg-gradient-to-r from-green to-green/80 text-bg-dark font-bold rounded-lg hover:shadow-lg hover:shadow-green/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <ArrowDownLeft className="w-5 h-5" />
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {language === 'zh' ? '处理中...' : 'Processing...'}
                </span>
              ) : (
                language === 'zh' ? '确认充值' : 'Confirm Deposit'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}