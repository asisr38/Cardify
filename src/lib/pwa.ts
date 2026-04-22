import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

// Wire up the service worker with an update prompt. When a new build is
// deployed, the SW fetches it in the background and fires `onNeedRefresh`
// once it's waiting to activate — we surface a toast so the user can
// reload into the new version on their own terms.
export function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  const updateSW = registerSW({
    onNeedRefresh() {
      toast('Update available', {
        description: 'A new version of Cardify is ready.',
        duration: Infinity,
        action: {
          label: 'Reload',
          onClick: () => updateSW(true),
        },
      });
    },
    onOfflineReady() {
      toast.success('Ready to work offline');
    },
  });
}
