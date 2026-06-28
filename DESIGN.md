# SmartX 交易所前端设计文档

## 1. 项目概述

### 1.1 项目简介
SmartX 是一个专业级 Web3 加密货币交易所前端应用，采用现代化 React 技术栈构建，支持实时行情展示、现货交易、资产管理等核心功能。

### 1.2 核心特性
- **专业深色主题**：采用专业交易平台风格的深色主题设计
- **实时行情推送**：通过 WebSocket 实时推送行情数据
- **现货交易**：支持限价单、市价单等多种订单类型
- **资产管理**：实时显示账户余额、交易记录
- **价格预警**：支持设置价格阈值预警
- **多语言支持**：支持中英文切换

---

## 2. 技术栈

### 2.1 前端框架
| 组件 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | React | 18+ | UI 框架 |
| 构建工具 | Vite | 5.x | 快速构建工具 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 样式 | Tailwind CSS | 3.x | CSS 框架 |
| 路由 | React Router | 6.x | 路由管理 |
| 状态管理 | Zustand | 4.x | 轻量级状态管理 |
| 图表 | Lightweight Charts | 4.x | 专业 K 线图表 |
| HTTP | Fetch API | - | 原生 HTTP 客户端 |

### 2.2 后端接口
| 服务 | 地址 | 说明 |
|------|------|------|
| 后端 API | `http://localhost:8080` | Go 撮合引擎 |
| WebSocket | `ws://localhost:8080/ws` | 实时行情推送 |

---

## 3. 系统架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     React 应用                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │ 页面组件 │  │ 页面组件 │  │ 页面组件 │  │ 页面组件 │  │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │  │
│  │       │             │             │             │        │  │
│  │       └─────────────┼─────────────┼─────────────┘        │  │
│  │                     ▼                                   │  │
│  │          ┌───────────────────────┐                      │  │
│  │          │      Zustand Store    │                      │  │
│  │          │  (Market/Order/User   │                      │  │
│  │          │   Wallet)             │                      │  │
│  │          └───────────┬───────────┘                      │  │
│  │                      ▼                                  │  │
│  │          ┌───────────────────────┐                      │  │
│  │          │      API Services     │                      │  │
│  │          │  (HTTP/WebSocket)     │                      │  │
│  │          └───────────┬───────────┘                      │  │
│  └───────────────────────┼─────────────────────────────────┘  │
│                          │                                     │
└──────────────────────────┼─────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  HTTP API       │ │  WebSocket      │ │  Binance API    │
│  (localhost:8080)│ │  (localhost:8080)│ │  (stream.binance.com)│
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 3.2 数据流

1. **行情数据**：后端 WebSocket → `useMatchingEngineWS` hook → `marketStore` → 页面组件
2. **订单数据**：用户操作 → `api.ts` → 后端 API → `orderStore` → 页面组件
3. **账户数据**：页面加载 → `api.ts` → 后端 API → `walletStore` → 页面组件

---

## 4. 页面组件设计

### 4.1 页面路由

| 路径 | 页面组件 | 说明 |
|------|---------|------|
| `/` | HomePage | 首页，展示市场概览 |
| `/trade` | TradePage | 现货交易页面 |
| `/market` | MarketPage | 市场列表页面 |
| `/wallet` | WalletPage | 资产管理页面 |
| `/profile` | ProfilePage | 用户设置页面 |

### 4.2 TradePage 交易页面

**组件结构：**

```
TradePage
├── MiniPriceBoard      # 价格看板（最新价、涨跌幅、成交量）
├── ChartComponent      # K 线图表（蜡烛图/分时图、技术指标）
├── DepthChartComponent # 深度图
├── OrderBookComponent  # 订单簿（买卖盘口）
├── TradeFormComponent  # 交易表单（下单）
├── RecentTradesComponent # 成交记录
├── OrderHistoryComponent # 订单历史（当前委托/历史委托）
└── PriceAlertComponent   # 价格预警
```

**核心组件功能：**

| 组件 | 功能 | 数据来源 |
|------|------|---------|
| MiniPriceBoard | 显示最新价格、24h涨跌幅、成交量 | 后端 API + Mock |
| ChartComponent | K 线/分时图、MA/MACD/RSI 指标 | Binance API + Mock |
| OrderBookComponent | 买卖盘口深度、快捷下单 | WebSocket + Mock |
| TradeFormComponent | 限价/市价单下单 | 后端 API |
| RecentTradesComponent | 实时成交记录 | WebSocket |
| OrderHistoryComponent | 当前委托、历史委托、成交记录 | 后端 API + Local |

### 4.3 公共组件

| 组件 | 说明 |
|------|------|
| Header | 顶部导航栏，包含 Logo、导航链接、用户信息 |
| Footer | 底部信息，包含链接、版权信息 |
| Loading | 加载状态指示器 |
| Sparkline | 迷你价格走势图 |

---

## 5. 状态管理

### 5.1 MarketStore

```typescript
interface MarketState {
  selectedPair: string        // 当前选中交易对
  tickers: Ticker24hr[]       // 行情列表
  orderBook: OrderBook | null // 订单簿数据
  recentTrades: Trade[]       // 成交记录
  currentPrice: string        // 当前价格
  chartInterval: string       // 图表周期
  favoritePairs: string[]     // 收藏交易对
  priceAlerts: PriceAlert[]   // 价格预警列表
  // ... methods
}
```

### 5.2 OrderStore

```typescript
interface OrderState {
  orders: Order[]             // 订单列表
  addOrder: (order) => void   // 添加订单
  cancelOrder: (id) => void   // 取消订单
  updateOrder: (order) => void // 更新订单
}
```

### 5.3 WalletStore

```typescript
interface WalletState {
  balances: Balance[]         // 账户余额
  transactions: Transaction[] // 交易记录
  addBalance: (balance) => void
  addTransaction: (tx) => void
}
```

### 5.4 UserStore

```typescript
interface UserState {
  user: User | null           // 当前用户
  language: 'zh' | 'en'       // 语言设置
  isAuthenticated: boolean    // 认证状态
  setLanguage: (lang) => void
}
```

---

## 6. API 接口设计

### 6.1 后端 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/v1/market/ticker/{symbol}` | GET | 获取行情 |
| `/api/v1/market/orderbook/{symbol}` | GET | 获取订单簿 |
| `/api/v1/market/kline/{symbol}` | GET | 获取 K 线 |
| `/api/v1/market/trades/{symbol}` | GET | 获取成交记录 |
| `/api/v1/orders` | POST | 创建订单 |
| `/api/v1/orders/{id}` | GET | 查询订单 |
| `/api/v1/orders/{id}` | DELETE | 取消订单 |
| `/api/v1/orders` | GET | 获取订单列表 |

### 6.2 WebSocket 订阅

| 主题 | 说明 |
|------|------|
| `{symbol}@trade` | 实时成交 |
| `{symbol}@depth@100ms` | 订单簿深度更新 |
| `{symbol}@kline_{interval}` | K 线数据 |

### 6.3 Binance API（备用）

| 接口 | 说明 |
|------|------|
| `/api/v3/ticker/24hr` | 24h 行情 |
| `/api/v3/klines` | K 线数据 |
| `/api/v3/depth` | 订单簿深度 |

---

## 7. Mock 数据策略

由于后端 API 部分接口返回空数据或全 0，前端采用以下策略：

### 7.1 Mock 数据生成

| 数据类型 | Mock 函数 | 触发条件 |
|---------|----------|---------|
| Ticker | `generateMockTicker()` | 后端返回 `last_price <= 0` |
| OrderBook | `generateMockOrderBook()` | 后端返回空或加载失败 |
| K线 | `generateMockKlines()` | Binance API 调用失败 |

### 7.2 Mock 数据特征

- **价格范围**：BTC 约 67,000-72,000 USDT
- **价格波动**：随机 ±5% 波动
- **订单簿深度**：20 个档位，随机数量分布

---

## 8. 项目结构

```
e:\codex\smartx\
├── src/
│   ├── components/           # 组件目录
│   │   ├── common/           # 通用组件
│   │   │   ├── Loading.tsx
│   │   │   └── Sparkline.tsx
│   │   └── layout/           # 布局组件
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   ├── constants/            # 常量定义
│   │   ├── theme.ts          # 主题颜色
│   │   └── tradingPairs.ts   # 交易对配置
│   ├── hooks/                # 自定义 Hooks
│   │   └── useBinanceWS.ts   # WebSocket 连接管理
│   ├── pages/                # 页面组件
│   │   ├── HomePage.tsx
│   │   ├── TradePage.tsx
│   │   ├── MarketPage.tsx
│   │   ├── WalletPage.tsx
│   │   └── ProfilePage.tsx
│   ├── services/             # API 服务
│   │   └── api.ts            # HTTP/WebSocket 接口封装
│   ├── stores/               # 状态管理
│   │   ├── marketStore.ts
│   │   ├── orderStore.ts
│   │   ├── userStore.ts
│   │   └── walletStore.ts
│   ├── types/                # TypeScript 类型定义
│   │   ├── market.ts
│   │   ├── order.ts
│   │   ├── user.ts
│   │   └── wallet.ts
│   ├── utils/                # 工具函数
│   │   ├── binance.ts        # Binance API 封装 + Mock 生成
│   │   ├── format.ts         # 格式化工具
│   │   └── storage.ts        # 本地存储工具
│   ├── App.tsx               # 应用入口组件
│   ├── main.tsx              # 应用启动文件
│   └── index.css             # 全局样式
├── .env                      # 环境变量
├── Dockerfile                # Docker 配置
├── docker-compose.yml        # Docker Compose
├── nginx.conf                # Nginx 配置
├── package.json              # 项目依赖
├── tailwind.config.js        # Tailwind 配置
└── vite.config.ts            # Vite 配置
```

---

## 9. 关键设计决策

### 9.1 Mock 数据 Fallback

**设计原因**：后端 API 部分接口尚未完全实现，返回空数据或全 0。

**实现策略**：
1. 优先调用后端 API
2. 检测数据有效性（价格 > 0）
3. 无效时自动切换到 Mock 数据

**代码位置**：[utils/binance.ts](file:///E:/codex/smartx/src/utils/binance.ts)

### 9.2 WebSocket 重连机制

**设计原因**：网络不稳定可能导致 WebSocket 断开。

**实现策略**：
1. 连接断开后自动重连
2. 指数退避策略（最大 30 秒）
3. 最大重连次数限制（10 次）

**代码位置**：[hooks/useBinanceWS.ts](file:///E:/codex/smartx/src/hooks/useBinanceWS.ts)

### 9.3 双数据源支持

**设计原因**：确保行情数据的可用性。

**实现策略**：
1. 主要数据源：后端 WebSocket
2. 备用数据源：Binance Public API
3. K 线数据：优先 Binance，失败时使用 Mock

---

## 10. 部署说明

### 10.1 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 10.2 Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 10.3 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| VITE_API_BASE_URL | http://localhost:8080 | 后端 API 地址 |
| VITE_WS_URL | ws://localhost:8080/ws | WebSocket 地址 |

---

**文档版本**: v1.0  
**生成时间**: 2026-06-26  
**项目路径**: `e:\codex\smartx`
