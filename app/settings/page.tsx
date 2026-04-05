'use client';

import { useRef, useState, useEffect, KeyboardEvent } from 'react';
import { Download, Upload, X, Plus, Sun, Moon, Trash2, Pencil, ExternalLink } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSettings } from '@/hooks/useSettings';
import { usePortfolio } from '@/hooks/usePortfolio';
import { exportToJSON, importFromJSON, clearAllData } from '@/lib/portfolio';
import { saveSettings, DEFAULT_SETTINGS } from '@/lib/settings';
import { AVATAR_EMOJIS, AVATAR_COLORS } from '@/lib/constants';
import type { AppSettings } from '@/lib/types';

// ── Tag input for symbol lists ──────────────────────────────────────────────

function TagInput({
  label,
  hint,
  tags,
  normalize = (s) => s,
  onChange,
}: {
  label: string;
  hint?: string;
  tags: string[];
  normalize?: (s: string) => string;
  onChange: (next: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = normalize(input.trim());
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      {hint && <p className="text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
      <div className="flex flex-wrap gap-1.5 p-2.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 min-h-[42px]">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-mono"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="text-zinc-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="輸入後按 Enter"
          className="flex-1 min-w-[120px] text-xs bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
        />
      </div>
      <button
        type="button"
        onClick={add}
        disabled={!input.trim()}
        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-3 h-3" />
        新增
      </button>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { positions, categories, importData } = usePortfolio();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const updateProfile = (patch: Partial<AppSettings['profile']>) => {
    updateSettings({ profile: { ...settings.profile, ...patch } });
  };

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    const json = exportToJSON(positions, categories, settings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import ──────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = importFromJSON(text);

    if (!result) {
      setImportError('格式不正確，請確認檔案內容');
      e.target.value = '';
      return;
    }

    const confirmed = window.confirm(
      `匯入後將覆蓋現有資料（${result.positions.length} 個倉位）。確定繼續？`
    );
    if (confirmed) {
      importData(result.positions, result.categories, result.settings);
      if (result.settings) {
        // Sync local settings state immediately
        saveSettings(result.settings);
        updateSettings(result.settings);
      }
      setImportSuccess(true);
    }
    e.target.value = '';
  };

  // ── Clear all data ───────────────────────────────────────────────────────
  const handleClearData = () => {
    clearAllData();
    updateSettings(DEFAULT_SETTINGS);
    importData([], []);        // reset positions + categories in memory
    setClearConfirm(false);
  };

  // ── Dashboard symbol helpers ─────────────────────────────────────────────
  const updateDashboardSymbols = (
    key: keyof AppSettings['dashboardSymbols'],
    next: string[]
  ) => {
    updateSettings({
      dashboardSymbols: { ...settings.dashboardSymbols, [key]: next },
    });
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">設定</h1>

      {/* 0. 個人資料 */}
      <Section title="個人資料">
        <div className="flex items-start gap-5">
          {/* Avatar circle + picker toggle */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowPicker((p) => !p)}
              className="relative group w-16 h-16 rounded-full flex items-center justify-center text-3xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform hover:scale-105"
              style={{ backgroundColor: settings.profile.avatarColor }}
              title="點擊更換頭像"
            >
              {settings.profile.avatarEmoji}
              <span className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Pencil className="w-4 h-4 text-white" />
              </span>
            </button>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">點擊更換</span>
          </div>

          {/* Profile fields */}
          <div className="flex-1 space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">暱稱</label>
              <input
                type="text"
                value={settings.profile.nickname}
                onChange={(e) => updateProfile({ nickname: e.target.value })}
                placeholder="你的名字"
                maxLength={30}
                className="mt-1 w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">一句話介紹</label>
              <input
                type="text"
                value={settings.profile.bio}
                onChange={(e) => updateProfile({ bio: e.target.value })}
                placeholder="長期投資 · 定期定額"
                maxLength={60}
                className="mt-1 w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">投資起始日期</label>
              <input
                type="date"
                value={settings.profile.investStartDate}
                onChange={(e) => updateProfile({ investStartDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Emoji + color picker (inline, toggle) */}
        {showPicker && (
          <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {/* Emoji grid */}
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">選擇頭像</p>
              <div className="grid grid-cols-8 gap-1.5">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => updateProfile({ avatarEmoji: emoji })}
                    className={`w-9 h-9 text-xl rounded-lg flex items-center justify-center transition-all hover:scale-110 ${
                      settings.profile.avatarEmoji === emoji
                        ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50 dark:bg-blue-950'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color row */}
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">背景顏色</p>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateProfile({ avatarColor: color })}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                      settings.profile.avatarColor === color
                        ? 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-zinc-300 scale-110'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* 1. 資料備份 */}
      <Section title="資料備份">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          匯出 JSON 包含所有倉位、交易紀錄、類別配置與設定值，可用於備份或遷移。
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            匯出 JSON
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
          >
            <Upload className="w-4 h-4" />
            匯入 JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </div>
        {importError && <p className="text-xs text-red-500">{importError}</p>}
        {importSuccess && <p className="text-xs text-green-500">匯入成功！</p>}
      </Section>

      {/* 2. 顯示設定 */}
      <Section title="顯示設定">
        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">外觀主題</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">淺色 / 深色模式</p>
          </div>
          <div className="flex gap-2">
            {([
              { value: 'light', icon: <Sun className="w-4 h-4" />, label: '淺色' },
              { value: 'dark',  icon: <Moon className="w-4 h-4" />, label: '深色' },
            ] as const).map(({ value, icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border font-medium transition-colors ${
                  mounted && theme === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">主要顯示幣別</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">持倉成本與損益的優先顯示幣別</p>
          </div>
          <div className="flex gap-2">
            {(['USD', 'TWD'] as const).map((c) => (
              <button
                key={c}
                onClick={() => updateSettings({ preferredCurrency: c })}
                className={`px-4 py-2 text-sm rounded-md border font-medium transition-colors ${
                  settings.preferredCurrency === c
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Red/Green convention */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">漲跌顏色慣例</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">影響損益與股價漲跌的顯示顏色</p>
          </div>
          <div className="flex gap-2">
            {([
              { value: 'western', label: '綠漲紅跌', up: 'text-green-500', down: 'text-red-500' },
              { value: 'taiwan',  label: '紅漲綠跌', up: 'text-red-500',   down: 'text-green-500' },
            ] as const).map(({ value, label, up, down }) => (
              <button
                key={value}
                onClick={() => updateSettings({ redGreenConvention: value })}
                className={`px-3 py-2 text-sm rounded-md border font-medium transition-colors flex items-center gap-1.5 ${
                  settings.redGreenConvention === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <span className={up}>▲</span>
                <span>{label}</span>
                <span className={down}>▼</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* 3. Dashboard 追蹤標的 */}
      <Section title="Dashboard 追蹤標的">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          設定首頁顯示的標的，變更後重新整理首頁即可生效。
        </p>

        <TagInput
          label="台股"
          hint="輸入股票代號，例如：0050、2330"
          tags={settings.dashboardSymbols.taiwan}
          normalize={(s) => s.toUpperCase()}
          onChange={(next) => updateDashboardSymbols('taiwan', next)}
        />
        <a href="https://tw.stock.yahoo.com/" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors">
          查詢台股代號 <ExternalLink className="w-3 h-3" />
        </a>

        <TagInput
          label="美股"
          hint="輸入股票代號，例如：VOO、QQQ"
          tags={settings.dashboardSymbols.us}
          normalize={(s) => s.toUpperCase()}
          onChange={(next) => updateDashboardSymbols('us', next)}
        />
        <a href="https://finance.yahoo.com/" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors">
          查詢美股代號 <ExternalLink className="w-3 h-3" />
        </a>

        <TagInput
          label="加密貨幣"
          hint="輸入 CoinGecko ID（小寫），例如：bitcoin、ethereum"
          tags={settings.dashboardSymbols.crypto}
          normalize={(s) => s.toLowerCase()}
          onChange={(next) => updateDashboardSymbols('crypto', next)}
        />
        <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors">
          查詢 CoinGecko ID <ExternalLink className="w-3 h-3" />
        </a>
      </Section>

      {/* 4. 危險區 */}
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-900">
        <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/50">
          <h2 className="text-sm font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider">
            危險區
          </h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">清空所有資料</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                刪除所有倉位、交易紀錄、類別配置與設定，此操作無法復原
              </p>
            </div>
            {clearConfirm ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-red-500">確定要清空嗎？</span>
                <button
                  onClick={handleClearData}
                  className="px-3 py-1.5 text-xs rounded-md bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                >
                  確認清空
                </button>
                <button
                  onClick={() => setClearConfirm(false)}
                  className="px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                清空資料
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. 關於 */}
      <Section title="關於">
        <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="flex justify-between">
            <span>版本</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">v1.1.0</span>
          </div>
          <div className="flex justify-between">
            <span>資料儲存位置</span>
            <span className="text-zinc-700 dark:text-zinc-300">本機瀏覽器（localStorage）</span>
          </div>
          <div className="flex justify-between">
            <span>資料來源</span>
            <span className="text-zinc-700 dark:text-zinc-300">TWSE · Yahoo Finance · CoinGecko</span>
          </div>
          <p className="pt-2 text-xs text-zinc-400 dark:text-zinc-600 border-t border-zinc-100 dark:border-zinc-800">
            所有資料僅存於您的裝置，不會上傳至任何伺服器。價格資訊僅供參考，不構成投資建議。
          </p>
        </div>
      </Section>
    </main>
  );
}
