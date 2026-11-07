import React, { useState } from 'react';
import { 
  Lock, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Calculator,
  Sliders
} from 'lucide-react';
import { BilletCuttingSpec, Language, ThemeMode } from '../../types';
import { ADMIN_PASSWORD, checkAdminPassword } from './mockBilletData';

interface BilletCuttingSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  specs: Record<string, BilletCuttingSpec>;
  onSaveSpecs: (newSpecs: Record<string, BilletCuttingSpec>) => void;
  language?: Language;
  theme?: ThemeMode;
}

export const BilletCuttingSpecModal: React.FC<BilletCuttingSpecModalProps> = ({
  isOpen,
  onClose,
  specs,
  onSaveSpecs,
  language = 'th',
  theme = 'light'
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';
  
  // Auth state - unlocked by default for instant access
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Spec editing state
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [billetGrade, setBilletGrade] = useState('6063');
  const [lengthNominal, setLengthNominal] = useState('500');
  const [lengthMin, setLengthMin] = useState('498.0');
  const [lengthMax, setLengthMax] = useState('502.0');
  const [diameterNominal, setDiameterNominal] = useState('127.0');
  const [diameterMin, setDiameterMin] = useState('125.5');
  const [diameterMax, setDiameterMax] = useState('128.5');
  const [cuttingSurfaceMax, setCuttingSurfaceMax] = useState('2.0');
  const [surfaceDefectSpecText, setSurfaceDefectSpecText] = useState('≤ 2x50x100 mm');
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-calculated Bending Max = lengthNominal * 0.15%
  const computedBendingMax = React.useMemo(() => {
    const len = parseFloat(lengthNominal);
    if (!isNaN(len) && len > 0) {
      return (len * 0.0015).toFixed(2);
    }
    return '0.75';
  }, [lengthNominal]);

  if (!isOpen) return null;

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAdminPassword(passwordInput)) {
      setIsAuthenticated(true);
      setAuthError(false);
      setPasswordInput('');
    } else {
      setAuthError(true);
    }
  };

  const startEdit = (key: string, spec: BilletCuttingSpec) => {
    setEditingKey(key);
    setIsAddingNew(false);
    setFormError(null);
    setConfirmDeleteKey(null);
    setName(spec.name || key);
    setBilletGrade(spec.billetGrade || '6063');
    setLengthNominal(spec.lengthNominal || '500');
    setLengthMin(spec.lengthMin || '498.0');
    setLengthMax(spec.lengthMax || '502.0');
    setDiameterNominal(spec.diameterNominal || '127.0');
    setDiameterMin(spec.diameterMin || '125.5');
    setDiameterMax(spec.diameterMax || '128.5');
    setCuttingSurfaceMax(spec.cuttingSurfaceMax || '2.0');
    setSurfaceDefectSpecText(spec.surfaceDefectSpecText || '≤ 2x50x100 mm');
    setRemarks(spec.remarks || '');
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setEditingKey(null);
    setFormError(null);
    setConfirmDeleteKey(null);
    setName('');
    setBilletGrade('6063');
    setLengthNominal('500');
    setLengthMin('498.0');
    setLengthMax('502.0');
    setDiameterNominal('127.0');
    setDiameterMin('125.5');
    setDiameterMax('128.5');
    setCuttingSurfaceMax('2.0');
    setSurfaceDefectSpecText('≤ 2x50x100 mm');
    setRemarks('');
  };

  const handleSaveSpec = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = name.trim().toUpperCase();
    if (!cleanKey) {
      setFormError(isTh ? 'กรุณากรอกชื่อผู้ขาย / ผู้ผลิต (Supplier Name)' : 'Please enter Supplier Name');
      return;
    }

    const newSpec: BilletCuttingSpec = {
      id: `spec-${Date.now()}`,
      name: cleanKey,
      billetGrade: billetGrade.trim(),
      lengthNominal,
      lengthMin,
      lengthMax,
      diameterNominal,
      diameterMin,
      diameterMax,
      bendingMax: computedBendingMax,
      cuttingSurfaceMax,
      surfaceDefectSpecText,
      remarks
    };

    const updated = { ...specs };
    if (editingKey && editingKey !== cleanKey) {
      delete updated[editingKey];
    }
    updated[cleanKey] = newSpec;
    onSaveSpecs(updated);
    setIsAddingNew(false);
    setEditingKey(null);
    setFormError(null);
    setToastMessage(isTh ? `บันทึก Supplier Spec "${cleanKey}" เรียบร้อยแล้ว` : `Supplier Spec "${cleanKey}" saved`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteSpec = (key: string) => {
    const updated = { ...specs };
    delete updated[key];
    onSaveSpecs(updated);
    if (editingKey === key) {
      setEditingKey(null);
    }
    setConfirmDeleteKey(null);
    setToastMessage(isTh ? `ลบ Supplier Spec "${key}" สำเร็จแล้ว` : `Supplier Spec "${key}" deleted successfully`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl rounded-3xl p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border ${
        isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-lg font-extrabold flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <span>{isTh ? 'จัดการมาตรฐาน Billet Cutting Spec (IPQA-08)' : 'Billet Cutting Spec Manager (IPQA-08)'}</span>
                {isAuthenticated && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                    isLight 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    <ShieldCheck className="w-3 h-3" />
                    <span>Admin Unlocked</span>
                  </span>
                )}
              </h3>
              <p className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {isTh 
                  ? 'กำหนดเกณฑ์มาตรฐาน Length, Diameter, Bending (Lx0.15%), Cutting Surface (<2mm) และ Surface Defect' 
                  : 'Configure standard specs for Length, Diameter, Bending, Cutting surface & Surface defect'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200' : 'text-slate-400 hover:text-white bg-slate-800/80'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{toastMessage}</span>
            </span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* AUTHENTICATION GATEWAY */}
        {!isAuthenticated ? (
          <div className={`p-8 rounded-3xl border text-center space-y-5 max-w-md mx-auto my-6 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto ${
              isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h4 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isTh ? 'ต้องใช้รหัสผ่านผู้ดูแลระบบ (Admin Required)' : 'Admin Password Required'}
              </h4>
              <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {isTh ? 'การตั้งค่าและแก้ไข Spec ต้องกรอกรหัสผ่าน admin2026' : 'Enter admin password (admin2026) to manage specs'}
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError(false);
                  }}
                  placeholder={isTh ? 'กรอกรหัสผ่านผู้ดูแลระบบ' : 'Enter admin password'}
                  className={`w-full rounded-2xl px-4 py-3 text-center text-lg font-mono font-bold focus:outline-none border ${
                    isLight 
                      ? 'bg-white border-slate-300 text-amber-900 focus:border-amber-600' 
                      : 'bg-slate-900 border-slate-800 text-amber-300 focus:border-amber-500'
                  }`}
                  autoFocus
                />
                {authError && (
                  <p className={`text-xs font-bold text-center mt-2 flex items-center justify-center gap-1 ${
                    isLight ? 'text-rose-700' : 'text-rose-400'
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง' : 'Incorrect password!'}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm py-3 rounded-2xl transition shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isTh ? 'ปลดล็อกการตั้งค่า Spec' : 'Unlock Spec Settings'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED SPEC CONTENT */
          <div className="space-y-6">
            {/* Top Toolbar */}
            {/* Top Toolbar */}
            <div className="flex items-center justify-between">
              <div className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {isTh ? `พบทั้งหมด ${Object.keys(specs).length} รายการเกณฑ์ Supplier` : `Total ${Object.keys(specs).length} Supplier Specs`}
              </div>
              <button
                onClick={startAddNew}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>{isTh ? 'เพิ่มเกณฑ์ Supplier Spec ใหม่' : 'Add New Supplier Spec'}</span>
              </button>
            </div>

            {/* Spec Form (Adding / Editing) */}
            {(isAddingNew || editingKey) && (
              <form onSubmit={handleSaveSpec} className={`p-5 rounded-2xl border space-y-4 shadow-xl ${
                isLight ? 'bg-slate-50 border-indigo-200' : 'bg-slate-950 border-indigo-500/40'
              }`}>
                <div className={`flex items-center justify-between pb-2 border-b ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isLight ? 'text-indigo-800' : 'text-indigo-400'
                  }`}>
                    <Edit3 className="w-4 h-4" />
                    <span>{isAddingNew ? (isTh ? 'สร้างเกณฑ์ Supplier Spec ใหม่' : 'Create New Supplier Spec') : (isTh ? `แก้ไข: ${editingKey}` : `Edit: ${editingKey}`)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => { setIsAddingNew(false); setEditingKey(null); setFormError(null); }}
                    className={`text-xs font-semibold ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                  >
                    {isTh ? 'ยกเลิก' : 'Cancel'}
                  </button>
                </div>

                {formError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className={`text-[10px] font-black uppercase block mb-1 ${
                      isLight ? 'text-black' : 'text-slate-400'
                    }`}>
                      {isTh ? 'ชื่อผู้ขาย / ผู้ผลิต (Supplier Name) *' : 'Supplier Name *'}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isTh ? 'เช่น ALCOA, CAPCO, THAI HONG ฯลฯ' : 'e.g. ALCOA, CAPCO, THAI HONG'}
                      className={`w-full rounded-xl px-3 py-2 font-mono font-bold focus:outline-none border-2 ${
                        isLight
                          ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:border-blue-700'
                          : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`text-[10px] font-black uppercase block mb-1 ${
                      isLight ? 'text-black' : 'text-slate-400'
                    }`}>
                      {isTh ? 'Billet Grade (พิมพ์เองได้) *' : 'Billet Grade (Type freely) *'}
                    </label>
                    <input
                      type="text"
                      list="spec-modal-billet-grades"
                      value={billetGrade}
                      onChange={(e) => setBilletGrade(e.target.value)}
                      placeholder={isTh ? 'เช่น 6063, 6061, 6082' : 'e.g. 6063, 6061'}
                      className={`w-full rounded-xl px-3 py-2 font-mono font-bold focus:outline-none border-2 ${
                        isLight
                          ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:border-blue-700'
                          : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                      }`}
                      required
                    />
                    <datalist id="spec-modal-billet-grades">
                      <option value="6063">6063 (Standard)</option>
                      <option value="6061">6061 (Structural)</option>
                      <option value="6082">6082 (High Strength)</option>
                      <option value="6005A">6005A (Medium Strength)</option>
                      <option value="6060">6060 (Architectural)</option>
                      <option value="1050">1050 (Pure Al)</option>
                      <option value="3003">3003 (Al-Mn)</option>
                      <option value="7075">7075 (Aerospace)</option>
                    </datalist>
                  </div>

                  <div>
                    <label className={`text-[10px] font-black uppercase block mb-1 ${
                      isLight ? 'text-black' : 'text-slate-400'
                    }`}>
                      {isTh ? 'Nominal Length (mm) *' : 'Nominal Length (mm) *'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={lengthNominal}
                      onChange={(e) => setLengthNominal(e.target.value)}
                      placeholder="500"
                      className={`w-full rounded-xl px-3 py-2 font-black focus:outline-none border-2 ${
                        isLight
                          ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:border-blue-700'
                          : 'bg-slate-900 border-slate-800 text-indigo-300 focus:border-indigo-500'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Length & Diameter Bounds */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Length Spec */}
                  <div className={`p-3.5 rounded-xl border-2 space-y-2 ${
                    isLight ? 'bg-white border-blue-200' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <span className={`text-[11px] font-black block ${
                      isLight ? 'text-black' : 'text-emerald-400'
                    }`}>
                      1. Length Spec (mm)
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className={`text-[9px] font-bold block ${isLight ? 'text-black' : 'text-slate-400'}`}>Min (mm)</span>
                        <input
                          type="number" step="0.1"
                          value={lengthMin}
                          onChange={(e) => setLengthMin(e.target.value)}
                          className={`w-full rounded-lg px-2.5 py-1.5 font-black border-2 ${
                            isLight
                              ? 'bg-white border-blue-600 text-black focus:border-blue-700'
                              : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <span className={`text-[9px] font-bold block ${isLight ? 'text-black' : 'text-slate-400'}`}>Max (mm)</span>
                        <input
                          type="number" step="0.1"
                          value={lengthMax}
                          onChange={(e) => setLengthMax(e.target.value)}
                          className={`w-full rounded-lg px-2.5 py-1.5 font-black border-2 ${
                            isLight
                              ? 'bg-white border-blue-600 text-black focus:border-blue-700'
                              : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Diameter Spec */}
                  <div className={`p-3.5 rounded-xl border-2 space-y-2 ${
                    isLight ? 'bg-white border-blue-200' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <span className={`text-[11px] font-black block ${
                      isLight ? 'text-black' : 'text-sky-400'
                    }`}>
                      2. Diameter Spec (mm)
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className={`text-[9px] font-bold block ${isLight ? 'text-black' : 'text-slate-400'}`}>Min (mm)</span>
                        <input
                          type="number" step="0.1"
                          value={diameterMin}
                          onChange={(e) => setDiameterMin(e.target.value)}
                          className={`w-full rounded-lg px-2.5 py-1.5 font-black border-2 ${
                            isLight
                              ? 'bg-white border-blue-600 text-black focus:border-blue-700'
                              : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <span className={`text-[9px] font-bold block ${isLight ? 'text-black' : 'text-slate-400'}`}>Max (mm)</span>
                        <input
                          type="number" step="0.1"
                          value={diameterMax}
                          onChange={(e) => setDiameterMax(e.target.value)}
                          className={`w-full rounded-lg px-2.5 py-1.5 font-black border-2 ${
                            isLight
                              ? 'bg-white border-blue-600 text-black focus:border-blue-700'
                              : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bending, Cutting Surface, Surface Defect */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border-2 ${
                    isLight ? 'bg-white border-blue-200' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <label className={`text-[10px] font-black uppercase flex items-center justify-between mb-1 ${
                      isLight ? 'text-black' : 'text-amber-400'
                    }`}>
                      <span>Bending Max</span>
                      <span className={`text-[8px] font-mono ${isLight ? 'text-black' : 'text-amber-500'}`}>(Lx0.15%)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={`${computedBendingMax} mm`}
                        className={`w-full rounded-lg px-2.5 py-1.5 font-mono font-black border-2 ${
                          isLight
                            ? 'bg-slate-50 border-blue-600 text-black'
                            : 'bg-slate-950 border-slate-800 text-amber-300'
                        }`}
                      />
                      <Calculator className={`w-4 h-4 shrink-0 ${isLight ? 'text-black' : 'text-amber-400'}`} />
                    </div>
                    <span className={`text-[9px] font-bold block mt-1 ${isLight ? 'text-black' : 'text-slate-500'}`}>Auto: {lengthNominal} × 0.15%</span>
                  </div>

                  <div className={`p-3 rounded-xl border-2 ${
                    isLight ? 'bg-white border-blue-200' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <label className={`text-[10px] font-black uppercase block mb-1 ${
                      isLight ? 'text-black' : 'text-pink-400'
                    }`}>
                      Cutting Surface Max (mm)
                    </label>
                    <input
                      type="number" step="0.1"
                      value={cuttingSurfaceMax}
                      onChange={(e) => setCuttingSurfaceMax(e.target.value)}
                      placeholder="2.0"
                      className={`w-full rounded-lg px-2.5 py-1.5 font-black border-2 ${
                        isLight
                          ? 'bg-white border-blue-600 text-black focus:border-blue-700'
                          : 'bg-slate-950 border-slate-800 text-pink-300'
                      }`}
                      required
                    />
                    <span className={`text-[9px] font-bold block mt-1 ${isLight ? 'text-black' : 'text-slate-500'}`}>{isTh ? 'เกณฑ์มาตรฐาน < 2.0 mm' : 'Standard < 2.0 mm'}</span>
                  </div>

                  <div className={`p-3 rounded-xl border-2 ${
                    isLight ? 'bg-white border-blue-200' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <label className={`text-[10px] font-black uppercase block mb-1 ${
                      isLight ? 'text-black' : 'text-purple-400'
                    }`}>
                      Surface Defect Spec
                    </label>
                    <input
                      type="text"
                      value={surfaceDefectSpecText}
                      onChange={(e) => setSurfaceDefectSpecText(e.target.value)}
                      placeholder="≤ 2x50x100 mm"
                      className={`w-full rounded-lg px-2.5 py-1.5 font-bold border-2 ${
                        isLight
                          ? 'bg-white border-blue-600 text-black focus:border-blue-700'
                          : 'bg-slate-950 border-slate-800 text-purple-300'
                      }`}
                    />
                    <span className={`text-[9px] font-bold block mt-1 ${isLight ? 'text-black' : 'text-slate-500'}`}>{isTh ? 'ลึก ≤2, กว้าง ≤50, ยาว ≤100' : 'Depth ≤2, W ≤50, L ≤100'}</span>
                  </div>
                </div>

                {/* Remarks & Submit Button */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={isTh ? 'หมายเหตุเพิ่มเติม (ถ้ามี)' : 'Additional remarks'}
                    className={`w-full rounded-xl px-3 py-2 text-xs border-2 font-bold ${
                      isLight
                        ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:border-blue-700'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isTh ? 'บันทึกเกณฑ์ Supplier Spec' : 'Save Supplier Spec'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Spec Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(specs) as [string, BilletCuttingSpec][]).map(([key, spec]) => (
                <div
                  key={key}
                  className={`p-4 rounded-2xl border transition space-y-3 relative group ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 hover:border-indigo-300 shadow-sm' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {isTh ? 'Supplier:' : 'Supplier:'}
                        </span>
                        <span className={`text-sm font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {spec.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isLight 
                            ? 'bg-indigo-100 text-indigo-900 border-indigo-200' 
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}>
                          Grade: {spec.billetGrade}
                        </span>
                      </div>
                      {spec.remarks && (
                        <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>{spec.remarks}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(key, spec)}
                        className={`p-1.5 rounded-lg border transition ${
                          isLight 
                            ? 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-300' 
                            : 'bg-slate-900 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border-slate-800'
                        }`}
                        title="Edit Spec"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {confirmDeleteKey === key ? (
                        <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-700/80 px-2 py-1 rounded-xl shadow-lg animate-fade-in">
                          <span className="text-[10px] text-rose-200 font-bold">{isTh ? 'ยืนยันลบ?' : 'Delete?'}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSpec(key)}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition shadow-xs"
                          >
                            {isTh ? 'ลบ' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteKey(null)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-medium transition"
                          >
                            {isTh ? 'ยกเลิก' : 'Cancel'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteKey(key)}
                          className={`p-1.5 rounded-lg border transition ${
                            isLight
                              ? 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border-slate-300'
                              : 'bg-slate-900 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 border-slate-800'
                          }`}
                          title="Delete Spec"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t font-mono text-[11px] ${
                    isLight ? 'border-slate-200' : 'border-slate-900'
                  }`}>
                    <div className={`p-2 rounded-xl ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-900'}`}>
                      <span className={`text-[9px] block ${isLight ? 'text-slate-600 font-bold' : 'text-slate-500'}`}>Length (mm)</span>
                      <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{spec.lengthMin}-{spec.lengthMax}</span>
                    </div>
                    <div className={`p-2 rounded-xl ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-900'}`}>
                      <span className={`text-[9px] block ${isLight ? 'text-slate-600 font-bold' : 'text-slate-500'}`}>Diameter (mm)</span>
                      <span className={`font-bold ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>{spec.diameterMin}-{spec.diameterMax}</span>
                    </div>
                    <div className={`p-2 rounded-xl ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-900'}`}>
                      <span className={`text-[9px] block ${isLight ? 'text-slate-600 font-bold' : 'text-slate-500'}`}>Bending Max</span>
                      <span className={`font-bold ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>≤{spec.bendingMax || (parseFloat(spec.lengthNominal || '500')*0.0015).toFixed(2)}</span>
                    </div>
                    <div className={`p-2 rounded-xl ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-900'}`}>
                      <span className={`text-[9px] block ${isLight ? 'text-slate-600 font-bold' : 'text-slate-500'}`}>Cutting Surface</span>
                      <span className={`font-bold ${isLight ? 'text-rose-700' : 'text-pink-400'}`}>&lt;{spec.cuttingSurfaceMax} mm</span>
                    </div>
                  </div>

                  <div className={`text-[10px] flex items-center justify-between pt-1 ${
                    isLight ? 'text-slate-700' : 'text-slate-500'
                  }`}>
                    <span>Defect Spec: <strong className={isLight ? 'text-purple-800' : 'text-purple-300'}>{spec.surfaceDefectSpecText || '≤ 2x50x100 mm'}</strong></span>
                    <span>Nominal L: {spec.lengthNominal || '500'} mm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
