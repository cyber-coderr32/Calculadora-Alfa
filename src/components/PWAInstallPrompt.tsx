import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const handleInstalled = () => {
      setInstallEvent(null);
      setVisible(false);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setVisible(false);
    setInstallEvent(null);
  };

  if (!visible || !installEvent) return null;

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-[10000] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-indigo-200 bg-white p-3.5 shadow-xl shadow-indigo-950/15 dark:border-indigo-900 dark:bg-slate-900" role="status">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
        <Download className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900 dark:text-white">Instalar Alfa</p>
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Use a calculadora como um aplicativo.</p>
      </div>
      <button type="button" onClick={install} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700" aria-label="Instalar aplicativo">Instalar</button>
      <button type="button" onClick={() => setVisible(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" aria-label="Fechar aviso de instalação"><X className="h-4 w-4" aria-hidden="true" /></button>
    </aside>
  );
}

export function isStandalonePWA() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}
