import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Plus, Search, Filter, QrCode, Download, ExternalLink, Printer } from 'lucide-react';
import { api } from '../../services/api';
import { Prescription } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const PrescriptionsListPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  const navigate = useNavigate();

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await api.getPrescriptions(undefined, statusFilter || undefined);
      setPrescriptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [statusFilter]);

  const filtered = prescriptions.filter(
    (rx) =>
      rx.prescription_id.toLowerCase().includes(search.toLowerCase()) ||
      rx.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      rx.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Prescriptions Registry</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit digital e-prescriptions, track pharmacy dispensing statuses, and verify security QR tokens.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/doctor/prescriptions/new')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Prescription
        </Button>
      </div>

      {/* Filter toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Prescription ID, Patient Name, or Diagnosis..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Finalized">Finalized</option>
              <option value="Verified">Verified</option>
              <option value="Dispensed">Dispensed</option>
              <option value="Partially Dispensed">Partially Dispensed</option>
              <option value="Draft">Draft</option>
            </select>
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              {filtered.length} records
            </span>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Prescription ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Medicines Prescribed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading prescriptions...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No prescriptions found.</td>
                </tr>
              ) : (
                filtered.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {new Date(rx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-700">{rx.prescription_id}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{rx.patient_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{rx.patient_code}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-[280px]">
                      {rx.items.map((it) => it.generic_name).join(', ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getStatusBadge(rx.status)} size="sm">{rx.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRx(rx)}
                        leftIcon={<QrCode className="w-3.5 h-3.5 text-brand-600" />}
                      >
                        View & QR
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details & QR Modal */}
      {selectedRx && (
        <Modal
          isOpen={!!selectedRx}
          onClose={() => setSelectedRx(null)}
          title={`Prescription #${selectedRx.prescription_id}`}
          subtitle={`Issued for ${selectedRx.patient_name} by ${selectedRx.doctor_name}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {selectedRx.qr_code_data ? (
                <img
                  src={selectedRx.qr_code_data}
                  alt="QR Code"
                  className="w-36 h-36 object-contain rounded-lg border border-slate-200 bg-white p-1"
                />
              ) : (
                <div className="w-36 h-36 bg-slate-200 rounded-lg flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <div className="text-xs space-y-1.5 flex-1">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Status</span>
                  <div className="mt-0.5"><Badge variant={getStatusBadge(selectedRx.status)} size="md">{selectedRx.status}</Badge></div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Diagnosis</span>
                  <p className="font-semibold text-slate-900">{selectedRx.diagnosis}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Instructions</span>
                  <p className="text-slate-600">{selectedRx.general_instructions || 'None recorded'}</p>
                </div>
              </div>
            </div>

            {/* Prescribed items list */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Prescribed Items</h4>
              <div className="space-y-1.5">
                {selectedRx.items.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-white border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{item.generic_name}</span>
                      <span className="text-slate-500 ml-1.5 font-medium">({item.dosage}) • {item.frequency}</span>
                    </div>
                    <Badge variant={item.is_dispensed ? 'green' : 'gray'} size="sm">
                      {item.is_dispensed ? 'Dispensed' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <a
                href={api.getPrescriptionPdfUrl(selectedRx.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </a>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedRx(null);
                  navigate(`/pharmacy/verify?id=${selectedRx.prescription_id}`);
                }}
              >
                Verify in Pharmacy
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
