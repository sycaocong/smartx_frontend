// 格式化数字
export function formatNumber(num: string | number, decimals: number = 2): string {
  const number = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(number)) return '0'
  return number.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// 格式化价格
export function formatPrice(price: string, decimals: number = 2): string {
  return formatNumber(price, decimals)
}

// 格式化数量
export function formatQuantity(quantity: string, decimals: number = 4): string {
  return formatNumber(quantity, decimals)
}

// 格式化百分比
export function formatPercent(percent: string): string {
  const num = parseFloat(percent)
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`
}

// 格式化时间
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化大额数字
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  return num.toFixed(2)
}

// 判断涨跌
export function isPriceUp(current: string, previous: string): boolean {
  return parseFloat(current) > parseFloat(previous)
}

// 判断跌
export function isPriceDown(current: string, previous: string): boolean {
  return parseFloat(current) < parseFloat(previous)
}

// 获取涨跌颜色类
export function getPriceColorClass(changePercent: string): string {
  const num = parseFloat(changePercent)
  return num >= 0 ? 'text-green' : 'text-red'
}
