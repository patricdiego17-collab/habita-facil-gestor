import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const isIos = () => typeof window !== 'undefined' && /iphone|ipad|ipod/i.test(window.navigator.userAgent);

function InstallPrompt() {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [visible, setVisible] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window as any).navigator.standalone;
    setIsStandalone(Boolean(standalone));

    const beforeInstallHandler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__deferredPrompt = e;
      (window as any).triggerPwaInstall = async () => {
        setVisible(true);
        if ((window as any).__deferredPrompt) {
          (window as any).__deferredPrompt.prompt();
        }
      };
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallHandler as any);
    window.addEventListener('appinstalled', () => {
      setVisible(false);
      setDeferredPrompt(null);
      (window as any).__deferredPrompt = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler as any);
    };
  }, []);

  if (location.pathname === '/auth') return null;
  if (isStandalone) return null; // already installed
  if (!visible && !isIos()) return null;

  const onInstallClick = async () => {
    const dp = deferredPrompt || (window as any).__deferredPrompt;
    if (!dp) return;
    try {
      await dp.prompt();
      await dp.userChoice;
    } catch {}
    setVisible(false);
    setDeferredPrompt(null);
    (window as any).__deferredPrompt = null;
  };

  return (
    <div className="fixed bottom-4 inset-x-0 px-4 z-[60]">
      <Card className="mx-auto max-w-xl p-3 shadow-lg bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-medium">Instale o HabitaFácil</p>
            {isIos() ? (
              <p className="text-sm text-muted-foreground mt-1">
                No Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início" para instalar.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Instale o aplicativo para uma experiência mais rápida e offline.
              </p>
            )}
          </div>

          {!isIos() && (
            <Button size="sm" onClick={onInstallClick} className="shrink-0">
              <Download className="h-4 w-4 mr-2" /> Instalar
            </Button>
          )}

          <Button size="icon" variant="ghost" onClick={() => setVisible(false)} aria-label="Fechar" className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default InstallPrompt;
