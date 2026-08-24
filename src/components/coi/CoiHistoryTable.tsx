import React, { useState } from 'react';
import {
  FileText,
  Search,
  Printer,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Building2,
  Filter
} from 'lucide-react';
import { CoiIssueRecord } from '../../types';

interface CoiHistoryTableProps {
  records: CoiIssueRecord[];
  onViewRecord: (record: CoiIssueRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  language?: 'th' | 'en';
}

export const CoiHistoryTable: React.FC<CoiHistoryTableProps> = ({
  records,
  onViewRecord,
  onDeleteRecord,
  language = 'th'
}) => {
  const isTh = language === 'th';
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');

  const customers = Array.from(new Set(records.map(r => r.customerName)));

  const filtered = records.filter(r => {
    const matchSearch =
      r.coiNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.coilNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.partNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCustomer = customerFilter === 'ALL' || r.customerName === customerFilter;
    return matchSearch && matchCustomer;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isTh ? 'ค้นหา COI No, ลูกค้า, Coil No, Part...' : 'Search Cert No, Customer, Coil No...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={customerFilter}
            onChange={e => setCustomerFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">{isTh ? 'ทุกลูกค้า (All Customers)' : 'All Customers'}</option>
            {customers.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">COI Number</th>
                <th className="p-3.5">Customer & Part</th>
                <th className="p-3.5">Coil No.</th>
                <th className="p-3.5">Length</th>
                <th className="p-3.5">Issue Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    {isTh ? 'ไม่พบประวัติใบรับรอง COI' : 'No issued COI records found.'}
                  </td>
                </tr>
              ) : (
                filtered.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-cyan-400">
                      {rec.coiNo}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        {rec.customerName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {rec.partNumber || rec.profileCode}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-slate-200">
                      {rec.coilNo}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {rec.length}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {rec.issueDate}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        PASS
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewRecord(rec)}
                          className="flex items-center gap-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-semibold px-2.5 py-1.5 rounded border border-cyan-800 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {isTh ? 'เปิดดู' : 'View'}
                        </button>
                        <button
                          onClick={() => onDeleteRecord(rec.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
