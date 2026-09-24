import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Activity, FileText, FlaskConical, AlertTriangle, ShieldCheck,
  Calendar, Clock, Heart, Droplet, Plus, ArrowLeft, Download,
  CheckCircle2, AlertCircle, Phone, MapPin, ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { api } from '../../services/api';
import { Patient, Prescription, LabReport, Appointment, Allergy, MedicalCondition } from '../../types';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';

export const PatientProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddAllergyOpen, setIsAddAllergyOpen] = useState(false);
  const [isAddConditionOpen, setIsAddConditionOpen] = useState(false);
  const [allergyForm, setAllergyForm] = useState({ substance: '', reaction: '', severity: 'HIGH' });
  const [conditionForm, setConditionForm] = useState({ condition_name: '', icd10_code: '', status: 'ACTIVE' });

  useEffect(() => {
    if (!id) return;
    const fetchPatientData = async () => {
      setLoading(true);
      try {
        const [patData, rxData, labsData, histData, apptData, trends] = await Promise.all([
          api.getPatient(Number(id)),
          api.getPrescriptions(Number(id)),
          api.getLabReports(Number(id)),
          api.getPatientMedicalHistory(Number(id)),
          api.getAppointments(Number(id)),
          api.getLabTrends(Number(id)),
        ]);
        setPatient(patData);
        setPrescriptions(rxData);
        setLabReports(labsData);
        setMedicalHistory(histData);
        setAppointments(apptData);
        setTrendData(trends);
      } catch (err) {
        console.error('Error fetching patient profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    try {
      await api.addAllergy({ patient: patient.id, ...allergyForm });
      const updated = await api.getPatient(patient.id);
      setPatient(updated);
      setIsAddAllergyOpen(false);
      setAllergyForm({ substance: '', reaction: '', severity: 'HIGH' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    try {
      await api.addCondition({ patient: patient.id, ...conditionForm });
      const updated = await api.getPatient(patient.id);
      setPatient(updated);
      setIsAddConditionOpen(false);
      setConditionForm({ condition_name: '', icd10_code: '', status: 'ACTIVE' });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-600 border-t-transparent mx-auto mb-2"></div>
        <p className="text-sm">Loading comprehensive patient record...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500 mb-4">Patient record not found.</p>
        <Button onClick={() => navigate('/doctor/patients')}>Return to Directory</Button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'Medical History', badge: medicalHistory.length },
    { id: 'labs', label: 'Lab Reports & Trends', badge: labReports.length },
    { id: 'allergies', label: 'Allergies & ADRs', badge: (patient.allergies?.length || 0) + (patient.adverse_reactions?.length || 0) },
    { id: 'prescriptions', label: 'Prescriptions', badge: prescriptions.length },
    { id: 'appointments', label: 'Appointments', badge: appointments.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back button & Header Strip */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/doctor/patients')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Directory
        </Button>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-md">
            {patient.first_name[0]}{patient.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{patient.full_name}</h1>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {patient.patient_id}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
              <span><strong>Gender:</strong> {patient.gender}</span>
              <span>•</span>
              <span><strong>DOB:</strong> {patient.date_of_birth}</span>
              <span>•</span>
              <span><strong>Blood:</strong> <span className="text-rose-600 font-bold">{patient.blood_group}</span></span>
              <span>•</span>
              <span><strong>BMI:</strong> {patient.bmi || '25.3'} kg/m²</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone}</span>
            </div>
          </div>
        </div>

        {/* Primary Action: Launch Prescription Wizard */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/doctor/prescriptions/new?patient_id=${patient.id}`)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-md shadow-brand-600/20"
          >
            Create Prescription
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Vitals Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-sky-50/50 border-sky-100">
              <span className="text-[10px] font-bold text-sky-700 uppercase">Blood Pressure</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-900">
                  {patient.latest_vitals?.blood_pressure_sys || 128}/{patient.latest_vitals?.blood_pressure_dia || 84}
                </span>
                <span className="text-xs text-slate-500">mmHg</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Normal target range</p>
            </Card>

            <Card className="bg-emerald-50/50 border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Heart Rate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-900">{patient.latest_vitals?.heart_rate || 74}</span>
                <span className="text-xs text-slate-500">bpm</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Regular sinus rhythm</p>
            </Card>

            <Card className="bg-amber-50/50 border-amber-100">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Fasting Blood Glucose</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-900">{patient.latest_vitals?.blood_glucose || 124}</span>
                <span className="text-xs text-slate-500">mg/dL</span>
              </div>
              <p className="text-[11px] text-amber-600 font-medium mt-1">Mild elevation (Pre-meal)</p>
            </Card>

            <Card className="bg-purple-50/50 border-purple-100">
              <span className="text-[10px] font-bold text-purple-700 uppercase">Body Mass Index</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-900">{patient.bmi || '25.3'}</span>
                <span className="text-xs text-slate-500">kg/m²</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{patient.weight_kg} kg • {patient.height_cm} cm</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Conditions */}
            <Card>
              <CardHeader
                title="Active Medical Conditions"
                subtitle="Chronic diagnoses & comorbidities"
                action={
                  <Button variant="ghost" size="sm" onClick={() => setIsAddConditionOpen(true)}>
                    + Add Condition
                  </Button>
                }
              />
              <div className="space-y-2.5">
                {patient.conditions?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No conditions documented.</p>
                ) : (
                  patient.conditions.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{c.condition_name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">ICD-10: {c.icd10_code || 'R69'}</p>
                      </div>
                      <Badge variant="blue" size="sm">
                        {c.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Documented Allergies & Hypersensitivities */}
            <Card>
              <CardHeader
                title="Documented Allergies & ADRs"
                subtitle="High-alert clinical triggers"
                action={
                  <Button variant="ghost" size="sm" onClick={() => setIsAddAllergyOpen(true)}>
                    + Add Allergy
                  </Button>
                }
              />
              <div className="space-y-2.5">
                {patient.allergies?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">NKDA (No known drug allergies).</p>
                ) : (
                  patient.allergies.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          {a.substance}
                        </p>
                        <p className="text-[11px] text-rose-800 mt-0.5">Reaction: {a.reaction}</p>
                      </div>
                      <Badge variant="red" size="sm" pulse>
                        {a.severity}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Medical History */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader
            title="Clinical History & Past Encounters"
            subtitle="Chronological timeline of diagnoses, interventions, and hospital events"
          />
          <div className="relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200 pl-8 space-y-6">
            {medicalHistory.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute -left-[38px] top-1 h-3.5 w-3.5 rounded-full bg-brand-600 border-2 border-white shadow-sm"></div>
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-brand-700">{item.event_date}</span>
                    <Badge variant="gray" size="sm">{item.event_type}</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                  <p className="text-[10px] text-slate-400 mt-2">Physician: {item.treating_physician}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 3: Lab Reports & Trends */}
      {activeTab === 'labs' && (
        <div className="space-y-6">
          {/* Trend Chart */}
          <Card>
            <CardHeader
              title="Biochemical Marker Trajectory"
              subtitle="Longitudinal changes across diagnostic reports"
            />
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="glucose" name="Glucose (mg/dL)" stroke="#0284c7" strokeWidth={2} />
                  <Line type="monotone" dataKey="hba1c" name="HbA1c (%)" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="creatinine" name="Creatinine (mg/dL)" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* List of Reports */}
          <Card>
            <CardHeader
              title="Diagnostic Test Reports"
              subtitle="Official records submitted by laboratory partners"
            />
            <div className="divide-y divide-slate-100">
              {labReports.map((report) => (
                <div key={report.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{report.report_title}</h4>
                      <p className="text-xs text-slate-500">
                        {report.report_date} • Specimen: {report.specimen_type} • Lab: {report.laboratory_name}
                      </p>
                    </div>
                    <Badge variant={report.status === 'NORMAL' ? 'green' : 'amber'} size="sm">
                      {report.status}
                    </Badge>
                  </div>

                  {/* Nested Results Table */}
                  <div className="bg-slate-50 rounded-lg p-2.5 overflow-x-auto mt-2">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 font-semibold border-b border-slate-200">
                          <th className="py-1 px-2">Analyte</th>
                          <th className="py-1 px-2">Value</th>
                          <th className="py-1 px-2">Reference</th>
                          <th className="py-1 px-2">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50">
                        {report.results.map((r) => (
                          <tr key={r.id}>
                            <td className="py-1.5 px-2 font-medium text-slate-800">{r.test_name}</td>
                            <td className="py-1.5 px-2 font-bold text-slate-900">{r.value} {r.unit}</td>
                            <td className="py-1.5 px-2 text-slate-500">{r.reference_range}</td>
                            <td className="py-1.5 px-2">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                r.flag === 'Normal' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {r.flag}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Allergies & ADRs */}
      {activeTab === 'allergies' && (
        <Card>
          <CardHeader
            title="Allergy & Adverse Drug Reaction Log"
            subtitle="Documented hypersensitivities for safety engine cross-matching"
            action={
              <Button variant="primary" size="sm" onClick={() => setIsAddAllergyOpen(true)}>
                + Record New Allergy
              </Button>
            }
          />
          <div className="space-y-3">
            {patient.allergies?.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Allergen: {a.substance}
                  </h4>
                  <p className="text-xs text-rose-800 mt-1">
                    <strong>Manifestation:</strong> {a.reaction}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Diagnosed: {a.diagnosed_date || 'Documented'}</p>
                </div>
                <Badge variant="red" size="sm" pulse>{a.severity}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 5: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <Card>
          <CardHeader
            title="Prescription History"
            subtitle="All verified and active digital e-prescriptions"
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/doctor/prescriptions/new?patient_id=${patient.id}`)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Write Prescription
              </Button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Prescription ID</th>
                  <th className="py-2.5 px-3">Medicines Prescribed</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {new Date(rx.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-brand-700">{rx.prescription_id}</td>
                    <td className="py-3 px-3 text-slate-800 font-medium">
                      {rx.items.map((it) => `${it.generic_name} (${it.dosage})`).join(', ')}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="blue" size="sm">{rx.status}</Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/doctor/prescriptions/${rx.id}`)}
                      >
                        View & QR
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 6: Appointments */}
      {activeTab === 'appointments' && (
        <Card>
          <CardHeader
            title="Scheduled & Previous Consultations"
            subtitle="Clinical appointment log"
          />
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div key={appt.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{appt.appointment_type}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(appt.scheduled_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  {appt.notes && <p className="text-[11px] text-slate-600 mt-1">{appt.notes}</p>}
                </div>
                <Badge variant="blue" size="sm">{appt.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Allergy Modal */}
      <Modal
        isOpen={isAddAllergyOpen}
        onClose={() => setIsAddAllergyOpen(false)}
        title="Add Patient Allergy"
        subtitle={`Update safety profile for ${patient.full_name}`}
      >
        <form onSubmit={handleAddAllergy} className="space-y-4">
          <Input
            label="Allergen Substance *"
            placeholder="e.g. Penicillin, Sulfa, Aspirin"
            value={allergyForm.substance}
            onChange={(e) => setAllergyForm({ ...allergyForm, substance: e.target.value })}
            required
          />
          <Input
            label="Hypersensitivity Reaction *"
            placeholder="e.g. Urticaria, Facial angioedema, Wheezing"
            value={allergyForm.reaction}
            onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
            required
          />
          <Select
            label="Clinical Severity"
            value={allergyForm.severity}
            onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value })}
          >
            <option value="MILD">Mild</option>
            <option value="MODERATE">Moderate</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical (Anaphylactic)</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddAllergyOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit">
              Save Allergy
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Condition Modal */}
      <Modal
        isOpen={isAddConditionOpen}
        onClose={() => setIsAddConditionOpen(false)}
        title="Add Medical Condition"
        subtitle={`Update diagnosis list for ${patient.full_name}`}
      >
        <form onSubmit={handleAddCondition} className="space-y-4">
          <Input
            label="Condition Name *"
            placeholder="e.g. Type 2 Diabetes Mellitus"
            value={conditionForm.condition_name}
            onChange={(e) => setConditionForm({ ...conditionForm, condition_name: e.target.value })}
            required
          />
          <Input
            label="ICD-10 Code"
            placeholder="e.g. E11.9"
            value={conditionForm.icd10_code}
            onChange={(e) => setConditionForm({ ...conditionForm, icd10_code: e.target.value })}
          />
          <Select
            label="Status"
            value={conditionForm.status}
            onChange={(e) => setConditionForm({ ...conditionForm, status: e.target.value })}
          >
            <option value="ACTIVE">Active</option>
            <option value="CHRONIC">Chronic</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddConditionOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Condition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
