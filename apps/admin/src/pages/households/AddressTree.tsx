import { useMemo, useState } from "react";
import { ChevronRight, MapPin, Users, User, AlertTriangle, Eye, Pencil } from "lucide-react";
import { Badge, Button, EmptyState } from "../../components/common/ui";
import type { Household, HouseholdMember } from "../../types";

// ─────────────────────────────────────────────────────────────────────────────
// CÂY DỮ LIỆU: ĐỊA CHỈ → HỘ GIA ĐÌNH → CHỦ HỘ → NHÂN KHẨU
//
// Cán bộ nhìn dữ liệu theo đúng thực địa: một địa chỉ có thể có nhiều hộ (nhà
// trọ, nhà nhiều thế hệ, hộ ghép). Các hộ cùng địa chỉ được tách riêng và phân
// biệt bằng thông tin chủ hộ, tránh bị gộp nhầm thành một hộ.
// ─────────────────────────────────────────────────────────────────────────────

/** Chuẩn hoá địa chỉ để gom nhóm: bỏ dấu, bỏ dấu câu, gộp khoảng trắng */
export function addressKey(address: string, hoodId: number): string {
  const norm = address
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0111/g, "d")
    .replace(/[.,\-–—_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `kp${hoodId}::${norm}`;
}

export type AddressGroup = {
  key: string;
  address: string;
  hoodId: number;
  items: Household[];
};

export function groupByAddress(households: Household[]): AddressGroup[] {
  const map = new Map<string, AddressGroup>();
  households.forEach((h) => {
    const key = addressKey(h.address, h.hoodId);
    const g = map.get(key);
    if (g) g.items.push(h);
    else map.set(key, { key, address: h.address, hoodId: h.hoodId, items: [h] });
  });
  return [...map.values()].sort(
    (a, b) => b.items.length - a.items.length || a.address.localeCompare(b.address, "vi")
  );
}

const STATUS_LABEL: Record<Household["status"], string> = {
  active: "Hộ thường trú",
  moved_out: "Đã chuyển đi",
  temp_absent: "Hộ tạm trú",
};
const STATUS_TONE: Record<Household["status"], string> = {
  active: "green",
  moved_out: "slate",
  temp_absent: "amber",
};

export function AddressTree({
  groups, hoodName, members, onViewMembers, onEdit,
}: {
  groups: AddressGroup[];
  hoodName: (id: number) => string;
  members: HouseholdMember[];
  onViewMembers: (h: Household) => void;
  onEdit: (h: Household) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const countOf = useMemo(() => {
    const m = new Map<string, number>();
    members.forEach((x) => m.set(x.householdId, (m.get(x.householdId) ?? 0) + 1));
    return m;
  }, [members]);

  if (groups.length === 0) {
    return (
      <div className="px-5 py-6">
        <EmptyState title="Không có địa chỉ nào" description="Thay đổi bộ lọc để xem thêm dữ liệu." />
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {groups.map((g) => {
        const multi = g.items.length > 1;
        const expanded = open[g.key] ?? multi;
        const people = g.items.reduce((s, h) => s + (countOf.get(h.id) ?? h.members), 0);

        return (
          <div key={g.key}>
            <button
              type="button"
              onClick={() => setOpen((cur) => ({ ...cur, [g.key]: !expanded }))}
              className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-slate-50/70 transition-colors"
            >
              <ChevronRight
                size={16}
                className={`mt-0.5 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`}
              />
              <MapPin size={16} className="mt-0.5 shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium text-slate-800">{g.address}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {hoodName(g.hoodId)} · {g.items.length} hộ · {people} nhân khẩu
                </p>
              </div>
              {multi && (
                <Badge tone="amber">
                  <AlertTriangle size={11} className="mr-1" /> {g.items.length} hộ cùng địa chỉ
                </Badge>
              )}
            </button>

            {expanded && (
              <div className="pb-3 pl-[52px] pr-5 space-y-2">
                {multi && (
                  <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Địa chỉ này có nhiều hộ. Phân biệt theo thông tin chủ hộ bên dưới, không gộp
                    thành một hộ.
                  </p>
                )}

                {g.items.map((h) => (
                  <div key={h.id} className="rounded-lg border border-slate-200 bg-white px-3.5 py-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <User size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] font-medium text-slate-800">{h.headName}</span>
                          <Badge tone="blue">Chủ hộ</Badge>
                          <Badge tone={STATUS_TONE[h.status]}>{STATUS_LABEL[h.status]}</Badge>
                        </div>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          {h.code} · {h.headPhone || "—"} · CCCD {h.headIdCard || "—"}
                        </p>
                        <p className="text-[12px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Users size={12} /> {countOf.get(h.id) ?? h.members} nhân khẩu
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" onClick={() => onViewMembers(h)}>
                          <Eye size={14} /> Nhân khẩu
                        </Button>
                        <button
                          type="button"
                          onClick={() => onEdit(h)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Chỉnh sửa hộ"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
