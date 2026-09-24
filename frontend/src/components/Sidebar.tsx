import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, FlaskConical,
  Pill, Calendar, ShieldCheck, QrCode, PlusCircle,
  LogOut, User as UserIcon, X, CheckSquare, PackageCheck,
  Building2, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (role === 'PATIENT') {
      return [
        { to: '/patient/dashboard', label: 'Health Overview', icon: <Activity className="w-4 h-4" /> },
        { to: '/patient/prescriptions', label: 'My Prescriptions', icon: <FileText className="w-4 h-4" /> },
        { to: '/patient/labs', label: 'Lab Reports', icon: <FlaskConical className="w-4 h-4" /> },
        { to: '/patient/appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
        { to: '/patient/consent', label: 'Consent', icon: <ShieldCheck className="w-4 h-4" /> },
      ];
    }

    if (role === 'PHARMACY') {
      return [
        { to: '/pharmacy', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { to: '/pharmacy/verify', label: 'Verify Prescription', icon: <QrCode className="w-4 h-4" /> },
        { to: '/pharmacy/inventory', label: 'Inventory', icon: <Pill className="w-4 h-4" /> },
        { to: '/pharmacy/history', label: 'Dispensing History', icon: <PackageCheck className="w-4 h-4" /> },
      ];
    }

    if (role === 'LABORATORY') {
      return [
        { to: '/lab', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { to: '/lab/patients', label: 'Patients', icon: <Users className="w-4 h-4" /> },
        { to: '/lab/upload', label: 'Upload Reports', icon: <FlaskConical className="w-4 h-4" /> },
      ];
    }

    // Default: DOCTOR NAVIGATION
    return [
      { to: '/doctor/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { to: '/doctor/patients', label: 'Patients', icon: <Users className="w-4 h-4" /> },
      { to: '/doctor/prescriptions', label: 'Prescriptions', icon: <FileText className="w-4 h-4" /> },
      { to: '/doctor/labs', label: 'Lab Reports', icon: <FlaskConical className="w-4 h-4" /> },
      { to: '/appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
      { to: '/medicines', label: 'Medicines', icon: <Pill className="w-4 h-4" /> },
    ];
  };

  const navLinks = getNavLinks();

  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (role === 'DOCTOR') {
      return `Dr. ${user.first_name} ${user.last_name}`.trim();
    }
    if (role === 'LABORATORY') {
      return user.lab_profile?.lab_name || 'Apex Diagnostics';
    }
    if (role === 'PHARMACY') {
      return user.pharmacy_profile?.pharmacy_name || 'Apollo Care Pharmacy';
    }
    return `${user.first_name} ${user.last_name}`.trim() || user.username;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 text-slate-300 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm font-bold text-sm">
              Rx
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">RXCARE</span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 tracking-tight font-medium">
                Safer Prescriptions. Healthier Lives.
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
                }`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-navy-800 space-y-2">
          {/* Doctor Portal: + Create Prescription button */}
          {role === 'DOCTOR' && (
            <NavLink
              to="/doctor/prescriptions/new"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create Prescription</span>
            </NavLink>
          )}

          {/* User Info & Actions */}
          <div className="p-2.5 rounded-lg bg-navy-950/70 border border-navy-800/80">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-full bg-navy-800 text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.first_name ? user.first_name[0] : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {getUserDisplayName()}
                </p>
                <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider">
                  {role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 pt-1.5 border-t border-navy-800/60 text-[11px]">
              <button
                onClick={() => {
                  if (onClose) onClose();
                  if (role === 'PATIENT') navigate('/patient/dashboard');
                  else if (role === 'DOCTOR') navigate('/doctor/dashboard');
                  else if (role === 'LABORATORY') navigate('/lab');
                  else if (role === 'PHARMACY') navigate('/pharmacy');
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-navy-800 transition-colors flex-1"
              >
                <UserIcon className="w-3 h-3" />
                <span>Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2 py-1 rounded text-rose-400 hover:text-rose-300 hover:bg-navy-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
