// Dev-only. Imported automatically by @reticlehq/vite-plugin, so you do not need to import it.
// Self-guards on import.meta.env.DEV, so it is a no-op in a production build.
import { registerCapabilities, registerStore, install } from '@reticlehq/react';
import { reticle } from '@reticlehq/browser';
import { useAuthStore } from './store/authStore';

if (import.meta.env.DEV) {
  install();
  try {
    reticle.connect({
      url: "ws://127.0.0.1:4400/reticle",
      projectId: "default",
      token: "f642034e2eff190a20cca29602c5d6db16e5bd57e7bfcda1",
      allowNonLocalhost: true
    });
    console.log("[Reticle] Connected to ws://127.0.0.1:4400/reticle");
  } catch (e) {
    console.error("[Reticle] connect error:", e);
  }

  registerStore('auth', useAuthStore);

  registerCapabilities({
    testids: [],
    signals: [],
    stores: ['auth'],
  });
}
