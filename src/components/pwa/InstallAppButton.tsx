import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download } from "lucide-react";
import { toast } from "sonner";

const isIos = () => typeof window !== "undefined" && /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export interface InstallAppButtonProps extends React.ComponentProps<typeof Button> {
  label?: string;
}

function useDeferredPrompt() {
  const [promptEvent, setPromptEvent] = React.useState<any>(null);
  const [installable, setInstallable] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setPromptEvent(e);
      (window as any).__deferredPrompt = e;
      (window as any).triggerPwaInstall = async () => {
        const dp = (window as any).__deferredPrompt || e;
        if (dp) {
          try {
            await dp.prompt();
            await dp.userChoice;
          } catch {}
        }
      };
      setInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstallable(false);
      setPromptEvent(null);
      (window as any).__deferredPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall as any);
    window.addEventListener("appinstalled", handleAppInstalled as any);

    // If another component (InstallPrompt) already captured it
    if ((window as any).__deferredPrompt) {
      setPromptEvent((window as any).__deferredPrompt);
      setInstallable(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall as any);
      window.removeEventListener("appinstalled", handleAppInstalled as any);
    };
  }, []);

  return { promptEvent, installable } as const;
}

const InstallAppButton: React.FC<InstallAppButtonProps> = ({ label = "Instalar app", className, ...props }) => {
  const { promptEvent, installable } = useDeferredPrompt();
  const [iosHelpOpen, setIosHelpOpen] = React.useState(false);

  const handleClick = async () => {
    if (isIos()) {
      setIosHelpOpen(true);
      return;
    }

    const dp = promptEvent || (typeof window !== "undefined" && (window as any).__deferredPrompt);
    if (dp) {
      try {
        await dp.prompt();
        await dp.userChoice;
      } catch {}
      return;
    }

    if (typeof window !== "undefined" && (window as any).triggerPwaInstall) {
      try {
        await (window as any).triggerPwaInstall();
        return;
      } catch {}
    }

    toast.info("Instalação ainda não disponível. Continue navegando e tente novamente.");
  };

  const show = true; // Sempre exibir o botão; mostra instruções se o prompt não estiver disponível

  if (!show) return null;

  return (
    <>
      <Button onClick={handleClick} className={className} {...props}>
        <Download className="h-4 w-4 mr-2" /> {label}
      </Button>

      <AlertDialog open={iosHelpOpen} onOpenChange={setIosHelpOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Instalar no iPhone/iPad</AlertDialogTitle>
            <AlertDialogDescription>
              Abra no Safari, toque no botão Compartilhar e escolha "Adicionar à Tela de Início" para instalar o HabitaFácil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const InstallAppFAB: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      <InstallAppButton size="lg" label="Instalar app" />
    </div>
  );
};

export default InstallAppButton;
