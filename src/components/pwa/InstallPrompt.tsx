import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download } from 'lucide-react';

const isIos = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
};

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // iOS standalone detection
    const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window as any).navigator.standalone;
    setIsStandalone(Boolean(standalone));

    const beforeInstallHandler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallHandler as any);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler as any);
    };
  }, []);

  if (isStandalone) return null; // already installed
  if (!visible && !isIos()) return null;

  const onInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
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
};

export default InstallPrompt;
