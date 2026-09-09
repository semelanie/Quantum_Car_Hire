import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { vehicles as defaultVehicles } from '../data/vehicles';
import type { Vehicle, VehicleKey } from '../types/vehicle';

const STORAGE_KEY = 'qch_vehicles_v1';
// Small delay before writing to localStorage, so a quick burst of keystrokes
// (typing a name, dragging a price field) coalesces into one write and the
// "Saving…" indicator has time to actually be visible rather than flashing.
const AUTOSAVE_DELAY_MS = 500;

export type SaveStatus = 'idle' | 'saving' | 'saved';

function loadVehicles(): Vehicle[] {
  if (typeof window === 'undefined') return defaultVehicles;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultVehicles;
    const saved = JSON.parse(raw) as Vehicle[];
    if (!Array.isArray(saved)) return defaultVehicles;
    // Merge with defaults so newly-added fields (from a future code update)
    // still show up even for vehicles that already have saved overrides,
    // and so a vehicle only in the code (not yet saved) still appears.
    return defaultVehicles.map((def) => {
      const match = saved.find((s) => s.key === def.key);
      return match ? { ...def, ...match } : def;
    });
  } catch {
    return defaultVehicles;
  }
}

interface VehiclesContextValue {
  vehicles: Vehicle[];
  updateVehicle: (key: VehicleKey, patch: Partial<Vehicle>) => void;
  resetVehicle: (key: VehicleKey) => void;
  resetAll: () => void;
  isVehicleModified: (key: VehicleKey) => boolean;
  /** Autosave status for the admin panel's "Saving… / All changes saved" indicator. */
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
}

const VehiclesContext = createContext<VehiclesContextValue | null>(null);

export function VehiclesProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadVehicles());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Don't show a "saving" flash for the initial load — only for real edits.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    setSaveStatus('saving');
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
        setLastSavedAt(Date.now());
        setSaveStatus('saved');
      } catch {
        // Storage full or unavailable (private browsing, quota exceeded, etc).
        // Editing still works for the current session; it just won't persist.
        setSaveStatus('idle');
      }
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [vehicles]);

  const updateVehicle = useCallback((key: VehicleKey, patch: Partial<Vehicle>) => {
    setVehicles((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }, []);

  const resetVehicle = useCallback((key: VehicleKey) => {
    setVehicles((prev) => prev.map((v) => (v.key === key ? { ...(defaultVehicles.find((d) => d.key === key) ?? v) } : v)));
  }, []);

  const resetAll = useCallback(() => {
    setVehicles(defaultVehicles.map((v) => ({ ...v })));
  }, []);

  const isVehicleModified = useCallback(
    (key: VehicleKey) => {
      const current = vehicles.find((v) => v.key === key);
      const original = defaultVehicles.find((v) => v.key === key);
      if (!current || !original) return false;
      return JSON.stringify(current) !== JSON.stringify(original);
    },
    [vehicles],
  );

  const value = useMemo(
    () => ({ vehicles, updateVehicle, resetVehicle, resetAll, isVehicleModified, saveStatus, lastSavedAt }),
    [vehicles, updateVehicle, resetVehicle, resetAll, isVehicleModified, saveStatus, lastSavedAt],
  );

  return <VehiclesContext.Provider value={value}>{children}</VehiclesContext.Provider>;
}

export function useVehicles(): VehiclesContextValue {
  const ctx = useContext(VehiclesContext);
  if (!ctx) throw new Error('useVehicles must be used within a VehiclesProvider');
  return ctx;
}
