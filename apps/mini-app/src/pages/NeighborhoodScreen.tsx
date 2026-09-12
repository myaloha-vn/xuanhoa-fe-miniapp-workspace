import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ChevronDown, ChevronRight, Edit3, MapPin, Phone, Search, User, Users, X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { NEIGHBORHOODS, groupStyle, type Household } from "../data";
import { useHousehold } from "../hooks/useAppStorage";
import { AppHeader } from "../components/shared/AppHeader";
import { EmptyState } from "../components/shared/EmptyState";
import { HouseholdForm } from "../components/shared/HouseholdForm";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";

export default function NeighborhoodScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [household, setHousehold] = useHousehold();

  useEffect(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []);

  const myHood = household ? NEIGHBORHOODS[household.hoodId - 1] : null;

  const commit = (h: Household) => {
    setHousehold(h);
    // Khai báo xong thì vào thẳng trang khu phố đã chọn luôn, không cần dừng
    // lại ở trang danh sách nữa.
    navigate(`/neighborhood/${h.hoodId}`);
  };

  const filtered = NEIGHBORHOODS.filter(
    (n) => n.name.toLowerCase().includes(query.toLowerCase()) || n.leader.toLowerCase().includes(query.toLowerCase())
  );
  const others = filtered.filter((n) => n.id !== household?.hoodId);
  const displayed = showAll ? others : others.slice(0, 18);

  const handleExpand = () => {
    setLoading(true);
    setTimeout(() => { setShowAll(true); setLoading(false); }, 500);
  };

  // ── Chưa khai báo → hiển thị form khai báo ──
  if (!household) {
    return (
      <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
        <div className="bg-[#1565C0] shrink-0">
          <AppHeader title="Khai báo hộ gia đình" onBack={() => navigate("/")} />
        </div>
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {/* onCancel: thoát khai báo (VD chọn chờ chủ hộ khai báo trước) */}
          <HouseholdForm initial={null} onSubmit={commit} onCancel={() => navigate("/")} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      <div className="bg-[#1565C0] shrink-0">
        <AppHeader title="Khu phố số" onBack={() => navigate("/")} />
        <div className="px-4 pb-3">
          <div className="flex items-center bg-white/20 rounded-xl px-3 py-2.5 gap-2">
            <Search size={15} className="text-white/60" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm khu phố, tên trưởng khu phố..."
              className="flex-1 bg-transparent text-white placeholder-white/55 text-[13px] outline-none" />
            {query && (
              <button onClick={() => setQuery("")} className="text-white/70"><X size={14} /></button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: "none" }}>
        {/* Khu phố của tôi */}
        {myHood && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[13px] font-extrabold text-gray-800">Khu phố của tôi</h3>
              <button onClick={() => navigate("/profile/edit")}
                className="text-[11px] text-[#1565C0] font-semibold flex items-center gap-1 active:opacity-60">
                <Edit3 size={11} /> Sửa khai báo
              </button>
            </div>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate(`/neighborhood/${myHood.id}`)}
              className="w-full text-left rounded-2xl overflow-hidden shadow-sm border border-[#1565C0]/25 bg-white">
              <div className="relative h-24">
                <img src={myHood.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D47A1]/85 to-[#0D47A1]/25" />
                <div className="absolute inset-0 px-3.5 flex flex-col justify-center">
                  <span className="text-[9.5px] font-extrabold tracking-wider text-white/80">KHU PHỐ CỦA BẠN</span>
                  <p className="text-white font-extrabold text-[19px] leading-tight">{myHood.name}</p>
                  <p className="text-white/85 text-[11px] mt-0.5">
                    {myHood.households} hộ · {myHood.population} nhân khẩu
                  </p>
                </div>
                <ChevronRight size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/90" />
              </div>
              <div className="p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-[12px] text-gray-700">
                  <User size={13} className="text-[#1565C0] shrink-0" />
                  <span className="font-semibold">{household.name}</span>
                  <span className="text-gray-400">· {household.role === "member" ? "Thành viên" : "Chủ hộ"}</span>
                </div>
                {household.groups?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {household.groups.map((g) => (
                      <span key={g} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${groupStyle(g).chip}`}>
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 text-[12px] text-gray-600">
                  <Phone size={13} className="text-[#1565C0] shrink-0" /> {household.phone}
                </div>
                <div className="flex items-start gap-2 text-[12px] text-gray-600">
                  <MapPin size={13} className="text-[#1565C0] shrink-0 mt-0.5" />
                  <span className="leading-snug">{household.address}</span>
                </div>
                <div className="pt-1.5 mt-1 border-t border-gray-100 flex items-center gap-2 text-[12px] text-gray-600">
                  <Users size={13} className="text-[#1565C0] shrink-0" />
                  Trưởng khu phố: <span className="font-semibold text-gray-800">{myHood.leader}</span>
                </div>
              </div>
            </motion.button>
          </div>
        )}

        {loading ? <LoadingSpinner text="Đang tải danh sách khu phố..." /> : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-extrabold text-gray-800">
                Các khu phố khác <span className="font-medium text-gray-400">({others.length})</span>
              </h3>
              <span className="text-[11px] text-[#1565C0] font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">TP. Hồ Chí Minh</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {displayed.map((hood) => (
                <motion.button key={hood.id} onClick={() => navigate(`/neighborhood/${hood.id}`)}
                  whileTap={{ scale: 0.94 }}
                  className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center gap-1.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-2xl">
                    🏘️
                  </div>
                  <span className="text-[11px] font-extrabold text-gray-800 text-center leading-tight">{hood.name}</span>
                  <span className="text-[9.5px] text-gray-400">{hood.households} hộ</span>
                </motion.button>
              ))}
            </div>

            {others.length > 18 && !showAll && (
              <button onClick={handleExpand}
                className="w-full mt-4 py-3.5 bg-white rounded-2xl border border-[#1565C0]/30 text-[#1565C0] text-[13px] font-bold flex items-center justify-center gap-2 active:bg-blue-50">
                <ChevronDown size={16} /> Xem thêm ({others.length - 18} khu phố)
              </button>
            )}

            {filtered.length === 0 && !loading && (
              <EmptyState icon={<Search size={26} />} text="Không tìm thấy khu phố" sub="Thử tìm kiếm với từ khoá khác" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
