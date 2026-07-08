import { create } from "zustand";

export interface ScanState {
  isScanning: boolean;
  scanned: number;
  total: number;
  start: () => void;
  update: (scanned: number, total: number) => void;
  finish: () => void;
}

/** Global scan progress, independent of which screen triggered the scan. */
export const useScanStore = create<ScanState>((set) => ({
  isScanning: false,
  scanned: 0,
  total: 0,
  start: () => set({ isScanning: true, scanned: 0, total: 0 }),
  update: (scanned, total) => set({ scanned, total }),
  finish: () => set({ isScanning: false, scanned: 0, total: 0 }),
}));
