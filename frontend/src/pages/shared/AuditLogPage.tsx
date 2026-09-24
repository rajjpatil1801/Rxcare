import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Clock, User, ShieldAlert, FileText, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLogItem } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(roleFilter || undefined, search || undefined);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchLogs, 250);
    return () => clearTimeout(timer);
  }, [roleFilter, search]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'DOCTOR': return 'blue';
      case 'PATIENT': return 'green';
      case 'LABORATORY': return 'purple';
      case 'PHARMACY': return 'amber';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit & Compliance Log</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable, timestamped event trail tracking chart accesses, prescription changes, dispensing events, and consent updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="green" size="md">
            Audit Stream Active
          </Badge>
        </div>
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
              placeholder="Search audit actions, users, or patient identifiers..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 w-full sm:w-auto"
          >
            <option value="">All Roles</option>
            <option value="DOCTOR">Doctor</option>
            <option value="PATIENT">Patient</option>
            <option value="LABORATORY">Laboratory</option>
            <option value="PHARMACY">Pharmacy</option>
          </select>

          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            {logs.length} logged events
          </span>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading audit records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No audit records found matching filters.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{log.actor_name}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getRoleBadgeVariant(log.role)} size="sm">{log.role}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brand-700">{log.action}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {log.resource_type} {log.resource_id && `(${log.resource_id})`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[280px] truncate" title={log.details}>
                      {log.details}
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
