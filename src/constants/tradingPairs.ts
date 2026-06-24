export const TRADING_PAIRS = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', pricePrecision: 2, quantityPrecision: 4, minQuantity: 0.0001, status: 'TRADING' as const },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', pricePrecision: 2, quantityPrecision: 4, minQuantity: 0.001, status: 'TRADING' as const },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', pricePrecision: 2, quantityPrecision: 4, minQuantity: 0.01, status: 'TRADING' as const },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', pricePrecision: 2, quantityPrecision: 4, minQuantity: 0.01, status: 'TRADING' as const },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', pricePrecision: 4, quantityPrecision: 1, minQuantity: 1, status: 'TRADING' as const },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', pricePrecision: 5, quantityPrecision: 1, minQuantity: 1, status: 'TRADING' as const },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', pricePrecision: 4, quantityPrecision: 1, minQuantity: 1, status: 'TRADING' as const },
  { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', pricePrecision: 2, quantityPrecision: 4, minQuantity: 0.01, status: 'TRADING' as const },
] as const

export const CHART_INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
] as const

export const DEFAULT_PAIR = 'BTCUSDT'

export const DEMO_BALANCES: Record<string, { asset: string; free: string; locked: string }> = {
  USDT: { asset: 'USDT', free: '100000.00', locked: '0.00' },
  BTC: { asset: 'BTC', free: '0.5000', locked: '0.0000' },
  ETH: { asset: 'ETH', free: '5.0000', locked: '0.0000' },
  BNB: { asset: 'BNB', free: '10.0000', locked: '0.0000' },
  SOL: { asset: 'SOL', free: '50.0000', locked: '0.0000' },
  XRP: { asset: 'XRP', free: '1000.00', locked: '0.00' },
  DOGE: { asset: 'DOGE', free: '10000.00', locked: '0.00' },
  ADA: { asset: 'ADA', free: '5000.00', locked: '0.00' },
  AVAX: { asset: 'AVAX', free: '100.00', locked: '0.00' },
}
