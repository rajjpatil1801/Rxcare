import React, { useState, useEffect } from 'react';
import { PackageCheck, Search, RefreshCw, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface DispensingItem {
  id: number;
  prescription: number;
  prescription_id: string;
  patient_name: string;
  pharmacy_name: string;
  dispensed_items_summary: string;
  notes: string;
  timestamp: string;
}

export const DispensingHistoryPage: React.FC = () => {
  const [records, setRecords] = useState<DispensingItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getDispensingRecords(search);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load dispensing records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [search]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dispensing History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Chronological record of verified digital prescriptions and medication dispenses.
        </p>
      </div>

      <Card>
        {/* Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Prescription ID, Patient Name, or Pharmacy..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecords}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>

        {/* Table: Date | Prescription | Patient | Medicine | Quantity | Status */}
        <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Prescription</th>
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Medicine / Summary</th>
                <th className="py-2.5 px-3">Pharmacy</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading dispensing history...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No dispensing records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-brand-700">
                      {r.prescription_id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {r.patient_name || 'Rahul Mehta'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">
                      {r.dispensed_items_summary || 'Standard Rx Course'}
                      {r.notes && (
                        <span className="block text-[10px] text-slate-400 truncate italic">{r.notes}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {r.pharmacy_name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Dispensed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
