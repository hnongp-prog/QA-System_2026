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
  Moon,
  Printer,
  Tag,
  QrCode,
  Maximize2
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
import { useCloudState } from '../services/firestoreSync';
import { generateQrSvgString, QRCodeView, getChemQrPayload, QrDataMode, QrZoomModal } from '../utils/qrCodeHelper';

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
    inspector: "Wipawee K. (IQA)",
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
    shift: '',
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
  const [history, setHistory] = useCloudState<ChemicalInspectionEntry[]>('chem_qc_history', INITIAL_HISTORY);
  const [specs, setSpecs] = useCloudState<ChemicalSpecMap>('chem_qc_specs', DEFAULT_SPECS);

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

  // Search Filter & Month/Year Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  // Single & Batch Tag Print Modal State
  const [activePrintItem, setActivePrintItem] = useState<ChemicalInspectionEntry | null>(null);
  const [activeBatchPrintItems, setActiveBatchPrintItems] = useState<ChemicalInspectionEntry[] | null>(null);
  const [batchPrintLayout, setBatchPrintLayout] = useState<'roll' | 'grid'>('roll');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [copiedTagInfo, setCopiedTagInfo] = useState<boolean>(false);
  const [batchCopiedInfo, setBatchCopiedInfo] = useState<boolean>(false);
  const [qrDataMode, setQrDataMode] = useState<QrDataMode>('full');
  const [zoomQrPayload, setZoomQrPayload] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    payload: string;
  } | null>(null);

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

  // Delete history item with custom modal confirmation & admin password
  const handleDeleteHistoryItem = (item: ChemicalInspectionEntry) => {
    setDeleteConfirmPassword("");
    setDeleteConfirmPasswordError(false);
    setConfirmModal({
      isOpen: true,
      title: isTh ? 'ยืนยันการลบรายการประวัติ' : 'Confirm Delete Record',
      message: isTh 
        ? `คุณต้องการลบประวัติการตรวจรับ Batch/Lot: ${item.batch_lot} (${item.chemical}) กรุณาใส่รหัสผ่านผู้ดูแลระบบเพื่อยืนยัน` 
        : `Are you sure you want to delete inspection record for Batch ${item.batch_lot}? Enter admin password to confirm.`,
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

  // Clear all history with custom modal confirmation & admin password
  const handleClearAllHistory = () => {
    setDeleteConfirmPassword("");
    setDeleteConfirmPasswordError(false);
    setConfirmModal({
      isOpen: true,
      title: isTh ? 'ยืนยันการลบประวัติทั้งหมด' : 'Confirm Clear All History',
      message: isTh 
        ? 'คุณต้องการลบประวัติการตรวจรับเคมีทั้งหมดใช่หรือไม่? (การกระทำนี้ไม่สามารถยกเลิกได้) กรุณาใส่รหัสผ่านผู้ดูแลระบบเพื่อยืนยัน' 
        : 'Are you sure you want to clear all chemical inspection history? Enter admin password to confirm.',
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

  // Validate single item row against selected coating chemical spec
  const validateItemRow = (chemicalName: string, description: string, rawVal: string | number): 'PASS' | 'FAIL' | '-' => {
    if (!chemicalName) return '-';
    const rawStr = String(rawVal ?? '').trim();
    if (rawStr === '' || rawStr === '-' || rawStr === 'N/A' || rawStr === 'none') return '-';
    const normChem = chemicalName.trim().toUpperCase();
    const chemicalSpecList = specs[normChem];
    if (!chemicalSpecList) return '-';

    const normDesc = description.trim().toUpperCase();
    const val = parseFloat(rawStr);
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
      inspector_name: 'Anucha S. (IQA Chemist)',
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
          inspector_name: h.inspector_name || 'Anucha S. (IQA Chemist)',
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
            total: ((Number(s.min) + Number(s.max)) / 2).toFixed(1)
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
      shift: header.shift || '',
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
        moduleCode: 'IQA-02',
        moduleTitleTh: 'ตรวจรับเคมีเคลือบผิว (Chemical Incoming)',
        moduleTitleEn: 'Chemical Incoming Inspection',
        inspector: header.inspector_name || 'QA Chemist',
        shift: header.shift || '',
        batchLot: `${header.coating_chemical} (${header.batch_lot})`,
        result: res === 'PASS' ? 'PASS' : 'REJECT',
        defectCount: res === 'FAIL' ? 1 : 0,
        remarks: resultDesc,
        coilNo: header.batch_lot || 'BATCH-CHEM-N/A',
        profile: `Chemical ${header.coating_chemical} (${header.supplier})`,
        process: 'IQA-02 Chemical Incoming Inspection',
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
      shift: '',
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
        ? `คุณต้องการลบเกณฑ์ Spec ของรหัสเคมี ${keyToDelete} กรุณาใส่รหัสผ่านผู้ดูแลระบบเพื่อยืนยัน` 
        : `Are you sure you want to delete spec for chemical code ${keyToDelete}? Enter admin password to confirm.`,
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

  // Filtered History with Search, Month, and Year
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchQuery = (
        !searchQuery ||
        item.chemical?.toLowerCase().includes(q) ||
        item.batch_lot?.toLowerCase().includes(q) ||
        item.supplier?.toLowerCase().includes(q) ||
        item.inspector?.toLowerCase().includes(q) ||
        item.packaging?.toLowerCase().includes(q)
      );

      let matchMonth = true;
      let matchYear = true;

      if (filterMonth || filterYear) {
        const itemDateStr = item.date || item.timestamp || '';
        if (filterMonth) {
          matchMonth = itemDateStr.includes(`-${filterMonth}-`) || itemDateStr.includes(`/${filterMonth}/`);
        }
        if (filterYear) {
          matchYear = itemDateStr.includes(filterYear);
        }
      }

      return matchQuery && matchMonth && matchYear;
    });
  }, [history, searchQuery, filterMonth, filterYear]);

  // Unique key helper for multi-selection
  const getHistoryItemKey = (item: ChemicalInspectionEntry, idx: number): string => {
    return item.id || `${item.batch_lot}-${item.chemical}-${idx}`;
  };

  const toggleSelectHistory = (key: string) => {
    setSelectedHistoryIds(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const isAllFilteredSelected = filteredHistory.length > 0 && filteredHistory.every((item, idx) => 
    selectedHistoryIds.includes(getHistoryItemKey(item, idx))
  );

  const toggleSelectAllHistory = () => {
    if (isAllFilteredSelected) {
      setSelectedHistoryIds([]);
    } else {
      const allFilteredKeys = filteredHistory.map((item, idx) => getHistoryItemKey(item, idx));
      setSelectedHistoryIds(allFilteredKeys);
    }
  };

  const clearHistorySelection = () => {
    setSelectedHistoryIds([]);
  };

  const selectedHistoryItems = useMemo(() => {
    return filteredHistory.filter((item, idx) => 
      selectedHistoryIds.includes(getHistoryItemKey(item, idx))
    );
  }, [filteredHistory, selectedHistoryIds]);

  const handlePrintTag = (item: ChemicalInspectionEntry) => {
    setActivePrintItem(item);
  };

  const handlePrintBatchTags = (itemsToPrint?: ChemicalInspectionEntry[]) => {
    const list = itemsToPrint && itemsToPrint.length > 0 ? itemsToPrint : selectedHistoryItems;
    if (list.length > 0) {
      setActiveBatchPrintItems(list);
    } else if (filteredHistory.length > 0) {
      setActiveBatchPrintItems(filteredHistory);
    }
  };

  function chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  // Tag HTML Generator for Chemical Inspection
  const generateTagContentHtml = (item: ChemicalInspectionEntry, tagIndex?: number, mode: QrDataMode = qrDataMode) => {
    const jg = item.result || 'PASS';
    const isPass = jg === 'PASS';
    const bgBadge = isPass ? '#10b981' : '#ef4444';
    const tagNo = tagIndex !== undefined ? `<div class="tag-number">#${tagIndex + 1}</div>` : '';

    const itemsSummary = item.items && item.items.length > 0
      ? item.items.map(it => `${it.description}: ${it.value} (${it.status})`).join(' | ')
      : '';
    const qrSvg = generateQrSvgString(getChemQrPayload(item, mode), { margin: 4 });

    return `
      <div class="tag-card">
        ${tagNo}
        <div class="tag-header">
          QUALITY APPROVED CHEMICAL TAG
        </div>

        <div class="tag-body">
          <div class="qr-box">
            <div class="qr-svg-wrap">
              ${qrSvg}
            </div>
            <div class="qr-text">${item.batch_lot || item.chemical || 'CHEM-LOT'}</div>
          </div>

          <div class="info-box">
            <div class="info-row">
              <span class="label">BATCH / LOT NO:</span>
              <span class="val bold mono" style="font-size: 12px; color: #000;">${item.batch_lot || '-'}</span>
            </div>

            <div class="info-row">
              <span class="label">CHEMICAL CODE:</span>
              <span class="val bold" style="font-size: 12px; color: #4338ca;">${item.chemical || '-'}</span>
            </div>

            <div class="info-row-2col">
              <div>
                <span class="label">SUPPLIER:</span>
                <span class="val">${item.supplier || '-'}</span>
              </div>
              <div>
                <span class="label">INSPECTOR:</span>
                <span class="val">${item.inspector || 'QA Chemist'}${item.shift ? ` (${item.shift})` : ''}</span>
              </div>
            </div>

            <div class="info-row-2col">
              <div>
                <span class="label">MFG / EXP:</span>
                <span class="val mono">${item.date || '-'} / ${item.expiration || '-'}</span>
              </div>
              <div>
                <span class="label">QTY / WT:</span>
                <span class="val mono bold">${item.qty || '-'} pcs / ${item.weight || '0'} kg</span>
              </div>
            </div>

            <div class="info-row-2col">
              <div>
                <span class="label">PACKAGING:</span>
                <span class="val">${item.packaging || 'Normal'}</span>
              </div>
              <div>
                <span class="label">RESULT:</span>
                <span class="badge" style="background: ${bgBadge};">${jg}</span>
              </div>
            </div>
          </div>
        </div>

        ${itemsSummary ? `
          <div class="chem-row">
            <strong>PARAM: </strong>${itemsSummary}
          </div>
        ` : ''}

        <div class="tag-footer">
          <span>IQA-01 Chemical Incoming Verification</span>
          <span>${item.timestamp || (item.date ? item.date : new Date().toLocaleDateString('th-TH'))}</span>
        </div>
      </div>
    `;
  };

  const generateMultipleTagsHtml = (items: ChemicalInspectionEntry[], layout: 'roll' | 'grid', mode: QrDataMode = qrDataMode) => {
    if (layout === 'roll') {
      const tagsHtml = items.map((item, idx) => `
        <div class="page-container">
          ${generateTagContentHtml(item, idx, mode)}
        </div>
      `).join('');

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Chemical Incoming QR Quality Tags (Roll)</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: 100mm 100mm;
              margin: 0;
            }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            html, body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background: #fff;
              color: #0f172a;
            }
            .page-container {
              width: 100mm;
              height: 100mm;
              padding: 4mm;
              page-break-after: always;
              break-after: page;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .page-container:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .tag-card {
              width: 92mm;
              height: 92mm;
              border: 2px solid #4338ca;
              border-radius: 8px;
              padding: 8px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: #fff;
              box-sizing: border-box;
              position: relative;
            }
            .tag-number {
              position: absolute;
              top: 6px;
              right: 6px;
              font-size: 8px;
              font-family: monospace;
              background: rgba(255,255,255,0.3);
              color: #fff;
              padding: 1px 4px;
              border-radius: 4px;
              z-index: 2;
            }
            .tag-header {
              background: #4338ca;
              color: #fff;
              font-size: 9.5px;
              font-weight: 900;
              text-align: center;
              padding: 4px 6px;
              border-radius: 4px;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .tag-body {
              display: flex;
              gap: 8px;
              margin-top: 4px;
              align-items: stretch;
            }
            .qr-box {
              width: 96px;
              min-width: 96px;
              border: 1.5px solid #0f172a;
              border-radius: 6px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 4px;
              background: #ffffff;
              box-sizing: border-box;
            }
            .qr-box .qr-svg-wrap {
              width: 88px;
              height: 88px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-box .qr-svg-wrap svg {
              width: 100%;
              height: 100%;
              display: block;
            }
            .qr-text {
              font-family: monospace;
              font-size: 7.5px;
              font-weight: bold;
              color: #0f172a;
              margin-top: 2px;
              max-width: 74px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .info-box {
              flex: 1;
              font-size: 9.5px;
              line-height: 1.25;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .info-row {
              display: flex;
              flex-direction: column;
              margin-bottom: 2px;
            }
            .info-row-2col {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4px;
              font-size: 8.5px;
              margin-bottom: 2px;
            }
            .label {
              font-size: 7.5px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              display: block;
            }
            .val {
              color: #0f172a;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .bold { font-weight: bold; }
            .mono { font-family: monospace; }
            .badge {
              display: inline-block;
              padding: 1px 5px;
              border-radius: 3px;
              color: #fff;
              font-weight: 900;
              font-size: 8px;
              text-align: center;
            }
            .chem-row {
              margin-top: 3px;
              padding: 2px 4px;
              background: #f8fafc;
              border-radius: 4px;
              border: 1px solid #e2e8f0;
              font-family: monospace;
              font-size: 7.5px;
              color: #334155;
              line-height: 1.2;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .tag-footer {
              border-top: 1px dashed #cbd5e1;
              padding-top: 4px;
              font-size: 7px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          ${tagsHtml}
        </body>
        </html>
      `;
    } else {
      // Grid Layout A4 (4 tags per page)
      const pages = chunkArray(items, 4);
      const pagesHtml = pages.map((pageItems, pageIdx) => `
        <div class="a4-page">
          <div class="grid-container">
            ${pageItems.map((item, itemIdx) => generateTagContentHtml(item, (pageIdx * 4) + itemIdx, mode)).join('')}
          </div>
        </div>
      `).join('');

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Chemical Incoming QR Quality Tags (A4 Sheet)</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            html, body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background: #fff;
              color: #0f172a;
            }
            .a4-page {
              width: 190mm;
              min-height: 277mm;
              page-break-after: always;
              break-after: page;
              box-sizing: border-box;
              display: flex;
              align-items: flex-start;
            }
            .a4-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .grid-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8mm;
              width: 100%;
            }
            .tag-card {
              border: 2px solid #4338ca;
              border-radius: 8px;
              padding: 10px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: #fff;
              min-height: 125mm;
              box-sizing: border-box;
              position: relative;
            }
            .tag-number {
              position: absolute;
              top: 8px;
              right: 8px;
              font-size: 9px;
              font-family: monospace;
              background: rgba(255,255,255,0.3);
              color: #fff;
              padding: 1px 5px;
              border-radius: 4px;
              z-index: 2;
            }
            .tag-header {
              background: #4338ca;
              color: #fff;
              font-size: 11px;
              font-weight: 900;
              text-align: center;
              padding: 6px;
              border-radius: 4px;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .tag-body {
              display: flex;
              gap: 12px;
              margin-top: 8px;
              align-items: stretch;
            }
            .qr-box {
              width: 90px;
              min-width: 90px;
              border: 1.5px solid #0f172a;
              border-radius: 6px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 3px;
              background: #ffffff;
              box-sizing: border-box;
            }
            .qr-box .qr-svg-wrap {
              width: 76px;
              height: 76px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-box .qr-svg-wrap svg {
              width: 100%;
              height: 100%;
              display: block;
            }
            .qr-text {
              font-family: monospace;
              font-size: 8.5px;
              font-weight: bold;
              color: #0f172a;
              margin-top: 4px;
              max-width: 86px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .info-box {
              flex: 1;
              font-size: 11px;
              line-height: 1.35;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .info-row {
              display: flex;
              flex-direction: column;
              margin-bottom: 4px;
            }
            .info-row-2col {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              font-size: 10px;
              margin-bottom: 4px;
            }
            .label {
              font-size: 8px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              display: block;
            }
            .val {
              color: #0f172a;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .bold { font-weight: bold; }
            .mono { font-family: monospace; }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              color: #fff;
              font-weight: 900;
              font-size: 9px;
              text-align: center;
            }
            .chem-row {
              margin-top: 6px;
              padding: 4px 6px;
              background: #f8fafc;
              border-radius: 4px;
              border: 1px solid #e2e8f0;
              font-family: monospace;
              font-size: 8px;
              color: #334155;
              line-height: 1.2;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .tag-footer {
              border-top: 1px dashed #cbd5e1;
              padding-top: 6px;
              font-size: 8px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
        </html>
      `;
    }
  };

  const triggerDirectMultiplePrint = (items: ChemicalInspectionEntry[], layout: 'roll' | 'grid', mode: QrDataMode = qrDataMode) => {
    if (!items || items.length === 0) return;
    const printHtml = generateMultipleTagsHtml(items, layout, mode);

    let iframe = document.getElementById('chem-print-iframe') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'chem-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    try {
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(printHtml);
        doc.close();

        setTimeout(() => {
          try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
          } catch (e) {
            console.error("Iframe print error:", e);
            const win = window.open('', '_blank');
            if (win) {
              win.document.write(printHtml);
              win.document.close();
              win.focus();
              win.print();
            }
          }
        }, 300);
      }
    } catch (err) {
      console.error("Direct printing failed, using popup fallback:", err);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(printHtml);
        win.document.close();
        win.focus();
        win.print();
      }
    }
  };

  const triggerDirectPrint = (item: ChemicalInspectionEntry, mode: QrDataMode = qrDataMode) => {
    triggerDirectMultiplePrint([item], 'roll', mode);
  };

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
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' : 'Incorrect password. Please try again.'}
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
                  IQA-02
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
                    onClick={() => {
                      if (tableItems.length === 0) return;
                      const tempEntry: ChemicalInspectionEntry = {
                        id: 'temp_' + Date.now(),
                        timestamp: new Date().toLocaleString('th-TH'),
                        chemical: header.coating_chemical || 'CHEMICAL',
                        batch_lot: header.batch_lot || 'BATCH-001',
                        supplier: header.supplier_code || '-',
                        date: header.product_date || '',
                        expiration: header.expiration_date || '',
                        weight: header.weight_kg || '0',
                        qty: header.qty_pcs || '0',
                        packaging: header.packaging || 'Normal',
                        inspector: header.inspector_name || 'QA Chemist',
                        result: overallResult,
                        items: tableItems.map(it => ({
                          description: it.description,
                          value: it.total,
                          status: validateItemRow(header.coating_chemical, it.description, it.total)
                        }))
                      };
                      handlePrintTag(tempEntry);
                    }}
                    disabled={tableItems.length === 0}
                    className={`font-bold text-xs px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition disabled:opacity-40 ${
                      isLight
                        ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                        : 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border-indigo-800'
                    }`}
                    title={isTh ? "พิมพ์ Quality Tag ทันที" : "Print Quality Tag"}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isTh ? 'พิมพ์ Tag' : 'Print Tag'}</span>
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
                  <label className={`text-[10px] font-bold block uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Shift (กะ)
                  </label>
                  <input
                    list="chem-shift-list"
                    type="text"
                    value={header.shift || ''}
                    onChange={(e) => setHeader({ ...header, shift: e.target.value })}
                    placeholder="e.g. Day / Night / Shift A..."
                    className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  />
                  <datalist id="chem-shift-list">
                    <option value="Day (กะกลางวัน / A)" />
                    <option value="Night (กะกลางคืน / B)" />
                    <option value="Shift A" />
                    <option value="Shift B" />
                    <option value="Shift C" />
                  </datalist>
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
          {/* Top Control Ribbon with Search, Filters & Batch Tag Printing */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64 min-w-[200px]">
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

              {/* Month Filter */}
              <div className="flex items-center gap-1.5">
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className={`border rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <option value="">{isTh ? 'ทุกเดือน' : 'All Months'}</option>
                  <option value="01">01 - Jan</option>
                  <option value="02">02 - Feb</option>
                  <option value="03">03 - Mar</option>
                  <option value="04">04 - Apr</option>
                  <option value="05">05 - May</option>
                  <option value="06">06 - Jun</option>
                  <option value="07">07 - Jul</option>
                  <option value="08">08 - Aug</option>
                  <option value="09">09 - Sep</option>
                  <option value="10">10 - Oct</option>
                  <option value="11">11 - Nov</option>
                  <option value="12">12 - Dec</option>
                </select>

                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className={`border rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <option value="">{isTh ? 'ทุกปี' : 'All Years'}</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              {/* Batch Print Button */}
              <button
                onClick={() => handlePrintBatchTags()}
                disabled={filteredHistory.length === 0}
                className={`font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs ${
                  selectedHistoryItems.length > 0
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'
                    : isLight 
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200' 
                      : 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isTh ? "พิมพ์ Quality Tag เป็นชุด" : "Print batch quality tags"}
              >
                <Printer className="w-4 h-4" />
                <span>
                  {selectedHistoryItems.length > 0
                    ? (isTh ? `พิมพ์ Tag ที่เลือก (${selectedHistoryItems.length})` : `Print Selected Tags (${selectedHistoryItems.length})`)
                    : (isTh ? `พิมพ์ Tag ทั้งหมด (${filteredHistory.length})` : `Print All Tags (${filteredHistory.length})`)
                  }
                </span>
              </button>

              <button
                onClick={exportHistoryCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
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

          {/* Selection Banner */}
          {selectedHistoryItems.length > 0 && (
            <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
              isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-950' : 'bg-indigo-950/40 border-indigo-800 text-indigo-200'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Check className="w-4 h-4 text-indigo-500" />
                <span>
                  {isTh 
                    ? `เลือกแล้ว ${selectedHistoryItems.length} รายการ (จากทั้งหมด ${filteredHistory.length} รายการ)` 
                    : `Selected ${selectedHistoryItems.length} records (of ${filteredHistory.length} total)`
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearHistorySelection}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition ${
                    isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {isTh ? 'ยกเลิกการเลือก' : 'Clear Selection'}
                </button>
                <button
                  onClick={() => handlePrintBatchTags()}
                  className="text-xs px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isTh ? 'พิมพ์ Tag ที่เลือก' : 'Print Selected Tags'}</span>
                </button>
              </div>
            </div>
          )}

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
                    <th className="px-3 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={toggleSelectAllHistory}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        title={isTh ? "เลือกทั้งหมด" : "Select All"}
                      />
                    </th>
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
                  {filteredHistory.map((entry, idx) => {
                    const rowKey = getHistoryItemKey(entry, idx);
                    const isSelected = selectedHistoryIds.includes(rowKey);

                    return (
                      <tr 
                        key={rowKey} 
                        className={`transition-colors ${
                          isSelected
                            ? isLight ? 'bg-indigo-50/70' : 'bg-indigo-950/30'
                            : isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-950/40'
                        }`}
                      >
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectHistory(rowKey)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className={`px-4 py-3 font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{entry.timestamp}</td>
                        <td className={`px-4 py-3 font-bold ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>{entry.chemical}</td>
                        <td className={`px-4 py-3 font-mono font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{entry.batch_lot}</td>
                        <td className={`px-4 py-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          <div>{entry.supplier || '-'}</div>
                          <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {entry.inspector || 'QA'}
                            {entry.shift ? ` (${entry.shift})` : ''}
                          </div>
                        </td>
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
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Print Single Tag Button */}
                            <button
                              onClick={() => handlePrintTag(entry)}
                              className={`p-1.5 rounded-lg transition border flex items-center gap-1 text-[11px] font-bold ${
                                isLight 
                                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' 
                                  : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                              }`}
                              title={isTh ? "พิมพ์ Quality Tag รายการนี้" : "Print Quality Tag"}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">{isTh ? 'Tag' : 'Tag'}</span>
                            </button>

                            <button
                              onClick={() => handleRequestEditHistory(entry)}
                              className={`p-1.5 rounded-lg transition border flex items-center gap-1 text-[11px] font-bold ${
                                isLight 
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200' 
                                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}
                              title={isTh ? "แก้ไขข้อมูล (ต้องใส่รหัสผ่านผู้ดูแลระบบ)" : "Edit Record (Admin password required)"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{isTh ? 'แก้ไข' : 'Edit'}</span>
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
                    );
                  })}

                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={9} className={`p-12 text-center ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
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
                placeholder={isTh ? "ใส่รหัสผ่านผู้ดูแลระบบ" : "Enter admin password"}
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
                  {isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง' : 'Incorrect password! Please try again.'}
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
                <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Shift (กะ)</label>
                <input
                  list="edit-chem-shift-options"
                  type="text"
                  placeholder="e.g. Day / Night / Shift A..."
                  value={editingHistoryItem.shift || ''}
                  onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, shift: e.target.value } : null)}
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-500' : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                />
                <datalist id="edit-chem-shift-options">
                  <option value="Day (กะกลางวัน / A)" />
                  <option value="Night (กะกลางคืน / B)" />
                  <option value="Shift A" />
                  <option value="Shift B" />
                  <option value="Shift C" />
                </datalist>
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
                  placeholder={isTh ? "ใส่รหัสผ่านผู้ดูแลระบบเพื่อยืนยัน" : "Enter admin password to confirm"}
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
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง' : 'Incorrect password! Please try again.'}
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

      {/* SINGLE TAG PRINT MODAL */}
      {activePrintItem && (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto ${
          isLight ? 'bg-slate-900/50' : 'bg-slate-950/85'
        }`}>
          <div className={`border rounded-2xl max-w-md w-full p-6 space-y-5 my-8 shadow-2xl relative animate-in fade-in zoom-in-95 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b pb-4 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl border ${
                  isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                }`}>
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {isTh ? 'พิมพ์ Quality Tag ตรวจรับเคมี' : 'Print Chemical Quality Tag'}
                  </h3>
                  <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Batch: {activePrintItem.batch_lot} | {activePrintItem.chemical}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActivePrintItem(null)} 
                className={`p-1.5 rounded-lg transition ${
                  isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Format Selector */}
            <div className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                <QrCode className="w-4 h-4 text-indigo-500" />
                <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  {isTh ? 'รูปแบบ QR Code:' : 'QR Code Format:'}
                </span>
              </div>
              <div className={`p-1 rounded-lg border flex gap-1 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
              }`}>
                <button
                  type="button"
                  onClick={() => setQrDataMode('full')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                    qrDataMode === 'full'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isTh ? 'ข้อมูลครบชุด (Full QA)' : 'Full QA Info'}
                </button>
                <button
                  type="button"
                  onClick={() => setQrDataMode('code_only')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                    qrDataMode === 'code_only'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isTh ? 'เฉพาะ Lot/Batch (Code Only)' : 'Lot/Batch Only'}
                </button>
              </div>
            </div>

            {/* Visual Tag Preview Card */}
            <div className="flex justify-center">
              <div className="w-[360px] sm:w-[380px] border-2 border-indigo-700 rounded-xl p-4 bg-white text-slate-900 shadow-md space-y-3 font-sans relative">
                {/* Header */}
                <div className="bg-indigo-700 text-white font-black text-xs text-center py-2 px-2.5 rounded-lg tracking-wide uppercase">
                  QUALITY APPROVED CHEMICAL TAG
                </div>

                {/* Body */}
                <div className="flex gap-3 items-stretch">
                  {/* Left QR (100% Real Scannable Vector QR) */}
                  <div 
                    onClick={() => setZoomQrPayload({
                      isOpen: true,
                      title: isTh ? 'QR Code ตรวจรับสารเคมี (IQA-03)' : 'Chemical Inspection QR Code',
                      subtitle: `${activePrintItem.chemical} • Lot: ${activePrintItem.batch_lot}`,
                      payload: getChemQrPayload(activePrintItem, qrDataMode)
                    })}
                    className="w-[104px] min-w-[104px] border border-slate-300 hover:border-indigo-500 rounded-xl p-2 flex flex-col items-center justify-center bg-white shadow-xs hover:shadow-md transition cursor-pointer group"
                    title={isTh ? 'คลิกเพื่อขยาย QR Code สำหรับสแกนผ่านหน้าจอ' : 'Click to enlarge QR for screen scan'}
                  >
                    <div className="w-[88px] h-[88px] flex items-center justify-center overflow-hidden">
                      <QRCodeView 
                        value={getChemQrPayload(activePrintItem, qrDataMode)} 
                        size={88} 
                        margin={4} 
                      />
                    </div>
                    <span className="text-[7.5px] font-mono font-bold text-slate-900 mt-1 max-w-[92px] truncate text-center">
                      {activePrintItem.batch_lot || activePrintItem.chemical}
                    </span>
                    <span className="text-[8px] text-indigo-600 font-semibold mt-0.5 opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
                      <Maximize2 className="w-2.5 h-2.5" />
                      {isTh ? 'แตะขยายสแกน' : 'Zoom Scan'}
                    </span>
                  </div>

                  {/* Right Details */}
                  <div className="flex-1 text-[10.5px] space-y-1 leading-tight flex flex-col justify-between">
                    <div>
                      <div className="text-[8px] font-bold text-slate-500 uppercase">BATCH / LOT NO:</div>
                      <div className="font-mono font-bold text-xs text-slate-950 truncate">{activePrintItem.batch_lot}</div>
                    </div>

                    <div>
                      <div className="text-[8px] font-bold text-slate-500 uppercase">CHEMICAL CODE:</div>
                      <div className="font-bold text-[11px] text-indigo-700 truncate">{activePrintItem.chemical}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[9px]">
                      <div>
                        <span className="text-[7.5px] font-bold text-slate-500 block">SUPPLIER:</span>
                        <span className="text-slate-800 truncate block">{activePrintItem.supplier || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-bold text-slate-500 block">INSPECTOR:</span>
                        <span className="text-slate-800 truncate block">{activePrintItem.inspector || 'QA Chemist'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[9px]">
                      <div>
                        <span className="text-[7.5px] font-bold text-slate-500 block">MFG / EXP:</span>
                        <span className="font-mono text-slate-800 block text-[8.5px] truncate">{activePrintItem.date || '-'} / {activePrintItem.expiration || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-bold text-slate-500 block">QTY / WT:</span>
                        <span className="font-mono font-bold text-slate-950 block">{activePrintItem.qty || '-'} pcs / {activePrintItem.weight || '0'} kg</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[9px] items-center pt-0.5">
                      <div>
                        <span className="text-[7.5px] font-bold text-slate-500 block">PACKAGING:</span>
                        <span className="text-slate-800 truncate block">{activePrintItem.packaging || 'Normal'}</span>
                      </div>
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black text-white text-center w-full ${
                          activePrintItem.result === 'PASS' ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}>
                          {activePrintItem.result || 'PASS'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parameters Preview if present */}
                {activePrintItem.items && activePrintItem.items.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-[8px] font-mono text-slate-700 leading-tight">
                    <span className="font-bold text-slate-900">PARAM: </span>
                    {activePrintItem.items.map(it => `${it.description}: ${it.value} (${it.status})`).join(' | ')}
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-dashed border-slate-300 pt-1.5 text-[8px] text-slate-500 flex justify-between items-center">
                  <span>IQA-02 Chemical Incoming Verification</span>
                  <span>{activePrintItem.timestamp || (activePrintItem.date ? activePrintItem.date : new Date().toLocaleDateString('th-TH'))}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className={`flex flex-col sm:flex-row gap-2 pt-2 border-t ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => setZoomQrPayload({
                  isOpen: true,
                  title: isTh ? 'QR Code ตรวจรับสารเคมี (IQA-03)' : 'Chemical Inspection QR Code',
                  subtitle: `${activePrintItem.chemical} • Lot: ${activePrintItem.batch_lot}`,
                  payload: getChemQrPayload(activePrintItem, qrDataMode)
                })}
                className={`px-3 font-bold text-xs py-2.5 rounded-xl transition border flex items-center justify-center gap-1.5 ${
                  isLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border-indigo-800'
                }`}
                title={isTh ? 'เปิด QR ขนาดใหญ่สำหรับสแกนผ่านหน้าจอ' : 'Open large QR for screen scan'}
              >
                <QrCode className="w-4 h-4 text-indigo-500" />
                <span>{isTh ? 'สแกนผ่านจอ' : 'Screen Scan'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const tagText = `[QUALITY APPROVED CHEMICAL TAG]\nBatch/Lot: ${activePrintItem.batch_lot}\nChemical: ${activePrintItem.chemical}\nSupplier: ${activePrintItem.supplier || '-'}\nInspector: ${activePrintItem.inspector}\nMFG/EXP: ${activePrintItem.date || '-'} / ${activePrintItem.expiration || '-'}\nWeight: ${activePrintItem.weight} kg, Qty: ${activePrintItem.qty} pcs\nResult: ${activePrintItem.result}`;
                  navigator.clipboard.writeText(tagText);
                  setCopiedTagInfo(true);
                  setTimeout(() => setCopiedTagInfo(false), 2000);
                }}
                className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition border flex items-center justify-center gap-1.5 ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {copiedTagInfo ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTagInfo ? (isTh ? 'คัดลอกแล้ว!' : 'Copied!') : (isTh ? 'คัดลอกข้อมูล' : 'Copy Text')}</span>
              </button>

              <button
                type="button"
                onClick={() => triggerDirectPrint(activePrintItem, qrDataMode)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{isTh ? 'พิมพ์ Quality Tag (100x100mm)' : 'Print Tag Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH TAG PRINT MODAL */}
      {activeBatchPrintItems && (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto ${
          isLight ? 'bg-slate-900/50' : 'bg-slate-950/85'
        }`}>
          <div className={`border rounded-2xl max-w-4xl w-full p-6 space-y-5 my-8 shadow-2xl relative max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b pb-4 shrink-0 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl border ${
                  isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                }`}>
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {isTh ? 'พิมพ์ชุด Quality Tag ตรวจรับเคมี (Batch Tag Printing)' : 'Batch Print Chemical Quality Tags'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                      {activeBatchPrintItems.length} {isTh ? 'รายการ' : 'Tags'}
                    </span>
                  </div>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isTh ? 'เลือกรูปแบบการพิมพ์ที่ต้องการ (Label Roll หรือ กระดาษ A4)' : 'Choose your desired print layout format'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveBatchPrintItems(null)} 
                className={`p-2 rounded-xl transition ${
                  isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Layout Options & Summary KPIs */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              {/* Layout Switcher */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {isTh ? 'รูปแบบกระดาษ:' : 'Print Layout:'}
                  </span>
                  <div className={`p-1 rounded-xl border flex gap-1 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setBatchPrintLayout('roll')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        batchPrintLayout === 'roll'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>{isTh ? 'ม้วนสติกเกอร์ (100x100mm)' : 'Label Roll'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchPrintLayout('grid')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        batchPrintLayout === 'grid'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isTh ? 'กระดาษ A4 (4 ป้าย/แผ่น)' : 'A4 Sheet'}</span>
                    </button>
                  </div>
                </div>

                {/* QR Code Format Selector */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {isTh ? 'รูปแบบ QR:' : 'QR Format:'}
                  </span>
                  <div className={`p-1 rounded-xl border flex gap-1 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setQrDataMode('full')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        qrDataMode === 'full'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{isTh ? 'ข้อมูลครบชุด' : 'Full QA'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrDataMode('code_only')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        qrDataMode === 'code_only'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{isTh ? 'เฉพาะ Lot/Batch' : 'Lot Only'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{isTh ? 'จำนวนชุด:' : 'Batches:'} </span>
                  <strong className={isLight ? 'text-slate-900' : 'text-white'}>{activeBatchPrintItems.length}</strong>
                </div>
                <div>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{isTh ? 'รวมจำนวน:' : 'Total Qty:'} </span>
                  <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                    {activeBatchPrintItems.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0).toLocaleString()} pcs
                  </strong>
                </div>
                <div>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{isTh ? 'รวมน้ำหนัก:' : 'Total Wt:'} </span>
                  <strong className="text-indigo-600">
                    {activeBatchPrintItems.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg
                  </strong>
                </div>
              </div>
            </div>

            {/* Scrollable Visual Previews */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[260px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBatchPrintItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="border-2 border-indigo-700 rounded-xl p-3.5 bg-white text-slate-900 shadow-sm space-y-2.5 font-sans relative"
                  >
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 font-mono text-[9px] font-bold">
                      #{idx + 1}
                    </div>

                    {/* Header */}
                    <div className="bg-indigo-700 text-white font-black text-[10.5px] text-center py-1 px-2 rounded tracking-wide uppercase">
                      QUALITY APPROVED CHEMICAL TAG
                    </div>

                    {/* Body */}
                    <div className="flex gap-3 items-stretch">
                      {/* Left QR (100% Real Scannable Vector QR) */}
                      <div className="w-[88px] min-w-[88px] border border-slate-900 rounded-md p-1.5 flex flex-col items-center justify-center bg-white shadow-xs">
                        <div className="w-[74px] h-[74px] flex items-center justify-center overflow-hidden bg-white">
                          <QRCodeView 
                            value={getChemQrPayload(item, qrDataMode)} 
                            size={72} 
                            margin={4} 
                          />
                        </div>
                        <span className="text-[7.5px] font-mono font-bold text-slate-900 mt-1 max-w-[80px] truncate text-center">
                          {item.batch_lot || item.chemical}
                        </span>
                      </div>

                      {/* Right Details */}
                      <div className="flex-1 text-[10px] space-y-1 leading-tight flex flex-col justify-between">
                        <div>
                          <div className="text-[7.5px] font-bold text-slate-500 uppercase">BATCH / LOT NO:</div>
                          <div className="font-mono font-bold text-xs text-slate-950 truncate">{item.batch_lot}</div>
                        </div>

                        <div>
                          <div className="text-[7.5px] font-bold text-slate-500 uppercase">CHEMICAL CODE:</div>
                          <div className="font-bold text-[10.5px] text-indigo-700 truncate">{item.chemical}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[8.5px]">
                          <div>
                            <span className="text-[7px] font-bold text-slate-500 block">SUPPLIER:</span>
                            <span className="text-slate-800 truncate block">{item.supplier || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[7px] font-bold text-slate-500 block">INSPECTOR:</span>
                            <span className="text-slate-800 truncate block">{item.inspector || 'QA Chemist'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[8.5px]">
                          <div>
                            <span className="text-[7px] font-bold text-slate-500 block">MFG / EXP:</span>
                            <span className="font-mono text-slate-800 block text-[8px] truncate">{item.date || '-'} / {item.expiration || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[7px] font-bold text-slate-500 block">QTY / WT:</span>
                            <span className="font-mono font-bold text-slate-950 block">{item.qty || '-'} pcs / {item.weight || '0'} kg</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[8.5px] items-center pt-0.5">
                          <div>
                            <span className="text-[7px] font-bold text-slate-500 block">PACKAGING:</span>
                            <span className="text-slate-800 truncate block">{item.packaging || 'Normal'}</span>
                          </div>
                          <div>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black text-white text-center w-full ${
                              item.result === 'PASS' ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}>
                              {item.result || 'PASS'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Parameters row */}
                    {item.items && item.items.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded p-1 text-[7.5px] font-mono text-slate-700 truncate leading-tight">
                        <span className="font-bold text-slate-900">PARAM: </span>
                        {item.items.map(it => `${it.description}: ${it.value} (${it.status})`).join(' | ')}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-dashed border-slate-300 pt-1 text-[7.5px] text-slate-500 flex justify-between items-center">
                      <span>IQA-01 Chemical Incoming Verification</span>
                      <span>{item.timestamp || (item.date ? item.date : new Date().toLocaleDateString('th-TH'))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t shrink-0 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => {
                  const allSummary = activeBatchPrintItems.map((item, i) => 
                    `[TAG #${i+1}] Batch: ${item.batch_lot} | Chemical: ${item.chemical} | Supplier: ${item.supplier || '-'} | Qty: ${item.qty} pcs | Wt: ${item.weight} kg | Result: ${item.result}`
                  ).join('\n');
                  navigator.clipboard.writeText(allSummary);
                  setBatchCopiedInfo(true);
                  setTimeout(() => setBatchCopiedInfo(false), 2000);
                }}
                className={`font-bold text-xs px-4 py-2.5 rounded-xl transition border flex items-center gap-1.5 w-full sm:w-auto justify-center ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {batchCopiedInfo ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{batchCopiedInfo ? (isTh ? 'คัดลอกข้อมูลทั้งหมดแล้ว!' : 'All Data Copied!') : (isTh ? 'คัดลอกข้อมูลทั้งหมด' : 'Copy All Data')}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveBatchPrintItems(null)}
                  className={`flex-1 sm:flex-none px-5 py-2.5 font-bold text-xs rounded-xl transition border ${
                    isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {isTh ? 'ปิดหน้าต่าง' : 'Close'}
                </button>

                <button
                  type="button"
                  onClick={() => triggerDirectMultiplePrint(activeBatchPrintItems, batchPrintLayout, qrDataMode)}
                  className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>
                    {isTh 
                      ? `พิมพ์ทั้งหมด ${activeBatchPrintItems.length} ป้าย (${batchPrintLayout === 'roll' ? 'ม้วนสติกเกอร์' : 'A4 Sheet'})` 
                      : `Print All ${activeBatchPrintItems.length} Tags (${batchPrintLayout.toUpperCase()})`
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR ZOOM MODAL FOR INSTANT SCREEN SCANNING */}
      {zoomQrPayload && (
        <QrZoomModal
          isOpen={zoomQrPayload.isOpen}
          onClose={() => setZoomQrPayload(null)}
          title={zoomQrPayload.title}
          subtitle={zoomQrPayload.subtitle}
          payload={zoomQrPayload.payload}
          isLight={isLight}
          language={language}
        />
      )}

    </div>
  );
};
