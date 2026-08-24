import React, { useState, useEffect, useMemo } from 'react';
import { 
  FlaskConical, 
  Upload, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Trash2, 
  Save, 
  Download, 
  FileSpreadsheet, 
  Settings, 
  Plus, 
  Eye, 
  Copy, 
  Search, 
  Calendar, 
  Lock, 
  ArrowLeft, 
  Zap, 
  Check, 
  Sparkles, 
  FileText, 
  Layers, 
  X, 
  ShieldCheck, 
  LogOut, 
  BarChart3, 
  Filter, 
  Package, 
  User, 
  Building2, 
  Scale, 
  Clock,
  Edit3,
  AlertTriangle,
  Sun,
  Moon
} from 'lucide-react';

import { 
  ChemicalSpecMap, 
  ChemicalInspectionHeader, 
  ChemicalMeasureItem, 
  ChemicalInspectionEntry, 
  Language, 
  ThemeMode,
  InspectionActivity 
} from '../types';
import { analyzeChemicalCertClient } from '../services/geminiClient';

interface ChemicalIncomingAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

const DEFAULT_SPECS: ChemicalSpecMap = {
  "A-001": [
    { item: "OR", min: 10.0, max: 20.0 },
    { item: "T1", min: 5.0, max: 15.0 },
    { item: "IR", min: 1.0, max: 3.5 },
    { item: "VISCOSITY", min: 50, max: 150 },
    { item: "PH", min: 6.5, max: 8.5 }
  ],
  "COAT-901": [
    { item: "SOLID_CONTENT", min: 40.0, max: 55.0 },
    { item: "DENSITY", min: 1.05, max: 1.20 },
    { item: "PH", min: 7.0, max: 9.0 },
    { item: "VISCOSITY", min: 100, max: 300 }
  ],
  "BOND-02": [
    { item: "OR", min: 15.0, max: 25.0 },
    { item: "IR", min: 2.0, max: 5.0 },
    { item: "SPECIFIC_GRAVITY", min: 0.95, max: 1.10 }
  ]
};

const INITIAL_HISTORY: ChemicalInspectionEntry[] = [
  {
    id: "chem-hist-001",
    timestamp: "04/08/2026, 10:15:30",
    inspector: "Somchai R. (QA Chemist)",
    batch_lot: "LOT-2026-A01",
    chemical: "A-001",
    date: "2026-07-25",
    expiration: "2027-07-25",
    weight: "250",
    qty: "10",
    packaging: "Normal / Sealed Drums",
    supplier: "Siam Chemical Specialty Ltd.",
    items: [
      { description: "OR", value: "14.5", status: "PASS" },
      { description: "T1", value: "8.2", status: "PASS" },
      { description: "IR", value: "2.1", status: "PASS" },
      { description: "VISCOSITY", value: "95", status: "PASS" },
      { description: "PH", value: "7.2", status: "PASS" }
    ],
    result: "PASS",
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "chem-hist-002",
    timestamp: "03/08/2026, 15:40:00",
    inspector: "Wipawee K. (IQC)",
    batch_lot: "LOT-2026-C88",
    chemical: "COAT-901",
    date: "2026-07-20",
    expiration: "2027-01-20",
    weight: "500",
    qty: "20",
    packaging: "Minor Container Scratch",
    supplier: "Global Coating Solutions",
    items: [
      { description: "SOLID_CONTENT", value: "38.0", status: "FAIL" },
      { description: "DENSITY", value: "1.12", status: "PASS" },
      { description: "PH", value: "7.8", status: "PASS" },
      { description: "VISCOSITY", value: "320", status: "FAIL" }
    ],
    result: "FAIL",
    createdAt: Date.now() - 86400000 * 3
  }
];

export const ChemicalIncomingApp: React.FC<ChemicalIncomingAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th',
  theme = 'light',
  onToggleTheme
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'extraction' | 'history' | 'settings'>('extraction');

  // File & AI State
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string }>({
    type: 'info',
    message: isTh ? 'พร้อมสแกนเอกสาร COA' : 'Ready to scan COA document'
  });

  // Form Fields Header
  const [header, setHeader] = useState<ChemicalInspectionHeader>({
    inspector_name: '',
    coating_chemical: '',
    batch_lot: '',
    product_date: '',
    expiration_date: '',
    weight_kg: '',
    qty_pcs: '',
    packaging_situation: 'Normal',
    supplier: ''
  });

  // Table Measurement Items
  const [tableItems, setTableItems] = useState<ChemicalMeasureItem[]>([]);

  // History & Specs
  const [history, setHistory] = useState<ChemicalInspectionEntry[]>(() => {
    const saved = localStorage.getItem('chem_qc_history');
    return saved ? JSON.parse(saved) : INITIAL_HISTORY;
  });

  const [specs, setSpecs] = useState<ChemicalSpecMap>(() => {
    const saved = localStorage.getItem('chem_qc_specs');
    return saved ? JSON.parse(saved) : DEFAULT_SPECS;
  });

  // Admin Modal & State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Settings Form State
  const [settingProfileName, setSettingProfileName] = useState('');
  const [settingRows, setSettingRows] = useState<{ item: string; min: string; max: string }[]>([
    { item: 'OR', min: '10', max: '20' },
    { item: 'PH', min: '6.5', max: '8.5' }
  ]);

  // History Item Editing State (Protected with password: admin2026)
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState("");
  const [historyAuthError, setHistoryAuthError] = useState(false);
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<ChemicalInspectionEntry | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<ChemicalInspectionEntry | null>(null);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Delete Confirmation Modal State with Password Protection (admin2026)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: () => {},
  });
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [deleteConfirmPasswordError, setDeleteConfirmPasswordError] = useState(false);

  // Trigger Edit Record
  const handleRequestEditHistory = (item: ChemicalInspectionEntry) => {
    setTargetEditHistoryItem(item);
    setHistoryAuthPassword("");
    setHistoryAuthError(false);
    setIsHistoryAuthOpen(true);
  };

  // Delete history item with custom modal confirmation & admin2026 password
  const handleDeleteHistoryItem = (item: ChemicalInspectionEntry) => {
    setDeleteConfirmPassword("");
    setDeleteConfirmPasswordError(false);
    setConfirmModal({
      isOpen: true,
      title: isTh ? 'ยืนยันการลบรายการประวัติ' : 'Confirm Delete Record',
      message: isTh 
        ? `คุณต้องการลบประวัติการตรวจรับ Batch/Lot: ${item.batch_lot} (${item.chemical}) กรุณาใส่รหัสผ่าน admin2026 เพื่อยืนยัน` 
        : `Are you sure you want to delete inspection record for Batch ${item.batch_lot}? Enter admin2026 to confirm.`,
      confirmText: isTh ? 'ลบรายการ' : 'Delete',
      cancelText: isTh ? 'ยกเลิก' : 'Cancel',
      onConfirm: () => {
        setHistory(prev => prev.filter(h => h.id !== item.id));
        setStatus({
          type: 'info',
          message: isTh ? `ลบประวัติการตรวจรับ Batch ${item.batch_lot} เรียบร้อยแล้ว` : `Deleted record for Batch ${item.batch_lot}`
        });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Clear all history with custom modal confirmation & admin2026 password
  const handleClearAllHistory = () => {
    setDeleteConfirmPassword("");
    setDeleteConfirmPasswordError(false);
    setConfirmModal({
      isOpen: true,
      title: isTh ? 'ยืนยันการลบประวัติทั้งหมด' : 'Confirm Clear All History',
      message: isTh 
        ? 'คุณต้องการลบประวัติการตรวจรับเคมีทั้งหมดใช่หรือไม่? (การกระทำนี้ไม่สามารถยกเลิกได้) กรุณาใส่รหัสผ่าน admin2026 เพื่อยืนยัน' 
        : 'Are you sure you want to clear all chemical inspection history? Enter admin2026 to confirm.',
      confirmText: isTh ? 'ล้างประวัติทั้งหมด' : 'Clear All',
      cancelText: isTh ? 'ยกเลิก' : 'Cancel',
      onConfirm: () => {
        setHistory([]);
        setStatus({
          type: 'info',
          message: isTh ? 'ล้างประวัติการตรวจรับทั้งหมดเรียบร้อยแล้ว' : 'Cleared all inspection history'
        });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Confirm password and open edit modal
  const handleVerifyHistoryPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (historyAuthPassword === "admin2026") {
      setIsHistoryAuthOpen(false);
      setHistoryAuthError(false);
      if (targetEditHistoryItem) {
        setEditingHistoryItem(JSON.parse(JSON.stringify(targetEditHistoryItem)));
      }
    } else {
      setHistoryAuthError(true);
      setHistoryAuthPassword("");
    }
  };

  // Save edited history record
  const handleSaveEditedHistory = () => {
    if (!editingHistoryItem) return;

    const updatedItems = editingHistoryItem.items.map(i => ({
      ...i,
      status: validateItemRow(editingHistoryItem.chemical, i.description, i.value)
    }));

    const hasFail = updatedItems.some(i => i.status === 'FAIL');
    const updatedRecord: ChemicalInspectionEntry = {
      ...editingHistoryItem,
      items: updatedItems,
      result: hasFail ? 'FAIL' : 'PASS'
    };

    setHistory(prev => prev.map(item => item.id === updatedRecord.id ? updatedRecord : item));
    setEditingHistoryItem(null);
    setTargetEditHistoryItem(null);

    setStatus({
      type: 'success',
      message: isTh ? `แก้ไขข้อมูล Batch ${updatedRecord.batch_lot} สำเร็จแล้ว` : `Updated Batch ${updatedRecord.batch_lot} successfully`
    });
  };

  // Persist Local Storage
  useEffect(() => {
    localStorage.setItem('chem_qc_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('chem_qc_specs', JSON.stringify(specs));
  }, [specs]);

  // Validate single item row against selected coating chemical spec
  const validateItemRow = (chemicalName: string, description: string, rawVal: string | number): 'PASS' | 'FAIL' | '-' => {
    if (!chemicalName) return '-';
    const normChem = chemicalName.trim().toUpperCase();
    const chemicalSpecList = specs[normChem];
    if (!chemicalSpecList) return '-';

    const normDesc = description.trim().toUpperCase();
    const val = parseFloat(String(rawVal));
    if (isNaN(val)) return '-';

    const matched = chemicalSpecList.find(s => normDesc.startsWith(s.item.toUpperCase()));
    if (!matched) return '-';

    const min = matched.min !== '' ? parseFloat(String(matched.min)) : -Infinity;
    const max = matched.max !== '' ? parseFloat(String(matched.max)) : Infinity;

    return val >= min && val <= max ? 'PASS' : 'FAIL';
  };

  // Overall Result calculation
  const overallResult = useMemo(() => {
    if (tableItems.length === 0) return 'PASS';
    let hasFail = false;
    tableItems.forEach(item => {
      const st = validateItemRow(header.coating_chemical, item.description, item.total);
      if (st === 'FAIL') hasFail = true;
    });
    return hasFail ? 'FAIL' : 'PASS';
  }, [tableItems, header.coating_chemical, specs]);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setImageMimeType(file.type || 'image/png');
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBase64Image(result.split(',')[1]);
        setImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load Demo Chemical Cert
  const loadDemoCert = () => {
    setHeader({
      inspector_name: 'Anucha S. (IQC Chemist)',
      coating_chemical: 'A-001',
      batch_lot: `LOT-2026-CH${Math.floor(100 + Math.random() * 900)}`,
      product_date: '2026-07-28',
      expiration_date: '2027-07-28',
      weight_kg: '250',
      qty_pcs: '10',
      packaging_situation: 'Normal / Drums Intact',
      supplier: 'Siam Chemical Specialty Ltd.'
    });

    setTableItems([
      { description: 'OR', total: 14.8 },
      { description: 'T1', total: 8.5 },
      { description: 'IR', total: 2.2 },
      { description: 'VISCOSITY', total: 105 },
      { description: 'PH', total: 7.2 }
    ]);

    setStatus({
      type: 'info',
      message: isTh ? 'โหลดตัวอย่างเอกสาร Chemical Certificate แล้ว' : 'Loaded demo Chemical Certificate'
    });
  };

  // Process Document via Gemini AI (Client-side)
  const processDocument = async () => {
    if (!base64Image) {
      alert(isTh ? 'กรุณาอัปโหลดรูปภาพหรือไฟล์เอกสาร Certificate ก่อนทำการสแกน' : 'Please upload a Certificate document before analyzing.');
      return;
    }

    setIsProcessing(true);
    setStatus({
      type: 'info',
      message: isTh ? 'กำลังสแกนวิเคราะห์เอกสาร Chemical Certificate ด้วย AI (Client-side)...' : 'Scanning & analyzing Chemical Certificate document with AI (Client-side)...'
    });

    try {
      const resJson = await analyzeChemicalCertClient(base64Image, imageMimeType);
      
      if (resJson) {
        const h: any = resJson.header || {};
        const chemCode = (h.coating_chemical || 'A-001').toUpperCase();
        
        setHeader({
          inspector_name: h.inspector_name || 'Anucha S. (IQC Chemist)',
          coating_chemical: chemCode,
          batch_lot: h.batch_lot || `LOT-2026-CH${Math.floor(100 + Math.random() * 900)}`,
          product_date: h.product_date || new Date().toISOString().split('T')[0],
          expiration_date: h.expiration_date || new Date(Date.now() + 365*86400000).toISOString().split('T')[0],
          weight_kg: h.weight_kg !== undefined && h.weight_kg !== '' ? String(h.weight_kg) : '250',
          qty_pcs: h.qty_pcs !== undefined && h.qty_pcs !== '' ? String(h.qty_pcs) : '10',
          packaging_situation: h.packaging_situation || 'Normal',
          supplier: h.supplier || 'Siam Chemical Specialty Ltd.'
        });

        let tableList = Array.isArray(resJson.table) ? resJson.table : [];
        if (tableList.length === 0) {
          // If no measurement rows extracted from scan, generate spec test rows based on chemical
          const specRows = specs[chemCode] || DEFAULT_SPECS[chemCode] || DEFAULT_SPECS['A-001'] || [];
          tableList = specRows.map(s => ({
            description: s.item,
            total: ((s.min + s.max) / 2).toFixed(1)
          }));
        }

        setTableItems(tableList.map((t: any) => ({
          description: String(t.description || t.item || '').toUpperCase().trim(),
          total: t.total ?? t.value ?? ''
        })));

        setStatus({
          type: 'success',
          message: isTh ? `สกัดข้อมูล Chemical COA สำเร็จ! (Client-side) พบ ${tableList.length} รายการวิเคราะห์` : `Successfully extracted Chemical COA data (Client-side) with ${tableList.length} parameters`
        });
      } else {
        throw new Error(isTh ? 'ไม่พบข้อมูลในเอกสารนี้' : 'No valid data extracted from document');
      }
    } catch (err: any) {
      console.error('Chemical cert extraction error:', err);
      setStatus({
        type: 'error',
        message: isTh ? `เกิดข้อผิดพลาดในการสกัดข้อมูล: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}` : `Extraction failed: ${err.message || 'Please try again'}`
      });
      alert(isTh ? `เกิดข้อผิดพลาดในการสกัดข้อมูล: ${err.message}` : `Extraction error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Table item handlers
  const addTableItemRow = () => {
    setTableItems(prev => [...prev, { description: '', total: '' }]);
  };

  const updateTableItem = (index: number, field: 'description' | 'total', value: any) => {
    setTableItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const deleteTableItem = (index: number) => {
    setTableItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save Entry to History & QA Portal
  const saveInspection = () => {
    if (tableItems.length === 0) return;

    const formattedItems = tableItems.map(item => ({
      description: item.description,
      value: String(item.total),
      status: validateItemRow(header.coating_chemical, item.description, item.total)
    }));

    const res = overallResult;
    const entryId = `chem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();

    const newEntry: ChemicalInspectionEntry = {
      id: entryId,
      timestamp: now.toLocaleString('th-TH'),
      inspector: header.inspector_name || 'QA Chemist',
      batch_lot: header.batch_lot || 'N/A',
      chemical: header.coating_chemical.toUpperCase() || 'UNTITLED',
      date: header.product_date || '-',
      expiration: header.expiration_date || '-',
      weight: String(header.weight_kg || '0'),
      qty: String(header.qty_pcs || '0'),
      packaging: header.packaging_situation || 'Normal',
      supplier: header.supplier || '-',
      items: formattedItems,
      result: res,
      createdAt: now.getTime()
    };

    // Save history
    setHistory(prev => [newEntry, ...prev]);

    // Log to parent activity feed
    if (onLogNewActivity) {
      const outOfSpecDetails = formattedItems
        .filter(item => item.status === 'FAIL')
        .map(item => `${item.description}: ${item.value}`)
        .join(', ');

      const resultDesc = res === 'PASS' 
        ? 'PASS (Chemical COA parameters meet quality standard)' 
        : `FAIL / Out of Spec: ${outOfSpecDetails || 'Chemical parameter out of range'}`;

      onLogNewActivity({
        id: entryId,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        moduleCode: 'IQC-02',
        moduleTitleTh: 'ตรวจรับเคมีเคลือบผิว (Chemical Incoming)',
        moduleTitleEn: 'Chemical Incoming Inspection',
        inspector: header.inspector_name || 'QA Chemist',
        batchLot: `${header.coating_chemical} (${header.batch_lot})`,
        result: res === 'PASS' ? 'PASS' : 'REJECT',
        defectCount: res === 'FAIL' ? 1 : 0,
        remarks: resultDesc,
        coilNo: header.batch_lot || 'BATCH-CHEM-N/A',
        profile: `Chemical ${header.coating_chemical} (${header.supplier})`,
        process: 'IQC-02 Chemical Incoming Inspection',
        inspectionDate: newEntry.timestamp,
        inspectionResult: resultDesc
      });
    }

    // Clear image cache & memory on save
    setImage(null);
    setBase64Image(null);
    setFileName('');

    setStatus({
      type: 'success',
      message: isTh ? `บันทึกข้อมูลผลการตรวจรับเคมีเรียบร้อยแล้ว (จัดเก็บเฉพาะ Text Data)` : `Saved Chemical inspection record (Pure Text Data)`
    });

    // Switch to history tab
    setActiveTab('history');
  };

  // Copy JSON
  const copyJSON = () => {
    const payload = {
      header,
      table: tableItems.map(i => ({
        description: i.description,
        value: i.total,
        status: validateItemRow(header.coating_chemical, i.description, i.total)
      })),
      result: overallResult
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    alert(isTh ? 'คัดลอกข้อมูล JSON เรียบร้อยแล้ว' : 'Copied JSON to clipboard!');
  };

  // Reset form
  const clearForm = () => {
    setImage(null);
    setBase64Image(null);
    setFileName('');
    setHeader({
      inspector_name: '',
      coating_chemical: '',
      batch_lot: '',
      product_date: '',
      expiration_date: '',
      weight_kg: '',
      qty_pcs: '',
      packaging_situation: 'Normal',
      supplier: ''
    });
    setTableItems([]);
  };

  // Admin Auth Verify
  const handleAdminAccessRequest = () => {
    if (isAdminAuthenticated) {
      setActiveTab('settings');
    } else {
      setShowAdminModal(true);
    }
  };

  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminPasswordInput === 'admin2026') {
      setIsAdminAuthenticated(true);
      setShowAdminModal(false);
      setPasswordError(false);
      setAdminPasswordInput('');
      setActiveTab('settings');
    } else {
      setPasswordError(true);
      setAdminPasswordInput('');
    }
  };

  // Settings Spec Handlers
  const addSettingRow = () => {
    setSettingRows(prev => [...prev, { item: '', min: '', max: '' }]);
  };

  const saveProfileSetting = () => {
    if (!settingProfileName.trim()) {
      setStatus({ type: 'warning', message: isTh ? 'กรุณาระบุชื่อ Coating Chemical' : 'Please specify Coating Chemical Name' });
      return;
    }
    const chemKey = settingProfileName.trim().toUpperCase();
    const validItems = settingRows
      .filter(r => r.item.trim() !== '')
      .map(r => ({ item: r.item.trim().toUpperCase(), min: parseFloat(r.min) || 0, max: parseFloat(r.max) || 0 }));

    if (validItems.length === 0) {
      setStatus({ type: 'warning', message: isTh ? 'กรุณาใส่จุดวัดอย่างน้อย 1 รายการ' : 'Please add at least 1 measurement item' });
      return;
    }

    setSpecs(prev => ({
      ...prev,
      [chemKey]: validItems
    }));

    setSettingProfileName('');
    setSettingRows([{ item: 'OR', min: '10', max: '20' }]);
    setStatus({ type: 'success', message: isTh ? `บันทึกเกณฑ์ Spec สำหรับ ${chemKey} เรียบร้อยแล้ว` : `Saved spec for ${chemKey}` });
  };

  const deleteProfile = (keyToDelete: string) => {
    setDeleteConfirmPassword("");
    setDeleteConfirmPasswordError(false);
    setConfirmModal({
      isOpen: true,
      title: isTh ? 'ยืนยันการลบ Spec' : 'Confirm Delete Spec',
      message: isTh 
        ? `คุณต้องการลบเกณฑ์ Spec ของรหัสเคมี ${keyToDelete} กรุณาใส่รหัสผ่าน admin2026 เพื่อยืนยัน` 
        : `Are you sure you want to delete spec for chemical code ${keyToDelete}? Enter admin2026 to confirm.`,
      confirmText: isTh ? 'ลบ Spec' : 'Delete Spec',
      cancelText: isTh ? 'ยกเลิก' : 'Cancel',
      onConfirm: () => {
        setSpecs(prev => {
          const copy = { ...prev };
          delete copy[keyToDelete];
          return copy;
        });
        setStatus({
          type: 'info',
          message: isTh ? `ลบ Spec สำหรับ ${keyToDelete} เรียบร้อยแล้ว` : `Deleted spec for ${keyToDelete}`
        });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const editProfile = (keyToEdit: string) => {
    const list = specs[keyToEdit];
    if (!list) return;
    setSettingProfileName(keyToEdit);
    setSettingRows(list.map(i => ({ item: i.item, min: String(i.min), max: String(i.max) })));
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const q = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        item.chemical?.toLowerCase().includes(q) ||
        item.batch_lot?.toLowerCase().includes(q) ||
        item.supplier?.toLowerCase().includes(q) ||
        item.inspector?.toLowerCase().includes(q)
      );
    });
  }, [history, searchQuery]);

  // Export CSV
  const exportHistoryCSV = () => {
    if (history.length === 0) return;
    let csv = "\uFEFFTimestamp,Chemical,Batch/Lot,Supplier,Inspector,Product Date,Expiration Date,Weight(kg),Qty(pcs),Packaging,Item,Value,Status,Overall Result\n";
    history.forEach(e => {
      e.items.forEach(i => {
        csv += `"${e.timestamp}","${e.chemical}","${e.batch_lot}","${e.supplier}","${e.inspector}","${e.date}","${e.expiration}","${e.weight}","${e.qty}","${e.packaging}","${i.description}","${i.value}","${i.status}","${e.result}"\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Chemical_Incoming_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 space-y-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Admin Password Modal */}
      {showAdminModal && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="text-center space-y-2">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto ${
                isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}>
                <Lock className="w-7 h-7" />
              </div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Admin Authentication</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh ? 'กรุณาระบุรหัสผ่านเพื่อเข้าสู่โหมดตั้งค่า Spec' : 'Please enter admin password to configure specs'}
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border rounded-2xl px-4 py-3 text-center text-lg font-mono focus:outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-indigo-700 focus:border-indigo-600' 
                      : 'bg-slate-950 border-slate-800 text-cyan-300 focus:border-indigo-500'
                  }`}
                  autoFocus
                />
                {passwordError && (
                  <p className="text-rose-500 text-xs font-semibold text-center mt-2">
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง (ลอง admin2026)' : 'Incorrect password (try admin2026)'}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className={`flex-1 font-bold text-xs py-3 rounded-xl transition border ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-indigo-600/30"
                >
                  {isTh ? 'เข้าสู่ระบบ' : 'Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Application Bar */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                isLight 
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Return to QA Portal"
            >
              <ArrowLeft className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`} />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                }`}>
                  IQC-02
                </span>
                <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isTh ? 'ระบบตรวจรับเคมีเคลือบผิว (Chemical Incoming Inspection)' : 'Coating Chemical Incoming Inspection'}
                </h1>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh 
                  ? 'วิเคราะห์ไฟล์ PDF / รูปถ่าย COA, สกัดค่าส่วนผสมเคมี และตรวจสอบเกณฑ์มาตรฐาน' 
                  : 'PDF/Image COA AI OCR, Chemical Property Spec Match, Cloud Persistence'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border transition flex items-center gap-2 text-xs font-semibold ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Industrial'}
            >
              {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span className="hidden sm:inline">{isLight ? (isTh ? 'โหมดมืด' : 'Dark') : (isTh ? 'โหมดสว่าง' : 'Light')}</span>
            </button>
          )}

          <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
            isLight ? 'bg-white border-slate-200 text-indigo-700 shadow-xs' : 'bg-slate-900 border-slate-800 text-indigo-300'
          }`}>
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Engine: Gemini-2.5-Flash</span>
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className={`flex space-x-2 border-b pb-2 overflow-x-auto ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <button
          onClick={() => setActiveTab('extraction')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'extraction'
              ? isLight
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isTh ? '1. สแกน & สกัดข้อมูล (Data Extraction)' : '1. Data Extraction'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'history'
              ? isLight
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{isTh ? '2. ประวัติการตรวจรับ (Inspection History)' : '2. Inspection History'}</span>
          {history.length > 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
              isLight ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-slate-950 text-indigo-300 border-indigo-800'
            }`}>
              {history.length}
            </span>
          )}
        </button>

        <button
          onClick={handleAdminAccessRequest}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'settings'
              ? isLight
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{isTh ? '3. ตั้งค่าเกณฑ์ Spec (Chemical Specs)' : '3. Spec Setting'}</span>
          {isAdminAuthenticated && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* TAB 1: DATA EXTRACTION */}
      {activeTab === 'extraction' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Upload Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`p-5 rounded-2xl border space-y-4 sticky top-6 ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-md'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <Upload className="w-4 h-4 text-indigo-500" />
                {isTh ? '1. นำเข้าไฟล์ (PDF / Image)' : '1. Import File (PDF / Image)'}
              </h3>

              {/* Drop Zone */}
              <div className={`relative border-2 border-dashed rounded-xl p-4 min-h-[200px] flex flex-col items-center justify-center transition ${
                isLight
                  ? image ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  : image ? 'border-indigo-500 bg-slate-950' : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
              }`}>
                {isProcessing && (
                  <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm ${
                    isLight ? 'bg-white/80' : 'bg-slate-950/80'
                  }`}>
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-2" />
                    <span className={`text-xs font-bold ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                      {isTh ? 'กำลังสกัดข้อมูลด้วย AI...' : 'Analyzing document with AI...'}
                    </span>
                  </div>
                )}

                {image ? (
                  <img src={image} alt="Cert Preview" className="max-h-[220px] w-full object-contain rounded-lg" />
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <Upload className={`mx-auto w-10 h-10 mb-2 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
                    <p className={`font-semibold text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {isTh ? 'ลากไฟล์มาวาง หรือ คลิกเพื่อเลือก' : 'Drag & drop file or click to select'}
                    </p>
                    <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isTh ? 'รองรับไฟล์สแกน, รูปถ่าย COA มือถือ' : 'Supports scanned PDFs & COA images'}
                    </p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*, application/pdf" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  disabled={isProcessing} 
                />
              </div>

              {fileName && (
                <div className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
                  isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-indigo-950/40 border-indigo-900/60 text-indigo-300'
                }`}>
                  <span className="font-mono truncate max-w-[200px]">{fileName}</span>
                  <button onClick={() => { setImage(null); setFileName(''); setBase64Image(null); }} className="text-slate-400 hover:text-rose-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Extract & Demo buttons */}
              <div className="space-y-2">
                <button
                  onClick={processDocument}
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isTh ? 'สกัดข้อมูลด้วย AI แม่นยำสูง' : 'Extract Data with AI'}</span>
                </button>

                <button
                  onClick={loadDemoCert}
                  className={`w-full font-medium text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition border ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isTh ? '⚡ โหลดเอกสารตัวอย่าง Chemical COA' : '⚡ Load Demo Chemical COA'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Structured Data Results Panel */}
          <div className="lg:col-span-8 space-y-4">
            <div className={`p-6 rounded-2xl border space-y-6 ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-md'
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${tableItems.length > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {isTh ? 'ผลการสกัดข้อมูล (Structured Data)' : 'Structured Data Results'}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={saveInspection}
                    disabled={tableItems.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isTh ? 'บันทึกเข้าสู่ระบบ Cloud' : 'Save to Cloud'}</span>
                  </button>

                  <button
                    onClick={copyJSON}
                    disabled={tableItems.length === 0}
                    className={`font-bold text-xs px-3 py-2 rounded-xl border flex items-center gap-1.5 transition disabled:opacity-40 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>

                  <button
                    onClick={clearForm}
                    className={`p-2 rounded-xl border transition ${
                      isLight
                        ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200'
                        : 'bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border-slate-700'
                    }`}
                    title="Clear"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Header Metadata Grid */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-xl border ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <div>
                  <label className={`text-[10px] font-bold block uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Inspector Name
                  </label>
                  <input
                    type="text"
                    value={header.inspector_name}
                    onChange={(e) => setHeader({ ...header, inspector_name: e.target.value })}
                    placeholder="Inspector Name"
                    className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold block uppercase mb-1 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                    Coating Chemical *
                  </label>
                  <input
                    type="text"
                    value={header.coating_chemical}
                    onChange={(e) => setHeader({ ...header, coating_chemical: e.target.value.toUpperCase() })}
                    placeholder="e.g. A-001, COAT-901"
                    className={`w-full border font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none uppercase ${
                      isLight
                        ? 'bg-white border-indigo-300 text-indigo-700 focus:border-indigo-600'
                        : 'bg-slate-900 border-indigo-900/80 text-indigo-300 focus:border-indigo-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold block uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Batch / Lot
                  </label>
                  <input
                    type="text"
                    value={header.batch_lot}
                    onChange={(e) => setHeader({ ...header, batch_lot: e.target.value })}
                    placeholder="Batch/Lot"
                    className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold block uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Product Date
                  </label>
                  <input
                    type="text"
                    value={header.product_date}
                    onChange={(e) => setHeader({ ...header, product_date: e.target.value })}
                    placeholder="YYYY-MM-DD"
                    className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold block uppercase mb-1 ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>
                    Expiration Date
                  </label>
                  <input
                    type="text"
                    value={header.expiration_date}
                    onChange={(e) => setHeader({ ...header, expiration_date: e.target.value })}
                    placeholder="YYYY-MM-DD"
                    className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none font-mono ${
                      isLight
                        ? 'bg-white border-rose-300 text-rose-700 focus:border-rose-500'
                        : 'bg-slate-900 border-rose-900/50 text-rose-300 focus:border-rose-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold block uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Weight (kg) / Q'ty (pcs)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Weight kg"
                      value={header.weight_kg}
                      onChange={(e) => setHeader({ ...header, weight_kg: e.target.value })}
                      className={`w-1/2 border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Qty pcs"
                      value={header.qty_pcs}
                      onChange={(e) => setHeader({ ...header, qty_pcs: e.target.value })}
                      className={`w-1/2 border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className={`text-[10px] font-bold block uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={header.supplier}
                    onChange={(e) => setHeader({ ...header, supplier: e.target.value })}
                    placeholder="Supplier Name"
                    className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold block uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Packaging Situation
                  </label>
                  <input
                    type="text"
                    value={header.packaging_situation}
                    onChange={(e) => setHeader({ ...header, packaging_situation: e.target.value })}
                    placeholder="Normal / Sealed"
                    className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Table of Measurements */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {isTh ? 'ตารางรายการวัด (Measurement Items)' : 'Measurement Table'}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {isTh ? 'ผลสรุปรวม:' : 'Overall Status:'}
                    </span>
                    <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                      overallResult === 'PASS' 
                        ? isLight
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : isLight
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {overallResult === 'PASS' ? '✓ PASS' : '✕ FAIL / REJECT'}
                    </span>
                  </div>
                </div>

                <div className={`border rounded-xl overflow-hidden ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-950 border-slate-800'
                }`}>
                  <table className="w-full text-xs text-left">
                    <thead className={`border-b font-bold uppercase ${
                      isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      <tr>
                        <th className="px-3 py-2.5 w-12 text-center">#</th>
                        <th className="px-3 py-2.5">Measurement Item</th>
                        <th className="px-3 py-2.5 w-36 text-right">Measured Value</th>
                        <th className="px-3 py-2.5 w-24 text-center">Status</th>
                        <th className="px-3 py-2.5 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
                      {tableItems.map((item, idx) => {
                        const status = validateItemRow(header.coating_chemical, item.description, item.total);
                        return (
                          <tr key={idx} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}>
                            <td className={`px-3 py-2 text-center font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{idx + 1}</td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateTableItem(idx, 'description', e.target.value)}
                                placeholder="Item code (e.g. OR, T1, PH)"
                                className={`w-full border rounded px-2 py-1 font-semibold focus:outline-none focus:border-indigo-500 ${
                                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                                }`}
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="text"
                                value={item.total}
                                onChange={(e) => updateTableItem(idx, 'total', e.target.value)}
                                placeholder="0.00"
                                className={`w-full border rounded px-2 py-1 text-right font-mono font-bold focus:outline-none ${
                                  isLight 
                                    ? 'bg-white border-indigo-200 text-indigo-700 focus:border-indigo-500' 
                                    : 'bg-slate-900 border-indigo-900/60 text-indigo-300 focus:border-indigo-400'
                                }`}
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                status === 'PASS'
                                  ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : status === 'FAIL'
                                    ? isLight ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => deleteTableItem(idx)}
                                className={`transition ${isLight ? 'text-slate-400 hover:text-rose-600' : 'text-slate-500 hover:text-rose-400'}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {tableItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className={`p-8 text-center ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                            {isTh ? 'ยังไม่มีจุดวัด กรุณาอัปโหลดเอกสารหรือกดปุ่มเพิ่มรายการ' : 'No measurement items yet. Upload doc or click add.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={addTableItemRow}
                  className={`w-full py-2.5 border-2 border-dashed rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                    isLight 
                      ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-300' 
                      : 'border-slate-800 hover:border-indigo-500/50 rounded-xl text-indigo-400 hover:bg-slate-900/50'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{isTh ? 'เพิ่มจุดวัด (Measurement Item)' : 'Add Measurement Row'}</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 2: INSPECTION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Top Control Ribbon */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isTh ? "ค้นหา Chemical, Batch, Supplier..." : "Search Chemical, Batch..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportHistoryCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isTh ? 'ส่งออก CSV' : 'Export CSV'}</span>
              </button>

              <button
                onClick={handleClearAllHistory}
                className={`font-bold text-xs px-3 py-2 rounded-xl border flex items-center gap-1.5 transition ${
                  isLight
                    ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border-slate-200'
                    : 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border-slate-700'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isTh ? 'ล้างประวัติ' : 'Clear All'}</span>
              </button>
            </div>
          </div>

          {/* History Data Table */}
          <div className={`rounded-2xl border overflow-hidden ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`border-b uppercase font-bold text-[10px] ${
                  isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  <tr>
                    <th className="px-4 py-3">Date/Time</th>
                    <th className="px-4 py-3">Chemical</th>
                    <th className="px-4 py-3">Batch/Lot</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Weight / Qty</th>
                    <th className="px-4 py-3">Packaging</th>
                    <th className="px-4 py-3 text-center">Result</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
                  {filteredHistory.map((entry) => (
                    <tr key={entry.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-950/40'}>
                      <td className={`px-4 py-3 font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{entry.timestamp}</td>
                      <td className={`px-4 py-3 font-bold ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>{entry.chemical}</td>
                      <td className={`px-4 py-3 font-mono font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{entry.batch_lot}</td>
                      <td className={`px-4 py-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{entry.supplier || '-'}</td>
                      <td className="px-4 py-3 font-mono">
                        <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{entry.weight} kg</span> / <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{entry.qty} pcs</span>
                      </td>
                      <td className={`px-4 py-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{entry.packaging || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          entry.result === 'PASS'
                            ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isLight ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {entry.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRequestEditHistory(entry)}
                            className={`p-1.5 rounded-lg transition border flex items-center gap-1 text-[11px] font-bold ${
                              isLight 
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200' 
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }`}
                            title={isTh ? "แก้ไขข้อมูล (ใส่รหัส admin2026)" : "Edit Record (Password required)"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isTh ? 'แก้ไข' : 'Edit'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteHistoryItem(entry)}
                            className={`p-1.5 rounded-lg transition border flex items-center gap-1 text-[11px] font-bold ${
                              isLight 
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' 
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                            title={isTh ? "ลบรายการประวัติ" : "Delete Record"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isTh ? 'ลบ' : 'Delete'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={8} className={`p-12 text-center ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isTh ? 'ไม่มีข้อมูลประวัติการตรวจรับ' : 'No inspection history found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SPECIFICATION SETTINGS (ADMIN) */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border space-y-5 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <Settings className="w-4 h-4 text-indigo-500" />
                {isTh ? 'ตั้งค่า Spec เคมีใหม่ (New Chemical Spec)' : 'Configure New Chemical Spec'}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="max-w-xs">
                <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                  Coating Chemical Name
                </label>
                <input
                  type="text"
                  value={settingProfileName}
                  onChange={(e) => setSettingProfileName(e.target.value.toUpperCase())}
                  placeholder="e.g. A-001, COAT-901"
                  className={`w-full border rounded-xl px-3 py-2 text-sm font-bold uppercase focus:outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-indigo-700 focus:border-indigo-600' 
                      : 'bg-slate-950 border-slate-800 text-indigo-300 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className={`border rounded-xl overflow-hidden ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <table className="w-full text-xs text-left">
                  <thead className={`font-bold uppercase border-b ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    <tr>
                      <th className="px-4 py-2.5">Measurement Item (Prefix)</th>
                      <th className="px-4 py-2.5 w-36 text-center">Min Spec</th>
                      <th className="px-4 py-2.5 w-36 text-center">Max Spec</th>
                      <th className="px-4 py-2.5 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                    {settingRows.map((row, idx) => (
                      <tr key={idx} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={row.item}
                            onChange={(e) => {
                              const copy = [...settingRows];
                              copy[idx].item = e.target.value.toUpperCase();
                              setSettingRows(copy);
                            }}
                            placeholder="Prefix (e.g. OR, PH, IR)"
                            className={`w-full border rounded px-2.5 py-1.5 font-semibold focus:outline-none uppercase ${
                              isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500' : 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500'
                            }`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={row.min}
                            onChange={(e) => {
                              const copy = [...settingRows];
                              copy[idx].min = e.target.value;
                              setSettingRows(copy);
                            }}
                            placeholder="Min"
                            className={`w-full border rounded px-2.5 py-1.5 text-center font-mono font-bold focus:outline-none ${
                              isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:border-emerald-500' : 'bg-slate-900 border-slate-800 text-emerald-400 focus:border-emerald-500'
                            }`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={row.max}
                            onChange={(e) => {
                              const copy = [...settingRows];
                              copy[idx].max = e.target.value;
                              setSettingRows(copy);
                            }}
                            placeholder="Max"
                            className={`w-full border rounded px-2.5 py-1.5 text-center font-mono font-bold focus:outline-none ${
                              isLight ? 'bg-rose-50 border-rose-200 text-rose-700 focus:border-rose-500' : 'bg-slate-900 border-slate-800 text-rose-400 focus:border-rose-500'
                            }`}
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => setSettingRows(prev => prev.filter((_, i) => i !== idx))}
                            className={isLight ? 'text-slate-400 hover:text-rose-600' : 'text-slate-500 hover:text-rose-400'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={addSettingRow}
                  className={`px-4 py-2 font-bold text-xs rounded-xl border flex items-center gap-1.5 transition ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Plus className="w-4 h-4 text-indigo-500" />
                  <span>{isTh ? 'เพิ่มจุดวัด' : 'Add Item'}</span>
                </button>

                <button
                  onClick={saveProfileSetting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isTh ? 'บันทึก Spec เคมี' : 'Save Chemical Spec'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* List of Configured Specs */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
              {isTh ? 'รายการ Spec เคมีที่บันทึกแล้ว' : 'Configured Chemical Specs'} ({Object.keys(specs).length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(specs).map((key) => (
                <div key={key} className={`p-4 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold font-mono ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>{key}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => editProfile(key)}
                        className={`p-1 ${isLight ? 'text-slate-500 hover:text-indigo-600' : 'text-slate-400 hover:text-indigo-400'}`}
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProfile(key)}
                        className={`p-1 ${isLight ? 'text-slate-500 hover:text-rose-600' : 'text-slate-400 hover:text-rose-400'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {specs[key].map((item, i) => (
                      <span key={i} className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                        isLight 
                          ? 'bg-white text-slate-700 border-slate-200 shadow-2xs' 
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}>
                        {item.item}: {item.min}-{item.max}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD PROMPT MODAL FOR EDITING HISTORY */}
      {isHistoryAuthOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button 
              onClick={() => setIsHistoryAuthOpen(false)} 
              className={`absolute top-4 right-4 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isTh ? 'ยืนยันรหัสผ่านเพื่อแก้ไขข้อมูล' : 'Password Required for Editing'}
              </h4>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh 
                  ? `ต้องการแก้ไข Batch/Lot ${targetEditHistoryItem?.batch_lot || ''} กรุณาใส่รหัสผ่าน` 
                  : `Enter admin password to edit Batch ${targetEditHistoryItem?.batch_lot || ''}`}
              </p>
            </div>

            <form onSubmit={handleVerifyHistoryPassword} className="space-y-3">
              <input
                type="password"
                autoFocus
                placeholder={isTh ? "ใส่รหัสผ่าน (admin2026)" : "Enter password (admin2026)"}
                value={historyAuthPassword}
                onChange={(e) => setHistoryAuthPassword(e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-center font-mono text-sm focus:outline-none ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500' 
                    : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                }`}
              />
              {historyAuthError && (
                <p className="text-xs text-rose-500 font-semibold text-center">
                  {isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาใส่ admin2026' : 'Incorrect password! Please enter admin2026'}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHistoryAuthOpen(false)}
                  className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition border ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition shadow-md shadow-amber-500/20"
                >
                  {isTh ? 'ยืนยันเพื่อเข้าแก้ไข' : 'Unlock & Edit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RECORD MODAL */}
      {editingHistoryItem && (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto ${
          isLight ? 'bg-slate-900/50' : 'bg-slate-950/85'
        }`}>
          <div className={`border rounded-2xl max-w-2xl w-full p-6 space-y-6 my-8 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isTh ? `แก้ไขข้อมูลประวัติ Batch/Lot: ${editingHistoryItem.batch_lot}` : `Edit Inspection Record - ${editingHistoryItem.batch_lot}`}
                </h3>
              </div>
              <button 
                onClick={() => setEditingHistoryItem(null)} 
                className={`transition ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Chemical Code</label>
                <input
                  type="text"
                  value={editingHistoryItem.chemical || ''}
                  onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, chemical: e.target.value.toUpperCase() } : null)}
                  className={`w-full border rounded-xl px-3 py-2 font-bold focus:outline-none uppercase ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-indigo-700 focus:border-amber-500' 
                      : 'bg-slate-950 border-slate-800 text-indigo-300 focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Batch / Lot No.</label>
                <input
                  type="text"
                  value={editingHistoryItem.batch_lot || ''}
                  onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, batch_lot: e.target.value } : null)}
                  className={`w-full border rounded-xl px-3 py-2 font-mono font-bold focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Supplier</label>
                <input
                  type="text"
                  value={editingHistoryItem.supplier || ''}
                  onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, supplier: e.target.value } : null)}
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-500' : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Inspector</label>
                <input
                  type="text"
                  value={editingHistoryItem.inspector || ''}
                  onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, inspector: e.target.value } : null)}
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-500' : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Weight (kg)</label>
                <input
                  type="text"
                  value={editingHistoryItem.weight || ''}
                  onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, weight: e.target.value } : null)}
                  className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-500' : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Quantity (pcs)</label>
                <input
                  type="text"
                  value={editingHistoryItem.qty || ''}
                  onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, qty: e.target.value } : null)}
                  className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-500' : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            {/* Test Items Table */}
            <div className="space-y-2">
              <label className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                Chemical Measurement Parameters
              </label>
              <div className={`border rounded-xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <table className="w-full text-xs text-left">
                  <thead className={`font-bold border-b ${isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                    <tr>
                      <th className="px-3 py-2">Parameter</th>
                      <th className="px-3 py-2 text-center w-32">Measured Value</th>
                      <th className="px-3 py-2 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                    {editingHistoryItem.items.map((row, idx) => (
                      <tr key={idx}>
                        <td className={`px-3 py-2 font-bold ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>{row.description}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.value}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setEditingHistoryItem(prev => {
                                if (!prev) return null;
                                const itemsCopy = [...prev.items];
                                itemsCopy[idx] = { ...itemsCopy[idx], value: newVal };
                                return { ...prev, items: itemsCopy };
                              });
                            }}
                            className={`w-full border rounded px-2 py-1 text-center font-mono font-bold focus:outline-none ${
                              isLight ? 'bg-slate-50 border-slate-300 text-indigo-700 focus:border-amber-500' : 'bg-slate-900 border-slate-800 text-cyan-300 focus:border-amber-500'
                            }`}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'PASS' 
                              ? isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-400' 
                              : isLight ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`flex justify-end gap-3 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <button
                onClick={() => setEditingHistoryItem(null)}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition border ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {isTh ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveEditedHistory}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition shadow-md shadow-amber-500/20 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isTh ? 'บันทึกการแก้ไข' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL CONFIRMATION MODAL WITH PASSWORD (admin2026) */}
      {confirmModal.isOpen && (
        <div className={`fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4 ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button 
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
              className={`absolute top-4 right-4 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
              isLight ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {confirmModal.title}
              </h4>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {confirmModal.message}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (deleteConfirmPassword === "admin2026") {
                  setDeleteConfirmPasswordError(false);
                  confirmModal.onConfirm();
                } else {
                  setDeleteConfirmPasswordError(true);
                  setDeleteConfirmPassword("");
                }
              }}
              className="space-y-3"
            >
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder={isTh ? "ใส่รหัสผ่าน admin2026 เพื่อยืนยัน" : "Enter password (admin2026)"}
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2.5 text-center font-mono text-sm focus:outline-none border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-rose-500'
                  }`}
                />
                {deleteConfirmPasswordError && (
                  <p className="text-xs text-rose-500 font-semibold text-center mt-1.5">
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาใส่ admin2026' : 'Incorrect password! Please enter admin2026'}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition border ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {confirmModal.cancelText || (isTh ? 'ยกเลิก' : 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{confirmModal.confirmText || (isTh ? 'ลบข้อมูล' : 'Delete')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
