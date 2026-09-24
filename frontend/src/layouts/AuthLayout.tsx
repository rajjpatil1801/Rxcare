import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (user) {
    if (role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
    if (role === 'PHARMACY') return <Navigate to="/pharmacy" replace />;
    if (role === 'LABORATORY') return <Navigate to="/lab" replace />;
    return <Navigate to="/doctor/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white shadow-lg shadow-brand-500/20 mb-3">
          <Activity className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          RxCare
        </h1>
        <p className="mt-1 text-sm font-semibold text-brand-700">
          Safer Prescriptions. Healthier Lives.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <Outlet />
      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        <p>RxCare Clinical Safety & E-Prescribing Platform Prototype</p>
        <p className="mt-1">For demonstration and evaluation purposes only.</p>
      </div>
    </div>
  );
};
