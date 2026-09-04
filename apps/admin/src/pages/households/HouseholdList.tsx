import { useMemo, useState, useRef } from "react";
import { Home, Pencil, Trash2, Save, X, Upload, ChevronDown, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardHeader, Badge, Button } from "../../components/common/ui";
import { DataTable, type Column } from "../../components/common/DataTable";
import { FilterBar, SearchInput, Select } from "../../components/common/Filters";
import { useToast } from "../../components/common/Overlays";
import { useScopedHouseholds } from "../../hooks/useScoped";
import { useTable } from "../../services/store";
import { fmtDate } from "../../utils/format";
import type { Household } from "../../types";

const STATUS_LABEL: Record<Household["status"], string> = {
  active: "Hộ thường trú",
  moved_out: "Đã chuyển đi",
  temp_absent: "Hộ tạm trú",
};
const STATUS_TONE: Record<Household["status"], "green" | "slate" | "amber"> = {
  active: "green",
  moved_out: "slate",
  temp_absent: "amber",
};

export default function HouseholdList() {
  const toast = useToast();
  const households = useScopedHouseholds();
  const [allHouseholds, setAllHouseholds] = useTable("households");
  const [neighborhoods] = useTable("neighborhoods");
  const [q, setQ] = useState("");
  const [hoodFilter, setHoodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<Household | null>(null);
  const [deleting, setDeleting] = useState<Household | null>(null);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hoodName = (id: number) => neighborhoods.find((n) => n.id === id)?.name ?? `Khu phố ${id}`;

  const rows = useMemo(() => households.filter((h) => {
    if (q) {
      const needle = q.toLowerCase();
      const match =
        h.headName.toLowerCase().includes(needle) ||
        h.headPhone.includes(needle) ||
        h.headIdCard.includes(needle) ||
        h.code.toLowerCase().includes(needle) ||
        h.address.toLowerCase().includes(needle);
      if (!match) return false;
    }
    if (hoodFilter && h.hoodId !== Number(hoodFilter)) return false;
    if (statusFilter && h.status !== statusFilter) return false;
    return true;
  }), [households, q, hoodFilter, statusFilter]);

  const handleSaveEdit = (updated: Household) => {
    setAllHouseholds(allHouseholds.map((h) => (h.id === updated.id ? updated : h)));
    setEditing(null);
    toast("Đã lưu thông tin hộ gia đình");
  };

  const handleDelete = () => {
    if (!deleting) return;
    setAllHouseholds(allHouseholds.filter((h) => h.id !== deleting.id));
    setDeleting(null);
    toast("Đã xoá hộ gia đình");
  };

  const handleChangeHood = (householdId: number, newHoodId: number) => {
    setAllHouseholds(allHouseholds.map((h) =>
      h.id === householdId ? { ...h, hoodId: newHoodId } : h
    ));
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

        const newHouseholds: Household[] = jsonData.map((row, idx) => ({
          id: Date.now() + idx,
          code: row["Mã hộ"] || `H${String(allHouseholds.length + idx + 1).padStart(3, "0")}`,
          headName: row["Họ tên chủ hộ"] || "",
          headPhone: row["SĐT"] || row["Số điện thoại"] || "",
          headIdCard: row["CCCD"] || row["Số CCCD"] || "",
          members: Number(row["Nhân khẩu"]) || 1,
          address: row["Địa chỉ"] || "",
          hoodId: Number(row["Khu phố ID"]) || 1,
          registeredAt: row["Ngày đăng ký"] || new Date().toISOString(),
          status: (row["Trạng thái"] === "Hộ tạm trú" ? "temp_absent" : row["Trạng thái"] === "Đã chuyển đi" ? "moved_out" : "active") as Household["status"],
        }));

        setAllHouseholds([...allHouseholds, ...newHouseholds]);
        toast(`Đã import ${newHouseholds.length} hộ gia đình`);
      } catch {
        toast("Lỗi khi đọc file Excel");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
    setShowImportMenu(false);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Mã hộ": "H001",
        "Họ tên chủ hộ": "Nguyễn Văn A",
        "SĐT": "0912345678",
        "CCCD": "026189000001",
        "Nhân khẩu": 4,
        "Địa chỉ": "Số 1, đường Nguyễn Huệ",
        "Khu phố ID": 1,
        "Ngày đăng ký": "2024-01-15",
        "Trạng thái": "Hộ thường trú",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hộ gia đình");
    XLSX.writeFile(wb, "mau_nhap_ho_gia_dinh.xlsx");
    setShowImportMenu(false);
  };

  const columns: Column<Household>[] = [
    {
      key: "code",
      header: "Mã hộ",
      mobile: "title",
      render: (r) => (
        <div>
          <span className="font-medium text-slate-800">{r.code}</span>
          <p className="text-[12px] text-slate-500 mt-0.5">{r.headName}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "SĐT chủ hộ",
      mobile: "meta",
      render: (r) => r.headPhone,
    },
    {
      key: "members",
      header: "Nhân khẩu",
      mobile: "meta",
      render: (r) => `${r.members} người`,
    },
    {
      key: "address",
      header: "Địa chỉ",
      render: (r) => <span className="line-clamp-1 max-w-[300px] inline-block">{r.address}</span>,
    },
    {
      key: "hood",
      header: "Khu phố",
      mobile: "meta",
      render: (r) => (
        <select
          value={r.hoodId}
          onChange={(e) => handleChangeHood(r.id, Number(e.target.value))}
          className="px-2 py-1 text-[13px] border border-slate-200 rounded-lg bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors cursor-pointer"
        >
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </select>
      ),
    },
    {
      key: "registeredAt",
      header: "Ngày đăng ký",
      mobile: "meta",
      render: (r) => fmtDate(r.registeredAt),
    },
    {
      key: "status",
      header: "Trạng thái",
      mobile: "badge",
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>,
    },
    {
      key: "act",
      header: "Thao tác",
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(r)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title="Chỉnh sửa"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => setDeleting(r)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Xoá"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const hoodOptions = neighborhoods.map((n) => ({ value: String(n.id), label: n.name }));

  return (
    <>
      <Card>
        <CardHeader
          title="Danh sách hộ gia đình"
          icon={<Home size={16} className="text-blue-600" />}
          description={`Tổng: ${rows.length} hộ`}
        />
        <FilterBar>
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Tìm theo tên chủ hộ, SĐT, CCCD, địa chỉ..."
          />
          <Select
            value={hoodFilter}
            onChange={setHoodFilter}
            placeholder="Tất cả khu phố"
            options={hoodOptions}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Tất cả trạng thái"
            options={[
              { value: "active", label: "Hộ thường trú" },
              { value: "moved_out", label: "Đã chuyển đi" },
              { value: "temp_absent", label: "Hộ tạm trú" },
            ]}
          />
          {/* Import Excel */}
          <div className="relative">
            <button
              onClick={() => setShowImportMenu(!showImportMenu)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <Upload size={14} />
              <span>Import Excel</span>
              <ChevronDown size={14} className={`transition-transform ${showImportMenu ? "rotate-180" : ""}`} />
            </button>
            {showImportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowImportMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg border border-slate-200 shadow-lg py-1">
                  <label className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <Upload size={14} className="text-blue-600" />
                    <span>Chọn file Excel</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleImportExcel}
                    />
                  </label>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 text-left"
                  >
                    <Download size={14} className="text-green-600" />
                    <span>Tải mẫu Excel</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          emptyTitle="Không có hộ gia đình nào"
          emptyDescription="Thay đổi bộ lọc để xem thêm dữ liệu."
          pageSizeOptions={[20, 50, 100]}
        />
      </Card>

      {editing && (
        <EditHouseholdModal
          household={editing}
          neighborhoods={neighborhoods}
          onClose={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          household={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}

/* ─── Modal chỉnh sửa hộ gia đình ─────────────────────────────────────────── */

function EditHouseholdModal({
  household,
  neighborhoods,
  onClose,
  onSave,
}: {
  household: Household;
  neighborhoods: { id: number; name: string }[];
  onClose: () => void;
  onSave: (updated: Household) => void;
}) {
  const [draft, setDraft] = useState<Household>(household);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-[15px] font-semibold text-slate-800">Chỉnh sửa hộ gia đình</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <Field label="Mã hộ">
            <input
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </Field>

          <Field label="Họ tên chủ hộ">
            <input
              value={draft.headName}
              onChange={(e) => setDraft({ ...draft, headName: e.target.value })}
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Số điện thoại">
              <input
                value={draft.headPhone}
                onChange={(e) => setDraft({ ...draft, headPhone: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </Field>
            <Field label="Số CCCD">
              <input
                value={draft.headIdCard}
                onChange={(e) => setDraft({ ...draft, headIdCard: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Số nhân khẩu">
              <input
                type="number"
                min={1}
                value={draft.members}
                onChange={(e) => setDraft({ ...draft, members: Number(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </Field>
            <Field label="Khu phố">
              <select
                value={draft.hoodId}
                onChange={(e) => setDraft({ ...draft, hoodId: Number(e.target.value) })}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                {neighborhoods.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Địa chỉ">
            <input
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </Field>

          <Field label="Trạng thái">
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Household["status"] })}
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            >
              <option value="active">Hộ thường trú</option>
              <option value="moved_out">Đã chuyển đi</option>
              <option value="temp_absent">Hộ tạm trú</option>
            </select>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button onClick={() => onSave(draft)}>
            <Save size={14} /> Lưu
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal xác nhận xoá ──────────────────────────────────────────────────── */

function ConfirmDeleteModal({
  household,
  onClose,
  onConfirm,
}: {
  household: Household;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h3 className="text-[15px] font-semibold text-slate-800">Xác nhận xoá</h3>
          </div>
          <p className="text-[13px] text-slate-600">
            Bạn có chắc muốn xoá hộ <strong>{household.headName}</strong> ({household.code})?
            Thao tác này không thể hoàn tác.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button variant="danger" onClick={onConfirm}>Xoá</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Field wrapper ───────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-slate-500 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
