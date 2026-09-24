import React, { useState } from 'react';
import {
  Settings, User, Lock, Bell, Shield, Database, CheckCircle2,
  Code, RefreshCw, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';

export const SettingsPage: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'fhir' | 'security' | 'system'>('profile');

  // FHIR schema inspector state
  const [fhirType, setFhirType] = useState('patient');
  const [fhirId, setFhirId] = useState(1);
  const [fhirJson, setFhirJson] = useState<any>(null);
  const [fhirLoading, setFhirLoading] = useState(false);

  const fetchFhirResource = async () => {
    setFhirLoading(true);
    try {
      const data = await api.getFhirResource(fhirType, fhirId);
      setFhirJson(data);
    } catch (err: any) {
      setFhirJson({ error: err.message || 'Resource not found' });
    } finally {
      setFhirLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage user credentials, security protocols, system version, and FHIR R4 interoperability schemas.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Profile & Account
        </button>
        <button
          onClick={() => {
            setActiveTab('fhir');
            if (!fhirJson) fetchFhirResource();
          }}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'fhir'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="w-3.5 h-3.5" /> FHIR R4 & ABDM Prototype
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'security'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Security & Sessions
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'system'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          System Info
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="User Profile Details" subtitle="Primary account details and clinical credentials" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <Input label="Full Name" value={`${user?.first_name} ${user?.last_name}`} disabled />
              <Input label="Email Address" value={user?.email || ''} disabled />
              <Input label="Active System Role" value={role || 'GUEST'} disabled />
              <Input label="Contact Phone" value={user?.phone || '+91 98450 11223'} disabled />
            </div>
          </Card>
        </div>
      )}

      {/* FHIR & ABDM Interoperability Tab */}
      {activeTab === 'fhir' && (
        <div className="space-y-6">
          {/* Status Badges Required by Prompt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block mb-1">
                Data Architecture Standard
              </span>
              <h4 className="text-sm font-bold text-sky-950">
                FHIR-compatible data structure — Prototype
              </h4>
              <p className="text-xs text-sky-800 mt-1">
                Clinical records are structured to map seamlessly to HL7 FHIR Release 4 standard specifications.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block mb-1">
                National Health Stack Roadmap
              </span>
              <h4 className="text-sm font-bold text-purple-950">
                ABDM integration — Future implementation
              </h4>
              <p className="text-xs text-purple-800 mt-1">
                Designed with Ayushman Bharat Digital Mission (ABDM) ABHA address identifiers and Consent Manager readiness.
              </p>
            </div>
          </div>

          {/* Interactive FHIR R4 JSON Resource Explorer */}
          <Card>
            <CardHeader
              title="Live HL7 FHIR R4 Resource Serializer"
              subtitle="Inspect raw FHIR R4 standard JSON models generated live from SQLite database"
            />

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Resource Type</label>
                <select
                  value={fhirType}
                  onChange={(e) => setFhirType(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold"
                >
                  <option value="patient">Patient (FHIR R4)</option>
                  <option value="condition">Condition (ICD-10)</option>
                  <option value="allergy">AllergyIntolerance</option>
                  <option value="observation">Observation (Vital Signs)</option>
                  <option value="diagnosticreport">DiagnosticReport (Laboratory)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Record ID</label>
                <input
                  type="number"
                  value={fhirId}
                  onChange={(e) => setFhirId(Number(e.target.value))}
                  className="w-24 text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-semibold"
                />
              </div>

              <div className="pt-5">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={fetchFhirResource}
                  isLoading={fhirLoading}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Serialize FHIR R4 JSON
                </Button>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[360px] shadow-inner">
              <pre>{JSON.stringify(fhirJson, null, 2)}</pre>
            </div>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader title="Security Controls & Role Authorization" subtitle="Local session token and permissions management" />
          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 block">Session Token Authentication</span>
                <span className="text-[11px] text-slate-500 font-mono">DRF TokenAuth via Authorization Header</span>
              </div>
              <Badge variant="green" size="sm">Active</Badge>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 block">Role-Based Access Control (RBAC)</span>
                <span className="text-[11px] text-slate-500">Backend permissions enforce Doctor/Lab/Pharmacy boundaries</span>
              </div>
              <Badge variant="green" size="sm">Enforced</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <Card>
          <CardHeader title="System Architecture & Environment" subtitle="Local prototype build information" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Frontend</span>
              <span className="font-bold text-slate-900">React 18 + Vite + TS</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Styling</span>
              <span className="font-bold text-slate-900">Tailwind CSS</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Backend API</span>
              <span className="font-bold text-slate-900">Django + DRF 3.14</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Database</span>
              <span className="font-bold text-slate-900">SQLite (Local)</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
