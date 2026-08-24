import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
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
  Beaker, 
  Layers, 
  Settings, 
  Plus, 
  ChevronDown, 
  Edit3,
  CheckSquare,
  Square,
  ClipboardList,
  Printer,
  BarChart3,
  PieChart,
  Activity,
  ScanLine,
  UserCheck,
  Search,
  Calendar,
  Filter,
  Truck,
  Palette,
  Lock,
  ArrowLeft,
  Zap,
  Check,
  PackageCheck,
  Sparkles,
  QrCode,
  X,
  Sun,
  Moon
} from 'lucide-react';

import { 
  BilletInspectionItem, 
  GradeSpecMap, 
  ChemElementKey, 
  Language, 
  InspectionActivity,
  ThemeMode
} from '../types';
import { analyzeBilletCertClient, getGeminiApiKey } from '../services/geminiClient';

interface BilletIncomingAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

const chemElements: ChemElementKey[] = ["Si", "Fe", "Cu", "Mn", "Mg", "Cr", "Zn", "Ti", "Pb", "Cd", "Al"];
const appId = "Billet Incoming Inspection (IQA-01)";

const DEFAULT_GRADE_SPECS: GradeSpecMap = {
  "6063": {
    color: "#4f46e5", // Indigo
    elements: {
      Si: { min: 0.20, max: 0.60 },
      Fe: { min: 0.00, max: 0.35 },
      Cu: { min: 0.00, max: 0.10 },
      Mn: { min: 0.00, max: 0.10 },
      Mg: { min: 0.45, max: 0.90 },
      Cr: { min: 0.00, max: 0.10 },
      Zn: { min: 0.00, max: 0.10 },
      Ti: { min: 0.00, max: 0.10 },
      Pb: { min: 0.00, max: 0.05 },
      Cd: { min: 0.00, max: 0.01 },
      Al: { min: 97.50, max: 99.50 }
    }
  },
  "6061": {
    color: "#0284c7", // Sky blue
    elements: {
      Si: { min: 0.40, max: 0.80 },
      Fe: { min: 0.00, max: 0.70 },
      Cu: { min: 0.15, max: 0.40 },
      Mn: { min: 0.00, max: 0.15 },
      Mg: { min: 0.80, max: 1.20 },
      Cr: { min: 0.04, max: 0.35 },
      Zn: { min: 0.00, max: 0.25 },
      Ti: { min: 0.00, max: 0.15 },
      Pb: { min: 0.00, max: 0.05 },
      Cd: { min: 0.00, max: 0.01 },
      Al: { min: 95.80, max: 98.60 }
    }
  },
  "6005": {
    color: "#10b981", // Emerald
    elements: {
      Si: { min: 0.60, max: 0.90 },
      Fe: { min: 0.00, max: 0.35 },
      Cu: { min: 0.00, max: 0.10 },
      Mn: { min: 0.00, max: 0.10 },
      Mg: { min: 0.40, max: 0.60 },
      Cr: { min: 0.00, max: 0.10 },
      Zn: { min: 0.00, max: 0.10 },
      Ti: { min: 0.00, max: 0.10 },
      Pb: { min: 0.00, max: 0.05 },
      Cd: { min: 0.00, max: 0.01 },
      Al: { min: 97.00, max: 99.00 }
    }
  },
  "6082": {
    color: "#f59e0b", // Amber
    elements: {
      Si: { min: 0.70, max: 1.30 },
      Fe: { min: 0.00, max: 0.50 },
      Cu: { min: 0.00, max: 0.10 },
      Mn: { min: 0.40, max: 1.00 },
      Mg: { min: 0.60, max: 1.20 },
      Cr: { min: 0.00, max: 0.25 },
      Zn: { min: 0.00, max: 0.20 },
      Ti: { min: 0.00, max: 0.10 },
      Pb: { min: 0.00, max: 0.05 },
      Cd: { min: 0.00, max: 0.01 },
      Al: { min: 95.20, max: 98.30 }
    }
  }
};

const INITIAL_HISTORY: BilletInspectionItem[] = [
  {
    id: "hist-001",
    heat_number: "HEAT-2026-9011",
    billet_size: "5 inch (127 mm)",
    grade: "6063",
    supplier_name: "Siam Aluminum Industry",
    inspector_name: "Anucha S. (IQC Inspector)",
    batch_no: "BATCH-A-442",
    invoice_no: "INV-2026-0801",
    diameter: "127.2 mm",
    length: "6000 mm",
    bending: "< 1 mm/m",
    appearance: "Passed / Smooth Surface",
    xrf: "Verified Pass",
    quantity_pcs: 140,
    weight_kg: 4200,
    cutting_surface_lt2: true,
    billet_slid_lt25: true,
    defect_2x50x100: false,
    chemical_composition: {
      Si: 0.42, Fe: 0.18, Cu: 0.02, Mn: 0.03, Mg: 0.52, Cr: 0.01, Zn: 0.02, Ti: 0.01, Pb: 0.00, Cd: 0.00, Al: 98.79
    },
    judgement: "PASS",
    timestamp: "04/08/2026, 09:30:15",
    createdAt: Date.now() - 86400000 * 2,
    _month: "08",
    _year: "2026"
  },
  {
    id: "hist-002",
    heat_number: "HEAT-2026-9012",
    billet_size: "6 inch (152 mm)",
    grade: "6061",
    supplier_name: "Metal Tech Extrusions",
    inspector_name: "Somchai R. (IQC Lead)",
    batch_no: "BATCH-B-108",
    invoice_no: "INV-2026-0804",
    diameter: "152.0 mm",
    length: "6000 mm",
    bending: "< 1.5 mm/m",
    appearance: "Passed",
    xrf: "Verified Pass",
    quantity_pcs: 95,
    weight_kg: 3800,
    cutting_surface_lt2: true,
    billet_slid_lt25: true,
    defect_2x50x100: false,
    chemical_composition: {
      Si: 0.65, Fe: 0.32, Cu: 0.24, Mn: 0.08, Mg: 0.95, Cr: 0.12, Zn: 0.05, Ti: 0.03, Pb: 0.00, Cd: 0.00, Al: 97.56
    },
    judgement: "PASS",
    timestamp: "04/08/2026, 14:15:20",
    createdAt: Date.now() - 86400000,
    _month: "08",
    _year: "2026"
  },
  {
    id: "hist-003",
    heat_number: "HEAT-2026-8844",
    billet_size: "5 inch (127 mm)",
    grade: "6063",
    supplier_name: "Global Alloy Supply",
    inspector_name: "Wipawee S. (QA)",
    batch_no: "BATCH-C-990",
    invoice_no: "INV-2026-0798",
    diameter: "128.5 mm",
    length: "5980 mm",
    bending: "2.5 mm/m (High)",
    appearance: "Minor Surface Dent",
    xrf: "Mg Out of Spec",
    quantity_pcs: 60,
    weight_kg: 1800,
    cutting_surface_lt2: false,
    billet_slid_lt25: false,
    defect_2x50x100: true,
    chemical_composition: {
      Si: 0.15, Fe: 0.45, Cu: 0.12, Mn: 0.15, Mg: 0.30, Cr: 0.15, Zn: 0.18, Ti: 0.12, Pb: 0.06, Cd: 0.02, Al: 98.30
    },
    judgement: "FAIL",
    timestamp: "03/08/2026, 11:20:00",
    createdAt: Date.now() - 86400000 * 3,
    _month: "08",
    _year: "2026"
  }
];

export const BilletIncomingApp: React.FC<BilletIncomingAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th',
  theme = 'light',
  onToggleTheme
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'config'>('scan');

  // Scanning & Extracted items
  const [image, setImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<BilletInspectionItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string }>({
    type: 'info',
    message: isTh ? 'พร้อมสำหรับการสกัดข้อมูล Cert (รองรับหลาย Heat No.)' : 'Ready for Cert scanning (Supports multi-heat extraction)'
  });

  // Printing & History
  const [activePrintItem, setActivePrintItem] = useState<BilletInspectionItem | null>(null);
  const [history, setHistory] = useState<BilletInspectionItem[]>(() => {
    const saved = localStorage.getItem('billet_qc_history');
    return saved ? JSON.parse(saved) : INITIAL_HISTORY;
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Spec Configuration State
  const [gradeSpecs, setGradeSpecs] = useState<GradeSpecMap>(() => {
    const saved = localStorage.getItem('billet_qc_grade_specs');
    return saved ? JSON.parse(saved) : DEFAULT_GRADE_SPECS;
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [editingGrade, setEditingGrade] = useState<string>("");
  const [tempGradeName, setTempGradeName] = useState("");

  // History Item Editing State (Protected with password)
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState("");
  const [historyAuthError, setHistoryAuthError] = useState(false);
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<BilletInspectionItem | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<BilletInspectionItem | null>(null);

  // History Item Deletion State (Protected with password admin2026)
  const [isDeleteAuthOpen, setIsDeleteAuthOpen] = useState(false);
  const [deleteAuthPassword, setDeleteAuthPassword] = useState("");
  const [deleteAuthError, setDeleteAuthError] = useState(false);
  const [targetDeleteHistoryItem, setTargetDeleteHistoryItem] = useState<BilletInspectionItem | null>(null);
  const [targetDeleteGrade, setTargetDeleteGrade] = useState<string | null>(null);

  // Persist local history
  useEffect(() => {
    localStorage.setItem('billet_qc_history', JSON.stringify(history));
  }, [history]);

  // Persist specs
  useEffect(() => {
    localStorage.setItem('billet_qc_grade_specs', JSON.stringify(gradeSpecs));
  }, [gradeSpecs]);

  // Spec Matcher
  const findMatchingSpec = (scannedGrade: string) => {
    if (!scannedGrade) return null;
    const normalized = scannedGrade.toUpperCase().trim();
    if (gradeSpecs[normalized]) return gradeSpecs[normalized];
    const prefix = normalized.substring(0, 4);
    const matchingKey = Object.keys(gradeSpecs).find(key => 
      key.toUpperCase().substring(0, 4) === prefix
    );
    return matchingKey ? gradeSpecs[matchingKey] : null;
  };

  // Judgement Calculator
  const performJudgement = (item: BilletInspectionItem): 'PASS' | 'FAIL' | 'NO SPEC' => {
    const spec = findMatchingSpec(item.grade);
    if (!spec) return "NO SPEC";
    let isOk = true;
    chemElements.forEach(el => {
      const val = parseFloat(String(item.chemical_composition?.[el] ?? NaN));
      const elementSpec = spec.elements[el];
      if (!isNaN(val) && elementSpec) {
        if (val < elementSpec.min || val > elementSpec.max) isOk = false;
      }
    });
    // Check visual defects
    if (item.defect_2x50x100) isOk = false;
    return isOk ? "PASS" : "FAIL";
  };

  // Upload file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let mime = file.type;
      if (!mime || mime === 'application/octet-stream') {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') mime = 'application/pdf';
        else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
        else if (ext === 'png') mime = 'image/png';
        else if (ext === 'webp') mime = 'image/webp';
        else mime = 'image/png';
      }
      setImageMimeType(mime);

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBase64Image(result.split(',')[1]);
        setImage(result);
        setExtractedItems([]);
        setSelectedIndices([]);
        setStatus({
          type: 'info',
          message: isTh ? 'โหลดเอกสารสำเร็จ กด "วิเคราะห์ด้วย Gemini AI" เพื่อเริ่มสกัดข้อมูล' : 'Document uploaded. Click "Analyze Document" to extract.'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Load Demo Certificate Data
  const loadDemoData = () => {
    const demoItems: BilletInspectionItem[] = [
      {
        heat_number: `H2026-${Math.floor(8000 + Math.random() * 1000)}`,
        billet_size: '5 inch (127 mm)',
        grade: '6063',
        supplier_name: 'Siam Aluminum Co., Ltd.',
        inspector_name: 'Anucha S. (IQC)',
        batch_no: `BATCH-A-${Math.floor(100 + Math.random() * 900)}`,
        invoice_no: `INV-2026-${Math.floor(500 + Math.random() * 500)}`,
        diameter: '127.0 mm',
        length: '6000 mm',
        bending: '< 1.0 mm/m',
        appearance: 'Good / Smooth Finish',
        xrf: 'Pass',
        quantity_pcs: 120,
        weight_kg: 3600,
        cutting_surface_lt2: true,
        billet_slid_lt25: true,
        defect_2x50x100: false,
        chemical_composition: {
          Si: 0.45, Fe: 0.20, Cu: 0.02, Mn: 0.03, Mg: 0.55, Cr: 0.01, Zn: 0.02, Ti: 0.01, Pb: 0.00, Cd: 0.00, Al: 98.71
        }
      },
      {
        heat_number: `H2026-${Math.floor(8000 + Math.random() * 1000)}`,
        billet_size: '6 inch (152 mm)',
        grade: '6061',
        supplier_name: 'Metal Tech Extrusions',
        inspector_name: 'Somchai R. (IQC)',
        batch_no: `BATCH-B-${Math.floor(100 + Math.random() * 900)}`,
        invoice_no: `INV-2026-${Math.floor(500 + Math.random() * 500)}`,
        diameter: '152.0 mm',
        length: '6000 mm',
        bending: '< 1.2 mm/m',
        appearance: 'Good',
        xrf: 'Pass',
        quantity_pcs: 90,
        weight_kg: 3600,
        cutting_surface_lt2: true,
        billet_slid_lt25: true,
        defect_2x50x100: false,
        chemical_composition: {
          Si: 0.62, Fe: 0.28, Cu: 0.22, Mn: 0.08, Mg: 0.92, Cr: 0.10, Zn: 0.04, Ti: 0.02, Pb: 0.00, Cd: 0.00, Al: 97.72
        }
      }
    ];

    setExtractedItems(demoItems);
    setSelectedIndices(demoItems.map((_, i) => i));
    setStatus({
      type: 'success',
      message: isTh ? 'โหลดเอกสารตัวอย่างสกัดข้อมูลสำเร็จ 2 รายการ' : 'Loaded 2 demo Heat No. records successfully'
    });
  };

  // Extract via Client-side Gemini API (Frontend Direct)
  const extractData = async () => {
    if (!base64Image) {
      alert(isTh ? 'กรุณาอัปโหลดรูปภาพหรือไฟล์เอกสาร Certificate ก่อนทำการสแกน' : 'Please upload a Certificate document before analyzing.');
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'info', message: isTh ? 'AI (Client-side) กำลังวิเคราะห์เอกสาร Certificate...' : 'AI (Client-side) analyzing Mill Test Certificate...' });

    try {
      const sanitizedItems = await analyzeBilletCertClient(base64Image, imageMimeType);
      
      if (sanitizedItems && sanitizedItems.length > 0) {
        setExtractedItems(sanitizedItems);
        setSelectedIndices(sanitizedItems.map((_, i) => i));
        setStatus({
          type: 'success',
          message: isTh ? `สกัดข้อมูลสำเร็จ (Client-side) พบ Heat Numbers ทั้งหมด ${sanitizedItems.length} รายการ` : `Successfully extracted ${sanitizedItems.length} Heat Numbers (Client-side)`
        });
      } else {
        throw new Error(isTh ? 'ไม่พบข้อมูล Heat Number ในเอกสารนี้' : 'No Heat Number items detected in this document');
      }
    } catch (err: any) {
      console.error('Client-side API extraction error:', err);
      setStatus({
        type: 'error',
        message: isTh ? `เกิดข้อผิดพลาดในการสกัดข้อมูล: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}` : `Extraction error: ${err.message || 'Please try again'}`
      });
      alert(isTh ? `ไม่สามารถสกัดข้อมูลจากเอกสารได้: ${err.message || 'โปรดตรวจสอบความชัดเจนของไฟล์เอกสาร หรือตรวจสอบ API Key'}` : `Could not extract data: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const updateItemField = (index: number, field: keyof BilletInspectionItem, value: any) => {
    setExtractedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateChemField = (itemIndex: number, element: ChemElementKey, value: any) => {
    setExtractedItems(prev => {
      const updated = [...prev];
      const chem = { ...(updated[itemIndex].chemical_composition || {}) };
      chem[element] = value;
      updated[itemIndex].chemical_composition = chem;
      return updated;
    });
  };

  // Save Selected items to history
  const saveSelectedToHistory = () => {
    if (selectedIndices.length === 0) return;
    const itemsToSave = extractedItems.filter((_, idx) => selectedIndices.includes(idx));
    const now = new Date();
    
    const newEntries: BilletInspectionItem[] = itemsToSave.map(item => {
      const jg = performJudgement(item);
      const entryId = `billet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Log activity back to main QA system portal activity feed if callback present
      if (onLogNewActivity) {
        const resultDesc = jg === 'PASS' 
          ? 'PASS (Chemical composition and dimensions meet Grade Spec)' 
          : `FAIL / Out of Spec: Chemical composition or physical defect on Heat ${item.heat_number} (${item.grade})`;

        onLogNewActivity({
          id: entryId,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'IQC-01',
          moduleTitleTh: 'ตรวจรับวัตถุดิบและชิ้นส่วน Billet',
          moduleTitleEn: 'Billet Incoming Inspection',
          inspector: item.inspector_name || 'IQC Inspector',
          batchLot: `${item.heat_number} (${item.grade})`,
          result: jg === 'PASS' ? 'PASS' : 'REJECT',
          defectCount: jg === 'FAIL' ? 1 : 0,
          remarks: resultDesc,
          coilNo: item.heat_number || item.batch_no || 'HEAT-N/A',
          profile: `Billet ${item.grade} (${item.billet_size || 'Size N/A'})`,
          process: 'IQC-01 Billet Incoming Inspection',
          inspectionDate: item.timestamp || now.toLocaleString('sv-SE').slice(0, 16),
          inspectionResult: resultDesc
        });
      }

      return {
        ...item,
        id: entryId,
        judgement: jg,
        timestamp: now.toLocaleString('th-TH'),
        createdAt: now.getTime(),
        _month: (now.getMonth() + 1).toString().padStart(2, '0'),
        _year: now.getFullYear().toString()
      };
    });

    setHistory(prev => [...newEntries, ...prev]);

    // Clear saved items from active pool
    const remaining = extractedItems.filter((_, idx) => !selectedIndices.includes(idx));
    setExtractedItems(remaining);
    setSelectedIndices([]);
    if (remaining.length === 0) {
      setImage(null);
      setBase64Image(null);
    }

    setStatus({
      type: 'success',
      message: isTh ? `บันทึกข้อมูล Billet เข้าสู่ประวัติเรียบร้อยแล้ว ${newEntries.length} รายการ (จัดเก็บเฉพาะ Text Data)` : `Saved ${newEntries.length} entries to History (Pure Text Data)`
    });
  };

  // Password Login
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === "admin2026") {
      setIsAdminAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setAdminPasswordInput("");
    }
  };

  // Trigger Edit Record (Requires password authentication)
  const handleRequestEditHistory = (item: BilletInspectionItem) => {
    setTargetEditHistoryItem(item);
    setHistoryAuthPassword("");
    setHistoryAuthError(false);
    setIsHistoryAuthOpen(true);
  };

  // Confirm password and open edit modal
  const handleVerifyHistoryPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (historyAuthPassword === "admin2026") {
      setIsHistoryAuthOpen(false);
      setHistoryAuthError(false);
      if (targetEditHistoryItem) {
        // Deep copy target item for editing
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
    
    // Recalculate judgement based on updated grade/chem
    const updatedJudgement = performJudgement(editingHistoryItem);
    const updatedRecord = {
      ...editingHistoryItem,
      judgement: updatedJudgement
    };

    setHistory(prev => prev.map(item => item.id === updatedRecord.id ? updatedRecord : item));
    setEditingHistoryItem(null);
    setTargetEditHistoryItem(null);
    
    setStatus({
      type: 'success',
      message: isTh ? `แก้ไขข้อมูล Heat No. ${updatedRecord.heat_number} สำเร็จแล้ว` : `Updated Heat No. ${updatedRecord.heat_number} successfully`
    });
  };

  // Trigger Delete Record (Requires password admin2026)
  const handleRequestDeleteHistory = (item: BilletInspectionItem) => {
    setTargetDeleteHistoryItem(item);
    setTargetDeleteGrade(null);
    setDeleteAuthPassword("");
    setDeleteAuthError(false);
    setIsDeleteAuthOpen(true);
  };

  // Trigger Delete Grade (Requires password admin2026)
  const handleRequestDeleteGrade = (gradeName: string) => {
    setTargetDeleteGrade(gradeName);
    setTargetDeleteHistoryItem(null);
    setDeleteAuthPassword("");
    setDeleteAuthError(false);
    setIsDeleteAuthOpen(true);
  };

  // Verify password and perform delete
  const handleVerifyDeletePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteAuthPassword === "admin2026") {
      if (targetDeleteHistoryItem) {
        const heatNo = targetDeleteHistoryItem.heat_number;
        setHistory(prev => prev.filter(h => h.id !== targetDeleteHistoryItem.id));
        setStatus({
          type: 'info',
          message: isTh ? `ลบประวัติการตรวจรับ Heat No. ${heatNo} เรียบร้อยแล้ว` : `Deleted inspection record for Heat No. ${heatNo}`
        });
      } else if (targetDeleteGrade) {
        deleteGrade(targetDeleteGrade);
        setStatus({
          type: 'info',
          message: isTh ? `ลบ Grade Specification ${targetDeleteGrade} เรียบร้อยแล้ว` : `Deleted Grade Spec ${targetDeleteGrade}`
        });
      }
      setIsDeleteAuthOpen(false);
      setDeleteAuthError(false);
      setTargetDeleteHistoryItem(null);
      setTargetDeleteGrade(null);
      setDeleteAuthPassword("");
    } else {
      setDeleteAuthError(true);
      setDeleteAuthPassword("");
    }
  };

  // Config Add / Edit / Delete Grade
  const prepareNewGrade = () => {
    setEditingGrade("NEW_GRADE_PENDING");
    setTempGradeName("");
    const newElements: any = {};
    chemElements.forEach(el => newElements[el] = { min: 0, max: 0.5 });
    setGradeSpecs(prev => ({
      ...prev,
      "NEW_GRADE_PENDING": {
        color: "#6366f1",
        elements: newElements
      }
    }));
  };

  const handleSaveNewGrade = () => {
    if (!tempGradeName.trim()) return;
    const finalKey = tempGradeName.toUpperCase().trim();
    const pendingSpec = gradeSpecs["NEW_GRADE_PENDING"];
    setGradeSpecs(prev => {
      const newState = { ...prev };
      delete newState["NEW_GRADE_PENDING"];
      newState[finalKey] = pendingSpec;
      return newState;
    });
    setEditingGrade(finalKey);
  };

  const updateSpecValue = (element: ChemElementKey, field: 'min' | 'max', value: string) => {
    if (!editingGrade) return;
    setGradeSpecs(prev => ({
      ...prev,
      [editingGrade]: {
        ...prev[editingGrade],
        elements: {
          ...prev[editingGrade].elements,
          [element]: {
            ...(prev[editingGrade].elements[element] || { min: 0, max: 0 }),
            [field]: parseFloat(value) || 0
          }
        }
      }
    }));
  };

  const updateGradeColor = (color: string) => {
    if (!editingGrade) return;
    setGradeSpecs(prev => ({
      ...prev,
      [editingGrade]: {
        ...prev[editingGrade],
        color
      }
    }));
  };

  const deleteGrade = (gradeToDelete: string) => {
    setGradeSpecs(prev => {
      const newState = { ...prev };
      delete newState[gradeToDelete];
      return newState;
    });
    if (editingGrade === gradeToDelete) {
      setEditingGrade("");
    }
  };

  // History Filtered
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        !searchQuery ||
        item.heat_number?.toLowerCase().includes(q) ||
        item.grade?.toLowerCase().includes(q) ||
        item.supplier_name?.toLowerCase().includes(q) ||
        item.inspector_name?.toLowerCase().includes(q) ||
        item.invoice_no?.toLowerCase().includes(q);

      const matchMonth = filterMonth ? item._month === filterMonth : true;
      const matchYear = filterYear ? item._year === filterYear : true;
      return matchSearch && matchMonth && matchYear;
    });
  }, [history, searchQuery, filterMonth, filterYear]);

  // CSV Export
  const exportToCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = [
      "Heat No.", "Size", "Grade", "Judgement", "Batch", "Invoice", "Supplier", 
      "Quantity (pcs)", "Weight (kg)", "Diameter", "Length", "Bending", 
      "Cutting < 2mm", "Slid <= 2.5mm", "Defect OK", "Appearance", "XRF", "Inspector",
      ...chemElements, "Timestamp"
    ];

    const rows = filteredHistory.map(e => [
      e.heat_number, e.billet_size, e.grade, e.judgement,
      e.batch_no, e.invoice_no, e.supplier_name, e.quantity_pcs, e.weight_kg,
      e.diameter, e.length, e.bending,
      e.cutting_surface_lt2 ? 'YES' : 'NO', e.billet_slid_lt25 ? 'YES' : 'NO', e.defect_2x50x100 ? 'NO DEFECT' : 'DEFECT',
      e.appearance, e.xrf, e.inspector_name,
      ...chemElements.map(el => e.chemical_composition?.[el] ?? ''),
      e.timestamp
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(v => `"${v ?? ''}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Billet_QC_Report_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  // Dashboard Metrics
  const dashboardStats = useMemo(() => {
    const total = filteredHistory.length;
    const ok = filteredHistory.filter(h => h.judgement === 'PASS').length;
    const ng = total - ok;
    const okRate = total > 0 ? ((ok / total) * 100).toFixed(1) : "0";

    const gradeSummaryMap: { [grade: string]: { grade: string; count: number; weight: number; pcs: number; heats: Set<string>; invoices: Set<string> } } = {};
    
    filteredHistory.forEach(item => {
      const g = item.grade || 'Unknown';
      if (!gradeSummaryMap[g]) {
        gradeSummaryMap[g] = { grade: g, count: 0, weight: 0, pcs: 0, heats: new Set(), invoices: new Set() };
      }
      gradeSummaryMap[g].count++;
      gradeSummaryMap[g].weight += parseFloat(String(item.weight_kg)) || 0;
      gradeSummaryMap[g].pcs += parseInt(String(item.quantity_pcs)) || 0;
      if (item.heat_number) gradeSummaryMap[g].heats.add(item.heat_number);
      if (item.invoice_no) gradeSummaryMap[g].invoices.add(item.invoice_no);
    });

    return { total, ok, ng, okRate, gradeSummary: Object.values(gradeSummaryMap) };
  }, [filteredHistory]);

  // Print Tag
  const handlePrintTag = (item: BilletInspectionItem) => {
    const spec = findMatchingSpec(item.grade);
    const tagColor = spec?.color || "#4f46e5";
    const jg = item.judgement || performJudgement(item);

    const printWindow = window.open('', '_blank', 'width=500,height=500');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Billet Inspection QR Tag - ${item.heat_number}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; background: #fff; color: #000; margin: 0; }
            .tag-box { border: 3px solid ${tagColor}; border-radius: 12px; padding: 16px; max-w: 360px; margin: 0 auto; }
            .header { background: ${tagColor}; color: #fff; text-align: center; font-weight: bold; padding: 8px; border-radius: 6px; font-size: 16px; letter-spacing: 1px; }
            .body-grid { display: flex; margin-top: 14px; gap: 12px; align-items: center; }
            .qr-placeholder { width: 110px; height: 110px; border: 2px border #000; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; text-align: center; border-radius: 8px; }
            .details { flex: 1; font-size: 11px; line-height: 1.6; }
            .badge { display: inline-block; padding: 3px 8px; font-weight: bold; border-radius: 4px; color: white; background: ${jg === 'PASS' ? '#10b981' : '#ef4444'}; margin-top: 4px; }
            .footer { margin-top: 12px; border-top: 1px border #e2e8f0; padding-top: 6px; font-size: 9px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="tag-box">
            <div class="header">QUALITY APPROVED BILLET TAG</div>
            <div class="body-grid">
              <div class="qr-placeholder">
                <svg width="80" height="80" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="#fff" />
                  <rect x="10" y="10" width="30" height="30" fill="#000"/>
                  <rect x="15" y="15" width="20" height="20" fill="#fff"/>
                  <rect x="20" y="20" width="10" height="10" fill="#000"/>
                  <rect x="60" y="10" width="30" height="30" fill="#000"/>
                  <rect x="65" y="15" width="20" height="20" fill="#fff"/>
                  <rect x="70" y="20" width="10" height="10" fill="#000"/>
                  <rect x="10" y="60" width="30" height="30" fill="#000"/>
                  <rect x="15" y="65" width="20" height="20" fill="#fff"/>
                  <rect x="20" y="70" width="10" height="10" fill="#000"/>
                  <rect x="50" y="50" width="15" height="15" fill="#000"/>
                  <rect x="70" y="70" width="20" height="20" fill="#000"/>
                </svg>
                <span style="font-size: 8px; font-weight: bold; margin-top: 2px;">SCAN QR</span>
              </div>
              <div class="details">
                <div><strong>HEAT NO:</strong> ${item.heat_number}</div>
                <div><strong>GRADE:</strong> <span style="font-size:14px; font-weight:bold; color:${tagColor}">${item.grade}</span></div>
                <div><strong>SIZE:</strong> ${item.billet_size}</div>
                <div><strong>SUPPLIER:</strong> ${item.supplier_name || '-'}</div>
                <div><strong>QTY / WT:</strong> ${item.quantity_pcs || '0'} pcs / ${item.weight_kg || '0'} kg</div>
                <div><strong>INSPECTOR:</strong> ${item.inspector_name || 'QA Team'}</div>
                <div><strong>STATUS:</strong> <span class="badge">${jg}</span></div>
              </div>
            </div>
            <div class="footer">QA Inspection System • IQC-01 Billet Incoming Verification</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 space-y-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Top Application Bar */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className={`p-2.5 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold border ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Return to QA Main Portal"
            >
              <ArrowLeft className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isLight
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-blue-950 text-blue-300 border-blue-800'
                }`}>
                  IQC-01
                </span>
                <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isTh ? 'ระบบตรวจรับวัตถุดิบ Billet (Billet Incoming Inspection)' : 'Billet Incoming Inspection System'}
                </h1>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh 
                  ? 'ตรวจสอบใบรับรองคุณภาพ (Mill Test Cert), วิเคราะห์ส่วนผสมเคมี, ขนาดมิติ และออก QR Code Label' 
                  : 'Mill Test Cert AI OCR, Chemical Spec Verification, Dimension & QR Code Tagging'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge & Theme Toggle */}
        <div className="flex items-center gap-2.5">
          <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border shadow-xs transition ${
            status.type === 'success' 
              ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/80 border-emerald-800 text-emerald-300' 
              : status.type === 'error' 
                ? isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/80 border-rose-800 text-rose-300' 
                : isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-cyan-300'
          }`}>
            <Sparkles className={`w-4 h-4 shrink-0 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            <span>{status.message}</span>
          </div>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {isLight ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span className="hidden sm:inline">{isLight ? 'Dark' : 'Light'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className={`flex space-x-2 border-b pb-2 overflow-x-auto ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <button
          onClick={() => setActiveTab('scan')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'scan'
              ? isLight
                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          <span>{isTh ? '1. สแกน & ตรวจวิเคราะห์ (Scan & Inspect)' : '1. Scan & Inspect'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'history'
              ? isLight
                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{isTh ? '2. สรุปแดชบอร์ด & ประวัติ (Dashboard & History)' : '2. Dashboard & History'}</span>
          {history.length > 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
              isLight
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-slate-950 text-cyan-300 border-cyan-800'
            }`}>
              {history.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'config'
              ? isLight
                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{isTh ? '3. ตั้งค่าเกณฑ์มาตรฐาน (Grade Specs)' : '3. Grade Specs Config'}</span>
        </button>
      </div>

      {/* TAB 1: SCAN & ANALYZE */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Upload Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`p-5 rounded-2xl border space-y-4 shadow-xs sticky top-6 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 shadow-md'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  <Upload className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                  {isTh ? 'อัปโหลดใบรับรอง Mill Test Cert' : 'Upload Mill Test Certificate'}
                </h3>
              </div>

              {/* Upload Drop Area */}
              <div className={`relative border-2 border-dashed rounded-xl p-4 min-h-[220px] flex flex-col items-center justify-center transition ${
                image 
                  ? isLight ? 'border-blue-400 bg-blue-50/30' : 'border-cyan-500/50 bg-slate-950' 
                  : isLight ? 'border-slate-300 hover:border-blue-400 bg-slate-50/50' : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
              }`}>
                {image ? (
                  imageMimeType.startsWith('image/') ? (
                    <img src={image} alt="Cert Preview" className="max-h-[240px] w-full object-contain rounded-lg" />
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <FileText className={`w-12 h-12 mx-auto ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                      <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>PDF Document Loaded</p>
                      <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{isTh ? 'พร้อมวิเคราะห์ด้วย Gemini AI' : 'Ready for Gemini AI Extraction'}</p>
                    </div>
                  )
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <Upload className={`mx-auto w-10 h-10 mb-2 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
                    <p className={`font-semibold text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {isTh ? 'ลากไฟล์รูปภาพหรือ PDF Certificate มาวาง หรือคลิกเพื่ออัปโหลด' : 'Upload Mill Test Cert Image or PDF'}
                    </p>
                    <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                      {isTh ? 'รองรับ PNG, JPG, JPEG, PDF (อ่านค่าส่วนผสมเคมีทุก Heat)' : 'Supports PNG, JPG, JPEG, PDF'}
                    </p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*,.pdf,application/pdf" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  disabled={isProcessing} 
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={extractData}
                  disabled={isProcessing}
                  className={`w-full text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 ${
                    isLight
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-500/20'
                  }`}
                >
                  {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                  <span>{isTh ? 'วิเคราะห์ด้วย Gemini AI (Gemini Extract)' : 'Analyze with Gemini AI'}</span>
                </button>

                <button
                  onClick={loadDemoData}
                  className={`w-full font-medium text-xs py-2 rounded-xl flex items-center justify-center gap-2 transition border ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isTh ? '⚡ โหลดเอกสารตัวอย่าง (Demo Cert Data)' : '⚡ Load Demo Cert Data'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Inspection Results Pool */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  {isTh ? 'รายการ Heat Number ที่รอดำเนินการ' : 'Scanned Inspection Pool'} ({extractedItems.length})
                </h3>
              </div>

              {extractedItems.length > 0 && (
                <button
                  onClick={saveSelectedToHistory}
                  disabled={selectedIndices.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isTh ? `บันทึกรายการที่เลือก (${selectedIndices.length})` : `Save Selected (${selectedIndices.length})`}</span>
                </button>
              )}
            </div>

            {extractedItems.length === 0 && !isProcessing && (
              <div className={`border rounded-2xl p-16 text-center space-y-3 ${
                isLight ? 'bg-white border-slate-200 text-slate-500 shadow-xs' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <Database className={`w-12 h-12 mx-auto ${isLight ? 'text-slate-400' : 'text-slate-700'}`} />
                <p className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                  {isTh ? 'ยังไม่มีรายการ Billet ที่สแกน' : 'No scanned billet items yet'}
                </p>
                <p className={`text-[11px] max-w-sm mx-auto ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  {isTh 
                    ? 'โปรดอัปโหลดรูปภาพใบ Certificate ทางด้านซ้าย หรือกดปุ่ม "⚡ โหลดเอกสารตัวอย่าง" เพื่อเริ่มต้น' 
                    : 'Upload a Mill Test Cert image or click "Load Demo Cert Data" to test.'}
                </p>
              </div>
            )}

            {/* Extracted Item Cards */}
            <div className="space-y-4">
              {extractedItems.map((item, idx) => {
                const isSelected = selectedIndices.includes(idx);
                const spec = findMatchingSpec(item.grade);
                const judgement = performJudgement(item);
                const gradeBorderColor = spec?.color || (isLight ? '#2563eb' : '#38bdf8');

                return (
                  <div 
                    key={idx}
                    className={`relative border rounded-2xl p-5 transition shadow-xs ${
                      isSelected 
                        ? isLight ? 'border-blue-400 bg-white shadow-sm' : 'border-cyan-500/80 bg-slate-900/90' 
                        : isLight ? 'border-slate-200 bg-white/90' : 'border-slate-800 bg-slate-900 opacity-80'
                    }`}
                    style={{ borderLeftWidth: '6px', borderLeftColor: gradeBorderColor }}
                  >
                    {/* Select Checkbox */}
                    <button
                      onClick={() => toggleSelection(idx)}
                      className={`absolute top-4 left-4 p-1 rounded-lg transition ${
                        isSelected 
                          ? isLight ? 'text-blue-600' : 'text-cyan-400' 
                          : isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>

                    {/* Print Tag Action */}
                    <button
                      onClick={() => handlePrintTag(item)}
                      className={`absolute top-4 right-4 p-2 rounded-xl transition border flex items-center gap-1.5 text-xs font-medium ${
                        isLight 
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title="Print Quality Tag"
                    >
                      <Printer className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                      <span className="hidden sm:inline">{isTh ? 'พิมพ์แท็ก QR' : 'Print Tag'}</span>
                    </button>

                    <div className="ml-8 pr-24 sm:pr-28">
                      {/* Top Row: Heat No & Grade Specs */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div>
                          <label className={`text-[10px] font-bold block uppercase mb-1 ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Heat Number
                          </label>
                          <input
                            type="text"
                            value={item.heat_number || ''}
                            onChange={(e) => updateItemField(idx, 'heat_number', e.target.value)}
                            className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none border ${
                              isLight
                                ? 'bg-slate-50 border-slate-300 text-blue-700 focus:border-blue-500'
                                : 'bg-slate-950 border-slate-800 text-cyan-300 focus:border-cyan-500'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`text-[10px] font-bold block uppercase mb-1 ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Grade / Billet Size
                          </label>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              value={item.grade || ''}
                              onChange={(e) => updateItemField(idx, 'grade', e.target.value)}
                              style={{ color: spec?.color }}
                              className={`w-1/2 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none border ${
                                isLight
                                  ? 'bg-slate-50 border-slate-300 focus:border-blue-500'
                                  : 'bg-slate-950 border-slate-800 focus:border-cyan-500'
                              }`}
                            />
                            <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>/</span>
                            <input
                              type="text"
                              value={item.billet_size || ''}
                              onChange={(e) => updateItemField(idx, 'billet_size', e.target.value)}
                              className={`w-1/2 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none border ${
                                isLight
                                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500'
                                  : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-500'
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`text-[10px] font-bold block uppercase mb-1 ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Judgement Status
                          </label>
                          <div className="flex items-center gap-2 pt-1">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                              judgement === 'PASS'
                                ? isLight 
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : isLight
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}>
                              {judgement === 'PASS' ? '✓ PASS' : '✕ FAIL / REJECT'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Logistics Fields */}
                      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 rounded-xl border text-xs ${
                        isLight
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-slate-950/60 border-slate-800/80'
                      }`}>
                        <div>
                          <label className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Supplier</label>
                          <input
                            type="text"
                            value={item.supplier_name || ''}
                            onChange={(e) => updateItemField(idx, 'supplier_name', e.target.value)}
                            className={`w-full rounded px-2 py-1 mt-0.5 border ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-800'
                                : 'bg-slate-900 border-slate-800 text-slate-200'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Invoice / Batch</label>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="INV"
                              value={item.invoice_no || ''}
                              onChange={(e) => updateItemField(idx, 'invoice_no', e.target.value)}
                              className={`w-1/2 rounded px-1.5 py-1 mt-0.5 border ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-800'
                                  : 'bg-slate-900 border-slate-800 text-slate-200'
                              }`}
                            />
                            <input
                              type="text"
                              placeholder="Batch"
                              value={item.batch_no || ''}
                              onChange={(e) => updateItemField(idx, 'batch_no', e.target.value)}
                              className={`w-1/2 rounded px-1.5 py-1 mt-0.5 border ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-800'
                                  : 'bg-slate-900 border-slate-800 text-slate-200'
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Qty (pcs)</label>
                          <input
                            type="number"
                            value={item.quantity_pcs || ''}
                            onChange={(e) => updateItemField(idx, 'quantity_pcs', e.target.value)}
                            className={`w-full rounded px-2 py-1 mt-0.5 font-mono border ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-800'
                                : 'bg-slate-900 border-slate-800 text-slate-200'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Weight (kg)</label>
                          <input
                            type="number"
                            value={item.weight_kg || ''}
                            onChange={(e) => updateItemField(idx, 'weight_kg', e.target.value)}
                            className={`w-full rounded px-2 py-1 mt-0.5 font-mono font-bold border ${
                              isLight
                                ? 'bg-white border-slate-300 text-blue-700'
                                : 'bg-slate-900 border-slate-800 text-cyan-300'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Chemical Elements Matrix */}
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${
                          isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                          Chemical Composition Analysis (%) vs {item.grade || 'Spec'}
                        </span>
                        <div className="grid grid-cols-6 sm:grid-cols-11 gap-1 text-[11px]">
                          {chemElements.map((el) => {
                            const valStr = String(item.chemical_composition?.[el] ?? '');
                            const val = parseFloat(valStr);
                            const elementSpec = spec?.elements[el];
                            let isOut = false;
                            if (elementSpec && !isNaN(val)) {
                              if (val < elementSpec.min || val > elementSpec.max) isOut = true;
                            }

                            return (
                              <div 
                                key={el} 
                                className={`p-1.5 rounded-lg border text-center ${
                                  isOut 
                                    ? isLight ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold' : 'bg-rose-950/80 border-rose-500/80 text-rose-300' 
                                    : isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                                }`}
                              >
                                <span className={`block text-[9px] font-bold mb-0.5 ${
                                  isLight ? 'text-slate-500' : 'text-slate-400'
                                }`}>{el}</span>
                                <input
                                  type="text"
                                  value={valStr}
                                  onChange={(e) => updateChemField(idx, el, e.target.value)}
                                  className="w-full bg-transparent text-center font-mono font-semibold focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: DASHBOARD & HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* KPI Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className={`text-[10px] font-bold uppercase block ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>Total Inspected</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{dashboardStats.total}</span>
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Heats</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-xs ${
              isLight ? 'bg-white border-emerald-200' : 'bg-slate-900 border-emerald-900/40'
            }`}>
              <span className="text-[10px] font-bold text-emerald-600 uppercase block">Judgement OK</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-emerald-600">{dashboardStats.ok}</span>
                <span className="text-xs text-emerald-600">Passed</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-xs ${
              isLight ? 'bg-white border-rose-200' : 'bg-slate-900 border-rose-900/40'
            }`}>
              <span className="text-[10px] font-bold text-rose-600 uppercase block">Judgement NG</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-rose-600">{dashboardStats.ng}</span>
                <span className="text-xs text-rose-600">Rejects</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-xs ${
              isLight ? 'bg-white border-blue-200' : 'bg-slate-900 border-cyan-900/40'
            }`}>
              <span className={`text-[10px] font-bold uppercase block ${
                isLight ? 'text-blue-600' : 'text-cyan-400'
              }`}>Quality Pass Rate</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-2xl font-bold ${isLight ? 'text-blue-600' : 'text-cyan-400'}`}>{dashboardStats.okRate}%</span>
                <span className={`text-xs ${isLight ? 'text-blue-600' : 'text-cyan-400'}`}>Yield</span>
              </div>
            </div>
          </div>

          {/* Search & Export Toolbar */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="relative w-full sm:w-72">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder={isTh ? "ค้นหา Heat No, Grade, Supplier..." : "Search Heat No, Grade..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500'
                    : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={exportToCSV}
                disabled={filteredHistory.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isTh ? 'ส่งออก CSV (Export CSV)' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* Summary Table by Grade */}
          <div className={`border rounded-2xl p-5 space-y-3 shadow-xs ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-800' : 'text-slate-200'
            }`}>
              <PieChart className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
              {isTh ? 'สรุปน้ำหนักตามชนิดเกรด (Summary by Aluminum Grade)' : 'Summary by Aluminum Grade'}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b text-[11px] ${
                    isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
                  }`}>
                    <th className="pb-3">Aluminum Grade</th>
                    <th className="pb-3 text-center">Invoices</th>
                    <th className="pb-3 text-center">Heat Count</th>
                    <th className="pb-3 text-center">Total Pcs</th>
                    <th className="pb-3 text-right">Total Weight (kg)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                  {dashboardStats.gradeSummary.map((gs, i) => {
                    const spec = findMatchingSpec(gs.grade);
                    return (
                      <tr key={i} className={isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-950/40'}>
                        <td className="py-2.5 font-bold" style={{ color: spec?.color || (isLight ? '#2563eb' : '#38bdf8') }}>
                          {gs.grade}
                        </td>
                        <td className={`py-2.5 text-center font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {Array.from(gs.invoices).join(', ') || '-'}
                        </td>
                        <td className={`py-2.5 text-center font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {gs.heats.size} Heats
                        </td>
                        <td className={`py-2.5 text-center font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {gs.pcs.toLocaleString()} pcs
                        </td>
                        <td className={`py-2.5 text-right font-bold font-mono ${isLight ? 'text-blue-700' : 'text-cyan-300'}`}>
                          {gs.weight.toLocaleString(undefined, { minimumFractionDigits: 2 })} kg
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed History Table */}
          <div className={`border rounded-2xl overflow-hidden shadow-xs ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                <ClipboardList className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                {isTh ? 'ประวัติการตรวจรับ Billet ทั้งหมด' : 'Historical Billet Inspection Logs'}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`font-mono text-[10px] uppercase ${
                  isLight ? 'bg-slate-50 text-slate-500 border-b border-slate-200' : 'bg-slate-950 text-slate-400'
                }`}>
                  <tr>
                    <th className="p-3">Heat No / Grade</th>
                    <th className="p-3">Supplier / Inspector</th>
                    <th className="p-3 text-center">Qty / Weight</th>
                    <th className="p-3 text-center">Judgement</th>
                    <th className="p-3 text-center">Action</th>
                    <th className="p-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
                  {filteredHistory.map((entry) => {
                    const spec = findMatchingSpec(entry.grade);
                    return (
                      <tr key={entry.id} className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-950/50'}`}>
                        <td className="p-3">
                          <span className={`font-bold font-mono block ${isLight ? 'text-slate-900' : 'text-white'}`}>{entry.heat_number}</span>
                          <span className="text-[11px] font-semibold" style={{ color: spec?.color || (isLight ? '#2563eb' : '#38bdf8') }}>
                            {entry.grade} ({entry.billet_size})
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`block font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{entry.supplier_name || '-'}</span>
                          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{entry.inspector_name || 'QA'}</span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className={`block ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{entry.quantity_pcs} pcs</span>
                          <span className={`font-bold ${isLight ? 'text-blue-700' : 'text-cyan-300'}`}>{entry.weight_kg} kg</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            entry.judgement === 'PASS'
                              ? isLight 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isLight
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}>
                            {entry.judgement}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleRequestEditHistory(entry)}
                              className={`p-1.5 rounded-lg transition border flex items-center gap-1 text-[11px] font-bold ${
                                isLight
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}
                              title={isTh ? "แก้ไขข้อมูล (ใส่รหัส admin2026)" : "Edit Record (Password required)"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{isTh ? 'แก้ไข' : 'Edit'}</span>
                            </button>
                            <button
                              onClick={() => handlePrintTag(entry)}
                              className={`p-1.5 rounded-lg transition border ${
                                isLight
                                  ? 'bg-slate-100 hover:bg-slate-200 text-blue-600 border-slate-300'
                                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700'
                              }`}
                              title="Print Tag"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRequestDeleteHistory(entry)}
                              className={`p-1.5 rounded-lg transition border ${
                                isLight
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-300'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                              }`}
                              title={isTh ? "ลบรายการ (ต้องใส่รหัส admin2026)" : "Delete Record (Password required)"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className={`p-3 text-right font-mono text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {entry.timestamp}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PASSWORD PROMPT MODAL FOR DELETING RECORD / GRADE */}
          {isDeleteAuthOpen && (
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
              isLight ? 'bg-slate-900/40 backdrop-blur-xs' : 'bg-slate-950/80 backdrop-blur-sm'
            }`}>
              <div className={`rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative border ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <button 
                  onClick={() => setIsDeleteAuthOpen(false)} 
                  className={`absolute top-4 right-4 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <X className="w-5 h-5" />
                </button>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
                  isLight 
                    ? 'bg-rose-50 border-rose-200 text-rose-600' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {isTh ? 'ยืนยันรหัสผ่านเพื่อลบข้อมูล' : 'Password Required for Deletion'}
                  </h4>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {targetDeleteHistoryItem ? (
                      isTh 
                        ? `ต้องการลบประวัติ Heat No. ${targetDeleteHistoryItem.heat_number} กรุณาใส่รหัสผ่าน admin2026 เพื่อยืนยัน` 
                        : `Enter admin password admin2026 to delete Heat No. ${targetDeleteHistoryItem.heat_number}`
                    ) : (
                      isTh 
                        ? `ต้องการลบ Grade Spec ${targetDeleteGrade} กรุณาใส่รหัสผ่าน admin2026 เพื่อยืนยัน` 
                        : `Enter admin password admin2026 to delete Grade Spec ${targetDeleteGrade}`
                    )}
                  </p>
                </div>

                <form onSubmit={handleVerifyDeletePassword} className="space-y-3">
                  <input
                    type="password"
                    autoFocus
                    placeholder={isTh ? "ใส่รหัสผ่าน (admin2026)" : "Enter password (admin2026)"}
                    value={deleteAuthPassword}
                    onChange={(e) => setDeleteAuthPassword(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-center font-mono text-sm focus:outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-rose-500'
                    }`}
                  />
                  {deleteAuthError && (
                    <p className="text-xs text-rose-500 font-semibold text-center">
                      {isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาใส่ admin2026' : 'Incorrect password! Please enter admin2026'}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDeleteAuthOpen(false)}
                      className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isTh ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-xs"
                    >
                      {isTh ? 'ยืนยันลบข้อมูล' : 'Verify & Delete'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PASSWORD PROMPT MODAL FOR EDITING HISTORY */}
          {isHistoryAuthOpen && (
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
              isLight ? 'bg-slate-900/40 backdrop-blur-xs' : 'bg-slate-950/80 backdrop-blur-sm'
            }`}>
              <div className={`rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative border ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <button 
                  onClick={() => setIsHistoryAuthOpen(false)} 
                  className={`absolute top-4 right-4 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <X className="w-5 h-5" />
                </button>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
                  isLight 
                    ? 'bg-amber-50 border-amber-200 text-amber-600' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  <Lock className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {isTh ? 'ยืนยันรหัสผ่านเพื่อแก้ไขข้อมูล' : 'Password Required for Editing'}
                  </h4>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isTh 
                      ? `ต้องการแก้ไข Heat No. ${targetEditHistoryItem?.heat_number || ''} กรุณาใส่รหัสผ่าน` 
                      : `Enter admin password to edit Heat No. ${targetEditHistoryItem?.heat_number || ''}`}
                  </p>
                </div>

                <form onSubmit={handleVerifyHistoryPassword} className="space-y-3">
                  <input
                    type="password"
                    autoFocus
                    placeholder={isTh ? "ใส่รหัสผ่าน (admin2026)" : "Enter password (admin2026)"}
                    value={historyAuthPassword}
                    onChange={(e) => setHistoryAuthPassword(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-center font-mono text-sm focus:outline-none border ${
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
                      className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isTh ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition shadow-xs"
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
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto ${
              isLight ? 'bg-slate-900/40 backdrop-blur-xs' : 'bg-slate-950/85 backdrop-blur-md'
            }`}>
              <div className={`border rounded-2xl max-w-3xl w-full p-6 space-y-6 my-8 shadow-2xl relative ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
              }`}>
                <div className={`flex items-center justify-between border-b pb-4 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-amber-500" />
                    <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {isTh ? `แก้ไขข้อมูลบันทึก Heat No. ${editingHistoryItem.heat_number}` : `Edit Inspection Record - ${editingHistoryItem.heat_number}`}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setEditingHistoryItem(null)} 
                    className={isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-slate-200'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Heat Number</label>
                    <input
                      type="text"
                      value={editingHistoryItem.heat_number || ''}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, heat_number: e.target.value } : null)}
                      className={`w-full rounded-xl px-3 py-2 font-mono font-bold focus:outline-none border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Grade</label>
                    <input
                      type="text"
                      value={editingHistoryItem.grade || ''}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, grade: e.target.value } : null)}
                      className={`w-full rounded-xl px-3 py-2 font-bold focus:outline-none border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Billet Size</label>
                    <input
                      type="text"
                      value={editingHistoryItem.billet_size || ''}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, billet_size: e.target.value } : null)}
                      className={`w-full rounded-xl px-3 py-2 focus:outline-none border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Supplier Name</label>
                    <input
                      type="text"
                      value={editingHistoryItem.supplier_name || ''}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, supplier_name: e.target.value } : null)}
                      className={`w-full rounded-xl px-3 py-2 focus:outline-none border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Inspector</label>
                    <input
                      type="text"
                      value={editingHistoryItem.inspector_name || ''}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, inspector_name: e.target.value } : null)}
                      className={`w-full rounded-xl px-3 py-2 focus:outline-none border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Invoice No.</label>
                    <input
                      type="text"
                      value={editingHistoryItem.invoice_no || ''}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, invoice_no: e.target.value } : null)}
                      className={`w-full rounded-xl px-3 py-2 focus:outline-none border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Quantity (pcs)</label>
                    <input
                      type="number"
                      value={editingHistoryItem.quantity_pcs || 0}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, quantity_pcs: Number(e.target.value) } : null)}
                      className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Weight (kg)</label>
                    <input
                      type="number"
                      value={editingHistoryItem.weight_kg || 0}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, weight_kg: Number(e.target.value) } : null)}
                      className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Diameter</label>
                    <input
                      type="text"
                      value={editingHistoryItem.diameter || ''}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, diameter: e.target.value } : null)}
                      className={`w-full rounded-xl px-3 py-2 focus:outline-none border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Chemical Composition Matrix */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                    Chemical Composition Analysis (%)
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-1.5 text-xs">
                    {chemElements.map(el => (
                      <div key={el} className={`p-2 rounded-xl border text-center ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}>
                        <span className={`block text-[10px] font-bold mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{el}</span>
                        <input
                          type="text"
                          value={editingHistoryItem.chemical_composition?.[el] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingHistoryItem(prev => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                chemical_composition: {
                                  ...prev.chemical_composition,
                                  [el]: parseFloat(val) || val
                                }
                              };
                            });
                          }}
                          className={`w-full rounded text-center text-xs font-mono font-bold focus:outline-none border ${
                            isLight
                              ? 'bg-white border-slate-300 text-blue-700 focus:border-amber-500'
                              : 'bg-slate-900 border-slate-800 text-cyan-300 focus:border-amber-500'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`flex justify-end gap-3 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <button
                    onClick={() => setEditingHistoryItem(null)}
                    className={`px-5 py-2.5 text-xs font-bold rounded-xl transition ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isTh ? 'ยกเลิก' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSaveEditedHistory}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isTh ? 'บันทึกการแก้ไข' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONFIGURATION (PROTECTED) */}
      {activeTab === 'config' && (
        <div className={`border rounded-2xl overflow-hidden shadow-xs ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`p-4 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-800' : 'text-slate-200'
            }`}>
              <Settings className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
              {isTh ? 'การตั้งค่าเกณฑ์ส่วนผสมเคมี (Chemical Spec Thresholds)' : 'Grade Chemical Spec Config'}
            </h3>

            {isAdminAuthenticated && (
              <button
                onClick={() => setIsAdminAuthenticated(false)}
                className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isTh ? 'ออกจากระบบ Admin' : 'Lock Admin'}</span>
              </button>
            )}
          </div>

          {!isAdminAuthenticated ? (
            /* Admin Login */
            <div className="p-12 text-center max-w-sm mx-auto space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
                isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}>
                <Lock className="w-6 h-6" />
              </div>
              <h4 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isTh ? 'สิทธิ์ผู้ดูแลระบบ (Admin Access Required)' : 'Admin Access Required'}
              </h4>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh ? 'กรอกรหัสผ่านเพื่อแก้ไขเกณฑ์ Min/Max ส่วนผสมเคมี' : 'Enter password to edit Grade Spec limits.'}
              </p>

              <form onSubmit={handleAdminAuth} className="space-y-3">
                <input
                  type="password"
                  placeholder={isTh ? "รหัสผ่าน (admin2026)" : "Password (admin2026)"}
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2.5 text-center font-mono text-sm focus:outline-none border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                  }`}
                />
                {passwordError && (
                  <p className="text-xs text-rose-500 font-semibold">
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง (ลองใส่ admin2026)' : 'Invalid password (try admin2026)'}
                  </p>
                )}
                <button
                  type="submit"
                  className={`w-full font-bold text-xs py-2.5 rounded-xl transition shadow-xs ${
                    isLight
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  {isTh ? 'ยืนยันรหัสผ่าน' : 'Authenticate'}
                </button>
              </form>
            </div>
          ) : (
            /* Spec Management Editor */
            <div className={`flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x min-h-[400px] ${
              isLight ? 'divide-slate-200' : 'divide-slate-800'
            }`}>
              
              {/* Grade List Sidebar */}
              <div className={`w-full md:w-64 p-4 space-y-2 ${
                isLight ? 'bg-slate-50' : 'bg-slate-950/50'
              }`}>
                <button
                  onClick={prepareNewGrade}
                  className={`w-full font-bold text-xs py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition ${
                    isLight
                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{isTh ? 'เพิ่มเกณฑ์เกรดใหม่ (+ Grade)' : '+ Add Grade Spec'}</span>
                </button>

                {Object.keys(gradeSpecs).map((grade) => {
                  if (grade === "NEW_GRADE_PENDING") return null;
                  const isSelected = editingGrade === grade;
                  return (
                    <div
                      key={grade}
                      onClick={() => setEditingGrade(grade)}
                      className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                        isSelected 
                          ? isLight 
                            ? 'bg-white text-blue-700 font-bold border-blue-400 shadow-xs' 
                            : 'bg-slate-800 text-white font-bold border-cyan-500/50 shadow-sm' 
                          : isLight 
                            ? 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: gradeSpecs[grade].color }}
                        />
                        <span className="text-xs font-mono">{grade}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Spec Editor Table */}
              <div className="flex-1 p-6 space-y-6">
                {editingGrade ? (
                  <div className="space-y-6">
                    {editingGrade === "NEW_GRADE_PENDING" ? (
                      <div className={`p-4 rounded-xl border space-y-3 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}>
                        <label className={`text-xs font-bold block ${isLight ? 'text-blue-700' : 'text-cyan-300'}`}>
                          {isTh ? 'ตั้งชื่อเกรดใหม่' : 'Enter Grade Name'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. 6061, 6082"
                            value={tempGradeName}
                            onChange={(e) => setTempGradeName(e.target.value)}
                            className={`border rounded-lg px-3 py-1.5 text-xs font-bold font-mono focus:outline-none ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                                : 'bg-slate-900 border-slate-800 text-white focus:border-cyan-500'
                            }`}
                          />
                          <button
                            onClick={handleSaveNewGrade}
                            disabled={!tempGradeName.trim()}
                            className={`font-bold text-xs px-4 py-1.5 rounded-lg ${
                              isLight ? 'bg-blue-600 text-white' : 'bg-cyan-500 text-slate-950'
                            }`}
                          >
                            {isTh ? 'บันทึกชื่อ' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`flex items-center justify-between border-b pb-4 ${
                        isLight ? 'border-slate-200' : 'border-slate-800'
                      }`}>
                        <div className="flex items-center gap-4">
                          <h4 className={`text-lg font-bold font-mono flex items-center gap-2 ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            <span 
                              className="w-3.5 h-3.5 rounded-full" 
                              style={{ backgroundColor: gradeSpecs[editingGrade]?.color }}
                            />
                            Grade: {editingGrade}
                          </h4>

                          <div className="flex items-center gap-2 text-xs">
                            <Palette className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
                            <input
                              type="color"
                              value={gradeSpecs[editingGrade]?.color || '#4f46e5'}
                              onChange={(e) => updateGradeColor(e.target.value)}
                              className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleRequestDeleteGrade(editingGrade)}
                          className="text-xs text-rose-500 hover:text-rose-600 p-2 bg-rose-50 rounded-lg border border-rose-200 font-semibold"
                        >
                          {isTh ? 'ลบเกรดนี้' : 'Delete Grade'}
                        </button>
                      </div>
                    )}

                    {/* Threshold Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className={`border-b text-[10px] uppercase ${
                            isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
                          }`}>
                            <th className="pb-3">Element</th>
                            <th className="pb-3 text-center">Min Threshold (%)</th>
                            <th className="pb-3 text-center">Max Threshold (%)</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                          {chemElements.map((el) => {
                            const minVal = gradeSpecs[editingGrade]?.elements?.[el]?.min ?? 0;
                            const maxVal = gradeSpecs[editingGrade]?.elements?.[el]?.max ?? 0;

                            return (
                              <tr key={el} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-950/40'}>
                                <td className={`py-2.5 font-bold font-mono ${isLight ? 'text-blue-700' : 'text-cyan-300'}`}>
                                  {el}
                                </td>
                                <td className="py-2.5 text-center">
                                  <input
                                    type="number"
                                    step="0.001"
                                    value={minVal}
                                    onChange={(e) => updateSpecValue(el, 'min', e.target.value)}
                                    className={`w-24 border rounded px-2 py-1 text-center font-mono font-bold ${
                                      isLight
                                        ? 'bg-white border-slate-300 text-slate-800'
                                        : 'bg-slate-950 border-slate-800 text-slate-200'
                                    }`}
                                  />
                                </td>
                                <td className="py-2.5 text-center">
                                  <input
                                    type="number"
                                    step="0.001"
                                    value={maxVal}
                                    onChange={(e) => updateSpecValue(el, 'max', e.target.value)}
                                    className={`w-24 border rounded px-2 py-1 text-center font-mono font-bold ${
                                      isLight
                                        ? 'bg-white border-slate-300 text-slate-800'
                                        : 'bg-slate-950 border-slate-800 text-slate-200'
                                    }`}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className={`text-center py-16 text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isTh ? 'เลือกเกรดจากรายการด้านซ้ายเพื่อแก้ไขค่ามิติ Min/Max' : 'Select a grade from left sidebar to configure specs'}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};
