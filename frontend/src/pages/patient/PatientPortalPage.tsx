import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, FileText, FlaskConical, Calendar, ShieldCheck,
  AlertTriangle, QrCode, Download, Printer, CheckCircle2, User,
  Heart, Droplet, Eye, MapPin
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Patient, Prescription, LabReport, Consent, Appointment, LabTestOrder } from '../../types';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import { PharmacyLocatorModal } from '../../components/PharmacyLocatorModal';

export const PatientPortalPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL route
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/patient/prescriptions')) return 'prescriptions';
    if (path.includes('/patient/labs')) return 'labs';
    if (path.includes('/patient/appointments')) return 'appointments';
    if (path.includes('/patient/consent')) return 'consent';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<string>(getTabFromPath());
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [labTestOrders, setLabTestOrders] = useState<LabTestOrder[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [qrModalRx, setQrModalRx] = useState<Prescription | null>(null);
  const [mapModalRx, setMapModalRx] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync tab with URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const patientsList = await api.getPatients();
      // Match current user or fallback to Rahul Mehta (RX-PAT-1001)
      const currentPat =
        patientsList.find((p) => p.email === user?.email || p.patient_id === user?.username) ||
        patientsList[0];

      if (currentPat) {
        // Fetch full patient profile to ensure conditions, allergies, and vitals are fully populated
        const fullPat = await api.getPatient(currentPat.id);
        setPatient(fullPat);
        const [rxList, labsList, consentList, apptList, trends, labOrdersList] = await Promise.all([
          api.getPrescriptions(fullPat.id),
          api.getLabReports(fullPat.id),
          api.getConsents(fullPat.id),
          api.getAppointments(fullPat.id),
          api.getLabTrends(fullPat.id),
          api.getLabTestOrders(fullPat.id),
        ]);
        setPrescriptions(rxList);
        setLabReports(labsList);
        setLabTestOrders(labOrdersList);
        setConsents(consentList);
        setAppointments(apptList);
        setTrendData(trends);
      }
    } catch (err) {
      console.error('Failed to load patient portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [user]);

  const handleToggleConsent = async (consent: Consent) => {
    const nextStatus = consent.status === 'GRANTED' ? 'REVOKED' : 'GRANTED';
    try {
      await api.updateConsentStatus(consent.id, nextStatus);
      setConsents((prev) =>
        prev.map((c) => (c.id === consent.id ? { ...c, status: nextStatus } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'overview') navigate('/patient/dashboard');
    else if (tabId === 'prescriptions') navigate('/patient/prescriptions');
    else if (tabId === 'labs') navigate('/patient/labs');
    else if (tabId === 'appointments') navigate('/patient/appointments');
    else if (tabId === 'consent') navigate('/patient/consent');
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-600 border-t-transparent mx-auto mb-2"></div>
        <p className="text-sm font-semibold">Loading patient records...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Health Overview' },
    { id: 'prescriptions', label: 'My Prescriptions', badge: prescriptions.length },
    { id: 'labs', label: 'Lab Reports', badge: labReports.length },
    { id: 'appointments', label: 'Appointments', badge: appointments.length },
    { id: 'consent', label: 'Consent', badge: consents.length },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Patient Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-700 block">
            PATIENT HEALTH PORTAL
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            {patient?.full_name || 'Rahul Mehta'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Patient ID: <span className="font-mono font-semibold text-slate-800">{patient?.patient_id || 'RX-PAT-1001'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            EHR Verified
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === t.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{t.label}</span>
            {t.badge !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: HEALTH OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Vitals: Blood Pressure, Heart Rate, Blood Sugar, BMI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Heart className="w-3.5 h-3.5 text-sky-600" />
                <span className="text-[10px] font-bold uppercase">Blood Pressure</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {patient?.latest_vitals?.blood_pressure_sys && patient?.latest_vitals?.blood_pressure_dia 
                  ? `${patient.latest_vitals.blood_pressure_sys}/${patient.latest_vitals.blood_pressure_dia}`
                  : '--'}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">mmHg</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-bold uppercase">Heart Rate</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {patient?.latest_vitals?.heart_rate ?? '--'}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">bpm</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Droplet className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px] font-bold uppercase">Blood Sugar</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {patient?.latest_vitals?.blood_glucose ?? '--'}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">mg/dL</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-[10px] font-bold uppercase">BMI</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {patient?.latest_vitals?.bmi || patient?.bmi || '--'}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">kg/m²</span>
            </div>
          </div>

          {/* MY HEALTH SUMMARY */}
          <Card>
            <CardHeader
              title="MY HEALTH SUMMARY"
              subtitle="Current clinical baseline and care parameters"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                  Conditions ({patient?.conditions?.length || 0})
                </span>
                <div className="font-semibold text-slate-800 space-y-1">
                  {patient?.conditions && patient.conditions.length > 0 ? (
                    patient.conditions.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-1">
                        <span className="truncate">• {c.condition_name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 shrink-0">
                          {c.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 font-normal">No documented chronic conditions</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200">
                <span className="text-rose-800 block text-[10px] uppercase font-bold mb-1">
                  Allergies ({patient?.allergies?.length || 0})
                </span>
                {patient?.allergies && patient.allergies.length > 0 ? (
                  patient.allergies.map((a) => (
                    <div key={a.id} className="mb-1.5 last:mb-0">
                      <p className="font-bold text-rose-700">{a.substance} — {a.severity}</p>
                      {a.reaction && <p className="text-[11px] text-rose-600 truncate">{a.reaction}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 font-normal">NKDA (No known drug allergies)</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Latest Prescribed Medicines</span>
                <div className="font-semibold text-slate-800 space-y-0.5">
                  {prescriptions.length > 0 && prescriptions[0].items && prescriptions[0].items.length > 0 ? (
                    prescriptions[0].items.slice(0, 2).map((item, idx) => (
                      <p key={idx} className="truncate">• {item.generic_name} {item.dosage}</p>
                    ))
                  ) : (
                    <p className="text-slate-400 font-normal">No active medications</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Latest Lab Result</span>
                {labReports.length > 0 && labReports[0].results && labReports[0].results.length > 0 ? (
                  <div>
                    <p className="font-semibold text-slate-800">
                      {labReports[0].results[0].test_name}: {labReports[0].results[0].value} {labReports[0].results[0].unit}
                    </p>
                    <p className="text-[11px] text-slate-500">{labReports[0].report_title} • {labReports[0].report_date}</p>
                  </div>
                ) : (
                  <p className="text-slate-400 font-normal">No recent lab findings</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Next Appointment</span>
                <p className="font-semibold text-slate-800">
                  {appointments.length > 0
                    ? `${appointments[0].appointment_type} with ${appointments[0].doctor_name}`
                    : 'No upcoming appointments scheduled'}
                </p>
                <p className="text-[11px] text-slate-500">Metro Heart & Healthcare Institute</p>
              </div>
            </div>
          </Card>

          {/* Current Active Medications */}
          <Card>
            <CardHeader
              title="Current Active Medications"
              subtitle="Medications prescribed for ongoing management"
            />
            <div className="divide-y divide-slate-100 text-xs">
              {prescriptions.length > 0 && prescriptions.some(rx => rx.items && rx.items.length > 0) ? (
                prescriptions.slice(0, 3).flatMap(rx => rx.items).slice(0, 4).map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.generic_name}</span>
                      <span className="text-slate-500">{item.dosage} • {item.frequency}</span>
                    </div>
                    <Badge variant="blue" size="sm">Active</Badge>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-slate-400">No active medications prescribed.</p>
              )}
            </div>
          </Card>

          {/* Allergies & High-Alert Sensitivities */}
          <Card className="border-rose-200 bg-rose-50/20">
            <CardHeader
              title={`Allergies & High-Alert Sensitivities (${patient?.allergies?.length || 0})`}
              subtitle="Recorded in EHR to prevent adverse clinical events"
            />
            <div className="space-y-2 text-xs">
              {patient?.allergies && patient.allergies.length > 0 ? (
                patient.allergies.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-white border border-rose-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">{a.substance} ({a.severity} Severity)</span>
                      {a.reaction && <p className="text-slate-600 mt-0.5">Reaction: {a.reaction}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center bg-white rounded-lg border border-slate-200 text-slate-400">
                  No documented allergies or adverse reactions on record.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: MY PRESCRIPTIONS (Section 15: Prescription ID, Doctor, Date, Medicines, Status) */}
      {activeTab === 'prescriptions' && (
        <Card>
          <CardHeader
            title="My Prescriptions"
            subtitle="View, scan, or download your authenticated digital prescriptions"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Prescription ID</th>
                  <th className="py-2.5 px-3">Doctor</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Medicines</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {prescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No prescriptions found.
                    </td>
                  </tr>
                ) : (
                  prescriptions.map((rx) => (
                    <tr key={rx.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-brand-700">
                        {rx.prescription_id}
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-semibold">
                        {rx.doctor_name}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(rx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-xs truncate">
                        {rx.items.map((i) => `${i.generic_name} ${i.dosage}`).join(', ')}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={rx.status === 'Dispensed' ? 'green' : 'blue'} size="sm">
                          {rx.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setMapModalRx(rx)}
                            leftIcon={<MapPin className="w-3.5 h-3.5" />}
                          >
                            Locate
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRx(rx)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            View
                          </Button>

                          {rx.qr_code_data && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQrModalRx(rx)}
                              leftIcon={<QrCode className="w-3.5 h-3.5" />}
                            >
                              QR
                            </Button>
                          )}

                          <a
                            href={api.getPrescriptionPdfUrl(rx.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                          >
                            <Download className="w-3 h-3" /> PDF
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: LAB REPORTS */}
      {activeTab === 'labs' && (
        <div className="space-y-6">
          {/* Diagnostic Orders */}
          <Card>
            <CardHeader
              title="Doctor's Suggested Tests"
              subtitle="Diagnostic lab tests requested by your doctor"
            />
            <div className="divide-y divide-slate-100 text-xs">
              {labTestOrders.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No pending lab test orders.</p>
              ) : (
                labTestOrders.map((order) => (
                  <div key={order.id} className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Lab Order #{order.id}</h4>
                        <p className="text-slate-500 mt-0.5">
                          Ordered by {order.ordered_by_name} on {new Date(order.created_at).toLocaleDateString()}
                        </p>
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
                      <p className="text-slate-600 mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                        <span className="font-semibold">Doctor's Notes:</span> {order.notes}
                      </p>
                    )}
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <FlaskConical className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800">{item.test_name}</p>
                            <p className="text-slate-500 text-[11px]">{item.clinical_scenario}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="My Completed Lab Reports"
              subtitle="Analyte findings uploaded by diagnostic laboratories"
            />

            <div className="divide-y divide-slate-100 text-xs">
              {labReports.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No completed lab reports found.</p>
              ) : (
                labReports.map((r) => (
                  <div key={r.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{r.report_title}</h4>
                      <p className="text-slate-500 mt-0.5">
                        Date: {r.report_date} • Specimen: {r.specimen_type} • Lab: {r.laboratory_name}
                      </p>
                      {r.file_attachment && (
                        <div className="mt-1">
                          <a href={r.file_attachment} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-xs font-semibold inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            View PDF Report
                          </a>
                        </div>
                      )}
                      {r.results && r.results.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {r.results.map((res, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700">
                              {res.test_name}: <strong>{res.value} {res.unit}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant={r.status === 'NORMAL' ? 'green' : 'amber'} size="sm">
                      {r.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <Card>
          <CardHeader
            title="My Appointments"
            subtitle="Upcoming and previous clinical consultations"
          />

          <div className="space-y-3 text-xs">
            {appointments.length === 0 ? (
              <p className="py-8 text-center text-slate-400">No appointments scheduled.</p>
            ) : (
              appointments.map((a) => (
                <div key={a.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{a.appointment_type}</h4>
                    <p className="text-slate-600 mt-0.5">
                      {new Date(a.scheduled_time).toLocaleString()} with {a.doctor_name}
                    </p>
                  </div>
                  <Badge variant="blue" size="sm">{a.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* TAB 5: CONSENT (Section 17: Provider, Access type, Granted date, Expiry, Status, Grant/Revoke) */}
      {activeTab === 'consent' && (
        <Card>
          <CardHeader
            title="Consent Management"
            subtitle="Manage healthcare provider access to your electronic medical record"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Access Type</th>
                  <th className="py-2.5 px-3">Granted Date</th>
                  <th className="py-2.5 px-3">Expiry</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {consents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No consent records found.
                    </td>
                  </tr>
                ) : (
                  consents.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {c.provider_name}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {c.access_type}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {c.granted_date}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {c.expiry_date || 'Ongoing'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={c.status === 'GRANTED' ? 'green' : 'red'} size="sm">
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant={c.status === 'GRANTED' ? 'danger' : 'success'}
                          size="sm"
                          onClick={() => handleToggleConsent(c)}
                        >
                          {c.status === 'GRANTED' ? 'Revoke' : 'Grant'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Prescription Detail Modal */}
      {selectedRx && (
        <Modal
          isOpen={!!selectedRx}
          onClose={() => setSelectedRx(null)}
          title={`Prescription #${selectedRx.prescription_id}`}
          subtitle={`Issued by ${selectedRx.doctor_name}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <span className="font-bold text-slate-500 block text-[10px] uppercase">Diagnosis</span>
              <p className="text-sm font-bold text-slate-900">{selectedRx.diagnosis}</p>
            </div>

            <div>
              <span className="font-bold text-slate-500 block text-[10px] uppercase mb-1">Medicines</span>
              <div className="space-y-1">
                {selectedRx.items.map((it) => (
                  <div key={it.id} className="p-2.5 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 block">{it.generic_name}</span>
                      <span className="text-slate-500 text-[11px]">{it.instructions || 'As directed'}</span>
                    </div>
                    <span className="text-slate-700 font-medium">{it.dosage} • {it.frequency}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedRx.general_instructions && (
              <div>
                <span className="font-bold text-slate-500 block text-[10px] uppercase">Doctor's Advice</span>
                <p className="text-slate-700">{selectedRx.general_instructions}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <a
                href={api.getPrescriptionPdfUrl(selectedRx.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white"
              >
                <Download className="w-3.5 h-3.5" /> Download / Print PDF
              </a>
              <Button variant="ghost" onClick={() => setSelectedRx(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* QR Code Modal */}
      {qrModalRx && (
        <Modal
          isOpen={!!qrModalRx}
          onClose={() => setQrModalRx(null)}
          title={`Prescription QR Code - #${qrModalRx.prescription_id}`}
          subtitle="Show this QR code at the pharmacy counter for instant verification"
        >
          <div className="space-y-4 text-center">
            <div className="p-4 bg-slate-50 rounded-xl inline-block border border-slate-200 mx-auto">
              {qrModalRx.qr_code_data ? (
                <img src={qrModalRx.qr_code_data} alt="QR Code" className="w-52 h-52 mx-auto" />
              ) : (
                <QrCode className="w-32 h-32 text-slate-400 mx-auto" />
              )}
            </div>
            <p className="font-mono text-xs font-bold text-brand-700">{qrModalRx.prescription_id}</p>
            <p className="text-xs text-slate-500">
              Cryptographically verified RxCare prescription token.
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => setQrModalRx(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Map Locator Modal */}
      <PharmacyLocatorModal 
        isOpen={!!mapModalRx}
        onClose={() => setMapModalRx(null)}
        prescription={mapModalRx}
      />
    </div>
  );
};
