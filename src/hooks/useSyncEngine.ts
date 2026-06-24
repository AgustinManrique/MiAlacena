import { useEffect } from 'react';
import { startSyncEngine } from '../lib/syncEngine';

/**
 * Arranca el motor de sincronización una sola vez.
 * Usalo en el componente raíz (App.tsx), arriba de RootNavigator.
 *
 *   export default function App() {
 *     useSyncEngine();
 *     return <RootNavigator />;
 *   }
 */
export function useSyncEngine(): void {
  useEffect(() => {
    const stop = startSyncEngine();
    return stop;
  }, []);
}
