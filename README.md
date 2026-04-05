# Finance Dashboard

個人用金融看板，一頁掌握加密貨幣、美股、台股的即時行情與市場情緒；另有持倉頁可管理自己的投資組合、追蹤目標配置。

---

## 功能一覽

### 首頁（行情總覽）
- **即時報價**：加密貨幣（BTC、ETH、ADA）、美股 ETF（VOO、QQQ）、台股 ETF（0050、0056）
- **貪婪恐懼指數**：加密市場（來源：Alternative.me）與美股市場（來源：VIX 換算）
- **深色 / 淺色主題**切換
- 報價每 **60 秒**自動更新

### 持倉頁（投資組合）
- **新增 / 編輯 / 刪除**持倉部位
- **五種資產類型**：加密貨幣、美股、台股、現金、手動輸入
- **類別分組顯示**：虛擬貨幣 / 美股 / 台股 / 現金 / 其他
- **目標配置**：可對每個類別設定目標百分比，即時顯示與實際配置的差異
- **雙幣估值**：所有持倉同時顯示 USD 與 TWD（即時抓取匯率）
- **資料本地儲存**：使用 `localStorage`，關掉瀏覽器也不會遺失

---

## 技術架構

```
使用者瀏覽器
│
├── Next.js App Router（前端頁面）
│     ├── / (首頁)          → 行情 + 貪婪恐懼指數
│     └── /portfolio (持倉頁) → 投資組合管理
│
├── Next.js API Routes（後端代理，解決 CORS）
│     ├── /api/taiwan-stocks → 轉發請求到 TWSE（台灣證交所）
│     └── /api/us-stocks     → 轉發請求到 Yahoo Finance
│
└── 直接呼叫（這兩個 API 允許瀏覽器直接存取）
      ├── CoinGecko API      → 加密貨幣報價
      └── Alternative.me API → 加密市場貪婪恐懼指數

資料儲存：localStorage（純前端，無後端資料庫）
```

> **為何需要 API Routes？**
> TWSE 和 Yahoo Finance 不允許瀏覽器直接跨域呼叫（CORS 限制）。Next.js API Routes 作為中間代理，讓伺服器端幫忙抓資料再回傳給前端。

---

## 資料來源

| 資料內容 | 來源 | 呼叫方式 |
|---------|------|---------|
| 加密貨幣報價（BTC、ETH、ADA） | [CoinGecko](https://www.coingecko.com/) | 瀏覽器直接呼叫 |
| 加密市場貪婪恐懼指數 | [Alternative.me](https://alternative.me/crypto/fear-and-greed-index/) | 瀏覽器直接呼叫 |
| 美股 ETF 報價（VOO、QQQ） | Yahoo Finance | API Route 代理 |
| 美股情緒（VIX 換算） | Yahoo Finance（`^VIX`） | API Route 代理 |
| 台股 ETF 報價（0050、0056 等） | [TWSE 台灣證交所](https://mis.twse.com.tw/) | API Route 代理 |
| USD / TWD 即時匯率 | Yahoo Finance（`TWD=X`） | API Route 代理 |

> 所有資料均來自公開 API，無需申請 API Key。

---

## 美股情緒計算說明

市面上沒有直接的「美股貪婪恐懼指數」免費 API，本專案改用 **VIX 恐慌指數**換算：

```
分數 = 90 - ((VIX - 10) / 70) × 90
```

- VIX 越高 → 市場越恐慌 → 分數越低（恐懼）
- VIX 越低 → 市場越平靜 → 分數越高（貪婪）
- 分數範圍：0（極度恐懼）～ 100（極度貪婪）

---

## 專案結構

```
Finance_Dashboard/
│
├── app/                        # Next.js 頁面與 API
│   ├── page.tsx                # 首頁（行情總覽）
│   ├── layout.tsx              # 全域 Layout（Header + Theme）
│   ├── globals.css             # 全域樣式
│   └── api/
│       ├── taiwan-stocks/      # 台股代理 API
│       └── us-stocks/          # 美股代理 API
│
├── components/                 # React 元件
│   ├── layout/
│   │   ├── Header.tsx          # 頂部導覽列（含主題切換）
│   │   └── ThemeToggle.tsx     # 深色/淺色切換按鈕
│   ├── cards/
│   │   ├── AssetCard.tsx       # 單一資產卡片（通用）
│   │   ├── CryptoSection.tsx   # 加密貨幣區塊
│   │   ├── USStocksSection.tsx # 美股區塊
│   │   └── TaiwanStocksSection.tsx # 台股區塊
│   ├── fear-greed/
│   │   ├── FearGreedGauge.tsx  # SVG 半圓儀表板
│   │   ├── CryptoFearGreed.tsx # 加密市場情緒
│   │   └── StockFearGreed.tsx  # 美股市場情緒
│   └── portfolio/
│       ├── PortfolioSummary.tsx  # 圓餅圖（類別分配）
│       ├── AllocationBar.tsx     # 實際 vs 目標配置長條圖
│       ├── PositionTable.tsx     # 持倉明細表格（依類別分組）
│       └── PositionForm.tsx      # 新增/編輯持倉表單
│
├── hooks/                      # 自訂 React Hooks
│   ├── useCryptoPrices.ts      # 加密貨幣報價
│   ├── useUSStocks.ts          # 美股報價
│   ├── useTaiwanStocks.ts      # 台股報價
│   ├── useCryptoFearGreed.ts   # 加密市場情緒
│   ├── useStockFearGreed.ts    # 美股市場情緒（VIX）
│   ├── useExchangeRate.ts      # USD/TWD 匯率
│   ├── usePortfolio.ts         # 持倉 CRUD + 類別管理
│   └── usePortfolioValuation.ts # 持倉估值計算
│
└── lib/                        # 工具函式與設定
    ├── types.ts                # TypeScript 型別定義
    ├── constants.ts            # 代號清單、顏色、更新頻率
    ├── formatters.ts           # 數字格式化
    ├── portfolio.ts            # localStorage 讀寫
    └── fear-greed.ts           # VIX 換算邏輯
```

---

## 本地啟動

### 環境需求

- Node.js 18 以上
- npm 或 yarn

### 步驟

```bash
# 1. 下載專案
git clone <your-repo-url>
cd Finance_Dashboard

# 2. 安裝套件
npm install

# 3. 啟動開發伺服器
npm run dev
```

打開瀏覽器前往 [http://localhost:3000](http://localhost:3000) 即可使用。

### 其他指令

```bash
npm run build   # 建置正式版本
npm run start   # 啟動正式版本（需先 build）
npm run lint    # 檢查程式碼
```

> 無需設定任何環境變數或 API Key，clone 下來就能跑。

---

## 使用說明

### 首頁

進入後自動載入所有行情，每 60 秒更新一次，無需手動操作。點右上角的太陽/月亮圖示可切換深色/淺色主題。

### 持倉頁（`/portfolio`）

#### 新增持倉

點右上角「**新增**」按鈕，選擇資產類型：

| 類型 | 輸入 | 報價來源 |
|------|------|---------|
| 加密貨幣 | 代號（如 BTC）+ 數量 | CoinGecko 自動抓 |
| 美股 | 代號（如 VOO）+ 數量 | Yahoo Finance 自動抓 |
| 台股 | 代號（如 0050）+ 數量 | TWSE 自動抓 |
| 現金 | 名稱 + 金額 + 幣別（USD/TWD） | 不查行情，直接換算 |
| 手動輸入 | 名稱 + 金額 + 幣別，並選擇**歸類到**哪個類別 | 不查行情 |

> **手動輸入**適合：零碎股、質押中的幣、外幣存款等難以自動追蹤的資產。可手動選擇它要算在哪個類別（如把一筆質押 BTC 歸到「虛擬貨幣」類別）。

#### 設定目標配置

在持倉明細表格的每個類別標題列，有一個「目標 [ ] %」的輸入框，直接在框內輸入數字即可設定該類別的目標比例。

儲存後「配置對比」區塊會顯示實際配置與目標的差距（+表示超配、-表示低配）。

#### 編輯 / 刪除

每一筆持倉右側有鉛筆（編輯）和垃圾桶（刪除）圖示。

#### 資料儲存

所有持倉和類別設定存在瀏覽器的 `localStorage`，關掉分頁或重開瀏覽器都不會遺失。**清除瀏覽器快取**才會刪除資料。

---

## 注意事項

- 本工具**僅供個人記錄與參考**，不構成任何投資建議
- 行情報價存在延遲，不適合用於即時交易決策
- 台股在非交易時段（盤後、假日）會顯示前一交易日收盤價
- 所有資料來自第三方公開 API，可用性取決於各平台服務狀態
- 持倉資料僅存在本機瀏覽器，**換裝置或換瀏覽器需重新輸入**

---

## 技術棧

| 工具 | 用途 |
|------|------|
| [Next.js 15](https://nextjs.org/) | 框架（App Router） |
| [React 19](https://react.dev/) | UI 函式庫 |
| [TypeScript](https://www.typescriptlang.org/) | 型別安全 |
| [Tailwind CSS](https://tailwindcss.com/) | 樣式 |
| [SWR](https://swr.vercel.app/) | 資料抓取與快取 |
| [next-themes](https://github.com/pacocoursey/next-themes) | 深色/淺色主題 |
| [Lucide React](https://lucide.dev/) | 圖示 |
