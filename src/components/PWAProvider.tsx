'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running as standalone installed PWA
    const timer = setTimeout(() => {
      const inStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in window.navigator &&
          (window.navigator as unknown as { standalone: boolean }).standalone === true);
      setIsStandalone(inStandalone);

      // Detect iOS device (Safari doesn't fire beforeinstallprompt)
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      if (isIosDevice && !inStandalone) {
        setIsIOS(true);
      }
    }, 0);

    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Discipline Tracker PWA ServiceWorker registered:', reg.scope);
          })
          .catch((err) => {
            console.error('ServiceWorker registration error:', err);
          });
      });
    }

    // Capture beforeinstallprompt event (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  }

  // Do not render anything if already installed as app or dismissed
  if (isStandalone || dismissed) {
    return null;
  }

  return (
    <>
      {/* Android / Desktop Install Prompt Banner */}
      {isInstallable && (
        <aside
          aria-label="App Installation"
          className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-zinc-900 border border-emerald-500/50 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-100">Install as App</h3>
              <p className="text-[11px] text-zinc-400">
                Install to home screen for fast daily offline check-ins.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss install prompt"
              className="p-1 text-zinc-500 hover:text-zinc-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* iOS Safari Installation Banner */}
      {isIOS && (
        <aside
          aria-label="iOS Installation Prompt"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 bg-zinc-900 border border-zinc-700 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-zinc-300 text-[11px]">
              Install on iPhone: tap <strong className="text-zinc-100">Share</strong> then <strong className="text-zinc-100">Add to Home Screen</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss iOS install guidance"
            className="text-zinc-500 hover:text-zinc-300 px-1"
          >
            ✕
          </button>
        </aside>
      )}
    </>
  );
}
