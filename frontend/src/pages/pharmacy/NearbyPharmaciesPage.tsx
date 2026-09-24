import React, { useState, useEffect } from 'react';
import { Store, Search, MapPin, Phone, Star, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Pharmacy, Medicine } from '../../types';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const NearbyPharmaciesPage: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedMedId, setSelectedMedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [pharmList, medList] = await Promise.all([
          api.getNearbyPharmacies(selectedMedId ? Number(selectedMedId) : undefined, searchQuery),
          api.getMedicines(),
        ]);
        setPharmacies(pharmList);
        setMedicines(medList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [selectedMedId, searchQuery]);

  const getStockBadge = (status?: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <Badge variant="green" size="sm">In Stock</Badge>;
      case 'LIMITED_STOCK':
        return <Badge variant="amber" size="sm">Limited Stock</Badge>;
      case 'OUT_OF_STOCK':
        return <Badge variant="red" size="sm">Out of Stock</Badge>;
      default:
        return <Badge variant="green" size="sm">In Stock</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nearby Pharmacies & Live Stock Search</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Find verified partner pharmacies within your vicinity with real-time demo medicine inventory levels.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Check Specific Medicine Availability
            </label>
            <select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-200 p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">-- All General Inventories --</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.generic_name} ({m.brand_name}) - {m.strength}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Search by Pharmacy Name or Landmark
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Apollo, MedPlus, Bellandur..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Pharmacies List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading nearby pharmacies...</div>
        ) : pharmacies.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No pharmacies found in this radius.</div>
        ) : (
          pharmacies.map((pharm) => (
            <Card key={pharm.id} className="p-4 hover:border-brand-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{pharm.name}</h3>
                      <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {pharm.rating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {pharm.address}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {pharm.phone}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-2 shrink-0">
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                    {pharm.distance_km} km away
                  </span>
                  <div>{getStockBadge(pharm.stock_status)}</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
