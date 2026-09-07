import { useMemo, useState } from "react";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, Button } from "../../components/common/ui";
import { DataTable, type Column } from "../../components/common/DataTable";
import { FilterBar, SearchInput, DateRange } from "../../components/common/Filters";
import { RightDrawer, ConfirmDialog, useToast } from "../../components/common/Overlays";
import { SUGGESTIONS } from "../../data/mock";
import { fmtDate } from "../../utils/format";
import type { Suggestion, SuggestionStatus } from "../../types";

const STATUS_LABEL: Record<SuggestionStatus, string> = {
  pending: "Chờ tiếp nhận",
  done: "Đã xử lý",
};
const STATUS_STYLE: Record<SuggestionStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function SuggestionsList() {
  const toast = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>(SUGGESTIONS);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editing, setEditing] = useState<Suggestion | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Suggestion | null>(null);

  const rows = useMemo(() => suggestions.filter((s) => {
    if (q && !s.content.toLowerCase().includes(q.toLowerCase())) return false;
    if (from && new Date(s.createdAt) < new Date(from)) return false;
    if (to && new Date(s.createdAt) > new Date(`${to}T23:59:59`)) return false;
    return true;
  }), [suggestions, q, from, to]);

  const columns: Column<Suggestion>[] = [
    {
      key: "content",
      header: "Nội dung góp ý",
      mobile: "title",
      render: (r) => <span className="line-clamp-2 max-w-[500px] inline-block">{r.content}</span>,
    },
    {
      key: "createdAt",
      header: "Ngày gửi",
      mobile: "meta",
      render: (r) => fmtDate(r.createdAt),
    },
    {
      key: "status",
      header: "Tình trạng",
      render: (r) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[r.status]}`}>
          {STATUS_LABEL[r.status]}
        </span>
      ),
    },
    {
      key: "act",
      header: "Thao tác",
      render: (r) => (
        <div className="flex gap-1">
          <div className="group relative">
            <button onClick={() => setEditing(r)} className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-blue-600">
              <Pencil size={13} />
            </button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-slate-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Sửa</span>
          </div>
          <div className="group relative">
            <button onClick={() => setConfirmDelete(r)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500">
              <Trash2 size={13} />
            </button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-slate-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Xoá</span>
          </div>
        </div>
      ),
    },
  ];

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-500";
  const label = "block text-[12.5px] font-medium text-slate-700 mb-1.5";

  return (
    <>
      <Card>
        <CardHeader title="Danh sách góp ý của người dân" icon={<MessageCircle size={16} className="text-green-600" />} />
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder="Tìm theo nội dung..." />
          <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          emptyTitle="Không có góp ý nào"
          emptyDescription="Thay đổi bộ lọc để xem thêm dữ liệu."
        />
      </Card>

      {/* Drawer chỉnh sửa góp ý */}
      <RightDrawer open={!!editing} title="Chỉnh sửa góp ý" onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Huỷ</Button>
            <Button onClick={() => {
              if (!editing) return;
              if (!editing.content.trim()) { toast("Vui lòng nhập nội dung góp ý", "error"); return; }
              setSuggestions(suggestions.map((s) => (s.id === editing.id ? editing : s)));
              setEditing(null);
              toast("Đã cập nhật góp ý");
            }}>Lưu</Button>
          </>
        }>
        {editing && (
          <div className="space-y-4">
            <div>
              <label className={label}>Nội dung góp ý <span className="text-red-500">*</span></label>
              <textarea
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                rows={5}
                className={`${field} resize-none`}
              />
            </div>
            <div>
              <label className={label}>Tình trạng</label>
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as SuggestionStatus })}
                className={field}
              >
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </RightDrawer>

      {/* Confirm xoá góp ý */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Xoá góp ý"
        description="Bạn có chắc muốn xoá góp ý này? Thao tác này không thể hoàn tác."
        confirmLabel="Xoá"
        tone="danger"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          setSuggestions(suggestions.filter((s) => s.id !== confirmDelete!.id));
          setConfirmDelete(null);
          toast("Đã xoá góp ý");
        }}
      />
    </>
  );
}
