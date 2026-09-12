import { useMemo, useState, useRef, useEffect } from "react";
import {
  Home, Pencil, Trash2, Save, X, Upload, ChevronDown, Download, Eye,
  Info, List, MapPin, ArrowRightLeft,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardHeader, Badge, Button } from "../../components/common/ui";
import { DataTable, type Column } from "../../components/common/DataTable";
import { FilterBar, SearchInput, Select } from "../../components/common/Filters";
import { useToast } from "../../components/common/Overlays";
import { useScopedHouseholds } from "../../hooks/useScoped";
import { useTable } from "../../services/store";
import { fmtDate } from "../../utils/format";
import { AddressTree, groupByAddress, addressKey } from "./AddressTree";
import type { Household, HouseholdMember } from "../../types";

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
  const [allMembers, setAllMembers] = useTable("householdMembers");
  const [view, setView] = useState<"address" | "list">("address");
  const [q, setQ] = useState("");
  const [hoodFilter, setHoodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<Household | null>(null);
  const [deleting, setDeleting] = useState<Household | null>(null);
  const [viewingMembers, setViewingMembers] = useState<Household | null>(null);
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

  const groups = useMemo(() => groupByAddress(rows), [rows]);

  /**
   * Chuyển một nhân khẩu sang hộ khác đã được ghi nhận.
   * Đây là thao tác sắp xếp dữ liệu quản lý (khai báo nhầm hộ), không phải
   * nghiệp vụ tách hộ / nhập hộ. Vì vậy không cho chuyển bản ghi chủ hộ:
   * muốn đổi chủ hộ thì sửa trực tiếp trong thông tin hộ.
   */
  const handleMoveMember = (index: number, targetId: string) => {
    const m = allMembers[index];
    if (!m || m.householdId === targetId) return;
    if (m.relation === "Chủ hộ") {
      toast("Không chuyển được bản ghi chủ hộ. Hãy sửa thông tin chủ hộ trong hộ tương ứng.");
      return;
    }
    const fromId = m.householdId;
    const next = allMembers.map((x, i) => (i === index ? { ...x, householdId: targetId } : x));
    setAllMembers(next);

    // Cập nhật lại số nhân khẩu của hai hộ bị ảnh hưởng cho khớp danh sách.
    const countIn = (id: string) => next.filter((x) => x.householdId === id).length;
    setAllHouseholds(allHouseholds.map((h) =>
      h.id === fromId ? { ...h, members: countIn(fromId) }
        : h.id === targetId ? { ...h, members: countIn(targetId) }
        : h
    ));

    const target = allHouseholds.find((h) => h.id === targetId);
    toast(`Đã chuyển ${m.fullName} sang hộ ${target?.headName ?? targetId}`);
  };

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

  const handleChangeHood = (householdId: string, newHoodId: number) => {
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
          id: `HH${Date.now()}${idx}`,
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
      key: "headName",
      header: "Tên chủ hộ",
      mobile: "title",
      render: (r) => (
        <div>
          <span className="font-medium text-slate-800">{r.headName}</span>
          <p className="text-[12px] text-slate-500 mt-0.5">{r.code}</p>
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
            onClick={() => setViewingMembers(r)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Xem thành viên"
          >
            <Eye size={15} />
          </button>
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
      {/* Phạm vi module - nói rõ đây là dữ liệu quản lý, không phải hồ sơ cư trú */}
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-[12.5px] leading-relaxed text-blue-900">
          Dữ liệu được tổ chức theo Địa chỉ → Hộ gia đình → Chủ hộ → Nhân khẩu, phục vụ tra cứu,
          thống kê và nắm tình hình dân cư. Module chỉ quản lý và thống kê tương đối, không thực
          hiện các nghiệp vụ cư trú chính thức như tách hộ, nhập hộ hay xác nhận quan hệ cư trú.
        </p>
      </div>

      <Card>
        <CardHeader
          title={view === "address" ? "Dân cư theo địa chỉ" : "Danh sách hộ gia đình"}
          icon={<Home size={16} className="text-blue-600" />}
          action={
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-slate-500 whitespace-nowrap">
                {view === "address" ? `${groups.length} địa chỉ · ${rows.length} hộ` : `Tổng: ${rows.length} hộ`}
              </span>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button type="button" onClick={() => setView("address")}
                  className={`inline-flex items-center gap-1.5 px-2.5 h-8 text-[12.5px] transition-colors ${
                    view === "address" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}>
                  <MapPin size={13} /> Theo địa chỉ
                </button>
                <button type="button" onClick={() => setView("list")}
                  className={`inline-flex items-center gap-1.5 px-2.5 h-8 text-[12.5px] border-l border-slate-200 transition-colors ${
                    view === "list" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}>
                  <List size={13} /> Danh sách hộ
                </button>
              </div>
            </div>
          }
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
        {view === "address" ? (
          <AddressTree
            groups={groups}
            hoodName={hoodName}
            members={allMembers}
            onViewMembers={setViewingMembers}
            onEdit={setEditing}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            emptyTitle="Không có hộ gia đình nào"
            emptyDescription="Thay đổi bộ lọc để xem thêm dữ liệu."
            pageSizeOptions={[20, 50, 100]}
          />
        )}
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

      {viewingMembers && (
        <MembersModal
          household={viewingMembers}
          entries={allMembers
            .map((m, index) => ({ m, index }))
            .filter((e) => e.m.householdId === viewingMembers.id)}
          targets={allHouseholds.filter((h) => h.id !== viewingMembers.id)}
          sameAddressKey={addressKey(viewingMembers.address, viewingMembers.hoodId)}
          hoodName={hoodName}
          onMove={handleMoveMember}
          onClose={() => setViewingMembers(null)}
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

/* ─── Modal xem thành viên hộ gia đình ─────────────────────────────────────── */

function MembersModal({
  household,
  entries,
  targets,
  sameAddressKey,
  hoodName,
  onMove,
  onClose,
}: {
  household: Household;
  entries: { m: HouseholdMember; index: number }[];
  /** Các hộ khác có thể nhận nhân khẩu chuyển sang */
  targets: Household[];
  sameAddressKey: string;
  hoodName: (id: number) => string;
  onMove: (index: number, targetId: string) => void;
  onClose: () => void;
}) {
  const [moving, setMoving] = useState<number | null>(null);
  const [target, setTarget] = useState("");

  // Ưu tiên các hộ cùng địa chỉ - đây là tình huống khai nhầm hộ hay gặp nhất.
  const sameAddress = targets.filter((h) => addressKey(h.address, h.hoodId) === sameAddressKey);
  const sameHood = targets.filter(
    (h) => h.hoodId === household.hoodId && addressKey(h.address, h.hoodId) !== sameAddressKey
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-800">
              Thành viên hộ: {household.headName}
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {household.code} — {household.address}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-3">
          {entries.length === 0 ? (
            <p className="text-[13px] text-slate-500 text-center py-8">Không có dữ liệu nhân khẩu</p>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-2 font-semibold text-slate-500 text-[11.5px] uppercase">STT</th>
                  <th className="text-left py-2 px-2 font-semibold text-slate-500 text-[11.5px] uppercase">Họ tên</th>
                  <th className="text-left py-2 px-2 font-semibold text-slate-500 text-[11.5px] uppercase">Quan hệ</th>
                  <th className="text-left py-2 px-2 font-semibold text-slate-500 text-[11.5px] uppercase">SĐT</th>
                  <th className="text-left py-2 px-2 font-semibold text-slate-500 text-[11.5px] uppercase">Ngày sinh</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-500 text-[11.5px] uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(({ m, index }, idx) => {
                  const isHead = m.relation === "Chủ hộ";
                  return (
                    <tr key={index} className="border-b border-slate-50 align-top hover:bg-slate-50/50">
                      <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2 font-medium text-slate-800">{m.fullName}</td>
                      <td className="py-2 px-2 text-slate-600">
                        {isHead ? <Badge tone="blue">Chủ hộ</Badge> : m.relation}
                      </td>
                      <td className="py-2 px-2 text-slate-600">{m.phone || "—"}</td>
                      <td className="py-2 px-2 text-slate-600">{fmtDate(m.dob)}</td>
                      <td className="py-2 px-2">
                        {isHead ? (
                          <p className="text-[11.5px] text-slate-400 text-right">Không chuyển chủ hộ</p>
                        ) : moving === index ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <select
                              value={target}
                              onChange={(e) => setTarget(e.target.value)}
                              className="w-full max-w-[230px] px-2 py-1.5 text-[12.5px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            >
                              <option value="">-- Chọn hộ nhận --</option>
                              {sameAddress.length > 0 && (
                                <optgroup label="Cùng địa chỉ">
                                  {sameAddress.map((h) => (
                                    <option key={h.id} value={h.id}>{h.headName} · {h.code}</option>
                                  ))}
                                </optgroup>
                              )}
                              {sameHood.length > 0 && (
                                <optgroup label={hoodName(household.hoodId)}>
                                  {sameHood.slice(0, 100).map((h) => (
                                    <option key={h.id} value={h.id}>{h.headName} · {h.address}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                            <div className="flex gap-1.5">
                              <Button variant="ghost" onClick={() => { setMoving(null); setTarget(""); }}>Huỷ</Button>
                              <Button
                                onClick={() => { if (target) { onMove(index, target); setMoving(null); setTarget(""); } }}
                              >
                                Chuyển
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <Button variant="ghost" onClick={() => { setMoving(index); setTarget(""); }}>
                              <ArrowRightLeft size={13} /> Chuyển hộ
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500 border-t border-slate-100 pt-3">
            Chuyển nhân khẩu ở đây là thao tác sắp xếp lại dữ liệu khi khai báo chưa đúng hộ.
            Đây không phải nghiệp vụ tách hộ, nhập hộ hay xác nhận quan hệ cư trú.
          </p>
        </div>

        <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 shrink-0">
          <Button variant="ghost" onClick={onClose}>Đóng</Button>
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
