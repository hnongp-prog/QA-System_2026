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
  User,
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
  Moon,
  Copy,
  ExternalLink,
  Building2,
  Maximize2
} from 'lucide-react';
import { useCloudState } from '../services/firestoreSync';

import { 
  BilletInspectionItem, 
  GradeSpecMap, 
  ChemElementKey, 
  Language, 
  InspectionActivity,
  ThemeMode
} from '../types';
import { analyzeBilletCertClient, getGeminiApiKey } from '../services/geminiClient';
import { BilletWeightAnalyticsChart } from './billetIncoming/BilletWeightAnalyticsChart';
import { generateQrSvgString, QRCodeView, getBilletQrPayload, QrDataMode, QrZoomModal } from '../utils/qrCodeHelper';

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
    inspector_name: "Anucha S. (IQA Inspector)",
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
    defect_depth: "-",
    defect_width: "-",
    defect_length: "-",
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
    inspector_name: "Somchai R. (IQA Lead)",
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
    defect_depth: "-",
    defect_width: "-",
    defect_length: "-",
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
    defect_depth: "2.5",
    defect_width: "60",
    defect_length: "120",
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
  const [activeBatchPrintItems, setActiveBatchPrintItems] = useState<BilletInspectionItem[] | null>(null);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [batchPrintLayout, setBatchPrintLayout] = useState<'roll' | 'grid'>('roll');
  const [batchCopiedInfo, setBatchCopiedInfo] = useState(false);
  const [qrDataMode, setQrDataMode] = useState<QrDataMode>('full');
  const [zoomQrPayload, setZoomQrPayload] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    payload: string;
  } | null>(null);
  const [showQrInfoModal, setShowQrInfoModal] = useState(false);
  const [history, setHistory] = useCloudState<BilletInspectionItem[]>('billet_qc_history', INITIAL_HISTORY);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Spec Configuration State
  const [gradeSpecs, setGradeSpecs] = useCloudState<GradeSpecMap>('billet_qc_grade_specs', DEFAULT_GRADE_SPECS);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [editingGrade, setEditingGrade] = useState<string>("6063");
  const [tempGradeName, setTempGradeName] = useState("");

  // Grade list derived from gradeSpecs
  const availableGrades = useMemo(() => {
    const keys = Object.keys(gradeSpecs || {}).filter(k => k !== "NEW_GRADE_PENDING" && Boolean(k.trim()));
    return keys.length > 0 ? keys : ["6063", "6061", "6005", "6082"];
  }, [gradeSpecs]);

  // Distinct suppliers extracted directly from previous inspection history
  const historySuppliers = useMemo(() => {
    const fromHistory = (history || [])
      .map(h => (h.supplier_name || "").trim())
      .filter(s => s.length > 0);
    return Array.from(new Set(fromHistory)).sort((a, b) => a.localeCompare(b));
  }, [history]);

  // Combined supplier list with history suppliers on top
  const availableSuppliers = useMemo(() => {
    const defaults = [
      "Siam Aluminum Industry",
      "Siam Aluminum Co., Ltd.",
      "Metal Tech Extrusions",
      "Global Alloy Supply",
      "Thai Metal Aluminium Co., Ltd.",
      "Capral Aluminium",
      "Press Metal Berhad"
    ];
    const fromHistory = (history || [])
      .map(h => (h.supplier_name || "").trim())
      .filter(s => s.length > 0);
    return Array.from(new Set([...fromHistory, ...defaults])).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [history]);

  // Quick helper to apply selected supplier to all scanned items
  const applySupplierToAll = (supplierName: string) => {
    if (!supplierName) return;
    setExtractedItems(prev => prev.map(item => ({ ...item, supplier_name: supplierName })));
    setStatus({
      type: 'info',
      message: isTh ? `กำหนด Supplier: "${supplierName}" ให้ทุกรายการเรียบร้อยแล้ว` : `Applied Supplier: "${supplierName}" to all items`
    });
  };

  // Ensure an active grade is selected when gradeSpecs change
  useEffect(() => {
    if (!editingGrade || !gradeSpecs[editingGrade]) {
      const available = Object.keys(gradeSpecs).filter(k => k !== "NEW_GRADE_PENDING");
      if (available.length > 0) {
        setEditingGrade(available[0]);
      }
    }
  }, [gradeSpecs, editingGrade]);

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

  // Spec Matcher
  const findMatchingSpec = (scannedGrade: string) => {
    if (!scannedGrade) return null;
    const normalized = scannedGrade.toUpperCase().trim();
    if (gradeSpecs[normalized]) return gradeSpecs[normalized];
    
    // Case-insensitive direct match
    const exactKey = Object.keys(gradeSpecs).find(
      k => k.trim().toUpperCase() === normalized
    );
    if (exactKey) return gradeSpecs[exactKey];

    // Cleaned match without spaces/dashes
    const cleanScanned = normalized.replace(/[\s\-_]/g, '');
    for (const key of Object.keys(gradeSpecs)) {
      if (key === 'NEW_GRADE_PENDING') continue;
      const cleanKey = key.toUpperCase().replace(/[\s\-_]/g, '');
      if (cleanScanned === cleanKey || cleanScanned.includes(cleanKey) || cleanKey.includes(cleanScanned)) {
        return gradeSpecs[key];
      }
    }

    // Number/Alloy regex match e.g. "AA6063-T5" -> "6063"
    const numberMatch = normalized.match(/\b(6\d{3}|1\d{3}|2\d{3}|3\d{3}|5\d{3}|7\d{3})\b/);
    if (numberMatch && numberMatch[1]) {
      const matchedKey = Object.keys(gradeSpecs).find(k => k.includes(numberMatch[1]));
      if (matchedKey) return gradeSpecs[matchedKey];
    }

    const prefix = normalized.substring(0, 4);
    const matchingKey = Object.keys(gradeSpecs).find(key => 
      key.toUpperCase().substring(0, 4) === prefix
    );
    return matchingKey ? gradeSpecs[matchingKey] : null;
  };

  // Ignored value helper for unmeasured/dash fields
  const isIgnoredValue = (val: any): boolean => {
    if (val === undefined || val === null) return true;
    const s = String(val).trim().toLowerCase();
    return s === '' || s === '-' || s === 'n/a' || s === 'na' || s === 'none' || s === 'null' || s === 'nil' || s === 'unmeasured' || s === 'ไม่ระบุ' || s === 'no defect';
  };

  // Judgement Calculator
  const performJudgement = (item: BilletInspectionItem): 'PASS' | 'FAIL' | 'NO SPEC' => {
    const spec = findMatchingSpec(item.grade);
    if (!spec) return "NO SPEC";
    let isOk = true;

    chemElements.forEach(el => {
      const raw = item.chemical_composition?.[el];
      if (isIgnoredValue(raw)) return;
      const s = String(raw).trim().replace(/,/g, '.');
      const val = parseFloat(s);
      const elementSpec = spec.elements[el];
      if (!isNaN(val) && elementSpec) {
        if (val < elementSpec.min || val > elementSpec.max) isOk = false;
      }
    });

    // Check visual checklist: cutting surface < 2 mm & billet slid <= 2.5 mm
    if (item.cutting_surface_lt2 === false) {
      isOk = false;
    }
    if (item.billet_slid_lt25 === false) {
      isOk = false;
    }

    // Check Defect fields: Depth < 5mm, Width < 50mm, Length < 100mm
    if (!isIgnoredValue(item.defect_depth)) {
      const d = parseFloat(String(item.defect_depth).trim().replace(/,/g, '.'));
      if (!isNaN(d) && d >= 5) isOk = false;
    }
    if (!isIgnoredValue(item.defect_width)) {
      const w = parseFloat(String(item.defect_width).trim().replace(/,/g, '.'));
      if (!isNaN(w) && w >= 50) isOk = false;
    }
    if (!isIgnoredValue(item.defect_length)) {
      const l = parseFloat(String(item.defect_length).trim().replace(/,/g, '.'));
      if (!isNaN(l) && l >= 100) isOk = false;
    }

    // Backward compatibility for defect_2x50x100
    if (typeof item.defect_2x50x100 === 'boolean' && item.defect_2x50x100) {
      isOk = false;
    } else if (typeof item.defect_2x50x100 === 'string' && !isIgnoredValue(item.defect_2x50x100)) {
      const defStr = item.defect_2x50x100.trim().toLowerCase();
      if (!['none', 'no', 'pass', 'passed', 'ok', 'nil', '-', '0', 'none / ok', 'none / pass', 'none/ok', 'none/pass', 'true'].includes(defStr)) {
        isOk = false;
      }
    }

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
        inspector_name: 'Anucha S. (IQA)',
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
        defect_depth: '0',
        defect_width: '0',
        defect_length: '0',
        chemical_composition: {
          Si: 0.45, Fe: 0.20, Cu: 0.02, Mn: 0.03, Mg: 0.55, Cr: 0.01, Zn: 0.02, Ti: 0.01, Pb: 0.00, Cd: 0.00, Al: 98.71
        }
      },
      {
        heat_number: `H2026-${Math.floor(8000 + Math.random() * 1000)}`,
        billet_size: '6 inch (152 mm)',
        grade: '6061',
        supplier_name: 'Metal Tech Extrusions',
        inspector_name: 'Somchai R. (IQA)',
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
        defect_depth: '0',
        defect_width: '0',
        defect_length: '0',
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
          moduleCode: 'IQA-01',
          moduleTitleTh: 'ตรวจรับวัตถุดิบและชิ้นส่วน Billet',
          moduleTitleEn: 'Billet Incoming Inspection',
          inspector: item.inspector_name || 'IQA Inspector',
          batchLot: `${item.heat_number} (${item.grade})`,
          result: jg === 'PASS' ? 'PASS' : 'REJECT',
          defectCount: jg === 'FAIL' ? 1 : 0,
          remarks: resultDesc,
          coilNo: item.heat_number || item.batch_no || 'HEAT-N/A',
          profile: `Billet ${item.grade} (${item.billet_size || 'Size N/A'})`,
          process: 'IQA-01 Billet Incoming Inspection',
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
    if (deleteAuthPassword === "admin2026" || (isAdminAuthenticated && targetDeleteGrade)) {
      if (targetDeleteHistoryItem) {
        const heatNo = targetDeleteHistoryItem.heat_number;
        setHistory(prev => prev.filter(h => h.id !== targetDeleteHistoryItem.id));
        setStatus({
          type: 'info',
          message: isTh ? `ลบประวัติการตรวจรับ Heat No. ${heatNo} เรียบร้อยแล้ว` : `Deleted inspection record for Heat No. ${heatNo}`
        });
      } else if (targetDeleteGrade) {
        const gradeName = targetDeleteGrade;
        deleteGrade(gradeName);
        setStatus({
          type: 'success',
          message: isTh ? `ลบเกณฑ์มาตรฐานเกรด ${gradeName} เรียบร้อยแล้ว` : `Deleted Grade Spec ${gradeName} successfully`
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
    const remaining = Object.keys(gradeSpecs).filter(g => g !== gradeToDelete && g !== "NEW_GRADE_PENDING");
    if (editingGrade === gradeToDelete || !remaining.includes(editingGrade)) {
      setEditingGrade(remaining.length > 0 ? remaining[0] : "");
    }
  };

  const resetDefaultGradeSpecs = () => {
    if (window.confirm(isTh ? 'คุณต้องการคืนค่าเกณฑ์มาตรฐานเกรดเริ่มต้น (6063, 6061, 6005, 6082) หรือไม่?' : 'Reset grade specs to default (6063, 6061, 6005, 6082)?')) {
      setGradeSpecs(DEFAULT_GRADE_SPECS);
      setEditingGrade("6063");
      setStatus({
        type: 'success',
        message: isTh ? 'คืนค่าเกณฑ์มาตรฐานเกรดเริ่มต้นเรียบร้อยแล้ว' : 'Reset to default grade specs successfully'
      });
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
      "Cutting < 2mm", "Slid <= 2.5mm", "Defect Depth (<5mm)", "Defect Width (<50mm)", "Defect Length (<100mm)", "Appearance", "XRF", "Inspector",
      ...chemElements, "Timestamp"
    ];

    const rows = filteredHistory.map(e => [
      e.heat_number, e.billet_size, e.grade, e.judgement,
      e.batch_no, e.invoice_no, e.supplier_name, e.quantity_pcs, e.weight_kg,
      e.diameter, e.length, e.bending,
      e.cutting_surface_lt2 === false ? 'FAIL' : 'PASS', 
      e.billet_slid_lt25 === false ? 'FAIL' : 'PASS', 
      e.defect_depth ?? '-', 
      e.defect_width ?? '-', 
      e.defect_length ?? '-',
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
    let totalWeightKg = 0;
    
    filteredHistory.forEach(item => {
      const g = item.grade || 'Unknown';
      if (!gradeSummaryMap[g]) {
        gradeSummaryMap[g] = { grade: g, count: 0, weight: 0, pcs: 0, heats: new Set(), invoices: new Set() };
      }
      const w = parseFloat(String(item.weight_kg).replace(/,/g, '').replace(/[^\d.-]/g, '')) || 0;
      totalWeightKg += w;
      gradeSummaryMap[g].count++;
      gradeSummaryMap[g].weight += w;
      gradeSummaryMap[g].pcs += parseInt(String(item.quantity_pcs).replace(/,/g, '').replace(/[^\d.-]/g, ''), 10) || 0;
      if (item.heat_number) gradeSummaryMap[g].heats.add(item.heat_number);
      if (item.invoice_no) gradeSummaryMap[g].invoices.add(item.invoice_no);
    });

    return { total, ok, ng, okRate, totalWeightKg, gradeSummary: Object.values(gradeSummaryMap) };
  }, [filteredHistory]);

  // Helper to chunk arrays for sheet printing
  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size));
    }
    return res;
  };

  // Unique key for history row selection
  const getHistoryItemKey = (item: BilletInspectionItem, idx: number): string => {
    return item.id || (item.heat_number ? `${item.heat_number}-${item.batch_no || ''}-${idx}` : `billet-hist-${idx}`);
  };

  // Toggle single history item selection
  const toggleSelectHistory = (key: string) => {
    setSelectedHistoryIds(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Check if all filtered history items are selected
  const isAllFilteredSelected = filteredHistory.length > 0 && filteredHistory.every((item, idx) => 
    selectedHistoryIds.includes(getHistoryItemKey(item, idx))
  );

  // Toggle select all filtered history items
  const toggleSelectAllHistory = () => {
    if (isAllFilteredSelected) {
      const filteredKeys = new Set(filteredHistory.map((item, idx) => getHistoryItemKey(item, idx)));
      setSelectedHistoryIds(prev => prev.filter(k => !filteredKeys.has(k)));
    } else {
      const filteredKeys = filteredHistory.map((item, idx) => getHistoryItemKey(item, idx));
      setSelectedHistoryIds(prev => Array.from(new Set([...prev, ...filteredKeys])));
    }
  };

  // Clear all selections
  const clearHistorySelection = () => {
    setSelectedHistoryIds([]);
  };

  // List of currently selected history items
  const selectedHistoryItems = useMemo(() => {
    return filteredHistory.filter((item, idx) => 
      selectedHistoryIds.includes(getHistoryItemKey(item, idx))
    );
  }, [filteredHistory, selectedHistoryIds]);

  // Open Batch Print Modal for selected items
  const handlePrintBatchTags = (itemsToPrint?: BilletInspectionItem[]) => {
    const targetItems = itemsToPrint && itemsToPrint.length > 0 ? itemsToPrint : selectedHistoryItems;
    if (targetItems.length === 0) return;
    setActiveBatchPrintItems(targetItems);
    setBatchCopiedInfo(false);
  };

  // Generate Individual Tag Card Inner HTML
  const generateTagContentHtml = (item: BilletInspectionItem, mode: QrDataMode = qrDataMode) => {
    const spec = findMatchingSpec(item.grade);
    const tagColor = spec?.color || "#2563eb";
    const jg = item.judgement || performJudgement(item);
    const isPass = jg === 'PASS';
    const qrSvg = generateQrSvgString(getBilletQrPayload(item, mode), { margin: 4 });

    return `
      <div class="tag-box" style="border: 2.5px solid ${tagColor};">
        <div class="header" style="background: ${tagColor};">QUALITY APPROVED BILLET TAG</div>
        <div class="body-grid">
          <div class="qr-placeholder">
            <div class="qr-svg-wrap">
              ${qrSvg}
            </div>
            <span style="font-size: 7.5px; font-weight: bold; margin-top: 1px; font-family: monospace; max-width: 86px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.heat_number || '-'}</span>
          </div>
          <div class="details">
            <div><strong>HEAT NO:</strong> <span style="font-family: monospace; font-size:12px; font-weight:bold;">${item.heat_number || '-'}</span></div>
            <div><strong>GRADE:</strong> <span style="font-size:12px; font-weight:bold; color:${tagColor}">${item.grade || '-'}</span></div>
            <div><strong>SIZE:</strong> ${item.billet_size || '-'}</div>
            <div><strong>SUPPLIER:</strong> ${item.supplier_name || '-'}</div>
            <div><strong>QTY / WT:</strong> ${item.quantity_pcs || '0'} pcs / ${item.weight_kg || '0'} kg</div>
            <div><strong>INSPECTOR:</strong> ${item.inspector_name || 'QA Team'}</div>
            <div><strong>STATUS:</strong> <span class="badge" style="background: ${isPass ? '#10b981' : '#ef4444'};">${jg}</span></div>
          </div>
        </div>
        ${item.chemical_composition && Object.keys(item.chemical_composition).length > 0 ? `
          <div class="chem-row">
            <strong>CHEM (%):</strong>
            ${Object.entries(item.chemical_composition).slice(0, 7).map(([k, v]) => `${k}:${v}`).join(' ')}
          </div>
        ` : ''}
        <div class="footer">IQA-01 Billet Incoming Verification • Date: ${item.timestamp || (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])}</div>
      </div>
    `;
  };

  // Generate Print Tag HTML (Single or Batch with page breaks)
  const generateMultipleTagsHtml = (items: BilletInspectionItem[], layout: 'roll' | 'grid' = 'roll', mode: QrDataMode = qrDataMode) => {
    const isGrid = layout === 'grid';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Billet Approved QR Tags (${items.length} Heats)</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background: #fff; color: #000; }
            ${isGrid ? `
              @page { size: A4 portrait; margin: 10mm; }
              .grid-page {
                page-break-after: always;
                break-after: page;
                margin-bottom: 24px;
              }
              .sheet-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
              }
              .tag-box { border-radius: 10px; padding: 10px; background: #fff; page-break-inside: avoid; }
            ` : `
              @page { size: 100mm 100mm; margin: 0; }
              .tag-page {
                page-break-after: always;
                break-after: page;
                padding: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100mm;
                height: 100mm;
                box-sizing: border-box;
              }
              .tag-box { border-radius: 12px; padding: 12px; width: 100%; max-width: 360px; margin: 0 auto; background: #fff; }
            `}
            .header { color: #fff; text-align: center; font-weight: 800; padding: 6px 4px; border-radius: 6px; font-size: 13px; letter-spacing: 0.5px; }
            .body-grid { display: flex; margin-top: 8px; gap: 8px; align-items: stretch; }
            .qr-placeholder { width: 90px; min-width: 90px; height: 90px; border: 1.5px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #ffffff; text-align: center; border-radius: 6px; padding: 2px; box-sizing: border-box; }
            .qr-placeholder .qr-svg-wrap { width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; }
            .qr-placeholder .qr-svg-wrap svg { width: 100%; height: 100%; display: block; }
            .details { flex: 1; font-size: 10.5px; line-height: 1.4; }
            .details > div { margin-bottom: 2px; }
            .badge { display: inline-block; padding: 1px 6px; font-weight: bold; border-radius: 4px; color: white; font-size: 9.5px; }
            .chem-row { font-size: 8.5px; font-family: monospace; background: #f1f5f9; padding: 3px 6px; border-radius: 4px; margin-top: 6px; }
            .footer { margin-top: 6px; border-top: 1px dashed #cbd5e1; padding-top: 3px; font-size: 7.5px; color: #64748b; text-align: center; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${isGrid ? (
            chunkArray(items, 4).map(chunk => `
              <div class="grid-page">
                <div class="sheet-grid">
                  ${chunk.map(item => generateTagContentHtml(item, mode)).join('')}
                </div>
              </div>
            `).join('')
          ) : (
            items.map(item => `
              <div class="tag-page">
                ${generateTagContentHtml(item, mode)}
              </div>
            `).join('')
          )}
        </body>
      </html>
    `;
  };

  const generateTagHtml = (item: BilletInspectionItem) => {
    return generateMultipleTagsHtml([item], 'roll', qrDataMode);
  };

  // Direct Print for Single or Multiple Tags via hidden iframe
  const triggerDirectMultiplePrint = (items: BilletInspectionItem[], layout: 'roll' | 'grid' = 'roll', mode: QrDataMode = qrDataMode) => {
    if (items.length === 0) return;
    const htmlContent = generateMultipleTagsHtml(items, layout, mode);

    try {
      let iframe = document.getElementById('billet-print-iframe') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'billet-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 400);
        return;
      }
    } catch (err) {
      console.warn('Iframe print failed, falling back to window.open', err);
    }

    try {
      const printWindow = window.open('', '_blank', 'width=700,height=700');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      }
    } catch (e) {
      console.error('Window print error:', e);
    }
  };

  const triggerDirectPrint = (item: BilletInspectionItem) => {
    triggerDirectMultiplePrint([item], 'roll');
  };

  // Print Tag action: Open Preview Modal and ready print
  const [copiedTagInfo, setCopiedTagInfo] = useState(false);
  const handlePrintTag = (item: BilletInspectionItem) => {
    setActivePrintItem(item);
    setCopiedTagInfo(false);
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
                  IQA-01
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

            {/* Quick Batch Supplier Toolbar */}
            {extractedItems.length > 0 && (
              <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs ${
                isLight ? 'bg-blue-50/70 border-blue-200 text-slate-700' : 'bg-slate-900/90 border-cyan-900/50 text-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Building2 className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                  <div>
                    <span className="font-bold text-xs block">
                      {isTh ? 'กำหนด Supplier ให้ทุกรายการในชุดนี้' : 'Batch Assign Supplier'}
                    </span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {isTh ? `ดึงข้อมูลจากประวัติ (${historySuppliers.length} รายชื่อ)` : `Pulled from inspection history (${historySuppliers.length} suppliers)`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[240px]">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        applySupplierToAll(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className={`w-full sm:w-auto rounded-xl px-3 py-1.5 text-xs font-medium border cursor-pointer ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                        : 'bg-slate-950 border-slate-700 text-slate-200 focus:border-cyan-500'
                    }`}
                  >
                    <option value="" disabled>
                      {isTh ? '⚡ เลือก Supplier จากประวัติเพื่อใส่ทั้งหมด...' : '⚡ Select History Supplier to apply all...'}
                    </option>
                    {historySuppliers.length > 0 && (
                      <optgroup label={isTh ? "📋 ซัพพลายเออร์ที่เคยมีประวัติบันทึก" : "📋 Recorded Suppliers from History"}>
                        {historySuppliers.map(s => (
                          <option key={`batch-hist-${s}`} value={s}>
                            ⭐ {s}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label={isTh ? "🏢 ซัพพลายเออร์มาตรฐานอื่นๆ" : "🏢 Other Suppliers"}>
                      {availableSuppliers
                        .filter(s => !historySuppliers.includes(s))
                        .map(s => (
                          <option key={`batch-std-${s}`} value={s}>
                            {s}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            )}

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
                          <div className="flex items-center justify-between mb-1">
                            <label className={`text-[10px] font-bold uppercase ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              Grade / Billet Size
                            </label>
                            {spec ? (
                              <span 
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1"
                                style={{
                                  backgroundColor: `${spec.color}15`,
                                  borderColor: `${spec.color}40`,
                                  color: spec.color
                                }}
                                title={`Linked to Grade Spec: ${spec.name || item.grade}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: spec.color }} />
                                Spec: {item.grade}
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold text-amber-500 px-1 py-0.5 rounded bg-amber-500/10">
                                ⚠ No Spec
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1.5 items-center">
                            <div className="w-1/2 flex flex-col gap-1">
                              <select
                                value={availableGrades.includes(item.grade || '') ? item.grade : (item.grade ? '__CUSTOM__' : '')}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val !== '__CUSTOM__') {
                                    updateItemField(idx, 'grade', val);
                                  }
                                }}
                                style={{ color: spec?.color }}
                                className={`w-full rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none border cursor-pointer ${
                                  isLight
                                    ? 'bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-800'
                                    : 'bg-slate-950 border-slate-800 focus:border-cyan-500 text-slate-100'
                                }`}
                              >
                                <option value="">-- เลือกเกรด Spec --</option>
                                {availableGrades.map(g => (
                                  <option key={g} value={g}>
                                    {g} {gradeSpecs[g]?.name ? `(${gradeSpecs[g].name})` : ''}
                                  </option>
                                ))}
                                <option value="__CUSTOM__">✏️ พิมพ์เกรดอื่น...</option>
                              </select>
                              {(!availableGrades.includes(item.grade || '') || item.grade === '__CUSTOM__') && (
                                <input
                                  type="text"
                                  placeholder="พิมพ์ชื่อเกรด..."
                                  value={item.grade === '__CUSTOM__' ? '' : (item.grade || '')}
                                  onChange={(e) => updateItemField(idx, 'grade', e.target.value)}
                                  className={`w-full rounded-lg px-2 py-1 text-xs font-bold border ${
                                    isLight ? 'bg-white border-blue-400 text-blue-700' : 'bg-slate-900 border-cyan-500 text-cyan-300'
                                  }`}
                                />
                              )}
                            </div>
                            <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>/</span>
                            <input
                              type="text"
                              value={item.billet_size || ''}
                              onChange={(e) => updateItemField(idx, 'billet_size', e.target.value)}
                              placeholder="e.g. 5 inch (127 mm)"
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
                          <div className="flex items-center justify-between mb-0.5">
                            <label className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              Supplier
                            </label>
                            {item.supplier_name && historySuppliers.includes(item.supplier_name.trim()) && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                                ✓ ในประวัติ
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <select
                              value={
                                availableSuppliers.includes(item.supplier_name || '')
                                  ? item.supplier_name
                                  : item.supplier_name
                                  ? '__CUSTOM__'
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val !== '__CUSTOM__') {
                                  updateItemField(idx, 'supplier_name', val);
                                }
                              }}
                              className={`w-full rounded px-2 py-1 text-xs font-medium focus:outline-none border cursor-pointer ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                                  : 'bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500'
                              }`}
                            >
                              <option value="">-- {isTh ? 'เลือก Supplier จากประวัติ' : 'Select Supplier'} ({historySuppliers.length}) --</option>
                              {historySuppliers.length > 0 && (
                                <optgroup label={isTh ? "📋 ซัพพลายเออร์ที่เคยมีประวัติบันทึก" : "📋 Recorded Suppliers from History"}>
                                  {historySuppliers.map(sup => (
                                    <option key={`card-hist-${sup}`} value={sup}>
                                      ⭐ {sup}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label={isTh ? "🏢 ซัพพลายเออร์มาตรฐานอื่นๆ" : "🏢 Other Standard Suppliers"}>
                                {availableSuppliers
                                  .filter(sup => !historySuppliers.includes(sup))
                                  .map(sup => (
                                    <option key={`card-std-${sup}`} value={sup}>
                                      {sup}
                                    </option>
                                  ))}
                              </optgroup>
                              <option value="__CUSTOM__">✏️ {isTh ? 'พิมพ์ชื่อ Supplier อื่น...' : 'Custom Supplier...'}</option>
                            </select>

                            {(!availableSuppliers.includes(item.supplier_name || '') || item.supplier_name === '__CUSTOM__') && (
                              <input
                                list={`supplier-list-${idx}`}
                                type="text"
                                placeholder={isTh ? 'ระบุชื่อ Supplier...' : 'Enter supplier name...'}
                                value={item.supplier_name === '__CUSTOM__' ? '' : (item.supplier_name || '')}
                                onChange={(e) => updateItemField(idx, 'supplier_name', e.target.value)}
                                className={`w-full rounded px-2 py-1 text-xs border ${
                                  isLight
                                    ? 'bg-white border-blue-400 text-slate-800 focus:border-blue-500'
                                    : 'bg-slate-900 border-cyan-500 text-cyan-200 focus:border-cyan-500'
                                }`}
                              />
                            )}
                            <datalist id={`supplier-list-${idx}`}>
                              {historySuppliers.map(sup => (
                                <option key={`dl-hist-${sup}`} value={sup} />
                              ))}
                              {availableSuppliers
                                .filter(s => !historySuppliers.includes(s))
                                .map(sup => (
                                  <option key={`dl-std-${sup}`} value={sup} />
                                ))}
                            </datalist>
                          </div>
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

                      {/* 3 Inspection Blocks: Inspector & Dimensions, Visual Check, Analysis */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        {/* Block 1: INSPECTOR & DIMENSIONS */}
                        <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-950/70 border-slate-800 shadow-xs'
                        }`}>
                          <div>
                            <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${
                              isLight ? 'text-indigo-600' : 'text-indigo-400'
                            }`}>
                              INSPECTOR & DIMENSIONS
                            </h4>
                            
                            <div className="space-y-2.5">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                    Inspector Name
                                  </label>
                                  <div className="relative">
                                    <User className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-indigo-400' : 'text-indigo-400'}`} />
                                    <input
                                      type="text"
                                      placeholder="Name..."
                                      value={item.inspector_name || ''}
                                      onChange={(e) => updateItemField(idx, 'inspector_name', e.target.value)}
                                      className={`w-full rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-medium focus:outline-none border ${
                                        isLight
                                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                                          : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                                      }`}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                    Shift (กะ)
                                  </label>
                                  <input
                                    list={`shift-list-${idx}`}
                                    type="text"
                                    placeholder="e.g. Day / Night / Shift A..."
                                    value={item.shift || ''}
                                    onChange={(e) => updateItemField(idx, 'shift', e.target.value)}
                                    className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none border ${
                                      isLight
                                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                                        : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                                    }`}
                                  />
                                  <datalist id={`shift-list-${idx}`}>
                                    <option value="Day (กะกลางวัน / A)" />
                                    <option value="Night (กะกลางคืน / B)" />
                                    <option value="Shift A" />
                                    <option value="Shift B" />
                                    <option value="Shift C" />
                                  </datalist>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                    Diameter
                                  </label>
                                  <input
                                    type="text"
                                    value={item.diameter || ''}
                                    onChange={(e) => updateItemField(idx, 'diameter', e.target.value)}
                                    className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border ${
                                      isLight
                                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                                        : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                    Length
                                  </label>
                                  <input
                                    type="text"
                                    value={item.length || ''}
                                    onChange={(e) => updateItemField(idx, 'length', e.target.value)}
                                    className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border ${
                                      isLight
                                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                                        : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Block 2: VISUAL CHECK */}
                        <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-950/70 border-slate-800 shadow-xs'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className={`text-[11px] font-bold uppercase tracking-wider ${
                                isLight ? 'text-indigo-600' : 'text-indigo-400'
                              }`}>
                                VISUAL CHECK
                              </h4>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-medium">
                                {isTh ? 'เกณฑ์มาตรฐาน & ตรวจสอบ' : 'Criteria & Check'}
                              </span>
                            </div>
                            
                            <div className="space-y-2.5">
                              {/* Checklist Items: Cutting Surface & Billet Slid */}
                              <div className="space-y-1.5">
                                <label className={`text-[10px] font-semibold block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                  {isTh ? 'รายการตรวจสอบ (Checklist)' : 'Checklist Items'}
                                </label>
                                
                                {/* Checklist 1: Cutting Surface < 2mm */}
                                <label className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                                  item.cutting_surface_lt2 !== false
                                    ? isLight
                                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                                      : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                                    : isLight
                                      ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                                      : 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={item.cutting_surface_lt2 !== false}
                                      onChange={(e) => updateItemField(idx, 'cutting_surface_lt2', e.target.checked)}
                                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-emerald-600 cursor-pointer"
                                    />
                                    <span className="text-xs font-semibold">Cutting Surface &lt; 2 mm</span>
                                  </div>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    item.cutting_surface_lt2 !== false
                                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {item.cutting_surface_lt2 !== false ? (isTh ? 'ผ่าน' : 'PASS') : (isTh ? 'ไม่ผ่าน' : 'FAIL')}
                                  </span>
                                </label>

                                {/* Checklist 2: Billet Slid <= 2.5mm */}
                                <label className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                                  item.billet_slid_lt25 !== false
                                    ? isLight
                                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                                      : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                                    : isLight
                                      ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                                      : 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={item.billet_slid_lt25 !== false}
                                      onChange={(e) => updateItemField(idx, 'billet_slid_lt25', e.target.checked)}
                                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-emerald-600 cursor-pointer"
                                    />
                                    <span className="text-xs font-semibold">Billet Slid ≤ 2.5 mm</span>
                                  </div>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    item.billet_slid_lt25 !== false
                                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {item.billet_slid_lt25 !== false ? (isTh ? 'ผ่าน' : 'PASS') : (isTh ? 'ไม่ผ่าน' : 'FAIL')}
                                  </span>
                                </label>
                              </div>

                              {/* Separated Defect Fields: Depth < 5mm, Width < 50mm, Length < 100mm */}
                              <div className="pt-1">
                                <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                  {isTh ? 'ขนาดตำหนิ (Defect Measurements)' : 'Defect Dimensions'}
                                </label>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {/* Depth < 5mm */}
                                  <div>
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className={`text-[9px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Depth</span>
                                      <span className="text-[8px] text-slate-400">&lt;5mm</span>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="0 / -"
                                      value={item.defect_depth ?? ''}
                                      onChange={(e) => updateItemField(idx, 'defect_depth', e.target.value)}
                                      className={`w-full rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none border ${
                                        !isIgnoredValue(item.defect_depth) && parseFloat(String(item.defect_depth).replace(/,/g, '.')) >= 5
                                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-600 font-bold'
                                          : isLight
                                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                                            : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                                      }`}
                                    />
                                  </div>

                                  {/* Width < 50mm */}
                                  <div>
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className={`text-[9px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Width</span>
                                      <span className="text-[8px] text-slate-400">&lt;50mm</span>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="0 / -"
                                      value={item.defect_width ?? ''}
                                      onChange={(e) => updateItemField(idx, 'defect_width', e.target.value)}
                                      className={`w-full rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none border ${
                                        !isIgnoredValue(item.defect_width) && parseFloat(String(item.defect_width).replace(/,/g, '.')) >= 50
                                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-600 font-bold'
                                          : isLight
                                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                                            : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                                      }`}
                                    />
                                  </div>

                                  {/* Length < 100mm */}
                                  <div>
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className={`text-[9px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Length</span>
                                      <span className="text-[8px] text-slate-400">&lt;100mm</span>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="0 / -"
                                      value={item.defect_length ?? ''}
                                      onChange={(e) => updateItemField(idx, 'defect_length', e.target.value)}
                                      className={`w-full rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none border ${
                                        !isIgnoredValue(item.defect_length) && parseFloat(String(item.defect_length).replace(/,/g, '.')) >= 100
                                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-600 font-bold'
                                          : isLight
                                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                                            : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Block 3: ANALYSIS */}
                        <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-950/70 border-slate-800 shadow-xs'
                        }`}>
                          <div>
                            <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${
                              isLight ? 'text-indigo-600' : 'text-indigo-400'
                            }`}>
                              ANALYSIS
                            </h4>
                            
                            <div className="space-y-2.5">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                    Bending
                                  </label>
                                  <input
                                    type="text"
                                    value={item.bending || ''}
                                    onChange={(e) => updateItemField(idx, 'bending', e.target.value)}
                                    className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border ${
                                      isLight
                                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                                        : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                    Appearance
                                  </label>
                                  <input
                                    type="text"
                                    value={item.appearance || ''}
                                    onChange={(e) => updateItemField(idx, 'appearance', e.target.value)}
                                    className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border ${
                                      isLight
                                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                                        : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                                    }`}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                  XRF Results
                                </label>
                                <input
                                  type="text"
                                  value={item.xrf || ''}
                                  onChange={(e) => updateItemField(idx, 'xrf', e.target.value)}
                                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border ${
                                    isLight
                                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                                      : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className={`p-4 rounded-2xl border shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className={`text-[10px] font-bold uppercase block ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>{isTh ? 'จำนวน Heat ที่ตรวจ' : 'Total Inspected'}</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{dashboardStats.total}</span>
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Heats</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-xs ${
              isLight ? 'bg-white border-blue-200' : 'bg-slate-900 border-blue-900/40'
            }`}>
              <span className={`text-[10px] font-bold uppercase block ${
                isLight ? 'text-blue-600' : 'text-blue-400'
              }`}>{isTh ? 'น้ำหนักรวมรับเข้า' : 'Total Weight'}</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-2xl font-bold font-mono ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                  {dashboardStats.totalWeightKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className={`text-xs ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>kg</span>
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

            <div className={`p-4 rounded-2xl border shadow-xs col-span-2 sm:col-span-1 ${
              isLight ? 'bg-white border-cyan-200' : 'bg-slate-900 border-cyan-900/40'
            }`}>
              <span className={`text-[10px] font-bold uppercase block ${
                isLight ? 'text-cyan-700' : 'text-cyan-400'
              }`}>Quality Pass Rate</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-2xl font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{dashboardStats.okRate}%</span>
                <span className={`text-xs ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>Yield</span>
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

          {/* Batch Print Action Toolbar */}
          <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-xs transition-all ${
            selectedHistoryItems.length > 0
              ? isLight ? 'bg-blue-50/90 border-blue-200' : 'bg-blue-950/40 border-blue-800/70'
              : isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/60'
          }`}>
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={toggleSelectAllHistory}
                disabled={filteredHistory.length === 0}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  isAllFilteredSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                {isAllFilteredSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>{isAllFilteredSelected ? (isTh ? 'ยกเลิกเลือกทั้งหมด' : 'Deselect All') : (isTh ? 'เลือกทั้งหมดในรายการ' : 'Select All Filtered')}</span>
              </button>

              <span className={`text-xs font-semibold ${
                selectedHistoryItems.length > 0
                  ? isLight ? 'text-blue-900' : 'text-blue-200'
                  : isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {isTh 
                  ? `เลือกแล้ว ${selectedHistoryItems.length} / ${filteredHistory.length} Heat Numbers`
                  : `Selected ${selectedHistoryItems.length} / ${filteredHistory.length} Heat Numbers`}
              </span>

              {selectedHistoryItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistorySelection}
                  className={`text-xs font-semibold underline hover:no-underline transition ${
                    isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isTh ? 'ล้างที่เลือก' : 'Clear'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePrintBatchTags(selectedHistoryItems)}
                disabled={selectedHistoryItems.length === 0}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm ${
                  selectedHistoryItems.length > 0
                    ? 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-blue-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                }`}
                title={isTh ? "พิมพ์แท็ก QR Label ทุก Heat No. ที่เลือกพร้อมกัน" : "Print QR Tags for all selected heats"}
              >
                <Printer className="w-4 h-4" />
                <span>
                  {isTh 
                    ? `พิมพ์แท็กที่เลือกพร้อมกัน (${selectedHistoryItems.length} ใบ)` 
                    : `Print Selected Tags (${selectedHistoryItems.length})`}
                </span>
              </button>

              {filteredHistory.length > 0 && selectedHistoryItems.length === 0 && (
                <button
                  type="button"
                  onClick={() => handlePrintBatchTags(filteredHistory)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                    isLight 
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title={isTh ? "พิมพ์แท็กทั้งหมดที่ค้นหาได้ในรายการ" : "Print all filtered tags"}
                >
                  <Printer className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isTh ? `พิมพ์ทั้งหมด (${filteredHistory.length})` : `Print All (${filteredHistory.length})`}</span>
                </button>
              )}
            </div>
          </div>

          {/* Weight Analytics Chart by Grade & Supplier */}
          <BilletWeightAnalyticsChart
            items={filteredHistory}
            gradeSpecs={gradeSpecs}
            isLight={isLight}
            isTh={isTh}
          />

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
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={toggleSelectAllHistory}
                        disabled={filteredHistory.length === 0}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        title={isTh ? "เลือกทั้งหมด" : "Select All"}
                      />
                    </th>
                    <th className="p-3">Heat No / Grade</th>
                    <th className="p-3">Supplier / Inspector</th>
                    <th className="p-3 text-center">Qty / Weight</th>
                    <th className="p-3 text-center">Judgement</th>
                    <th className="p-3 text-center">Action</th>
                    <th className="p-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
                  {filteredHistory.map((entry, idx) => {
                    const itemKey = getHistoryItemKey(entry, idx);
                    const isSelected = selectedHistoryIds.includes(itemKey);
                    const spec = findMatchingSpec(entry.grade);
                    return (
                      <tr 
                        key={itemKey} 
                        className={`transition ${
                          isSelected 
                            ? isLight ? 'bg-blue-50/70' : 'bg-blue-950/30'
                            : isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-950/50'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectHistory(itemKey)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          />
                        </td>
                        <td className="p-3">
                          <span className={`font-bold font-mono block ${isLight ? 'text-slate-900' : 'text-white'}`}>{entry.heat_number}</span>
                          <span className="text-[11px] font-semibold" style={{ color: spec?.color || (isLight ? '#2563eb' : '#38bdf8') }}>
                            {entry.grade} ({entry.billet_size})
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`block font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{entry.supplier_name || '-'}</span>
                          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {entry.inspector_name || 'QA'}
                            {entry.shift ? ` (${entry.shift})` : ''}
                          </span>
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
                              title={isTh ? "แก้ไขข้อมูล (ต้องใส่รหัสผ่านผู้ดูแลระบบ)" : "Edit Record (Admin password required)"}
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
                              title={isTh ? "ลบรายการ (ต้องใส่รหัสผ่านผู้ดูแลระบบ)" : "Delete Record (Admin password required)"}
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
                  placeholder={isTh ? "รหัสผ่านผู้ดูแลระบบ" : "Admin Password"}
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
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' : 'Invalid password. Please try again.'}
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
                      className={`group p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                        isSelected 
                          ? isLight 
                            ? 'bg-white text-blue-700 font-bold border-blue-400 shadow-xs' 
                            : 'bg-slate-800 text-white font-bold border-cyan-500/50 shadow-sm' 
                          : isLight 
                            ? 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: gradeSpecs[grade].color }}
                        />
                        <span className="text-xs font-mono truncate">{grade}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestDeleteGrade(grade);
                        }}
                        className="p-1.5 rounded-lg opacity-60 group-hover:opacity-100 transition hover:bg-rose-500/20 text-rose-500 hover:text-rose-600"
                        title={isTh ? `ลบเกรด ${grade}` : `Delete ${grade}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                <div className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={resetDefaultGradeSpecs}
                    className={`w-full text-[11px] py-1.5 px-2 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition ${
                      isLight 
                        ? 'text-slate-600 bg-slate-100 hover:bg-slate-200 border-slate-300' 
                        : 'text-slate-400 bg-slate-900 hover:bg-slate-800 border-slate-800'
                    }`}
                    title={isTh ? 'คืนค่ามาตรฐานเกรดเริ่มต้น (6063, 6061, 6005, 6082)' : 'Reset default grade specs'}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isTh ? 'คืนค่าเริ่มต้น (Reset Default)' : 'Reset Defaults'}</span>
                  </button>
                </div>
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
                          type="button"
                          onClick={() => handleRequestDeleteGrade(editingGrade)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition ${
                            isLight 
                              ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200' 
                              : 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isTh ? 'ลบเกรดนี้' : 'Delete Grade'}</span>
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

      {/* PASSWORD / CONFIRMATION PROMPT MODAL FOR DELETING RECORD / GRADE */}
      {isDeleteAuthOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          isLight ? 'bg-slate-900/40 backdrop-blur-xs' : 'bg-slate-950/80 backdrop-blur-sm'
        }`}>
          <div className={`rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button 
              onClick={() => {
                setIsDeleteAuthOpen(false);
                setTargetDeleteHistoryItem(null);
                setTargetDeleteGrade(null);
                setDeleteAuthPassword("");
                setDeleteAuthError(false);
              }} 
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
                {targetDeleteGrade
                  ? (isTh ? `ยืนยันการลบเกรด: ${targetDeleteGrade}` : `Confirm Delete Grade Spec: ${targetDeleteGrade}`)
                  : (isTh ? 'ยืนยันรหัสผ่านเพื่อลบข้อมูล' : 'Password Required for Deletion')}
              </h4>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {targetDeleteHistoryItem ? (
                  isTh 
                    ? `ต้องการลบประวัติ Heat No. ${targetDeleteHistoryItem.heat_number} กรุณาใส่รหัสผ่านผู้ดูแลระบบเพื่อยืนยัน` 
                    : `Enter admin password to delete Heat No. ${targetDeleteHistoryItem.heat_number}`
                ) : (
                  isTh 
                    ? `คุณต้องการลบเกณฑ์มาตรฐานเกรด ${targetDeleteGrade} หรือไม่? ${isAdminAuthenticated ? 'สามารถกดยืนยันลบได้ทันทีหรือใส่รหัสผ่านผู้ดูแลระบบ' : 'กรุณาใส่รหัสผ่านผู้ดูแลระบบเพื่อยืนยัน'}` 
                    : `Are you sure you want to delete Grade Spec ${targetDeleteGrade}? ${isAdminAuthenticated ? 'Click confirm to proceed or enter admin password.' : 'Enter admin password to confirm.'}`
                )}
              </p>
            </div>

            <form onSubmit={handleVerifyDeletePassword} className="space-y-3">
              {!isAdminAuthenticated || targetDeleteHistoryItem ? (
                <input
                  type="password"
                  autoFocus
                  placeholder={isTh ? "ใส่รหัสผ่านผู้ดูแลระบบ" : "Enter admin password"}
                  value={deleteAuthPassword}
                  onChange={(e) => setDeleteAuthPassword(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2.5 text-center font-mono text-sm focus:outline-none border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-rose-500'
                  }`}
                />
              ) : (
                <div className={`p-2.5 rounded-xl text-center text-xs border ${
                  isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  <span className="font-semibold">{isTh ? 'คุณอยู่ในสถานะ Admin แล้ว สามารถกดยืนยันการลบได้ทันที' : 'Authenticated as Admin. Click confirm below.'}</span>
                </div>
              )}

              {deleteAuthError && (
                <p className="text-xs text-rose-500 font-semibold text-center">
                  {isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง' : 'Incorrect password! Please try again.'}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteAuthOpen(false);
                    setTargetDeleteHistoryItem(null);
                    setTargetDeleteGrade(null);
                    setDeleteAuthPassword("");
                    setDeleteAuthError(false);
                  }}
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
                placeholder={isTh ? "ใส่รหัสผ่านผู้ดูแลระบบ" : "Enter admin password"}
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
                  {isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง' : 'Incorrect password! Please try again.'}
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
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Grade</label>
                  {(() => {
                    const matchedSpec = findMatchingSpec(editingHistoryItem.grade);
                    return matchedSpec ? (
                      <span 
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1"
                        style={{
                          backgroundColor: `${matchedSpec.color}15`,
                          borderColor: `${matchedSpec.color}40`,
                          color: matchedSpec.color
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: matchedSpec.color }} />
                        Spec Matched
                      </span>
                    ) : (
                      <span className="text-[9px] text-amber-500 font-medium">⚠ No Spec</span>
                    );
                  })()}
                </div>
                <div className="flex flex-col gap-1.5">
                  <select
                    value={availableGrades.includes(editingHistoryItem.grade || '') ? editingHistoryItem.grade : (editingHistoryItem.grade ? '__CUSTOM__' : '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== '__CUSTOM__') {
                        setEditingHistoryItem(prev => prev ? { ...prev, grade: val } : null);
                      }
                    }}
                    className={`w-full rounded-xl px-3 py-2 font-bold focus:outline-none border cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                    }`}
                  >
                    <option value="">-- เลือกเกรด / Select Grade --</option>
                    {availableGrades.map(g => (
                      <option key={g} value={g}>
                        {g} {gradeSpecs[g]?.name ? `(${gradeSpecs[g].name})` : ''}
                      </option>
                    ))}
                    <option value="__CUSTOM__">✏️ กำหนดเกรดอื่น / Custom...</option>
                  </select>

                  {(!availableGrades.includes(editingHistoryItem.grade || '') || editingHistoryItem.grade === '__CUSTOM__') && (
                    <input
                      type="text"
                      placeholder="พิมพ์ชื่อเกรด..."
                      value={editingHistoryItem.grade === '__CUSTOM__' ? '' : (editingHistoryItem.grade || '')}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, grade: e.target.value } : null)}
                      className={`w-full rounded-xl px-3 py-1.5 text-xs font-bold border ${
                        isLight ? 'bg-white border-amber-400 text-amber-900' : 'bg-slate-900 border-amber-500 text-amber-200'
                      }`}
                    />
                  )}
                </div>
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
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Supplier Name
                  </label>
                  {editingHistoryItem.supplier_name && historySuppliers.includes(editingHistoryItem.supplier_name.trim()) && (
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                      ✓ ในประวัติ
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <select
                    value={
                      availableSuppliers.includes(editingHistoryItem.supplier_name || '')
                        ? editingHistoryItem.supplier_name
                        : editingHistoryItem.supplier_name
                        ? '__CUSTOM__'
                        : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== '__CUSTOM__') {
                        setEditingHistoryItem(prev => prev ? { ...prev, supplier_name: val } : null);
                      }
                    }}
                    className={`w-full rounded-xl px-3 py-2 font-medium text-xs focus:outline-none border cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                    }`}
                  >
                    <option value="">-- {isTh ? 'เลือก Supplier จากประวัติ' : 'Select Supplier from History'} ({historySuppliers.length}) --</option>
                    {historySuppliers.length > 0 && (
                      <optgroup label={isTh ? "📋 ซัพพลายเออร์ที่เคยมีประวัติบันทึก" : "📋 Recorded Suppliers from History"}>
                        {historySuppliers.map(sup => (
                          <option key={`edit-hist-${sup}`} value={sup}>
                            ⭐ {sup}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label={isTh ? "🏢 ซัพพลายเออร์มาตรฐานอื่นๆ" : "🏢 Other Standard Suppliers"}>
                      {availableSuppliers
                        .filter(sup => !historySuppliers.includes(sup))
                        .map(sup => (
                          <option key={`edit-std-${sup}`} value={sup}>
                            {sup}
                          </option>
                        ))}
                    </optgroup>
                    <option value="__CUSTOM__">✏️ {isTh ? 'พิมพ์ชื่อ Supplier อื่น...' : 'Custom Supplier...'}</option>
                  </select>

                  {(!availableSuppliers.includes(editingHistoryItem.supplier_name || '') || editingHistoryItem.supplier_name === '__CUSTOM__') && (
                    <input
                      list="edit-supplier-options"
                      type="text"
                      placeholder="Select or enter supplier..."
                      value={editingHistoryItem.supplier_name === '__CUSTOM__' ? '' : (editingHistoryItem.supplier_name || '')}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, supplier_name: e.target.value } : null)}
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                        isLight
                          ? 'bg-white border-amber-400 text-slate-900 focus:border-amber-500'
                          : 'bg-slate-900 border-amber-500 text-amber-200 focus:border-amber-500'
                      }`}
                    />
                  )}
                  <datalist id="edit-supplier-options">
                    {historySuppliers.map(sup => (
                      <option key={`dl-eh-${sup}`} value={sup} />
                    ))}
                    {availableSuppliers
                      .filter(s => !historySuppliers.includes(s))
                      .map(sup => (
                        <option key={`dl-es-${sup}`} value={sup} />
                      ))}
                  </datalist>
                </div>
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
                <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Shift (กะ)</label>
                <input
                  list="edit-shift-options"
                  type="text"
                  placeholder="e.g. Day / Night / Shift A..."
                  value={editingHistoryItem.shift || ''}
                  onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, shift: e.target.value } : null)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                />
                <datalist id="edit-shift-options">
                  <option value="Day (กะกลางวัน / A)" />
                  <option value="Night (กะกลางคืน / B)" />
                  <option value="Shift A" />
                  <option value="Shift B" />
                  <option value="Shift C" />
                </datalist>
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

              <div>
                <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Length</label>
                <input
                  type="text"
                  value={editingHistoryItem.length || ''}
                  onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, length: e.target.value } : null)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Bending</label>
                <input
                  type="text"
                  value={editingHistoryItem.bending || ''}
                  onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, bending: e.target.value } : null)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Appearance</label>
                <input
                  type="text"
                  value={editingHistoryItem.appearance || ''}
                  onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, appearance: e.target.value } : null)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[10px] font-bold block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>XRF Results</label>
                <input
                  type="text"
                  value={editingHistoryItem.xrf || ''}
                  onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, xrf: e.target.value } : null)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            {/* Visual Checks in Edit Modal */}
            <div className={`p-4 rounded-xl border space-y-3 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  Visual Inspection Checklist &amp; Measurements
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-medium">
                  {isTh ? 'รายการตรวจสอบ & ขนาดตำหนิ' : 'Checklist & Defect Sizes'}
                </span>
              </div>

              {/* Checklist items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  editingHistoryItem.cutting_surface_lt2 !== false
                    ? isLight
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                    : isLight
                      ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                      : 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingHistoryItem.cutting_surface_lt2 !== false}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, cutting_surface_lt2: e.target.checked } : null)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-emerald-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold">Cutting Surface &lt; 2 mm</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    editingHistoryItem.cutting_surface_lt2 !== false
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}>
                    {editingHistoryItem.cutting_surface_lt2 !== false ? (isTh ? 'ผ่าน' : 'PASS') : (isTh ? 'ไม่ผ่าน' : 'FAIL')}
                  </span>
                </label>

                <label className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  editingHistoryItem.billet_slid_lt25 !== false
                    ? isLight
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                    : isLight
                      ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                      : 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingHistoryItem.billet_slid_lt25 !== false}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, billet_slid_lt25: e.target.checked } : null)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-emerald-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold">Billet Slid ≤ 2.5 mm</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    editingHistoryItem.billet_slid_lt25 !== false
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}>
                    {editingHistoryItem.billet_slid_lt25 !== false ? (isTh ? 'ผ่าน' : 'PASS') : (isTh ? 'ไม่ผ่าน' : 'FAIL')}
                  </span>
                </label>
              </div>

              {/* Separated Defect fields */}
              <div>
                <label className={`text-[10px] font-bold block mb-1 text-slate-500`}>
                  {isTh ? 'ขนาดตำหนิ (Defect Measurements)' : 'Defect Measurements'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Depth</span>
                      <span className="text-[9px] text-slate-400">&lt;5mm</span>
                    </div>
                    <input
                      type="text"
                      placeholder="0 / -"
                      value={editingHistoryItem.defect_depth ?? ''}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, defect_depth: e.target.value } : null)}
                      className={`w-full rounded-xl px-3 py-2 text-center text-xs focus:outline-none border ${
                        !isIgnoredValue(editingHistoryItem.defect_depth) && parseFloat(String(editingHistoryItem.defect_depth).replace(/,/g, '.')) >= 5
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-600 font-bold'
                          : isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                            : 'bg-slate-900 border-slate-800 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Width</span>
                      <span className="text-[9px] text-slate-400">&lt;50mm</span>
                    </div>
                    <input
                      type="text"
                      placeholder="0 / -"
                      value={editingHistoryItem.defect_width ?? ''}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, defect_width: e.target.value } : null)}
                      className={`w-full rounded-xl px-3 py-2 text-center text-xs focus:outline-none border ${
                        !isIgnoredValue(editingHistoryItem.defect_width) && parseFloat(String(editingHistoryItem.defect_width).replace(/,/g, '.')) >= 50
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-600 font-bold'
                          : isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                            : 'bg-slate-900 border-slate-800 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Length</span>
                      <span className="text-[9px] text-slate-400">&lt;100mm</span>
                    </div>
                    <input
                      type="text"
                      placeholder="0 / -"
                      value={editingHistoryItem.defect_length ?? ''}
                      onChange={(e) => setEditingHistoryItem(prev => prev ? { ...prev, defect_length: e.target.value } : null)}
                      className={`w-full rounded-xl px-3 py-2 text-center text-xs focus:outline-none border ${
                        !isIgnoredValue(editingHistoryItem.defect_length) && parseFloat(String(editingHistoryItem.defect_length).replace(/,/g, '.')) >= 100
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-600 font-bold'
                          : isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                            : 'bg-slate-900 border-slate-800 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>
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

      {/* PRINT TAG PREVIEW & PRINT MODAL */}
      {activePrintItem && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto ${
          isLight ? 'bg-slate-900/40 backdrop-blur-xs' : 'bg-slate-950/85 backdrop-blur-md'
        }`}>
          <div className={`border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b pb-3.5 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {isTh ? 'พิมพ์แท็กรับรองคุณภาพ Billet (QR Tag)' : 'Print Quality Approved Billet Tag'}
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Heat No. <span className="font-mono font-bold">{activePrintItem.heat_number || 'N/A'}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActivePrintItem(null)} 
                className={isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-slate-200'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Payload Selector & Info */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-500" />
                <span className="font-semibold">{isTh ? 'รูปแบบข้อมูล QR Code:' : 'QR Code Format:'}</span>
              </div>
              <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setQrDataMode('full')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition ${
                    qrDataMode === 'full' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isTh ? 'ข้อมูลเต็ม (Full QA Info)' : 'Full QA Info'}
                </button>
                <button
                  type="button"
                  onClick={() => setQrDataMode('id')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition ${
                    qrDataMode === 'id' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isTh ? 'เฉพาะ Heat No. (Code Only)' : 'Code Only'}
                </button>
              </div>
            </div>

            {/* Visual Tag Preview Card */}
            {(() => {
              const spec = findMatchingSpec(activePrintItem.grade);
              const tagColor = spec?.color || "#2563eb";
              const jg = activePrintItem.judgement || performJudgement(activePrintItem);
              const isPass = jg === 'PASS';

              return (
                <div 
                  className="rounded-2xl p-4 bg-white text-slate-900 border-3 shadow-md mx-auto max-w-sm relative"
                  style={{ borderColor: tagColor }}
                >
                  {/* Tag Header */}
                  <div 
                    className="text-white text-center font-black py-1.5 px-3 rounded-lg text-xs tracking-wider uppercase shadow-xs mb-3"
                    style={{ backgroundColor: tagColor }}
                  >
                    QUALITY APPROVED BILLET TAG
                  </div>

                  <div className="flex gap-3 items-stretch">
                    {/* 100% Real Scannable Vector QR Code */}
                    <div 
                      onClick={() => setZoomQrPayload({
                        isOpen: true,
                        title: isTh ? 'QR Code ตรวจรับบิลเล็ต (IQA-01)' : 'Billet Inspection QR Code',
                        subtitle: `${activePrintItem.grade} • Heat: ${activePrintItem.heat_number}`,
                        payload: getBilletQrPayload(activePrintItem, qrDataMode)
                      })}
                      className="w-[104px] min-w-[104px] bg-white border border-slate-300 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center p-2 text-center shadow-xs hover:shadow-md transition cursor-pointer group"
                      title={isTh ? 'คลิกเพื่อขยาย QR Code สำหรับสแกนผ่านหน้าจอ' : 'Click to enlarge QR for screen scan'}
                    >
                      <div className="w-[88px] h-[88px] flex items-center justify-center overflow-hidden">
                        <QRCodeView 
                          value={getBilletQrPayload(activePrintItem, qrDataMode)} 
                          size={88} 
                          margin={4} 
                        />
                      </div>
                      <span className="text-[7.5px] font-mono font-bold text-slate-800 truncate max-w-full mt-1">
                        {activePrintItem.heat_number || 'BILLET-QR'}
                      </span>
                      <span className="text-[8px] text-blue-600 font-semibold mt-0.5 opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
                        <Maximize2 className="w-2.5 h-2.5" />
                        {isTh ? 'แตะขยายสแกน' : 'Zoom Scan'}
                      </span>
                    </div>

                    {/* Tag Meta Details */}
                    <div className="flex-1 text-[11px] leading-tight space-y-1">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase block">Heat Number</span>
                        <span className="font-mono font-bold text-sm text-slate-950">{activePrintItem.heat_number || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Grade:</span>
                        <span className="font-black text-xs px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: tagColor }}>
                          {activePrintItem.grade || '-'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <div>
                          <span className="text-slate-500">Size: </span>
                          <span className="font-bold">{activePrintItem.billet_size || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Qty: </span>
                          <span className="font-bold">{activePrintItem.quantity_pcs || '0'} pcs</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <div>
                          <span className="text-slate-500">Wt: </span>
                          <span className="font-bold">{activePrintItem.weight_kg || '0'} kg</span>
                        </div>
                        <div>
                          <span className="text-slate-500">QC: </span>
                          <span className="font-bold truncate">{activePrintItem.inspector_name || 'QA Team'}</span>
                        </div>
                      </div>
                      <div className="pt-0.5 flex items-center justify-between">
                        <span className="text-[9px] text-slate-500">{activePrintItem.timestamp || (activePrintItem.createdAt ? new Date(activePrintItem.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                          isPass ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}>
                          {jg}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chemistry Preview Footer */}
                  {activePrintItem.chemical_composition && Object.keys(activePrintItem.chemical_composition).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-dashed border-slate-300 text-[9px] font-mono text-slate-700 grid grid-cols-5 gap-1 text-center bg-slate-50 p-1.5 rounded-lg">
                      {Object.entries(activePrintItem.chemical_composition).slice(0, 5).map(([el, val]) => (
                        <div key={el}>
                          <span className="font-bold text-slate-500 block text-[8px]">{el}</span>
                          <span className="font-semibold text-slate-900">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setZoomQrPayload({
                  isOpen: true,
                  title: isTh ? 'QR Code ตรวจรับบิลเล็ต (IQA-01)' : 'Billet Inspection QR Code',
                  subtitle: `${activePrintItem.grade} • Heat: ${activePrintItem.heat_number}`,
                  payload: getBilletQrPayload(activePrintItem, qrDataMode)
                })}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  isLight 
                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' 
                    : 'bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border-blue-800'
                }`}
                title={isTh ? 'เปิด QR ขนาดใหญ่สำหรับสแกนผ่านหน้าจอ' : 'Open large QR for screen scan'}
              >
                <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{isTh ? 'สแกนผ่านจอ' : 'Screen Scan'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const tagDate = activePrintItem.timestamp || (activePrintItem.createdAt ? new Date(activePrintItem.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                  const tagText = `[BILLET QUALITY TAG]\nHeat No: ${activePrintItem.heat_number}\nGrade: ${activePrintItem.grade}\nSize: ${activePrintItem.billet_size}\nSupplier: ${activePrintItem.supplier_name || '-'}\nQty: ${activePrintItem.quantity_pcs} pcs (${activePrintItem.weight_kg} kg)\nStatus: ${activePrintItem.judgement || 'PASS'}\nInspector: ${activePrintItem.inspector_name || 'QA Team'}\nDate: ${tagDate}`;
                  navigator.clipboard.writeText(tagText);
                  setCopiedTagInfo(true);
                  setTimeout(() => setCopiedTagInfo(false), 2000);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {copiedTagInfo ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTagInfo ? (isTh ? 'คัดลอกแล้ว!' : 'Copied!') : (isTh ? 'คัดลอกข้อมูลแท็ก' : 'Copy Tag Info')}</span>
              </button>

              <button
                type="button"
                onClick={() => triggerDirectPrint(activePrintItem)}
                className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>{isTh ? 'สั่งพิมพ์แท็กทันที' : 'Print Tag Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePrintItem(null)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition border ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                }`}
              >
                {isTh ? 'ปิด' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH PRINT TAG MODAL */}
      {activeBatchPrintItems && activeBatchPrintItems.length > 0 && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto ${
          isLight ? 'bg-slate-900/50 backdrop-blur-xs' : 'bg-slate-950/85 backdrop-blur-md'
        }`}>
          <div className={`border rounded-3xl max-w-4xl w-full p-6 space-y-5 shadow-2xl relative max-h-[92vh] flex flex-col ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b pb-4 shrink-0 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {isTh ? 'พิมพ์แท็กรับรองคุณภาพ Billet แบบกลุ่ม (Batch QR Tag Printing)' : 'Batch Billet QR Tag Printing'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                      {activeBatchPrintItems.length} {isTh ? 'แท็ก' : 'Tags'}
                    </span>
                  </div>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isTh 
                      ? `พิมพ์แท็กระบุ Heat Number ทั้งหมด ${activeBatchPrintItems.length} รายการพร้อมกันในคำสั่งเดียว`
                      : `Simultaneously print ${activeBatchPrintItems.length} Heat identification tags in one single print job`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveBatchPrintItems(null)} 
                className={`p-1.5 rounded-xl transition ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options Bar: Layout Selector & Summary */}
            <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {isTh ? 'รูปแบบการพิมพ์:' : 'Print Layout:'}
                  </span>
                  <div className="inline-flex rounded-xl p-1 bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setBatchPrintLayout('roll')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        batchPrintLayout === 'roll'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      🏷️ {isTh ? 'ม้วนสติกเกอร์ (100x100mm)' : 'Label Roll (100x100mm)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchPrintLayout('grid')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        batchPrintLayout === 'grid'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      📄 {isTh ? 'กระดาษ A4 (4 แท็ก/หน้า)' : 'A4 Sheet Grid (4/page)'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {isTh ? 'QR Code:' : 'QR:'}
                  </span>
                  <div className="inline-flex rounded-xl p-1 bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setQrDataMode('full')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                        qrDataMode === 'full'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {isTh ? 'ข้อมูลเต็ม' : 'Full QA'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrDataMode('id')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                        qrDataMode === 'id'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {isTh ? 'เฉพาะ Heat No.' : 'Code Only'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono flex items-center gap-3">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                  Heats: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{activeBatchPrintItems.length}</strong>
                </span>
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                  Qty: <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                    {activeBatchPrintItems.reduce((sum, it) => sum + (parseFloat(String(it.quantity_pcs)) || 0), 0)} pcs
                  </strong>
                </span>
                <span className={isLight ? 'text-blue-700' : 'text-cyan-400'}>
                  Weight: <strong>
                    {activeBatchPrintItems.reduce((sum, it) => sum + (parseFloat(String(it.weight_kg)) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} kg
                  </strong>
                </span>
              </div>
            </div>

            {/* Visual Scrollable Tag Previews */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4 max-h-[50vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBatchPrintItems.map((item, index) => {
                  const spec = findMatchingSpec(item.grade);
                  const tagColor = spec?.color || "#2563eb";
                  const jg = item.judgement || performJudgement(item);
                  const isPass = jg === 'PASS';

                  return (
                    <div
                      key={item.id || (item.heat_number + index)}
                      className="rounded-2xl p-4 bg-white text-slate-900 border-2 shadow-sm relative flex flex-col justify-between"
                      style={{ borderColor: tagColor }}
                    >
                      <div>
                        {/* Tag Header */}
                        <div 
                          className="text-white text-center font-black py-1.5 px-3 rounded-lg text-xs tracking-wider uppercase shadow-xs mb-2.5 flex items-center justify-between"
                          style={{ backgroundColor: tagColor }}
                        >
                          <span>QUALITY APPROVED BILLET TAG</span>
                          <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded font-mono">#{index + 1}</span>
                        </div>

                        <div className="flex gap-3 items-stretch">
                          {/* 100% Real Scannable Vector QR Code */}
                          <div className="w-24 h-24 min-w-[96px] bg-white border-2 border-slate-900 rounded-xl flex flex-col items-center justify-center p-1.5 text-center shadow-xs">
                            <div className="w-[74px] h-[74px] flex items-center justify-center overflow-hidden bg-white">
                              <QRCodeView 
                                value={getBilletQrPayload(item, qrDataMode)} 
                                size={72} 
                                margin={4} 
                              />
                            </div>
                            <span className="text-[7px] font-mono font-bold text-slate-800 truncate max-w-full mt-0.5">
                              {item.heat_number || 'BILLET-QR'}
                            </span>
                          </div>

                          {/* Tag Meta Details */}
                          <div className="flex-1 text-[11px] leading-tight space-y-1">
                            <div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">Heat Number</span>
                              <span className="font-mono font-bold text-sm text-slate-950">{item.heat_number || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Grade:</span>
                              <span className="font-black text-xs px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: tagColor }}>
                                {item.grade || '-'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              <div>
                                <span className="text-slate-500">Size: </span>
                                <span className="font-bold">{item.billet_size || '-'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Qty: </span>
                                <span className="font-bold">{item.quantity_pcs || '0'} pcs</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              <div>
                                <span className="text-slate-500">Wt: </span>
                                <span className="font-bold">{item.weight_kg || '0'} kg</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Status: </span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold text-white ${isPass ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                  {jg}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 text-[8px] text-slate-400 flex items-center justify-between">
                        <span>Supplier: {item.supplier_name || '-'}</span>
                        <span>{item.timestamp || (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className={`flex flex-col sm:flex-row gap-3 pt-3 border-t shrink-0 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => {
                  const allText = activeBatchPrintItems.map((it, i) => 
                    `[TAG #${i + 1}] Heat: ${it.heat_number} | Grade: ${it.grade} | Size: ${it.billet_size} | Supplier: ${it.supplier_name || '-'} | Qty: ${it.quantity_pcs} pcs | Wt: ${it.weight_kg} kg | Status: ${it.judgement || 'PASS'}`
                  ).join('\n');
                  navigator.clipboard.writeText(allText);
                  setBatchCopiedInfo(true);
                  setTimeout(() => setBatchCopiedInfo(false), 2000);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {batchCopiedInfo ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{batchCopiedInfo ? (isTh ? 'คัดลอกครบทุกใบแล้ว!' : 'All Copied!') : (isTh ? 'คัดลอกข้อมูลทั้งหมด' : 'Copy All Data')}</span>
              </button>

              <button
                type="button"
                onClick={() => triggerDirectMultiplePrint(activeBatchPrintItems, batchPrintLayout, qrDataMode)}
                className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {isTh 
                    ? `สั่งพิมพ์ทั้งหมด ${activeBatchPrintItems.length} แท็กทันที (${batchPrintLayout === 'roll' ? 'ม้วนสติกเกอร์' : 'กระดาษ A4'})` 
                    : `Print All ${activeBatchPrintItems.length} Tags Now (${batchPrintLayout === 'roll' ? 'Roll' : 'A4 Sheet'})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveBatchPrintItems(null)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition border ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                }`}
              >
                {isTh ? 'ปิด' : 'Close'}
              </button>
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
