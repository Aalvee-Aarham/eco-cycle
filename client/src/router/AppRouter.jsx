import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Classify = lazy(() => import('@/pages/dashboard/Classify'));
const MySubmissions = lazy(() => import('@/pages/dashboard/MySubmissions'));
const SubmissionDetail = lazy(() => import('@/pages/dashboard/SubmissionDetail'));
const Feed = lazy(() => import('@/pages/dashboard/Feed'));
const Leaderboard = lazy(() => import('@/pages/social/Leaderboard'));
const Profile = lazy(() => import('@/pages/social/Profile'));
const Followers = lazy(() => import('@/pages/social/Followers'));
const Following = lazy(() => import('@/pages/social/Following'));
const ModDashboard = lazy(() => import('@/pages/moderator/ModDashboard'));
const DisputeQueue = lazy(() => import('@/pages/moderator/DisputeQueue'));
const DisputeDetail = lazy(() => import('@/pages/moderator/DisputeDetail'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const AuditLog = lazy(() => import('@/pages/admin/AuditLog'));
const SystemConfig = lazy(() => import('@/pages/admin/SystemConfig'));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center text-slate-400">Loading…</div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/u/:username" element={<Profile />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/followers" element={<Followers />} />
            <Route path="/following" element={<Following />} />
            <Route path="/classify" element={<Classify />} />
            <Route path="/submissions" element={<MySubmissions />} />
            <Route path="/submissions/:id" element={<SubmissionDetail />} />
          </Route>

          <Route element={<RoleRoute roles={['moderator', 'administrator']} />}>
            <Route path="/mod" element={<ModDashboard />} />
            <Route path="/mod/disputes" element={<DisputeQueue />} />
            <Route path="/mod/disputes/:id" element={<DisputeDetail />} />
          </Route>

          <Route element={<RoleRoute roles={['administrator']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/audit" element={<AuditLog />} />
            <Route path="/admin/config" element={<SystemConfig />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
