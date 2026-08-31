import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Code2, 
  Copy, 
  Check, 
  FileText, 
  Sliders, 
  Camera, 
  QrCode, 
  Send, 
  ShieldCheck, 
  AlertTriangle,
  Zap,
  Clock,
  UserCheck,
  Download
} from 'lucide-react';
import { QAModule, Language, InspectionActivity, ThemeMode } from '../types';
import { IconRenderer } from './IconRenderer';

interface ModuleDetailModalProps {
  module: QAModule | null;
  onClose: () => void;
  language: Language;
  theme?: ThemeMode;
  onAddTestActivity: (activity: InspectionActivity) => void;
  onLaunchApp?: (moduleCode: string) => void;
}

export const ModuleDetailModal: React.FC<ModuleDetailModalProps> = ({
  module,
  onClose,
  language,
  theme = 'light',
  onAddTestActivity,
  onLaunchApp
}) => {
  if (!module) return null;

  const isTh = language === 'th';
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'sandbox' | 'specs' | 'prompt'>('sandbox');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Interactive Sandbox State for testing the sub-app workflow
  const [testLot, setTestLot] = useState(`LOT-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [testInspector, setTestInspector] = useState('Anucha S. (Inspector)');
  const [testResult, setTestResult] = useState<'PASS' | 'FAIL'>('PASS');
  const [testDefectCount, setTestDefectCount] = useState<number>(0);
  const [testRemarks, setTestRemarks] = useState('');
  const [loggedSuccessMsg, setLoggedSuccessMsg] = useState(false);

  const title = isTh ? module.titleTh : module.titleEn;
  const description = isTh ? module.descriptionTh : module.descriptionEn;

  // Generate Prompt for the AI model to build this specific sub-app next
  const generatedPromptText = `สร้างแอปพลิเคชันย่อย (Sub-App) สำหรับระบบ QA Inspection System:

📌 รหัสโมดูล: ${module.code}
📌 ชื่อแอปพลิเคชัน: ${module.titleTh} (${module.titleEn})
📌 หมวดหมู่: ${module.category}

รายละเอียดความต้องการของแอปพลิเคชันย่อยนี้:
1. ${isTh ? module.descriptionTh : module.descriptionEn}
2. กลุ่มผู้ใช้งานเป้าหมาย: ${module.specs.targetUsersTh}
3. จำนวนรายการเช็คลิสต์มาตรฐาน: ${module.specs.checklistItemsCount} รายการ
4. ฟีเจอร์หลักที่ต้องมี:
${module.specs.keyFeaturesTh.map((f, i) => `   - ${f}`).join('\n')}
5. รูปแบบรายงานผลลัพธ์: ${module.specs.outputReportTypeTh}

กรุณาสร้างแอปพลิเคชันย่อยนี้แบบสมบูรณ์แบบพร้อมฟอร์มบันทึกผลการตรวจ, ระบบสแกน QR/Barcode, ระบบถ่ายรูปจุดเสีย (Defect Logger), และการพิมพ์รายงาน PDF/Certificate`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleLogTest = () => {
    const newActivity: InspectionActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      moduleCode: module.code,
      moduleTitleTh: module.titleTh,
      moduleTitleEn: module.titleEn,
      inspector: testInspector,
      batchLot: testLot,
      result: testResult,
      defectCount: testResult === 'FAIL' ? Math.max(1, testDefectCount) : 0,
      remarks: testRemarks || (testResult === 'PASS' ? 'Sample passed standard spec limits' : 'Out of spec detected')
    };

    onAddTestActivity(newActivity);
    setLoggedSuccessMsg(true);
    setTimeout(() => setLoggedSuccessMsg(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className={`w-full max-w-3xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        
        {/* Header Ribbon */}
        <div className={`px-6 py-4 border-b flex items-start justify-between gap-4 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
              isLight ? 'bg-white border-slate-200 text-blue-600 shadow-xs' : 'bg-slate-900 border-slate-800 text-cyan-400'
            }`}>
              <IconRenderer name={module.iconName} className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                  isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                }`}>
                  {module.code}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {module.category}
                </span>
              </div>
              <h2 className={`text-lg font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {title}
              </h2>
              <p className={`text-xs line-clamp-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {description}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition ${
              isLight 
                ? 'text-slate-400 hover:text-slate-700 bg-white border-slate-200 hover:bg-slate-100' 
                : 'text-slate-400 hover:text-white bg-slate-800/80 border-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className={`flex items-center gap-2 px-6 py-2.5 border-b text-xs font-bold ${
          isLight ? 'bg-slate-100/50 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'sandbox'
                ? isLight ? 'bg-white text-blue-600 shadow-xs border border-slate-200' : 'bg-slate-800 text-cyan-400'
                : 'hover:text-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isTh ? 'จำลองส่งผลตรวจ (Interactive Sandbox)' : 'Interactive Sandbox'}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'specs'
                ? isLight ? 'bg-white text-blue-600 shadow-xs border border-slate-200' : 'bg-slate-800 text-cyan-400'
                : 'hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isTh ? 'สเปคระบบย่อย (Specs & Architecture)' : 'Sub-App Specifications'}</span>
          </button>

          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'prompt'
                ? isLight ? 'bg-white text-blue-600 shadow-xs border border-slate-200' : 'bg-slate-800 text-cyan-400'
                : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isTh ? 'คัดลอกคำสั่งสร้างแอป (AI Prompt)' : 'Sub-App Builder Prompt'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[60vh]">
          
          {/* TAB 1: SANDBOX */}
          {activeTab === 'sandbox' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-blue-50/60 border-blue-200 text-slate-700' : 'bg-cyan-950/40 border-cyan-800/60 text-slate-300'
              }`}>
                <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                  <Play className="w-4 h-4 text-blue-600" />
                  <span>{isTh ? 'การทดสอบจำลองส่งข้อมูลจากแอปย่อยนี้เข้า Portal' : 'Live Data Simulation'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isTh 
                    ? 'คุณสามารถจำลองการสุ่มตรวจ บันทึกผล และส่งกิจกรรมเข้าระบบ Live Log ส่วนกลางได้ทันที' 
                    : 'Simulate inspection entries directly into the central live QA feed.'}
                </p>
              </div>

              {loggedSuccessMsg && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold animate-in fade-in ${
                  isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isTh ? 'บันทึกรายการตรวจสำเร็จ! ข้อมูลถูกส่งเข้า Live Inspection Log เรียบร้อยแล้ว' : 'Record saved to central inspection logs!'}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {isTh ? 'รหัสล็อต / Coil No. / Batch No.' : 'Batch / Lot No.'}
                  </label>
                  <input
                    type="text"
                    value={testLot}
                    onChange={(e) => setTestLot(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-600' : 'bg-slate-800 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {isTh ? 'ผู้ตรวจสอบ (Inspector)' : 'Inspector Name'}
                  </label>
                  <input
                    type="text"
                    value={testInspector}
                    onChange={(e) => setTestInspector(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-600' : 'bg-slate-800 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {isTh ? 'ผลการตรวจสอบ (Result)' : 'Inspection Decision'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTestResult('PASS')}
                      className={`py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        testResult === 'PASS'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PASS (ผ่านเกณฑ์)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestResult('FAIL')}
                      className={`py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        testResult === 'FAIL'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>FAIL (ตกสเปค)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {isTh ? 'จำนวนจุดเสีย (Defect Points)' : 'Defect Count'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={testDefectCount}
                    onChange={(e) => setTestDefectCount(Number(e.target.value))}
                    disabled={testResult === 'PASS'}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono transition ${
                      testResult === 'PASS' 
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                        : isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {isTh ? 'หมายเหตุเพิ่มเติม (Remarks)' : 'Remarks'}
                </label>
                <input
                  type="text"
                  value={testRemarks}
                  onChange={(e) => setTestRemarks(e.target.value)}
                  placeholder={isTh ? 'เช่น ค่าความหนาต่ำกว่าเกณฑ์ 0.05 mm' : 'e.g., Wall thickness deviation observed'}
                  className={`w-full px-3 py-2 text-xs rounded-lg border transition ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-600' : 'bg-slate-800 border-slate-700 text-slate-100'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleLogTest}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTh ? 'ส่งผลตรวจเข้า Live Feed' : 'Submit to Live Feed'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-4 text-xs">
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <h4 className={`font-bold text-xs mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isTh ? 'สเปคและขอบเขตฟังก์ชันของแอปย่อยนี้' : 'Sub-App Specifications & Scope'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}>
                      {isTh ? 'กลุ่มผู้ใช้งาน:' : 'Target Users:'}
                    </span>
                    <p className={`font-semibold mt-0.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {isTh ? module.specs.targetUsersTh : module.specs.targetUsersEn}
                    </p>
                  </div>
                  <div>
                    <span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}>
                      {isTh ? 'รูปแบบรายงานผล:' : 'Output Report:'}
                    </span>
                    <p className={`font-semibold mt-0.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {isTh ? module.specs.outputReportTypeTh : module.specs.outputReportTypeEn}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className={`font-bold text-xs mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isTh ? 'ฟีเจอร์หลัก (Key Features)' : 'Key Features'}
                </h4>
                <ul className="space-y-1.5">
                  {(isTh ? module.specs.keyFeaturesTh : module.specs.keyFeaturesEn).map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: AI PROMPT BUILDER */}
          {activeTab === 'prompt' && (
            <div className="space-y-3">
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-950/40 border-amber-800 text-amber-300'
              }`}>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{isTh ? 'คำสั่งพร้อมใช้สำหรับส่งให้ AI เพื่อสร้างหน้าแอปพลิเคชันย่อยนี้' : 'Ready prompt to generate this sub-app UI'}</span>
                </div>
                <button
                  onClick={handleCopyPrompt}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition ${
                    isLight 
                      ? 'bg-white hover:bg-slate-50 text-slate-800 border-amber-300 shadow-xs' 
                      : 'bg-amber-900/50 hover:bg-amber-800 text-amber-200 border-amber-700'
                  }`}
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? (isTh ? 'คัดลอกแล้ว!' : 'Copied!') : (isTh ? 'คัดลอกคำสั่ง' : 'Copy Prompt')}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={generatedPromptText}
                rows={10}
                className={`w-full p-3 text-xs font-mono rounded-xl border transition ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Module Status: <span className="text-emerald-600 font-bold">READY (LIVE APP)</span>
          </div>

          <div className="flex items-center gap-2">
            {onLaunchApp && (
              <button
                type="button"
                onClick={() => {
                  onLaunchApp(module.code);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isTh ? 'เปิดเข้าใช้งานแอปย่อยนี้' : 'Launch Sub-App'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {isTh ? 'ปิดหน้าต่าง' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
