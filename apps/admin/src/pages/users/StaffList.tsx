import { useState } from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, Badge, Button } from "../../components/common/ui";
import { DataTable, type Column } from "../../components/common/DataTable";
import { FilterBar, SearchInput, Select } from "../../components/common/Filters";
import { ConfirmDialog, RightDrawer, useToast } from "../../components/common/Overlays";
import { Allow } from "../../components/common/Guards";
import { useTable } from "../../services/store";
import { ROLE_LABEL } from "../../services/permissions";
import type { Role, User } from "../../types";

const STAFF_ROLES: Role[] = ["CONTENT_EDITOR", "FEEDBACK_OFFICER", "NEIGHBORHOOD_LEADER", "NEIGHBORHOOD_STAFF"];

const EMPTY: User = {
  id: "", fullName: "", username: "", role: "NEIGHBORHOOD_STAFF", unit: "UBND phường Xuân Hoà",
  hoodId: null, phone: "", email: "", status: "active", lastLogin: new Date().toISOString(),
  canPublishDirectly: false,
};

export default function StaffList() {
  const toast = useToast();
  const [users, setUsers] = useTable("users");
  const [hoods] = useTable("neighborhoods");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const rows = users.filter((u) => {
    if (!STAFF_ROLES.includes(u.role)) return false;
    if (q && !`${u.fullName} ${u.username} ${u.phone}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (status && u.status !== status) return false;
    return true;
  });

  const columns: Column<User>[] = [
    { key: "name", header: "Họ tên", mobile: "title", render: (r) => <span className="font-medium text-slate-800">{r.fullName}</span> },
    { key: "phone", header: "SĐT", mobile: "meta", render: (r) => r.phone },
    { key: "unit", header: "Đơn vị", mobile: "meta", render: (r) => r.unit },
    { key: "role", header: "Chức vụ", mobile: "badge", render: (r) => <Badge tone="violet">{ROLE_LABEL[r.role]}</Badge> },
    { key: "status", header: "Trạng thái", mobile: "badge", render: (r) => <Badge tone={r.status === "active" ? "blue" : "slate"}>{r.status === "active" ? "Hoạt động" : "Đã khoá"}</Badge> },
    {
      key: "act", header: "Thao tác",
      render: (r) => (
        <div className="flex gap-1">
          <Allow module="users" action="edit">
            <button onClick={() => setEditing(r)} className="px-2 py-1 rounded-lg text-[12px] text-blue-600 hover:bg-blue-50">Sửa</button>
            <button title="Xoá" onClick={() => setConfirmDelete(r)}
              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500">
              <Trash2 size={13} />
            </button>
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
        <CardHeader title="Danh sách cán bộ" icon={<Briefcase size={16} className="text-blue-600" />}
          action={
            <Allow module="users" action="create">
              <Button size="sm" icon={<Plus size={14} />} onClick={() => setEditing({ ...EMPTY })}>Thêm cán bộ</Button>
            </Allow>
          } />
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder="Tìm theo tên, tài khoản hoặc SĐT..." />
          <Select value={status} onChange={setStatus} placeholder="Tất cả trạng thái"
            options={[{ value: "active", label: "Đang hoạt động" }, { value: "locked", label: "Đã khoá" }]} />
        </FilterBar>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} emptyTitle="Không tìm thấy cán bộ" />
      </Card>

      <RightDrawer open={!!editing} title={editing?.id ? "Cập nhật cán bộ" : "Thêm cán bộ"} onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Huỷ</Button>
            <Button onClick={() => {
              if (!editing) return;
              if (!editing.fullName.trim() || !editing.username.trim()) { toast("Vui lòng nhập họ tên và tài khoản", "error"); return; }
              setUsers(editing.id ? users.map((u) => (u.id === editing.id ? editing : u)) : [...users, { ...editing, id: `u-${Date.now()}` }]);
              setEditing(null); toast("Đã lưu cán bộ");
            }}>Lưu</Button>
          </>
        }>
        {editing && (
          <div className="space-y-4">
            <div><label className={label}>Họ tên <span className="text-red-500">*</span></label>
              <input value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} className={field} /></div>
            <div><label className={label}>Tên tài khoản <span className="text-red-500">*</span></label>
              <input value={editing.username} onChange={(e) => setEditing({ ...editing, username: e.target.value })} className={field} /></div>
            <div><label className={label}>Vai trò</label>
              <select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })} className={field}>
                {STAFF_ROLES.map((v) => <option key={v} value={v}>{ROLE_LABEL[v]}</option>)}
              </select></div>
            <div><label className={label}>Khu phố phụ trách</label>
              <select value={editing.hoodId ?? ""} onChange={(e) => setEditing({ ...editing, hoodId: e.target.value ? Number(e.target.value) : null })} className={field}>
                <option value="">Toàn phường</option>
                {hoods.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select></div>
            <div><label className={label}>Đơn vị</label>
              <input value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} className={field} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Điện thoại</label>
                <input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className={field} /></div>
              <div><label className={label}>Email</label>
                <input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className={field} /></div>
            </div>
            <label className="flex items-center gap-2 text-[13px] text-slate-700">
              <input type="checkbox" checked={editing.canPublishDirectly}
                onChange={(e) => setEditing({ ...editing, canPublishDirectly: e.target.checked })} className="w-4 h-4" />
              Được xuất bản nội dung trực tiếp không cần duyệt
            </label>
          </div>
        )}
      </RightDrawer>

      <ConfirmDialog open={!!confirmDelete}
        title="Xoá cán bộ"
        description={`Bạn có chắc muốn xoá tài khoản "${confirmDelete?.fullName}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xoá"
        tone="danger"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          setUsers(users.filter((u) => u.id !== confirmDelete!.id));
          setConfirmDelete(null); toast("Đã xoá cán bộ");
        }} />
    </>
  );
}
