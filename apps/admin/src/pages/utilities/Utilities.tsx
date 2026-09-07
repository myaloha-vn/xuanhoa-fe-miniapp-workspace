import { useState } from "react";
import { MapPinned, Plus, Trash2, Upload, FileText, Map, GraduationCap, HeartPulse, Store, Landmark, Building2, MapPin, Phone } from "lucide-react";
import { Card, CardHeader, Badge, Button } from "../../components/common/ui";
import { DataTable, type Column } from "../../components/common/DataTable";
import { FilterBar, SearchInput, Select } from "../../components/common/Filters";
import { ConfirmDialog, RightDrawer, useToast } from "../../components/common/Overlays";
import { Allow } from "../../components/common/Guards";
import { useTable } from "../../services/store";
import type { Utility } from "../../types";

const ICON_MAP: Record<string, any> = {
  FileText, Map, GraduationCap, HeartPulse, Store, Landmark, Building2, MapPin, Phone,
};

const ICON_PRESETS = [
  "🏥", "🏫", "🏛️", "🏦", "🏪", "🏨", "🏬", "🏭",
  "⛽", "🚰", "📮", "🚔", "🚒", "🚑", "🚌", "🚉",
  "🅿️", "🚻", "♿", "📶", "🔌", "💧", "⚡", "🗑️",
  "📞", "📱", "💻", "🖨️", "📷", "🎥", "📡", "🔔",
  "🏠", "🏢", "🏘️", "🛣️", "🌳", "🌲", "🏞️", "⛲",
  "🛒", "🍔", "☕", "🍜", "💊", "🩺", "💉", "🧪",
  "📚", "📖", "🎓", "✏️", "🎨", "🎭", "🎬", "🎵",
  "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏊", "🚴",
];

const EMPTY: Utility = {
  id: "", name: "", icon: ICON_PRESETS[0], category: "Dân sinh", description: "",
  link: "", order: 99, onHome: false, status: "active",
};

export default function Utilities() {
  const toast = useToast();
  const [utilities, setUtilities] = useTable("utilities");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [editing, setEditing] = useState<Utility | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const categories = Array.from(new Set(utilities.map((u) => u.category)));
  const rows = utilities
    .filter((u) => (!q || u.name.toLowerCase().includes(q.toLowerCase())) && (!category || u.category === category))
    .sort((a, b) => a.order - b.order);

  const columns: Column<Utility>[] = [
    { key: "icon", header: "Icon", width: "48px", render: (r) => {
      const IconComponent = ICON_MAP[r.icon];
      if (IconComponent) {
        return <IconComponent size={24} className="text-blue-600" />;
      }
      if (r.icon?.startsWith("data:")) {
        return <img src={r.icon} alt="" className="w-8 h-8 rounded object-cover" />;
      }
      return <span className="text-2xl">{r.icon || "📌"}</span>;
    }},
    { key: "name", header: "Tên tiện ích", mobile: "title", render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: "category", header: "Nhóm", mobile: "meta", render: (r) => <Badge tone="slate">{r.category}</Badge> },
    { key: "link", header: "Liên kết", mobile: "meta", render: (r) => <span className="text-blue-600">{r.link}</span> },
    { key: "status", header: "Trạng thái", mobile: "badge", render: (r) => <Badge tone={r.status === "active" ? "blue" : "slate"}>{r.status === "active" ? "Đang bật" : "Đã ẩn"}</Badge> },
    {
      key: "act", header: "Thao tác",
      render: (r) => (
        <div className="flex gap-1">
          <Allow module="utilities" action="edit">
            <button onClick={() => setEditing(r)} className="px-2 py-1 rounded-lg text-[12px] text-blue-600 hover:bg-blue-50">Sửa</button>
          </Allow>
          <Allow module="utilities" action="delete">
            <button onClick={() => setConfirmDelete(r.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500"><Trash2 size={13} /></button>
          </Allow>
        </div>
      ),
    },
  ];

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-500";
  const label = "block text-[12.5px] font-medium text-slate-700 mb-1.5";

  return (
    <>
      <Card>
        <CardHeader title="Tiện ích và bản đồ" icon={<MapPinned size={16} className="text-blue-600" />}
          action={
            <Allow module="utilities" action="create">
              <Button size="sm" icon={<Plus size={14} />} onClick={() => setEditing({ ...EMPTY })}>Thêm tiện ích</Button>
            </Allow>
          } />
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder="Tìm tiện ích..." />
          <Select value={category} onChange={setCategory} placeholder="Tất cả nhóm" options={categories.map((c) => ({ value: c, label: c }))} />
        </FilterBar>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} emptyTitle="Chưa có tiện ích" />
      </Card>

      <RightDrawer open={!!editing} title={editing?.id ? "Cập nhật tiện ích" : "Thêm tiện ích"} onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Huỷ</Button>
            <Button onClick={() => {
              if (!editing) return;
              if (!editing.name.trim()) { toast("Vui lòng nhập tên tiện ích", "error"); return; }
              setUtilities(editing.id ? utilities.map((u) => (u.id === editing.id ? editing : u)) : [...utilities, { ...editing, id: `ut-${Date.now()}` }]);
              setEditing(null); toast("Đã lưu tiện ích");
            }}>Lưu</Button>
          </>
        }>
        {editing && (
          <div className="space-y-4">
            {/* Icon picker */}
            <div>
              <label className={label}>Icon</label>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-2xl overflow-hidden">
                  {(() => {
                    const IconComponent = ICON_MAP[editing.icon];
                    if (IconComponent) {
                      return <IconComponent size={28} className="text-blue-600" />;
                    }
                    if (editing.icon?.startsWith("data:")) {
                      return <img src={editing.icon} alt="" className="w-full h-full object-cover" />;
                    }
                    return editing.icon || "📌";
                  })()}
                </div>
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-[12.5px] text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors cursor-pointer">
                  <Upload size={14} />
                  Tải icon lên
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setEditing({ ...editing, icon: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                    e.target.value = "";
                  }} />
                </label>
              </div>
              <div className="grid grid-cols-8 gap-1.5 p-2 max-h-40 overflow-y-auto border border-slate-100 rounded-lg bg-slate-50/50">
                {ICON_PRESETS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setEditing({ ...editing, icon })}
                    className={`w-8 h-8 rounded-md text-lg flex items-center justify-center hover:bg-white transition-colors ${editing.icon === icon ? "bg-white ring-2 ring-blue-500" : ""}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div><label className={label}>Tên tiện ích <span className="text-red-500">*</span></label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={field} /></div>
            <div><label className={label}>Nhóm</label>
              <input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={field} /></div>
            <div><label className={label}>Liên kết</label>
              <input value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} className={field} /></div>
            <label className="flex items-center gap-2 text-[13px] text-slate-700">
              <input type="checkbox" checked={editing.status === "active"} onChange={(e) => setEditing({ ...editing, status: e.target.checked ? "active" : "hidden" })} className="w-4 h-4" />
              Đang bật
            </label>
          </div>
        )}
      </RightDrawer>

      <ConfirmDialog open={!!confirmDelete} title="Xoá tiện ích" description="Tiện ích sẽ không còn hiển thị cho người dân."
        confirmLabel="Xoá" tone="danger" onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { setUtilities(utilities.filter((u) => u.id !== confirmDelete)); setConfirmDelete(null); toast("Đã xoá tiện ích"); }} />
    </>
  );
}
