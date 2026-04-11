import { Toaster } from 'sonner';
import { AppRouter } from './router/AppRouter';
import { useSocketInit } from './store/socket.store';
import { TooltipProvider } from '@/components/ui/Tooltip';

export default function App() {
  useSocketInit();
  return (
    <TooltipProvider delayDuration={300}>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  );
}
