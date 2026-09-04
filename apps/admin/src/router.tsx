import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import type { ReactNode } from "react";
import { AuthProvider } from "./services/auth";
import { ToastProvider } from "./components/common/Overlays";
import { PermissionGuard, RequireAuth } from "./components/common/Guards";
import { WorkspaceLayout, type PageMeta } from "./layouts/WorkspaceLayout";
import type { Action, Module } from "./types";

import Login from "./pages/auth/Login";
import Overview from "./pages/workspace/Overview";
import ContentList from "./pages/content/ContentList";
import ContentEditor from "./pages/content/ContentEditor";
import FeedbackList from "./pages/feedback/FeedbackList";
import FeedbackDetail from "./pages/feedback/FeedbackDetail";
import SuggestionsList from "./pages/suggestions/SuggestionsList";
import HouseholdList from "./pages/households/HouseholdList";
import NeighborhoodList from "./pages/neighborhoods/NeighborhoodList";
import NeighborhoodDetail from "./pages/neighborhoods/NeighborhoodDetail";
import WasteSchedulePage from "./pages/waste/WasteSchedule";
import Surveys from "./pages/surveys/Surveys";
import MediaLibrary from "./pages/media/MediaLibrary";
import Utilities from "./pages/utilities/Utilities";
import Reports from "./pages/reports/Reports";
import Users from "./pages/users/Users";
import Roles from "./pages/users/Roles";
import Settings from "./pages/settings/Settings";
import LedWall from "./pages/led/LedWall";
import UnitsList from "./pages/units/UnitsList";

const HOME = { label: "Trang chủ", to: "/workspace/overview" };

/** Bọc trang workspace: kiểm tra đăng nhập, kiểm tra quyền, dựng layout */
function Page({ meta, module, action = "view", children }: {
  meta: PageMeta; module: Module; action?: Action; children: ReactNode;
}) {
  return (
    <RequireAuth>
      <WorkspaceLayout meta={meta}>
        <PermissionGuard module={module} action={action}>{children}</PermissionGuard>
      </WorkspaceLayout>
    </RequireAuth>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Mini App cho người dân đã tách sang apps/mini-app */}
            <Route path="/" element={<Navigate to="/workspace/overview" replace />} />
            <Route path="/login" element={<Login />} />

            {/* Workspace điều hành */}
            <Route path="/workspace" element={<Navigate to="/workspace/overview" replace />} />
            <Route path="/workspace/overview" element={
              <Page module="overview" meta={{ title: "Tổng quan điều hành", breadcrumb: [HOME, { label: "Điều hành" }, { label: "Tổng quan" }] }}>
                <Overview />
              </Page>
            } />
            <Route path="/workspace/content" element={<Navigate to="/workspace/content/news" replace />} />
            <Route path="/workspace/content/news" element={
              <Page module="content" meta={{ title: "Tin tức", breadcrumb: [HOME, { label: "Nội dung" }, { label: "Tin tức" }] }}>
                <ContentList type="news" title="Danh sách tin tức" />
              </Page>
            } />
            <Route path="/workspace/content/announcements" element={
              <Page module="content" meta={{ title: "Thông báo", breadcrumb: [HOME, { label: "Nội dung" }, { label: "Thông báo" }] }}>
                <ContentList type="announcement" title="Danh sách thông báo" />
              </Page>
            } />
            <Route path="/workspace/content/events" element={
              <Page module="content" meta={{ title: "Lịch hoạt động", breadcrumb: [HOME, { label: "Nội dung" }, { label: "Lịch hoạt động" }] }}>
                <ContentList type="event" title="Danh sách hoạt động" />
              </Page>
            } />
            <Route path="/workspace/content/banners" element={
              <Page module="content" meta={{ title: "Banner trang chủ", breadcrumb: [HOME, { label: "Hệ thống" }, { label: "Banner" }] }}>
                <ContentList type="banner" title="Danh sách banner" />
              </Page>
            } />
            <Route path="/workspace/content/create" element={
              <Page module="content" action="create" meta={{ title: "Tạo nội dung", breadcrumb: [HOME, { label: "Nội dung", to: "/workspace/content/news" }, { label: "Tạo mới" }] }}>
                <ContentEditor />
              </Page>
            } />
            <Route path="/workspace/content/:id/edit" element={
              <Page module="content" action="edit" meta={{ title: "Chỉnh sửa nội dung", breadcrumb: [HOME, { label: "Nội dung", to: "/workspace/content/news" }, { label: "Chỉnh sửa" }] }}>
                <ContentEditor />
              </Page>
            } />
            <Route path="/workspace/digital-literacy" element={
              <Page module="literacy" meta={{ title: "Bình dân học vụ số", breadcrumb: [HOME, { label: "Nội dung" }, { label: "Bình dân học vụ số" }] }}>
                <ContentList type="literacy" title="Danh sách bài học số" />
              </Page>
            } />

            <Route path="/workspace/feedback" element={
              <Page module="feedback" meta={{ title: "Phản ánh kiến nghị", breadcrumb: [HOME, { label: "Điều hành" }, { label: "Phản ánh kiến nghị" }] }}>
                <FeedbackList />
              </Page>
            } />
            <Route path="/workspace/feedback/:id" element={
              <Page module="feedback" meta={{ title: "Chi tiết phản ánh", breadcrumb: [HOME, { label: "Phản ánh kiến nghị", to: "/workspace/feedback" }, { label: "Chi tiết" }] }}>
                <FeedbackDetail />
              </Page>
            } />

            <Route path="/workspace/suggestions" element={
              <Page module="suggestions" meta={{ title: "Góp ý", breadcrumb: [HOME, { label: "Điều hành" }, { label: "Góp ý" }] }}>
                <SuggestionsList />
              </Page>
            } />

            <Route path="/workspace/neighborhoods" element={
              <Page module="neighborhoods" meta={{ title: "Khu phố", breadcrumb: [HOME, { label: "Địa bàn" }, { label: "Khu phố" }] }}>
                <NeighborhoodList />
              </Page>
            } />
            <Route path="/workspace/neighborhoods/:id" element={
              <Page module="neighborhoods" meta={{ title: "Chi tiết khu phố", breadcrumb: [HOME, { label: "Khu phố", to: "/workspace/neighborhoods" }, { label: "Chi tiết" }] }}>
                <NeighborhoodDetail />
              </Page>
            } />
            <Route path="/workspace/households" element={
              <Page module="households" meta={{ title: "Hộ gia đình", breadcrumb: [HOME, { label: "Địa bàn" }, { label: "Hộ gia đình" }] }}>
                <HouseholdList />
              </Page>
            } />

            <Route path="/workspace/waste-schedule" element={
              <Page module="waste" meta={{ title: "Lịch thu gom rác", breadcrumb: [HOME, { label: "Địa bàn" }, { label: "Lịch thu gom rác" }] }}>
                <WasteSchedulePage />
              </Page>
            } />
            <Route path="/workspace/surveys" element={
              <Page module="surveys" meta={{ title: "Khảo sát - đăng ký", breadcrumb: [HOME, { label: "Hệ thống" }, { label: "Khảo sát" }] }}>
                <Surveys />
              </Page>
            } />
            <Route path="/workspace/media" element={
              <Page module="media" meta={{ title: "Thư viện ảnh - video", breadcrumb: [HOME, { label: "Nội dung" }, { label: "Thư viện" }] }}>
                <MediaLibrary />
              </Page>
            } />
            <Route path="/workspace/utilities" element={
              <Page module="utilities" meta={{ title: "Tiện ích và bản đồ", breadcrumb: [HOME, { label: "Địa bàn" }, { label: "Tiện ích" }] }}>
                <Utilities />
              </Page>
            } />
            <Route path="/workspace/reports" element={
              <Page module="reports" meta={{ title: "Thống kê - báo cáo", breadcrumb: [HOME, { label: "Hệ thống" }, { label: "Báo cáo" }] }}>
                <Reports />
              </Page>
            } />
            <Route path="/workspace/units" element={
              <Page module="reports" meta={{ title: "Danh sách đơn vị", breadcrumb: [HOME, { label: "Báo cáo & Quản trị" }, { label: "Đơn vị" }] }}>
                <UnitsList />
              </Page>
            } />
            <Route path="/workspace/users" element={
              <Page module="users" meta={{ title: "Người dùng", breadcrumb: [HOME, { label: "Hệ thống" }, { label: "Người dùng" }] }}>
                <Users />
              </Page>
            } />
            <Route path="/workspace/roles" element={
              <Page module="users" meta={{ title: "Vai trò và phân quyền", breadcrumb: [HOME, { label: "Hệ thống" }, { label: "Phân quyền" }] }}>
                <Roles />
              </Page>
            } />
            <Route path="/workspace/settings" element={
              <Page module="settings" meta={{ title: "Cấu hình hệ thống", breadcrumb: [HOME, { label: "Hệ thống" }, { label: "Cấu hình" }] }}>
                <Settings />
              </Page>
            } />

            {/* Màn hình LED điều hành 3840x2160 */}
            <Route path="/workspace/led" element={<RequireAuth><LedWall /></RequireAuth>} />
            <Route path="/led" element={<RequireAuth><LedWall /></RequireAuth>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
