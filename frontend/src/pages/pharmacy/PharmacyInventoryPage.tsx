import React, { useState, useEffect } from 'react';
import { Pill, Search, RefreshCw, Edit2, Check, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';

interface InventoryItem {
  id: number;
  medicine: number;
  medicine_name: string;
  brand_name: string;
  strength: string;
  stock_quantity: number;
  status: 'IN_STOCK' | 'LIMITED_STOCK' | 'OUT_OF_STOCK';
}

export const PharmacyInventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<'IN_STOCK' | 'LIMITED_STOCK' | 'OUT_OF_STOCK'>('IN_STOCK');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await api.getPharmacyInventory(search);
      setInventory(data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search]);

  const handleStartEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditQty(item.stock_quantity);
    setEditStatus(item.status);
    setSaveSuccess(null);
  };

  const handleSaveEdit = async (id: number) => {
    try {
      await api.updatePharmacyInventory(id, {
        stock_quantity: editQty,
        status: editStatus,
      });
      setInventory((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, stock_quantity: editQty, status: editStatus }
            : item
        )
      );
      setEditingId(null);
      setSaveSuccess('Stock updated successfully.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update inventory:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'IN_STOCK') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          In Stock
        </span>
      );
    }
    if (status === 'LIMITED_STOCK') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          Limited Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        Out of Stock
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pharmacy Medicine Inventory
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor pharmaceutical stock levels, units on hand, and update demo inventory.
        </p>
      </div>

      {saveSuccess && (
        <Alert type="success">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        </Alert>
      )}

      {/* Search and Filter */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine by generic name, brand, or status..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchInventory}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Stock
          </Button>
        </div>

        {/* Inventory Table: Medicine | Strength | Quantity | Status */}
        <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Medicine</th>
                <th className="py-2.5 px-3">Strength</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading inventory records...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No medicine inventory records found.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{item.medicine_name}</span>
                        {item.brand_name && (
                          <span className="text-[11px] text-slate-500">Brand: {item.brand_name}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">
                        {item.strength}
                      </td>
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editQty}
                            onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-semibold"
                          />
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {item.stock_quantity} units
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as any)}
                            className="px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                          >
                            <option value="IN_STOCK">In Stock</option>
                            <option value="LIMITED_STOCK">Limited Stock</option>
                            <option value="OUT_OF_STOCK">Out of Stock</option>
                          </select>
                        ) : (
                          getStatusBadge(item.status)
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleSaveEdit(item.id)}
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit(item)}
                            leftIcon={<Edit2 className="w-3 h-3" />}
                          >
                            Update
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
