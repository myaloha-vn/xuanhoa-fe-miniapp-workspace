import { useState } from "react";
import { Plus, Trash2, Users as UsersIcon, Shield, Briefcase, User as UserIcon } from "lucide-react";
import { Card, CardHeader, Badge, Button } from "../../components/common/ui";
import { DataTable, type Column } from "../../components/common/DataTable";
import { FilterBar, SearchInput, Select } from "../../components/common/Filters";
import { ConfirmDialog, RightDrawer, useToast } from "../../components/common/Overlays";
import { Allow } from "../../components/common/Guards";
import { useTable } from "../../services/store";
import { ROLE_LABEL } from "../../services/permissions";
import { fmtDateTime } from "../../utils/format";
import type { Role, User } from "../../types";

type TabKey = "admin" | "staff" | "citizen";

interface Citizen {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  registeredAt: string;
}

const EMPTY: User = {
  id: "", fullName: "", username: "", role: "NEIGHBORHOOD_STAFF", unit: "UBND phường Xuân Hoà",
  hoodId: null, phone: "", email: "", status: "active", lastLogin: new Date().toISOString(),
  canPublishDirectly: false,
};

const EMPTY_CITIZEN: Citizen = {
  id: "", fullName: "", email: "", phone: "", registeredAt: new Date().toISOString(),
};

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "admin", label: "Quản trị", icon: Shield },
  { key: "staff", label: "Cán bộ", icon: Briefcase },
  { key: "citizen", label: "Người dân", icon: UserIcon },
];

// Phân loại role
const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "PHUONG_ADMIN"];
const STAFF_ROLES: Role[] = ["CONTENT_EDITOR", "FEEDBACK_OFFICER", "NEIGHBORHOOD_LEADER", "NEIGHBORHOOD_STAFF"];

// Dữ liệu người dân mẫu
const INITIAL_CITIZENS: Citizen[] = [
  { id: "c-1", fullName: "Nguyễn Văn Minh", email: "minh.nguyen@gmail.com", phone: "0912345678", registeredAt: "2026-08-15T08:30:00Z" },
  { id: "c-2", fullName: "Trần Thị Hoa", email: "hoa.tran@yahoo.com", phone: "0923456789", registeredAt: "2026-08-18T14:20:00Z" },
  { id: "c-3", fullName: "Lê Văn Cường", email: "cuong.le@outlook.com", phone: "0934567890", registeredAt: "2026-08-20T09:15:00Z" },
  { id: "c-4", fullName: "Phạm Thu Trang", email: "trang.pham@gmail.com", phone: "0945678901", registeredAt: "2026-08-22T16:45:00Z" },
  { id: "c-5", fullName: "Hoàng Văn Đức", email: "duc.hoang@gmail.com", phone: "0956789012", registeredAt: "2026-08-25T10:00:00Z" },
  { id: "c-6", fullName: "Vũ Thị Mai", email: "mai.vu@yahoo.com", phone: "0967890123", registeredAt: "2026-08-28T11:30:00Z" },
  { id: "c-7", fullName: "Đỗ Văn Nam", email: "nam.do@gmail.com", phone: "0978901234", registeredAt: "2026-09-01T08:00:00Z" },
  { id: "c-8", fullName: "Bùi Thị Lan", email: "lan.bui@outlook.com", phone: "0989012345", registeredAt: "2026-09-03T15:20:00Z" },
  { id: "c-9", fullName: "Ngô Văn Khánh", email: "khanh.ngo@gmail.com", phone: "0990123456", registeredAt: "2026-09-05T09:45:00Z" },
  { id: "c-10", fullName: "Đặng Thị Hồng", email: "hong.dang@yahoo.com", phone: "0901234567", registeredAt: "2026-09-06T13:10:00Z" },
];

export default function Users() {
  const toast = useToast();
  const [users, setUsers] = useTable("users");
  const [hoods] = useTable("neighborhoods");
  const [activeTab, setActiveTab] = useState<TabKey>("admin");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  // State cho người dân
  const [citizens, setCitizens] = useState<Citizen[]>(INITIAL_CITIZENS);
  const [editingCitizen, setEditingCitizen] = useState<Citizen | null>(null);
  const [confirmDeleteCitizen, setConfirmDeleteCitizen] = useState<Citizen | null>(null);

  // Filter users by tab
  const getFilteredUsers = () => {
    let filtered = users;
    
    // Filter by role based on tab
    if (activeTab === "admin") {
      filtered = filtered.filter((u) => ADMIN_ROLES.includes(u.role));
    } else if (activeTab === "staff") {
      filtered = filtered.filter((u) => STAFF_ROLES.includes(u.role));
    }

    // Apply search
    if (q) {
      filtered = filtered.filter((u) =>
        `${u.fullName} ${u.username} ${u.phone}`.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Apply status filter
    if (status) {
      filtered = filtered.filter((u) => u.status === status);
    }

    return filtered;
  };

  const getFilteredCitizens = () => {
    let filtered = citizens;
    if (q) {
      filtered = filtered.filter((c) =>
        `${c.fullName} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase())
      );
    }
    return filtered;
  };

  const rows = activeTab === "citizen" ? getFilteredCitizens() : getFilteredUsers();

  // Columns for Admin tab
  const adminColumns: Column<User>[] = [
    { key: "name", header: "Họ tên", mobile: "title", render: (r) => <span className="font-medium text-slate-800">{r.fullName}</span> },
    { key: "username", header: "Tài khoản", mobile: "meta", render: (r) => r.username },
    { key: "role", header: "Quyền hạn", mobile: "badge", render: (r) => <Badge tone="violet">{ROLE_LABEL[r.role]}</Badge> },
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

  // Columns for Staff tab
  const staffColumns: Column<User>[] = [
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

  // Columns for Citizen tab
  const citizenColumns: Column<Citizen>[] = [
    { key: "name", header: "Họ tên", mobile: "title", render: (r) => <span className="font-medium text-slate-800">{r.fullName}</span> },
    { key: "email", header: "Email", mobile: "meta", render: (r) => r.email },
    { key: "phone", header: "SĐT", mobile: "meta", render: (r) => r.phone },
    { key: "createdAt", header: "Ngày tạo", mobile: "meta", render: (r) => fmtDateTime(r.registeredAt) },
    {
      key: "act", header: "Thao tác",
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => setEditingCitizen(r)} className="px-2 py-1 rounded-lg text-[12px] text-blue-600 hover:bg-blue-50">Sửa</button>
          <button title="Xoá" onClick={() => setConfirmDeleteCitizen(r)}
            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  const getColumns = () => {
    if (activeTab === "admin") return adminColumns;
    if (activeTab === "staff") return staffColumns;
    return citizenColumns;
  };

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-500";
  const label = "block text-[12.5px] font-medium text-slate-700 mb-1.5";

  return (
    <>
      <Card>
        <CardHeader title="Người dùng và phân quyền" icon={<UsersIcon size={16} className="text-violet-600" />}
          action={
            activeTab !== "citizen" && (
              <Allow module="users" action="create">
                <Button size="sm" icon={<Plus size={14} />} onClick={() => setEditing({ ...EMPTY })}>Tạo tài khoản</Button>
              </Allow>
            )
          } />
        
        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 border-b border-slate-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setQ(""); setStatus(""); }}
                className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder={activeTab === "citizen" ? "Tìm theo tên, email hoặc SĐT..." : "Tìm theo tên, tài khoản hoặc SĐT..."} />
          {activeTab !== "citizen" && (
            <Select value={status} onChange={setStatus} placeholder="Tất cả trạng thái"
              options={[{ value: "active", label: "Đang hoạt động" }, { value: "locked", label: "Đã khoá" }]} />
          )}
        </FilterBar>
        <DataTable columns={getColumns()} rows={rows as any} rowKey={(r: any) => r.id} emptyTitle="Không tìm thấy tài khoản" />
      </Card>

      {/* Drawer cho User (Admin/Staff) */}
      <RightDrawer open={!!editing} title={editing?.id ? "Cập nhật tài khoản" : "Tạo tài khoản"} onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Huỷ</Button>
            <Button onClick={() => {
              if (!editing) return;
              if (!editing.fullName.trim() || !editing.username.trim()) { toast("Vui lòng nhập họ tên và tài khoản", "error"); return; }
              setUsers(editing.id ? users.map((u) => (u.id === editing.id ? editing : u)) : [...users, { ...editing, id: `u-${Date.now()}` }]);
              setEditing(null); toast("Đã lưu tài khoản");
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
                {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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

      {/* Confirm dialog cho xoá user */}
      <ConfirmDialog open={!!confirmDelete}
        title="Xoá tài khoản"
        description={`Bạn có chắc muốn xoá tài khoản "${confirmDelete?.fullName}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xoá"
        tone="danger"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          setUsers(users.filter((u) => u.id !== confirmDelete!.id));
          setConfirmDelete(null); toast("Đã xoá tài khoản");
        }} />

      {/* Drawer cho người dân */}
      <RightDrawer open={!!editingCitizen} title={editingCitizen?.id ? "Cập nhật thông tin" : "Thêm người dân"} onClose={() => setEditingCitizen(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingCitizen(null)}>Huỷ</Button>
            <Button onClick={() => {
              if (!editingCitizen) return;
              if (!editingCitizen.fullName.trim()) { toast("Vui lòng nhập họ tên", "error"); return; }
              setCitizens(editingCitizen.id ? citizens.map((c) => (c.id === editingCitizen.id ? editingCitizen : c)) : [...citizens, { ...editingCitizen, id: `c-${Date.now()}` }]);
              setEditingCitizen(null); toast("Đã lưu thông tin");
            }}>Lưu</Button>
          </>
        }>
        {editingCitizen && (
          <div className="space-y-4">
            <div><label className={label}>Họ tên <span className="text-red-500">*</span></label>
              <input value={editingCitizen.fullName} onChange={(e) => setEditingCitizen({ ...editingCitizen, fullName: e.target.value })} className={field} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Điện thoại</label>
                <input value={editingCitizen.phone} onChange={(e) => setEditingCitizen({ ...editingCitizen, phone: e.target.value })} className={field} /></div>
              <div><label className={label}>Email</label>
                <input value={editingCitizen.email} onChange={(e) => setEditingCitizen({ ...editingCitizen, email: e.target.value })} className={field} /></div>
            </div>
          </div>
        )}
      </RightDrawer>

      {/* Confirm dialog cho xoá người dân */}
      <ConfirmDialog open={!!confirmDeleteCitizen}
        title="Xoá người dân"
        description={`Bạn có chắc muốn xoá thông tin "${confirmDeleteCitizen?.fullName}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xoá"
        tone="danger"
        onCancel={() => setConfirmDeleteCitizen(null)}
        onConfirm={() => {
          setCitizens(citizens.filter((c) => c.id !== confirmDeleteCitizen!.id));
          setConfirmDeleteCitizen(null); toast("Đã xoá thông tin");
        }} />
    </>
  );
}
