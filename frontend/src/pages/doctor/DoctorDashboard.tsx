import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, FlaskConical, AlertTriangle, Activity,
  Calendar, Clock, Plus, ChevronRight, ShieldAlert,
  Heart, Droplet, User, CheckCircle2, TrendingUp, AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { api } from '../../services/api';
import { Patient, Prescription, Appointment } from '../../types';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const DoctorDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [activeTrendMetric, setActiveTrendMetric] = useState<'glycemic' | 'renal'>('glycemic');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [patientsRes, rxRes, apptRes] = await Promise.all([
          api.getPatients(),
          api.getPrescriptions(),
          api.getAppointments(),
        ]);

        setPatients(patientsRes);
        // Default select Rahul Mehta (RX-PAT-1001)
        const rahul = patientsRes.find((p) => p.patient_id === 'RX-PAT-1001') || patientsRes[0] || null;
        setSelectedPatient(rahul);
        setPrescriptions(rxRes.slice(0, 5));
        setAppointments(apptRes.slice(0, 4));

        if (rahul) {
          const trends = await api.getLabTrends(rahul.id);
          setTrendData(trends);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    try {
      const trends = await api.getLabTrends(patient.id);
      setTrendData(trends);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Finalized': return 'blue';
      case 'Verified': return 'purple';
      case 'Dispensed': return 'green';
      case 'Partially Dispensed': return 'amber';
      case 'Cancelled': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Clinical Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Good Morning, Dr. Rahul Mehta
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {patients.length || 15} patients assigned today
          </p>
        </div>
        <div>
          <Button
            id="header-create-rx-btn"
            variant="primary"
            size="md"
            onClick={() => navigate('/doctor/prescriptions/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Create Prescription
          </Button>
        </div>
      </div>

      {/* 4 Statistics: Total Patients, Active Prescriptions, Lab Reports, Safety Alerts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Patients</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">{patients.length || 15}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Assigned in registry</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Prescriptions</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">{prescriptions.length || 10}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Active treatment courses</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lab Reports</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <FlaskConical className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">14</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Recent diagnostic panels</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Safety Alerts</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">2</span>
            <span className="text-[11px] text-amber-700 font-medium block mt-0.5">Requires clinical review</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* PATIENT CLINICAL SPOTLIGHT */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider block">
                  Patient Clinical Spotlight
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedPatient ? selectedPatient.full_name : 'Rahul Mehta'}
                  <span className="text-xs font-mono font-normal text-slate-500 ml-2">
                    ({selectedPatient?.patient_id || 'RX-PAT-1001'})
                  </span>
                </h3>
              </div>

              {/* Patient Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedPatient?.id || ''}
                  onChange={(e) => {
                    const found = patients.find((p) => p.id === Number(e.target.value));
                    if (found) handlePatientSelect(found);
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.patient_id})
                    </option>
                  ))}
                </select>

                {selectedPatient && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/doctor/patients/${selectedPatient.id}`)}
                  >
                    View Record
                  </Button>
                )}
              </div>
            </div>

            {selectedPatient && (
              <div className="mt-4 space-y-4">
                {/* Patient Demographics: Age, Gender, Blood Group, Height, Weight */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Age</span>
                    <span className="font-semibold text-slate-800">42 Yrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender</span>
                    <span className="font-semibold text-slate-800">{selectedPatient.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span>
                    <span className="font-semibold text-slate-800">{selectedPatient.blood_group}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Height</span>
                    <span className="font-semibold text-slate-800">{selectedPatient.height_cm} cm</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Weight</span>
                    <span className="font-semibold text-slate-800">{selectedPatient.weight_kg} kg</span>
                  </div>
                </div>

                {/* Current Conditions & Allergies */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1.5">
                      Current Conditions
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        Type 2 Diabetes
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        Hypertension
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200">
                    <span className="text-rose-800 block text-[10px] uppercase font-bold mb-1.5">
                      Documented Allergy
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-600 text-white">
                        Penicillin — HIGH
                      </span>
                      <span className="text-[11px] text-rose-700">Angioedema & urticaria</span>
                    </div>
                  </div>
                </div>

                {/* Vitals: Blood Pressure, Heart Rate, Blood Glucose, BMI */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Current Vitals
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <Heart className="w-3.5 h-3.5 text-sky-600" />
                        <span className="text-[10px] font-bold uppercase">Blood Pressure</span>
                      </div>
                      <span className="text-base font-bold text-slate-900">
                        {selectedPatient.latest_vitals?.blood_pressure_sys || 128}/
                        {selectedPatient.latest_vitals?.blood_pressure_dia || 84}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">mmHg</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] font-bold uppercase">Heart Rate</span>
                      </div>
                      <span className="text-base font-bold text-slate-900">
                        {selectedPatient.latest_vitals?.heart_rate || 74}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">bpm</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <Droplet className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[10px] font-bold uppercase">Blood Glucose</span>
                      </div>
                      <span className="text-base font-bold text-slate-900">
                        {selectedPatient.latest_vitals?.blood_glucose || 124}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">mg/dL</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <User className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-[10px] font-bold uppercase">BMI</span>
                      </div>
                      <span className="text-base font-bold text-slate-900">
                        {selectedPatient.bmi || 25.3}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">kg/m²</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* RECENT LAB RESULTS & CHARTS */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Lab Results & Trends</h3>
                <p className="text-[11px] text-slate-500">
                  Longitudinal parameters for {selectedPatient?.full_name || 'Patient'}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setActiveTrendMetric('glycemic')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    activeTrendMetric === 'glycemic'
                      ? 'bg-white text-brand-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Glycemic (HbA1c & Glucose)
                </button>
                <button
                  onClick={() => setActiveTrendMetric('renal')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    activeTrendMetric === 'renal'
                      ? 'bg-white text-brand-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Renal (Creatinine)
                </button>
              </div>
            </div>

            <div className="h-56 w-full pt-3">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No longitudinal laboratory records available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickMargin={6} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '6px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />

                    {activeTrendMetric === 'glycemic' && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="glucose"
                          name="Glucose (mg/dL)"
                          stroke="#0284c7"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="hba1c"
                          name="HbA1c (%)"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </>
                    )}

                    {activeTrendMetric === 'renal' && (
                      <Line
                        type="monotone"
                        dataKey="creatinine"
                        name="Creatinine (mg/dL)"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* RECENT PRESCRIPTIONS */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recent Prescriptions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/doctor/prescriptions')}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                View All
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                    <th className="py-2 px-3">Prescription ID</th>
                    <th className="py-2 px-3">Patient</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescriptions.map((rx) => (
                    <tr key={rx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-semibold text-brand-700">
                        {rx.prescription_id}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {rx.patient_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(rx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={getStatusBadgeVariant(rx.status)} size="sm">
                          {rx.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/doctor/prescriptions/${rx.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column (1 col): Clinical Safety Warnings & Upcoming Appointments */}
        <div className="space-y-6">
          {/* CLINICAL SAFETY WARNINGS */}
          <Card className="border-amber-200 bg-amber-50/20">
            <div className="flex items-center gap-2 pb-3 border-b border-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Clinical Safety Warnings
              </h3>
            </div>

            <div className="mt-3 space-y-3">
              {/* HIGH — Allergy Conflict */}
              <div className="p-3 rounded-lg bg-white border border-rose-200 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                    HIGH — Allergy Conflict
                  </span>
                </div>
                <div className="text-xs space-y-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 font-medium">Patient: </span>
                    <span className="font-semibold text-slate-900">Rahul Mehta</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Allergen: </span>
                    <span className="font-semibold text-rose-700">Penicillin</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Medication: </span>
                    <span className="font-semibold text-slate-900">Amoxicillin</span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 text-[11px] text-amber-800">
                    <strong>Action: </strong>Review before prescribing.
                  </div>
                </div>
              </div>

              {/* MODERATE — Drug Interaction */}
              <div className="p-3 rounded-lg bg-white border border-amber-200 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    MODERATE — Drug Interaction
                  </span>
                </div>
                <div className="text-xs space-y-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 font-medium">Medications: </span>
                    <span className="font-semibold text-slate-900">Lisinopril + Ibuprofen</span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 text-[11px] text-slate-600">
                    NSAID concurrent use blunts antihypertensive efficacy and increases risk of acute renal impairment.
                  </div>
                  <div className="text-[11px] text-amber-800">
                    <strong>Action: </strong>Consider Paracetamol as non-nephrotoxic alternative.
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* UPCOMING APPOINTMENTS */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Upcoming Appointments
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/appointments')}
              >
                Schedule
              </Button>
            </div>

            <div className="mt-3 space-y-2.5">
              {appointments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No appointments scheduled.</p>
              ) : (
                appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900">{appt.patient_name}</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">{appt.appointment_type}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(appt.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <Badge variant="blue" size="sm">
                      {appt.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
