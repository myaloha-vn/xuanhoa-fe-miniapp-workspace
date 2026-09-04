import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { MessageSquareWarning, Trash2, UserPlus } from "lucide-react";
import { Card, CardHeader, StatusBadge, PriorityBadge, Button, Badge } from "../../components/common/ui";
import { DataTable, type Column } from "../../components/common/DataTable";
import { FilterBar, SearchInput, Select, DateRange, Tabs } from "../../components/common/Filters";
import { useAuth } from "../../services/auth";
import { useTable } from "../../services/store";
import { useScopedFeedbacks } from "../../hooks/useScoped";
import { FEEDBACK_FIELDS } from "../../data/mock";
import { fmtDate, slaState } from "../../utils/format";
import type { Feedback } from "../../types";

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "pending_review", label: "Chờ duyệt" },
  { key: "pending", label: "Chờ xử lý" },
  { key: "processing", label: "Đang xử lý" },
  { key: "due", label: "Sắp đến hạn" },
  { key: "overdue", label: "Quá hạn" },
  { key: "resolved", label: "Đã xử lý" },
  { key: "rejected", label: "Từ chối" },
];

function matchTab(f: Feedback, tab: string) {
  const sla = slaState(f.dueAt, f.status);
  switch (tab) {
    case "pending_review": return f.status === "pending_review";
    case "pending": return f.status === "pending";
    case "processing": return f.status === "processing";
    case "due": return sla === "due_soon";
    case "overdue": return sla === "overdue";
    case "resolved": return f.status === "resolved";
    case "rejected": return f.status === "rejected";
    default: return true;
  }
}

export default function FeedbackList() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const rowsAll = useScopedFeedbacks();
  const [users] = useTable("users");
  const [neighborhoods] = useTable("neighborhoods");
  const [params, setParams] = useSearchParams();

  const tab = params.get("tab") ?? "all";
  const [q, setQ] = useState("");
  const [hood, setHood] = useState("");
  const [field, setField] = useState("");
  const [assignee, setAssignee] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(() => rowsAll.filter((f) => {
    if (!matchTab(f, tab)) return false;
    if (q && !`${f.code} ${f.summary} ${f.content}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (hood && f.hoodId !== Number(hood)) return false;
    if (field && f.field !== field) return false;
    if (assignee && f.assigneeId !== assignee) return false;
    if (from && new Date(f.createdAt) < new Date(from)) return false;
    if (to && new Date(f.createdAt) > new Date(`${to}T23:59:59`)) return false;
    return true;
  }), [rowsAll, tab, q, hood, field, assignee, from, to]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    TABS.forEach((t) => {
      c[t.key] = rowsAll.filter((f) => matchTab(f, t.key)).length;
    });
    return c;
  }, [rowsAll]);

  const columns: Column<Feedback>[] = [
    { key: "code", header: "Mã", mobile: "title", render: (r) => <span className="font-mono text-[12.5px] text-slate-600">{r.code}</span> },
    { key: "summary", header: "Nội dung", render: (r) => <span className="line-clamp-2 max-w-[320px] inline-block">{r.summary}</span> },
    ...(can("feedback", "edit")
      ? [{ key: "sender", header: "Người gửi", mobile: "meta" as const, render: (r: Feedback) => (
          <span>{r.senderName}<br /><span className="text-slate-400 text-[12px]">{r.senderPhone}</span></span>
        ) }]
      : []),
    { key: "hood", header: "Khu phố", mobile: "meta", render: (r) => `Khu phố ${r.hoodId}` },
    { key: "field", header: "Lĩnh vực", mobile: "meta", render: (r) => <Badge tone="slate">{r.field}</Badge> },
    { key: "createdAt", header: "Ngày nhận", mobile: "meta", render: (r) => fmtDate(r.createdAt) },
    {
      key: "due", header: "Hạn xử lý", mobile: "meta",
      render: (r) => {
        const s = slaState(r.dueAt, r.status);
        return <span className={s === "overdue" ? "text-red-600 font-medium" : s === "due_soon" ? "text-orange-600 font-medium" : ""}>{fmtDate(r.dueAt)}</span>;
      },
    },
    { key: "assignee", header: "Phụ trách", mobile: "meta", render: (r) => users.find((u) => u.id === r.assigneeId)?.fullName ?? "Chưa phân công" },
    { key: "priority", header: "Ưu tiên", mobile: "badge", render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: "status", header: "Trạng thái", mobile: "badge", render: (r) => <StatusBadge status={r.status} kind="feedback" /> },
    { key: "act", header: "Thao tác", render: (r) => (
      <div className="flex items-center gap-1">
        <Button size="sm" variant="secondary" onClick={() => navigate(`/workspace/feedback/${r.id}`)}>Xem</Button>
        <button
          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Phân công xử lý"
          onClick={(e) => { e.stopPropagation(); /* TODO: mở dialog phân công */ }}
        >
          <UserPlus size={16} />
        </button>
        <button
          className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Xoá"
          onClick={(e) => { e.stopPropagation(); /* TODO: xác nhận xoá */ }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    ) },
  ];

  return (
    <Card>
      <CardHeader title="Danh sách phản ánh kiến nghị" icon={<MessageSquareWarning size={16} className="text-blue-600" />} />
      <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.key] }))} active={tab}
        onChange={(k) => setParams(k === "all" ? {} : { tab: k })} />
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Tìm theo mã hoặc nội dung..." />
        <Select value={hood} onChange={setHood} placeholder="Tất cả khu phố"
          options={neighborhoods.map((n) => ({ value: String(n.id), label: n.name }))} />
        <Select value={field} onChange={setField} placeholder="Tất cả lĩnh vực"
          options={FEEDBACK_FIELDS.map((f) => ({ value: f, label: f }))} />
        <Select value={assignee} onChange={setAssignee} placeholder="Tất cả người xử lý"
          options={users.map((u) => ({ value: u.id, label: u.fullName }))} />
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </FilterBar>
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/workspace/feedback/${r.id}`)}
        emptyTitle="Không có phản ánh phù hợp"
        emptyDescription="Thay đổi bộ lọc hoặc chọn tab khác để xem thêm dữ liệu." />
    </Card>
  );
}
