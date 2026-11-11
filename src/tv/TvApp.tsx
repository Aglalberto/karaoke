import { useEffect } from 'preact/hooks';
import { Toasts } from '../components/Toasts';
import { startHostBridge } from '../lib/host-bridge';
import { bootstrapState } from '../lib/state';
import { CardMenu } from './CardMenu';
import { installHotkeys } from './hotkeys';
import { Menu } from './Menu';
import { MenuToggle } from './MenuToggle';
import { QueueBar } from './QueueBar';
import { Stage } from './Stage';
import { TvModals } from './TvModals';

export function TvApp() {
  useEffect(() => {
    bootstrapState();
    void startHostBridge();
    return installHotkeys();
  }, []);

  return (
    <div class="flex h-dvh w-full overflow-hidden bg-canvas text-neutral-100">
      <MenuToggle />
      <Menu />
      <div class="flex min-w-0 flex-1 flex-col">
        <Stage />
        <QueueBar />
      </div>
      <CardMenu />
      <TvModals />
      <Toasts class="bottom-28" />
    </div>
  );
}
