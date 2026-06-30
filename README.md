# SmartX 前端 - 数字资产交易平台

SmartX 是一款现代化的数字资产交易平台前端应用，基于 React 和 TypeScript 构建，提供流畅的交易体验和丰富的功能。

## ✨ 核心特性

### 实时行情
- **实时价格更新**: 通过 WebSocket 连接实时获取市场数据
- **K线图表**: 支持多种时间周期的 K线展示
- **深度图**: 实时订单簿深度可视化
- **价格预警**: 支持设置价格提醒

### 交易功能
- **现货交易**: 支持限价单、市价单等多种订单类型
- **委托管理**: 实时查看委托订单状态
- **成交记录**: 完整的成交历史查询
- **交易对切换**: 快速切换不同交易对

### 钱包管理
- **资产概览**: 实时查看账户余额
- **充值**: 支持多链资产充值
- **提现**: 安全的资产提现流程
- **转账**: 账户间快速转账

### 用户中心
- **个人资料**: 完善的个人信息管理
- **安全设置**: 密码修改、双重认证
- **API管理**: API Key 的创建和管理
- **交易记录**: 完整的交易历史查询

### 响应式设计
- **移动端适配**: 完美适配手机和平板设备
- **深色模式**: 支持明暗主题切换
- **流畅动画**: 精心设计的交互动画
- **高性能**: 使用 Vite 构建，加载快速

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                          UI Layer                                  │
│  Pages | Components | Layout | Hooks                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        State Management                             │
│                          Zustand                                   │
│  marketStore | orderStore | userStore | walletStore                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Services                                   │
│  api.ts (REST) | useBinanceWS.ts (WebSocket)                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      External APIs                                  │
│  SmartX Backend | Binance API | Other Exchanges                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 📁 项目结构

```
smartx/
├── src/                    # 源代码目录
│   ├── components/         # 组件
│   │   ├── common/         # 通用组件
│   │   │   ├── Loading.tsx       # 加载动画
│   │   │   └── Sparkline.tsx     # 迷你折线图
│   │   └── layout/         # 布局组件
│   │       ├── Footer.tsx        # 页脚
│   │       └── Header.tsx        # 头部导航
│   ├── constants/          # 常量配置
│   │   ├── theme.ts              # 主题配置
│   │   └── tradingPairs.ts       # 交易对列表
│   ├── hooks/              # 自定义 Hooks
│   │   └── useBinanceWS.ts       # WebSocket 连接 Hook
│   ├── pages/              # 页面组件
│   │   ├── HomePage.tsx          # 首页
│   │   ├── MarketPage.tsx        # 行情页
│   │   ├── TradePage.tsx         # 交易页
│   │   ├── WalletPage.tsx        # 钱包页
│   │   ├── DepositPage.tsx       # 充值页
│   │   ├── WithdrawPage.tsx      # 提现页
│   │   ├── TransferPage.tsx      # 转账页
│   │   └── ProfilePage.tsx       # 个人中心
│   ├── services/           # API 服务
│   │   └── api.ts                # REST API 封装
│   ├── stores/             # Zustand 状态管理
│   │   ├── marketStore.ts        # 行情数据
│   │   ├── orderStore.ts         # 订单数据
│   │   ├── userStore.ts          # 用户数据
│   │   └── walletStore.ts        # 钱包数据
│   ├── types/              # TypeScript 类型定义
│   │   ├── market.ts             # 行情类型
│   │   ├── order.ts              # 订单类型
│   │   ├── user.ts               # 用户类型
│   │   └── wallet.ts             # 钱包类型
│   ├── utils/              # 工具函数
│   │   ├── binance.ts            # Binance API 工具
│   │   ├── format.ts             # 格式化工具
│   │   └── storage.ts            # 本地存储工具
│   ├── App.tsx             # 应用入口组件
│   ├── main.tsx            # 应用启动文件
│   ├── index.css           # 全局样式
│   └── vite-env.d.ts       # Vite 环境类型
├── .github/                # GitHub 配置
│   └── workflows/          # CI/CD 工作流
│       └── ci-cd.yml
├── .dockerignore           # Docker 忽略文件
├── .gitignore              # Git 忽略文件
├── API_INTEGRATION_REPORT.md  # API 集成报告
├── DESIGN.md               # 设计文档
├── Dockerfile              # Docker 镜像构建
├── docker-compose.yml      # Docker Compose 配置
├── index.html              # HTML 模板
├── nginx.conf              # Nginx 配置
├── package.json            # npm 依赖配置
├── postcss.config.js       # PostCSS 配置
├── tailwind.config.js      # Tailwind CSS 配置
├── tsconfig.json           # TypeScript 配置
├── tsconfig.node.json      # TypeScript Node 配置
└── vite.config.ts          # Vite 配置
```

## 🚀 快速开始

### 环境要求

- **Node.js**: 20+
- **npm**: 10+ 或 yarn 1.22+

### 安装依赖

```bash
# 进入项目目录
cd smartx

# 使用 npm 安装
npm install

# 或使用 yarn 安装
yarn install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 或
yarn dev
```

开发服务器默认运行在 `http://localhost:5173`

### 生产构建

```bash
# 构建生产版本
npm run build

# 或
yarn build

# 预览生产版本
npm run preview
```

### 使用 Docker 部署

```bash
# 构建并启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f smartx
```

## ⚙️ 配置说明

### 环境变量

在项目根目录创建 `.env` 文件：

```env
# API 基础地址
VITE_API_URL=http://localhost:8080

# WebSocket 地址
VITE_WS_URL=ws://localhost:8080/ws

# 是否启用模拟数据
VITE_USE_MOCK=false

# 默认交易对
VITE_DEFAULT_SYMBOL=BTC/USDT
```

### 主题配置

主题配置位于 `src/constants/theme.ts`：

```typescript
export const theme = {
  primary: '#0066FF',
  success: '#00CC66',
  warning: '#FF9900',
  danger: '#FF3366',
  dark: '#1a1a2e',
  light: '#ffffff',
};
```

## 🧪 测试

```bash
# 运行测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# ESLint 检查
npm run lint

# 修复 ESLint 错误
npm run lint:fix
```

## 📊 功能模块

### 页面导航

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 展示市场概览和热门交易对 |
| 行情 | `/market` | 完整的市场行情列表 |
| 交易 | `/trade` | 交易界面，下单和委托管理 |
| 钱包 | `/wallet` | 资产概览和充值提现 |
| 充值 | `/deposit` | 充值操作页面 |
| 提现 | `/withdraw` | 提现操作页面 |
| 转账 | `/transfer` | 账户间转账 |
| 个人中心 | `/profile` | 用户信息和设置 |

### 核心功能流程

**交易流程**：
1. 选择交易对
2. 选择订单类型（限价/市价）
3. 输入价格和数量
4. 确认下单
5. 查看委托状态
6. 订单成交或取消

**钱包流程**：
1. 查看资产余额
2. 选择充值/提现
3. 确认操作
4. 查看交易记录

## 📖 文档

- [设计文档](DESIGN.md) - 前端架构和设计细节
- [API 集成报告](API_INTEGRATION_REPORT.md) - 与后端 API 的集成说明

## 📝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE.txt](LICENSE.txt)

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](https://github.com/your-username/smartx/issues)
- 发送邮件至 support@smartx.io