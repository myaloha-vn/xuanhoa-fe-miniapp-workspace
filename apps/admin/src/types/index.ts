// ─── Kiểu dữ liệu dùng chung cho Workspace điều hành Xuân Hoà Số ─────────────

export type Role =
  | "SUPER_ADMIN"
  | "PHUONG_ADMIN"
  | "CONTENT_EDITOR"
  | "FEEDBACK_OFFICER"
  | "NEIGHBORHOOD_LEADER"
  | "NEIGHBORHOOD_STAFF";

export type Module =
  | "overview" | "content" | "feedback" | "suggestions" | "neighborhoods" | "households"
  | "waste" | "surveys" | "literacy" | "media" | "utilities"
  | "reports" | "users" | "settings";

export type Action = "view" | "create" | "edit" | "delete" | "approve" | "publish" | "export";

export interface User {
  id: string;
  fullName: string;
  username: string;
  role: Role;
  unit: string;
  hoodId: number | null;
  phone: string;
  email: string;
  status: "active" | "locked";
  lastLogin: string;
  canPublishDirectly: boolean;
}

export type ContentType = "news" | "announcement" | "event" | "banner" | "literacy";
export type ContentStatus =
  | "draft" | "pending" | "scheduled" | "published";

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  image: string;
  gallery: string[];
  videoUrl?: string;
  link?: string;
  hoodId: number | null;
  hoodIds?: number[] | null;
  authorId: string;
  status: ContentStatus;
  createdAt: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  startAt?: string | null;
  endAt?: string | null;
  place?: string;
  pinned: boolean;
  featured: boolean;
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  topic?: string;
  level?: "easy" | "medium";
  audience?: string;
  history: ApprovalEntry[];
}

export interface ApprovalEntry {
  at: string;
  by: string;
  action: "created" | "submitted" | "approved" | "rejected" | "published" | "hidden" | "scheduled" | "updated";
  note?: string;
}

/**
 * Chờ duyệt: phản ánh vừa gửi lên, chờ bộ phận vận hành kiểm duyệt nội dung hợp lệ.
 * Chờ xử lý: đã duyệt hợp lệ, chuyển tới đơn vị có thẩm quyền để bắt đầu xem xét.
 * Đang xử lý: đơn vị đang kiểm tra hiện trường, xác minh, thực hiện biện pháp giải quyết.
 * Đã xử lý: vấn đề đã giải quyết xong, kết quả đã công khai lên hệ thống.
 * Từ chối: không được duyệt / từ chối tiếp nhận (nội dung không rõ ràng, trùng lặp,
 * ngôn từ không phù hợp hoặc không thuộc phạm vi xử lý của hệ thống).
 * (Cảnh báo sắp đến hạn / quá hạn không phải trạng thái riêng — xem slaState() trong utils/format.ts)
 */
export type FeedbackStatus =
  | "pending_review" | "pending" | "processing" | "resolved" | "rejected";
export type Priority = "urgent" | "high" | "normal";

export interface Feedback {
  id: string;
  code: string;
  summary: string;
  content: string;
  field: string;
  hoodId: number;
  senderName: string;
  senderPhone: string;
  address: string;
  lat?: number;
  lng?: number;
  images: string[];
  createdAt: string;
  dueAt: string;
  assigneeId: string | null;
  unit: string | null;
  status: FeedbackStatus;
  priority: Priority;
  timeline: FeedbackEvent[];
  result?: string;
}

export interface FeedbackEvent {
  at: string;
  by: string;
  action: string;
  note?: string;
}

export interface Neighborhood {
  id: number;
  name: string;
  leaderId: string;
  leaderName: string;
  phone: string;
  population: number;
  households: number;
  image: string;
  intro: string;
  board: { name: string; role: string; phone: string }[];
  lastUpdate: string;
  active: boolean;
}

export interface WasteScheduleStop {
  time: string;
  location: string;
}

export interface WasteSchedule {
  id: string;
  routeName: string;
  hoodIds: number[];
  weekdays: number[];
  stops: WasteScheduleStop[];
  provider: string;
  phone: string;
  effectiveFrom: string;
  status: "active" | "paused";
}

export interface SurveyQuestion {
  id: string;
  label: string;
  type: "text" | "single" | "multiple" | "number";
  required: boolean;
  options?: string[];
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  kind: "survey" | "register_event" | "register_support" | "form";
  openAt: string;
  closeAt: string;
  hoodIds: number[] | null;
  limit: number | null;
  responses: number;
  publicResult: boolean;
  status: "pending" | "open" | "closed";
  questions: SurveyQuestion[];
}

export interface MediaItem {
  id: string;
  url: string;
  kind: "image" | "video";
  name: string;
  album: string;
  hoodId: number | null;
  event: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  usedIn: string[];
}

export interface Utility {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  link: string;
  order: number;
  onHome: boolean;
  status: "active" | "hidden";
}

export interface ActivityLog {
  id: string;
  at: string;
  actorId: string;
  action: string;
  target: string;
  hoodId: number | null;
}

export interface Notification {
  id: string;
  at: string;
  kind: "feedback" | "content" | "event" | "survey";
  title: string;
  description: string;
  link: string;
  read: boolean;
  hoodId: number | null;
}

export interface HomeConfig {
  bannerIds: string[];
  pinnedAnnouncementId: string | null;
  featuredNewsIds: string[];
  utilityIds: string[];
  hoodIds: number[];
  literacyIds: string[];
  communityNewsIds: string[];
  sections: Record<string, boolean>;
}

/**
 * Góp ý của người dân (không cần đăng nhập, gửi ẩn danh).
 * - pending (Chờ tiếp nhận): mới gửi, chưa xử lý.
 * - done (Đã xử lý): đã tiếp nhận và xử lý xong.
 */
export type SuggestionStatus = "pending" | "done";

export interface Suggestion {
  id: string;
  content: string;
  createdAt: string;
  status: SuggestionStatus;
}

export interface Household {
  id: string;
  code: string;
  headName: string;
  headPhone: string;
  headIdCard: string;
  members: number;
  address: string;
  hoodId: number;
  registeredAt: string;
  status: "active" | "moved_out" | "temp_absent";
}

export interface OrgSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  zaloOA: string;
  fanpage: string;
  website: string;
  copyright: string;
}
