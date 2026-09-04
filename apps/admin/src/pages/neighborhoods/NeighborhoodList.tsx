import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, Eye, Pencil, Save, X, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, Badge, Button } from "../../components/common/ui";
import { DataTable, type Column } from "../../components/common/DataTable";
import { FilterBar, SearchInput, Select } from "../../components/common/Filters";
import { useToast } from "../../components/common/Overlays";
import { useTable } from "../../services/store";
import { useScopedNeighborhoods } from "../../hooks/useScoped";
import { fmtDateTime, daysLeft } from "../../utils/format";
import type { Neighborhood } from "../../types";

export default function NeighborhoodList() {
  const navigate = useNavigate();
  const toast = useToast();
  const hoods = useScopedNeighborhoods();
  const [feedbacks] = useTable("feedbacks");
  const [contents] = useTable("contents");
  const [waste] = useTable("waste");
  const [neighborhoods, setNeighborhoods] = useTable("neighborhoods");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [editingHood, setEditingHood] = useState<Neighborhood | null>(null);

  const rows = hoods.filter((h) =>
    (!q || `${h.name} ${h.leaderName}`.toLowerCase().includes(q.toLowerCase())) &&
    (!status || (status === "active" ? h.active : !h.active))
  );

  const handleSaveEdit = (updated: Neighborhood) => {
    setNeighborhoods(neighborhoods.map((h) => (h.id === updated.id ? { ...updated, lastUpdate: new Date().toISOString() } : h)));
    setEditingHood(null);
    toast("Đã lưu thông tin khu phố");
  };

  const columns: Column<Neighborhood>[] = [
    { key: "name", header: "Khu phố", mobile: "title", render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: "leader", header: "Ban điều hành", mobile: "meta", render: (r) => r.leaderName },
    { key: "phone", header: "Liên hệ", mobile: "meta", render: (r) => r.phone },
    {
      key: "news", header: "Tin đang hiển thị", mobile: "meta",
      render: (r) => contents.filter((c) => c.hoodId === r.id && c.status === "published").length,
    },
    {
      key: "open", header: "Phản ánh đang mở", mobile: "meta",
      render: (r) => feedbacks.filter((f) => f.hoodId === r.id && !["resolved", "rejected"].includes(f.status)).length,
    },
    {
      key: "events", header: "Lịch sắp tới", mobile: "meta",
      render: (r) => contents.filter((c) => c.hoodId === r.id && c.type === "event" && c.startAt && daysLeft(c.startAt) >= 0).length,
    },
    { key: "waste", header: "Lịch rác", mobile: "meta", render: (r) => waste.filter((w) => w.hoodIds?.includes(r.id)).length },
    { key: "last", header: "Cập nhật gần nhất", mobile: "meta", render: (r) => fmtDateTime(r.lastUpdate) },
    { key: "status", header: "Trạng thái", mobile: "badge", render: (r) => <Badge tone={r.active ? "green" : "slate"}>{r.active ? "Đang hoạt động" : "Tạm ngưng"}</Badge> },
    {
      key: "act",
      header: "Thao tác",
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/workspace/neighborhoods/${r.id}`); }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Xem chi tiết"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setEditingHood(r); }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title="Chỉnh sửa"
          >
            <Pencil size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader title="Danh sách khu phố" icon={<Building2 size={16} className="text-emerald-600" />} />
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder="Tìm khu phố hoặc trưởng khu phố..." />
          <Select value={status} onChange={setStatus} placeholder="Tất cả trạng thái"
            options={[{ value: "active", label: "Đang hoạt động" }, { value: "paused", label: "Tạm ngưng" }]} />
        </FilterBar>
        <DataTable columns={columns} rows={rows} rowKey={(r) => String(r.id)}
          onRowClick={(r) => navigate(`/workspace/neighborhoods/${r.id}`)} emptyTitle="Không tìm thấy khu phố"
          pageSizeOptions={[10, 20, 50]} />
      </Card>

      {editingHood && (
        <EditNeighborhoodModal
          neighborhood={editingHood}
          onClose={() => setEditingHood(null)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
}

interface NeighborhoodInfo {
  area: string;
  population: string;
  households: string;
  roads: string;
  schools: string;
  medicalFacilities: string;
  businesses: string;
  customFields: { key: string; value: string }[];
}

interface NeighborhoodLinks {
  zaloLink: string;
  googleMapLink: string;
}

function EditNeighborhoodModal({
  neighborhood,
  onClose,
  onSave,
}: {
  neighborhood: Neighborhood;
  onClose: () => void;
  onSave: (updated: Neighborhood) => void;
}) {
  const [draft, setDraft] = useState<Neighborhood>(neighborhood);
  const [info, setInfo] = useState<NeighborhoodInfo>({
    area: "",
    population: "",
    households: "",
    roads: "",
    schools: "",
    medicalFacilities: "",
    businesses: "",
    customFields: [],
  });
  const [links, setLinks] = useState<NeighborhoodLinks>({
    zaloLink: "",
    googleMapLink: "",
  });

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-500";
  const label = "block text-[12.5px] font-medium text-slate-700 mb-1.5";

  const addBoardMember = () => {
    setDraft({ ...draft, board: [...draft.board, { name: "", role: "", phone: "" }] });
  };

  const updateBoardMember = (index: number, field: keyof { name: string; role: string; phone: string }, value: string) => {
    const newBoard = [...draft.board];
    newBoard[index] = { ...newBoard[index], [field]: value };
    setDraft({ ...draft, board: newBoard });
  };

  const removeBoardMember = (index: number) => {
    setDraft({ ...draft, board: draft.board.filter((_, i) => i !== index) });
  };

  const addCustomField = () => {
    if (info.customFields.length < 5) {
      setInfo({ ...info, customFields: [...info.customFields, { key: "", value: "" }] });
    }
  };

  const updateCustomField = (index: number, field: "key" | "value", val: string) => {
    const newFields = [...info.customFields];
    newFields[index] = { ...newFields[index], [field]: val };
    setInfo({ ...info, customFields: newFields });
  };

  const removeCustomField = (index: number) => {
    setInfo({ ...info, customFields: info.customFields.filter((_, i) => i !== index) });
  };

  const handleSave = () => {
    const infoText = [
      info.area && `Diện tích: ${info.area}`,
      info.population && `Dân số: ${info.population}`,
      info.households && `Số hộ: ${info.households}`,
      info.roads && `Tuyến đường: ${info.roads}`,
      info.schools && `Trường học: ${info.schools}`,
      info.medicalFacilities && `Cơ sở y tế: ${info.medicalFacilities}`,
      info.businesses && `Doanh nghiệp: ${info.businesses}`,
      ...info.customFields.filter((f) => f.key && f.value).map((f) => `${f.key}: ${f.value}`),
    ]
      .filter(Boolean)
      .join("\n");

    const linksText = [
      links.zaloLink && `Zalo: ${links.zaloLink}`,
      links.googleMapLink && `Bản đồ: ${links.googleMapLink}`,
    ]
      .filter(Boolean)
      .join("\n");

    const finalIntro = [draft.intro, infoText, linksText].filter(Boolean).join("\n\n");
    onSave({ ...draft, intro: finalIntro });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-[16px] font-semibold text-slate-900">Chỉnh sửa thông tin khu phố</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Tên khu phố */}
          <div>
            <label className={label}>Tên khu phố</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={field}
              placeholder="Nhập tên khu phố"
            />
          </div>

          {/* Thông tin khu phố */}
          <div>
            <label className={label}>Thông tin khu phố</label>
            <textarea
              value={draft.intro}
              onChange={(e) => setDraft({ ...draft, intro: e.target.value })}
              rows={3}
              className={`${field} resize-none`}
              placeholder="Nhập thông tin giới thiệu về khu phố"
            />
          </div>

          {/* Các chức danh khu phố */}
          <div>
            <label className="text-[12.5px] font-medium text-slate-700 mb-3 block">Các chức danh khu phố</label>
            <div className="space-y-2">
              {draft.board.map((member, index) => (
                <div key={index} className="flex items-start gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      value={member.name}
                      onChange={(e) => {
                        updateBoardMember(index, "name", e.target.value);
                        if (index === draft.board.length - 1 && e.target.value.trim()) addBoardMember();
                      }}
                      className={field}
                      placeholder="Họ và tên"
                    />
                    <input
                      value={member.role}
                      onChange={(e) => {
                        updateBoardMember(index, "role", e.target.value);
                        if (index === draft.board.length - 1 && e.target.value.trim()) addBoardMember();
                      }}
                      className={field}
                      placeholder="Chức danh"
                    />
                    <input
                      value={member.phone}
                      onChange={(e) => {
                        updateBoardMember(index, "phone", e.target.value);
                        if (index === draft.board.length - 1 && e.target.value.trim()) addBoardMember();
                      }}
                      className={field}
                      placeholder="Số điện thoại"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBoardMember(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors mt-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {draft.board.length === 0 && (
                <p className="text-[12px] text-slate-400 text-center py-3">Chưa có chức danh nào</p>
              )}
            </div>
          </div>

          {/* Chi tiết thông tin */}
          <div>
            <label className="text-[12.5px] font-medium text-slate-700 mb-3 block">Chi tiết thông tin</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div>
                <label className="text-[11.5px] text-slate-600 mb-1 block">Diện tích (km²)</label>
                <input
                  type="number"
                  step="0.01"
                  value={info.area}
                  onChange={(e) => setInfo({ ...info, area: e.target.value })}
                  className={field}
                  placeholder="VD: 2.5"
                />
              </div>
              <div>
                <label className="text-[11.5px] text-slate-600 mb-1 block">Dân số (người)</label>
                <input
                  type="number"
                  value={info.population}
                  onChange={(e) => setInfo({ ...info, population: e.target.value })}
                  className={field}
                  placeholder="VD: 5000"
                />
              </div>
              <div>
                <label className="text-[11.5px] text-slate-600 mb-1 block">Số hộ</label>
                <input
                  type="number"
                  value={info.households}
                  onChange={(e) => setInfo({ ...info, households: e.target.value })}
                  className={field}
                  placeholder="VD: 1200"
                />
              </div>
              <div>
                <label className="text-[11.5px] text-slate-600 mb-1 block">Tuyến đường (số lượng)</label>
                <input
                  type="number"
                  value={info.roads}
                  onChange={(e) => setInfo({ ...info, roads: e.target.value })}
                  className={field}
                  placeholder="VD: 5"
                />
              </div>
              <div>
                <label className="text-[11.5px] text-slate-600 mb-1 block">Trường học (số lượng)</label>
                <input
                  type="number"
                  value={info.schools}
                  onChange={(e) => setInfo({ ...info, schools: e.target.value })}
                  className={field}
                  placeholder="VD: 2"
                />
              </div>
              <div>
                <label className="text-[11.5px] text-slate-600 mb-1 block">Cơ sở y tế (số lượng)</label>
                <input
                  type="number"
                  value={info.medicalFacilities}
                  onChange={(e) => setInfo({ ...info, medicalFacilities: e.target.value })}
                  className={field}
                  placeholder="VD: 1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11.5px] text-slate-600 mb-1 block">Doanh nghiệp (số lượng)</label>
                <input
                  type="number"
                  value={info.businesses}
                  onChange={(e) => setInfo({ ...info, businesses: e.target.value })}
                  className={field}
                  placeholder="VD: 10"
                />
              </div>
            </div>
          </div>

          {/* Thông tin khác */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[12.5px] font-medium text-slate-700">Thông tin khác</label>
              {info.customFields.length < 5 && (
                <button
                  type="button"
                  onClick={addCustomField}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  Thêm ({info.customFields.length}/5)
                </button>
              )}
            </div>
            <div className="space-y-2">
              {info.customFields.map((f, index) => (
                <div key={index} className="flex items-start gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      value={f.key}
                      onChange={(e) => {
                        updateCustomField(index, "key", e.target.value);
                        if (index === info.customFields.length - 1 && e.target.value.trim()) addCustomField();
                      }}
                      className={field}
                      placeholder="Tên thông tin"
                    />
                    <input
                      value={f.value}
                      onChange={(e) => {
                        updateCustomField(index, "value", e.target.value);
                        if (index === info.customFields.length - 1 && e.target.value.trim()) addCustomField();
                      }}
                      className={field}
                      placeholder="Nội dung"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomField(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors mt-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {info.customFields.length === 0 && (
                <p className="text-[12px] text-slate-400 text-center py-2">Chưa có thông tin nào khác</p>
              )}
            </div>
          </div>

          {/* Liên kết */}
          <div>
            <label className="text-[12.5px] font-medium text-slate-700 mb-3 block">Liên kết</label>
            <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div>
                <label className="text-[11.5px] text-slate-600 mb-1 block">Link Zalo khu phố</label>
                <input
                  value={links.zaloLink}
                  onChange={(e) => setLinks({ ...links, zaloLink: e.target.value })}
                  className={field}
                  placeholder="VD: https://zalo.me/group/..."
                />
              </div>
              <div>
                <label className="text-[11.5px] text-slate-600 mb-1 block">Bản đồ Google Maps</label>
                <input
                  value={links.googleMapLink}
                  onChange={(e) => setLinks({ ...links, googleMapLink: e.target.value })}
                  className={field}
                  placeholder="VD: https://maps.google.com/?q=..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Huỷ
          </Button>
          <Button size="sm" icon={<Save size={15} />} onClick={handleSave}>
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}
