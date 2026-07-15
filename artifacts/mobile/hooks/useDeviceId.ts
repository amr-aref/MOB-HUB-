import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const DEVICE_ID_KEY = '@marketplace_device_id';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a persistent device-level UUID used to identify review ownership
 * without requiring authentication. The ID is generated once and stored in
 * AsyncStorage. Returns null on the first render while the ID is being loaded.
 *
 * NOTE: This is a development-era identity solution. Authentication replaces
 * this in a future sprint.
 */
export function useDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
          id = generateUUID();
          await AsyncStorage.setItem(DEVICE_ID_KEY, id);
        }
        setDeviceId(id);
      } catch {
        // AsyncStorage unavailable (e.g., first-render SSR stub) — generate
        // an ephemeral ID that lasts for this session only.
        setDeviceId(generateUUID());
      }
    })();
  }, []);

  return deviceId;
}
