import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { Loading } from './components/common/Loading'
import { useMarketStore } from './stores/marketStore'
import { useWalletStore } from './stores/walletStore'
import { getTickers24hr } from './utils/binance'

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const TradePage = lazy(() => import('./pages/TradePage').then((m) => ({ default: m.TradePage })))
const MarketPage = lazy(() => import('./pages/MarketPage').then((m) => ({ default: m.MarketPage })))
const WalletPage = lazy(() => import('./pages/WalletPage').then((m) => ({ default: m.WalletPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))

function AppContent() {
  const { setTickers, tickers } = useMarketStore()
  const { calculateTotal } = useWalletStore()

  useEffect(() => {
    const fetchTickers = async () => {
      const response = await getTickers24hr()
      if (response.data) {
        setTickers(response.data)
      }
    }

    fetchTickers()

    const interval = setInterval(fetchTickers, 30000)
    return () => clearInterval(interval)
  }, [setTickers])

  useEffect(() => {
    if (tickers.length > 0) {
      const prices: Record<string, string> = {}
      tickers.forEach((ticker) => {
        prices[ticker.symbol] = ticker.lastPrice
      })
      calculateTotal(prices)
    }
  }, [tickers, calculateTotal])

  return (
    <div className="min-h-screen flex flex-col bg-bg-dark">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/trade" element={<TradePage />} />
            <Route path="/trade/:pair" element={<TradePage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            backgroundColor: '#1E2329',
            border: '1px solid #2B3139',
            color: '#EAECEF',
          },
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
