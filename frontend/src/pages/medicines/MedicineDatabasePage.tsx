import React, { useState, useEffect } from 'react';
import { Pill, Search, Filter, AlertTriangle, ShieldCheck, Info, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { Medicine, MedicineInteraction } from '../../types';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const MedicineDatabasePage: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [interactions, setInteractions] = useState<MedicineInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [medList, intList] = await Promise.all([
          api.getMedicines(search, categoryFilter),
          api.getMedicineInteractions(),
        ]);
        setMedicines(medList);
        setInteractions(intList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 200);
    return () => clearTimeout(timer);
  }, [search, categoryFilter]);

  const categories = Array.from(new Set(medicines.map((m) => m.category))).filter(Boolean);

  const getInteractionsForMed = (medId: number) => {
    return interactions.filter((i) => i.medicine_a === medId || i.medicine_b === medId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medicine & Pharmacology Database</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Comprehensive drug profiles with contraindications, allergy classes, interaction registries, and renal thresholds.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Generic molecule, Brand name, or Therapeutic class..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 w-full sm:w-auto"
          >
            <option value="">All Therapeutic Classes</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:inline">
            {medicines.length} molecules catalogued
          </span>
        </div>
      </Card>

      {/* Medicines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading pharmacology catalogue...
          </div>
        ) : medicines.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No medicines match the search query.
          </div>
        ) : (
          medicines.map((med) => {
            const medInteractions = getInteractionsForMed(med.id);
            return (
              <Card
                key={med.id}
                onClick={() => setSelectedMed(med)}
                className="hover:border-brand-400 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-700">
                        {med.generic_name}
                      </h3>
                      <p className="text-xs text-brand-600 font-medium">{med.brand_name || 'Generic'}</p>
                    </div>
                    <Badge variant="blue" size="sm">{med.dosage_form}</Badge>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 font-medium">{med.category}</p>
                  <p className="text-xs text-slate-700 font-semibold mt-1">Standard Strength: {med.strength}</p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {med.renal_consideration && (
                      <Badge variant="amber" size="sm">Renal Clearance</Badge>
                    )}
                    {med.allergy_class && (
                      <Badge variant="red" size="sm">Class: {med.allergy_class}</Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {medInteractions.length} interaction rule{medInteractions.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-brand-600 font-semibold flex items-center gap-1">
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Medicine Details Modal */}
      {selectedMed && (
        <Modal
          isOpen={!!selectedMed}
          onClose={() => setSelectedMed(null)}
          title={`${selectedMed.generic_name} (${selectedMed.brand_name})`}
          subtitle={selectedMed.category}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Strength</span>
                <span className="font-bold text-slate-900">{selectedMed.strength}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Dosage Form</span>
                <span className="font-bold text-slate-900">{selectedMed.dosage_form}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Route</span>
                <span className="font-bold text-slate-900">{selectedMed.route}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Max Daily Dose</span>
                <span className="font-bold text-rose-700">{selectedMed.max_daily_dose || 'Not specified'}</span>
              </div>
            </div>

            {/* Contraindications */}
            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
              <span className="text-rose-950 font-bold flex items-center gap-1.5 uppercase text-[11px]">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Clinical Contraindications
              </span>
              <p className="text-rose-900 mt-1 leading-relaxed">{selectedMed.contraindications || 'None recorded'}</p>
            </div>

            {/* Lab Monitoring */}
            <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200">
              <span className="text-sky-950 font-bold flex items-center gap-1.5 uppercase text-[11px]">
                <Info className="w-4 h-4 text-sky-600" /> Laboratory Monitoring Parameters
              </span>
              <p className="text-sky-900 mt-1 leading-relaxed">{selectedMed.lab_considerations || 'Standard clinical surveillance'}</p>
            </div>

            {/* Registered Drug Interactions */}
            <div>
              <span className="text-slate-800 font-bold uppercase tracking-wider block mb-2 text-[11px]">
                Registered Drug Interactions
              </span>
              {getInteractionsForMed(selectedMed.id).length === 0 ? (
                <p className="text-slate-400 py-2">No major registered drug interactions in demo database.</p>
              ) : (
                <div className="space-y-2">
                  {getInteractionsForMed(selectedMed.id).map((it) => (
                    <div key={it.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">
                          With: {it.medicine_a === selectedMed.id ? it.medicine_b_name : it.medicine_a_name}
                        </span>
                        <Badge variant={it.severity === 'High' ? 'red' : 'amber'} size="sm">
                          {it.severity} Severity
                        </Badge>
                      </div>
                      <p className="text-slate-600 mt-0.5">{it.description}</p>
                      <p className="text-brand-800 font-medium mt-1">Recommendation: {it.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedMed(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
