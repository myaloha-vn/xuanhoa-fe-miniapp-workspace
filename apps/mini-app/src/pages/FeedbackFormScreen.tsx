import { useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle, Building2, Camera, CheckCircle2, ChevronDown, Edit3, Info, MapPin, Navigation, Phone, Plus, User, X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { FEEDBACK_TYPES, NEIGHBORHOODS } from "../data";
import { useHousehold } from "../hooks/useAppStorage";
import { AppHeader } from "../components/shared/AppHeader";
import { MapPicker } from "../components/shared/MapPicker";

// ─── SCREEN: FEEDBACK FORM ───────────────────────────────────────────────────
export default function FeedbackFormScreen() {
  const navigate = useNavigate();
  const [household] = useHousehold();
  const myHood = household ? NEIGHBORHOODS[household.hoodId - 1] : null;
  const [type, setType] = useState("");
  const [content, setContent] = useState("");
  const [address, setAddress] = useState(household?.address ?? "");
  const [name, setName] = useState(household?.name ?? "");
  const [phone, setPhone] = useState(household?.phone ?? "");
  const [editContact, setEditContact] = useState(!household);
  const [images, setImages] = useState<string[]>([]);
  const [geo, setGeo] = useState("");
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [locatingBusy, setLocatingBusy] = useState(false);
  const [locateErr, setLocateErr] = useState("");
  const [err, setErr] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [refId] = useState(`PK${String(Date.now()).slice(-4)}`);

  const canSubmit = !!type && !!content.trim() && !!address.trim() && images.length > 0;

  const submit = () => {
    if (!type) return setErr("Vui lòng chọn loại phản ánh");
    if (!content.trim()) return setErr("Vui lòng nhập nội dung phản ánh");
    if (!address.trim()) return setErr("Vui lòng nhập địa chỉ xảy ra sự việc");
    if (images.length === 0) return setErr("Phản ánh bắt buộc có ít nhất 01 ảnh minh chứng");
    setErr("");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="bg-[#1565C0] shrink-0">
          <AppHeader title="Gửi phản ánh" onBack={() => navigate("/feedback")} />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-5xl">
            ✅
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-center space-y-2">
            <p className="text-xl font-extrabold text-gray-800">Gửi thành công!</p>
            <p className="text-[13px] text-gray-500 leading-relaxed">Phản ánh của bạn đã được tiếp nhận. Chúng tôi sẽ xử lý trong vòng 5–7 ngày làm việc.</p>
            <div className="inline-block bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 mt-2">
              <p className="text-[11px] text-gray-500">Mã phản ánh</p>
              <p className="text-[16px] font-extrabold text-[#1565C0] tracking-wider">#{refId}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex gap-3 w-full">
            <button onClick={() => navigate("/feedback/track")}
              className="flex-1 py-3.5 border border-[#1565C0] rounded-xl text-[#1565C0] text-[13px] font-bold active:bg-blue-50">
              Theo dõi
            </button>
            <button onClick={() => navigate("/feedback")}
              className="flex-1 py-3.5 bg-[#1565C0] rounded-xl text-white text-[13px] font-bold active:opacity-80">
              Về trang chủ
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      <div className="bg-[#1565C0] shrink-0">
        <AppHeader title="Gửi phản ánh" onBack={() => navigate("/feedback")} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5" style={{ scrollbarWidth: "none" }}>
        {/* Type selection */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[13px] font-extrabold text-gray-800 mb-3">
            Loại phản ánh <span className="text-red-400">*</span>
          </p>
          <div className="relative">
            <select value={type} onChange={(e) => setType(e.target.value)}
              className={`w-full appearance-none bg-gray-50 border rounded-xl pl-3.5 pr-9 py-3 text-[13px] outline-none focus:border-[#1565C0] transition-colors ${
                type ? "text-gray-800 font-semibold border-gray-200" : "text-gray-400 border-gray-200"
              }`}>
              <option value="">-- Chọn loại phản ánh --</option>
              {FEEDBACK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[13px] font-extrabold text-gray-800 mb-3">
            Nội dung phản ánh <span className="text-red-400">*</span>
          </p>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Mô tả chi tiết vấn đề bạn muốn phản ánh..."
            rows={4}
            className="w-full text-[12.5px] text-gray-700 outline-none resize-none leading-relaxed placeholder-gray-300" />
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-[13px] font-extrabold text-gray-800">
            Địa điểm xảy ra sự việc <span className="text-red-400">*</span>
          </p>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
            <MapPin size={14} className="text-[#1565C0] shrink-0" />
            <input value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ cụ thể..."
              className="flex-1 text-[12.5px] outline-none bg-transparent placeholder-gray-400" />
          </div>

          {/* Location actions */}
          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={locatingBusy}
              onClick={() => {
                setLocateErr("");
                setLocatingBusy(true);
                if (!navigator.geolocation) {
                  setLocateErr("Thiết bị không hỗ trợ định vị");
                  setLocatingBusy(false);
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    const { latitude: lat, longitude: lon } = pos.coords;
                    try {
                      const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=vi`
                      );
                      const data = await res.json();
                      const addr = data?.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
                      setAddress(addr);
                      setGeo(addr);
                      setGeoCoords({ lat, lon });
                    } catch {
                      setAddress(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
                      setGeo(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
                      setGeoCoords({ lat, lon });
                    }
                    // Đóng bản đồ nếu đang mở (vì đã có vị trí từ GPS)
                    setShowMapPicker(false);
                    setMapExpanded(false);
                    setLocatingBusy(false);
                  },
                  () => {
                    setLocateErr("Không lấy được vị trí. Hãy thử chọn trên bản đồ.");
                    setLocatingBusy(false);
                  },
                  { enableHighAccuracy: true, timeout: 10000 }
                );
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#1565C0]/30 bg-blue-50 text-[#1565C0] text-[12px] font-bold active:bg-blue-100 disabled:opacity-60"
            >
              {locatingBusy ? (
                <div className="w-3.5 h-3.5 border-2 border-[#1565C0] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Navigation size={14} />
              )}
              {locatingBusy ? "Đang lấy..." : "Vị trí hiện tại"}
            </button>
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#1565C0]/30 bg-blue-50 text-[#1565C0] text-[12px] font-bold active:bg-blue-100"
            >
              <MapPin size={14} />
              Chọn trên bản đồ
            </button>
          </div>

          {locateErr && (
            <p className="text-[11px] text-red-500 flex items-start gap-1">
              <AlertCircle size={11} className="shrink-0 mt-0.5" /> {locateErr}
            </p>
          )}

          {/* Selected location display */}
          {geo && (
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
              <CheckCircle2 size={13} className="text-[#1565C0] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#1565C0] mb-0.5">ĐÃ XÁC ĐỊNH VỊ TRÍ</p>
                <p className="text-[12px] text-gray-700 leading-snug">{geo}</p>
                {geoCoords && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {geoCoords.lat.toFixed(6)}, {geoCoords.lon.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[13px] font-extrabold text-gray-800 mb-1">
            Ảnh minh chứng <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal"> (bắt buộc ít nhất 01 ảnh, tối đa 4 ảnh)</span>
          </p>
          <p className="text-[11px] text-gray-400 mb-3">Ảnh giúp cán bộ xác minh nhanh và xử lý chính xác hiện trường.</p>
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center active:scale-90">
                  <X size={9} className="text-white" />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <>
                <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 active:bg-gray-50 ${
                  images.length === 0 ? "border-red-300 text-red-400" : "border-gray-300 text-gray-400"
                }`}>
                  <Camera size={18} />
                  <span className="text-[9.5px] font-semibold">Chụp ảnh</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []).slice(0, 4 - images.length);
                      if (files.length) { setImages((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]); setErr(""); }
                    }} />
                </label>
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 active:bg-gray-50">
                  <Plus size={18} />
                  <span className="text-[9.5px] font-semibold">Chọn ảnh</span>
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []).slice(0, 4 - images.length);
                      if (files.length) { setImages((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]); setErr(""); }
                    }} />
                </label>
              </>
            )}
          </div>
          {images.length === 0 && (
            <p className="mt-2 text-[11px] text-red-600 flex items-center gap-1">
              <AlertCircle size={11} className="shrink-0" /> Chưa có ảnh minh chứng
            </p>
          )}
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-extrabold text-gray-800">Thông tin người phản ánh</p>
            {household && (
              <button onClick={() => setEditContact((v) => !v)}
                className="text-[11px] text-[#1565C0] font-semibold flex items-center gap-1 active:opacity-60">
                <Edit3 size={11} /> {editContact ? "Dùng thông tin đã khai" : "Sửa"}
              </button>
            )}
          </div>

          {household && !editContact ? (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3.5 space-y-2">
              <p className="text-[10px] font-extrabold tracking-wider text-[#1565C0] flex items-center gap-1">
                <CheckCircle2 size={11} /> ĐÃ TỰ ĐIỀN TỪ KHAI BÁO HỘ GIA ĐÌNH
              </p>
              <div className="flex items-center gap-2 text-[12.5px] text-gray-700">
                <User size={13} className="text-[#1565C0] shrink-0" />
                <span className="font-semibold">{household.name}</span>
                <span className="text-gray-400">· {household.role === "member" ? "Thành viên" : "Chủ hộ"}</span>
              </div>
              <div className="flex items-center gap-2 text-[12.5px] text-gray-600">
                <Phone size={13} className="text-[#1565C0] shrink-0" /> {household.phone}
              </div>
              <div className="flex items-start gap-2 text-[12.5px] text-gray-600">
                <MapPin size={13} className="text-[#1565C0] shrink-0 mt-0.5" />
                <span className="leading-snug">{household.address}</span>
              </div>
              {myHood && (
                <div className="flex items-center gap-2 text-[12.5px] text-gray-600 pt-1.5 border-t border-blue-100">
                  <Building2 size={13} className="text-[#1565C0] shrink-0" />
                  <span className="font-semibold text-gray-800">{myHood.name}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Họ và tên (tùy chọn)"
                className="w-full text-[12.5px] bg-gray-50 rounded-xl px-3.5 py-2.5 outline-none border border-gray-200 focus:border-[#1565C0] transition-colors" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="Số điện thoại (tùy chọn)"
                type="tel"
                className="w-full text-[12.5px] bg-gray-50 rounded-xl px-3.5 py-2.5 outline-none border border-gray-200 focus:border-[#1565C0] transition-colors" />
            </>
          )}

          {!household && (
            <button onClick={() => navigate("/neighborhood")}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#1565C0]/30 bg-blue-50 text-[#1565C0] text-[12px] font-bold active:bg-blue-100">
              <Info size={13} /> Khai báo hộ gia đình để tự điền thông tin
            </button>
          )}
        </div>

        {err && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3.5 py-3 text-[12px] text-red-600">
            <AlertCircle size={14} className="shrink-0" /> {err}
          </div>
        )}

        <button onClick={submit}
          className={`w-full py-4 rounded-xl font-extrabold text-[15px] transition-all active:scale-[0.98] ${
            canSubmit ? "bg-[#1565C0] text-white shadow-md shadow-blue-200" : "bg-gray-200 text-gray-400"
          }`}>
          Gửi phản ánh
        </button>
      </div>

      {/* Map Picker */}
      {showMapPicker && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-extrabold text-gray-800">Chọn vị trí trên bản đồ</p>
            <button
              onClick={() => {
                setShowMapPicker(false);
                setMapExpanded(false);
              }}
              className="text-[11px] text-gray-500 font-semibold active:opacity-60"
            >
              Đóng
            </button>
          </div>
          <MapPicker
            key={geoCoords ? `${geoCoords.lat},${geoCoords.lon}` : "default"}
            open={showMapPicker}
            onClose={() => {
              setShowMapPicker(false);
              setMapExpanded(false);
            }}
            onSelect={(lat, lon, addr) => {
              setAddress(addr);
              setGeo(addr);
              setGeoCoords({ lat, lon });
            }}
            onChange={(lat, lon, addr) => {
              // Đồng bộ vị trí ngay khi thay đổi trên bản đồ
              setAddress(addr);
              setGeo(addr);
              setGeoCoords({ lat, lon });
            }}
            initialLat={geoCoords?.lat}
            initialLon={geoCoords?.lon}
            expanded={mapExpanded}
            onToggleExpand={() => setMapExpanded(!mapExpanded)}
          />
        </div>
      )}
    </div>
  );
}
