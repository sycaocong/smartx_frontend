import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, ArrowRight, AlertCircle, Check, Shield } from 'lucide-react'
import { useUserStore } from '../stores/userStore'
import { useWalletStore } from '../stores/walletStore'
import { formatNumber } from '../utils/format'
import { TRADING_PAIRS } from '../constants/tradingPairs'
import { ChainID } from '../services/api'

export function TransferPage() {
  const navigate = useNavigate()
  const { language, user } = useUserStore()
  const { balances, isLoading, error, clearError, submitTransfer } = useWalletStore()
  
  const [asset, setAsset] = useState('USDT')
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const DEFAULT_CHAIN_ID: ChainID = '1'

  useEffect(() => {
    clearError()
  }, [clearError])

  const balance = balances[asset]
  const availableBalance = balance ? parseFloat(balance.free) : 0
  const fromAddress = user?.walletAddress || '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAA'

  const handleSubmit = async () => {
    if (!asset || !toAddress || !amount || parseFloat(amount) <= 0 || !agreed || !privateKey) return
    if (parseFloat(amount) > availableBalance) {
      clearError()
      return
    }
    
    const success = await submitTransfer(DEFAULT_CHAIN_ID, asset, fromAddress, toAddress, amount, privateKey)
    if (success) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        navigate('/wallet')
      }, 2000)
    }
  }

  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= availableBalance

  const assets = TRADING_PAIRS.map(p => p.baseAsset)

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
            {language === 'zh' ? '内部转账' : 'Internal Transfer'}
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

      <div className="card p-6">
        <h2 className="text-text-primary font-semibold text-lg mb-6">
          {language === 'zh' ? '转账信息' : 'Transfer Information'}
        </h2>

        {showSuccess && (
          <div className="mb-6 p-4 bg-green-bg text-green rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            {language === 'zh' ? '转账成功' : 'Transfer Successful'}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="text-text-muted text-sm mb-2 block">
              {language === 'zh' ? '选择币种' : 'Select Asset'}
            </label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="input-field w-full"
              disabled={isLoading}
            >
              {assets.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-text-muted text-sm mb-2 block">
              {language === 'zh' ? '发送地址' : 'From Address'}
            </label>
            <input
              type="text"
              value={fromAddress}
              readOnly
              className="input-field w-full bg-bg-input"
            />
          </div>

          <div>
            <label className="text-text-muted text-sm mb-2 block">
              {language === 'zh' ? '接收地址' : 'Recipient Address'}
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder={language === 'zh' ? '请输入接收地址' : 'Enter recipient address'}
              className="input-field w-full"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-text-muted text-sm mb-2 block">
              {language === 'zh' ? '转账数量' : 'Amount'} ({asset})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`0.0000`}
              className="input-field w-full text-lg py-3"
              disabled={isLoading}
            />
            {balance && (
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-text-secondary">
                  {language === 'zh' ? '可用余额' : 'Available'}: {formatNumber(balance.free)} {asset}
                </span>
                <span className="text-green">
                  {language === 'zh' ? '手续费' : 'Fee'}: {language === 'zh' ? '免费' : 'Free'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-text-muted text-sm mb-2 block">
              {language === 'zh' ? '私钥' : 'Private Key'}
              <span className="text-red ml-1">*</span>
            </label>
            <input
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder={language === 'zh' ? '请输入私钥' : 'Enter private key'}
              className="input-field w-full"
              disabled={isLoading}
            />
            <p className="text-text-muted text-xs mt-2">
              {language === 'zh' ? '私钥仅用于签名交易，不会存储或传输' : 'Private key is only used for signing, not stored or transmitted'}
            </p>
          </div>

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

          <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-text-secondary text-sm">
              <div className="font-medium text-text-primary mb-1">
                {language === 'zh' ? '安全提示' : 'Security Tips'}
              </div>
              <ul className="space-y-1">
                <li>• {language === 'zh' ? '请确认接收地址正确无误' : 'Please confirm the recipient address is correct'}</li>
                <li>• {language === 'zh' ? '内部转账即时到账' : 'Internal transfers are instant'}</li>
                <li>• {language === 'zh' ? '转账后无法撤销，请谨慎操作' : 'Transfers cannot be reversed, please be careful'}</li>
                <li>• {language === 'zh' ? '保护好您的私钥，不要泄露给任何人' : 'Keep your private key secure, never share it'}</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="agreement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 rounded border-border-color text-primary focus:ring-primary"
            />
            <label htmlFor="agreement" className="text-text-secondary text-sm">
              {language === 'zh' ? '我确认转账信息正确' : 'I confirm the transfer information is correct'}
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!toAddress || !isValidAmount || !agreed || !privateKey || isLoading}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 text-bg-dark font-bold rounded-lg hover:shadow-lg hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {language === 'zh' ? '处理中...' : 'Processing...'}
              </span>
            ) : (
              language === 'zh' ? '确认转账' : 'Confirm Transfer'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}