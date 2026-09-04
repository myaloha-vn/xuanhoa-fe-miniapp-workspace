import { useState } from "react";
import { Landmark, Pencil, Trash2, Plus, ChevronRight, ChevronDown, Save, X } from "lucide-react";
import { Card, CardHeader, Button } from "../../components/common/ui";
import { useToast } from "../../components/common/Overlays";

interface Unit {
  id: number;
  name: string;
  children?: Unit[];
}

// Mock data - các đơn vị thuộc UBND phường Xuân Hoà
const INITIAL_UNITS: Unit[] = [
  {
    id: 1,
    name: "Văn phòng UBND phường",
    children: [
      { id: 11, name: "Bộ phận Tiếp nhận & Trả kết quả" },
      { id: 12, name: "Bộ phận Hành chính - Tư pháp" },
    ],
  },
  {
    id: 2,
    name: "Ban Chỉ huy Quân sự phường",
  },
  {
    id: 3,
    name: "Công an phường",
  },
  {
    id: 4,
    name: "Bộ phận Địa chính - Xây dựng",
  },
  {
    id: 5,
    name: "Bộ phận Lao động - Thương binh & Xã hội",
  },
  {
    id: 6,
    name: "Bộ phận Văn hoá - Thông tin",
  },
  {
    id: 7,
    name: "Trạm Y tế phường",
  },
  {
    id: 8,
    name: "Trường Mầm non Xuân Hoà",
  },
  {
    id: 9,
    name: "Trường Tiểu học Xuân Hoà",
  },
  {
    id: 10,
    name: "Trường THCS Xuân Hoà",
  },
];

let nextId = 100;

export default function UnitsList() {
  const toast = useToast();
  const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [addingChildOf, setAddingChildOf] = useState<number | null>(null);
  const [newChildName, setNewChildName] = useState("");
  const [addingRoot, setAddingRoot] = useState(false);
  const [newRootName, setNewRootName] = useState("");

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const countAll = (list: Unit[]): number =>
    list.reduce((acc, u) => acc + 1 + (u.children ? countAll(u.children) : 0), 0);

  const handleAddRoot = () => {
    const name = newRootName.trim();
    if (!name) return;
    setUnits([...units, { id: nextId++, name }]);
    setNewRootName("");
    setAddingRoot(false);
    toast("Đã thêm đơn vị");
  };

  const handleAddChild = (parentId: number) => {
    const name = newChildName.trim();
    if (!name) return;
    setUnits(units.map((u) => {
      if (u.id === parentId) {
        const children = [...(u.children || []), { id: nextId++, name }];
        return { ...u, children };
      }
      return u;
    }));
    setExpanded((prev) => new Set([...prev, parentId]));
    setNewChildName("");
    setAddingChildOf(null);
    toast("Đã thêm đơn vị con");
  };

  const handleSaveEdit = (id: number, isChild: boolean, parentId?: number) => {
    const name = editName.trim();
    if (!name) return;
    if (isChild && parentId) {
      setUnits(units.map((u) => {
        if (u.id === parentId) {
          return { ...u, children: u.children?.map((c) => c.id === id ? { ...c, name } : c) };
        }
        return u;
      }));
    } else {
      setUnits(units.map((u) => u.id === id ? { ...u, name } : u));
    }
    setEditingId(null);
    setEditName("");
    toast("Đã lưu thay đổi");
  };

  const handleDelete = (id: number) => {
    setUnits(units.filter((u) => u.id !== id));
    toast("Đã xoá đơn vị");
  };

  const handleDeleteChild = (parentId: number, childId: number) => {
    setUnits(units.map((u) => {
      if (u.id === parentId) {
        return { ...u, children: u.children?.filter((c) => c.id !== childId) };
      }
      return u;
    }));
    toast("Đã xoá đơn vị con");
  };

  return (
    <Card>
      <CardHeader
        title="Danh sách đơn vị"
        icon={<Landmark size={16} className="text-indigo-600" />}
        description={`UBND phường Xuân Hoà — ${countAll(units)} đơn vị`}
      />

      <div className="px-5 pb-4">
        <div className="flex items-center justify-end mb-4">
          <Button onClick={() => setAddingRoot(true)}>
            <Plus size={14} /> Thêm đơn vị
          </Button>
        </div>

        {/* Thêm đơn vị gốc */}
        {addingRoot && (
          <div className="flex items-center gap-2 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <input
              autoFocus
              value={newRootName}
              onChange={(e) => setNewRootName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddRoot(); if (e.key === "Escape") setAddingRoot(false); }}
              placeholder="Tên đơn vị..."
              className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
            <button onClick={handleAddRoot} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50">
              <Save size={16} />
            </button>
            <button onClick={() => { setAddingRoot(false); setNewRootName(""); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Danh sách đơn vị */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {units.map((unit, idx) => (
            <div key={unit.id}>
              {/* Đơn vị cha */}
              <div className={`flex items-center gap-2 px-4 py-3 hover:bg-slate-50 transition-colors ${idx > 0 ? "border-t border-slate-100" : ""}`}>
                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(unit.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  {unit.children && unit.children.length > 0 ? (
                    expanded.has(unit.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                  ) : (
                    <span className="w-3.5" />
                  )}
                </button>

                {/* Tên */}
                {editingId === unit.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(unit.id, false); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 px-3 py-1.5 text-[13px] border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <button onClick={() => handleSaveEdit(unit.id, false)} className="p-1 rounded text-green-600 hover:bg-green-50">
                      <Save size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 rounded text-slate-400 hover:bg-slate-100">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <span className="flex-1 text-[13.5px] text-slate-800 font-medium">{unit.name}</span>
                )}

                {/* Thao tác */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => { setAddingChildOf(unit.id); setNewChildName(""); }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Thêm đơn vị con"
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    onClick={() => { setEditingId(unit.id); setEditName(unit.name); }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(unit.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Xoá"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Thêm đơn vị con */}
              {addingChildOf === unit.id && (
                <div className="flex items-center gap-2 px-4 py-2 pl-14 bg-blue-50/50 border-t border-blue-100">
                  <input
                    autoFocus
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddChild(unit.id); if (e.key === "Escape") setAddingChildOf(null); }}
                    placeholder="Tên đơn vị con..."
                    className="flex-1 px-3 py-1.5 text-[13px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button onClick={() => handleAddChild(unit.id)} className="p-1 rounded text-green-600 hover:bg-green-50">
                    <Save size={14} />
                  </button>
                  <button onClick={() => setAddingChildOf(null)} className="p-1 rounded text-slate-400 hover:bg-slate-100">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Đơn vị con */}
              {expanded.has(unit.id) && unit.children && unit.children.length > 0 && (
                <div className="bg-slate-50/50 border-t border-slate-100">
                  {unit.children.map((child, cIdx) => (
                    <div key={child.id}>
                      <div className={`flex items-center gap-2 px-4 py-2.5 pl-14 hover:bg-slate-100/60 transition-colors ${cIdx > 0 ? "border-t border-slate-100/60" : ""}`}>
                        <span className="w-6 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        </span>

                        {editingId === child.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              autoFocus
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(child.id, true, unit.id); if (e.key === "Escape") setEditingId(null); }}
                              className="flex-1 px-3 py-1.5 text-[13px] border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                            <button onClick={() => handleSaveEdit(child.id, true, unit.id)} className="p-1 rounded text-green-600 hover:bg-green-50">
                              <Save size={14} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1 rounded text-slate-400 hover:bg-slate-100">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="flex-1 text-[13px] text-slate-700">{child.name}</span>
                        )}

                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => { setEditingId(child.id); setEditName(child.name); }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteChild(unit.id, child.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Xoá"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {units.length === 0 && (
          <p className="text-center text-[13px] text-slate-400 py-8">Chưa có đơn vị nào. Nhấn "Thêm đơn vị" để bắt đầu.</p>
        )}
      </div>
    </Card>
  );
}
