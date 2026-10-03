import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Store, QrCode, Search, CheckCircle2, AlertTriangle, Pill,
  ShieldCheck, Check, Clock, PackageCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { Prescription } from '../../types';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';

export const PharmacyDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [prescriptionInput, setPrescriptionInput] = useState(
    searchParams.get('id') || 'RX20240322042'
  );
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dispensing state
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [dispensing, setDispensing] = useState(false);
  const [dispenseSuccess, setDispenseSuccess] = useState(false);
  const [successNote, setSuccessNote] = useState('');

  const pharmacyName = 'Apollo Care Pharmacy #402';

  const handleVerify = async (idToVerify?: string) => {
    const rxId = (idToVerify || prescriptionInput).trim();
    if (!rxId) return;

    setLoading(true);
    setError(null);
    setDispenseSuccess(false);

    try {
      const resp = await api.verifyPrescription(rxId);
      if (resp.is_valid && resp.prescription) {
        setPrescription(resp.prescription);
        // Pre-select all undispersed items
        const pending = resp.prescription.items.filter((i) => !i.is_dispensed).map((i) => i.id);
        setSelectedItems(pending);
      } else {
        setPrescription(null);
        setError(resp.message || 'Prescription Not Found or Invalid.');
      }
    } catch (err: any) {
      setPrescription(null);
      setError(err.message || 'Prescription Not Found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatically verify default demo prescription on mount so the page is never empty
    handleVerify(prescriptionInput);
  }, []);

  const handleToggleItem = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleDispenseItem = async (itemId: number) => {
    if (!prescription) return;
    setDispensing(true);
    setError(null);
    try {
      const resp = await api.dispensePrescription({
        prescription_id: prescription.prescription_id,
        item_ids: [itemId],
        pharmacy_name: pharmacyName,
      });
      setPrescription(resp.prescription);
      setDispenseSuccess(true);
      setSuccessNote('Dispensing recorded successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to dispense item.');
    } finally {
      setDispensing(false);
    }
  };

  const handleDispenseSelected = async () => {
    if (!prescription || selectedItems.length === 0) return;
    setDispensing(true);
    setError(null);
    try {
      const resp = await api.dispensePrescription({
        prescription_id: prescription.prescription_id,
        item_ids: selectedItems,
        pharmacy_name: pharmacyName,
      });
      setPrescription(resp.prescription);
      setDispenseSuccess(true);
      setSuccessNote(`Dispensing recorded successfully for ${selectedItems.length} selected item(s).`);
    } catch (err: any) {
      setError(err.message || 'Failed to dispense selected items.');
    } finally {
      setDispensing(false);
    }
  };

  const handleDispenseAll = async () => {
    if (!prescription) return;
    setDispensing(true);
    setError(null);
    try {
      const allItemIds = prescription.items.map((i) => i.id);
      const resp = await api.dispensePrescription({
        prescription_id: prescription.prescription_id,
        item_ids: allItemIds,
        pharmacy_name: pharmacyName,
      });
      setPrescription(resp.prescription);
      setSelectedItems(allItemIds);
      setDispenseSuccess(true);
      setSuccessNote('Dispensing recorded successfully. All items dispensed.');
    } catch (err: any) {
      setError(err.message || 'Failed to dispense all items.');
    } finally {
      setDispensing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pharmacy Verification & Dispensing
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Verify digital prescriptions via QR token or Prescription ID, check inventory, and dispense medication.
        </p>
      </div>

      {/* Main Workflow: VERIFY DIGITAL PRESCRIPTION */}
      <Card>
        <CardHeader
          title="VERIFY DIGITAL PRESCRIPTION"
          subtitle="Enter Prescription ID or scan QR code"
        />

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="prescription-verify-input"
              type="text"
              value={prescriptionInput}
              onChange={(e) => setPrescriptionInput(e.target.value)}
              placeholder="e.g. RX20240322042"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
            />
          </div>

          <Button
            id="verify-rx-submit-btn"
            variant="primary"
            size="md"
            onClick={() => handleVerify()}
            isLoading={loading}
            leftIcon={<Search className="w-4 h-4" />}
          >
            Verify Prescription
          </Button>

          {/* Quick Demo Selector */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => {
                setPrescriptionInput('RX20240322042');
                handleVerify('RX20240322042');
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-mono cursor-pointer"
            >
              Demo: RX20240322042
            </button>
            <button
              onClick={() => {
                setPrescriptionInput('RX20240218001');
                handleVerify('RX20240218001');
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-mono cursor-pointer"
            >
              Demo: RX20240218001
            </button>
          </div>
        </div>

        {error && (
          <Alert type="error" className="mt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          </Alert>
        )}
      </Card>

      {/* When Verified: PRESCRIPTION VERIFIED */}
      {prescription && (
        <Card className="border-brand-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-wide">
                  PRESCRIPTION VERIFIED
                </h3>
              </div>
            </div>
            <Badge variant={prescription.status === 'Dispensed' ? 'green' : 'blue'} size="sm">
              {prescription.status}
            </Badge>
          </div>

          {dispenseSuccess && (
            <Alert type="success" className="my-4">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">✓ {successNote || 'Dispensing recorded successfully'}</span>
              </div>
            </Alert>
          )}

          {/* Patient & Prescription Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 my-4 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Patient</span>
              <span className="font-bold text-slate-900">{prescription.patient_name || 'Rahul Mehta'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Aadhar ID</span>
              <span className="font-mono font-bold text-slate-800">{prescription.patient_code || '987654321001'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Doctor</span>
              <span className="font-semibold text-slate-900">{prescription.doctor_name || 'Dr. Rahul Mehta'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Prescription</span>
              <span className="font-mono font-bold text-brand-700">{prescription.prescription_id}</span>
            </div>
          </div>

          {/* MEDICINES TABLE: | Medicine | Dose | Quantity | Stock | Action | */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              MEDICINES
            </h4>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-10 text-center">Select</th>
                    <th className="py-2.5 px-3">Medicine</th>
                    <th className="py-2.5 px-3">Dose</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {prescription.items.map((item) => {
                    const quantity = item.duration_days ? Math.min(item.duration_days * 2, 60) : 30;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            disabled={item.is_dispensed}
                            checked={item.is_dispensed || selectedItems.includes(item.id)}
                            onChange={() => handleToggleItem(item.id)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer disabled:opacity-40"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">{item.generic_name}</span>
                          {item.brand_name && (
                            <span className="text-[11px] text-slate-500">Brand: {item.brand_name}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <span className="font-medium">{item.dosage}</span>
                          <span className="block text-[11px] text-slate-500">{item.frequency}</span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {quantity} units
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant={item.is_dispensed ? 'outline' : 'primary'}
                            size="sm"
                            disabled={item.is_dispensed || dispensing}
                            onClick={() => handleDispenseItem(item.id)}
                          >
                            {item.is_dispensed ? 'Dispensed' : 'Dispense'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons: Dispense Selected & Dispense All */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-5">
            <span className="text-xs text-slate-500">
              Selected <strong>{selectedItems.length}</strong> of {prescription.items.length} medicine(s)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                disabled={prescription.status === 'Dispensed' || selectedItems.length === 0 || dispensing}
                onClick={handleDispenseSelected}
                isLoading={dispensing}
              >
                Dispense Selected
              </Button>

              <Button
                variant="primary"
                size="md"
                disabled={prescription.status === 'Dispensed' || dispensing}
                onClick={handleDispenseAll}
                isLoading={dispensing}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Dispense All
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
