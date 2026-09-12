// ─── HOOKS DÙNG localStorage, DÙNG CHUNG NHIỀU TRANG ───────────────────────
// Mỗi hook ở đây tự đồng bộ giữa các nơi gọi (qua "listener set"): khai báo
// hộ gia đình ở trang Khu phố số sẽ lập tức cập nhật ở trang Cá nhân, v.v.

import { useEffect, useState } from "react";
import {
  SAVED_KEY, SAVED_LISTENERS, type SavedPlace, type MapPlace,
  SUGGESTION_KEY, SUGGESTION_STATUS as _SUGGESTION_STATUS, SEED_SUGGESTIONS, type Suggestion,
  HH_KEY, HH_LISTENERS, type Household,
  HOUSEHOLDS_KEY, HOUSEHOLDS_LISTENERS, SEED_HOUSEHOLDS, addressKeyOf,
  type HouseholdRecord,
} from "../data";

// ── Địa điểm đã lưu ─────────────────────────────────────────────────────────
function loadSaved(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as SavedPlace[]) : [];
  } catch { return []; }
}

export function useSavedPlaces(): {
  saved: SavedPlace[];
  isSaved: (id: string) => boolean;
  toggle: (place: MapPlace) => boolean;
  remove: (id: string) => void;
} {
  const [saved, setSaved] = useState<SavedPlace[]>(() => loadSaved());
  useEffect(() => {
    const cb = () => setSaved(loadSaved());
    SAVED_LISTENERS.add(cb);
    return () => { SAVED_LISTENERS.delete(cb); };
  }, []);

  const write = (list: SavedPlace[]) => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch { /* bỏ qua */ }
    SAVED_LISTENERS.forEach((f) => f());
  };

  return {
    saved,
    isSaved: (id) => saved.some((x) => x.id === id),
    toggle: (place) => {
      const exists = saved.some((x) => x.id === place.id);
      write(exists ? saved.filter((x) => x.id !== place.id) : [{ ...place, savedAt: new Date().toISOString() }, ...saved]);
      return !exists;
    },
    remove: (id) => write(saved.filter((x) => x.id !== id)),
  };
}

// ── Góp ý hệ thống ───────────────────────────────────────────────────────────
function loadSuggestions(): Suggestion[] {
  try {
    const raw = localStorage.getItem(SUGGESTION_KEY);
    if (raw) return JSON.parse(raw) as Suggestion[];
  } catch { /* dữ liệu hỏng */ }
  return SEED_SUGGESTIONS;
}

const SUGGESTION_LISTENERS = new Set<() => void>();

export function useSuggestions(): [Suggestion[], (list: Suggestion[]) => void] {
  const [list, setList] = useState<Suggestion[]>(() => loadSuggestions());
  useEffect(() => {
    const cb = () => setList(loadSuggestions());
    SUGGESTION_LISTENERS.add(cb);
    return () => { SUGGESTION_LISTENERS.delete(cb); };
  }, []);
  const update = (next: Suggestion[]) => {
    try { localStorage.setItem(SUGGESTION_KEY, JSON.stringify(next)); } catch { /* bỏ qua */ }
    SUGGESTION_LISTENERS.forEach((f) => f());
  };
  return [list, update];
}

// ── Khai báo hộ gia đình ─────────────────────────────────────────────────────
function loadHousehold(): Household | null {
  try {
    const raw = localStorage.getItem(HH_KEY);
    return raw ? (JSON.parse(raw) as Household) : null;
  } catch { return null; }
}
function saveHousehold(h: Household | null) {
  try {
    if (h) localStorage.setItem(HH_KEY, JSON.stringify(h));
    else localStorage.removeItem(HH_KEY);
  } catch { /* ignore */ }
}

// ── Sổ hộ gia đình của phường (registry theo địa chỉ) ────────────────────────
// Đây là phần đóng vai "backend": mỗi địa chỉ ứng với một hộ gia đình. Chủ hộ
// khai trước thì thành viên khai sau sẽ tìm thấy tên chủ hộ để chọn.
function loadHouseholds(): HouseholdRecord[] {
  try {
    const raw = localStorage.getItem(HOUSEHOLDS_KEY);
    if (raw) return JSON.parse(raw) as HouseholdRecord[];
  } catch { /* dữ liệu hỏng → dùng dữ liệu mẫu */ }
  return SEED_HOUSEHOLDS;
}

export function useHouseholdRegistry() {
  const [list, setList] = useState<HouseholdRecord[]>(() => loadHouseholds());
  useEffect(() => {
    const cb = () => setList(loadHouseholds());
    HOUSEHOLDS_LISTENERS.add(cb);
    return () => { HOUSEHOLDS_LISTENERS.delete(cb); };
  }, []);

  const write = (next: HouseholdRecord[]) => {
    try { localStorage.setItem(HOUSEHOLDS_KEY, JSON.stringify(next)); } catch { /* bỏ qua */ }
    HOUSEHOLDS_LISTENERS.forEach((f) => f());
  };

  return {
    households: list,
    /** Các hộ đã khai báo tại đúng địa chỉ này */
    findByAddress: (address: string, hoodId: number) => {
      const key = addressKeyOf(address, hoodId);
      return list.filter((h) => h.addressKey === key);
    },
    /** Các hộ cùng khu phố, địa chỉ gần giống - gợi ý khi gõ sai vài ký tự */
    findNearby: (address: string, hoodId: number) => {
      const key = addressKeyOf(address, hoodId);
      const num = key.match(/\d+[/]?\d*/)?.[0] ?? "";
      return list.filter(
        (h) => h.hoodId === hoodId && h.addressKey !== key && !!num && h.addressKey.includes(num)
      );
    },
    add: (rec: HouseholdRecord) => { write([rec, ...list]); return rec; },
    update: (id: string, patch: Partial<HouseholdRecord>) =>
      write(list.map((h) => (h.id === id ? { ...h, ...patch } : h))),
  };
}

/** Dùng chung cho mọi trang: khai báo ở đâu cũng cập nhật ngay ở nơi khác */
export function useHousehold(): [Household | null, (h: Household | null) => void] {
  const [h, setH] = useState<Household | null>(() => loadHousehold());
  useEffect(() => {
    const cb = () => setH(loadHousehold());
    HH_LISTENERS.add(cb);
    return () => { HH_LISTENERS.delete(cb); };
  }, []);
  const update = (next: Household | null) => {
    saveHousehold(next);
    HH_LISTENERS.forEach((f) => f());
  };
  return [h, update];
}
