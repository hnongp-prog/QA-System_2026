import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Sliders,
  FileText,
  History,
  Printer,
  Sparkles,
  Layers,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Building2,
  Info
} from 'lucide-react';
import {
  CoiCustomerTemplate,
  CoiIssueRecord,
  InspectionActivity
} from '../types';
import {
  getCustomerTemplates,
  saveCustomerTemplate,
  deleteCustomerTemplate,
  resetCustomerTemplates,
  getCoiRecords,
  deleteCoiRecord
} from '../utils/coiStorage';

import { CoiLayoutDesigner } from './coi/CoiLayoutDesigner';
import { CoiIssueForm } from './coi/CoiIssueForm';
import { CoiOfficialDocument } from './coi/CoiOfficialDocument';
import { CoiHistoryTable } from './coi/CoiHistoryTable';

interface CoiManagementAppProps {
  onBackToPortal?: () => void;
  onBackToMenu?: () => void;
  onLogNewActivity?: (activity: Omit<InspectionActivity, 'id' | 'timestamp'>) => void;
  language?: 'th' | 'en';
}

type TabType = 'DESIGN' | 'ISSUE' | 'VIEW_DOCUMENT' | 'HISTORY';

export const CoiManagementApp: React.FC<CoiManagementAppProps> = ({
  onBackToPortal,
  onBackToMenu,
  onLogNewActivity,
  language = 'th'
}) => {
  const isTh = language === 'th';
  const handleBackToMain = onBackToPortal || onBackToMenu;
  const [activeTab, setActiveTab] = useState<TabType>('DESIGN');

  // Customer Templates State
  const [templates, setTemplates] = useState<CoiCustomerTemplate[]>(() => getCustomerTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const list = getCustomerTemplates();
    return list.length > 0 ? list[0].id : 'cust-denso';
  });

  // Records State
  const [records, setRecords] = useState<CoiIssueRecord[]>(() => getCoiRecords());
  const [currentViewingRecord, setCurrentViewingRecord] = useState<CoiIssueRecord | null>(() => {
    const recs = getCoiRecords();
    return recs.length > 0 ? recs[0] : null;
  });

  // Reload data from local storage on mount
  useEffect(() => {
    const loadedTemplates = getCustomerTemplates();
    setTemplates(loadedTemplates);
    if (loadedTemplates.length > 0 && !loadedTemplates.some(t => t.id === selectedTemplateId)) {
      setSelectedTemplateId(loadedTemplates[0].id);
    }
    setRecords(getCoiRecords());
  }, []);

  const handleSaveTemplate = (template: CoiCustomerTemplate) => {
    const updated = saveCustomerTemplate(template);
    setTemplates(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = deleteCustomerTemplate(id);
    setTemplates(updated);
    if (selectedTemplateId === id && updated.length > 0) {
      setSelectedTemplateId(updated[0].id);
    }
  };

  const handleResetTemplates = () => {
    const reset = resetCustomerTemplates();
    setTemplates(reset);
    if (reset.length > 0) {
      setSelectedTemplateId(reset[0].id);
    }
  };

  const handleCertificateIssued = (newRecord: CoiIssueRecord) => {
    setRecords(getCoiRecords());
    setCurrentViewingRecord(newRecord);
    setActiveTab('VIEW_DOCUMENT');
  };

  const handleViewHistoricalRecord = (record: CoiIssueRecord) => {
    setCurrentViewingRecord(record);
    setActiveTab('VIEW_DOCUMENT');
  };

  const handleDeleteRecord = (recordId: string) => {
    const updated = deleteCoiRecord(recordId);
    setRecords(updated);
    if (currentViewingRecord?.id === recordId) {
      setCurrentViewingRecord(updated.length > 0 ? updated[0] : null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Main Navigation Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToMain}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {isTh ? 'กลับสู่หน้ารวมระบบ' : 'Back to Portal'}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold px-2.5 py-0.5 rounded border border-cyan-500/20">
                COI-01
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isTh ? 'ระบบออกใบรับรองผลการตรวจคุณภาพ COI' : 'Certificate of Inspection (COI) System'}
              </h1>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              {isTh
                ? 'ออกแบบเลย์เอาต์แยกตามลูกค้า • ดึงข้อมูลอัตโนมัติจาก IQA / IPQA • ออกเอกสารมาตรฐาน'
                : 'Customer-specific COI layout design, automated IQA/IPQA data linkage, and certificate issuance.'}
            </p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('DESIGN')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'DESIGN'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{isTh ? '1. ออกแบบผัง (Design Layout)' : '1. Design Layout'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ISSUE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'ISSUE'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isTh ? '2. ระบุรายละเอียด & ดึงข้อมูล (Issue COI)' : '2. Issue COI'}</span>
          </button>

          {currentViewingRecord && (
            <button
              onClick={() => setActiveTab('VIEW_DOCUMENT')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'VIEW_DOCUMENT'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>{isTh ? '3. ใบรับรอง (Official Document)' : '3. Official Doc'}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'HISTORY'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{isTh ? `4. ประวัติ (${records.length})` : `4. History (${records.length})`}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Display */}
      <div>
        {activeTab === 'DESIGN' && (
          <CoiLayoutDesigner
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
            onSaveTemplate={handleSaveTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onResetDefaults={handleResetTemplates}
            language={language}
          />
        )}

        {activeTab === 'ISSUE' && (
          <CoiIssueForm
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
            onCertificateIssued={handleCertificateIssued}
            onLogNewActivity={onLogNewActivity}
            language={language}
          />
        )}

        {activeTab === 'VIEW_DOCUMENT' && currentViewingRecord && (
          <CoiOfficialDocument
            record={currentViewingRecord}
            onBackToIssue={() => setActiveTab('ISSUE')}
            language={language}
          />
        )}

        {activeTab === 'HISTORY' && (
          <CoiHistoryTable
            records={records}
            onViewRecord={handleViewHistoricalRecord}
            onDeleteRecord={handleDeleteRecord}
            language={language}
          />
        )}
      </div>
    </div>
  );
};
export default CoiManagementApp;
