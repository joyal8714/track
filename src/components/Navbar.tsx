'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Calendar, History, BarChart3, Clock, Target } from 'lucide-react';
import { getTodayIST, formatISTDate } from '@/lib/date-utils';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [todayStr, setTodayStr] = useState('Today');
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setTodayStr(formatISTDate(getTodayIST()));
      setCurrentHash(typeof window !== 'undefined' ? window.location.hash : '');
    }, 0);

    const handleHash = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHash);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  const navItems = [
    { href: '/', label: 'Daily Check-in', icon: Calendar },
    { href: '/#verdict', label: 'Chapter Verdict', icon: Target },
    { href: '/history', label: 'History', icon: History },
    { href: '/monthly', label: 'Monthly Review', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/50 transition">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-zinc-100 text-sm sm:text-base flex items-center gap-2">
              Trading Discipline Tracker
              <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                NIFTY
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Private Intraday Behavior Monitor</p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive =
              item.href === '/#verdict'
                ? pathname === '/' && currentHash === '#verdict'
                : item.href === '/'
                ? pathname === '/' && currentHash !== '#verdict'
                : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden xs:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* IST Timezone Date indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>IST: {todayStr}</span>
        </div>
      </div>
    </header>
  );
}
