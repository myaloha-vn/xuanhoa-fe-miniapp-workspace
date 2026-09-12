import { type ReactNode, useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronDown, Inbox, Loader2, Search, X, Bold, Italic, Underline, List, ListOrdered, Link2, Heading } from "lucide-react";

// ─── Thẻ nội dung ────────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, icon, action }: { title: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <h2 className="text-[15px] font-semibold text-slate-900 truncate">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ─── Badge trạng thái ────────────────────────────────────────────────────────
const TONES: Record<string, string> = {
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
};

export function Badge({ tone = "slate", children }: { tone?: keyof typeof TONES | string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONES[tone] ?? TONES.slate}`}>
      {children}
    </span>
  );
}

const CONTENT_STATUS: Record<string, { label: string; tone: string }> = {
  draft: { label: "Nháp", tone: "slate" },
  pending: { label: "Chờ duyệt", tone: "violet" },
  scheduled: { label: "Đã lên lịch", tone: "amber" },
  published: { label: "Đã xuất bản", tone: "green" },
};

const FEEDBACK_STATUS: Record<string, { label: string; tone: string }> = {
  pending_review: { label: "Chờ duyệt", tone: "violet" },
  pending: { label: "Chờ xử lý", tone: "blue" },
  processing: { label: "Đang xử lý", tone: "amber" },
  forwarded: { label: "Chuyển UBND", tone: "violet" },
  resolved: { label: "Đã xử lý", tone: "green" },
  rejected: { label: "Từ chối", tone: "red" },
};

export function StatusBadge({ status, kind = "content" }: { status: string; kind?: "content" | "feedback" }) {
  const map = kind === "feedback" ? FEEDBACK_STATUS : CONTENT_STATUS;
  const s = map[status] ?? { label: status, tone: "slate" };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export const contentStatusLabel = (s: string) => CONTENT_STATUS[s]?.label ?? s;
export const feedbackStatusLabel = (s: string) => FEEDBACK_STATUS[s]?.label ?? s;

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; tone: string }> = {
    urgent: { label: "Khẩn", tone: "red" },
    high: { label: "Ưu tiên", tone: "amber" },
    normal: { label: "Bình thường", tone: "slate" },
  };
  const p = map[priority] ?? map.normal;
  return <Badge tone={p.tone}>{p.label}</Badge>;
}

// ─── Trạng thái rỗng / tải / lỗi ─────────────────────────────────────────────
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
        <Inbox size={22} className="text-slate-400" />
      </div>
      <p className="text-[14px] font-semibold text-slate-700">{title}</p>
      {description && <p className="text-[12.5px] text-slate-500 max-w-md">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
      <AlertCircle size={16} className="shrink-0" /> {message}
    </div>
  );
}

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-[13px]">
      <Loader2 size={16} className="animate-spin" /> {label ?? "Đang tải..."}
    </div>
  );
}

// ─── Nút ─────────────────────────────────────────────────────────────────────
type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
};

export function Button({
  children, onClick, variant = "primary", size = "md", icon, disabled, type = "button", className = "",
}: BtnProps) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 border-transparent",
    danger: "bg-red-600 text-white hover:bg-red-700 border-red-600",
  };
  const sizes = { sm: "px-2.5 py-1.5 text-[12px] gap-1", md: "px-3.5 py-2 text-[13px] gap-1.5" };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg border font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}>
      {icon}{children}
    </button>
  );
}

// ─── Multi-select có search + chọn tất cả ────────────────────────────────────
export interface MultiSelectOption {
  value: string;
  label: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
}: {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((o) => selected.includes(o.value));

  function toggleAll() {
    if (allFilteredSelected) {
      // Bỏ chọn các item đang lọc
      const filteredValues = new Set(filtered.map((o) => o.value));
      onChange(selected.filter((v) => !filteredValues.has(v)));
    } else {
      // Chọn tất cả item đang lọc (merge, không trùng)
      const merged = new Set(selected);
      filtered.forEach((o) => merged.add(o.value));
      onChange(Array.from(merged));
    }
  }

  function toggleOne(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation();
    onChange([]);
  }

  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-left bg-white hover:border-slate-300 transition-colors focus:outline-none focus:border-blue-500"
      >
        <div className="flex-1 min-w-0 truncate">
          {selected.length === 0 ? (
            <span className="text-slate-400">{placeholder}</span>
          ) : selected.length <= 2 ? (
            <span className="text-slate-700">{selectedLabels.join(", ")}</span>
          ) : (
            <span className="text-slate-700">
              Đã chọn {selected.length}/{options.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <span
              onClick={clearAll}
              className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Select all row */}
          {filtered.length > 0 && (
            <div
              onClick={toggleAll}
              className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-slate-100"
            >
              <Checkbox checked={allFilteredSelected} indeterminate={!allFilteredSelected && selected.length > 0} />
              <span className="text-[13px] font-medium text-blue-600">
                {allFilteredSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </span>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-[13px] text-slate-400">
                Không tìm thấy kết quả
              </div>
            ) : (
              filtered.map((o) => (
                <div
                  key={o.value}
                  onClick={() => toggleOne(o.value)}
                  className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50"
                >
                  <Checkbox checked={selected.includes(o.value)} />
                  <span className="text-[13px] text-slate-700">{o.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Checkbox nhỏ cho MultiSelect ─────────────────────────────────────────────
function Checkbox({ checked, indeterminate = false }: { checked: boolean; indeterminate?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded border transition-colors ${
        checked || indeterminate
          ? "bg-blue-600 border-blue-600 text-white"
          : "bg-white border-slate-300"
      }`}
    >
      {checked && !indeterminate && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {indeterminate && <span className="w-2 h-0.5 bg-white rounded-full" />}
    </span>
  );
}

// ─── HTML Editor (contentEditable + toolbar) ──────────────────────────────────
export function HtmlEditor({
  value,
  onChange,
  rows = 12,
}: {
  value: string;
  onChange: (html: string) => void;
  rows?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value → contentEditable when it differs from current content
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  function exec(command: string, val?: string) {
    document.execCommand(command, false, val);
    ref.current?.focus();
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function handleInput() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function handleLink() {
    const url = window.prompt("Nhập đường dẫn:");
    if (url) exec("createLink", url);
  }

  const btn =
    "inline-flex items-center justify-center w-7 h-7 rounded text-slate-600 hover:bg-slate-200 transition-colors";

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden focus-within:border-blue-500 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-slate-100 px-2 py-1.5 bg-slate-50">
        <button type="button" className={btn} onClick={() => exec("bold")} title="In đậm">
          <Bold size={15} />
        </button>
        <button type="button" className={btn} onClick={() => exec("italic")} title="In nghiêng">
          <Italic size={15} />
        </button>
        <button type="button" className={btn} onClick={() => exec("underline")} title="Gạch chân">
          <Underline size={15} />
        </button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <button type="button" className={btn} onClick={() => exec("formatBlock", "h3")} title="Tiêu đề">
          <Heading size={15} />
        </button>
        <button type="button" className={btn} onClick={() => exec("formatBlock", "p")} title="Đoạn văn">
          <span className="text-[12px] font-medium">¶</span>
        </button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <button type="button" className={btn} onClick={() => exec("insertUnorderedList")} title="Danh sách">
          <List size={15} />
        </button>
        <button type="button" className={btn} onClick={() => exec("insertOrderedList")} title="Danh sách có thứ tự">
          <ListOrdered size={15} />
        </button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <button type="button" className={btn} onClick={handleLink} title="Chèn liên kết">
          <Link2 size={15} />
        </button>
      </div>
      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        className="px-3 py-2.5 text-[13px] leading-relaxed outline-none prose prose-sm max-w-none focus:outline-none"
        style={{ minHeight: `${rows * 24}px` }}
      />
    </div>
  );
}
