import { useState } from "react";
import { ClipboardList, Plus, Trash2, BarChart3, X, Pencil } from "lucide-react";
import { Card, CardHeader, Badge, Button, MultiSelect } from "../../components/common/ui";
import { DataTable, type Column } from "../../components/common/DataTable";
import { FilterBar, SearchInput, Select } from "../../components/common/Filters";
import { ConfirmDialog, RightDrawer, useToast } from "../../components/common/Overlays";
import { Allow } from "../../components/common/Guards";
import { useTable } from "../../services/store";
import { fmtDate, toInputDate } from "../../utils/format";
import type { Survey } from "../../types";

const KIND_LABEL: Record<string, string> = {
  survey: "Khảo sát ý kiến", register_event: "Đăng ký tham gia hoạt động",
  register_support: "Đăng ký hỗ trợ", form: "Biểu mẫu cộng đồng",
};

const EMPTY: Survey = {
  id: "", title: "", description: "", kind: "survey",
  openAt: new Date().toISOString(), closeAt: new Date().toISOString(),
  hoodIds: null, limit: null, responses: 0, publicResult: false, status: "pending",
  questions: [{ id: "q1", label: "Họ và tên", type: "text", required: true }],
};

export default function Surveys() {
  const toast = useToast();
  const [surveys, setSurveys] = useTable("surveys");
  const [hoods] = useTable("neighborhoods");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Survey | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [viewingResult, setViewingResult] = useState<Survey | null>(null);

  const rows = surveys.filter((s) =>
    (!q || s.title.toLowerCase().includes(q.toLowerCase())) &&
    (!kind || s.kind === kind) && (!status || s.status === status)
  );

  const columns: Column<Survey>[] = [
    { key: "title", header: "Tên biểu mẫu", mobile: "title", render: (r) => <span className="font-medium text-slate-800">{r.title}</span> },
    { key: "kind", header: "Loại", mobile: "meta", render: (r) => <Badge tone="violet">{KIND_LABEL[r.kind]}</Badge> },
    { key: "open", header: "Thời gian mở", mobile: "meta", render: (r) => fmtDate(r.openAt) },
    { key: "close", header: "Thời gian đóng", mobile: "meta", render: (r) => fmtDate(r.closeAt) },
    { key: "responses", header: "Lượt tham gia", mobile: "meta", render: (r) => r.responses },
    { key: "area", header: "Khu vực", mobile: "meta", render: (r) => (r.hoodIds ? r.hoodIds.map((i) => `KP ${i}`).join(", ") : "Toàn phường") },
    {
      key: "status", header: "Trạng thái", mobile: "badge",
      render: (r) => <Badge tone={r.status === "open" ? "green" : r.status === "pending" ? "slate" : "amber"}>
        {r.status === "open" ? "Đang mở" : r.status === "pending" ? "Chưa mở" : "Đã đóng"}
      </Badge>,
    },
    {
      key: "act", header: "Thao tác",
      render: (r) => (
        <div className="flex gap-1">
          <div className="group relative">
            <button onClick={() => setViewingResult(r)} className="w-7 h-7 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-emerald-600">
              <BarChart3 size={13} />
            </button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-slate-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Xem kết quả</span>
          </div>
          <Allow module="surveys" action="edit">
            <div className="group relative">
              <button onClick={() => setEditing(r)} className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-blue-600">
                <Pencil size={13} />
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-slate-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Sửa</span>
            </div>
          </Allow>
          <Allow module="surveys" action="delete">
            <div className="group relative">
              <button onClick={() => setConfirmDelete(r.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500">
                <Trash2 size={13} />
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-slate-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Xoá</span>
            </div>
          </Allow>
        </div>
      ),
    },
  ];

  const save = () => {
    if (!editing) return;
    if (!editing.title.trim()) { toast("Vui lòng nhập tên biểu mẫu", "error"); return; }
    setSurveys(editing.id ? surveys.map((s) => (s.id === editing.id ? editing : s)) : [{ ...editing, id: `sv-${Date.now()}` }, ...surveys]);
    setEditing(null);
    toast("Đã lưu biểu mẫu");
  };

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-500";
  const label = "block text-[12.5px] font-medium text-slate-700 mb-1.5";

  return (
    <>
      <Card>
        <CardHeader title="Khảo sát - đăng ký" icon={<ClipboardList size={16} className="text-teal-600" />}
          action={
            <Allow module="surveys" action="create">
              <Button size="sm" icon={<Plus size={14} />} onClick={() => setEditing({ ...EMPTY })}>Tạo biểu mẫu</Button>
            </Allow>
          } />
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder="Tìm biểu mẫu..." />
          <Select value={kind} onChange={setKind} placeholder="Tất cả loại"
            options={Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label }))} />
          <Select value={status} onChange={setStatus} placeholder="Tất cả trạng thái"
            options={[{ value: "pending", label: "Chưa mở" }, { value: "open", label: "Đang mở" }, { value: "closed", label: "Đã đóng" }]} />
        </FilterBar>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} emptyTitle="Chưa có biểu mẫu" />
      </Card>

      <RightDrawer open={!!editing} title={editing?.id ? "Cập nhật biểu mẫu" : "Tạo biểu mẫu"} onClose={() => setEditing(null)}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Huỷ</Button><Button onClick={save}>Lưu biểu mẫu</Button></>}>
        {editing && (
          <div className="space-y-4">
            <div>
              <label className={label}>Tiêu đề <span className="text-red-500">*</span></label>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={field} />
            </div>
            <div>
              <label className={label}>Mô tả</label>
              <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className={`${field} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Loại</label>
                <select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value as Survey["kind"] })} className={field}>
                  {Object.entries(KIND_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Giới hạn số người</label>
                <input type="number" value={editing.limit ?? ""} onChange={(e) => setEditing({ ...editing, limit: e.target.value ? Number(e.target.value) : null })} className={field} />
              </div>
              <div>
                <label className={label}>Thời gian mở</label>
                <input type="date" value={toInputDate(editing.openAt)} onChange={(e) => setEditing({ ...editing, openAt: new Date(e.target.value).toISOString() })} className={field} />
              </div>
              <div>
                <label className={label}>Thời gian đóng</label>
                <input type="date" value={toInputDate(editing.closeAt)} onChange={(e) => setEditing({ ...editing, closeAt: new Date(e.target.value).toISOString() })} className={field} />
              </div>
            </div>
            <div>
              <label className={label}>Khu vực áp dụng</label>
              <MultiSelect
                options={hoods.map((h) => ({ value: String(h.id), label: h.name }))}
                selected={(editing.hoodIds ?? []).map(String)}
                onChange={(vals) => {
                  const nums = vals.map(Number);
                  setEditing({ ...editing, hoodIds: nums.length ? nums : null });
                }}
                placeholder="Chọn khu phố (để trống = toàn phường)"
                searchPlaceholder="Tìm khu phố..."
              />
              <p className="text-[11.5px] text-slate-400 mt-1">Không chọn khu phố nào nghĩa là áp dụng toàn phường.</p>
            </div>
            <label className="flex items-center gap-2 text-[13px] text-slate-700">
              <input type="checkbox" checked={editing.publicResult} onChange={(e) => setEditing({ ...editing, publicResult: e.target.checked })} className="w-4 h-4" />
              Công khai kết quả cho người dân
            </label>

            <div>
              <p className={label}>Câu hỏi</p>
              <div className="space-y-2">
                {editing.questions.map((qq, i) => (
                  <div key={qq.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
                    <input value={qq.label}
                      onChange={(e) => setEditing({ ...editing, questions: editing.questions.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })}
                      className={field} placeholder="Nội dung câu hỏi" />
                    <div className="flex items-center gap-2">
                      <select value={qq.type}
                        onChange={(e) => setEditing({ ...editing, questions: editing.questions.map((x, j) => j === i ? { ...x, type: e.target.value as typeof x.type } : x) })}
                        className="h-9 rounded-lg border border-slate-200 px-2 text-[12.5px]">
                        <option value="text">Trả lời tự do</option>
                        <option value="single">Chọn một</option>
                        <option value="multiple">Chọn nhiều</option>
                        <option value="number">Số</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
                        <input type="checkbox" checked={qq.required}
                          onChange={(e) => setEditing({ ...editing, questions: editing.questions.map((x, j) => j === i ? { ...x, required: e.target.checked } : x) })} />
                        Bắt buộc
                      </label>
                      <button onClick={() => setEditing({ ...editing, questions: editing.questions.filter((_, j) => j !== i) })}
                        className="ml-auto text-[12px] text-red-500 hover:underline">Xoá</button>
                    </div>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="secondary" className="mt-2"
                disabled={editing.questions.length >= 10}
                onClick={() => setEditing({ ...editing, questions: [...editing.questions, { id: `q${Date.now()}`, label: "", type: "text", required: false }] })}>
                Thêm câu hỏi
              </Button>
              {editing.questions.length >= 10 && (
                <p className="text-[11.5px] text-amber-500 mt-1">Đạt giới hạn tối đa 10 câu hỏi.</p>
              )}
            </div>
          </div>
        )}
      </RightDrawer>

      <ConfirmDialog open={!!confirmDelete} title="Xoá biểu mẫu" description="Biểu mẫu và dữ liệu phản hồi sẽ bị xoá."
        confirmLabel="Xoá" tone="danger" onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { setSurveys(surveys.filter((s) => s.id !== confirmDelete)); setConfirmDelete(null); toast("Đã xoá biểu mẫu"); }} />

      {/* Modal xem kết quả khảo sát */}
      {viewingResult && (
        <div className="fixed inset-0 z-[90] bg-slate-900/40 flex items-center justify-center p-4" onClick={() => setViewingResult(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-600" />
                <h3 className="text-[15px] font-semibold text-slate-900">Kết quả khảo sát</h3>
              </div>
              <button onClick={() => setViewingResult(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-[14px] font-medium text-slate-800 mb-1">{viewingResult.title}</p>
              <p className="text-[12.5px] text-slate-500 mb-4">Tổng số lượt tham gia: <span className="font-semibold text-slate-700">{viewingResult.responses}</span></p>

              <div className="space-y-5">
                {viewingResult.questions.map((question, idx) => {
                  // Generate mock statistics based on question type
                  const mockStats = generateMockStats(question, viewingResult.responses);
                  return (
                    <div key={question.id} className="rounded-lg border border-slate-200 p-4">
                      <p className="text-[13px] font-medium text-slate-800 mb-3">
                        <span className="text-slate-400 mr-1">Câu {idx + 1}.</span> {question.label}
                      </p>
                      {question.type === "text" || question.type === "number" ? (
                        <div className="text-[12.5px] text-slate-600">
                          <span className="text-slate-400">Loại:</span> {question.type === "text" ? "Trả lời tự do" : "Nhập số"}
                          <span className="ml-3 text-slate-400">Số câu trả lời:</span> <span className="font-medium">{viewingResult.responses}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {mockStats.map((stat, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-[12.5px] text-slate-700 w-32 truncate" title={stat.label}>{stat.label}</span>
                              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${stat.percent}%` }}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-slate-700">
                                  {stat.count} người ({stat.percent}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end">
              <Button variant="secondary" onClick={() => setViewingResult(null)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper function to generate mock statistics
function generateMockStats(question: { type: string; options?: string[] }, totalResponses: number) {
  const defaultOptions = question.options?.length
    ? question.options
    : question.type === "single"
      ? ["Rất hài lòng", "Hài lòng", "Bình thường", "Chưa hài lòng"]
      : ["Có", "Không", "Chưa chắc"];

  // Generate random but consistent distribution
  const counts: number[] = [];
  let remaining = totalResponses;
  for (let i = 0; i < defaultOptions.length - 1; i++) {
    const max = remaining - (defaultOptions.length - i - 1);
    const count = Math.max(0, Math.floor(Math.random() * max * 0.6));
    counts.push(count);
    remaining -= count;
  }
  counts.push(remaining);

  return defaultOptions.map((label, i) => ({
    label,
    count: counts[i],
    percent: totalResponses > 0 ? Math.round((counts[i] / totalResponses) * 100) : 0,
  }));
}
