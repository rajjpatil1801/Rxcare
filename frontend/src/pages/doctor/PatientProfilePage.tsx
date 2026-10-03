import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Activity, FileText, FlaskConical, AlertTriangle, ShieldCheck,
  Calendar, Clock, Heart, Droplet, Plus, ArrowLeft, Download,
  CheckCircle2, AlertCircle, Phone, MapPin, ExternalLink, ClipboardList, Send
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { api } from '../../services/api';
import { Patient, Prescription, LabReport, Appointment, Allergy, MedicalCondition, LabTestOrder } from '../../types';
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
  const [isRecordVitalsOpen, setIsRecordVitalsOpen] = useState(false);
  const [vitalsSubmitting, setVitalsSubmitting] = useState(false);
  const [allergyForm, setAllergyForm] = useState({ substance: '', reaction: '', severity: 'HIGH' });
  const [conditionForm, setConditionForm] = useState({ condition_name: '', icd10_code: '', status: 'ACTIVE' });
  const [vitalsForm, setVitalsForm] = useState<{
    blood_pressure_sys: number | string;
    blood_pressure_dia: number | string;
    heart_rate: number | string;
    blood_glucose: number | string;
    weight_kg: number | string;
    height_cm: number | string;
    bmi: number | string;
    temperature_f: number | string;
    spo2: number | string;
    notes: string;
  }>({
    blood_pressure_sys: '',
    blood_pressure_dia: '',
    heart_rate: '',
    blood_glucose: '',
    weight_kg: '',
    height_cm: '',
    bmi: '',
    temperature_f: '',
    spo2: '',
    notes: '',
  });

  // Diagnostic Lab Test Orders
  const [labTestOrders, setLabTestOrders] = useState<LabTestOrder[]>([]);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [labOrderNotes, setLabOrderNotes] = useState('');
  const [labOrderSubmitting, setLabOrderSubmitting] = useState(false);

  const DIAGNOSTIC_REPORTS = [
    { case_code: 'CASE_01', test_name: 'Complete Blood Count (CBC) with Peripheral Blood Smear', clinical_scenario: 'Acute Viral Fever / Dengue Evaluation' },
    { case_code: 'CASE_02', test_name: 'Comprehensive Lipid Profile & Atherogenic Indices', clinical_scenario: 'Routine Executive Health Checkup' },
    { case_code: 'CASE_03', test_name: 'HbA1c & Fasting / Postprandial Plasma Glucose', clinical_scenario: 'Type 2 Diabetes Mellitus Management' },
    { case_code: 'CASE_04', test_name: 'Thyroid Function Test (T3, T4, Ultra-sensitive TSH)', clinical_scenario: 'Hypothyroidism Evaluation' },
    { case_code: 'CASE_05', test_name: 'Liver Function Test (LFT) with Enzymes', clinical_scenario: 'Non-Alcoholic Fatty Liver Disease (NAFLD)' },
    { case_code: 'CASE_06', test_name: 'Renal Function Test (RFT) & Serum Electrolytes', clinical_scenario: 'Hypertension Monitoring' },
    { case_code: 'CASE_07', test_name: 'Serum Vitamin D (25-OH) & Vitamin B12', clinical_scenario: 'Chronic Fatigue & Bone Health Assessment' },
    { case_code: 'CASE_08', test_name: 'Urine Routine & Microscopy', clinical_scenario: 'Suspected Urinary Tract Infection (UTI)' },
    { case_code: 'CASE_09', test_name: 'Fever Panel (Malaria, Dengue, Chikungunya, Typhoid)', clinical_scenario: 'Acute Febrile Illness' },
    { case_code: 'CASE_10', test_name: 'Cardiac Risk Markers (hs-CRP, Troponin-I, NT-proBNP, CK-MB)', clinical_scenario: 'Acute Chest Pain Evaluation' },
    { case_code: 'CASE_11', test_name: 'Iron Profile / Anemia Panel (Ferritin, Serum Iron, TIBC)', clinical_scenario: 'Microcytic Anemia Workup' },
    { case_code: 'CASE_12', test_name: 'Serum Electrolytes & Renal Markers', clinical_scenario: 'Dehydration / Heat Exhaustion' },
    { case_code: 'CASE_13', test_name: 'Dual Screen / Triple Screen Maternal Serum Markers', clinical_scenario: 'Antenatal Screening' },
    { case_code: 'CASE_14', test_name: 'Prostate Specific Antigen (Total & Free PSA)', clinical_scenario: 'Prostatic Enlargement Assessment' },
    { case_code: 'CASE_15', test_name: 'Rheumatoid Factor (RF), anti-CCP, & ESR', clinical_scenario: 'Polyarthralgia / Rheumatoid Arthritis Panel' },
    { case_code: 'CASE_16', test_name: 'Complete Metabolic Profile & Serum Calcium / Phosphorus', clinical_scenario: 'Osteopenia / Metabolic Bone Screening' },
    { case_code: 'CASE_17', test_name: 'Coagulation Profile (PT/INR, APTT, Fibrinogen)', clinical_scenario: 'Pre-Operative Surgical Clearance' },
    { case_code: 'CASE_18', test_name: 'Serum Immunology (IgE Total, Allergy Screening)', clinical_scenario: 'Atopic Asthma / Allergic Rhinitis' },
    { case_code: 'CASE_19', test_name: 'Serum Proteins & Immunofixation Electrophoresis', clinical_scenario: 'Monoclonal Gammopathy Screening' },
    { case_code: 'CASE_20', test_name: 'Arterial Blood Gas (ABG) & Lactate Analysis', clinical_scenario: 'ICU Critical Care Monitoring' },
  ] as const;

  useEffect(() => {
    if (!id) return;
    const fetchPatientData = async () => {
      setLoading(true);
      try {
        const [patData, rxData, labsData, histData, apptData, trends, labOrders] = await Promise.all([
          api.getPatient(Number(id)),
          api.getPrescriptions(Number(id)),
          api.getLabReports(Number(id)),
          api.getPatientMedicalHistory(Number(id)),
          api.getAppointments(Number(id)),
          api.getLabTrends(Number(id)),
          api.getLabTestOrders(Number(id)),
        ]);
        setPatient(patData);
        setPrescriptions(rxData);
        setLabReports(labsData);
        setMedicalHistory(histData);
        setAppointments(apptData);
        setTrendData(trends);
        setLabTestOrders(labOrders);
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

  // Sync vitals form whenever patient data loads
  useEffect(() => {
    if (patient) {
      const sys = patient.latest_vitals?.blood_pressure_sys ?? '';
      const dia = patient.latest_vitals?.blood_pressure_dia ?? '';
      const hr = patient.latest_vitals?.heart_rate ?? '';
      const bg = patient.latest_vitals?.blood_glucose ?? '';
      const wt = patient.weight_kg ?? '';
      const ht = patient.height_cm ?? '';
      const calcBmi = (ht && wt && ht > 0) ? Number((wt / ((ht / 100) * (ht / 100))).toFixed(1)) : '';
      const currentBmi = patient.latest_vitals?.bmi || patient.bmi || calcBmi || '';

      setVitalsForm({
        blood_pressure_sys: sys,
        blood_pressure_dia: dia,
        heart_rate: hr,
        blood_glucose: bg,
        weight_kg: wt,
        height_cm: ht,
        bmi: currentBmi,
        temperature_f: patient.latest_vitals?.temperature_f ?? '',
        spo2: patient.latest_vitals?.spo2 ?? '',
        notes: patient.latest_vitals?.notes || '',
      });
    }
  }, [patient]);

  const handleBiometricsChange = (wt: number, ht: number) => {
    let computedBmi = vitalsForm.bmi;
    if (ht > 0 && wt > 0) {
      computedBmi = Number((wt / ((ht / 100) * (ht / 100))).toFixed(1));
    }
    setVitalsForm((prev) => ({
      ...prev,
      weight_kg: wt,
      height_cm: ht,
      bmi: computedBmi,
    }));
  };

  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setVitalsSubmitting(true);
    try {
      await api.addVital({
        patient: patient.id,
        blood_pressure_sys: Number(vitalsForm.blood_pressure_sys),
        blood_pressure_dia: Number(vitalsForm.blood_pressure_dia),
        heart_rate: Number(vitalsForm.heart_rate),
        blood_glucose: Number(vitalsForm.blood_glucose),
        bmi: Number(vitalsForm.bmi),
        weight_kg: Number(vitalsForm.weight_kg),
        height_cm: Number(vitalsForm.height_cm),
        temperature_f: Number(vitalsForm.temperature_f),
        spo2: Number(vitalsForm.spo2),
        notes: vitalsForm.notes,
      });
      const updated = await api.getPatient(patient.id);
      setPatient(updated);
      setIsRecordVitalsOpen(false);
    } catch (err) {
      console.error('Failed to record vitals:', err);
    } finally {
      setVitalsSubmitting(false);
    }
  };

  const toggleTestSelection = (caseCode: string) => {
    setSelectedTests((prev) => {
      const next = new Set(prev);
      if (next.has(caseCode)) {
        next.delete(caseCode);
      } else {
        next.add(caseCode);
      }
      return next;
    });
  };

  const handleSubmitLabOrder = async () => {
    if (!patient || selectedTests.size === 0) return;
    setLabOrderSubmitting(true);
    try {
      const items = DIAGNOSTIC_REPORTS
        .filter((r) => selectedTests.has(r.case_code))
        .map((r) => ({
          case_code: r.case_code,
          test_name: r.test_name,
          clinical_scenario: r.clinical_scenario,
        }));
      await api.createLabTestOrder({
        patient: patient.id,
        notes: labOrderNotes,
        items,
      });
      // Refresh orders list
      const updatedOrders = await api.getLabTestOrders(patient.id);
      setLabTestOrders(updatedOrders);
      setSelectedTests(new Set());
      setLabOrderNotes('');
    } catch (err) {
      console.error('Failed to submit lab test order:', err);
    } finally {
      setLabOrderSubmitting(false);
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
    { id: 'diagnostic-orders', label: 'Diagnostic Reports', badge: labTestOrders.length },
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
              <span><strong>BMI:</strong> {patient.latest_vitals?.bmi || patient.bmi || '--'} kg/m²</span>
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
          {/* Vitals Section Header & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Clinical Vitals & Biometrics</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {patient.latest_vitals?.recorded_at
                  ? `Last recorded on ${new Date(patient.latest_vitals.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                  : 'Baseline clinical parameters'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRecordVitalsOpen(true)}
              leftIcon={<Activity className="w-4 h-4 text-brand-600" />}
              className="font-semibold shadow-sm hover:bg-brand-50"
            >
              + Record / Update Vitals
            </Button>
          </div>

          {/* Vitals Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-sky-50/50 border-sky-100">
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Blood Pressure</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-900">
                  {patient.latest_vitals?.blood_pressure_sys && patient.latest_vitals?.blood_pressure_dia
                    ? `${patient.latest_vitals.blood_pressure_sys}/${patient.latest_vitals.blood_pressure_dia}`
                    : '--'}
                </span>
                <span className="text-xs text-slate-500 font-medium">mmHg</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {patient.latest_vitals?.blood_pressure_sys && patient.latest_vitals?.blood_pressure_dia ? (
                  patient.latest_vitals.blood_pressure_sys >= 140 || patient.latest_vitals.blood_pressure_dia >= 90 ? (
                    <span className="text-rose-600 font-semibold">Hypertension (Stage 2)</span>
                  ) : patient.latest_vitals.blood_pressure_sys >= 130 || patient.latest_vitals.blood_pressure_dia >= 80 ? (
                    <span className="text-amber-600 font-semibold">Hypertension (Stage 1)</span>
                  ) : patient.latest_vitals.blood_pressure_sys >= 120 ? (
                    <span className="text-amber-600 font-medium">Elevated BP</span>
                  ) : (
                    <span className="text-slate-400">Normal target range</span>
                  )
                ) : (
                  <span className="text-slate-400">No data</span>
                )}
              </p>
            </Card>

            <Card className="bg-emerald-50/50 border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Heart Rate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-900">{patient.latest_vitals?.heart_rate ?? '--'}</span>
                <span className="text-xs text-slate-500 font-medium">bpm</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {patient.latest_vitals?.heart_rate ? (
                  patient.latest_vitals.heart_rate > 100 ? (
                    <span className="text-rose-600 font-semibold">Tachycardia</span>
                  ) : patient.latest_vitals.heart_rate < 60 ? (
                    <span className="text-amber-600 font-semibold">Bradycardia</span>
                  ) : (
                    <span className="text-slate-400">Regular sinus rhythm</span>
                  )
                ) : (
                  <span className="text-slate-400">No data</span>
                )}
              </p>
            </Card>

            <Card className="bg-amber-50/50 border-amber-100">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Fasting Blood Glucose</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-900">{patient.latest_vitals?.blood_glucose ?? '--'}</span>
                <span className="text-xs text-slate-500 font-medium">mg/dL</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {patient.latest_vitals?.blood_glucose ? (
                  patient.latest_vitals.blood_glucose >= 126 ? (
                    <span className="text-rose-600 font-semibold">Elevated (Fasting)</span>
                  ) : patient.latest_vitals.blood_glucose >= 100 ? (
                    <span className="text-amber-600 font-medium">Mild elevation (Pre-meal)</span>
                  ) : (
                    <span className="text-slate-400">Normal fasting range</span>
                  )
                ) : (
                  <span className="text-slate-400">No data</span>
                )}
              </p>
            </Card>

            <Card className="bg-purple-50/50 border-purple-100">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Body Mass Index</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-900">{patient.latest_vitals?.bmi || patient.bmi || '--'}</span>
                <span className="text-xs text-slate-500 font-medium">kg/m²</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {patient.weight_kg ? `${patient.weight_kg} kg` : '--'} • {patient.height_cm ? `${patient.height_cm} cm` : '--'}
              </p>
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
                      {report.file_attachment && (
                        <div className="mt-1">
                          <a href={report.file_attachment} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-xs font-semibold inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            View PDF Report
                          </a>
                        </div>
                      )}
                    </div>
                    <Badge variant={report.status === 'NORMAL' ? 'green' : 'amber'} size="sm">
                      {report.status}
                    </Badge>
                  </div>

                  {/* Nested Results Table */}
                  {report.results && report.results.length > 0 && (
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
                  )}
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

      {/* Tab: Diagnostic Reports — Order Lab Tests */}
      {activeTab === 'diagnostic-orders' && (
        <div className="space-y-6">
          {/* Order New Tests */}
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-brand-600" />
                  Order Diagnostic Lab Reports
                </span>
              }
              subtitle="Select the required diagnostic tests for the patient. NABL (ISO 15189:2012) & ICMR compliant."
            />

            <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 text-xs text-sky-900 mb-4 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Tick the checkbox next to each diagnostic test the patient needs. The patient will be notified to complete these tests at an NABL-accredited laboratory.
              </span>
            </div>

            {/* Checkbox Grid */}
            <div className="space-y-2">
              {DIAGNOSTIC_REPORTS.map((report) => (
                <label
                  key={report.case_code}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedTests.has(report.case_code)
                      ? 'border-brand-300 bg-brand-50/60 ring-1 ring-brand-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTests.has(report.case_code)}
                    onChange={() => toggleTestSelection(report.case_code)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {report.case_code.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold text-slate-900 leading-tight">
                        {report.test_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Clinical Scenario: {report.clinical_scenario}
                    </p>
                  </div>
                  {selectedTests.has(report.case_code) && (
                    <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  )}
                </label>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTests(new Set(DIAGNOSTIC_REPORTS.map((r) => r.case_code)))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTests(new Set())}
              >
                Clear All
              </Button>
              <span className="text-xs text-slate-500 ml-auto font-semibold">
                {selectedTests.size} of {DIAGNOSTIC_REPORTS.length} tests selected
              </span>
            </div>

            {/* Notes */}
            {selectedTests.size > 0 && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Doctor's Notes / Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={labOrderNotes}
                    onChange={(e) => setLabOrderNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    placeholder="e.g. Patient to fast 12 hours before blood work. Bring previous reports."
                  />
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Selected {selectedTests.size} test(s):</strong>{' '}
                    {DIAGNOSTIC_REPORTS.filter((r) => selectedTests.has(r.case_code))
                      .map((r) => r.test_name)
                      .join(' • ')}
                  </span>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSubmitLabOrder}
                    disabled={labOrderSubmitting || selectedTests.size === 0}
                    leftIcon={<Send className="w-4 h-4" />}
                    className="shadow-md shadow-brand-600/20"
                  >
                    {labOrderSubmitting ? 'Submitting Order...' : `Submit Lab Order (${selectedTests.size} Tests)`}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Previously Ordered Tests */}
          {labTestOrders.length > 0 && (
            <Card>
              <CardHeader
                title="Previously Ordered Diagnostic Tests"
                subtitle="History of lab test orders for this patient"
              />
              <div className="space-y-3">
                {labTestOrders.map((order) => (
                  <div key={order.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          Order #{order.id}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">
                          {new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        {order.ordered_by_name && (
                          <span className="text-xs text-slate-500 ml-2">
                            by {order.ordered_by_name}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={
                          order.status === 'COMPLETED' ? 'green' :
                          order.status === 'IN_PROGRESS' ? 'amber' :
                          order.status === 'CANCELLED' ? 'red' : 'blue'
                        }
                        size="sm"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    {order.notes && (
                      <p className="text-xs text-slate-600 mb-2 italic">Notes: {order.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {order.items.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg bg-white border border-slate-200 text-slate-700"
                        >
                          <span className="font-mono text-[10px] text-slate-400">{item.case_code.replace('_', ' ')}</span>
                          {item.test_name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
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

      {/* Record / Update Vitals Modal */}
      <Modal
        isOpen={isRecordVitalsOpen}
        onClose={() => setIsRecordVitalsOpen(false)}
        title="Record / Update Clinical Vitals"
        subtitle={`Update physiological measurements & biometrics for ${patient.full_name}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleRecordVitals} className="space-y-4">
          <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100 text-xs text-brand-900 flex items-center justify-between">
            <span>Updating vitals records a new dated clinical timestamp in the patient's EHR history.</span>
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-white border border-brand-200 text-brand-800">
              {patient.patient_id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Systolic BP (mmHg) *"
              type="number"
              placeholder="e.g. 120"
              value={vitalsForm.blood_pressure_sys}
              onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure_sys: Number(e.target.value) })}
              required
            />
            <Input
              label="Diastolic BP (mmHg) *"
              type="number"
              placeholder="e.g. 80"
              value={vitalsForm.blood_pressure_dia}
              onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure_dia: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Heart Rate (bpm) *"
              type="number"
              placeholder="e.g. 72"
              value={vitalsForm.heart_rate}
              onChange={(e) => setVitalsForm({ ...vitalsForm, heart_rate: Number(e.target.value) })}
              required
            />
            <Input
              label="Fasting Blood Glucose (mg/dL) *"
              type="number"
              step="0.1"
              placeholder="e.g. 110"
              value={vitalsForm.blood_glucose}
              onChange={(e) => setVitalsForm({ ...vitalsForm, blood_glucose: Number(e.target.value) })}
              required
            />
          </div>

          {/* Biometrics & Live BMI */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Anthropometric Measurements & BMI
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Calculated BMI: {vitalsForm.bmi} kg/m²
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Weight (kg) *"
                type="number"
                step="0.1"
                placeholder="70.0"
                value={vitalsForm.weight_kg}
                onChange={(e) => handleBiometricsChange(Number(e.target.value), vitalsForm.height_cm)}
                required
              />
              <Input
                label="Height (cm) *"
                type="number"
                step="0.5"
                placeholder="172.0"
                value={vitalsForm.height_cm}
                onChange={(e) => handleBiometricsChange(vitalsForm.weight_kg, Number(e.target.value))}
                required
              />
              <Input
                label="BMI (kg/m²)"
                type="number"
                step="0.1"
                value={vitalsForm.bmi}
                onChange={(e) => setVitalsForm({ ...vitalsForm, bmi: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Oxygen Saturation SpO2 (%)"
              type="number"
              placeholder="e.g. 98"
              value={vitalsForm.spo2}
              onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: Number(e.target.value) })}
            />
            <Input
              label="Temperature (°F)"
              type="number"
              step="0.1"
              placeholder="e.g. 98.6"
              value={vitalsForm.temperature_f}
              onChange={(e) => setVitalsForm({ ...vitalsForm, temperature_f: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Clinical Observation / Notes"
            placeholder="e.g. Resting vitals measured in seated position"
            value={vitalsForm.notes}
            onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsRecordVitalsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={vitalsSubmitting}>
              {vitalsSubmitting ? 'Recording...' : 'Save & Record Vitals'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
