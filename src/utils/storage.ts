const STORAGE_PREFIX = 'smartx_'

export function setItem(key: string, value: any): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export function getItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error('Failed to read from localStorage:', error)
    return null
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
  } catch (error) {
    console.error('Failed to remove from localStorage:', error)
  }
}

export function clearAll(): void {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}
