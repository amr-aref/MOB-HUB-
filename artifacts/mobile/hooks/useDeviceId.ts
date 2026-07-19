import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const DEVICE_ID_KEY = '@marketplace_device_id';

// ─── Module-level singleton ────────────────────────────────────────────────────
//
// The ID is resolved once per app process and shared by all hook instances.
// Without this, concurrent mounts of multiple components that call useDeviceId()
// would each race to read AsyncStorage — and the ephemeral fallback path would
// generate a *different* UUID for every component that mounts before the storage
// read completes, causing identity drift within a single session.
//
// Resolution flow:
//  1. Return the cached string immediately if already resolved.
//  2. If a resolution is already in flight, await the same promise (dedup).
//  3. Otherwise: read from AsyncStorage → generate+persist if missing → cache.
//  4. On full AsyncStorage failure: generate one ephemeral UUID, cache it, and
//     use it for the entire session so all components stay consistent.

let _resolved: string | null = null;
let _pending: Promise<string> | null = null;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function resolveDeviceId(): Promise<string> {
  if (_resolved !== null) return _resolved;
  if (_pending !== null) return _pending;

  _pending = (async (): Promise<string> => {
    try {
      let id = await AsyncStorage.getItem(DEVICE_ID_KEY);

      if (!id) {
        id = generateUUID();
        // Best-effort persistence. If the write fails, the ID is still valid
        // for this session; on next launch a new one will be generated.
        try {
          await AsyncStorage.setItem(DEVICE_ID_KEY, id);
        } catch {
          // Storage write failed — id survives in memory for this session
        }
      }

      _resolved = id;
      return id;
    } catch {
      // Full AsyncStorage failure (e.g. SSR/test environment stub).
      // Generate a single ephemeral UUID and cache it so all components
      // in this session share the same identity.
      const ephemeral = generateUUID();
      _resolved = ephemeral;
      return ephemeral;
    }
  })();

  return _pending;
}

/**
 * Returns a persistent device-level UUID used to identify review ownership
 * without requiring authentication. The ID is generated once and stored in
 * AsyncStorage. Returns null on the first render while the ID is being loaded.
 *
 * The resolution is deduped at the module level: concurrent hook instances
 * share one AsyncStorage read and always resolve to the same identity.
 *
 * NOTE: This is a pre-auth identity solution. Replace with a real user ID once
 * authentication is implemented.
 */
export function useDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(_resolved);

  useEffect(() => {
    if (_resolved !== null) {
      // Already resolved before this component mounted — skip async work
      setDeviceId(_resolved);
      return;
    }

    let cancelled = false;
    resolveDeviceId().then((id) => {
      if (!cancelled) setDeviceId(id);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return deviceId;
}
