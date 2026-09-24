import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { PatientsPage } from './pages/doctor/PatientsPage';
import { PatientProfilePage } from './pages/doctor/PatientProfilePage';
import { CreatePrescriptionPage } from './pages/doctor/CreatePrescriptionPage';
import { PrescriptionsListPage } from './pages/doctor/PrescriptionsListPage';
import { MedicineDatabasePage } from './pages/medicines/MedicineDatabasePage';
import { PharmacyDashboard } from './pages/pharmacy/PharmacyDashboard';
import { PharmacyInventoryPage } from './pages/pharmacy/PharmacyInventoryPage';
import { DispensingHistoryPage } from './pages/pharmacy/DispensingHistoryPage';
import { LabPortalPage } from './pages/lab/LabPortalPage';
import { PatientPortalPage } from './pages/patient/PatientPortalPage';
import { AppointmentsPage } from './pages/shared/AppointmentsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Role-based root redirector
const RootRedirect: React.FC = () => {
  const { role, user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
  if (role === 'PHARMACY') return <Navigate to="/pharmacy" replace />;
  if (role === 'LABORATORY') return <Navigate to="/lab" replace />;
  return <Navigate to="/doctor/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Authenticated Application routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<RootRedirect />} />

            {/* Doctor & Clinical */}
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/patients" element={<PatientsPage />} />
            <Route path="/doctor/patients/:id" element={<PatientProfilePage />} />
            <Route path="/doctor/prescriptions" element={<PrescriptionsListPage />} />
            <Route path="/doctor/prescriptions/new" element={<CreatePrescriptionPage />} />
            <Route path="/doctor/prescriptions/:id" element={<PrescriptionsListPage />} />
            <Route path="/doctor/labs" element={<LabPortalPage />} />
            <Route path="/medicines" element={<MedicineDatabasePage />} />

            {/* Pharmacy Portal */}
            <Route path="/pharmacy" element={<PharmacyDashboard />} />
            <Route path="/pharmacy/verify" element={<PharmacyDashboard />} />
            <Route path="/pharmacy/inventory" element={<PharmacyInventoryPage />} />
            <Route path="/pharmacy/history" element={<DispensingHistoryPage />} />

            {/* Laboratory Portal */}
            <Route path="/lab" element={<LabPortalPage />} />
            <Route path="/lab/patients" element={<PatientsPage />} />
            <Route path="/lab/upload" element={<LabPortalPage />} />

            {/* Patient Portal */}
            <Route path="/patient/dashboard" element={<PatientPortalPage />} />
            <Route path="/patient/prescriptions" element={<PatientPortalPage />} />
            <Route path="/patient/labs" element={<PatientPortalPage />} />
            <Route path="/patient/appointments" element={<PatientPortalPage />} />
            <Route path="/patient/consent" element={<PatientPortalPage />} />

            {/* Shared Appointments */}
            <Route path="/appointments" element={<AppointmentsPage />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
