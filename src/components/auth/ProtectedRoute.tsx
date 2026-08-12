import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Admin route check
  if (location.pathname.startsWith('/admin') && user.role !== 'ADMIN' && user.role !== 'MOD' && user.role !== 'MODERATOR') {
    toast.error("Bạn cần quyền Quản trị viên để truy cập khu vực này.");
    return <Navigate to="/home" replace />;
  }

  // Create Character check: Only approved Creators or Admins can post Characters
  if ((location.pathname.startsWith('/create-character') || location.pathname.startsWith('/edit-character')) && !user.creatorStatus && user.role !== 'ADMIN') {
    toast.error("Chỉ Creator đã được Quản trị viên phê duyệt mới có thể đăng Character.");
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
