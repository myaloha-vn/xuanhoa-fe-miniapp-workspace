import { useMemo } from "react";
import { useAuth } from "../services/auth";
import { useTable } from "../services/store";

/**
 * Lấy dữ liệu đã lọc theo phạm vi khu phố của tài khoản đang đăng nhập.
 * Trưởng khu phố và cán bộ khu phố chỉ thấy dữ liệu khu phố mình phụ trách.
 */
export function useScopedFeedbacks() {
  const { hoodScope } = useAuth();
  const [all] = useTable("feedbacks");
  return useMemo(
    () => (hoodScope ? all.filter((f) => f.hoodId === hoodScope) : all),
    [all, hoodScope]
  );
}

export function useScopedContents() {
  const { hoodScope } = useAuth();
  const [all] = useTable("contents");
  return useMemo(
    () => (hoodScope ? all.filter((c) => c.hoodId === hoodScope || c.hoodId === null) : all),
    [all, hoodScope]
  );
}

export function useScopedNeighborhoods() {
  const { hoodScope } = useAuth();
  const [all] = useTable("neighborhoods");
  return useMemo(
    () => (hoodScope ? all.filter((n) => n.id === hoodScope) : all),
    [all, hoodScope]
  );
}

export function useScopedHouseholds() {
  const { hoodScope } = useAuth();
  const [all] = useTable("households");
  return useMemo(
    () => (hoodScope ? all.filter((h) => h.hoodId === hoodScope) : all),
    [all, hoodScope]
  );
}
