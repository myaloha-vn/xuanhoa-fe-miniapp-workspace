import type { Action, Module, Role, User } from "../types";

/** Ma trận phân quyền theo module - không hard-code quyền trong giao diện */
type Matrix = Record<Role, Partial<Record<Module, Action[]>>>;

const ALL: Action[] = ["view", "create", "edit", "delete", "approve", "publish", "export"];
const VIEW: Action[] = ["view"];
const EDIT: Action[] = ["view", "create", "edit"];
const EDIT_DEL: Action[] = ["view", "create", "edit", "delete"];

export const MATRIX: Matrix = {
  SUPER_ADMIN: {
    overview: ALL, content: ALL, feedback: ALL, suggestions: ALL, neighborhoods: ALL, households: ALL,
    waste: ALL, surveys: ALL, literacy: ALL, media: ALL, utilities: ALL,
    reports: ALL, users: ALL, settings: ALL,
  },
  PHUONG_ADMIN: {
    overview: ALL, content: ALL, feedback: ALL, suggestions: VIEW, neighborhoods: ALL, households: ALL,
    waste: ALL, surveys: ALL, literacy: ALL, media: ALL, utilities: ALL,
    reports: ["view", "export"], users: ["view", "create", "edit"],
    settings: ["view", "edit"],
  },
  CONTENT_EDITOR: {
    overview: VIEW, content: EDIT_DEL, literacy: EDIT_DEL,
    media: EDIT_DEL, neighborhoods: VIEW, households: VIEW, reports: VIEW, suggestions: VIEW,
  },
  FEEDBACK_OFFICER: {
    overview: VIEW, feedback: ["view", "create", "edit", "approve", "export"],
    suggestions: VIEW, neighborhoods: VIEW, households: VIEW, reports: ["view", "export"],
  },
  NEIGHBORHOOD_LEADER: {
    overview: VIEW, content: EDIT, literacy: VIEW,
    feedback: ["view", "edit"], suggestions: VIEW, neighborhoods: ["view", "edit"], households: ["view", "create", "edit"], waste: VIEW,
    surveys: VIEW, media: EDIT,
  },
  NEIGHBORHOOD_STAFF: {
    overview: VIEW, content: ["view", "create"], feedback: VIEW, suggestions: VIEW,
    neighborhoods: VIEW, households: VIEW, waste: VIEW, media: ["view", "create"],
  },
};

export function can(user: User | null, module: Module, action: Action = "view"): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  const allowed = MATRIX[user.role]?.[module];
  if (!allowed) return false;
  if (action === "publish" && user.role === "NEIGHBORHOOD_LEADER") return user.canPublishDirectly;
  return allowed.includes(action);
}

/** Trưởng khu phố / cán bộ khu phố chỉ thấy dữ liệu khu phố mình phụ trách */
export function scopeHoodId(user: User | null): number | null {
  if (!user) return null;
  if (user.role === "NEIGHBORHOOD_LEADER" || user.role === "NEIGHBORHOOD_STAFF") return user.hoodId;
  return null;
}

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Quản trị hệ thống",
  PHUONG_ADMIN: "Quản trị phường",
  CONTENT_EDITOR: "Biên tập nội dung",
  FEEDBACK_OFFICER: "Cán bộ xử lý phản ánh",
  NEIGHBORHOOD_LEADER: "Trưởng khu phố",
  NEIGHBORHOOD_STAFF: "Cán bộ khu phố",
};
