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
  Info,
  Sun,
  Moon
} from 'lucide-react';
import {
  CoiCustomerTemplate,
  CoiIssueRecord,
  InspectionActivity,
  ThemeMode
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
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

type TabType = 'DESIGN' | 'ISSUE' | 'VIEW_DOCUMENT' | 'HISTORY';

export const CoiManagementApp: React.FC<CoiManagementAppProps> = ({
  onBackToPortal,
  onBackToMenu,
  onLogNewActivity,
  language = 'th',
  theme = 'light',
  onToggleTheme
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';
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
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Main Navigation Banner */}
      <div className={`border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToMain}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            {isTh ? 'กลับสู่หน้ารวมระบบ' : 'Back to Portal'}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded border ${
                isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              }`}>
                COI-01
              </span>
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {isTh ? 'ระบบออกใบรับรองผลการตรวจคุณภาพ COI' : 'Certificate of Inspection (COI) System'}
              </h1>
            </div>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isTh
                ? 'ออกแบบเลย์เอาต์แยกตามลูกค้า • ดึงข้อมูลอัตโนมัติจาก IQA / IPQA • ออกเอกสารมาตรฐาน'
                : 'Customer-specific COI layout design, automated IQA/IPQA data linkage, and certificate issuance.'}
            </p>
          </div>
        </div>

        {/* Global Navigation Tabs & Theme Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                isLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Clean'}
            >
              {isLight ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isLight ? (isTh ? 'โหมดสว่าง' : 'Light') : (isTh ? 'โหมดมืด' : 'Dark')}</span>
            </button>
          )}

          <div className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <button
              onClick={() => setActiveTab('DESIGN')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'DESIGN'
                  ? isLight
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
                  ? isLight
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
                    ? isLight
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
                  ? isLight
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{isTh ? `4. ประวัติ (${records.length})` : `4. History (${records.length})`}</span>
            </button>
          </div>
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
