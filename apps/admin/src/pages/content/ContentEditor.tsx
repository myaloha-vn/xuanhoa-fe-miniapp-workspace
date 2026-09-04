import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Eye, Save, Send, Upload } from "lucide-react";
import { Card, CardHeader, Button, StatusBadge, Badge, MultiSelect, HtmlEditor } from "../../components/common/ui";
import { ConfirmDialog, RightDrawer, useToast } from "../../components/common/Overlays";
import { useAuth } from "../../services/auth";
import { pushLog, pushNotification, useTable } from "../../services/store";
import { CONTENT_TYPE_LABEL } from "../../data/mock";
import { toInputDate } from "../../utils/format";
import type { ContentItem, ContentType } from "../../types";

const TYPES: ContentType[] = ["news", "announcement", "event", "banner", "literacy"];

export default function ContentEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, can, hoodScope } = useAuth();
  const [all, setAll] = useTable("contents");
  const [neighborhoods] = useTable("neighborhoods");

  const existing = useMemo(() => all.find((c) => c.id === id) ?? null, [all, id]);
  const [form, setForm] = useState<ContentItem>(() => {
    if (existing) {
      // Khởi tạo hoodIds từ hoodId cũ nếu chưa có
      return { ...existing, hoodIds: existing.hoodIds ?? (existing.hoodId ? [existing.hoodId] : null) };
    }
    return {
      id: `ct-${Date.now()}`,
      type: (params.get("type") as ContentType) ?? "news",
      title: "", slug: "", excerpt: "", body: "",
      image: img(2, 800, 450), gallery: [],
      hoodId: hoodScope ?? null, hoodIds: hoodScope ? [hoodScope] : null, authorId: user?.id ?? "u-editor",
      status: "draft", createdAt: new Date().toISOString(),
      publishedAt: null, scheduledAt: null, startAt: null, endAt: null, place: "",
      pinned: false, featured: false, views: 0,
      history: [{ at: new Date().toISOString(), by: user?.fullName ?? "Cán bộ", action: "created" }],
    };
  });
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const set = <K extends keyof ContentItem>(key: K, value: ContentItem[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Vui lòng nhập tiêu đề";
    if (!form.excerpt.trim()) e.excerpt = "Vui lòng nhập mô tả ngắn";
    if (!form.body.trim()) e.body = "Vui lòng nhập nội dung";
    if (form.type === "event" && !form.startAt) e.startAt = "Vui lòng chọn thời gian diễn ra";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const persist = (patch: Partial<ContentItem>, action: ContentItem["history"][0]["action"], message: string) => {
    const next: ContentItem = {
      ...form, ...patch,
      history: [...form.history, { at: new Date().toISOString(), by: user?.fullName ?? "Cán bộ", action, note: reviewNote || undefined }],
    };
    setAll(existing ? all.map((c) => (c.id === next.id ? next : c)) : [next, ...all]);
    setForm(next);
    setDirty(false);
    if (user) pushLog(user.id, message.toLowerCase(), next.title, next.hoodId);
    toast(message);
  };

  const saveDraft = () => { if (validate()) persist({ status: form.status === "published" ? "published" : "draft" }, "updated", "Đã lưu nội dung"); };

  const submitReview = () => {
    persist({ status: "pending" }, "submitted", "Đã gửi duyệt nội dung");
    pushNotification({
      kind: "content", title: "Nội dung mới chờ duyệt",
      description: `${form.title} vừa được gửi duyệt.`, link: "/workspace/content/news?status=pending", hoodId: form.hoodId,
    });
    setConfirmSubmit(false);
    navigate(-1);
  };

  const publishNow = () => {
    persist({ status: "published", publishedAt: new Date().toISOString() }, "published", "Đã xuất bản nội dung");
  };

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-500 transition-colors";
  const label = "block text-[12.5px] font-medium text-slate-700 mb-1.5";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>Quay lại</Button>
        <StatusBadge status={form.status} />
        <Badge tone="slate">{CONTENT_TYPE_LABEL[form.type]}</Badge>
        {dirty && <Badge tone="amber">Chưa lưu</Badge>}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={<Eye size={14} />} onClick={() => setPreview(true)}>Xem trước</Button>
          <Button variant="secondary" size="sm" icon={<Save size={14} />} onClick={saveDraft}>Lưu nháp</Button>
          {can("content", "publish") ? (
            <Button size="sm" icon={<Send size={14} />} onClick={() => { if (validate()) publishNow(); }}>Xuất bản</Button>
          ) : (
            <Button size="sm" icon={<Send size={14} />} onClick={() => { if (validate()) setConfirmSubmit(true); }}>Gửi duyệt</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Nội dung chính" />
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className={label}>Tiêu đề <span className="text-red-500">*</span></label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} className={field} placeholder="Nhập tiêu đề nội dung" />
              {errors.title && <p className="text-[11.5px] text-red-600 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className={label}>Mô tả ngắn <span className="text-red-500">*</span></label>
              <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} className={`${field} resize-none`} />
              {errors.excerpt && <p className="text-[11.5px] text-red-600 mt-1">{errors.excerpt}</p>}
            </div>
            <div>
              <label className={label}>Nội dung <span className="text-red-500">*</span></label>
              <HtmlEditor value={form.body} onChange={(html) => set("body", html)} rows={12} />
              {errors.body && <p className="text-[11.5px] text-red-600 mt-1">{errors.body}</p>}
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Phân loại và hiển thị" />
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className={label}>Loại nội dung</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value as ContentType)} className={field}>
                  {TYPES.map((t) => <option key={t} value={t}>{CONTENT_TYPE_LABEL[t]}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Khu vực hiển thị</label>
                <MultiSelect
                  options={neighborhoods.map((n) => ({ value: String(n.id), label: n.name }))}
                  selected={(form.hoodIds ?? []).map(String)}
                  onChange={(vals) => {
                    const nums = vals.map(Number);
                    setForm((f) => ({ ...f, hoodIds: nums.length ? nums : null, hoodId: nums.length === 1 ? nums[0] : null }));
                    setDirty(true);
                  }}
                  placeholder="Toàn phường"
                  searchPlaceholder="Tìm khu phố..."
                />
                {hoodScope && <p className="text-[11.5px] text-slate-400 mt-1">Tài khoản khu phố chỉ đăng nội dung cho khu phố được phân công.</p>}
              </div>
              {form.type === "event" && (
                <>
                  <div>
                    <label className={label}>Thời gian bắt đầu <span className="text-red-500">*</span></label>
                    <input type="date" value={toInputDate(form.startAt)} onChange={(e) => set("startAt", e.target.value ? new Date(e.target.value).toISOString() : null)} className={field} />
                    {errors.startAt && <p className="text-[11.5px] text-red-600 mt-1">{errors.startAt}</p>}
                  </div>
                  <div>
                    <label className={label}>Thời gian kết thúc</label>
                    <input type="date" value={toInputDate(form.endAt)} onChange={(e) => set("endAt", e.target.value ? new Date(e.target.value).toISOString() : null)} className={field} />
                  </div>
                  <div>
                    <label className={label}>Địa điểm</label>
                    <input value={form.place ?? ""} onChange={(e) => set("place", e.target.value)} className={field} />
                  </div>
                </>
              )}
              {form.type === "literacy" && (
                <>
                  <div>
                    <label className={label}>Chủ đề</label>
                    <input value={form.topic ?? ""} onChange={(e) => set("topic", e.target.value)} className={field} />
                  </div>
                  <div>
                    <label className={label}>Mức độ dễ hiểu</label>
                    <select value={form.level ?? "easy"} onChange={(e) => set("level", e.target.value as "easy" | "medium")} className={field}>
                      <option value="easy">Dễ hiểu</option>
                      <option value="medium">Trung bình</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>Đối tượng</label>
                    <input value={form.audience ?? ""} onChange={(e) => set("audience", e.target.value)} className={field} />
                  </div>
                </>
              )}
              <div>
                <label className={label}>Hẹn giờ xuất bản</label>
                <input type="date" value={toInputDate(form.scheduledAt)}
                  onChange={(e) => set("scheduledAt", e.target.value ? new Date(e.target.value).toISOString() : null)} className={field} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Hình ảnh" />
            <div className="px-5 py-4 space-y-3">
              <img src={form.image} alt="" className="w-full aspect-video rounded-lg object-cover border border-slate-100" />
              <label className="flex items-center justify-center gap-2 w-full rounded-lg border border-dashed border-slate-300 px-3 py-3 text-[13px] text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors cursor-pointer">
                <Upload size={16} />
                Tải lên ảnh khác
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setForm((f) => ({ ...f, image: reader.result as string }));
                      setDirty(true);
                    };
                    reader.readAsDataURL(file);
                  }
                  e.target.value = "";
                }} />
              </label>
            </div>
          </Card>
        </div>
      </div>

      <RightDrawer open={preview} title="Xem trước nội dung" onClose={() => setPreview(false)} width="max-w-xl">
        <article className="space-y-3">
          <img src={form.image} alt="" className="w-full aspect-video rounded-xl object-cover" />
          <h1 className="text-[20px] font-semibold text-slate-900 leading-snug">{form.title || "(Chưa có tiêu đề)"}</h1>
          <p className="text-[13px] text-slate-500">{CONTENT_TYPE_LABEL[form.type]} · {(form.hoodIds ?? []).length ? form.hoodIds!.map((id) => `Khu phố ${id}`).join(", ") : "Toàn phường"}</p>
          <p className="text-[13.5px] text-slate-700 font-medium">{form.excerpt}</p>
          {form.body.split("\n").filter(Boolean).map((p, i) => (
            <p key={i} className="text-[13.5px] text-slate-700 leading-relaxed">{p}</p>
          ))}
        </article>
      </RightDrawer>

      <ConfirmDialog open={confirmSubmit} title="Gửi duyệt nội dung"
        description="Nội dung sẽ chuyển sang trạng thái Chờ duyệt và gửi thông báo tới cán bộ phường."
        confirmLabel="Gửi duyệt" onCancel={() => setConfirmSubmit(false)} onConfirm={submitReview} />
    </>
  );
}
