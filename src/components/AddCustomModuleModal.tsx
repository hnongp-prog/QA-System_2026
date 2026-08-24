import React, { useState } from 'react';
import { X, Plus, Sparkles, Layers, ShieldCheck, Check } from 'lucide-react';
import { QAModule, QACategory, Language } from '../types';

interface AddCustomModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddModule: (module: QAModule) => void;
  language: Language;
}

export const AddCustomModuleModal: React.FC<AddCustomModuleModalProps> = ({
  isOpen,
  onClose,
  onAddModule,
  language
}) => {
  if (!isOpen) return null;

  const isTh = language === 'th';

  const [code, setCode] = useState('QA-APP-01');
  const [category, setCategory] = useState<QACategory>('IQA');
  const [titleTh, setTitleTh] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descTh, setDescTh] = useState('');
  const [descEn, setDescEn] = useState('');
  const [iconName, setIconName] = useState('ClipboardCheck');
  const [targetUsersTh, setTargetUsersTh] = useState('เจ้าหน้าที่ตรวจควบคุมคุณภาพ');
  const [targetUsersEn, setTargetUsersEn] = useState('QA Inspection Team');
  const [keyFeaturesInput, setKeyFeaturesInput] = useState('ระบบบันทึกผลสุ่มตรวจ\nระบบสแกนคิวอาร์โค้ด\nการออกรายงานสเปค');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const featuresArr = keyFeaturesInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const newModule: QAModule = {
      id: `mod-custom-${Date.now()}`,
      code: code.toUpperCase() || 'MOD-01',
      titleTh: titleTh || 'แอปย่อยตรวจคุณภาพใหม่',
      titleEn: titleEn || 'New QA Sub-App Module',
      descriptionTh: descTh || 'ระบบแอปย่อยสำหรับตรวจควบคุมคุณภาพเฉพาะด้าน',
      descriptionEn: descEn || 'Custom QA inspection module for factory workflow',
      category: category,
      iconName: iconName,
      status: 'READY_FOR_DEV',
      pinned: true,
      version: 'v1.0.0 (Custom App)',
      metrics: [
        { labelTh: 'สถานะระบบ', labelEn: 'Status', value: 'Ready' }
      ],
      specs: {
        targetUsersTh: targetUsersTh,
        targetUsersEn: targetUsersEn,
        checklistItemsCount: 10,
        estimatedTimeMin: 10,
        outputReportTypeTh: 'Custom QA Report Certificate',
        outputReportTypeEn: 'Custom QA Report Certificate',
        keyFeaturesTh: featuresArr.length > 0 ? featuresArr : ['ระบบเช็คลิสต์ตรวจคุณภาพ', 'การบันทึกผลเรียลไทม์'],
        keyFeaturesEn: featuresArr.length > 0 ? featuresArr : ['Inspection Checklist Form', 'Real-time Result Logging']
      }
    };

    onAddModule(newModule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isTh ? 'เพิ่มเมนูแอปย่อยใหม่ในระบบ (Add Sub-App Module)' : 'Register New Sub-App Module'}
              </h3>
              <p className="text-xs text-slate-400">
                {isTh ? 'ลงทะเบียนเมนูแอปย่อยเพื่อนำไปสร้างต่อในอนาคต' : 'Register menu item for upcoming sub-app development'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                {isTh ? 'รหัสโมดูล (Module Code)' : 'Module Code'}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. IQC-03, PACK-01"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                {isTh ? 'หมวดหมู่การตรวจ (QA Category)' : 'QA Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as QACategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="IQA">IQA - ตรวจรับวัตถุดิบ (Incoming Assurance)</option>
                <option value="IPQA">IPQA - ตรวจระหว่างผลิต (In-Process Assurance)</option>
                <option value="OQA">OQA - ตรวจจัดส่ง (Outgoing Assurance)</option>
                <option value="EQUIPMENT">EQUIPMENT - เครื่องมือ & สอบเทียบ</option>
                <option value="NCR">NCR - จัดการของเสีย & CAPA</option>
                <option value="ANALYTICS">ANALYTICS - วิเคราะห์คุณภาพ</option>
                <option value="CERTIFICATE_COI">Certificate_COI - ใบรับรองคุณภาพ COI</option>
                <option value="CUSTOM">CUSTOM - โมดูลพิเศษ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                {isTh ? 'ชื่อแอปย่อย (ภาษาไทย)' : 'Title (Thai)'}
              </label>
              <input
                type="text"
                value={titleTh}
                onChange={(e) => setTitleTh(e.target.value)}
                placeholder="เช่น ตรวจสอบความชื้นไม้ปาติเกิ้ล"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                {isTh ? 'ชื่อแอปย่อย (ภาษาอังกฤษ)' : 'Title (English)'}
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Moisture Content Inspection"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              {isTh ? 'คำอธิบายระบบ (ภาษาไทย)' : 'Description (Thai)'}
            </label>
            <textarea
              rows={2}
              value={descTh}
              onChange={(e) => setDescTh(e.target.value)}
              placeholder="อธิบายหน้าที่กระบวนการตรวจรับรองในแอปย่อยนี้..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              {isTh ? 'คุณสมบัติเด่นที่ต้องการพัฒนา (Key Features - 1 บรรทัด/ข้อ)' : 'Key Features (1 per line)'}
            </label>
            <textarea
              rows={3}
              value={keyFeaturesInput}
              onChange={(e) => setKeyFeaturesInput(e.target.value)}
              placeholder="ฟีเจอร์ข้อที่ 1&#10;ฟีเจอร์ข้อที่ 2"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
            >
              {isTh ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg transition shadow-md shadow-cyan-500/20"
            >
              {isTh ? 'บันทึกเมนูแอปย่อย' : 'Add Module'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
