'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Settings, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const NAV_ITEMS = [
  { href: '/', label: '首頁' },
  { href: '/portfolio', label: '持倉' },
];

export function Header() {
  const pathname = usePathname();
  const { settings, updateSettings } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const profile = mounted ? settings.profile : null;
  const toggleHide = () => updateSettings({ hideAmounts: !settings.hideAmounts });

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950/80 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Finance Dashboard
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: hide-amounts toggle + avatar/settings link */}
        <div className="flex items-center gap-1">
          {mounted && (
            <button
              onClick={toggleHide}
              title={settings.hideAmounts ? '顯示金額' : '隱藏金額'}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {settings.hideAmounts
                ? <EyeOff className="w-4 h-4" />
                : <Eye    className="w-4 h-4" />}
            </button>
          )}

          <Link
            href="/settings"
            title="設定"
            className={`rounded-full transition-opacity hover:opacity-80 ${
              pathname === '/settings' ? 'ring-2 ring-blue-500 ring-offset-1' : ''
            }`}
          >
            {profile?.avatarEmoji ? (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none"
                style={{ backgroundColor: profile.avatarColor }}
              >
                {profile.avatarEmoji}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                <Settings className="w-4 h-4" />
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
