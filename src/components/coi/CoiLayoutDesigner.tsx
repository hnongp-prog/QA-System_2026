import React, { useState } from 'react';
import {
  Sliders,
  Building2,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  Link,
  Layers,
  Edit3,
  Sparkles,
  Info,
  Check,
  FileCheck,
  Trash2,
  Copy
} from 'lucide-react';
import { CoiCustomerTemplate, CoiDataSourceModule } from '../../types';
import { CoiCadSchematic } from './CoiCadSchematic';

interface CoiLayoutDesignerProps {
  templates: CoiCustomerTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onSaveTemplate: (template: CoiCustomerTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onResetDefaults: () => void;
  language?: 'th' | 'en';
}

export const CoiLayoutDesigner: React.FC<CoiLayoutDesignerProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  onResetDefaults,
  language = 'th'
}) => {
  const isTh = language === 'th';
  const current = templates.find(t => t.id === selectedTemplateId) || templates[0];
  const [formTemplate, setFormTemplate] = useState<CoiCustomerTemplate>(current);
  const [activeSectionEdit, setActiveSectionEdit] = useState<string | null>(null);
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');

  // Sync state if selected template changes
  React.useEffect(() => {
    const found = templates.find(t => t.id === selectedTemplateId) || templates[0];
    if (found) {
      setFormTemplate(found);
      setIsSavedRecently(false);
    }
  }, [selectedTemplateId, templates]);

  const handleSave = () => {
    onSaveTemplate(formTemplate);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  const handleCloneCustomer = () => {
    const clonedId = `cust-${Date.now()}`;
    const cloned: CoiCustomerTemplate = {
      ...formTemplate,
      id: clonedId,
      customerId: `CUST-${Date.now().toString().slice(-4)}`,
      customerName: `${formTemplate.customerName} (Copy)`,
      updatedAt: new Date().toISOString()
    };
    onSaveTemplate(cloned);
    onSelectTemplate(clonedId);
  };

  const handleCreateCustomer = () => {
    if (!newCustomerName.trim()) return;
    const newId = `cust-${Date.now()}`;
    const created: CoiCustomerTemplate = {
      ...formTemplate,
      id: newId,
      customerId: `CUST-${newCustomerName.trim().toUpperCase().replace(/\s+/g, '-')}`,
      customerName: newCustomerName.trim(),
      updatedAt: new Date().toISOString()
    };
    onSaveTemplate(created);
    onSelectTemplate(newId);
    setNewCustomerName('');
    setShowAddCustomerModal(false);
  };

  const renderLinkBadge = (module: CoiDataSourceModule) => {
    const colorMap: Record<string, string> = {
      'IQA-01': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'IPQA-01': 'bg-blue-100 text-blue-800 border-blue-300',
      'IPQA-02': 'bg-cyan-100 text-cyan-800 border-cyan-300',
      'IPQA-03': 'bg-amber-100 text-amber-800 border-amber-300',
      'IPQA-04': 'bg-purple-100 text-purple-800 border-purple-300',
      'IPQA-05': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'IPQA-07': 'bg-rose-100 text-rose-800 border-rose-300',
      'OQA-01': 'bg-teal-100 text-teal-800 border-teal-300',
      'MANUAL': 'bg-slate-100 text-slate-800 border-slate-300'
    };
    return (
      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${colorMap[module] || 'bg-slate-100'}`}>
        <Link className="w-2.5 h-2.5" />
        {module}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Customer Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase">
            <Sliders className="w-4 h-4" />
            {isTh ? 'แท็บ 1: ออกแบบตำแหน่งค่าในใบรับรอง (COI Layout Designer)' : 'Tab 1: COI Layout & Spec Position Designer'}
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {isTh ? 'ออกแบบผังใบรับรอง COI แยกตามรายลูกค้า' : 'Customer-Specific COI Layout & Data Link Architecture'}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {isTh
              ? 'กำหนดตำแหน่งการวางค่า Spec และผูก Data Link ดึงค่าอัตโนมัติจาก IQA และ IPQA ตามแม่แบบมาตรฐาน'
              : 'Configure exact cell layout, spec limits, and link data sources from IQA and IPQA modules.'}
          </p>
        </div>

        {/* Action Buttons & Customer Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Customer Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg">
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <select
              value={formTemplate.id}
              onChange={e => onSelectTemplate(e.target.value)}
              className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer pr-4"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  🏢 {t.customerName} ({t.partNumber})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            {isTh ? 'เพิ่มลูกค้าใหม่' : 'New Customer'}
          </button>

          <button
            onClick={handleCloneCustomer}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
            title="Duplicate template"
          >
            <Copy className="w-3.5 h-3.5 text-blue-400" />
            {isTh ? 'คัดลอกแม่แบบ' : 'Clone'}
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg shadow-lg transition ${
              isSavedRecently
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold'
            }`}
          >
            {isSavedRecently ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isSavedRecently ? (isTh ? 'บันทึกสำเร็จ!' : 'Saved!') : (isTh ? 'บันทึกผังเลย์เอาต์' : 'Save Layout')}
          </button>
        </div>
      </div>

      {/* Quick Customer Profile Meta Editor */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
            {isTh ? 'ข้อมูลทั่วไปของลูกค้าและชิ้นงาน (Header Metadata)' : 'Customer & Part Specifications'}
          </span>
          <span className="text-[11px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
            ID: {formTemplate.customerId}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'ชื่อลูกค้า (Customer)' : 'Customer Name'}</label>
            <input
              type="text"
              value={formTemplate.customerName}
              onChange={e => setFormTemplate({ ...formTemplate, customerName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'รหัสชิ้นส่วน (Part Number)' : 'Part Number'}</label>
            <input
              type="text"
              value={formTemplate.partNumber}
              onChange={e => setFormTemplate({ ...formTemplate, partNumber: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'ชื่อสินค้า (Product Name)' : 'Product Name'}</label>
            <input
              type="text"
              value={formTemplate.productName}
              onChange={e => setFormTemplate({ ...formTemplate, productName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'มาตรฐานอ้างอิง (Standard / Rev)' : 'Standard / Revision'}</label>
            <input
              type="text"
              value={formTemplate.standardRef}
              onChange={e => setFormTemplate({ ...formTemplate, standardRef: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'เกรดวัสดุ (Heat / Material Code)' : 'Material Code'}</label>
            <input
              type="text"
              value={formTemplate.heatNoMaterialCode}
              onChange={e => setFormTemplate({ ...formTemplate, heatNoMaterialCode: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'แบบสั่งผลิต (Drawing No. / Rev)' : 'Drawing / Revision'}</label>
            <input
              type="text"
              value={formTemplate.drawingNoRevision}
              onChange={e => setFormTemplate({ ...formTemplate, drawingNoRevision: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'ความยาวตัดมาตรฐาน (Default Length)' : 'Default Cut Length'}</label>
            <input
              type="text"
              value={formTemplate.defaultLength}
              onChange={e => setFormTemplate({ ...formTemplate, defaultLength: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'ประเภทการเคลือบ (Coating Type)' : 'Coating Type'}</label>
            <input
              type="text"
              value={formTemplate.coatingType}
              onChange={e => setFormTemplate({ ...formTemplate, coatingType: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Visual WYSIWYG Layout Sheet (Mirroring Attached Document) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-cyan-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded">WYSIWYG</span>
            <h3 className="text-base font-bold text-white">
              {isTh ? 'ผังตำแหน่งตารางและเกณฑ์ตรวจสอบ (Visual Document Layout & Data Link Map)' : 'Certificate Layout Sheet & Data Link Configuration'}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>IQA (Spectrometry)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>IPQA (In-Process)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>IPQA-07 (Multi-Port Wall)</span>
            </div>
          </div>
        </div>

        {/* Paper Simulation Canvas (White Background Standard Table) */}
        <div className="bg-white text-slate-900 p-4 sm:p-6 rounded-lg shadow-inner border border-slate-300 font-sans text-xs overflow-x-auto">
          {/* 1. Header Block */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2 mb-3">
            <div>
              <h1 className="text-2xl font-black tracking-wider text-slate-900">CERTIFICATE OF INSPECTION</h1>
              <div className="text-[10px] text-slate-500 font-bold mt-0.5">CUSTOMER COI LAYOUT SPECIFICATION</div>
            </div>
            <div className="text-right text-[11px] font-bold">
              <div>{formTemplate.companyNameHeader}</div>
              <div className="text-slate-600 font-normal">{formTemplate.sectionNameHeader}</div>
              <div className="text-slate-500 text-[10px]">Issue Date: [Auto Generated at Issue]</div>
            </div>
          </div>

          {/* 2. Customer & Product Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-3 bg-slate-50 p-2.5 rounded border border-slate-300">
            <div className="space-y-1">
              <div><span className="font-bold text-slate-700">Customer : </span> <span className="font-black text-blue-900">{formTemplate.customerName}</span></div>
              <div><span className="font-bold text-slate-700">Part number : </span> <span className="font-mono font-bold text-slate-800">{formTemplate.partNumber}</span></div>
              <div><span className="font-bold text-slate-700">Invoice : </span> <span className="text-slate-500 font-mono">[Dynamic Invoice No.]</span></div>
            </div>
            <div className="space-y-1">
              <div><span className="font-bold text-slate-700">Product : </span> <span className="font-bold text-slate-800">{formTemplate.productName}</span></div>
              <div><span className="font-bold text-slate-700">Standard : </span> <span className="font-mono text-slate-800">{formTemplate.standardRef}</span></div>
            </div>
          </div>

          {/* 3. Work Order & General Summary Table */}
          <div className="border border-slate-900 mb-3 overflow-hidden">
            <div className="bg-slate-100 px-2 py-1 flex items-center justify-between border-b border-slate-900 font-bold text-[10px]">
              <span>WORK ORDER & SUMMARY ROW</span>
              <div className="flex gap-1.5">{renderLinkBadge('IPQA-05')}{renderLinkBadge('OQA-01')}</div>
            </div>
            <table className="w-full text-center text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-slate-900 p-1 w-20">Work No.</th>
                  <th className="border border-slate-900 p-1 w-24">Coil No.</th>
                  <th className="border border-slate-900 p-1">Drawing No. / Rev.</th>
                  <th className="border border-slate-900 p-1 w-20">Length</th>
                  <th className="border border-slate-900 p-1">Coating Type</th>
                  <th className="border border-slate-900 p-1">Cut End</th>
                  <th className="border border-slate-900 p-1 w-16">Dimension</th>
                  <th className="border border-slate-900 p-1 w-16">Coating</th>
                  <th className="border border-slate-900 p-1 w-16">Appearance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-900 p-1 bg-amber-50 font-mono">[Auto]</td>
                  <td className="border border-slate-900 p-1 bg-amber-50 font-mono">[Input]</td>
                  <td className="border border-slate-900 p-1 font-mono">{formTemplate.drawingNoRevision}</td>
                  <td className="border border-slate-900 p-1 font-mono">{formTemplate.defaultLength}</td>
                  <td className="border border-slate-900 p-1">{formTemplate.coatingType}</td>
                  <td className="border border-slate-900 p-1">{formTemplate.cutEndType}</td>
                  <td className="border border-slate-900 p-1 font-bold text-emerald-700 bg-emerald-50">OK</td>
                  <td className="border border-slate-900 p-1 font-bold text-emerald-700 bg-emerald-50">OK</td>
                  <td className="border border-slate-900 p-1 font-bold text-emerald-700 bg-emerald-50">OK</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Chemical Composition Table (Linked to IQA-01) */}
          <div className="border border-slate-900 mb-3">
            <div className="bg-slate-100 px-2 py-1 flex items-center justify-between border-b border-slate-900 font-bold text-[10px]">
              <span>CHEMICAL COMPOSITION (wt%) — ELEMENT SPEC LIMITS</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-600 font-normal">Optical Emission Spectrometry</span>
                {renderLinkBadge(formTemplate.chemicalSpecs.si.linkSource || 'IQA-01')}
              </div>
            </div>
            <table className="w-full text-center text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-slate-900 p-1 w-24">Heat No. / Material</th>
                  <th className="border border-slate-900 p-1 w-14">Type</th>
                  <th className="border border-slate-900 p-1">Si</th>
                  <th className="border border-slate-900 p-1">Fe</th>
                  <th className="border border-slate-900 p-1">Cu</th>
                  <th className="border border-slate-900 p-1">Mn</th>
                  <th className="border border-slate-900 p-1">Mg</th>
                  <th className="border border-slate-900 p-1">Cr</th>
                  <th className="border border-slate-900 p-1">Zn</th>
                  <th className="border border-slate-900 p-1">Ti</th>
                  <th className="border border-slate-900 p-1">Other Each</th>
                  <th className="border border-slate-900 p-1">Other Total</th>
                  <th className="border border-slate-900 p-1">Al remain</th>
                </tr>
              </thead>
              <tbody>
                {/* Spec Min */}
                <tr>
                  <td rowSpan={2} className="border border-slate-900 p-1 font-bold bg-slate-50 font-mono">
                    {formTemplate.heatNoMaterialCode}
                  </td>
                  <td className="border border-slate-900 p-0.5 font-bold bg-slate-50">Min</td>
                  <td className="border border-slate-900 p-0.5">-</td>
                  <td className="border border-slate-900 p-0.5">-</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-blue-900">{formTemplate.chemicalSpecs.cu.min?.toFixed(2) || '0.40'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-blue-900">{formTemplate.chemicalSpecs.mn.min?.toFixed(2) || '0.10'}</td>
                  <td className="border border-slate-900 p-0.5">-</td>
                  <td className="border border-slate-900 p-0.5">-</td>
                  <td className="border border-slate-900 p-0.5">-</td>
                  <td className="border border-slate-900 p-0.5">-</td>
                  <td className="border border-slate-900 p-0.5">-</td>
                  <td className="border border-slate-900 p-0.5">-</td>
                  <td rowSpan={3} className="border border-slate-900 p-1 bg-slate-50 font-bold">
                    {formTemplate.chemicalSpecs.alRemain.text}
                  </td>
                </tr>
                {/* Spec Max */}
                <tr>
                  <td className="border border-slate-900 p-0.5 font-bold bg-slate-50">Max</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-blue-900">{formTemplate.chemicalSpecs.si.max?.toFixed(2) || '0.15'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-blue-900">{formTemplate.chemicalSpecs.fe.max?.toFixed(2) || '0.20'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-blue-900">{formTemplate.chemicalSpecs.cu.max?.toFixed(2) || '0.55'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-blue-900">{formTemplate.chemicalSpecs.mn.max?.toFixed(2) || '0.20'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-blue-900">{formTemplate.chemicalSpecs.mg.max?.toFixed(2) || '0.03'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-blue-900">{formTemplate.chemicalSpecs.cr.max?.toFixed(2) || '0.05'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-blue-900">{formTemplate.chemicalSpecs.zn.max?.toFixed(2) || '0.04'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-blue-900">{formTemplate.chemicalSpecs.ti.max?.toFixed(2) || '0.03'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-blue-900">{formTemplate.chemicalSpecs.otherEach.max?.toFixed(2) || '0.05'}</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-blue-900">{formTemplate.chemicalSpecs.otherTotal.max?.toFixed(2) || '0.15'}</td>
                </tr>
                {/* Record Row Link */}
                <tr className="bg-amber-50/60 font-mono">
                  <td className="border border-slate-900 p-1 font-bold text-slate-700">Record</td>
                  <td className="border border-slate-900 p-0.5 text-slate-500">Actual</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800 font-bold">0.08</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800 font-bold">0.12</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800 font-bold">0.48</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800 font-bold">0.14</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800 font-bold">0.01</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800 font-bold">0.01</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800 font-bold">0.02</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800 font-bold">0.01</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800 font-bold">0.02</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800 font-bold">0.06</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. Mechanical Properties & Surface Roughness Table */}
          <div className="border border-slate-900 mb-3">
            <div className="bg-slate-100 px-2 py-1 flex items-center justify-between border-b border-slate-900 font-bold text-[10px]">
              <span>MECHANICAL PROPERTIES & SURFACE ROUGHNESS</span>
              <div className="flex gap-1.5">
                {renderLinkBadge('IPQA-01')}
                {renderLinkBadge('IPQA-02')}
              </div>
            </div>
            <table className="w-full text-center text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th colSpan={4} className="border border-slate-900 p-1">Mechanical Properties</th>
                  <th rowSpan={2} className="border border-slate-900 p-1 w-28">Eddy Current Test</th>
                  <th colSpan={3} className="border border-slate-900 p-1">Surface Roughness (Before Zn) Rz (µm)</th>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-slate-900 p-1">Tensile strength (N/mm²)</th>
                  <th className="border border-slate-900 p-1">Yield Stress (N/mm²)</th>
                  <th className="border border-slate-900 p-1">Elongation (%)</th>
                  <th className="border border-slate-900 p-1 w-14">Spec Type</th>
                  <th className="border border-slate-900 p-1 w-10">POS</th>
                  <th className="border border-slate-900 p-1">Top</th>
                  <th className="border border-slate-900 p-1">Bottom</th>
                </tr>
              </thead>
              <tbody>
                {/* Spec Row */}
                <tr>
                  <td className="border border-slate-900 p-1 font-bold text-blue-900">{formTemplate.mechanicalSpecs.tensileMin.toFixed(1)}</td>
                  <td className="border border-slate-900 p-1 font-bold text-blue-900">{formTemplate.mechanicalSpecs.yieldMin.toFixed(1)}</td>
                  <td className="border border-slate-900 p-1 font-bold text-blue-900">{formTemplate.mechanicalSpecs.elongationMin.toFixed(1)}</td>
                  <td className="border border-slate-900 p-1 bg-slate-50 font-bold">Min</td>
                  <td rowSpan={2} className="border border-slate-900 p-1 font-bold text-emerald-800 bg-emerald-50">
                    {formTemplate.mechanicalSpecs.eddyCurrentTest}
                  </td>
                  <td rowSpan={2} className="border border-slate-900 p-1 bg-slate-50 font-bold">H</td>
                  <td className="border border-slate-900 p-1 font-bold text-blue-900">≤ {formTemplate.mechanicalSpecs.roughnessRzTopMax} µm</td>
                  <td className="border border-slate-900 p-1 font-bold text-blue-900">≤ {formTemplate.mechanicalSpecs.roughnessRzBottomMax} µm</td>
                </tr>
                {/* Record Row */}
                <tr className="bg-amber-50/60 font-mono">
                  <td className="border border-slate-900 p-1 text-emerald-800 font-bold">104.5</td>
                  <td className="border border-slate-900 p-1 text-emerald-800 font-bold">34.2</td>
                  <td className="border border-slate-900 p-1 text-emerald-800 font-bold">15.8</td>
                  <td className="border border-slate-900 p-1 text-slate-700 font-bold">Record</td>
                  <td className="border border-slate-900 p-1 text-emerald-800 font-bold">8.4</td>
                  <td className="border border-slate-900 p-1 text-emerald-800 font-bold">7.9</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 6. Zn Spray Coating & Flux Coating Table */}
          <div className="border border-slate-900 mb-3">
            <div className="bg-slate-100 px-2 py-1 flex items-center justify-between border-b border-slate-900 font-bold text-[10px]">
              <span>COATING SPECIFICATIONS (ZN SPRAY & FLUX COATING)</span>
              <div className="flex gap-1.5">
                {renderLinkBadge('IPQA-03')}
                {renderLinkBadge('IPQA-04')}
              </div>
            </div>
            <table className="w-full text-center text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th colSpan={5} className="border border-slate-900 p-1">Zn Spray Coating</th>
                  <th colSpan={6} className="border border-slate-900 p-1">Flux Coating</th>
                </tr>
                <tr className="bg-slate-50 font-bold text-[9px]">
                  <th rowSpan={2} className="border border-slate-900 p-1 w-20">Zn spray date</th>
                  <th rowSpan={2} className="border border-slate-900 p-1 w-8">POS</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">Zn adhesion weight: {formTemplate.coatingSpecs.znAdhesionWeightSpec}</th>
                  <th className="border border-slate-900 p-0.5">Zn area: {formTemplate.coatingSpecs.znAreaRatioSpec}</th>
                  <th rowSpan={2} className="border border-slate-900 p-1 w-24">{formTemplate.coatingSpecs.fluxLotMaterial}</th>
                  <th rowSpan={2} className="border border-slate-900 p-1 w-20">Coating Date</th>
                  <th rowSpan={2} className="border border-slate-900 p-1 w-8">POS</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">Flux weight: {formTemplate.coatingSpecs.fluxAdhesionWeightSpec}</th>
                  <th className="border border-slate-900 p-0.5">Adhesion: {formTemplate.coatingSpecs.coatingAdhesionSpec}</th>
                </tr>
                <tr className="bg-slate-50 text-[8.5px]">
                  <th className="border border-slate-900 p-0.5">Top</th>
                  <th className="border border-slate-900 p-0.5">Bottom</th>
                  <th className="border border-slate-900 p-0.5">Top / Bottom</th>
                  <th className="border border-slate-900 p-0.5">Top</th>
                  <th className="border border-slate-900 p-0.5">Bottom</th>
                  <th className="border border-slate-900 p-0.5">Top / Bottom</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr>
                  <td rowSpan={2} className="border border-slate-900 p-1 bg-slate-50 text-[9px]">[Auto Date]</td>
                  <td className="border border-slate-900 p-1 font-bold bg-slate-50">H</td>
                  <td className="border border-slate-900 p-1 text-emerald-800">11.8</td>
                  <td className="border border-slate-900 p-1 text-emerald-800">11.4</td>
                  <td className="border border-slate-900 p-1 text-emerald-800">68.5%</td>
                  <td rowSpan={2} className="border border-slate-900 p-1 bg-slate-50 text-[9px]">LOT-FLX-2608</td>
                  <td rowSpan={2} className="border border-slate-900 p-1 bg-slate-50 text-[9px]">[Auto Date]</td>
                  <td className="border border-slate-900 p-1 font-bold bg-slate-50">H</td>
                  <td className="border border-slate-900 p-1 text-emerald-800">5.2</td>
                  <td className="border border-slate-900 p-1 text-emerald-800">4.9</td>
                  <td className="border border-slate-900 p-1 font-bold text-emerald-800">OK / OK</td>
                </tr>
                <tr>
                  <td className="border border-slate-900 p-1 font-bold bg-slate-50">T</td>
                  <td className="border border-slate-900 p-1 text-emerald-800">11.6</td>
                  <td className="border border-slate-900 p-1 text-emerald-800">11.2</td>
                  <td className="border border-slate-900 p-1 text-emerald-800">67.8%</td>
                  <td className="border border-slate-900 p-1 font-bold bg-slate-50">T</td>
                  <td className="border border-slate-900 p-1 text-emerald-800">5.1</td>
                  <td className="border border-slate-900 p-1 text-emerald-800">4.8</td>
                  <td className="border border-slate-900 p-1 font-bold text-emerald-800">OK / OK</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 7. Microchannel Multi-Port Web Thickness Table */}
          <div className="border border-slate-900 mb-3">
            <div className="bg-slate-100 px-2 py-1 flex items-center justify-between border-b border-slate-900 font-bold text-[10px]">
              <span>MULTI-PORT WEB THICKNESSES (mm) — 12 SLOTS HEAD/TAIL</span>
              <div className="flex gap-1.5">{renderLinkBadge('IPQA-07')}</div>
            </div>
            <table className="w-full text-center text-[9px] border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th rowSpan={3} className="border border-slate-900 p-1 w-6">POS</th>
                  <th colSpan={2} className="border border-slate-900 p-1">Outer web thickness: {formTemplate.webThicknessSpecs.outerWebT1Spec}</th>
                  <th colSpan={2} className="border border-slate-900 p-1">Side web thickness: {formTemplate.webThicknessSpecs.sideWebT3Spec}</th>
                  <th colSpan={12} className="border border-slate-900 p-1">Inner web thickness: {formTemplate.webThicknessSpecs.innerWebSpec}</th>
                </tr>
                <tr className="bg-slate-50 font-bold text-[8.5px]">
                  <th className="border border-slate-900 p-0.5">T1 min-max</th>
                  <th className="border border-slate-900 p-0.5">T2 min-max</th>
                  <th className="border border-slate-900 p-0.5">T3</th>
                  <th className="border border-slate-900 p-0.5">T4</th>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <th key={i} className="border border-slate-900 p-0.5 w-6">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono text-[8.5px]">
                <tr>
                  <td className="border border-slate-900 p-1 font-bold bg-slate-50">H</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.228</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.231</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.622</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.618</td>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <td key={i} className="border border-slate-900 p-0.5 text-emerald-800">
                      {(0.248 + (i % 5) * 0.002).toFixed(3)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-slate-900 p-1 font-bold bg-slate-50">T</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.226</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.229</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.620</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.615</td>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <td key={i} className="border border-slate-900 p-0.5 text-emerald-800">
                      {(0.247 + (i % 4) * 0.002).toFixed(3)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* 8. Geometry & Form Deviation (Length, Port Open, Width, Height, Warp, Curved, Twist, Undulation, Burr) */}
          <div className="border border-slate-900 mb-3">
            <div className="bg-slate-100 px-2 py-1 flex items-center justify-between border-b border-slate-900 font-bold text-[10px]">
              <span>TUBE DIMENSIONS & GEOMETRIC FORM DEVIATIONS</span>
              <div className="flex gap-1.5">{renderLinkBadge('IPQA-05')}</div>
            </div>
            <table className="w-full text-center text-[9px] border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-[8.5px]">
                  <th rowSpan={2} className="border border-slate-900 p-1 w-6">POS</th>
                  <th rowSpan={2} className="border border-slate-900 p-1 w-14">Length (mm)</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">Port open area: {formTemplate.geometrySpecs.portOpenAreaSpec}</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">Width: {formTemplate.geometrySpecs.widthAt5mmSpec}</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">Height: {formTemplate.geometrySpecs.heightAt5mmSpec}</th>
                  <th className="border border-slate-900 p-0.5">Warp (mm) ≤ {formTemplate.geometrySpecs.warpMaxMm}</th>
                  <th className="border border-slate-900 p-0.5">Curved (mm) {formTemplate.geometrySpecs.curvedMinMm} ~ {formTemplate.geometrySpecs.curvedMaxMm}</th>
                  <th className="border border-slate-900 p-0.5">Twist (mm) ≤ {formTemplate.geometrySpecs.twistMaxMm}</th>
                  <th className="border border-slate-900 p-0.5">Undulation (mm) ≤ {formTemplate.geometrySpecs.undulationMaxMm}</th>
                  <th colSpan={2} className="border border-slate-900 p-0.5">Cut End Burr Free</th>
                </tr>
                <tr className="bg-slate-50 text-[8px]">
                  <th className="border border-slate-900 p-0.5">Left</th>
                  <th className="border border-slate-900 p-0.5">Right</th>
                  <th className="border border-slate-900 p-0.5">Left</th>
                  <th className="border border-slate-900 p-0.5">Right</th>
                  <th className="border border-slate-900 p-0.5">Left</th>
                  <th className="border border-slate-900 p-0.5">Right</th>
                  <th className="border border-slate-900 p-0.5">反り</th>
                  <th className="border border-slate-900 p-0.5">湾曲</th>
                  <th className="border border-slate-900 p-0.5">捩り</th>
                  <th className="border border-slate-900 p-0.5">うねり</th>
                  <th className="border border-slate-900 p-0.5">Left</th>
                  <th className="border border-slate-900 p-0.5">Right</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[8.5px]">
                <tr>
                  <td className="border border-slate-900 p-1 font-bold bg-slate-50">H</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-slate-800">{formTemplate.defaultLength}</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">7.24</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">7.18</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">14.81</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">14.79</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">1.738</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">1.742</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.42</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">-0.15</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.65</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.08</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-emerald-800">OK</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-emerald-800">OK</td>
                </tr>
                <tr>
                  <td className="border border-slate-900 p-1 font-bold bg-slate-50">T</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-slate-800">{formTemplate.defaultLength}</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">7.21</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">7.15</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">14.80</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">14.82</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">1.740</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">1.739</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.38</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">-0.12</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.58</td>
                  <td className="border border-slate-900 p-0.5 text-emerald-800">0.07</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-emerald-800">OK</td>
                  <td className="border border-slate-900 p-0.5 font-bold text-emerald-800">OK</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 9. CAD Schematic Diagram & Tolerance Sketches */}
          <CoiCadSchematic />

          {/* 10. Footer Section with QA Sign-off */}
          <div className="mt-3 pt-2 border-t border-slate-300 flex justify-between items-end text-[10px]">
            <div className="text-slate-600">
              <div className="font-bold text-slate-800">UACJ Extrusion (Thailand)Co.,Ltd. Prachinburi Plant</div>
              <div>532 Moo.7 Thatoom Sud-District, Srimahaphot District, Prachinburi 25140</div>
              <div>Tel : 037-278-741,42  Fax : 037-278-743</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-800">Quality Assurance Manager</div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">{formTemplate.documentControlNo}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add New Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              {isTh ? 'เพิ่มแม่แบบลูกค้าใหม่' : 'Add New Customer Template'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {isTh
                ? 'ระบบจะสร้างผัง COI เริ่มต้นสำหรับลูกค้านี้ โดยสามารถปรับแต่งค่า Spec ได้ในภายหลัง'
                : 'A new layout will be generated for this customer based on industrial standards.'}
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isTh ? 'ชื่อบริษัทลูกค้า (Customer Name)' : 'Customer Name'}</label>
              <input
                type="text"
                placeholder="e.g. MAZDA AUTOMOTIVE THAILAND"
                value={newCustomerName}
                onChange={e => setNewCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                {isTh ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateCustomer}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition shadow-lg"
              >
                {isTh ? 'สร้างแม่แบบ' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
