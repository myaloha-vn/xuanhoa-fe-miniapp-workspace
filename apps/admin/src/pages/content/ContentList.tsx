import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Copy, Check, Pencil, Plus, Trash2, Newspaper } from "lucide-react";
import { Card, CardHeader, StatusBadge, Button, Badge } from "../../components/common/ui";
import { DataTable, type Column } from "../../components/common/DataTable";
import { FilterBar, SearchInput, Select } from "../../components/common/Filters";
import { ConfirmDialog, useToast } from "../../components/common/Overlays";
import { Allow } from "../../components/common/Guards";
import { useAuth } from "../../services/auth";
import { pushLog, useTable } from "../../services/store";
import { useScopedContents } from "../../hooks/useScoped";
import { CONTENT_TYPE_LABEL } from "../../data/mock";
import { fmtDate } from "../../utils/format";
import type { ContentItem, ContentStatus, ContentType } from "../../types";

const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: "draft", label: "Nháp" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "scheduled", label: "Đã lên lịch" },
  { value: "published", label: "Đã xuất bản" },
];

export default function ContentList({ type, title }: { type?: ContentType; title: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, can } = useAuth();
  const scoped = useScopedContents();
  const [all, setAll] = useTable("contents");
  const [users] = useTable("users");
  const [neighborhoods] = useTable("neighborhoods");
  const [params] = useSearchParams();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [hood, setHood] = useState("");
  const [author, setAuthor] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; kind: "delete" } | null>(null);
  const [statusPopup, setStatusPopup] = useState<{ id: string; status: ContentStatus } | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");

  const rows = useMemo(() => scoped.filter((c) => {
    if (type && c.type !== type) return false;
    if (!type && c.type === "banner") return false;
    if (q && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (status && c.status !== status) return false;
    if (hood && String(c.hoodId ?? "") !== hood) return false;
    if (author && c.authorId !== author) return false;
    return true;
  }), [scoped, type, q, status, hood, author]);

  const apply = (id: string, patch: Partial<ContentItem>, action: ContentItem["history"][0]["action"], label: string) => {
    setAll(all.map((c) => c.id === id
      ? { ...c, ...patch, history: [...c.history, { at: new Date().toISOString(), by: user?.fullName ?? "Cán bộ", action }] }
      : c));
    if (user) pushLog(user.id, label, all.find((c) => c.id === id)?.title ?? "", null);
    toast(`${label} thành công`);
  };

  const duplicate = (c: ContentItem) => {
    const copy: ContentItem = {
      ...c, id: `ct-${Date.now()}`, title: `${c.title} (bản sao)`, status: "draft",
      publishedAt: null, scheduledAt: null, views: 0,
      history: [{ at: new Date().toISOString(), by: user?.fullName ?? "Cán bộ", action: "created" }],
    };
    setAll([copy, ...all]);
    toast("Đã nhân bản nội dung");
  };

  const isBanner = type === "banner";

  const copyLink = (id: string, link?: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const columns: Column<ContentItem>[] = [
    { key: "image", header: "Ảnh", width: "100px", render: (r) => <img src={r.image} alt="" className="w-20 aspect-video rounded object-cover" /> },
    { key: "title", header: "Tiêu đề", mobile: "title", render: (r) => <span className="font-medium text-slate-800 line-clamp-2 max-w-[420px] inline-block">{r.title}</span> },
    { key: "author", header: "Tác giả", mobile: "meta", render: (r) => users.find((u) => u.id === r.authorId)?.fullName ?? "-" },
    ...(!isBanner ? [
      { key: "hood" as const, header: "Đơn vị", mobile: "meta" as const, render: (r: ContentItem) => (r.hoodId ? `Khu phố ${r.hoodId}` : "Toàn phường") },
      { key: "published" as const, header: "Ngày xuất bản", mobile: "meta" as const, render: (r: ContentItem) => fmtDate(r.publishedAt ?? r.scheduledAt) },
    ] : [
      { key: "link" as const, header: "Liên kết", mobile: "meta" as const, render: (r: ContentItem) => (
        <div className="flex items-center gap-1.5 max-w-[260px]">
          <span className="text-slate-600 truncate text-[12.5px]" title={r.link}>{r.link || "—"}</span>
          {r.link && (
            <button onClick={(e) => { e.stopPropagation(); copyLink(r.id, r.link); }}
              title="Copy liên kết"
              className="shrink-0 w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
              {copiedId === r.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
          )}
        </div>
      ) },
    ]),
    { key: "views", header: "Lượt xem", mobile: "meta", render: (r) => r.views },
    { key: "status", header: "Trạng thái", mobile: "badge", render: (r) => (
      <button onClick={() => setStatusPopup({ id: r.id, status: r.status })} className="hover:opacity-80 transition-opacity cursor-pointer">
        <StatusBadge status={r.status} />
      </button>
   ) },
    {
      key: "act", header: "Thao tác",
      render: (r) => (
        <div className="flex items-center gap-1">
          <button title="Chỉnh sửa" onClick={() => navigate(`/workspace/content/${r.id}/edit`)}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><Pencil size={14} /></button>
          {can("content", "create") && (
            <button title="Nhân bản" onClick={() => duplicate(r)}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><Copy size={14} /></button>
          )}
          {can("content", "delete") && (
            <button title="Xoá" onClick={() => setConfirm({ id: r.id, kind: "delete" })}
              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500"><Trash2 size={14} /></button>
          )}
        </div>
      ),
    },
  ];

  const confirmMeta: Record<string, { title: string; desc: string; label: string; tone?: "danger" }> = {
    delete: { title: "Xoá nội dung", desc: "Nội dung sẽ bị xoá khỏi hệ thống và không hiển thị trên trang người dân.", label: "Xoá", tone: "danger" },
  };

  const runConfirm = () => {
    if (!confirm) return;
    const { id, kind } = confirm;
    if (kind === "delete") {
      setAll(all.filter((c) => c.id !== id));
      toast("Đã xoá nội dung");
    }
    setConfirm(null);
  };

  const runStatusChange = () => {
    if (!statusPopup) return;
    const { id, status } = statusPopup;
    if (status === "draft") {
      // Nháp → Chờ duyệt
      apply(id, { status: "pending" }, "submitted", "Gửi duyệt");
    } else if (status === "pending") {
      // Chờ duyệt → Đã lên lịch hoặc Đã xuất bản
      if (scheduleDate) {
        apply(id, { status: "scheduled", scheduledAt: new Date(scheduleDate).toISOString() }, "scheduled", "Lên lịch xuất bản");
      } else {
        apply(id, { status: "published", publishedAt: new Date().toISOString() }, "published", "Xuất bản");
      }
    } else if (status === "published") {
      // Đã xuất bản → Gỡ xuất bản, chuyển về Nháp
      apply(id, { status: "draft", publishedAt: null }, "unpublished", "Gỡ xuất bản");
    }
    setStatusPopup(null);
    setScheduleDate("");
  };

  return (
    <>
      <Card>
        <CardHeader title={title} icon={<Newspaper size={16} className="text-violet-600" />}
          action={
            <Allow module="content" action="create">
              <Button size="sm" icon={<Plus size={14} />}
                onClick={() => navigate(`/workspace/content/create${type ? `?type=${type}` : ""}`)}>
                Tạo nội dung
              </Button>
            </Allow>
          } />
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder="Tìm theo tiêu đề..." />
          <Select value={status} onChange={setStatus} placeholder="Tất cả trạng thái" options={STATUS_OPTIONS} />
          <Select value={hood} onChange={setHood} placeholder="Tất cả đơn vị"
            options={neighborhoods.map((n) => ({ value: String(n.id), label: n.name }))} />
          <Select value={author} onChange={setAuthor} placeholder="Tất cả tác giả"
            options={users.map((u) => ({ value: u.id, label: u.fullName }))} />
        </FilterBar>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/workspace/content/${r.id}/edit`)}
          emptyTitle="Chưa có nội dung" emptyDescription="Tạo nội dung mới hoặc thay đổi bộ lọc." />
      </Card>

      <ConfirmDialog
        open={!!confirm}
        title={confirm ? confirmMeta[confirm.kind].title : ""}
        description={confirm ? confirmMeta[confirm.kind].desc : ""}
        confirmLabel={confirm ? confirmMeta[confirm.kind].label : ""}
        tone={confirm && confirmMeta[confirm.kind].tone === "danger" ? "danger" : "primary"}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />

      {/* Status change popup */}
      {statusPopup && (
        <div className="fixed inset-0 z-[90] bg-slate-900/40 flex items-center justify-center p-4" onClick={() => { setStatusPopup(null); setScheduleDate(""); }}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-5">
            <h3 className="text-[16px] font-semibold text-slate-900">
              {statusPopup.status === "draft" ? "Gửi duyệt nội dung" : statusPopup.status === "published" ? "Gỡ xuất bản" : "Duyệt nội dung"}
            </h3>
            <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">
              {statusPopup.status === "draft"
                ? "Nội dung sẽ chuyển sang trạng thái Chờ duyệt."
                : statusPopup.status === "published"
                ? "Nội dung sẽ được gỡ xuất bản và chuyển về trạng thái Nháp."
                : "Chọn ngày xuất bản hoặc xuất bản ngay."}
            </p>
            {statusPopup.status === "pending" && (
              <div className="mt-4">
                <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">Ngày xuất bản (để trống = xuất bản ngay)</label>
                <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-500" />
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setStatusPopup(null); setScheduleDate(""); }}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
                Huỷ
              </button>
              <button onClick={runStatusChange}
                className="px-3.5 py-2 rounded-lg text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700">
                {statusPopup.status === "draft" ? "Gửi duyệt" : statusPopup.status === "published" ? "Gỡ xuất bản" : scheduleDate ? "Lên lịch" : "Xuất bản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
