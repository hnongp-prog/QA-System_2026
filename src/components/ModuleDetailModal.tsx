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
import { QAModule, Language, InspectionActivity } from '../types';
import { IconRenderer } from './IconRenderer';

interface ModuleDetailModalProps {
  module: QAModule | null;
  onClose: () => void;
  language: Language;
  onAddTestActivity: (activity: InspectionActivity) => void;
  onLaunchApp?: (moduleCode: string) => void;
}

export const ModuleDetailModal: React.FC<ModuleDetailModalProps> = ({
  module,
  onClose,
  language,
  onAddTestActivity,
  onLaunchApp
}) => {
  if (!module) return null;

  const isTh = language === 'th';
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

  const handleSimulateInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newActivity: InspectionActivity = {
      id: `act-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      moduleCode: module.code,
      moduleTitleTh: module.titleTh,
      moduleTitleEn: module.titleEn,
      inspector: testInspector,
      batchLot: testLot,
      result: testResult,
      defectCount: testResult === 'FAIL' ? (testDefectCount || 1) : 0,
      remarks: testRemarks || (testResult === 'PASS' ? 'Sample test passed all criteria' : 'Defect detected in test sample')
    };

    onAddTestActivity(newActivity);
    setLoggedSuccessMsg(true);
    setTimeout(() => setLoggedSuccessMsg(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Top Banner */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <IconRenderer name={module.iconName} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {module.code}
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {module.status === 'ACTIVE' ? (isTh ? 'เปิดใช้งานแอปพลิเคชันแล้ว (Live App)' : 'Live App') : module.status === 'READY_FOR_DEV' ? (isTh ? 'พร้อมรับโจทย์สร้างแอปย่อย' : 'Ready for Sub-App Dev') : module.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">{title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onLaunchApp && (
              <button
                onClick={() => {
                  onLaunchApp(module.code);
                  onClose();
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{isTh ? 'เปิดใช้งานแอปย่อยนี้' : 'Launch Sub-App'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 bg-slate-900 border-b border-slate-800 flex items-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
              activeTab === 'sandbox'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isTh ? '1. ทดลองจำลองใช้งาน (Interactive Sandbox)' : '1. Interactive Sandbox'}</span>
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
              activeTab === 'specs'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isTh ? '2. ข้อกำหนดสเปค (System Specs)' : '2. System Specs'}</span>
          </button>

          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
              activeTab === 'prompt'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isTh ? '3. ข้อความสำหรับคำสั่งสร้างแอปย่อย (AI Prompt)' : '3. AI Prompt Specs'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: SANDBOX SIMULATOR */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-start gap-3">
                <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {isTh ? 'พื้นที่ทดสอบจำลองกระบวนการแอปย่อย (Sub-App Sandbox)' : 'Sub-App Interactive Sandbox'}
                  </h4>
                  <p className="mt-1 text-slate-400 leading-relaxed">
                    {isTh 
                      ? 'คุณสามารถทดลองกรอกข้อมูลจำลองและบันทึกผลการตรวจ เพื่อทดสอบความสมบูรณ์ของระบบเมนูหลักก่อนที่จะสร้างแอปย่อยเต็มรูปแบบในขั้นตอนถัดไป' 
                      : 'Test simulate inspecting and logging results to verify the workflow before full sub-app module implementation.'}
                  </p>
                </div>
              </div>

              {/* Sandbox Form */}
              <form onSubmit={handleSimulateInspectionSubmit} className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" />
                    {isTh ? 'ฟอร์มจำลองการตรวจสำหรับ' : 'Simulated Inspection Form:'} {module.code}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {isTh ? 'มาตรฐาน AQL Level II' : 'AQL Level II Standard'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {isTh ? 'หมายเลขลอต / Batch Number' : 'Batch / Lot Number'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testLot}
                        onChange={(e) => setTestLot(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setTestLot(`LOT-2026-${Math.floor(100 + Math.random() * 900)}`)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 shrink-0"
                        title="Generate mock Lot ID"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Scan</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {isTh ? 'ชื่อผู้ตรวจประเมิน' : 'Inspector Name'}
                    </label>
                    <input
                      type="text"
                      value={testInspector}
                      onChange={(e) => setTestInspector(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                {/* Result Toggle */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {isTh ? 'ผลการตรวจทดสอบ (Inspection Decision)' : 'Inspection Decision'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTestResult('PASS')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                        testResult === 'PASS'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-950/50'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isTh ? 'ผ่านเกณฑ์ (PASS)' : 'PASS / Approved'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTestResult('FAIL')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                        testResult === 'FAIL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-md shadow-rose-950/50'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isTh ? 'ไม่ผ่าน (FAIL / Reject)' : 'FAIL / Reject'}</span>
                    </button>
                  </div>
                </div>

                {testResult === 'FAIL' && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2 animate-fadeIn">
                    <label className="block text-xs font-medium text-rose-300">
                      {isTh ? 'จำนวนชิ้นงานเสียที่พบ (Defect Count)' : 'Defect Count Detected'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={testDefectCount}
                      onChange={(e) => setTestDefectCount(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-rose-500/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isTh ? 'หมายเหตุ / ข้อสังเกตเพิ่มเติม (Inspection Remarks)' : 'Inspection Remarks'}
                  </label>
                  <textarea
                    rows={2}
                    value={testRemarks}
                    onChange={(e) => setTestRemarks(e.target.value)}
                    placeholder={isTh ? 'ระบุผลการตรวจสอบมิติ หรือข้อเสนอแนะ...' : 'Enter dimension results or remarks...'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition active:scale-95 shadow-md shadow-cyan-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTh ? 'บันทึกการตรวจจำลอง' : 'Log Test Inspection'}</span>
                  </button>

                  {loggedSuccessMsg && (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/80 px-3 py-1 rounded-md border border-emerald-800">
                      <Check className="w-3.5 h-3.5" />
                      {isTh ? 'บันทึกข้อมูลเข้าแดชบอร์ดแล้ว!' : 'Inspection logged to dashboard!'}
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SYSTEM SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{isTh ? 'ผู้ใช้งานเป้าหมาย' : 'Target Persona'}</span>
                  <span className="text-xs font-bold text-cyan-300 mt-1 block">
                    {isTh ? module.specs.targetUsersTh : module.specs.targetUsersEn}
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{isTh ? 'รายการเช็คลิสต์' : 'Checklist Items'}</span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 block">
                    {module.specs.checklistItemsCount} {isTh ? 'รายการมาตรฐาน' : 'Standard Items'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">{isTh ? 'รูปแบบรายงานออก' : 'Report Format'}</span>
                  <span className="text-xs font-bold text-indigo-300 mt-1 block">
                    {isTh ? module.specs.outputReportTypeTh : module.specs.outputReportTypeEn}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  {isTh ? 'ฟีเจอร์หลักของแอปพลิเคชันย่อยนี้ (Key Modules & Features)' : 'Key Modules & Features'}
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(isTh ? module.specs.keyFeaturesTh : module.specs.keyFeaturesEn).map((feat, i) => (
                    <li key={i} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: AI PROMPT SPECS */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-300">
                    {isTh ? 'คำสั่งสร้างแอปพลิเคชันย่อยนี้ (Ready-to-use Prompt)' : 'Ready-to-use AI Prompt'}
                  </h4>
                  <p className="mt-1 text-slate-300">
                    {isTh 
                      ? 'คุณสามารถคัดลอกข้อความด้านล่างนี้ เพื่อนำไปสั่ง AI ให้สร้างระบบแอปย่อยนี้แบบละเอียดได้ทันทีเมื่อระบบเมนูหลักสมบูรณ์แล้ว' 
                      : 'Copy the formatted prompt below to generate this sub-app module in the next phase.'}
                  </p>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64">
                  {generatedPromptText}
                </pre>

                <button
                  onClick={handleCopyPrompt}
                  className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-600 transition flex items-center gap-1.5 shadow-md"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{isTh ? 'คัดลอกแล้ว!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isTh ? 'คัดลอกข้อความ' : 'Copy Prompt'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            {isTh ? 'QA Main Portal Engine v2.5' : 'QA Main Portal Engine v2.5'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition"
          >
            {isTh ? 'ปิดหน้าต่าง' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
