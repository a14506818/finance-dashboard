# Finance Dashboard

個人用金融看板，一頁掌握加密貨幣、美股、台股的即時行情與市場情緒；持倉頁可管理投資組合、追蹤成本損益與目標配置。

---

## 功能一覽

### 首頁（行情總覽）

- **即時報價**：加密貨幣、美股、台股，代號可在設定頁自訂
- **雙幣別顯示**：每張卡片同時顯示 USD / TWD，依偏好幣別決定主次順序
- **貪婪恐懼指數**：加密市場（Alternative.me）與美股市場（VIX 換算）
- **深色 / 淺色主題**切換
- 報價定時自動更新，有快取機制——切換分頁再回來不需重新等待載入

### 持倉頁（投資組合）

- **倉位管理**：新增、編輯、刪除持倉；五種資產類型（加密貨幣、美股、台股、現金、手動輸入）
- **交易紀錄**：每筆持倉可記錄多筆買入 / 賣出交易，自動計算加權成本與未實現損益（%）
- **倉位內嵌交易紀錄**：在倉位明細直接點選倉位即可展開交易明細，可就地新增、編輯、刪除，不需切換頁籤
- **質押 / 利息獎勵支援**：若帳戶實際餘額多於交易紀錄推算量（例如 ADA 質押利息），可輸入實際總量，系統自動顯示「+X 獎勵」
- **類別分組**：持倉與交易紀錄依類別分組顯示，並依持有比例自動排序（現金 / 手動估值排最後）
- **目標配置**：每個類別可設定目標百分比，即時顯示與實際配置的差距
- **持倉總覽**：圓餅圖 + 總估值、總成本、總損益（USD / TWD）
- **金額遮蔽**：一鍵隱藏所有金額，方便公開場合使用

### 設定頁

- **偏好幣別**：USD 優先 或 TWD 優先，影響首頁卡片與持倉表格的主要顯示貨幣
- **漲跌顏色慣例**：綠漲紅跌（西方）或 紅漲綠跌（台灣）
- **儀表板代號**：自訂首頁要顯示哪些台股、美股、加密貨幣
- **個人資料**：暱稱、投資起始日、頭像 Emoji
- **資料匯出 / 匯入**：一鍵備份所有持倉與設定為 JSON 檔

---

## 技術架構

```
使用者瀏覽器
│
├── Next.js App Router（前端頁面）
│     ├── /            首頁：行情 + 貪婪恐懼指數
│     ├── /portfolio   持倉頁：投資組合管理
│     └── /settings    設定頁：偏好設定與資料管理
│
├── Next.js API Routes（後端代理，解決 CORS）
│     ├── /api/taiwan-stocks  → TWSE 台灣證交所
│     └── /api/us-stocks      → Yahoo Finance
│
└── 瀏覽器直接呼叫（允許跨域）
      ├── CoinGecko API       → 加密貨幣報價
      └── Alternative.me API  → 加密市場貪婪恐懼指數

資料儲存：localStorage（純前端，無後端資料庫）
```

> **為何需要 API Routes？**
> TWSE 和 Yahoo Finance 不允許瀏覽器直接跨域呼叫（CORS 限制）。Next.js API Routes 作為中間代理，讓伺服器端幫忙抓資料再回傳給前端。

---

## 資料來源

| 資料 | 來源 | 呼叫方式 |
|------|------|---------|
| 加密貨幣報價 | [CoinGecko](https://www.coingecko.com/) | 瀏覽器直接 |
| 加密市場貪婪恐懼指數 | [Alternative.me](https://alternative.me/crypto/fear-and-greed-index/) | 瀏覽器直接 |
| 美股報價 | Yahoo Finance | API Route 代理 |
| 美股情緒（VIX 換算） | Yahoo Finance（`^VIX`） | API Route 代理 |
| 台股報價（上市 TSE / 上櫃 OTC） | [TWSE 台灣證交所](https://mis.twse.com.tw/) | API Route 代理 |
| USD / TWD 即時匯率 | Yahoo Finance（`TWD=X`） | API Route 代理 |

> 所有資料均來自公開 API，**無需申請 API Key**。

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
├── app/                          # Next.js 頁面與 API Routes
│   ├── page.tsx                  # 首頁（行情總覽）
│   ├── layout.tsx                # 全域 Layout（Header + Theme）
│   ├── portfolio/page.tsx        # 持倉頁
│   ├── settings/page.tsx         # 設定頁
│   └── api/
│       ├── taiwan-stocks/        # 台股代理 API
│       └── us-stocks/            # 美股 + 匯率代理 API
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx            # 頂部導覽列
│   │   └── ThemeToggle.tsx       # 深色/淺色切換
│   ├── cards/
│   │   ├── AssetCard.tsx         # 資產卡片（雙幣別顯示）
│   │   ├── CryptoSection.tsx     # 加密貨幣區塊
│   │   ├── USStocksSection.tsx   # 美股區塊
│   │   └── TaiwanStocksSection.tsx # 台股區塊
│   ├── fear-greed/
│   │   ├── FearGreedGauge.tsx    # SVG 半圓儀表板
│   │   ├── CryptoFearGreed.tsx   # 加密市場情緒
│   │   └── StockFearGreed.tsx    # 美股市場情緒
│   └── portfolio/
│       ├── PortfolioSummary.tsx  # 圓餅圖 + 總損益
│       ├── AllocationBar.tsx     # 實際 vs 目標配置長條圖
│       ├── PositionTable.tsx     # 倉位明細表格（可展開/收合）
│       ├── PositionForm.tsx      # 新增/編輯倉位表單
│       ├── LotTable.tsx          # 購買紀錄表格（可展開/收合）
│       └── LotForm.tsx           # 新增/編輯交易紀錄表單
│
├── hooks/
│   ├── useCachedSWR.ts           # 共用 SWR + localStorage 快取基底
│   ├── useCryptoPrices.ts        # 加密貨幣報價
│   ├── useUSStocks.ts            # 美股報價
│   ├── useTaiwanStocks.ts        # 台股報價
│   ├── useExchangeRate.ts        # USD/TWD 匯率
│   ├── useCryptoFearGreed.ts     # 加密市場情緒
│   ├── useStockFearGreed.ts      # 美股市場情緒（VIX）
│   ├── usePortfolio.ts           # 倉位 CRUD + 類別管理
│   ├── usePortfolioValuation.ts  # 倉位估值與損益計算
│   ├── useSettings.ts            # 設定讀寫
│   └── useToggleSet.ts           # 展開/收合 Set 狀態管理
│
└── lib/
    ├── types.ts                  # TypeScript 型別定義
    ├── constants.ts              # 代號、顏色、更新頻率
    ├── formatters.ts             # 數字/貨幣格式化（fmtUSD, fmtTWD 等）
    ├── colors.ts                 # 漲跌顏色工具（支援台灣/西方慣例）
    ├── fetcher.ts                # 共用 SWR fetcher
    ├── portfolio.ts              # localStorage 讀寫（倉位、類別）
    ├── settings.ts               # 設定讀寫 + 預設值
    ├── priceCache.ts             # 報價快取讀寫
    └── fear-greed.ts             # VIX 換算邏輯
```

---

## 本地啟動

### 環境需求

- Node.js 18 以上
- npm

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

打開瀏覽器前往 [http://localhost:3000](http://localhost:3000)。

### 所有指令

```bash
npm run dev           # 啟動開發伺服器
npm run build         # 建置正式版本
npm run start         # 啟動正式版本（需先 build）
npm run lint          # 檢查程式碼
npm run test          # 執行測試（watch 模式）
npm run test:run      # 執行測試（單次）
npm run test:coverage # 產生測試覆蓋率報告
```

> 無需設定任何環境變數或 API Key，clone 下來即可執行。

---

## 使用說明

### 首頁

進入後自動載入行情，定時更新。右上角可切換深色/淺色主題。

### 設定頁（`/settings`）

建議先到設定頁：
- 設定首頁要追蹤的**代號**（台股、美股、加密貨幣）
- 選擇**偏好幣別**（USD 或 TWD 優先）
- 選擇**漲跌顏色**（綠漲紅跌 or 紅漲綠跌）

### 持倉頁（`/portfolio`）

#### 新增倉位

點右上角「**新增**」，選擇資產類型：

| 類型 | 代號格式 | 報價來源 |
|------|---------|---------|
| 加密貨幣 | bitcoin、ethereum … | CoinGecko |
| 美股 | VOO、AAPL … | Yahoo Finance |
| 台股 | 0050、2330 … + 選上市/上櫃 | TWSE |
| 現金 | 自訂名稱 + 金額 + 幣別 | 不查行情 |
| 手動輸入 | 自訂名稱 + 金額 + 幣別 + 歸屬類別 | 不查行情 |

> **手動輸入**適合：零碎股、質押中的幣、外幣存款等難以自動追蹤的資產。

#### 記錄交易

有兩種方式新增交易紀錄：

1. **倉位明細內直接操作**（推薦）：點選任一倉位列，下方即展開交易紀錄，點「**新增交易**」直接輸入
2. **「交易紀錄」分頁**：切換至交易紀錄 Tab，點「**新增紀錄**」或各倉位的「**+ 新增**」

輸入欄位：類型（買入 / 賣出）、日期、數量、單價、幣別。系統自動依此計算**加權平均成本**與**未實現損益**。

> **新增倉位時**（加密貨幣、美股、台股），可同時填入第一筆買入交易，一次完成。

#### 質押 / 利息獎勵

若帳戶餘額多於交易紀錄推算量（例如 ADA 質押產生 5 顆利息），可在「**編輯倉位**」輸入實際總量，系統自動計算調整數量並顯示「+5 獎勵」標記。

#### 目標配置

在倉位明細表格每個類別標題列輸入目標百分比，儲存後即時顯示差距（`+` 超配 / `-` 低配）。

#### 展開 / 收合

- 倉位明細：點類別標題列展開/收合該類別的倉位；點倉位列展開/收合其交易明細（手風琴式，同時只展開一筆）
- 交易紀錄：點倉位標題列展開/收合交易明細
- 右上角「全部收合 / 全部展開」一次控制所有列

#### 資料儲存

所有資料存在瀏覽器 `localStorage`，重開瀏覽器不會遺失。**清除瀏覽器快取**才會刪除。建議定期至設定頁「**匯出**」JSON 備份。

---

## 測試

本專案使用 **Vitest + Testing Library** 撰寫測試，覆蓋核心邏輯：

```bash
npm run test:run       # 執行全部測試
npm run test:coverage  # 查看覆蓋率報告
```

| 範圍 | 覆蓋率 |
|------|--------|
| `lib/formatters`, `colors`, `constants` | 100% |
| `lib/settings`, `lib/portfolio` | ~87% |
| `hooks/usePortfolioValuation` | ~98% |
| `components/` | ~89% |
| 整體 | ~80% |

---

## 注意事項

- 本工具**僅供個人記錄與參考**，不構成任何投資建議
- 行情報價存在延遲，不適合用於即時交易決策
- 台股在非交易時段（盤後、假日）會顯示前一交易日收盤價
- 持倉資料僅存在本機瀏覽器，**換裝置或換瀏覽器需重新輸入**（可用匯出/匯入備份）

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
| [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) | 測試 |
