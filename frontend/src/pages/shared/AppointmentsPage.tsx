import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, User, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Appointment, Patient } from '../../types';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    patient: '',
    scheduled_time: '2026-09-24T10:30',
    appointment_type: 'Cardiometabolic & Glycemic Follow-up',
    notes: 'Routine outpatient consultation',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [apptList, patList] = await Promise.all([
        api.getAppointments(),
        api.getPatients(),
      ]);
      setAppointments(apptList);
      setPatients(patList);
      if (patList.length > 0) {
        setFormData((prev) => ({ ...prev, patient: patList[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient) return;
    setSubmitting(true);
    try {
      await api.createAppointment({
        patient: Number(formData.patient),
        scheduled_time: new Date(formData.scheduled_time).toISOString(),
        appointment_type: formData.appointment_type,
        notes: formData.notes,
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.updateAppointmentStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: status as any } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Appointments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage scheduled patient visits, follow-up consultations, and attendance records.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Schedule Appointment
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Scheduled Date & Time</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Consultation Type</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading appointments...</td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No scheduled appointments found.</td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                        {new Date(appt.scheduled_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(appt.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{appt.patient_name}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span>{appt.appointment_type}</span>
                      {appt.notes && <span className="block text-[11px] text-slate-400">{appt.notes}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{appt.doctor_name}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={appt.status === 'Completed' ? 'green' : appt.status === 'Cancelled' ? 'red' : 'blue'}
                        size="sm"
                      >
                        {appt.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {appt.status === 'Scheduled' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(appt.id, 'Completed')}
                            className="text-emerald-700 hover:bg-emerald-50"
                          >
                            Complete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(appt.id, 'Cancelled')}
                            className="text-rose-700 hover:bg-rose-50"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Schedule Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Clinical Appointment"
        subtitle="Books consultation slot on the clinic master calendar"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Patient *</label>
            <select
              value={formData.patient}
              onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.patient_id})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Consultation Date & Time *"
            type="datetime-local"
            value={formData.scheduled_time}
            onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
            required
          />

          <Input
            label="Appointment Type *"
            value={formData.appointment_type}
            onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
            placeholder="e.g. Cardiometabolic Follow-up, Routine Review"
            required
          />

          <Input
            label="Clinical Notes / Preparation Instructions"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Fasting blood sample required prior to visit"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Confirm Appointment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
