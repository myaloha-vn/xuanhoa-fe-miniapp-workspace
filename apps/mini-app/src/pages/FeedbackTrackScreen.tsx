import { useState } from "react";
import {
  Building2, Check, ChevronDown, Clock, Info, MapPin, User, Users, XCircle,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  FEEDBACKS, FEEDBACK_LEVEL, NEIGHBORHOODS, statusColor, statusDesc, statusLabel,
  type FeedbackItem,
} from "../data";
import { AppHeader } from "../components/shared/AppHeader";

// ─── SCREEN: THEO DÕI PHẢN ÁNH ───────────────────────────────────────────────
// Phản ánh xử lý 2 cấp: Trưởng khu phố (cấp 1) → UBND phường (cấp 2).
// Thanh tiến trình vì thế có 2 dạng:
//   · Xử lý gọn tại khu phố:  Mới gửi → Đã tiếp nhận → Đang xử lý → Đã xử lý
//   · Phải chuyển lên UBND:   ... → Chuyển UBND → Đã xử lý
// Mốc "Chuyển UBND" chỉ chen vào khi phản ánh thực sự bị đẩy lên cấp 2.
const HOOD_STEPS = ["pending", "assigned", "processing", "resolved"];
const UBND_STEPS = ["pending", "assigned", "forwarded", "processing", "resolved"];
const ALL_STATUSES = ["pending", "assigned", "processing", "forwarded", "resolved", "rejected"];

export default function FeedbackTrackScreen() {
  const navigate = useNavigate();
  const [showLegend, setShowLegend] = useState(false);

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      <div className="bg-[#1565C0] shrink-0">
        <AppHeader title="Theo dõi phản ánh" onBack={() => navigate("/feedback")} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: "none" }}>
        {/* Quy trình xử lý 2 cấp */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-[12.5px] font-extrabold text-gray-800 mb-2">Quy trình xử lý 2 cấp</p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex-1 rounded-lg bg-blue-50 border border-blue-100 px-2 py-2 text-center">
              <span className="block font-bold text-[#1565C0]">Cấp 1</span>
              <span className="text-gray-600">Trưởng khu phố</span>
            </span>
            <span className="text-gray-300 font-bold">→</span>
            <span className="flex-1 rounded-lg bg-violet-50 border border-violet-100 px-2 py-2 text-center">
              <span className="block font-bold text-violet-700">Cấp 2</span>
              <span className="text-gray-600">UBND phường</span>
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-snug mt-2">
            Phản ánh đi tới Trưởng khu phố bạn chọn khi gửi. Chỉ khi vượt thẩm quyền khu phố thì
            mới được chuyển lên UBND phường.
          </p>
        </div>

        {/* Chú giải ý nghĩa các trạng thái */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <button type="button" onClick={() => setShowLegend((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-3 active:bg-gray-50">
            <Info size={15} className="text-[#1565C0] shrink-0" />
            <span className="flex-1 text-left text-[12.5px] font-bold text-gray-700">Ý nghĩa các trạng thái</span>
            <ChevronDown size={15} className={`text-gray-400 shrink-0 transition-transform ${showLegend ? "rotate-180" : ""}`} />
          </button>
          {showLegend && (
            <div className="px-4 pb-3.5 pt-0.5 space-y-2.5 border-t border-gray-100">
              {ALL_STATUSES.map((s) => (
                <div key={s} className="flex items-start gap-2.5 pt-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${statusColor(s)}`}>
                    {statusLabel(s)}
                  </span>
                  <p className="text-[11.5px] text-gray-500 leading-snug">{statusDesc(s)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {FEEDBACKS.map((fb) => <FeedbackCard key={fb.id} fb={fb} />)}
      </div>
    </div>
  );
}

function FeedbackCard({ fb }: { fb: FeedbackItem }) {
  const [showHistory, setShowHistory] = useState(false);

  const isRejected = fb.status === "rejected";
  // Đã từng chuyển UBND thì thanh tiến trình có thêm mốc "Chuyển UBND"
  const escalated = fb.level === "ubnd" || fb.status === "forwarded"
    || !!fb.history?.some((e) => e.action.includes("Chuyển UBND"));
  const steps = escalated ? UBND_STEPS : HOOD_STEPS;
  const stepIdx = steps.indexOf(fb.status);
  const hood = fb.hoodId ? NEIGHBORHOODS[fb.hoodId - 1] : null;
  const level = fb.level ?? "hood";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 font-mono tracking-wide">#{fb.id}</span>
            <p className="text-[13.5px] font-extrabold text-gray-800 mt-0.5">{fb.type}</p>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${statusColor(fb.status)}`}>
            {statusLabel(fb.status)}
          </span>
        </div>
        <p className="text-[12px] text-gray-600 leading-relaxed">{fb.content}</p>
        <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1"><MapPin size={10} />{fb.address}</p>

        {/* Nơi đang xử lý - cấp 1 hay cấp 2 */}
        {!isRejected && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${FEEDBACK_LEVEL[level].tone}`}>
              {FEEDBACK_LEVEL[level].label}
            </span>
            {hood && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {hood.name}
              </span>
            )}
          </div>
        )}

        {/* Người tiếp nhận / được phân công */}
        {(fb.receiver || fb.assignee) && !isRejected && (
          <div className="mt-2.5 space-y-1">
            {fb.receiver && (
              <p className="text-[11.5px] text-gray-600 flex items-start gap-1.5">
                <User size={12} className="text-[#1565C0] shrink-0 mt-0.5" />
                Tiếp nhận: <span className="font-semibold text-gray-800">{fb.receiver}</span>
              </p>
            )}
            {fb.assignee && (
              <p className="text-[11.5px] text-gray-600 flex items-start gap-1.5">
                <Building2 size={12} className="text-violet-600 shrink-0 mt-0.5" />
                Phân công: <span className="font-semibold text-gray-800">{fb.assignee}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Nhánh từ chối: hiện lý do thay cho thanh tiến trình */}
      {isRejected ? (
        <div className="border-t border-gray-100 px-4 pt-3 pb-1">
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 mb-3">
            <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11.5px] font-bold text-red-700">Phản ánh không được tiếp nhận</p>
              {fb.note && <p className="text-[11px] text-red-600 leading-relaxed mt-0.5">{fb.note}</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-4 pt-3 pb-1">
          <div className="flex items-center">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  stepIdx >= i ? (s === "forwarded" ? "bg-indigo-500" : "bg-[#1565C0]") : "bg-gray-200"
                }`}>
                  {stepIdx >= i
                    ? <Check size={13} className="text-white" />
                    : <span className="text-[10px] text-gray-400 font-bold">{i + 1}</span>}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 transition-colors ${stepIdx > i ? "bg-[#1565C0]" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5 mb-3 gap-0.5">
            {steps.map((s, i) => (
              <span key={s} className={`text-[8.5px] font-semibold leading-tight text-center ${
                stepIdx >= i ? (s === "forwarded" ? "text-indigo-600" : "text-[#1565C0]") : "text-gray-400"
              }`}>
                {statusLabel(s)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Kết quả xử lý - công khai cho người dân */}
      {fb.result && (
        <div className="px-4 pb-3">
          <div className="rounded-xl bg-green-50 border border-green-100 p-3.5">
            <p className="text-[10px] font-extrabold tracking-wider text-green-700 flex items-center gap-1 mb-1.5">
              <Check size={11} /> KẾT QUẢ XỬ LÝ
            </p>
            <p className="text-[12px] text-gray-700 leading-relaxed">{fb.result}</p>
            {fb.resultImages && fb.resultImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2.5">
                {fb.resultImages.map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-green-200">
                    <img src={img} alt="Ảnh minh chứng kết quả" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lịch sử xử lý - ai làm gì, ở cấp nào, lúc nào */}
      {fb.history && fb.history.length > 0 && (
        <div className="px-4 pb-1">
          <button type="button" onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center gap-1.5 py-2 active:opacity-60">
            <Users size={13} className="text-gray-400 shrink-0" />
            <span className="flex-1 text-left text-[11.5px] font-bold text-gray-600">
              Lịch sử xử lý ({fb.history.length} mốc)
            </span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>

          {showHistory && (
            <div className="pb-2 pl-1 space-y-0">
              {fb.history.map((e, i) => {
                const dotTone = e.level === "citizen" ? "bg-gray-400"
                  : e.level === "ubnd" ? "bg-violet-500" : "bg-[#1565C0]";
                const last = i === fb.history!.length - 1;
                return (
                  <div key={i} className="flex gap-2.5">
                    <div className="flex flex-col items-center shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${dotTone}`} />
                      {!last && <span className="w-px flex-1 bg-gray-200 my-1" />}
                    </div>
                    <div className={`min-w-0 ${last ? "pb-1" : "pb-3"}`}>
                      <p className="text-[11.5px] font-semibold text-gray-800 leading-snug">{e.action}</p>
                      <p className="text-[10.5px] text-gray-500 mt-0.5">{e.by} · {e.at}</p>
                      {e.note && (
                        <p className="text-[11px] text-gray-600 leading-snug mt-1 rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1.5">
                          {e.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="px-4 pb-3">
        <p className="text-[10.5px] text-gray-400 flex items-center gap-1.5">
          <Clock size={10} /> Ngày gửi: {fb.date}
        </p>
      </div>
    </div>
  );
}
