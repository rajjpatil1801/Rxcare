import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, User as UserIcon, LogOut, CheckCheck,
  ShieldAlert, FlaskConical, FileText, CheckCircle2, ChevronDown, Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NotificationItem, UserRole } from '../types';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const navigate = useNavigate();

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs);
      } catch {
        // Silently fail if offline or logged out
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'SAFETY_ALERT':
        return <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      case 'LAB_REPORT':
        return <FlaskConical className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />;
      case 'PRESCRIPTION_NEW':
      case 'PRESCRIPTION_VERIFIED':
        return <FileText className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />;
      case 'DISPENSING':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />;
    }
  };

  const roleColors: Record<UserRole, string> = {
    DOCTOR: 'bg-brand-50 text-brand-700 border-brand-200',
    PATIENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    LABORATORY: 'bg-purple-50 text-purple-700 border-purple-200',
    PHARMACY: 'bg-amber-50 text-amber-800 border-amber-200',
    ADMIN: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const getPortalTitle = () => {
    if (role === 'DOCTOR') return 'Doctor Portal • Clinical Information System';
    if (role === 'PATIENT') return 'Patient Health Portal';
    if (role === 'LABORATORY') return 'Laboratory Portal • Diagnostic Services';
    if (role === 'PHARMACY') return 'Pharmacy Portal • Verification & Dispensing';
    return 'Clinical System';
  };

  const getUserFullName = () => {
    if (!user) return 'User';
    if (role === 'DOCTOR') {
      return `Dr. ${user.first_name} ${user.last_name}`.trim();
    }
    return `${user.first_name} ${user.last_name}`.trim() || user.username;
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 transition-all">
        {/* Left Section: Mobile Menu + Portal Context */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
              {getPortalTitle()}
            </span>
          </div>
        </div>

        {/* Right Section: Notification icon + Current User + Role badge + Profile Dropdown */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-lg border border-slate-200 py-3 z-50 animate-in fade-in duration-100">
                <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-700 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark read
                    </button>
                  )}
                </div>

                <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                          !n.is_read ? 'bg-brand-50/20' : ''
                        }`}
                        onClick={() => {
                          if (n.link) {
                            setNotificationsOpen(false);
                            navigate(n.link);
                          }
                        }}
                      >
                        {getNotifIcon(n.notification_type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 leading-snug">{n.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-brand-600 mt-1 shrink-0"></span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current User & Role Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            >
              <div className="flex flex-col text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {getUserFullName()}
                </span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  {role || 'User'}
                </span>
              </div>
              <div className="h-7 w-7 rounded-md bg-navy-900 text-white flex items-center justify-center font-bold text-xs">
                {user?.first_name ? user.first_name[0] : 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown: strictly Profile and Logout */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-slate-200 p-2 z-50 animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900">{getUserFullName()}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1.5">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${role ? roleColors[role] : ''}`}>
                      {role}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={async () => {
                      setProfileOpen(false);
                      await logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-md flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Details Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">User Profile</h3>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-sm">
                  {user?.first_name ? user.first_name[0] : 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{getUserFullName()}</h4>
                  <p className="text-slate-500">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 border border-slate-100 rounded-lg">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Account Role</span>
                  <span className="font-semibold text-slate-800">{user?.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Username / ID</span>
                  <span className="font-semibold text-slate-800">{user?.username}</span>
                </div>
                {user?.phone && (
                  <div className="col-span-2 mt-1">
                    <span className="text-slate-400 block text-[10px] uppercase">Phone</span>
                    <span className="font-semibold text-slate-800">{user.phone}</span>
                  </div>
                )}
                {user?.doctor_profile && (
                  <>
                    <div className="mt-1">
                      <span className="text-slate-400 block text-[10px] uppercase">Specialty</span>
                      <span className="font-semibold text-slate-800">{user.doctor_profile.specialty}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-slate-400 block text-[10px] uppercase">License</span>
                      <span className="font-semibold text-slate-800">{user.doctor_profile.license_number}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
