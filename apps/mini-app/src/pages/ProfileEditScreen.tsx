import { useEffect } from "react";
import { useNavigate } from "react-router";
import { AppHeader } from "../components/shared/AppHeader";
import { HouseholdForm } from "../components/shared/HouseholdForm";
import { useHousehold } from "../hooks/useAppStorage";
import { useSafeBack } from "../hooks/useSafeBack";

// ─── SCREEN: SỬA KHAI BÁO HỘ GIA ĐÌNH ────────────────────────────────────────
// Trang riêng để cập nhật thông tin hộ gia đình đã khai báo (vào từ nút "Cập
// nhật" ở trang Cá nhân, hoặc "Sửa khai báo" ở trang Khu phố số) - tách biệt
// khỏi NeighborhoodScreen để mỗi trang chỉ lo đúng 1 việc.
export default function ProfileEditScreen() {
  const navigate = useNavigate();
  const [household, setHousehold] = useHousehold();
  const goBack = useSafeBack("/profile");

  // Chưa khai báo mà mở thẳng link này thì không có gì để sửa - đưa về trang
  // khai báo lần đầu cho chắc.
  useEffect(() => {
    if (!household) navigate("/neighborhood", { replace: true });
  }, [household, navigate]);

  if (!household) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      <div className="bg-[#1565C0] shrink-0">
        <AppHeader title="Cập nhật khai báo" onBack={goBack} />
      </div>
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <HouseholdForm
          initial={household}
          onSubmit={(h) => {
            setHousehold(h);
            // Cập nhật xong vào thẳng trang khu phố (có thể đã đổi) luôn.
            navigate(`/neighborhood/${h.hoodId}`);
          }}
          onCancel={goBack}
          onMove={() => {
            // Chuyển nơi ở = sang hộ gia đình khác → bỏ liên kết cũ, khai báo lại.
            setHousehold(null);
            navigate("/neighborhood", { replace: true });
          }}
        />
      </div>
    </div>
  );
}
