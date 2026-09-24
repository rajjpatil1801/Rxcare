import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, Pill, FileText, FlaskConical, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { GlobalSearchResultItem } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    patients: GlobalSearchResultItem[];
    medicines: GlobalSearchResultItem[];
    prescriptions: GlobalSearchResultItem[];
    lab_reports: GlobalSearchResultItem[];
  }>({ patients: [], medicines: [], prescriptions: [], lab_reports: [] });

  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ patients: [], medicines: [], prescriptions: [], lab_reports: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.globalSearch(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (link: string) => {
    onClose();
    navigate(link);
  };

  const hasResults =
    results.patients.length > 0 ||
    results.medicines.length > 0 ||
    results.prescriptions.length > 0 ||
    results.lab_reports.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:p-6 sm:pt-20">
        <div
          className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="flex items-center border-b border-slate-200 px-4 py-3.5 bg-slate-50/50">
            <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients, medicines, prescriptions, lab reports..."
              className="w-full bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">
              ESC
            </kbd>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {loading && (
              <div className="py-8 text-center text-sm text-slate-500">
                <div className="animate-spin inline-block w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full mb-2"></div>
                <p>Searching RxCare records...</p>
              </div>
            )}

            {!loading && !hasResults && query.length >= 2 && (
              <div className="py-8 text-center text-sm text-slate-500">
                No matching clinical records found for "{query}".
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="py-6 text-center text-xs text-slate-400">
                Type at least 2 characters to search across patients, medicines, prescriptions, and lab tests.
              </div>
            )}

            {/* Patients */}
            {results.patients.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-600" /> Patients
                </p>
                <div className="space-y-1">
                  {results.patients.map((p) => (
                    <div
                      key={`patient-${p.id}`}
                      onClick={() => handleSelect(p.link)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-brand-50/70 cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.subtitle}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medicines */}
            {results.medicines.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" /> Medicines Database
                </p>
                <div className="space-y-1">
                  {results.medicines.map((m) => (
                    <div
                      key={`med-${m.id}`}
                      onClick={() => handleSelect(m.link)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-emerald-50/70 cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">{m.title}</p>
                        <p className="text-xs text-slate-500">{m.subtitle}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prescriptions */}
            {results.prescriptions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-600" /> Prescriptions
                </p>
                <div className="space-y-1">
                  {results.prescriptions.map((rx) => (
                    <div
                      key={`rx-${rx.id}`}
                      onClick={() => handleSelect(rx.link)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-sky-50/70 cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-sky-700">{rx.title}</p>
                        <p className="text-xs text-slate-500">{rx.subtitle}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lab Reports */}
            {results.lab_reports.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-purple-600" /> Lab Reports
                </p>
                <div className="space-y-1">
                  {results.lab_reports.map((lr) => (
                    <div
                      key={`lr-${lr.id}`}
                      onClick={() => handleSelect(lr.link)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-purple-50/70 cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-purple-700">{lr.title}</p>
                        <p className="text-xs text-slate-500">{lr.subtitle}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
