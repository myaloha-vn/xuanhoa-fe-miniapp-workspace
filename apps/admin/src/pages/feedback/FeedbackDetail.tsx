import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, ArrowUpRight, Building2, CheckCircle2, ClipboardCheck, ImagePlus, MapPin, Phone,
  Send, UserPlus, Users, AlertTriangle, XCircle,
} from "lucide-react";
import { Card, CardHeader, StatusBadge, PriorityBadge, Badge, Button, ErrorState } from "../../components/common/ui";
import { ConfirmDialog, RightDrawer, useToast } from "../../components/common/Overlays";
import { Allow } from "../../components/common/Guards";
import { useAuth } from "../../services/auth";
import { pushLog, useTable } from "../../services/store";
import { fmtDate, fmtDateTime, slaState, daysLeft } from "../../utils/format";
import type { Feedback, FeedbackStatus } from "../../types";

export default function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, hoodScope } = useAuth();
  const [feedbacks, setFeedbacks] = useTable("feedbacks");
  const [users] = useTable("users");

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [note, setNote] = useState("");
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState("");
  const [confirmDone, setConfirmDone] = useState(false);
  const [result, setResult] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardReason, setForwardReason] = useState("");
  const [resultOpen, setResultOpen] = useState(false);
  const [resultImages, setResultImages] = useState<string[]>([]);

  const fb = feedbacks.find((f) => f.id === id);
  if (!fb) return <ErrorState message="Không tìm thấy phản ánh." />;
  if (hoodScope && fb.hoodId !== hoodScope) {
    return <ErrorState message="Phản ánh này không thuộc khu phố bạn phụ trách." />;
  }

  const update = (patch: Partial<Feedback>, action: string, noteText?: string) => {
    const next = feedbacks.map((f) =>
      f.id === fb.id
        ? {
            ...f, ...patch,
            timeline: [...f.timeline, { at: new Date().toISOString(), by: user?.fullName ?? "Cán bộ", action, note: noteText }],
          }
        : f
    );
    setFeedbacks(next);
    if (user) pushLog(user.id, action.toLowerCase(), fb.code, fb.hoodId);
  };

  const sla = slaState(fb.dueAt, fb.status);
  const left = daysLeft(fb.dueAt);

  // ── Cấp đang xử lý ────────────────────────────────────────────────────────
  // Cấp 1 là Trưởng khu phố (tài khoản có phạm vi khu phố), cấp 2 là công chức
  // UBND phường. Mỗi cấp chỉ thao tác khi hồ sơ đang nằm ở cấp của mình.
  const level = fb.level ?? "hood";
  const atHood = level === "hood";
  const isHoodOfficer = !!hoodScope;
  const canAct = atHood ? isHoodOfficer : !isHoodOfficer;
  const closed = fb.status === "resolved" || fb.status === "rejected";

  const STATUS_FLOW: { key: FeedbackStatus; label: string }[] = atHood
    ? [
        { key: "pending_review", label: "Mới gửi" },
        { key: "pending", label: "Đã tiếp nhận" },
        { key: "processing", label: "Khu phố xử lý" },
        { key: "resolved", label: "Đã đóng" },
      ]
    : [
        { key: "forwarded", label: "Chuyển UBND" },
        { key: "pending", label: "UBND tiếp nhận" },
        { key: "processing", label: "Đang xử lý" },
        { key: "resolved", label: "Đã đóng" },
      ];
  const activeIdx = Math.max(0, STATUS_FLOW.findIndex((s) => s.key === fb.status));

  return (
    <>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate("/workspace/feedback")}>
          Quay lại
        </Button>
        <span className="font-mono text-[13px] text-slate-500">{fb.code}</span>
        <StatusBadge status={fb.status} kind="feedback" />
        <PriorityBadge priority={fb.priority} />
      </div>

      {/* Cấp đang xử lý - ai là người có quyền thao tác lúc này */}
      <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px] ${
        atHood ? "border-blue-200 bg-blue-50 text-blue-900" : "border-violet-200 bg-violet-50 text-violet-900"
      }`}>
        {atHood ? <Users size={16} className="mt-0.5 shrink-0" /> : <Building2 size={16} className="mt-0.5 shrink-0" />}
        <div className="min-w-0">
          <p className="font-medium">
            {atHood
              ? `Cấp 1 - Trưởng Khu phố ${fb.hoodId} đang phụ trách`
              : "Cấp 2 - UBND phường đang phụ trách"}
          </p>
          {!atHood && fb.forwardReason && (
            <p className="text-[12.5px] leading-relaxed mt-1">
              Lý do chuyển từ khu phố: {fb.forwardReason}
              {fb.forwardedBy ? ` (${fb.forwardedBy}${fb.forwardedAt ? `, ${fmtDateTime(fb.forwardedAt)}` : ""})` : ""}
            </p>
          )}
          {!canAct && !closed && (
            <p className="text-[12.5px] leading-relaxed mt-1">
              Tài khoản của bạn chỉ theo dõi hồ sơ này, thao tác xử lý thuộc về cấp đang phụ trách.
            </p>
          )}
        </div>
      </div>

      {sla !== "ok" && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-[13px] ${
          sla === "overdue" ? "border-red-200 bg-red-50 text-red-700" : "border-orange-200 bg-orange-50 text-orange-700"
        }`}>
          <AlertTriangle size={16} className="shrink-0" />
          {sla === "overdue"
            ? `Hồ sơ đã quá hạn ${-left} ngày so với thời hạn xử lý ${fmtDate(fb.dueAt)}.`
            : `Hồ sơ sắp đến hạn xử lý, còn ${left} ngày (hạn ${fmtDate(fb.dueAt)}).`}
          {!fb.assigneeId && " Hồ sơ chưa được phân công."}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <CardHeader title={fb.summary} />
            <div className="px-5 py-4 space-y-4">
              <p className="text-[13.5px] text-slate-700 leading-relaxed">{fb.content}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fb.images.map((src, i) => (
                  <img key={i} src={src} alt="" className="w-full h-32 rounded-lg object-cover border border-slate-100" />
                ))}
              </div>
              <div className="flex items-start gap-2 text-[13px] text-slate-600">
                <MapPin size={15} className="text-blue-600 shrink-0 mt-0.5" /> {fb.address}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Tiến trình xử lý" icon={<ClipboardCheck size={16} className="text-blue-600" />} />
            <div className="px-5 py-4">
              {fb.status === "rejected" ? (
                <div className="flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full text-[12px] font-medium border bg-red-50 text-red-700 border-red-200 w-fit">
                  <XCircle size={14} /> Đã từ chối tiếp nhận
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mb-5">
                  {STATUS_FLOW.map((s, i) => (
                    <span key={s.key}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-medium border ${
                        i <= activeIdx ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-400 border-slate-200"
                      }`}>
                      {s.label}
                    </span>
                  ))}
                </div>
              )}
              <ol className="space-y-4">
                {fb.timeline.map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1 w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-800">{t.action}</p>
                      {t.note && <p className="text-[12.5px] text-slate-600 mt-0.5">{t.note}</p>}
                      <p className="text-[11.5px] text-slate-400 mt-0.5">{t.by} · {fmtDateTime(t.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Thông tin hồ sơ" />
            <dl className="px-5 py-4 space-y-3 text-[13px]">
              {[
                ["Lĩnh vực", fb.field],
                ["Khu phố", `Khu phố ${fb.hoodId}`],
                ["Tiếp nhận", fmtDateTime(fb.createdAt)],
                ["Hạn xử lý", fmtDate(fb.dueAt)],
                ["Đơn vị xử lý", fb.unit ?? "Chưa phân công"],
                ["Người phụ trách", users.find((u) => u.id === fb.assigneeId)?.fullName ?? "Chưa phân công"],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-3">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-slate-800 font-medium text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Allow module="feedback" action="edit">
            <Card>
              <CardHeader title="Người gửi" />
              <div className="px-5 py-4 space-y-2 text-[13px]">
                <p className="font-medium text-slate-800">{fb.senderName}</p>
                <a href={`tel:${fb.senderPhone}`} className="flex items-center gap-2 text-blue-600">
                  <Phone size={14} /> {fb.senderPhone}
                </a>
                <p className="text-slate-500 leading-snug">{fb.address}</p>
              </div>
            </Card>
          </Allow>

          {!closed && canAct && (
            <Allow module="feedback" action="edit">
              <Card>
                <CardHeader title={atHood ? "Thao tác cấp khu phố" : "Thao tác cấp UBND"} />
                <div className="px-5 py-4 flex flex-col gap-2">
                  {/* ── CẤP 1: TRƯỞNG KHU PHỐ ─────────────────────────── */}
                  {atHood && (
                    <>
                      {fb.status === "pending_review" && (
                        <Allow module="feedback" action="approve">
                          <Button icon={<CheckCircle2 size={15} />}
                            onClick={() => { update({ status: "pending" }, "Trưởng khu phố tiếp nhận phản ánh"); toast("Đã tiếp nhận phản ánh"); }}>
                            Tiếp nhận phản ánh
                          </Button>
                          <Button variant="danger" icon={<XCircle size={15} />} onClick={() => setRejectOpen(true)}>
                            Từ chối tiếp nhận
                          </Button>
                        </Allow>
                      )}
                      {fb.status === "pending" && (
                        <Button icon={<Send size={15} />}
                          onClick={() => { update({ status: "processing" }, "Khu phố bắt đầu xử lý"); toast("Đã chuyển sang Đang xử lý"); }}>
                          Bắt đầu xử lý tại khu phố
                        </Button>
                      )}
                      {(fb.status === "pending" || fb.status === "processing") && (
                        <>
                          <Button variant="secondary" icon={<ImagePlus size={15} />} onClick={() => setResultOpen(true)}>
                            Cập nhật kết quả + hình ảnh
                          </Button>
                          <Button icon={<CheckCircle2 size={15} />} onClick={() => setConfirmDone(true)}>
                            Đóng phản ánh
                          </Button>
                          <Button variant="secondary" icon={<ArrowUpRight size={15} />} onClick={() => setForwardOpen(true)}>
                            Chuyển UBND phường
                          </Button>
                        </>
                      )}
                    </>
                  )}

                  {/* ── CẤP 2: CÔNG CHỨC UBND ─────────────────────────── */}
                  {!atHood && (
                    <>
                      {fb.status === "forwarded" && (
                        <Button icon={<CheckCircle2 size={15} />}
                          onClick={() => { update({ status: "pending" }, "UBND phường tiếp nhận phản ánh từ khu phố"); toast("Đã tiếp nhận từ khu phố"); }}>
                          Tiếp nhận từ khu phố
                        </Button>
                      )}
                      {(fb.status === "pending" || fb.status === "processing") && (
                        <Button variant="secondary" icon={<UserPlus size={15} />} onClick={() => setAssignOpen(true)}>
                          {fb.assigneeId ? "Phân công lại" : "Phân công xử lý"}
                        </Button>
                      )}
                      {fb.status === "processing" && (
                        <Button variant="secondary" icon={<Send size={15} />} onClick={() => setProgressOpen(true)}>
                          Cập nhật tiến độ
                        </Button>
                      )}
                      {(fb.status === "pending" || fb.status === "processing") && (
                        <>
                          <Button variant="secondary" icon={<ImagePlus size={15} />} onClick={() => setResultOpen(true)}>
                            Cập nhật kết quả + hình ảnh
                          </Button>
                          <Button icon={<CheckCircle2 size={15} />} onClick={() => setConfirmDone(true)}>
                            Đóng phản ánh
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </Allow>
          )}

          {fb.result && (
            <Card>
              <CardHeader title={fb.status === "rejected" ? "Lý do từ chối" : "Kết quả xử lý"} />
              <div className="px-5 py-4 space-y-3">
                <p className="text-[13px] text-slate-700 leading-relaxed">{fb.result}</p>
                {fb.resultImages && fb.resultImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {fb.resultImages.map((src, i) => (
                      <img key={i} src={src} alt="Ảnh minh chứng kết quả"
                        className="w-full h-24 rounded-lg object-cover border border-slate-100" />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      <RightDrawer open={assignOpen} title="Phân công xử lý" onClose={() => setAssignOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignOpen(false)}>Huỷ</Button>
            <Button disabled={!assignee}
              onClick={() => {
                const u = users.find((x) => x.id === assignee);
                update({ assigneeId: assignee, unit: u?.unit ?? null, status: "processing" }, `Phân công cho ${u?.fullName}`, note);
                setAssignOpen(false); setNote("");
                toast("Đã phân công xử lý");
              }}>
              Xác nhận phân công
            </Button>
          </>
        }>
        <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">Cán bộ xử lý <span className="text-red-500">*</span></label>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)}
          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-blue-500">
          <option value="">-- Chọn cán bộ --</option>
          {users.filter((u) => u.status === "active").map((u) => (
            <option key={u.id} value={u.id}>{u.fullName} - {u.unit}</option>
          ))}
        </select>
        <label className="block text-[12.5px] font-medium text-slate-700 mt-4 mb-1.5">Ghi chú phân công</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-500 resize-none"
          placeholder="Nội dung yêu cầu cán bộ xử lý..." />
      </RightDrawer>

      <RightDrawer open={progressOpen} title="Cập nhật tiến độ" onClose={() => setProgressOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setProgressOpen(false)}>Huỷ</Button>
            <Button disabled={!progress.trim()}
              onClick={() => {
                update({ status: "processing" }, "Cập nhật tiến độ xử lý", progress);
                setProgress(""); setProgressOpen(false);
                toast("Đã cập nhật tiến độ");
              }}>
              Lưu cập nhật
            </Button>
          </>
        }>
        <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">Nội dung tiến độ <span className="text-red-500">*</span></label>
        <textarea value={progress} onChange={(e) => setProgress(e.target.value)} rows={5}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-500 resize-none"
          placeholder="Mô tả công việc đã thực hiện..." />
      </RightDrawer>

      <RightDrawer open={rejectOpen} title="Từ chối tiếp nhận" onClose={() => setRejectOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>Huỷ</Button>
            <Button variant="danger" disabled={!rejectReason.trim()}
              onClick={() => {
                update({ status: "rejected", result: rejectReason }, "Từ chối tiếp nhận", rejectReason);
                setRejectOpen(false); setRejectReason("");
                toast("Đã từ chối tiếp nhận phản ánh", "info");
              }}>
              Xác nhận từ chối
            </Button>
          </>
        }>
        <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">Lý do từ chối <span className="text-red-500">*</span></label>
        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={5}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-500 resize-none"
          placeholder="Ví dụ: nội dung không rõ ràng, trùng lặp, không thuộc phạm vi xử lý..." />
      </RightDrawer>

      {/* Cấp 1 chuyển hồ sơ lên cấp 2 - phải nêu rõ lý do để người dân theo dõi */}
      <RightDrawer open={forwardOpen} title="Chuyển UBND phường" onClose={() => setForwardOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForwardOpen(false)}>Huỷ</Button>
            <Button disabled={!forwardReason.trim()}
              onClick={() => {
                update(
                  {
                    status: "forwarded", level: "ubnd",
                    forwardReason: forwardReason.trim(),
                    forwardedBy: user?.fullName ?? `Trưởng Khu phố ${fb.hoodId}`,
                    forwardedAt: new Date().toISOString(),
                    assigneeId: null, unit: null,
                  },
                  "Chuyển UBND phường", forwardReason.trim()
                );
                setForwardOpen(false); setForwardReason("");
                toast("Đã chuyển phản ánh lên UBND phường");
              }}>
              Xác nhận chuyển
            </Button>
          </>
        }>
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-[12.5px] text-violet-900 mb-4">
          Chỉ chuyển khi phản ánh vượt thẩm quyền hoặc không thể xử lý tại khu phố. Sau khi chuyển,
          hồ sơ thuộc quyền xử lý của UBND phường và người dân được cập nhật trạng thái.
        </div>
        <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">
          Lý do chuyển xử lý <span className="text-red-500">*</span>
        </label>
        <textarea value={forwardReason} onChange={(e) => setForwardReason(e.target.value)} rows={5}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-500 resize-none"
          placeholder="Ví dụ: hạng mục sửa chữa vượt kinh phí khu phố, đề nghị UBND phường bố trí xử lý..." />
      </RightDrawer>

      {/* Cập nhật kết quả xử lý kèm ảnh minh chứng - dùng chung cho cả 2 cấp */}
      <RightDrawer open={resultOpen} title="Cập nhật kết quả xử lý" onClose={() => setResultOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setResultOpen(false)}>Huỷ</Button>
            <Button disabled={!result.trim()}
              onClick={() => {
                update(
                  {
                    result: result.trim(),
                    resultImages: [...(fb.resultImages ?? []), ...resultImages],
                    status: fb.status === "pending" || fb.status === "forwarded" ? "processing" : fb.status,
                  },
                  "Cập nhật kết quả xử lý", result.trim()
                );
                setResultOpen(false); setResultImages([]);
                toast("Đã cập nhật kết quả xử lý");
              }}>
              Lưu kết quả
            </Button>
          </>
        }>
        <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">
          Nội dung kết quả <span className="text-red-500">*</span>
        </label>
        <textarea value={result} onChange={(e) => setResult(e.target.value)} rows={5}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-500 resize-none"
          placeholder="Mô tả biện pháp đã thực hiện và hiện trạng sau xử lý..." />

        <label className="block text-[12.5px] font-medium text-slate-700 mt-4 mb-1.5">Ảnh minh chứng</label>
        <div className="grid grid-cols-3 gap-2">
          {[...(fb.resultImages ?? []), ...resultImages].map((src, i) => (
            <img key={i} src={src} alt="" className="w-full h-20 rounded-lg object-cover border border-slate-200" />
          ))}
          <label className="h-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors">
            <ImagePlus size={18} />
            <span className="text-[11px] font-medium">Thêm ảnh</span>
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) setResultImages((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
                e.target.value = "";
              }} />
          </label>
        </div>
        <p className="text-[11.5px] text-slate-500 mt-2 leading-relaxed">
          Kết quả và ảnh minh chứng sẽ hiển thị cho người dân ở mục Theo dõi phản ánh.
        </p>
      </RightDrawer>

      <ConfirmDialog open={confirmDone} title="Đóng phản ánh"
        description="Hồ sơ chuyển sang trạng thái Đã xử lý. Kết quả và ảnh minh chứng sẽ hiển thị cho người dân."
        confirmLabel="Đóng phản ánh"
        onCancel={() => setConfirmDone(false)}
        onConfirm={() => {
          update(
            { status: "resolved", result: result || fb.result || "Đã xử lý xong và phản hồi người dân." },
            atHood ? "Trưởng khu phố đóng phản ánh" : "UBND phường đóng phản ánh",
            result || undefined
          );
          setConfirmDone(false); setResult("");
          toast("Đã đóng phản ánh");
        }} />
    </>
  );
}
