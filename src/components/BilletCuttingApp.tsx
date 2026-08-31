import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sliders, 
  BarChart3, 
  History, 
  RefreshCw, 
  RotateCcw,
  Info,
  Calendar,
  Layers,
  Ruler,
  CheckCheck,
  Zap,
  HelpCircle,
  Copy,
  ChevronRight
} from 'lucide-react';
import { 
  BilletCuttingRecord, 
  BilletCuttingSpec, 
  BilletCuttingMeasurementItem, 
  BilletCuttingHeader,
  Language, 
  ThemeMode 
} from '../types';
import { INITIAL_BILLET_SPECS, INITIAL_BILLET_RECORDS, ADMIN_PASSWORD } from './billetCutting/mockBilletData';
import { BilletCuttingSpecModal } from './billetCutting/BilletCuttingSpecModal';
import { BilletCuttingDashboard } from './billetCutting/BilletCuttingDashboard';
import { BilletCuttingHistory } from './billetCutting/BilletCuttingHistory';
import { useCloudState } from '../services/firestoreSync';

interface BilletCuttingAppProps {
  onBack: () => void;
  language?: Language;
  theme?: ThemeMode;
  userRole?: string;
  userName?: string;
}

export const BilletCuttingApp: React.FC<BilletCuttingAppProps> = ({
  onBack,
  language = 'th',
  theme = 'light',
  userRole = 'Inspector',
  userName = 'Somchai Prasert'
}) => {
  const isTh = language === 'th';

  // Active Tab: 'ENTRY' (บันทึก), 'DASHBOARD' (แดชบอร์ด), 'HISTORY' (ประวัติ)
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'DASHBOARD' | 'HISTORY'>('ENTRY');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Spec Manager Modal State
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);

  // Specs & Records State synced to Firebase Cloud Firestore
  const [specs, setSpecs] = useCloudState<Record<string, BilletCuttingSpec>>('ipqa08_billet_specs', INITIAL_BILLET_SPECS);
  const [records, setRecords] = useCloudState<BilletCuttingRecord[]>('ipqa08_billet_records', INITIAL_BILLET_RECORDS);

  // Selected Profile Spec (Empty by default for fresh key-in)
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const activeSpec = selectedProfileId ? specs[selectedProfileId] || null : null;

  // Form State: 1.1 Header (Blank by default for fresh key-in)
  const [header, setHeader] = useState<BilletCuttingHeader>({
    inspectorName: '',
    shift: '',
    cuttingLength: '',
    lotNo: '',
    date: new Date().toISOString().slice(0, 10),
    machine: '',
    specProfileId: ''
  });

  // Form State: 1.2 Cutting Measurement Items (Blank by default for fresh key-in)
  const createDefaultItem = (grade = activeSpec?.billetGrade || '', len = header.cuttingLength): BilletCuttingMeasurementItem => {
    const nominalL = parseFloat(len) || 0;
    const calcBending = nominalL > 0 ? (nominalL * 0.0015).toFixed(2) : '0.00'; // Auto calculate length * 0.15%

    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      billetGrade: grade,
      heatNo: '',
      supplier: '',
      qty: '',
      length: '',
      diameter: '',
      bending: '',
      bendingLimit: calcBending,
      cuttingSurface: '',
      surfaceDefect: '',
      heatIdentify: 'OK',
      appearance: 'OK',
      judgement: 'PASS',
      remarks: ''
    };
  };

  const [items, setItems] = useState<BilletCuttingMeasurementItem[]>([
    createDefaultItem('', '')
  ]);

  // Update cuttingLength when profile changes
  const handleProfileChange = (profileKey: string) => {
    setSelectedProfileId(profileKey);
    if (!profileKey) {
      setHeader(prev => ({
        ...prev,
        specProfileId: '',
        cuttingLength: ''
      }));
      return;
    }
    const spec = specs[profileKey];
    if (spec) {
      const newLen = spec.lengthNominal || header.cuttingLength;
      setHeader(prev => ({
        ...prev,
        specProfileId: profileKey,
        cuttingLength: newLen
      }));

      // Update default limits on existing items
      setItems(prev => prev.map(item => {
        const itemLen = parseFloat(item.length) || parseFloat(newLen) || 0;
        const newLimit = itemLen > 0 ? (itemLen * 0.0015).toFixed(2) : '0.00';
        return {
          ...item,
          billetGrade: spec.billetGrade || item.billetGrade,
          bendingLimit: newLimit
        };
      }));
    }
  };

  // Item Validation Helper
  const validateItem = (item: BilletCuttingMeasurementItem): {
    isLengthValid: boolean;
    isDiameterValid: boolean;
    isBendingValid: boolean;
    isSurfaceValid: boolean;
    isPass: boolean;
    isFilled: boolean;
    reason?: string;
  } => {
    const lMin = activeSpec ? parseFloat(activeSpec.lengthMin) : 0;
    const lMax = activeSpec ? parseFloat(activeSpec.lengthMax) : 999999;
    const dMin = activeSpec ? parseFloat(activeSpec.diameterMin) : 0;
    const dMax = activeSpec ? parseFloat(activeSpec.diameterMax) : 999999;
    const surfMax = activeSpec ? parseFloat(activeSpec.cuttingSurfaceMax) : 2.0;

    const lVal = parseFloat(item.length);
    const dVal = parseFloat(item.diameter);
    const bVal = parseFloat(item.bending);
    const sVal = parseFloat(item.cuttingSurface);

    const isLengthFilled = item.length !== '' && !isNaN(lVal);
    const isDiameterFilled = item.diameter !== '' && !isNaN(dVal);
    const isBendingFilled = item.bending !== '' && !isNaN(bVal);
    const isSurfaceFilled = item.cuttingSurface !== '' && !isNaN(sVal);

    const isLengthValid = !isLengthFilled || (lVal >= lMin && lVal <= lMax);
    const isDiameterValid = !isDiameterFilled || (dVal >= dMin && dVal <= dMax);

    // Bending limit: item.length * 0.15%
    const targetLen = !isNaN(lVal) ? lVal : (parseFloat(header.cuttingLength) || 0);
    const calcLimit = targetLen * 0.0015;
    const isBendingValid = !isBendingFilled || (calcLimit > 0 ? bVal <= calcLimit : true);

    // Cutting surface < 2.0 mm (or spec max)
    const isSurfaceValid = !isSurfaceFilled || (sVal <= surfMax);

    const hasFailedDimension = 
      (isLengthFilled && !isLengthValid) ||
      (isDiameterFilled && !isDiameterValid) ||
      (isBendingFilled && !isBendingValid) ||
      (isSurfaceFilled && !isSurfaceValid) ||
      item.heatIdentify === 'NG' ||
      item.appearance === 'NG';

    const isPass = !hasFailedDimension;
    const isFilled = isLengthFilled && isDiameterFilled && isBendingFilled && isSurfaceFilled && !!item.heatNo && !!item.supplier && !!item.qty;

    return {
      isLengthValid,
      isDiameterValid,
      isBendingValid,
      isSurfaceValid,
      isPass,
      isFilled
    };
  };

  // Modify Item Row
  const handleItemChange = (index: number, field: keyof BilletCuttingMeasurementItem, value: any) => {
    const updated = [...items];
    const target = { ...updated[index], [field]: value };

    // Auto calculate Bending Limit if length changes
    if (field === 'length') {
      const lenNum = parseFloat(value);
      if (!isNaN(lenNum) && lenNum > 0) {
        target.bendingLimit = (lenNum * 0.0015).toFixed(2);
      }
    }

    // Auto compute Judgement
    const val = validateItem(target);
    target.judgement = val.isPass ? 'PASS' : 'FAIL';

    updated[index] = target;
    setItems(updated);
  };

  // Add Item Row
  const addItemRow = () => {
    setItems(prev => [...prev, createDefaultItem(activeSpec?.billetGrade || '', header.cuttingLength)]);
  };

  // Reset / Clear Entry Table & Header
  const handleResetForm = () => {
    setSelectedProfileId('');
    setHeader({
      inspectorName: '',
      shift: '',
      cuttingLength: '',
      lotNo: '',
      date: new Date().toISOString().slice(0, 10),
      machine: '',
      specProfileId: ''
    });
    setItems([createDefaultItem('', '')]);
    setToastMessage(isTh ? 'ล้างข้อมูลส่วนหัวและตารางเรียบร้อยแล้ว พร้อมสำหรับกรอกข้อมูลชุดใหม่' : 'Form cleared, ready for new entry');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Duplicate Row
  const duplicateItemRow = (index: number) => {
    const target = items[index];
    const clone: BilletCuttingMeasurementItem = {
      ...target,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      heatNo: ''
    };
    setItems(prev => [...prev, clone]);
  };

  // Remove Item Row
  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      setItems([createDefaultItem(activeSpec?.billetGrade || '', header.cuttingLength)]);
      setToastMessage(isTh ? 'ล้างแถวเป็นค่าว่างเรียบร้อยแล้ว' : 'Row reset to blank');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Summary Totals
  const formSummary = React.useMemo(() => {
    let totalQty = 0;
    let passedQty = 0;
    let defectQty = 0;
    let overallPass = true;

    items.forEach(item => {
      const q = typeof item.qty === 'number' ? item.qty : parseInt(String(item.qty)) || 0;
      totalQty += q;
      if (item.judgement === 'PASS') {
        passedQty += q;
      } else {
        defectQty += q;
        overallPass = false;
      }
    });

    return { totalQty, passedQty, defectQty, overallPass };
  }, [items]);

  // Save New Inspection Record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProfileId) {
      alert(isTh ? 'กรุณาเลือก Profile Spec ก่อนบันทึกข้อมูล' : 'Please select a Profile Spec before saving');
      return;
    }
    if (!header.inspectorName.trim()) {
      alert(isTh ? 'กรุณากรอกชื่อผู้ตรวจสอบ (Inspector Name)' : 'Please enter Inspector Name');
      return;
    }
    if (!header.shift) {
      alert(isTh ? 'กรุณาเลือกกะการทำงาน (Shift)' : 'Please select Shift');
      return;
    }
    if (!header.cuttingLength.trim()) {
      alert(isTh ? 'กรุณาระบุความยาวตัดเป้าหมาย (Cutting Length mm)' : 'Please enter Target Cutting Length');
      return;
    }
    if (!header.lotNo.trim()) {
      alert(isTh ? 'กรุณากรอกหมายเลข Lot No.' : 'Please enter Lot No.');
      return;
    }

    // Check that all measurement rows are filled
    const incompleteIndex = items.findIndex(
      item => !item.heatNo.trim() || !item.supplier.trim() || item.qty === '' || item.length === '' || item.diameter === '' || item.bending === '' || item.cuttingSurface === ''
    );

    if (incompleteIndex !== -1) {
      alert(
        isTh 
          ? `กรุณากรอกข้อมูลการตรวจวัดในแถวที่ ${incompleteIndex + 1} ให้ครบถ้วนทุกช่อง (Heat No, Supplier, Q'ty, Length, Diameter, Bending, Cut Surface)` 
          : `Please fill in all measurement fields for row #${incompleteIndex + 1}`
      );
      return;
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRecord: BilletCuttingRecord = {
      id: `BC-${now.getFullYear()}-${String(records.length + 1).padStart(4, '0')}`,
      docId: `doc-bc-${Date.now()}`,
      timestamp: timeStr,
      timestampRaw: now.toISOString(),
      header: { ...header },
      items: [...items],
      totalQty: formSummary.totalQty,
      passedQty: formSummary.passedQty,
      defectQty: formSummary.defectQty,
      overallJudgement: formSummary.overallPass ? 'PASS' : 'FAIL',
      createdAt: now.toISOString()
    };

    setRecords(prev => [newRecord, ...prev]);

    setToastMessage(
      isTh
        ? `บันทึกข้อมูลการตัดท่อนบิลเล็ตสำเร็จ! (Record ID: ${newRecord.id})`
        : `Billet cutting record saved successfully! (ID: ${newRecord.id})`
    );
    setTimeout(() => setToastMessage(null), 4000);

    // Reset Form for next fresh key-in
    setSelectedProfileId('');
    setHeader({
      inspectorName: '',
      shift: '',
      cuttingLength: '',
      lotNo: '',
      date: new Date().toISOString().slice(0, 10),
      machine: '',
      specProfileId: ''
    });

    // Reset table to fresh blank row
    setItems([createDefaultItem('', '')]);

    // Switch to history tab
    setActiveTab('HISTORY');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-indigo-500 selection:text-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[160] bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm"
              title={isTh ? 'กลับสู่หน้าหลัก QA Portal' : 'Back to Portal'}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-white tracking-wide">
                    IPQA-08: Billet Cutting
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold font-mono">
                    PROD v2.0
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {isTh ? 'ระบบตรวจสอบและบันทึกการตัดท่อนบิลเล็ตตามเกณฑ์มาตรฐาน' : 'Billet Cutting Quality Inspection & Spec Management System'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Tabs & Spec Profile Trigger */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('ENTRY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ENTRY'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>{isTh ? '1. บันทึกผลการตัด' : '1. Cutting Entry'}</span>
            </button>

            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'DASHBOARD'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isTh ? '2. แดชบอร์ดสรุปผล' : '2. Dashboard'}</span>
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'HISTORY'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{isTh ? '3. ประวัติ & Export' : '3. History & Export'}</span>
            </button>

            <button
              onClick={() => setIsSpecModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5 shrink-0 ml-1"
              title="Admin Spec Manager"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isTh ? 'Billet Spec' : 'Spec Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: RECORD ENTRY */}
        {activeTab === 'ENTRY' && (
          <form onSubmit={handleSaveRecord} className="space-y-6">
            {/* Section 1: Spec Profile & Header Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      {isTh ? '1.1 ข้อมูลส่วนหัว & เลือก Profile Spec' : '1.1 Header Information & Spec Profile'}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {isTh ? 'เลือกมาตรฐาน Spec เพื่อโหลดเกณฑ์ความยาว, เส้นผ่านศูนย์กลาง และคำนวณการโก่งงออัตโนมัติ' : 'Select Spec profile to auto-calculate Bending limit & tolerances'}
                    </p>
                  </div>
                </div>

                {/* Profile Spec Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">{isTh ? 'Profile Spec:' : 'Spec:'}</span>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-400"
                  >
                    <option value="">{isTh ? '-- กรุณาเลือก Profile Spec --' : '-- Select Spec Profile --'}</option>
                    {Object.keys(specs).map(key => (
                      <option key={key} value={key}>{key} ({specs[key].billetGrade})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Spec Criteria Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Length Spec</span>
                  <span className="text-emerald-400 font-bold">
                    {activeSpec ? `${activeSpec.lengthMin} - ${activeSpec.lengthMax} mm` : '— mm'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Diameter Spec</span>
                  <span className="text-sky-400 font-bold">
                    {activeSpec ? `${activeSpec.diameterMin} - ${activeSpec.diameterMax} mm` : '— mm'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-500 uppercase block">Bending Max (Lx0.15%)</span>
                  <span className="text-amber-400 font-bold">
                    {activeSpec ? `≤ ${activeSpec.bendingMax || (parseFloat(activeSpec.lengthNominal || '500') * 0.0015).toFixed(2)} mm` : '— mm'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-pink-500 uppercase block">Cutting Surface Max</span>
                  <span className="text-pink-400 font-bold">
                    {activeSpec ? `< ${activeSpec.cuttingSurfaceMax || '2.0'} mm` : '< 2.0 mm'}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-purple-500 uppercase block">Surface Defect Limit</span>
                  <span className="text-purple-300 font-bold">
                    {activeSpec ? (activeSpec.surfaceDefectSpecText || '≤ 2x50x100 mm') : '≤ 2x50x100 mm'}
                  </span>
                </div>
              </div>

              {/* Header Input Fields: Inspector name, Shift, Cutting length, Lot no. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {isTh ? 'ชื่อผู้ตรวจสอบ (Inspector Name) *' : 'Inspector Name *'}
                  </label>
                  <input
                    type="text"
                    value={header.inspectorName}
                    onChange={(e) => setHeader({ ...header, inspectorName: e.target.value })}
                    placeholder={isTh ? 'กรอกชื่อผู้ตรวจสอบ' : 'Enter inspector name'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 font-bold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {isTh ? 'กะการทำงาน (Shift) *' : 'Shift *'}
                  </label>
                  <select
                    value={header.shift}
                    onChange={(e) => setHeader({ ...header, shift: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">{isTh ? '-- เลือกกะการทำงาน (Shift) --' : '-- Select Shift --'}</option>
                    <option value="Shift A (เช้า)">Shift A (เช้า 08:00 - 16:00)</option>
                    <option value="Shift B (บ่าย)">Shift B (บ่าย 16:00 - 24:00)</option>
                    <option value="Shift C (ดึก)">Shift C (ดึก 24:00 - 08:00)</option>
                    <option value="Day Shift">Day Shift (กะกลางวัน)</option>
                    <option value="Night Shift">Night Shift (กะกลางคืน)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {isTh ? 'ความยาวตัดเป้าหมาย (Cutting Length mm) *' : 'Target Cutting Length (mm) *'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={header.cuttingLength}
                    onChange={(e) => {
                      const len = e.target.value;
                      setHeader({ ...header, cuttingLength: len });
                      // Update bending limits
                      const lenNum = parseFloat(len);
                      if (!isNaN(lenNum)) {
                        const newLimit = (lenNum * 0.0015).toFixed(2);
                        setItems(prev => prev.map(item => ({ ...item, bendingLimit: newLimit })));
                      }
                    }}
                    placeholder={isTh ? 'ระบุความยาวเป้าหมาย (เช่น 500)' : 'e.g. 500'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-pink-300 placeholder:text-slate-600 font-bold focus:outline-none focus:border-pink-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {isTh ? 'หมายเลขลอต (Lot No.) *' : 'Lot No. *'}
                  </label>
                  <input
                    type="text"
                    value={header.lotNo}
                    onChange={(e) => setHeader({ ...header, lotNo: e.target.value })}
                    placeholder={isTh ? 'ระบุหมายเลข Lot No.' : 'e.g. LOT-BC-260831-01'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 placeholder:text-slate-600 font-bold font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Cutting Measurement Entry Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-pink-500/10 text-pink-400 rounded-xl border border-pink-500/20">
                    <Ruler className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      {isTh ? '1.2 ตารางบันทึกการวัดค่า (Cutting Measurement Entry)' : '1.2 Cutting Measurement Data Table'}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {isTh 
                        ? 'Billet grade, Heat no, Supplier, Q\'ty, Length, Diameter, Bending (Lx0.15%), Cutting surface <2mm, Defect 2x50x100mm, Heat ID, Appearance, Judgement' 
                        : 'Record dimensions, auto Bending calc (Lx0.15%), tolerance checks & judgement'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700/80 shadow-sm"
                    title={isTh ? 'ล้างข้อมูลตารางเป็นค่าว่าง' : 'Clear table'}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isTh ? 'ล้างข้อมูล' : 'Clear Form'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isTh ? 'เพิ่มแถวตรวจ' : 'Add Row'}</span>
                  </button>
                </div>
              </div>

              {/* Items Entry Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 w-28">{isTh ? 'Billet Grade *' : 'Grade *'}</th>
                      <th className="p-3 w-28">{isTh ? 'Heat No *' : 'Heat No *'}</th>
                      <th className="p-3 w-36">{isTh ? 'Supplier *' : 'Supplier *'}</th>
                      <th className="p-3 w-20 text-center">{isTh ? 'Q\'ty (Pcs) *' : 'Q\'ty *'}</th>
                      <th className="p-3 w-28 text-center">{isTh ? 'Length (mm) *' : 'Length *'}</th>
                      <th className="p-3 w-28 text-center">{isTh ? 'Diameter (mm) *' : 'Diameter *'}</th>
                      <th className="p-3 w-32 text-center">{isTh ? 'Bending (Lx0.15%) *' : 'Bending *'}</th>
                      <th className="p-3 w-28 text-center">{isTh ? 'Cut Surface (<2mm) *' : 'Cut Surface *'}</th>
                      <th className="p-3 w-36">{isTh ? 'Surface Defect' : 'Defect (2x50x100)'}</th>
                      <th className="p-3 w-20 text-center">{isTh ? 'Heat ID' : 'Heat ID'}</th>
                      <th className="p-3 w-20 text-center">{isTh ? 'Appearance' : 'Appear'}</th>
                      <th className="p-3 w-24 text-center">{isTh ? 'Judgement' : 'Judgement'}</th>
                      <th className="p-3 w-16 text-center">{isTh ? 'Action' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {items.map((item, index) => {
                      const val = validateItem(item);
                      const targetLen = parseFloat(item.length || header.cuttingLength || '500');
                      const computedBendingLimit = (targetLen * 0.0015).toFixed(2);

                      const isLengthFilled = item.length !== '' && !isNaN(parseFloat(item.length));
                      const isLengthOutOfSpec = isLengthFilled && !val.isLengthValid;

                      const isDiameterFilled = item.diameter !== '' && !isNaN(parseFloat(item.diameter));
                      const isDiameterOutOfSpec = isDiameterFilled && !val.isDiameterValid;

                      const isBendingFilled = item.bending !== '' && !isNaN(parseFloat(item.bending));
                      const isBendingOutOfSpec = isBendingFilled && !val.isBendingValid;

                      const isSurfaceFilled = item.cuttingSurface !== '' && !isNaN(parseFloat(item.cuttingSurface));
                      const isSurfaceOutOfSpec = isSurfaceFilled && !val.isSurfaceValid;

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition">
                          {/* Row index */}
                          <td className="p-2 text-center text-slate-500 font-bold">
                            {index + 1}
                          </td>

                          {/* Billet Grade */}
                          <td className="p-1.5">
                            <select
                              value={item.billetGrade}
                              onChange={(e) => handleItemChange(index, 'billetGrade', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                            >
                              <option value="6063">6063</option>
                              <option value="6061">6061</option>
                              <option value="6082">6082</option>
                              <option value="1050">1050</option>
                              <option value="3003">3003</option>
                              <option value="6005A">6005A</option>
                            </select>
                          </td>

                          {/* Heat No */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.heatNo}
                              onChange={(e) => handleItemChange(index, 'heatNo', e.target.value)}
                              placeholder="HT-XXXXX"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 font-bold focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </td>

                          {/* Supplier */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.supplier}
                              onChange={(e) => handleItemChange(index, 'supplier', e.target.value)}
                              placeholder="Supplier Name"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 font-sans focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </td>

                          {/* Q'ty (Pcs) */}
                          <td className="p-1.5">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleItemChange(index, 'qty', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center text-white placeholder:text-slate-600 font-bold focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </td>

                          {/* Length (mm) */}
                          <td className="p-1.5">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                value={item.length}
                                onChange={(e) => handleItemChange(index, 'length', e.target.value)}
                                placeholder="500.0"
                                className={`w-full bg-slate-950 border rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none placeholder:text-slate-600 ${
                                  !isLengthFilled
                                    ? 'border-slate-800 text-slate-100 focus:border-indigo-500'
                                    : isLengthOutOfSpec
                                      ? 'border-rose-500 text-rose-400 bg-rose-950/20 focus:border-rose-500'
                                      : 'border-emerald-500/50 text-emerald-400 bg-emerald-950/10 focus:border-emerald-500'
                                }`}
                                required
                              />
                            </div>
                          </td>

                          {/* Diameter (mm) */}
                          <td className="p-1.5">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                value={item.diameter}
                                onChange={(e) => handleItemChange(index, 'diameter', e.target.value)}
                                placeholder="127.0"
                                className={`w-full bg-slate-950 border rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none placeholder:text-slate-600 ${
                                  !isDiameterFilled
                                    ? 'border-slate-800 text-slate-100 focus:border-indigo-500'
                                    : isDiameterOutOfSpec
                                      ? 'border-rose-500 text-rose-400 bg-rose-950/20 focus:border-rose-500'
                                      : 'border-sky-500/50 text-sky-400 bg-sky-950/10 focus:border-sky-500'
                                }`}
                                required
                              />
                            </div>
                          </td>

                          {/* Bending (Lx0.15%) Auto calculated limit */}
                          <td className="p-1.5">
                            <div className="space-y-0.5">
                              <input
                                type="number"
                                step="0.01"
                                value={item.bending}
                                onChange={(e) => handleItemChange(index, 'bending', e.target.value)}
                                placeholder="0.50"
                                className={`w-full bg-slate-950 border rounded-lg px-2 py-1 text-xs text-center font-bold focus:outline-none placeholder:text-slate-600 ${
                                  !isBendingFilled
                                    ? 'border-slate-800 text-slate-100 focus:border-indigo-500'
                                    : isBendingOutOfSpec
                                      ? 'border-rose-500 text-rose-400 bg-rose-950/20 focus:border-rose-500'
                                      : 'border-amber-500/50 text-amber-300 bg-amber-950/10 focus:border-amber-500'
                                }`}
                                required
                              />
                              <div className="text-[9px] text-center text-slate-500">
                                max ≤ <strong className="text-amber-400">{computedBendingLimit}</strong>
                              </div>
                            </div>
                          </td>

                          {/* Cutting Surface (< 2mm) */}
                          <td className="p-1.5">
                            <input
                              type="number"
                              step="0.1"
                              value={item.cuttingSurface}
                              onChange={(e) => handleItemChange(index, 'cuttingSurface', e.target.value)}
                              placeholder="1.2"
                              className={`w-full bg-slate-950 border rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none placeholder:text-slate-600 ${
                                !isSurfaceFilled
                                  ? 'border-slate-800 text-slate-100 focus:border-indigo-500'
                                  : isSurfaceOutOfSpec
                                    ? 'border-rose-500 text-rose-400 bg-rose-950/20 focus:border-rose-500'
                                    : 'border-pink-500/50 text-pink-400 bg-pink-950/10 focus:border-pink-500'
                              }`}
                              required
                            />
                          </td>

                          {/* Surface Defect (2x50x100 mm) */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.surfaceDefect}
                              onChange={(e) => handleItemChange(index, 'surfaceDefect', e.target.value)}
                              placeholder="Normal / None"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-purple-300 placeholder:text-slate-600 font-sans focus:outline-none focus:border-purple-500"
                            />
                          </td>

                          {/* Heat Identify */}
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleItemChange(index, 'heatIdentify', item.heatIdentify === 'OK' ? 'NG' : 'OK')}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                item.heatIdentify === 'OK'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {item.heatIdentify}
                            </button>
                          </td>

                          {/* Appearance */}
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleItemChange(index, 'appearance', item.appearance === 'OK' ? 'NG' : 'OK')}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                item.appearance === 'OK'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {item.appearance}
                            </button>
                          </td>

                          {/* Judgement */}
                          <td className="p-1.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                              val.isPass
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {val.isPass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>{val.isPass ? 'PASS' : 'FAIL'}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => duplicateItemRow(index)}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition"
                                title="Duplicate Row"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItemRow(index)}
                                className="p-1 bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 rounded transition"
                                title="Delete Row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Summary Bar & Save Button */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div className="text-slate-400">
                    {isTh ? 'จำนวนท่อนทั้งหมด:' : 'Total Q\'ty:'} <strong className="text-white text-sm">{formSummary.totalQty} Pcs</strong>
                  </div>
                  <div className="text-emerald-400">
                    {isTh ? 'ผ่านเกณฑ์:' : 'Passed:'} <strong className="text-emerald-300 text-sm">{formSummary.passedQty} Pcs</strong>
                  </div>
                  <div className="text-rose-400">
                    {isTh ? 'งานเสีย:' : 'Defects:'} <strong className="text-rose-300 text-sm">{formSummary.defectQty} Pcs</strong>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-slate-400">{isTh ? 'สรุปรวมผลตรวจ:' : 'Overall Status:'}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      formSummary.overallPass 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {formSummary.overallPass ? 'PASS (ผ่าน)' : 'FAIL (มีงานเสีย)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isTh ? 'บันทึกข้อมูลการตรวจตัด (Save Record)' : 'Save Inspection Record'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
          <BilletCuttingDashboard
            records={records}
            language={language}
          />
        )}

        {/* TAB 3: HISTORY & EXPORT */}
        {activeTab === 'HISTORY' && (
          <BilletCuttingHistory
            records={records}
            onUpdateRecords={setRecords}
            language={language}
          />
        )}
      </div>

      {/* SPEC PROFILE MANAGER MODAL (Admin password protected) */}
      <BilletCuttingSpecModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
        specs={specs}
        onSaveSpecs={setSpecs}
        language={language}
      />
    </div>
  );
};
