import { useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle, BadgeCheck, Check, CheckCircle2, ChevronDown,
  Clock, Home, Info, MapPin, Phone, ShieldCheck, User, UserPlus, Users, X,
} from "lucide-react";
import {
  NEIGHBORHOODS, detectHoodId, groupStyle, HOUSEHOLD_GROUPS, ROLE_REQUEST_LABEL,
  HOUSEHOLD_RELATIONS, HOUSEHOLD_STATUS, HOUSING_TYPES, addressKeyOf,
  type Household, type HouseholdRecord, type HouseholdRole, type RoleRequest,
} from "../../data";
import { useHouseholdRegistry } from "../../hooks/useAppStorage";
import { LocateButton } from "./LocateButton";

// ─────────────────────────────────────────────────────────────────────────────
// KHAI BÁO HỘ GIA ĐÌNH
//
// Luồng khai báo đi theo đúng thực tế quản lý nhân khẩu: HỘ GIA ĐÌNH gắn với
// ĐỊA CHỈ, mỗi hộ có một chủ hộ. Vì vậy bước đầu tiên luôn là chọn địa chỉ,
// sau đó mới hỏi người dân là chủ hộ hay thành viên.
//
// Toàn bộ form nằm trên MỘT màn hình, cuộn từ trên xuống:
//  1. Thông tin của bạn (họ tên, số điện thoại)
//  2. Vai trò: "Tôi là chủ hộ" / "Tôi là thành viên hộ"
//  3. Địa chỉ nơi ở + khu phố
//  4. Thông tin hộ (chủ hộ) hoặc chọn chủ hộ (thành viên)  5. Quan hệ với chủ hộ
//
//  TH1 - Chủ hộ khai báo trước:
//    → Khai thông tin hộ + thông tin chủ hộ → hệ thống tạo hộ gắn với địa chỉ.
//    → Thành viên khai sau tại cùng địa chỉ sẽ thấy tên chủ hộ để chọn.
//
//  TH2 - Nhân khẩu khai báo trước chủ hộ:
//    → Chọn "Tôi là thành viên hộ" nhưng không tìm thấy chủ hộ tại địa chỉ.
//    → Hệ thống báo "Chưa tìm thấy thông tin chủ hộ tại địa chỉ này..." và cho
//      2 lựa chọn: CHỜ chủ hộ khai báo (kết thúc, không tạo hộ, quay lại sau),
//      hoặc khai thay thông tin cơ bản của chủ hộ - khi đó hộ được tạo ở trạng
//      thái CHỜ CHỦ HỘ XÁC NHẬN.
// ─────────────────────────────────────────────────────────────────────────────

const label = "text-[12px] font-bold text-gray-700 mb-1.5 block";
const input =
  "w-full bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-[13px] outline-none focus:border-[#1565C0] transition-colors";
const primaryBtn =
  "flex-1 py-3.5 rounded-xl bg-[#1565C0] text-white text-[13px] font-bold shadow active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100";
const ghostBtn =
  "flex-1 py-3.5 rounded-xl border border-gray-200 bg-white text-[13px] font-bold text-gray-600 active:bg-gray-50";

const validPhone = (p: string) => /^0\d{8,10}$/.test(p.replace(/[\s.]/g, ""));

export function HouseholdForm({
  initial, onSubmit, onCancel, onMove,
}: {
  initial?: Household | null; onSubmit: (h: Household) => void;
  onCancel?: () => void;
  /** Người dân báo đã chuyển nơi ở → khai báo lại từ đầu */
  onMove?: () => void;
}) {
  // Sửa khai báo đã có thì không bắt người dân đi lại cả luồng - hiện form gọn.
  if (initial) return <EditForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} onMove={onMove} />;
  return <Wizard onSubmit={onSubmit} onCancel={onCancel} />;
}

// ═══ KHAI BÁO LẦN ĐẦU - TẤT CẢ TRÊN MỘT MÀN HÌNH ════════════════════════════
// Người dân cuộn một mạch từ trên xuống: địa chỉ → vai trò → thông tin → gửi.
// Các khối phía dưới chỉ hiện ra khi khối trên đã đủ dữ liệu, để form không
// trông quá dài và rối ngay từ đầu.
function Wizard({ onSubmit, onCancel }: { onSubmit: (h: Household) => void; onCancel?: () => void }) {
  const registry = useHouseholdRegistry();
  const [err, setErr] = useState("");

  // ── Địa chỉ ───────────────────────────────────────────────────────────────
  const [address, setAddress] = useState("");
  const [hoodId, setHoodId] = useState<number | "">("");
  const [touchedHood, setTouchedHood] = useState(false);

  // ── Vai trò ───────────────────────────────────────────────────────────────
  const [role, setRole] = useState<HouseholdRole | "">("");

  // ── Thông tin hộ (chủ hộ khai) ────────────────────────────────────────────
  const [size, setSize] = useState("");
  const [housingType, setHousingType] = useState(HOUSING_TYPES[0]);

  // ── Thông tin người khai ──────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [relation, setRelation] = useState(HOUSEHOLD_RELATIONS[0]);

  // ── Nhánh thành viên: chọn chủ hộ / chủ hộ chưa khai báo ──────────────────
  /** id hộ được chọn, hoặc "none" nghĩa là "chủ hộ chưa khai báo" */
  const [pickedId, setPickedId] = useState<string | "none" | null>(null);
  /** Khi chưa có chủ hộ: đề nghị chủ hộ khai báo, hay tự khai thay */
  const [noOwnerPath, setNoOwnerPath] = useState<"" | "wait" | "proxy">("");
  const [proxyName, setProxyName] = useState("");
  const [proxyPhone, setProxyPhone] = useState("");
  /** Người dân chọn kết thúc, chờ chủ hộ khai báo trước */
  const [waiting, setWaiting] = useState(false);

  const [result, setResult] = useState<{ record: HouseholdRecord; mine: Household } | null>(null);

  // Tự nhận diện khu phố khi người dân nhập địa chỉ
  useEffect(() => {
    if (touchedHood) return;
    const id = detectHoodId(address);
    if (id) setHoodId(id);
  }, [address, touchedHood]);

  const detected = !touchedHood && detectHoodId(address) !== null;
  /** Đã nhập xong họ tên + số điện thoại của người khai */
  const hasIdentity = !!name.trim() && validPhone(phone);
  const hasAddress = !!address.trim() && !!hoodId;

  const existing = useMemo(
    () => (hasAddress ? registry.findByAddress(address, Number(hoodId)) : []),
    [address, hoodId, hasAddress, registry.households] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const nearby = useMemo(
    () => (hasAddress ? registry.findNearby(address, Number(hoodId)) : []),
    [address, hoodId, hasAddress, registry.households] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Đổi địa chỉ thì lựa chọn chủ hộ cũ không còn đúng nữa - bỏ chọn cho sạch.
  useEffect(() => { setPickedId(null); setNoOwnerPath(""); }, [address, hoodId]);

  const picked = typeof pickedId === "string" && pickedId !== "none"
    ? existing.find((h) => h.id === pickedId) ?? null
    : null;
  /** Đang ở tình huống "chủ hộ chưa khai báo" */
  const noOwner = role === "member" && hasAddress && (existing.length === 0 || pickedId === "none");
  /** Người dân chọn tự khai thay thông tin chủ hộ */
  const proxying = noOwner && noOwnerPath === "proxy";
  /** Đã đủ điều kiện để hiện khối "Thông tin của bạn" */
  const showMemberInfo = role === "member" && (!!picked || proxying);

  // ── Gửi khai báo ──────────────────────────────────────────────────────────
  const submit = () => {
    // Thứ tự kiểm tra chạy đúng theo thứ tự các mục trên màn hình.
    if (!name.trim()) return setErr("Vui lòng nhập họ và tên của bạn");
    if (!validPhone(phone)) return setErr("Số điện thoại không hợp lệ (VD: 0901234567)");
    if (!role) return setErr("Vui lòng chọn vai trò của bạn trong hộ gia đình");
    if (!address.trim()) return setErr("Vui lòng nhập địa chỉ nơi ở");
    if (!hoodId) return setErr("Vui lòng chọn khu phố bạn đang sinh sống");

    // ══ TH1: CHỦ HỘ KHAI BÁO TRƯỚC ══════════════════════════════════════════
    if (role === "owner") {
      setErr("");

      // Nếu đã có nhân khẩu khai thay trước đó → chủ hộ chỉ xác nhận, không tạo trùng hộ.
      const pendingRec = existing.find((h) => h.status === "pending_owner");
      let record: HouseholdRecord;
      if (pendingRec) {
        record = {
          ...pendingRec,
          ownerName: name.trim(),
          ownerPhone: phone.trim(),
          size: size ? Number(size) : pendingRec.size,
          housingType,
          status: "active",
          members: pendingRec.members.map((m) => ({ ...m, status: "confirmed" as const })),
        };
        registry.update(pendingRec.id, record);
      } else {
        record = {
          id: `HO-${Date.now()}`,
          hoodId: Number(hoodId),
          address: address.trim(),
          addressKey: addressKeyOf(address, Number(hoodId)),
          ownerName: name.trim(),
          ownerPhone: phone.trim(),
          size: size ? Number(size) : undefined,
          housingType,
          status: "active",
          createdBy: "owner",
          createdAt: new Date().toISOString(),
          members: [],
        };
        registry.add(record);
      }

      return setResult({
        record,
        mine: {
          name: name.trim(), phone: phone.trim(), address: address.trim(),
          hoodId: Number(hoodId), role: "owner", groups,
          householdId: record.id, memberStatus: "confirmed",
        },
      });
    }

    // ══ TH2: NHÂN KHẨU KHAI BÁO ═════════════════════════════════════════════
    if (!picked && !proxying) {
      return setErr(
        existing.length > 0
          ? "Vui lòng chọn chủ hộ của bạn trong danh sách"
          : "Chưa có chủ hộ tại địa chỉ này. Hãy đề nghị chủ hộ khai báo trước, hoặc chọn khai báo thay thông tin chủ hộ."
      );
    }
    if (proxying) {
      if (!proxyName.trim()) return setErr("Vui lòng nhập họ tên chủ hộ");
      if (!validPhone(proxyPhone)) return setErr("Số điện thoại chủ hộ không hợp lệ (VD: 0901234567)");
    }
    setErr("");

    const me = { name: name.trim(), phone: phone.trim(), relation, status: "confirmed" as const };
    let record: HouseholdRecord;
    if (picked) {
      // Hộ đã có chủ hộ khai báo → liên kết ngay vào hộ.
      record = { ...picked, members: [...picked.members, me] };
      registry.update(picked.id, { members: record.members });
    } else {
      // Khai thay chủ hộ → hộ ở trạng thái chờ chủ hộ xác nhận.
      record = {
        id: `HO-${Date.now()}`,
        hoodId: Number(hoodId),
        address: address.trim(),
        addressKey: addressKeyOf(address, Number(hoodId)),
        ownerName: proxyName.trim(),
        ownerPhone: proxyPhone.trim(),
        status: "pending_owner",
        createdBy: "member",
        createdAt: new Date().toISOString(),
        members: [{ ...me, status: "pending" }],
      };
      registry.add(record);
    }

    setResult({
      record,
      mine: {
        name: name.trim(), phone: phone.trim(), address: address.trim(),
        hoodId: Number(hoodId), role: "member", groups,
        householdId: record.id,
        memberStatus: record.status === "pending_owner" ? "pending" : "confirmed",
      },
    });
  };

  // Chọn chờ chủ hộ khai báo → kết thúc, không tạo hộ nào cả
  if (waiting) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-4 text-white shadow-md shadow-amber-200">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Clock size={17} />
            </span>
            <p className="text-[14px] font-extrabold">Đã tạm dừng khai báo</p>
          </div>
          <p className="text-[12px] leading-relaxed text-white/90">
            Bạn chọn chờ chủ hộ khai báo trước. Khi chủ hộ hoàn tất, hãy mở lại mục Khai báo hộ gia
            đình và chọn tên chủ hộ để liên kết vào hộ.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2.5">
          <p className="text-[10.5px] font-bold tracking-wider text-gray-400">ĐỊA CHỈ BẠN ĐÃ NHẬP</p>
          <Row icon={<MapPin size={13} />} label="Địa chỉ" value={address} />
          <Row icon={<Home size={13} />} label="Khu phố" value={NEIGHBORHOODS[Number(hoodId) - 1]?.name ?? "—"} />
          <p className="text-[11px] text-gray-500 leading-snug pt-1 border-t border-gray-100">
            Chưa có hộ gia đình nào được tạo. Thông tin vừa nhập không được lưu lại.
          </p>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button onClick={() => { setWaiting(false); setNoOwnerPath(""); }} className={ghostBtn}>
            Quay lại khai báo
          </button>
          {onCancel && <button onClick={onCancel} className={primaryBtn}>Đóng</button>}
        </div>
      </div>
    );
  }

  // Khai báo xong → màn hình kết quả
  if (result) {
    return (
      <div className="px-4 py-4 space-y-4">
        <DoneCard result={result} onFinish={() => onSubmit(result.mine)} />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <PrivacyCard />

      {/* ═══ 1. THÔNG TIN CỦA BẠN ═════════════════════════════════════════ */}
      <Block num={1} icon={<User size={13} />} title="Thông tin của bạn"
        hint="Người đang khai báo. Nếu bạn là chủ hộ, đây cũng là thông tin chủ hộ của hộ gia đình.">
        <div>
          <label className={label}>Họ và tên <Req /></label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="VD: Nguyễn Văn An" className={input} />
        </div>
        <div>
          <label className={label}>Số điện thoại <Req /></label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel"
            placeholder="VD: 0901234567" className={input} />
        </div>
      </Block>

      {/* ═══ 2. VAI TRÒ ═══════════════════════════════════════════════════ */}
      <Block num={2} icon={<Users size={13} />} title="Vai trò của bạn trong hộ"
        hint="Mỗi hộ có một chủ hộ. Chủ hộ khai báo trước, thành viên khai sau sẽ chọn tên chủ hộ."
        disabled={!hasIdentity} disabledText="Nhập họ tên và số điện thoại ở mục 1 trước.">
        <RoleCard active={role === "owner"} onClick={() => setRole("owner")}
          icon={<Home size={18} />} title="Tôi là chủ hộ"
          desc="Khai thông tin hộ. Hệ thống tạo hộ gia đình gắn với địa chỉ bạn nhập ở mục 3." />
        <RoleCard active={role === "member"} onClick={() => setRole("member")}
          icon={<User size={18} />} title="Tôi là thành viên hộ"
          desc="Chọn chủ hộ đã khai báo tại địa chỉ của bạn để liên kết vào hộ." />
      </Block>

      {/* ═══ 3. ĐỊA CHỈ ═══════════════════════════════════════════════════ */}
      <Block num={3} icon={<MapPin size={13} />} title="Địa chỉ nơi ở"
        hint="Hộ gia đình được xác định theo địa chỉ. Hãy nhập đúng địa chỉ đang sinh sống."
        disabled={!role} disabledText="Chọn vai trò ở mục 2 trước.">
        <div>
          <label className={label}>Địa chỉ <Req /></label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
            placeholder="VD: 45/3 Đường số 7, KP 7, Phường Xuân Hoà"
            className={input + " resize-none"} />
          <p className="text-[10.5px] text-gray-400 mt-1">Ghi rõ số khu phố (VD: KP 7) để hệ thống tự nhận diện.</p>
          <LocateButton className="mt-2" onLocated={setAddress} />
        </div>

        <div>
          <label className={label}>Khu phố <Req /></label>
          <Select value={hoodId} onChange={(v) => { setTouchedHood(true); setHoodId(Number(v)); }}
            placeholder="-- Chọn khu phố --"
            options={NEIGHBORHOODS.map((n) => ({ value: n.id, label: n.name }))} />
          {detected && hoodId && (
            <p className="text-[11px] text-green-600 font-semibold mt-1.5 flex items-center gap-1">
              <CheckCircle2 size={12} /> Hệ thống tự nhận diện: {NEIGHBORHOODS[Number(hoodId) - 1].name}
            </p>
          )}
        </div>

        {hasAddress && existing.length > 0 && (
          <InfoCard tone="green" icon={<BadgeCheck size={15} />}
            title={`Địa chỉ này đã có ${existing.length} hộ khai báo`}
            text={`Chủ hộ: ${existing.map((h) => h.ownerName).join(", ")}.${
              role === "owner"
                ? ' Nếu bạn thuộc một trong các hộ này, hãy quay lại mục 2 và chọn "Tôi là thành viên hộ".'
                : " Chọn chủ hộ của bạn ở mục 4 bên dưới."
            }`} />
        )}
      </Block>

      {/* ═══ 4. THÔNG TIN HỘ (TH1 - chủ hộ khai báo) ══════════════════════ */}
      {role === "owner" && hasAddress && (
        <Block num={4} icon={<Home size={13} />} title="Thông tin hộ gia đình">
          {existing.some((h) => h.status === "pending_owner") && (
            <InfoCard tone="amber" icon={<Info size={15} />}
              title="Có người đã khai báo hộ thay bạn"
              text="Một nhân khẩu tại địa chỉ này đã tạo hộ và đang chờ chủ hộ xác nhận. Hoàn tất khai báo dưới đây để xác nhận và chính thức hoá hộ gia đình." />
          )}
          {existing.some((h) => h.status === "active") && (
            <InfoCard tone="blue" icon={<Info size={15} />}
              title="Địa chỉ này đã có hộ được xác lập"
              text={`Chủ hộ: ${existing.filter((h) => h.status === "active").map((h) => h.ownerName).join(", ")}. Nếu bạn thuộc hộ đó, hãy quay lại mục 2 và chọn "Tôi là thành viên hộ". Nếu đây là hộ riêng cùng địa chỉ, tiếp tục khai báo bình thường.`} />
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-3.5 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#1565C0]/10 text-[#1565C0] flex items-center justify-center shrink-0">
              <User size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold tracking-wider text-gray-400">CHỦ HỘ</p>
              <p className="text-[13.5px] font-extrabold text-gray-800 leading-tight">{name || "(chưa nhập)"}</p>
              <p className="text-[11.5px] text-gray-500">{phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={label}>Số nhân khẩu</label>
              <input value={size} onChange={(e) => setSize(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric" placeholder="VD: 4" className={input} />
            </div>
            <div>
              <label className={label}>Loại hình chỗ ở</label>
              <Select value={housingType} onChange={(v) => setHousingType(String(v))}
                options={HOUSING_TYPES.map((t) => ({ value: t, label: t }))} />
            </div>
          </div>
          <GroupPicker groups={groups} setGroups={setGroups} />
        </Block>
      )}

      {/* ═══ 4. CHỦ HỘ (TH2 - nhân khẩu khai báo) ═════════════════════════ */}
      {role === "member" && hasAddress && (
        <Block num={4} icon={<User size={13} />} title="Chủ hộ của bạn"
          hint={existing.length > 0 ? "Chọn chủ hộ đã khai báo tại địa chỉ bạn nhập." : undefined}>
          {/* Có chủ hộ đã khai báo → cho chọn */}
          {existing.length > 0 && (
            <div className="space-y-2.5">
              {existing.map((h) => (
                <button key={h.id} type="button" onClick={() => setPickedId(h.id)}
                  className={`w-full text-left rounded-2xl border p-3.5 transition-colors ${
                    pickedId === h.id ? "border-[#1565C0] bg-blue-50/60" : "border-gray-200 bg-white"
                  }`}>
                  <div className="flex items-start gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-[#1565C0]/10 text-[#1565C0] flex items-center justify-center shrink-0">
                      <User size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-extrabold text-gray-800 leading-tight">{h.ownerName}</p>
                      <p className="text-[11.5px] text-gray-500 mt-0.5 flex items-center gap-1">
                        <Phone size={11} /> {h.ownerPhone}
                      </p>
                      <p className="text-[11.5px] text-gray-500 leading-snug mt-0.5">{h.address}</p>
                      <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${HOUSEHOLD_STATUS[h.status].tone}`}>
                        {HOUSEHOLD_STATUS[h.status].label}
                      </span>
                    </div>
                    <Radio on={pickedId === h.id} />
                  </div>
                </button>
              ))}

              <button type="button" onClick={() => setPickedId("none")}
                className={`w-full text-left rounded-2xl border border-dashed p-3.5 transition-colors ${
                  pickedId === "none" ? "border-amber-400 bg-amber-100/70" : "border-amber-300 bg-amber-50/70"
                }`}>
                <div className="flex items-start gap-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-extrabold text-amber-800 flex items-center gap-1.5">
                      <AlertCircle size={14} /> Chủ hộ chưa khai báo
                    </p>
                    <p className="text-[11.5px] text-amber-700 leading-snug mt-0.5">
                      Không có tên chủ hộ của bạn trong danh sách trên.
                    </p>
                  </div>
                  <Radio on={pickedId === "none"} tone="amber" />
                </div>
              </button>
            </div>
          )}

          {/* Chưa có chủ hộ nào tại địa chỉ này */}
          {noOwner && (
            <>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertCircle size={15} />
                  </span>
                  <p className="text-[13px] font-extrabold text-amber-900">Chưa tìm thấy thông tin chủ hộ</p>
                </div>
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  Chưa tìm thấy thông tin chủ hộ tại địa chỉ này. Vui lòng đề nghị chủ hộ thực hiện
                  khai báo trước để xác định hộ gia đình.
                </p>
              </div>

              {nearby.length > 0 && (
                <InfoCard tone="blue" icon={<Info size={15} />}
                  title="Có thể bạn gõ thiếu/thừa so với địa chỉ đã khai"
                  text={`Tại khu phố này có hộ với địa chỉ gần giống: ${nearby.slice(0, 3).map((h) => `${h.address} (${h.ownerName})`).join("; ")}. Kiểm tra lại mục 3 nếu đúng là nhà bạn.`} />
              )}

              <p className="text-[12px] font-bold text-gray-700 pt-1">Bạn có thể chọn một trong hai cách:</p>

              <OptionCard active={noOwnerPath === "wait"} tone="gray"
                onClick={() => setNoOwnerPath("wait")}
                icon={<Clock size={14} />} title="Chờ chủ hộ khai báo"
                desc="Tạm dừng khai báo lần này. Khi chủ hộ khai xong, bạn mở lại và chọn tên chủ hộ." />
              {noOwnerPath === "wait" && (
                <div className="space-y-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[11.5px] text-gray-600 leading-snug">
                    Bạn sẽ kết thúc khai báo tại đây và quay lại sau khi chủ hộ hoàn tất. Thông tin
                    vừa nhập sẽ không được lưu.
                  </p>
                  <button type="button" onClick={() => setWaiting(true)}
                    className="w-full py-2.5 rounded-xl bg-[#1565C0] text-white text-[12px] font-bold active:scale-[0.98] transition-transform">
                    Đồng ý chờ, khai báo sau
                  </button>
                </div>
              )}

              <OptionCard active={noOwnerPath === "proxy"} tone="blue"
                onClick={() => setNoOwnerPath("proxy")}
                icon={<UserPlus size={14} />} title="Tôi khai báo thông tin chủ hộ"
                desc="Khai thông tin cơ bản của chủ hộ để tạo hộ tạm thời và liên kết bạn vào hộ. Hộ chỉ được xác lập sau khi chủ hộ xác nhận." />

              {proxying && (
                <div className="space-y-4 rounded-2xl border border-[#1565C0]/25 bg-blue-50/40 p-3.5">
                  <InfoCard tone="amber" icon={<ShieldCheck size={15} />}
                    title="Thông tin cần chủ hộ xác nhận"
                    text="Hộ tạo từ khai báo thay sẽ ở trạng thái “Chờ chủ hộ xác nhận”. Hệ thống gửi đề nghị xác nhận tới số điện thoại chủ hộ; cán bộ khu phố cũng đối chiếu trước khi xác lập hộ." />
                  <div>
                    <label className={label}>Họ và tên chủ hộ <Req /></label>
                    <input value={proxyName} onChange={(e) => setProxyName(e.target.value)}
                      placeholder="VD: Nguyễn Văn An" className={input} />
                  </div>
                  <div>
                    <label className={label}>Số điện thoại chủ hộ <Req /></label>
                    <input value={proxyPhone} onChange={(e) => setProxyPhone(e.target.value)} inputMode="tel"
                      placeholder="VD: 0901234567" className={input} />
                    <p className="text-[10.5px] text-gray-400 mt-1">Đề nghị xác nhận sẽ được gửi tới số này.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </Block>
      )}

      {/* ═══ 5. QUAN HỆ VỚI CHỦ HỘ (TH2) ═════════════════════════════════ */}
      {showMemberInfo && (
        <Block num={5} icon={<Users size={13} />} title="Bạn trong hộ này">
          <div className="rounded-2xl border border-gray-200 bg-white p-3.5 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#1565C0]/10 text-[#1565C0] flex items-center justify-center shrink-0">
              <Home size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold tracking-wider text-gray-400">CHỦ HỘ</p>
              <p className="text-[13.5px] font-extrabold text-gray-800 leading-tight">
                {picked ? picked.ownerName : proxyName || "(chưa nhập)"}
              </p>
            </div>
          </div>
          <div>
            <label className={label}>Quan hệ với chủ hộ <Req /></label>
            <Select value={relation} onChange={(v) => setRelation(String(v))}
              options={HOUSEHOLD_RELATIONS.map((r) => ({ value: r, label: r }))} />
          </div>
          <GroupPicker groups={groups} setGroups={setGroups} />
        </Block>
      )}

      <Err msg={err} />

      <div className="flex gap-2.5 pt-1">
        {onCancel && <button onClick={onCancel} className={ghostBtn}>Huỷ</button>}
        <button onClick={submit} className={primaryBtn}>
          {role === "owner" ? "Tạo hộ gia đình" : "Xác nhận khai báo"}
        </button>
      </div>
    </div>
  );
}

// ═══ MÀN HÌNH KẾT QUẢ ═══════════════════════════════════════════════════════
function DoneCard({
  result, onFinish,
}: { result: { record: HouseholdRecord; mine: Household }; onFinish: () => void }) {
  const { record, mine } = result;
  const pending = record.status === "pending_owner";

  return (
    <>
      <div className={`rounded-2xl p-4 text-white shadow-md ${
        pending ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-200"
                : "bg-gradient-to-br from-green-600 to-emerald-500 shadow-green-200"
      }`}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            {pending ? <ShieldCheck size={17} /> : <CheckCircle2 size={17} />}
          </span>
          <p className="text-[14px] font-extrabold">
            {pending ? "Đã gửi đề nghị xác nhận" : "Khai báo thành công"}
          </p>
        </div>
        <p className="text-[12px] leading-relaxed text-white/90">
          {pending
            ? "Hộ gia đình đã được tạo ở trạng thái chờ chủ hộ xác nhận. Sau khi chủ hộ mở ứng dụng và xác nhận, thông tin của bạn sẽ chính thức được ghi nhận vào hộ."
            : mine.role === "owner"
              ? "Hộ gia đình của bạn đã được tạo và gắn với địa chỉ trên. Các thành viên khai báo sau tại cùng địa chỉ sẽ thấy tên bạn để chọn."
              : "Bạn đã được liên kết vào hộ gia đình của chủ hộ tại địa chỉ trên."}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] font-bold tracking-wider text-gray-400">HỘ GIA ĐÌNH</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${HOUSEHOLD_STATUS[record.status].tone}`}>
            {HOUSEHOLD_STATUS[record.status].label}
          </span>
        </div>
        <Row icon={<Home size={13} />} label="Mã hộ" value={record.id} />
        <Row icon={<User size={13} />} label="Chủ hộ" value={record.ownerName} />
        <Row icon={<Phone size={13} />} label="SĐT chủ hộ" value={record.ownerPhone} />
        <Row icon={<MapPin size={13} />} label="Địa chỉ" value={record.address} />
        <Row icon={<Users size={13} />} label="Vai trò của bạn"
          value={mine.role === "owner" ? "Chủ hộ" : "Thành viên hộ"} />
        {mine.groups.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {mine.groups.map((g) => (
              <span key={g} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${groupStyle(g).chip}`}>
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      <button onClick={onFinish} className={primaryBtn + " w-full"}>Hoàn tất</button>
    </>
  );
}

// ═══ FORM SỬA KHAI BÁO (đã có hộ) ═══════════════════════════════════════════
// Ở đây chỉ sửa được thông tin CỦA CHÍNH MÌNH. Hai thứ xác định hộ gia đình -
// ĐỊA CHỈ và VAI TRÒ - không cho tự đổi bằng ô chọn:
//   · Đổi địa chỉ = chuyển sang hộ khác → phải khai báo lại hộ mới.
//   · Đổi vai trò = đổi người đại diện hộ → phải qua đề nghị và có bên kia
//     xác nhận (chủ hộ nhường quyền, hoặc thành viên xin làm chủ hộ).
function EditForm({
  initial, onSubmit, onCancel, onMove,
}: {
  initial: Household; onSubmit: (h: Household) => void;
  onCancel?: () => void; onMove?: () => void;
}) {
  const registry = useHouseholdRegistry();
  const record = registry.households.find((h) => h.id === initial.householdId) ?? null;

  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [groups, setGroups] = useState<string[]>(initial.groups ?? []);
  const [relation, setRelation] = useState(
    record?.members.find((m) => m.phone === initial.phone)?.relation ?? HOUSEHOLD_RELATIONS[0]
  );
  const [err, setErr] = useState("");

  // Panel đề nghị đổi vai trò
  const [rolePanel, setRolePanel] = useState(false);
  const [targetName, setTargetName] = useState("");
  const [sentRequest, setSentRequest] = useState<RoleRequest | null>(record?.roleRequest ?? null);

  const isOwner = initial.role === "owner";
  /** Thành viên khác trong hộ - ứng viên nhận vai trò chủ hộ */
  const candidates = (record?.members ?? []).filter((m) => m.phone !== initial.phone);
  /** Hộ do người khác khai thay, đang chờ chính mình xác nhận làm chủ hộ */
  const canClaimNow =
    !isOwner && !!record && record.status === "pending_owner" &&
    record.ownerPhone.replace(/[\s.]/g, "") === initial.phone.replace(/[\s.]/g, "");

  const submit = () => {
    if (!name.trim()) return setErr("Vui lòng nhập họ và tên");
    if (!validPhone(phone)) return setErr("Số điện thoại không hợp lệ (VD: 0901234567)");
    setErr("");

    // Đồng bộ lại tên/SĐT sang sổ hộ để cán bộ khu phố thấy đúng thông tin.
    if (record) {
      if (isOwner) {
        registry.update(record.id, { ownerName: name.trim(), ownerPhone: phone.trim() });
      } else {
        registry.update(record.id, {
          members: record.members.map((m) =>
            m.phone === initial.phone ? { ...m, name: name.trim(), phone: phone.trim(), relation } : m
          ),
        });
      }
    }

    onSubmit({ ...initial, name: name.trim(), phone: phone.trim(), groups });
  };

  // ── Thành viên xác nhận mình chính là chủ hộ (hộ do người khác khai thay) ──
  const confirmAsOwner = () => {
    if (!record) return;
    registry.update(record.id, {
      status: "active",
      ownerName: name.trim(),
      ownerPhone: phone.trim(),
      members: record.members
        .filter((m) => m.phone !== initial.phone)
        .map((m) => ({ ...m, status: "confirmed" as const })),
      roleRequest: undefined,
    });
    onSubmit({ ...initial, name: name.trim(), phone: phone.trim(), groups, role: "owner", memberStatus: "confirmed" });
  };

  // ── Gửi đề nghị đổi vai trò ───────────────────────────────────────────────
  const sendRoleRequest = () => {
    if (!record) return setErr("Không tìm thấy hộ gia đình tương ứng để gửi đề nghị");
    if (isOwner && !targetName) return setErr("Chọn thành viên sẽ nhận vai trò chủ hộ");
    const req: RoleRequest = {
      kind: isOwner ? "transfer" : "claim",
      requesterName: name.trim(),
      targetName: isOwner ? targetName : undefined,
      createdAt: new Date().toISOString(),
    };
    registry.update(record.id, { roleRequest: req });
    setSentRequest(req);
    setRolePanel(false);
    setErr("");
  };

  const cancelRoleRequest = () => {
    if (record) registry.update(record.id, { roleRequest: undefined });
    setSentRequest(null);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <PrivacyCard />

      {/* ── Hộ gia đình: chỉ xem ───────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] font-bold tracking-wider text-gray-400">HỘ GIA ĐÌNH</p>
          {record && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${HOUSEHOLD_STATUS[record.status].tone}`}>
              {HOUSEHOLD_STATUS[record.status].label}
            </span>
          )}
        </div>
        <Row icon={<User size={13} />} label="Chủ hộ" value={record?.ownerName ?? (isOwner ? initial.name : "—")} />
        <Row icon={<MapPin size={13} />} label="Địa chỉ" value={initial.address} />
        <Row icon={<Home size={13} />} label="Khu phố" value={NEIGHBORHOODS[initial.hoodId - 1]?.name ?? "—"} />
        <p className="text-[11px] text-gray-500 leading-snug pt-1 border-t border-gray-100">
          Địa chỉ gắn với hộ gia đình nên không sửa trực tiếp tại đây. Nếu bạn đã chuyển sang nơi ở
          khác, hãy khai báo lại để hệ thống xác định đúng hộ mới.
        </p>
        {onMove && (
          <button type="button" onClick={onMove}
            className="text-[12px] font-bold text-[#1565C0] underline underline-offset-2 active:opacity-60">
            Tôi đã chuyển nơi ở - khai báo lại
          </button>
        )}
      </section>

      {/* ── Vai trò: đổi qua đề nghị, không đổi trực tiếp ──────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] font-bold tracking-wider text-gray-400">VAI TRÒ TRONG HỘ</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isOwner ? "bg-blue-50 text-[#0D47A1] border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"
          }`}>
            {isOwner ? "Chủ hộ" : "Thành viên hộ"}
          </span>
        </div>

        {sentRequest ? (
          <>
            <InfoCard tone="amber" icon={<ShieldCheck size={15} />}
              title={ROLE_REQUEST_LABEL[sentRequest.kind]}
              text={sentRequest.kind === "transfer"
                ? `Đã gửi đề nghị chuyển vai trò chủ hộ cho ${sentRequest.targetName}. Vai trò chỉ đổi sau khi người đó và cán bộ khu phố xác nhận.`
                : "Đã gửi đề nghị làm chủ hộ. Chủ hộ hiện tại hoặc cán bộ khu phố sẽ xác nhận trước khi vai trò được đổi."} />
            <button type="button" onClick={cancelRoleRequest}
              className="text-[12px] font-bold text-gray-500 underline underline-offset-2 active:opacity-60">
              Thu hồi đề nghị
            </button>
          </>
        ) : canClaimNow ? (
          <>
            <InfoCard tone="amber" icon={<Info size={15} />}
              title="Bạn được khai báo là chủ hộ của hộ này"
              text="Một nhân khẩu trong hộ đã khai thay thông tin chủ hộ và đang chờ bạn xác nhận. Xác nhận để hộ được xác lập và bạn trở thành chủ hộ." />
            <button type="button" onClick={confirmAsOwner}
              className="w-full py-3 rounded-xl bg-[#1565C0] text-white text-[12.5px] font-bold active:scale-[0.98] transition-transform">
              Xác nhận tôi là chủ hộ
            </button>
          </>
        ) : (
          <>
            <p className="text-[11.5px] text-gray-500 leading-snug">
              {isOwner
                ? "Mỗi hộ chỉ có một chủ hộ. Muốn thôi làm chủ hộ, bạn cần chuyển vai trò cho một thành viên khác trong hộ và người đó xác nhận."
                : "Muốn làm chủ hộ, bạn gửi đề nghị để chủ hộ hiện tại hoặc cán bộ khu phố xác nhận. Vai trò không tự đổi được."}
            </p>

            {!rolePanel ? (
              <button type="button" onClick={() => setRolePanel(true)}
                className="text-[12px] font-bold text-[#1565C0] underline underline-offset-2 active:opacity-60">
                {isOwner ? "Chuyển vai trò chủ hộ" : "Đề nghị làm chủ hộ"}
              </button>
            ) : isOwner ? (
              candidates.length === 0 ? (
                <>
                  <InfoCard tone="amber" icon={<AlertCircle size={15} />}
                    title="Hộ chưa có thành viên nào khác"
                    text="Chưa ai trong hộ khai báo để nhận vai trò chủ hộ. Đề nghị các thành viên khai báo trước, hoặc liên hệ cán bộ khu phố nếu hộ có thay đổi nhân khẩu." />
                  <button type="button" onClick={() => setRolePanel(false)}
                    className="text-[12px] font-bold text-gray-500 underline underline-offset-2 active:opacity-60">
                    Đóng
                  </button>
                </>
              ) : (
                <div className="space-y-2.5 rounded-xl border border-[#1565C0]/25 bg-blue-50/40 p-3">
                  <div>
                    <label className={label}>Chuyển vai trò chủ hộ cho <Req /></label>
                    <Select value={targetName} onChange={setTargetName} placeholder="-- Chọn thành viên --"
                      options={candidates.map((m) => ({ value: m.name, label: `${m.name} · ${m.relation}` }))} />
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Sau khi gửi, bạn vẫn là chủ hộ cho tới khi người được chọn xác nhận.
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRolePanel(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-[12px] font-bold text-gray-600">
                      Huỷ
                    </button>
                    <button type="button" onClick={sendRoleRequest}
                      className="flex-1 py-2.5 rounded-xl bg-[#1565C0] text-white text-[12px] font-bold">
                      Gửi đề nghị
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-2.5 rounded-xl border border-[#1565C0]/25 bg-blue-50/40 p-3">
                <p className="text-[11.5px] text-gray-600 leading-snug">
                  Gửi đề nghị làm chủ hộ của hộ tại {initial.address}. Chủ hộ hiện tại
                  {record?.ownerName ? ` (${record.ownerName})` : ""} hoặc cán bộ khu phố sẽ xác nhận.
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRolePanel(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-[12px] font-bold text-gray-600">
                    Huỷ
                  </button>
                  <button type="button" onClick={sendRoleRequest}
                    className="flex-1 py-2.5 rounded-xl bg-[#1565C0] text-white text-[12px] font-bold">
                    Gửi đề nghị
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Thông tin cá nhân: sửa thoải mái ───────────────────────────── */}
      <SubTitle icon={<User size={13} />} text="Thông tin của bạn" />
      <div>
        <label className={label}>Họ và tên <Req /></label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Nguyễn Văn An" className={input} />
      </div>
      <div>
        <label className={label}>Số điện thoại <Req /></label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel"
          placeholder="VD: 0901234567" className={input} />
      </div>
      {!isOwner && (
        <div>
          <label className={label}>Quan hệ với chủ hộ <Req /></label>
          <Select value={relation} onChange={(v) => setRelation(String(v))}
            options={HOUSEHOLD_RELATIONS.map((r) => ({ value: r, label: r }))} />
        </div>
      )}
      <GroupPicker groups={groups} setGroups={setGroups} />

      <Err msg={err} />
      <div className="flex gap-2.5 pt-1">
        {onCancel && <button onClick={onCancel} className={ghostBtn}>Huỷ</button>}
        <button onClick={submit} className={primaryBtn}>Lưu thay đổi</button>
      </div>
    </div>
  );
}

// ═══ CÁC MẢNH GIAO DIỆN DÙNG LẠI ════════════════════════════════════════════
const Req = () => <span className="text-red-500">*</span>;

function Err({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
      <AlertCircle size={14} className="shrink-0" /> {msg}
    </div>
  );
}


/**
 * Một khối (mục) trong form: có số thứ tự, tiêu đề, mô tả ngắn. Khi chưa đủ
 * điều kiện (VD chưa nhập địa chỉ) thì khối bị mờ và khoá thao tác, nhưng vẫn
 * hiện trên màn hình để người dân thấy trước mình sẽ phải khai những gì.
 */
function Block({
  num, icon, title, hint, disabled, disabledText, children,
}: {
  num: number; icon: ReactNode; title: string; hint?: string;
  disabled?: boolean; disabledText?: string; children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-gray-200 bg-white/70 p-3.5 space-y-4 transition-opacity ${
      disabled ? "opacity-55" : ""
    }`}>
      <div className="flex items-start gap-2.5">
        <span className="w-6 h-6 rounded-lg bg-[#1565C0] text-white text-[12px] font-extrabold flex items-center justify-center shrink-0">
          {num}
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-extrabold text-gray-800 flex items-center gap-1.5 leading-tight">
            <span className="text-[#1565C0]">{icon}</span> {title}
          </p>
          {hint && <p className="text-[11.5px] text-gray-500 leading-snug mt-1">{hint}</p>}
          {disabled && disabledText && (
            <p className="text-[11.5px] text-amber-600 font-semibold leading-snug mt-1">{disabledText}</p>
          )}
        </div>
      </div>
      <div className={disabled ? "pointer-events-none select-none space-y-4" : "space-y-4"}>{children}</div>
    </section>
  );
}

function SubTitle({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <p className="text-[12.5px] font-extrabold text-gray-700 flex items-center gap-1.5 pt-1">
      <span className="text-[#1565C0]">{icon}</span> {text}
    </p>
  );
}

/** Nút chọn 1 trong nhiều phương án (dùng ở nhánh "chủ hộ chưa khai báo") */
function OptionCard({
  active, onClick, icon, title, desc, tone,
}: {
  active: boolean; onClick: () => void; icon: ReactNode;
  title: string; desc: string; tone: "gray" | "blue";
}) {
  const on = tone === "blue"
    ? "border-[#1565C0] bg-blue-50/70 text-[#0D47A1]"
    : "border-gray-400 bg-gray-50 text-gray-800";
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left rounded-2xl border p-3.5 transition-colors ${
        active ? on : "border-gray-200 bg-white text-gray-800"
      }`}>
      <div className="flex items-start gap-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-extrabold flex items-center gap-1.5">
            <span className={tone === "blue" ? "text-[#1565C0]" : "text-gray-500"}>{icon}</span> {title}
          </p>
          <p className="text-[11.5px] text-gray-500 leading-snug mt-0.5">{desc}</p>
        </div>
        <Radio on={active} tone={tone === "blue" ? "blue" : "gray"} />
      </div>
    </button>
  );
}

function Radio({ on, tone = "blue" }: { on: boolean; tone?: "blue" | "amber" | "gray" }) {
  const fill = { blue: "bg-[#1565C0] border-[#1565C0]", amber: "bg-amber-500 border-amber-500", gray: "bg-gray-600 border-gray-600" }[tone];
  return (
    <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
      on ? fill : "border-gray-300"
    }`}>
      {on && <Check size={12} className="text-white" />}
    </span>
  );
}

function PrivacyCard() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1565C0] to-[#1E88E5] p-4 shadow-md shadow-blue-200">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <CheckCircle2 size={16} className="text-white" />
        </span>
        <p className="text-[13px] font-extrabold text-white tracking-wide">THÔNG TIN CỦA BẠN ĐƯỢC BẢO MẬT</p>
      </div>
      <p className="text-[12px] text-blue-50 leading-relaxed">
        Thông tin bạn cung cấp giúp địa phương nắm bắt tình hình, cập nhật dữ liệu và hỗ trợ người dân tốt hơn.
        Vui lòng điền đầy đủ, chính xác thông tin. Dữ liệu sẽ được bảo mật và sử dụng đúng mục đích.
      </p>
    </div>
  );
}



function InfoCard({
  tone, icon, title, text,
}: { tone: "blue" | "amber" | "green"; icon: ReactNode; title: string; text: string }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-[#0D47A1]",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    green: "border-green-200 bg-green-50 text-green-800",
  }[tone];
  return (
    <div className={`rounded-2xl border p-3.5 ${tones}`}>
      <p className="text-[12.5px] font-extrabold flex items-center gap-1.5">{icon} {title}</p>
      <p className="text-[11.5px] leading-relaxed mt-1 opacity-90">{text}</p>
    </div>
  );
}

function RoleCard({
  active, onClick, icon, title, desc,
}: { active: boolean; onClick: () => void; icon: ReactNode; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-colors ${
        active ? "border-[#1565C0] bg-blue-50/60" : "border-gray-200 bg-white"
      }`}>
      <div className="flex items-start gap-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          active ? "bg-[#1565C0] text-white" : "bg-gray-100 text-gray-500"
        }`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-[14px] font-extrabold leading-tight ${active ? "text-[#0D47A1]" : "text-gray-800"}`}>{title}</p>
          <p className="text-[11.5px] text-gray-500 leading-snug mt-1">{desc}</p>
        </div>
        <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
          active ? "bg-[#1565C0] border-[#1565C0]" : "border-gray-300"
        }`}>
          {active && <Check size={12} className="text-white" />}
        </span>
      </div>
    </button>
  );
}

function Row({ icon, label: l, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-[12px] text-gray-600">
      <span className="text-[#1565C0] shrink-0 mt-0.5">{icon}</span>
      <span className="text-gray-400 w-[86px] shrink-0">{l}</span>
      <span className="font-semibold text-gray-800 leading-snug">{value}</span>
    </div>
  );
}

function Select({
  value, onChange, options, placeholder,
}: {
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={input + " appearance-none pr-9"}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

function GroupPicker({
  groups, setGroups,
}: { groups: string[]; setGroups: Dispatch<SetStateAction<string[]>> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Danh sách nhóm đối tượng thường tràn xuống dưới màn hình khi mở ở gần cuối
  // form - tự cuộn để thấy hết toàn bộ danh sách thay vì bị che khuất.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <div>
      <label className={label}>
        Nhóm đối tượng <span className="text-gray-400 font-normal">(có thể chọn nhiều)</span>
      </label>
      <div className="relative">
        <button type="button" onClick={() => setOpen((v) => !v)}
          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 pr-9 text-left transition-colors ${
            open ? "border-[#1565C0]" : "border-gray-200"
          }`}>
          {groups.length === 0 ? (
            <span className="text-[13px] text-gray-400">-- Chọn nhóm đối tượng --</span>
          ) : (
            <span className="flex flex-wrap gap-1.5">
              {groups.map((g) => {
                const st = groupStyle(g);
                return (
                  <span key={g}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${st.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {g}
                    <span onClick={(e) => { e.stopPropagation(); setGroups((cur) => cur.filter((x) => x !== g)); }}
                      className="ml-0.5 opacity-60 active:opacity-100">
                      <X size={11} />
                    </span>
                  </span>
                );
              })}
            </span>
          )}
          <ChevronDown size={16}
            className={`absolute right-3 top-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div ref={ref}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {HOUSEHOLD_GROUPS.map((g) => {
                const on = groups.includes(g.label);
                return (
                  <button key={g.label} type="button"
                    onClick={() => setGroups((cur) => (on ? cur.filter((x) => x !== g.label) : [...cur, g.label]))}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 border-b border-gray-100 last:border-0 active:bg-gray-50">
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      on ? "bg-[#1565C0] border-[#1565C0]" : "border-gray-300"
                    }`}>
                      {on && <Check size={11} className="text-white" />}
                    </span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${g.dot}`} />
                    <span className={`text-[13px] font-semibold ${on ? "text-[#1565C0]" : "text-gray-700"}`}>{g.label}</span>
                  </button>
                );
              })}
              <button type="button" onClick={() => setOpen(false)}
                className="w-full py-2.5 text-[12px] font-bold text-[#1565C0] bg-blue-50 active:opacity-70">
                Xong
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
