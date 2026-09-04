import { useEffect, useState } from "react";
import * as mock from "../data/mock";
import type {
  ContentItem, Feedback, HomeConfig, MediaItem, Neighborhood, Notification,
  OrgSettings, Survey, User, Utility, WasteSchedule, ActivityLog, Household,
} from "../types";

/**
 * Kho dữ liệu mô phỏng lưu trong localStorage.
 * Khi có backend thật, chỉ cần thay các hàm read/write bằng lời gọi API.
 */
const PREFIX = "xhs_db_";
const listeners = new Set<() => void>();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* dữ liệu hỏng -> dùng dữ liệu mẫu */ }
  return fallback;
}

function write<T>(key: string, value: T) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* bỏ qua */ }
  listeners.forEach((f) => f());
}

export interface Db {
  users: User[];
  neighborhoods: Neighborhood[];
  households: Household[];
  contents: ContentItem[];
  feedbacks: Feedback[];
  waste: WasteSchedule[];
  surveys: Survey[];
  media: MediaItem[];
  utilities: Utility[];
  logs: ActivityLog[];
  notifications: Notification[];
  homeConfig: HomeConfig;
  org: OrgSettings;
}

const DEFAULTS: Db = {
  users: mock.USERS,
  neighborhoods: mock.NEIGHBORHOODS,
  households: mock.HOUSEHOLDS,
  contents: mock.CONTENTS,
  feedbacks: mock.FEEDBACKS,
  waste: mock.WASTE,
  surveys: mock.SURVEYS,
  media: mock.MEDIA,
  utilities: mock.UTILITIES,
  logs: mock.LOGS,
  notifications: mock.NOTIFICATIONS,
  homeConfig: mock.HOME_CONFIG,
  org: mock.ORG,
};

export function getTable<K extends keyof Db>(key: K): Db[K] {
  return read(key as string, DEFAULTS[key]);
}

export function setTable<K extends keyof Db>(key: K, value: Db[K]) {
  write(key as string, value);
}

export function resetDb() {
  (Object.keys(DEFAULTS) as (keyof Db)[]).forEach((k) => localStorage.removeItem(PREFIX + k));
  listeners.forEach((f) => f());
}

/** Hook đọc/ghi một bảng dữ liệu, tự đồng bộ giữa các màn hình */
export function useTable<K extends keyof Db>(key: K): [Db[K], (v: Db[K]) => void] {
  const [value, setValue] = useState<Db[K]>(() => getTable(key));
  useEffect(() => {
    const cb = () => setValue(getTable(key));
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, [key]);
  return [value, (v: Db[K]) => setTable(key, v)];
}

/** Ghi nhật ký hoạt động */
export function pushLog(actorId: string, action: string, target: string, hoodId: number | null = null) {
  const logs = getTable("logs");
  setTable("logs", [
    { id: `lg-${Date.now()}`, at: new Date().toISOString(), actorId, action, target, hoodId },
    ...logs,
  ]);
}

export function pushNotification(n: Omit<Notification, "id" | "at" | "read">) {
  const list = getTable("notifications");
  setTable("notifications", [
    { ...n, id: `nt-${Date.now()}`, at: new Date().toISOString(), read: false },
    ...list,
  ]);
}
