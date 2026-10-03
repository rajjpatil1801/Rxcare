import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, User as UserIcon, FlaskConical, Store,
  Lock, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2,
  AlertTriangle, UserPlus, LogIn, ChevronRight
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';

type RoleType = 'DOCTOR' | 'PATIENT' | 'LABORATORY' | 'PHARMACY';

export const LoginPage: React.FC = () => {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  // Stage 1: Role Selection | Stage 2: Role Login / Register
  const [stage, setStage] = useState<'SELECT_ROLE' | 'ROLE_AUTH'>('SELECT_ROLE');
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [authMode, setAuthMode] = useState<'SIGNIN' | 'SIGNUP'>('SIGNIN');

  // Sign In inputs
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign Up inputs
  const [regData, setRegData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    // Role specific
    specialty: 'Internal Medicine',
    license_number: '',
    clinic_name: 'Metro City Hospital',
    gender: 'Male',
    blood_group: 'O+',
    date_of_birth: '1990-01-01',
    lab_name: 'City Diagnostics Lab',
    pharmacy_name: 'Care Health Pharmacy',
  });

  const roleInfo: Record<RoleType, {
    title: string;
    loginTitle: string;
    idLabel: string;
    idPlaceholder: string;
    demoId: string;
    icon: React.ReactNode;
    color: string;
    accentBg: string;
    borderActive: string;
    description: string;
  }> = {
    DOCTOR: {
      title: 'Doctor',
      loginTitle: 'DOCTOR LOGIN',
      idLabel: 'Doctor ID / Email',
      idPlaceholder: 'DR-1001 or doctor@rxcare.demo',
      demoId: DEMO_CREDENTIALS.DOCTOR.id,
      icon: <Stethoscope className="w-6 h-6 text-brand-600" />,
      color: 'text-brand-700',
      accentBg: 'bg-brand-50',
      borderActive: 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20',
      description: 'Prescribe, Review EHR, Clinical Safety Alerts',
    },
    PATIENT: {
      title: 'Patient',
      loginTitle: 'PATIENT LOGIN',
      idLabel: 'Aadhar ID / Email',
      idPlaceholder: '987654321001 or patient@rxcare.demo',
      demoId: DEMO_CREDENTIALS.PATIENT.id,
      icon: <UserIcon className="w-6 h-6 text-emerald-600" />,
      color: 'text-emerald-700',
      accentBg: 'bg-emerald-50',
      borderActive: 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20',
      description: 'Health Portal, Prescriptions, Lab Reports, Consent',
    },
    LABORATORY: {
      title: 'Laboratory',
      loginTitle: 'LABORATORY LOGIN',
      idLabel: 'Laboratory ID / Email',
      idPlaceholder: 'LAB-1001 or lab@rxcare.demo',
      demoId: DEMO_CREDENTIALS.LABORATORY.id,
      icon: <FlaskConical className="w-6 h-6 text-purple-600" />,
      color: 'text-purple-700',
      accentBg: 'bg-purple-50',
      borderActive: 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-500/20',
      description: 'Upload Test Results, Diagnostic Records',
    },
    PHARMACY: {
      title: 'Pharmacy',
      loginTitle: 'PHARMACY LOGIN',
      idLabel: 'Pharmacy ID / Email',
      idPlaceholder: 'PHARM-1001 or pharmacy@rxcare.demo',
      demoId: DEMO_CREDENTIALS.PHARMACY.id,
      icon: <Store className="w-6 h-6 text-amber-600" />,
      color: 'text-amber-800',
      accentBg: 'bg-amber-50',
      borderActive: 'border-amber-600 bg-amber-50/40 ring-2 ring-amber-500/20',
      description: 'Verify QR Prescriptions, Dispense & Inventory',
    },
  };

  const handleSelectRole = (role: RoleType) => {
    setSelectedRole(role);
  };

  const handleContinueToLogin = () => {
    if (!selectedRole) return;
    setError(null);
    setSuccessMessage(null);
    // Pre-populate with role default demo ID
    setLoginId(roleInfo[selectedRole].demoId);
    setPassword('demo123');
    setAuthMode('SIGNIN');
    setStage('ROLE_AUTH');
  };

  const handleBackToRoles = () => {
    setError(null);
    setSuccessMessage(null);
    setStage('SELECT_ROLE');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setError(null);
    setSuccessMessage(null);

    try {
      const resp = await login(loginId, password, selectedRole);
      // Redirect directly to the appropriate dashboard
      if (resp.redirect_url) {
        navigate(resp.redirect_url);
      } else if (selectedRole === 'DOCTOR') {
        navigate('/doctor/dashboard');
      } else if (selectedRole === 'PATIENT') {
        navigate('/patient/dashboard');
      } else if (selectedRole === 'LABORATORY') {
        navigate('/lab');
      } else if (selectedRole === 'PHARMACY') {
        navigate('/pharmacy');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleFillDemoCreds = () => {
    if (!selectedRole) return;
    setLoginId(roleInfo[selectedRole].demoId);
    setPassword('demo123');
    setError(null);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setError(null);
    setSuccessMessage(null);

    if (regData.password !== regData.confirm_password) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (selectedRole === 'PATIENT' && !/^\d{12}$/.test(regData.username.trim())) {
      setError('Aadhar ID must be exactly 12 digits.');
      return;
    }

    try {
      const payload = {
        role: selectedRole,
        username: regData.username.trim(),
        first_name: regData.first_name.trim(),
        last_name: regData.last_name.trim(),
        email: regData.email.trim(),
        phone: regData.phone.trim(),
        password: regData.password,
        specialty: regData.specialty,
        license_number: regData.license_number,
        clinic_name: regData.clinic_name,
        gender: regData.gender,
        blood_group: regData.blood_group,
        date_of_birth: regData.date_of_birth,
        lab_name: regData.lab_name,
        pharmacy_name: regData.pharmacy_name,
      };

      const resp = await register(payload);
      setSuccessMessage('Registration successful! Redirecting to your clinical dashboard...');
      setTimeout(() => {
        if (resp.redirect_url) {
          navigate(resp.redirect_url);
        } else if (selectedRole === 'DOCTOR') {
          navigate('/doctor/dashboard');
        } else if (selectedRole === 'PATIENT') {
          navigate('/patient/dashboard');
        } else if (selectedRole === 'LABORATORY') {
          navigate('/lab');
        } else if (selectedRole === 'PHARMACY') {
          navigate('/pharmacy');
        }
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    }
  };

  return (
    <div className="bg-white py-8 px-6 sm:px-10 shadow-lg rounded-2xl border border-slate-200">
      {/* ========================================================
          SCREEN 1: SELECT YOUR ROLE TO CONTINUE
          ======================================================== */}
      {stage === 'SELECT_ROLE' && (
        <div>
          <div className="text-center mb-7">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">RXCARE</h2>
            <p className="text-sm font-semibold text-brand-600 mt-0.5">
              Safer Prescriptions. Healthier Lives.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-500">
                Select your role to continue
              </p>
            </div>
          </div>

          {/* 2x2 Grid Role Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-7">
            {(['DOCTOR', 'PATIENT', 'LABORATORY', 'PHARMACY'] as RoleType[]).map((r) => {
              const info = roleInfo[r];
              const isSelected = selectedRole === r;

              return (
                <div
                  key={r}
                  id={`role-select-${r.toLowerCase()}`}
                  onClick={() => handleSelectRole(r)}
                  className={`relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer select-none text-left ${
                    isSelected
                      ? info.borderActive
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${info.accentBg}`}>
                      {info.icon}
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{info.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {info.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Continue button */}
          <Button
            id="continue-role-btn"
            variant="primary"
            size="lg"
            className="w-full justify-center"
            disabled={!selectedRole}
            onClick={handleContinueToLogin}
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4 ml-1.5" />
          </Button>

          <p className="text-center text-[11px] text-slate-400 mt-4">
            Authorized healthcare personnel and registered patients only.
          </p>
        </div>
      )}

      {/* ========================================================
          SCREEN 2: ROLE-SPECIFIC LOGIN / SIGN-UP
          ======================================================== */}
      {stage === 'ROLE_AUTH' && selectedRole && (
        <div>
          {/* Header with Back button and Role Title */}
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <button
              onClick={handleBackToRoles}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Role</span>
            </button>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Role: {selectedRole}
            </span>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {roleInfo[selectedRole].loginTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your credentials to access the {selectedRole.toLowerCase()} portal.
            </p>
          </div>

          {error && (
            <Alert type="error" className="mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="text-xs font-medium">{error}</span>
              </div>
            </Alert>
          )}

          {successMessage && (
            <Alert type="success" className="mb-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs font-medium">{successMessage}</span>
              </div>
            </Alert>
          )}

          {/* Toggle between Sign In and Sign Up (New User) */}
          <div className="flex border-b border-slate-200 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('SIGNIN');
                setError(null);
              }}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                authMode === 'SIGNIN'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('SIGNUP');
                setError(null);
              }}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                authMode === 'SIGNUP'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New User? Sign Up</span>
            </button>
          </div>

          {/* MODE 1: SIGN IN */}
          {authMode === 'SIGNIN' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Input
                  id="login-identifier-input"
                  label={roleInfo[selectedRole].idLabel}
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  placeholder={roleInfo[selectedRole].idPlaceholder}
                />
              </div>

              <div>
                <Input
                  id="login-password-input"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-1">
                <Button
                  id="submit-login-btn"
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  isLoading={loading}
                >
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>

              {/* Demo Credentials Box */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700">Demo Credentials</span>
                  <button
                    type="button"
                    onClick={handleFillDemoCreds}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-800 underline cursor-pointer"
                  >
                    Auto-fill Demo
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-600 space-y-0.5">
                  <div>
                    <span className="text-slate-400">{roleInfo[selectedRole].idLabel}: </span>
                    <span className="font-semibold text-slate-800">{roleInfo[selectedRole].demoId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Password: </span>
                    <span className="font-semibold text-slate-800">demo123</span>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* MODE 2: SIGN UP FOR NEW USER */}
          {authMode === 'SIGNUP' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="p-2.5 bg-brand-50/50 rounded-lg border border-brand-100 text-[11px] text-brand-800 mb-2">
                Registering new <strong>{roleInfo[selectedRole].title}</strong> account. All fields are verified locally.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  type="text"
                  value={regData.first_name}
                  onChange={(e) => setRegData({ ...regData, first_name: e.target.value })}
                  required
                  placeholder="e.g. Ramesh"
                />
                <Input
                  label="Last Name"
                  type="text"
                  value={regData.last_name}
                  onChange={(e) => setRegData({ ...regData, last_name: e.target.value })}
                  required
                  placeholder="e.g. Sharma"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={selectedRole === 'PATIENT' ? 'Aadhar ID *' : `${roleInfo[selectedRole].title} ID`}
                  type="text"
                  value={regData.username}
                  onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                  placeholder={selectedRole === 'PATIENT' ? '12-digit Aadhar (Required)' : 'Optional (Auto-generated)'}
                  required={selectedRole === 'PATIENT'}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                required
                placeholder="name@rxcare.local"
              />

              {/* Role specific inputs */}
              {selectedRole === 'DOCTOR' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Input
                    label="Medical Specialty"
                    type="text"
                    value={regData.specialty}
                    onChange={(e) => setRegData({ ...regData, specialty: e.target.value })}
                    required
                    placeholder="e.g. Cardiology"
                  />
                  <Input
                    label="Medical License No."
                    type="text"
                    value={regData.license_number}
                    onChange={(e) => setRegData({ ...regData, license_number: e.target.value })}
                    placeholder="e.g. MCI-12345"
                  />
                </div>
              )}

              {selectedRole === 'PATIENT' && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={regData.gender}
                      onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                      className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                    <select
                      value={regData.blood_group}
                      onChange={(e) => setRegData({ ...regData, blood_group: e.target.value })}
                      className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                    >
                      <option value="O+">O+</option>
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="AB+">AB+</option>
                      <option value="O-">O-</option>
                      <option value="A-">A-</option>
                      <option value="B-">B-</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={regData.date_of_birth}
                      onChange={(e) => setRegData({ ...regData, date_of_birth: e.target.value })}
                      className="w-full text-xs rounded-lg border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                </div>
              )}

              {selectedRole === 'LABORATORY' && (
                <Input
                  label="Diagnostic Laboratory Name"
                  type="text"
                  value={regData.lab_name}
                  onChange={(e) => setRegData({ ...regData, lab_name: e.target.value })}
                  required
                  placeholder="e.g. Apex Diagnostics"
                />
              )}

              {selectedRole === 'PHARMACY' && (
                <Input
                  label="Pharmacy Facility Name"
                  type="text"
                  value={regData.pharmacy_name}
                  onChange={(e) => setRegData({ ...regData, pharmacy_name: e.target.value })}
                  required
                  placeholder="e.g. Apollo Care Pharmacy"
                />
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Input
                  label="Password"
                  type="password"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  required
                  placeholder="Min 4 characters"
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={regData.confirm_password}
                  onChange={(e) => setRegData({ ...regData, confirm_password: e.target.value })}
                  required
                  placeholder="Re-enter password"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  isLoading={loading}
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  <span>Create {roleInfo[selectedRole].title} Account</span>
                </Button>
              </div>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Role-Verified Local DRF Auth
            </span>
            <span className="font-mono">SQLite Local DB</span>
          </div>
        </div>
      )}
    </div>
  );
};
