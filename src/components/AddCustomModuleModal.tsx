import React, { useState } from 'react';
import { X, Plus, Sparkles, Layers, ShieldCheck, Check } from 'lucide-react';
import { QAModule, QACategory, Language, ThemeMode } from '../types';

interface AddCustomModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddModule: (module: QAModule) => void;
  language: Language;
  theme?: ThemeMode;
}

export const AddCustomModuleModal: React.FC<AddCustomModuleModalProps> = ({
  isOpen,
  onClose,
  onAddModule,
  language,
  theme = 'light'
}) => {
  if (!isOpen) return null;

  const isTh = language === 'th';
  const isLight = theme === 'light';

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
        keyFeaturesTh: featuresArr.length > 0 ? featuresArr : ['ระบบบันทึกผลตรวจ', 'การประมวลผล Pass/Fail'],
        keyFeaturesEn: ['Inspection Logging', 'Pass/Fail Evaluation'],
        outputReportTypeTh: 'รายงานการตรวจสอบคุณภาพ (Inspection Report)',
        outputReportTypeEn: 'Quality Inspection Report'
      }
    };

    onAddModule(newModule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className={`w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden my-8 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              isLight ? 'bg-white border-slate-200 text-blue-600 shadow-xs' : 'bg-slate-900 border-slate-800 text-cyan-400'
            }`}>
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isTh ? 'ลงทะเบียนเพิ่มแอปย่อยใหม่ (+ Add Custom Sub-App)' : 'Register New Sub-App Module'}
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh ? 'เพิ่มเมนูระบบย่อยใหม่เข้าสู่พอร์ทัลตรวจคุณภาพส่วนกลาง' : 'Add custom QA sub-app into the central portal'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition ${
              isLight 
                ? 'text-slate-400 hover:text-slate-700 bg-white border-slate-200 hover:bg-slate-100' 
                : 'text-slate-400 hover:text-white bg-slate-800 border-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {isTh ? 'รหัสโมดูล (Module Code)' : 'Module Code'}
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., IPQA-08, IQA-04"
                className={`w-full px-3 py-2 text-xs rounded-lg border font-mono uppercase transition ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-600' : 'bg-slate-800 border-slate-700 text-slate-100'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {isTh ? 'หมวดหมู่ (Category)' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as QACategory)}
                className={`w-full px-3 py-2 text-xs rounded-lg border transition ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-600' : 'bg-slate-800 border-slate-700 text-slate-100'
                }`}
              >
                <option value="IQA">IQA - Incoming Quality</option>
                <option value="IPQA">IPQA - In-Process Quality</option>
                <option value="OQA">OQA - Outgoing Quality</option>
                <option value="EQUIPMENT">EQUIPMENT - Metrology & Calibration</option>
                <option value="NCR">NCR - Defect Management</option>
                <option value="ANALYTICS">ANALYTICS - Quality Dashboard</option>
                <option value="CERTIFICATE_COI">CERTIFICATE_COI - Mill Sheet</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {isTh ? 'ชื่อโมดูล (ภาษาไทย)' : 'Title (Thai)'}
              </label>
              <input
                type="text"
                required
                value={titleTh}
                onChange={(e) => setTitleTh(e.target.value)}
                placeholder="เช่น การตรวจสอบการเคลือบผิว..."
                className={`w-full px-3 py-2 text-xs rounded-lg border transition ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-600' : 'bg-slate-800 border-slate-700 text-slate-100'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {isTh ? 'ชื่อโมดูล (English)' : 'Title (English)'}
              </label>
              <input
                type="text"
                required
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g., Anodizing Layer Inspection..."
                className={`w-full px-3 py-2 text-xs rounded-lg border transition ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-600' : 'bg-slate-800 border-slate-700 text-slate-100'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {isTh ? 'คำอธิบาย (ภาษาไทย)' : 'Description (Thai)'}
            </label>
            <input
              type="text"
              value={descTh}
              onChange={(e) => setDescTh(e.target.value)}
              placeholder="อธิบายขั้นตอนการตรวจ หรือมาตรฐานที่ใช้อ้างอิง..."
              className={`w-full px-3 py-2 text-xs rounded-lg border transition ${
                isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-600' : 'bg-slate-800 border-slate-700 text-slate-100'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {isTh ? 'ฟีเจอร์สำคัญ (1 บรรทัดต่อ 1 ฟีเจอร์)' : 'Key Features (1 per line)'}
            </label>
            <textarea
              rows={3}
              value={keyFeaturesInput}
              onChange={(e) => setKeyFeaturesInput(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg border transition font-mono ${
                isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-600' : 'bg-slate-800 border-slate-700 text-slate-100'
              }`}
            />
          </div>

          <div className="pt-3 border-t flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {isTh ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm hover:shadow transition"
            >
              {isTh ? 'บันทึกและเพิ่มเข้า Portal' : 'Register Module'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
