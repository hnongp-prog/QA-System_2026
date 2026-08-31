import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Upload, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Save, 
  FileSpreadsheet, 
  Beaker, 
  Layers, 
  Settings, 
  Plus, 
  ChevronDown, 
  CheckSquare, 
  Square, 
  Printer, 
  BarChart3, 
  PieChart, 
  Activity, 
  ScanLine, 
  UserCheck, 
  Search, 
  Calendar, 
  Filter, 
  Zap,
  ClipboardList,
  Tag,
  Trash2,
  X,
  Truck,
  Lock,
  Cloud,
  ArrowLeft,
  Sparkles,
  Edit3,
  AlertTriangle,
  Sun,
  Moon,
  Check,
  Copy
} from 'lucide-react';

import { 
  ZnWireGradeSpecMap, 
  ZnWireInspectionRecord, 
  Language, 
  InspectionActivity,
  ThemeMode
} from '../types';
import { analyzeZnWireCertClient } from '../services/geminiClient';
import { useCloudState } from '../services/firestoreSync';

interface ZnWireIncomingAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

const DEFAULT_GRADE_SPECS: ZnWireGradeSpecMap = {
  "ZN-99.99": {
    Pb: { min: 0, max: 0.005 },
    Fe: { min: 0, max: 0.005 },
    Cd: { min: 0, max: 0.003 },
    Sn: { min: 0, max: 0.002 },
    Cu: { min: 0, max: 0.002 },
    Zn: { min: 99.99, max: 100 },
    tensile_strength: { min: 90, max: 130 },
    elongation: { min: 15, max: 40 }
  },
  "ZN-WIRE-STD": {
    Pb: { min: 0, max: 0.05 },
    Fe: { min: 0, max: 0.05 },
    Cd: { min: 0, max: 0.02 },
    Sn: { min: 0, max: 0.02 },
    Cu: { min: 0, max: 0.02 },
    Zn: { min: 99.5, max: 100 },
    tensile_strength: { min: 100, max: 150 },
    elongation: { min: 10, max: 35 }
  }
};

const INITIAL_HISTORY: ZnWireInspectionRecord[] = [
  {
    id: "zn-rec-001",
    heat_number: "H2026-ZN-801",
    grade: "ZN-99.99",
    supplier: "Siam Zinc Wire Metallic Co., Ltd.",
    inspector_name: "Somchai K. (IQA)",
    drum: "DRUM-01",
    batch_no: "BATCH-A1",
    po_no: "PO-2026-0810",
    diameter: "2.0 mm",
    appearance: "Clean / No Oxidation",
    quantity_pcs: "12",
    weight_kg: "250.00",
    tensile_strength: "115",
    elongation: "28",
    chemical_composition: {
      Pb: "0.002",
      Fe: "0.003",
      Cd: "0.001",
      Sn: "0.001",
      Cu: "0.001",
      Zn: "99.99"
    },
    judgement: "PASS",
    date: "2026-08-05",
    timestamp: "05/08/2026, 09:15:00",
    _month: "08",
    _year: "2026"
  },
  {
    id: "zn-rec-002",
    heat_number: "H2026-ZN-802",
    grade: "ZN-WIRE-STD",
    supplier: "Pacific Metal Alloys Ltd.",
    inspector_name: "Somchai K. (IQA)",
    drum: "DRUM-02",
    batch_no: "BATCH-A2",
    po_no: "PO-2026-0812",
    diameter: "2.0 mm",
    appearance: "Slight Surface Tarnish",
    quantity_pcs: "8",
    weight_kg: "180.50",
    tensile_strength: "165",
    elongation: "8",
    chemical_composition: {
      Pb: "0.080",
      Fe: "0.060",
      Cd: "0.030",
      Sn: "0.010",
      Cu: "0.010",
      Zn: "99.20"
    },
    judgement: "FAIL",
    date: "2026-08-05",
    timestamp: "05/08/2026, 11:30:00",
    _month: "08",
    _year: "2026"
  }
];

const CHEM_ELEMENTS = ["Pb", "Fe", "Cd", "Sn", "Cu", "Zn"];
const ADMIN_PASS = "admin2026";

export const ZnWireIncomingApp: React.FC<ZnWireIncomingAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th',
  theme = 'light',
  onToggleTheme
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'config'>('scan');
  
  // Storage states
  const [gradeSpecs, setGradeSpecs] = useCloudState<ZnWireGradeSpecMap>('zn_wire_specs', DEFAULT_GRADE_SPECS);
  const [history, setHistory] = useCloudState<ZnWireInspectionRecord[]>('zn_wire_history', INITIAL_HISTORY);

  // Scan & Processing States
  const [image, setImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ZnWireInspectionRecord[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  
  const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string }>({
    type: 'info',
    message: isTh ? 'พร้อมรับการสแกนใบ COA ลวดสังกะสี' : 'Ready for Zn Wire COA document scan'
  });

  // Admin Security Modal
  const [securityModal, setSecurityModal] = useState<{ show: boolean; onConfirm: (() => void) | null; password: string }>({
    show: false,
    onConfirm: null,
    password: ''
  });

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null; type: 'history' | 'config' | null }>({
    show: false,
    id: null,
    type: null
  });
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteConfirmError, setDeleteConfirmError] = useState(false);

  // Print Tag Modal State
  const [activePrintItem, setActivePrintItem] = useState<ZnWireInspectionRecord | null>(null);
  const [activeBatchPrintItems, setActiveBatchPrintItems] = useState<ZnWireInspectionRecord[] | null>(null);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [batchPrintLayout, setBatchPrintLayout] = useState<'roll' | 'grid'>('roll');
  const [batchCopiedInfo, setBatchCopiedInfo] = useState(false);
  const [copiedTagInfo, setCopiedTagInfo] = useState(false);

  // Config tab state
  const [editingGrade, setEditingGrade] = useState<string>('');
  const [tempGradeName, setTempGradeName] = useState<string>('');

  // History Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // History Edit Modal & Auth States
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<ZnWireInspectionRecord | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<ZnWireInspectionRecord | null>(null);
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState('');
  const [historyAuthError, setHistoryAuthError] = useState(false);

  // Matching Spec logic
  const findMatchingSpec = (scannedGrade?: string) => {
    if (!scannedGrade) return null;
    const normalizedScanned = scannedGrade.toUpperCase().trim();
    if (gradeSpecs[normalizedScanned]) return gradeSpecs[normalizedScanned];
    const matchingKey = Object.keys(gradeSpecs).find(specName => {
      const normalizedSpec = specName.toUpperCase().trim();
      return normalizedScanned.includes(normalizedSpec) || normalizedSpec.includes(normalizedScanned);
    });
    return matchingKey ? gradeSpecs[matchingKey] : null;
  };

  // Perform Judgment on a single item
  const performJudgement = (item: ZnWireInspectionRecord): 'PASS' | 'FAIL' | 'NO SPEC' => {
    const spec = findMatchingSpec(item.grade);
    if (!spec) return "NO SPEC";
    let isOk = true;

    // Chemical elements validation
    CHEM_ELEMENTS.forEach(el => {
      const valStr = item.chemical_composition?.[el];
      if (valStr === undefined || valStr === null) return;
      const s = String(valStr).trim();
      if (s === '' || s === '-' || s === 'N/A' || s === 'none') return;
      const val = parseFloat(s);
      const elementSpec = spec[el];
      if (!isNaN(val) && elementSpec) {
        if (val < elementSpec.min || val > elementSpec.max) isOk = false;
      }
    });

    // Tensile strength validation
    const tsStr = item.tensile_strength ? String(item.tensile_strength).trim() : '';
    if (tsStr !== '' && tsStr !== '-' && tsStr !== 'N/A' && spec.tensile_strength) {
      const tsVal = parseFloat(tsStr);
      if (!isNaN(tsVal) && (tsVal < spec.tensile_strength.min || tsVal > spec.tensile_strength.max)) isOk = false;
    }

    // Elongation validation
    const elStr = item.elongation ? String(item.elongation).trim() : '';
    if (elStr !== '' && elStr !== '-' && elStr !== 'N/A' && spec.elongation) {
      const elVal = parseFloat(elStr);
      if (!isNaN(elVal) && (elVal < spec.elongation.min || elVal > spec.elongation.max)) isOk = false;
    }

    return isOk ? "PASS" : "FAIL";
  };

  // Trigger Edit Record (Requires password authentication)
  const handleRequestEditHistory = (item: ZnWireInspectionRecord) => {
    setTargetEditHistoryItem(item);
    setHistoryAuthPassword("");
    setHistoryAuthError(false);
    setIsHistoryAuthOpen(true);
  };

  // Confirm password and open edit modal
  const handleVerifyHistoryPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (historyAuthPassword === ADMIN_PASS) {
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
    
    // Recalculate judgement based on updated fields & grade specs
    const updatedJudgement = performJudgement(editingHistoryItem);
    const updatedRecord: ZnWireInspectionRecord = {
      ...editingHistoryItem,
      judgement: updatedJudgement
    };

    setHistory(prev => prev.map(item => item.id === updatedRecord.id ? updatedRecord : item));
    setEditingHistoryItem(null);
    setTargetEditHistoryItem(null);
    
    setStatus({
      type: 'success',
      message: isTh 
        ? `แก้ไขข้อมูล Heat No. ${updatedRecord.heat_number} เรียบร้อยแล้ว` 
        : `Updated Heat No. ${updatedRecord.heat_number} successfully`
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageMimeType(file.type || 'image/png');
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        setBase64Image(res.split(',')[1]);
        setImage(res);
        setExtractedItems([]);
        setSelectedIndices([]);
        setStatus({
          type: 'info',
          message: isTh ? 'โหลดไฟล์สำเร็จ กดปุ่มวิเคราะห์เพื่อเริ่มงาน' : 'Image uploaded. Click Analyze to start.'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const loadDemoData = () => {
    const demo: ZnWireInspectionRecord[] = [
      {
        id: `demo-${Date.now()}-1`,
        heat_number: "H2026-ZN-905",
        grade: "ZN-99.99",
        supplier: "Siam Zinc Wire Metallic Co., Ltd.",
        inspector_name: "Anan S. (IQA)",
        drum: "DRUM-05",
        batch_no: "BATCH-Z1",
        po_no: "PO-2026-0901",
        diameter: "2.0 mm",
        appearance: "Clean & Bright Surface",
        quantity_pcs: "10",
        weight_kg: "200.00",
        tensile_strength: "118",
        elongation: "26",
        chemical_composition: {
          Pb: "0.003",
          Fe: "0.002",
          Cd: "0.001",
          Sn: "0.001",
          Cu: "0.001",
          Zn: "99.99"
        }
      },
      {
        id: `demo-${Date.now()}-2`,
        heat_number: "H2026-ZN-906",
        grade: "ZN-WIRE-STD",
        supplier: "Siam Zinc Wire Metallic Co., Ltd.",
        inspector_name: "Anan S. (IQA)",
        drum: "DRUM-06",
        batch_no: "BATCH-Z2",
        po_no: "PO-2026-0901",
        diameter: "2.0 mm",
        appearance: "Normal",
        quantity_pcs: "10",
        weight_kg: "200.00",
        tensile_strength: "125",
        elongation: "22",
        chemical_composition: {
          Pb: "0.015",
          Fe: "0.012",
          Cd: "0.005",
          Sn: "0.003",
          Cu: "0.002",
          Zn: "99.80"
        }
      }
    ];

    setExtractedItems(demo);
    setSelectedIndices(demo.map((_, i) => i));
    setIsProcessing(false);
    setStatus({
      type: 'success',
      message: isTh ? `สกัดข้อมูลสำเร็จ พบ ${demo.length} รายการ (Demo Certification)` : `Extracted ${demo.length} items (Demo)`
    });
  };

  const extractData = async () => {
    setIsProcessing(true);
    setStatus({
      type: 'info',
      message: isTh ? 'กำลังใช้ AI Gemini (Client-side) วิเคราะห์ข้อมูล Mill Test Certificate...' : 'AI Gemini (Client-side) is extracting Mill Test Cert data...'
    });

    if (base64Image) {
      try {
        const items = await analyzeZnWireCertClient(base64Image, imageMimeType);

        if (items && items.length > 0) {
          const formatted: ZnWireInspectionRecord[] = items.map((item: any, idx: number) => ({
            id: `scan-${Date.now()}-${idx}`,
            heat_number: item.heat_number || `H2026-ZN-${900 + idx}`,
            grade: item.grade || 'ZN-99.99',
            supplier: item.supplier || 'Siam Zinc Wire Metallic Co., Ltd.',
            inspector_name: item.inspector_name || '',
            drum: item.drum || `DRUM-${idx + 1}`,
            batch_no: item.batch_no || '',
            po_no: item.po_no || '',
            diameter: item.diameter || '2.0 mm',
            appearance: item.appearance || 'Clean & Bright Surface',
            quantity_pcs: String(item.quantity_pcs || '10'),
            weight_kg: String(item.weight_kg || '200'),
            tensile_strength: String(item.tensile_strength || ''),
            elongation: String(item.elongation || ''),
            chemical_composition: {
              Pb: String(item.chemical_composition?.Pb ?? ''),
              Fe: String(item.chemical_composition?.Fe ?? ''),
              Cd: String(item.chemical_composition?.Cd ?? ''),
              Sn: String(item.chemical_composition?.Sn ?? ''),
              Cu: String(item.chemical_composition?.Cu ?? ''),
              Zn: String(item.chemical_composition?.Zn ?? '')
            }
          }));

          setExtractedItems(formatted);
          setSelectedIndices(formatted.map((_, i) => i));
          setIsProcessing(false);
          setStatus({
            type: 'success',
            message: isTh ? `สกัดข้อมูลสำเร็จด้วย AI (Client-side) พบ ${formatted.length} รายการ` : `Extracted ${formatted.length} items with AI (Client-side)`
          });
          return;
        } else {
          throw new Error(isTh ? 'ไม่พบข้อมูลในเอกสารนี้' : 'No valid items found in document');
        }
      } catch (err: any) {
        console.error('Error scanning Zn wire cert (client-side):', err);
        setIsProcessing(false);
        setStatus({
          type: 'error',
          message: isTh ? `เกิดข้อผิดพลาดในการสกัดข้อมูล: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}` : `Extraction failed: ${err.message || 'Please try again'}`
        });
        alert(isTh ? `เกิดข้อผิดพลาดในการสกัดข้อมูล: ${err.message}` : `Extraction failed: ${err.message}`);
        return;
      }
    } else {
      alert(isTh ? 'กรุณาอัปโหลดรูปภาพหรือไฟล์เอกสาร Certificate ก่อนทำการสแกน' : 'Please upload a Certificate document before analyzing.');
    }
  };

  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const updateItemField = (index: number, field: keyof ZnWireInspectionRecord, value: string) => {
    setExtractedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateChemField = (itemIndex: number, element: string, value: string) => {
    setExtractedItems(prev => {
      const updated = [...prev];
      const chem = { ...(updated[itemIndex].chemical_composition || {}) };
      chem[element] = value;
      updated[itemIndex] = { ...updated[itemIndex], chemical_composition: chem };
      return updated;
    });
  };

  const saveSelectedToHistory = () => {
    if (selectedIndices.length === 0) return;

    const itemsToSave = extractedItems.filter((_, idx) => selectedIndices.includes(idx));
    const now = new Date();

    const newRecords: ZnWireInspectionRecord[] = itemsToSave.map(item => {
      const computedJudgement = performJudgement(item);
      const recId = `zn-rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      if (onLogNewActivity) {
        const resultDesc = computedJudgement === 'PASS' 
          ? 'PASS (Zn Wire weight, diameter and composition meet Grade Spec)' 
          : `FAIL / Out of Spec: Zn Wire parameters out of spec on Heat ${item.heat_number} (Drum ${item.drum || 'N/A'})`;

        onLogNewActivity({
          id: recId,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'IQA-03',
          moduleTitleTh: 'ตรวจรับลวดสังกะสี (Zn Wire Incoming Inspection)',
          moduleTitleEn: 'Zn Wire Incoming Inspection & COA OCR System',
          inspector: item.inspector_name || 'Zn Wire Inspector',
          shift: item.shift || '',
          batchLot: `${item.grade} - Heat:${item.heat_number}`,
          result: computedJudgement === 'PASS' ? 'PASS' : 'REJECT',
          defectCount: computedJudgement === 'FAIL' ? 1 : 0,
          remarks: resultDesc,
          coilNo: item.heat_number || `DRUM-${item.drum}` || 'ZN-COIL-N/A',
          profile: `Zn Wire ${item.grade} (${item.wire_size || '2.0mm'})`,
          process: 'IQA-03 Zn Wire Incoming Inspection',
          inspectionDate: now.toLocaleString('sv-SE').slice(0, 16),
          inspectionResult: resultDesc
        });
      }

      return {
        ...item,
        id: recId,
        judgement: computedJudgement,
        date: now.toISOString().split('T')[0],
        timestamp: now.toLocaleString('th-TH'),
        timestamp_raw: now.toISOString(),
        _month: (now.getMonth() + 1).toString().padStart(2, '0'),
        _year: now.getFullYear().toString()
      };
    });

    setHistory(prev => [...newRecords, ...prev]);

    const remainingItems = extractedItems.filter((_, idx) => !selectedIndices.includes(idx));
    setExtractedItems(remainingItems);
    setSelectedIndices([]);
    if (remainingItems.length === 0) {
      setImage(null);
      setBase64Image(null);
    }

    setStatus({
      type: 'success',
      message: isTh ? `บันทึกข้อมูล ${newRecords.length} รายการลงประวัติเรียบร้อยแล้ว (จัดเก็บเฉพาะ Text Data)` : `Saved ${newRecords.length} items to History (Pure Text Data)`
    });

    setActiveTab('history');
  };

  // Security Check Logic
  const requestSecurityCheck = (action: () => void) => {
    setSecurityModal({ show: true, onConfirm: action, password: '' });
  };

  const verifySecurity = () => {
    if (securityModal.password === ADMIN_PASS) {
      const actionToExecute = securityModal.onConfirm;
      setSecurityModal({ show: false, onConfirm: null, password: '' });
      if (actionToExecute) actionToExecute();
    } else {
      setStatus({
        type: 'error',
        message: isTh ? 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' : 'Incorrect Admin Password'
      });
      setSecurityModal(prev => ({ ...prev, password: '' }));
    }
  };

  // Grade Spec Management
  const prepareNewGrade = () => {
    setEditingGrade("NEW_GRADE_PENDING");
    setTempGradeName("");
    setGradeSpecs(prev => ({
      ...prev,
      "NEW_GRADE_PENDING": {
        ...CHEM_ELEMENTS.reduce((acc, el) => ({ ...acc, [el]: { min: 0, max: 0 } }), {}),
        tensile_strength: { min: 0, max: 0 },
        elongation: { min: 0, max: 0 }
      }
    }));
  };

  const handleSaveNewGrade = () => {
    if (!tempGradeName.trim()) return;
    const finalKey = tempGradeName.toUpperCase().trim();
    const currentPendingSpec = gradeSpecs["NEW_GRADE_PENDING"];

    const newSpecs = { ...gradeSpecs };
    delete newSpecs["NEW_GRADE_PENDING"];
    newSpecs[finalKey] = currentPendingSpec;

    setGradeSpecs(newSpecs);
    setEditingGrade(finalKey);
    setStatus({
      type: 'success',
      message: isTh ? `เพิ่มเกรด ${finalKey} สำเร็จ` : `Added grade ${finalKey}`
    });
  };

  const deleteGrade = (gradeName: string) => {
    const newSpecs = { ...gradeSpecs };
    delete newSpecs[gradeName];
    setGradeSpecs(newSpecs);
    setEditingGrade('');
    setStatus({
      type: 'success',
      message: isTh ? `ลบข้อมูลเกรด ${gradeName} เรียบร้อยแล้ว` : `Deleted grade ${gradeName}`
    });
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    setStatus({
      type: 'success',
      message: isTh ? 'ลบรายการประวัติเรียบร้อยแล้ว' : 'Deleted record'
    });
  };

  const updateSpecValue = (element: string, field: 'min' | 'max', value: string) => {
    if (!editingGrade) return;
    const num = parseFloat(value) || 0;
    setGradeSpecs(prev => ({
      ...prev,
      [editingGrade]: {
        ...prev[editingGrade],
        [element]: {
          ...(prev[editingGrade]?.[element] || { min: 0, max: 0 }),
          [field]: num
        }
      }
    }));
  };

  // Helper to chunk arrays for sheet printing
  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size));
    }
    return res;
  };

  // Unique key for history row selection
  const getHistoryItemKey = (item: ZnWireInspectionRecord, idx: number): string => {
    return item.id || (item.heat_number ? `${item.heat_number}-${item.drum || ''}-${item.batch_no || ''}-${idx}` : `znwire-hist-${idx}`);
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchSearch = 
        item.heat_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.po_no && item.po_no.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMonth = filterMonth ? item._month === filterMonth : true;
      const matchYear = filterYear ? item._year === filterYear : true;

      return matchSearch && matchMonth && matchYear;
    });
  }, [history, searchQuery, filterMonth, filterYear]);

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
  const handlePrintBatchTags = (itemsToPrint?: ZnWireInspectionRecord[]) => {
    const targetItems = itemsToPrint && itemsToPrint.length > 0 ? itemsToPrint : selectedHistoryItems;
    if (targetItems.length === 0) return;
    setActiveBatchPrintItems(targetItems);
    setBatchCopiedInfo(false);
  };

  // Generate Individual Tag Card Inner HTML
  const generateTagContentHtml = (item: ZnWireInspectionRecord) => {
    const tagColor = "#4f46e5";
    const jg = item.judgement || performJudgement(item);
    const isPass = jg === 'PASS';
    const dateStr = item.timestamp || (item.date ? item.date : new Date().toISOString().split('T')[0]);

    return `
      <div class="tag-box" style="border: 2.5px solid ${tagColor};">
        <div class="header" style="background: ${tagColor};">QUALITY APPROVED ZINC WIRE TAG</div>
        <div class="body-grid">
          <div class="qr-placeholder">
            <svg width="72" height="72" viewBox="0 0 100 100">
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
              <rect x="45" y="45" width="12" height="12" fill="#000"/>
              <rect x="65" y="55" width="15" height="15" fill="#000"/>
              <rect x="45" y="65" width="10" height="20" fill="#000"/>
              <rect x="65" y="75" width="20" height="15" fill="#000"/>
            </svg>
            <span style="font-size: 8px; font-weight: bold; margin-top: 2px; font-family: monospace;">HEAT:${item.heat_number || '-'}</span>
          </div>
          <div class="details">
            <div><strong>HEAT NO:</strong> <span style="font-family: monospace; font-size:12px; font-weight:bold;">${item.heat_number || '-'}</span></div>
            <div><strong>GRADE:</strong> <span style="font-size:12px; font-weight:bold; color:${tagColor}">${item.grade || '-'}</span></div>
            <div><strong>SUPPLIER:</strong> ${item.supplier || '-'}</div>
            <div><strong>PO / DRUM:</strong> ${item.po_no || '-'} / ${item.drum || '-'}</div>
            <div><strong>QTY / WT:</strong> ${item.quantity_pcs || '-'} pcs / ${item.weight_kg || '0'} kg</div>
            <div><strong>SIZE / TS:</strong> ${item.diameter || '-'} / ${item.tensile_strength ? item.tensile_strength + ' MPa' : '-'}</div>
            <div><strong>INSPECTOR:</strong> ${item.inspector_name || 'QA Team'}${item.shift ? ` (${item.shift})` : ''}</div>
            <div><strong>STATUS:</strong> <span class="badge" style="background: ${isPass ? '#10b981' : '#ef4444'};">${jg}</span></div>
          </div>
        </div>
        ${item.chemical_composition && Object.keys(item.chemical_composition).length > 0 ? `
          <div class="chem-row">
            <strong>CHEM (%):</strong>
            ${Object.entries(item.chemical_composition).slice(0, 6).map(([k, v]) => `${k}:${v}`).join(' ')}
          </div>
        ` : ''}
        <div class="footer">IQA-03 Zinc Wire Incoming Verification • Date: ${dateStr}</div>
      </div>
    `;
  };

  // Generate Print Tag HTML (Single or Batch with page breaks)
  const generateMultipleTagsHtml = (items: ZnWireInspectionRecord[], layout: 'roll' | 'grid' = 'roll') => {
    const isGrid = layout === 'grid';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Zinc Wire Approved QR Tags (${items.length} Heats)</title>
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
            .qr-placeholder { width: 90px; min-width: 90px; height: 90px; border: 2px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; text-align: center; border-radius: 6px; }
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
                  ${chunk.map(item => generateTagContentHtml(item)).join('')}
                </div>
              </div>
            `).join('')
          ) : (
            items.map(item => `
              <div class="tag-page">
                ${generateTagContentHtml(item)}
              </div>
            `).join('')
          )}
        </body>
      </html>
    `;
  };

  // Direct Print via hidden iframe
  const triggerDirectMultiplePrint = (items: ZnWireInspectionRecord[], layout: 'roll' | 'grid' = 'roll') => {
    if (items.length === 0) return;
    const htmlContent = generateMultipleTagsHtml(items, layout);

    try {
      let iframe = document.getElementById('znwire-print-iframe') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'znwire-print-iframe';
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

  const triggerDirectPrint = (item: ZnWireInspectionRecord) => {
    triggerDirectMultiplePrint([item], 'roll');
  };

  const handlePrintTag = (item: ZnWireInspectionRecord) => {
    setActivePrintItem(item);
    setCopiedTagInfo(false);
  };

  // Dashboard Stats
  const dashboardStats = useMemo(() => {
    const total = filteredHistory.length;
    const ok = filteredHistory.filter(h => h.judgement === 'PASS').length;
    const ng = total - ok;
    const okRate = total > 0 ? ((ok / total) * 100).toFixed(1) : "0.0";
    return { total, ok, ng, okRate };
  }, [filteredHistory]);

  const exportToCSV = () => {
    if (filteredHistory.length === 0) return;
    const extraHeaders = ["Supplier", "Drum", "Batch", "PO No.", "Quantity (pcs)", "Weight (kg)", "Diameter", "Appearance", "Tensile (T.S)", "Elongation", "Inspector"];
    const headers = ["Heat No.", "Grade", "Judgement", ...extraHeaders, ...CHEM_ELEMENTS, "Timestamp"];
    const rows = filteredHistory.map(e => [
      e.heat_number, e.grade, e.judgement,
      e.supplier || '-', e.drum || '-', e.batch_no || '-', e.po_no || '-', e.quantity_pcs || '-', e.weight_kg || '-', e.diameter || '-',
      e.appearance || '-', e.tensile_strength || '-', e.elongation || '-', e.inspector_name || '-',
      ...CHEM_ELEMENTS.map(el => e.chemical_composition?.[el] || '-'),
      e.timestamp || '-'
    ]);
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Zn_Wire_Inspection_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 space-y-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>

      {/* Admin Verification Modal */}
      {securityModal.show && (
        <div className={`fixed inset-0 z-[100] backdrop-blur-md flex items-center justify-center p-4 ${
          isLight ? 'bg-slate-900/60' : 'bg-slate-950/80'
        }`}>
          <div className={`w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="text-center space-y-2">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto ${
                isLight ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              }`}>
                <Lock className="w-7 h-7" />
              </div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Admin Verification</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh ? 'กรุณาระบุรหัสผ่านผู้ดูแลระบบเพื่อตั้งค่า Grade Spec' : 'Enter admin password to manage grade specifications'}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); verifySecurity(); }} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={securityModal.password}
                  onChange={(e) => setSecurityModal(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className={`w-full border rounded-2xl px-4 py-3 text-center text-lg font-mono focus:outline-none focus:border-indigo-500 ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-indigo-700 placeholder-slate-400' 
                      : 'bg-slate-950 border-slate-800 text-indigo-300'
                  }`}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSecurityModal({ show: false, onConfirm: null, password: '' })}
                  className={`flex-1 font-bold text-xs py-3 rounded-xl transition ${
                    isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  {isTh ? 'ยืนยันรหัสผ่าน' : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md p-4 ${
          isLight ? 'bg-slate-900/60' : 'bg-slate-950/80'
        }`}>
          <div className={`rounded-3xl shadow-2xl max-w-md w-full p-6 border space-y-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto ${
              isLight ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="text-center">
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isTh ? 'ยืนยันรหัสผ่านเพื่อลบข้อมูล' : 'Password Required for Deletion'}
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh 
                  ? 'กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อยืนยันการลบข้อมูลนี้อย่างถาวร' 
                  : 'Please enter admin password to confirm permanent deletion.'}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (deleteConfirmPassword === ADMIN_PASS) {
                  setDeleteConfirmError(false);
                  if (deleteConfirm.id) {
                    if (deleteConfirm.type === 'history') deleteHistoryItem(deleteConfirm.id);
                    if (deleteConfirm.type === 'config') deleteGrade(deleteConfirm.id);
                  }
                  setDeleteConfirm({ show: false, id: null, type: null });
                  setDeleteConfirmPassword('');
                } else {
                  setDeleteConfirmError(true);
                  setDeleteConfirmPassword('');
                }
              }}
              className="space-y-3"
            >
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder={isTh ? "ใส่รหัสผ่านผู้ดูแลระบบ" : "Enter admin password"}
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2.5 text-center font-mono text-sm focus:outline-none border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-rose-500'
                  }`}
                />
                {deleteConfirmError && (
                  <p className="text-xs text-rose-500 font-semibold text-center mt-1.5">
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง' : 'Incorrect password! Please try again'}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirm({ show: false, id: null, type: null });
                    setDeleteConfirmPassword('');
                    setDeleteConfirmError(false);
                  }}
                  className={`flex-1 py-2.5 font-bold rounded-xl text-xs transition ${
                    isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isTh ? 'ยืนยันลบ' : 'Delete'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Bar */}
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
            >
              <ArrowLeft className="w-4 h-4 text-indigo-500" />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isLight 
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
                    : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                }`}>
                  IQA-03
                </span>
                <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isTh ? 'ตรวจรับลวดสังกะสี (Zn Wire Incoming Inspection)' : 'Zn Wire Incoming Inspection'}
                </h1>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh 
                  ? 'สแกนรายงาน Mill Test Cert ลวดสังกะสี (Zn Wire), สกัดส่วนผสมเคมี (Pb, Fe, Cd, Sn, Cu, Zn) & สมบัติเชิงกล' 
                  : 'Zinc Wire COA inspection system, chemical & mechanical property verification & QR tag generator'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border transition flex items-center gap-2 text-xs font-semibold ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Industrial'}
            >
              {isLight ? (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline text-[11px]">Dark Theme</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-[11px]">Light Clean</span>
                </>
              )}
            </button>
          )}

          <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
            isLight
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
          }`}>
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cloud Sync</span>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold border transition ${
        status.type === 'error' ? (isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/80 border-rose-800 text-rose-300') :
        status.type === 'success' ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/80 border-emerald-800 text-emerald-300') :
        (isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-slate-900 border-slate-800 text-indigo-300')
      }`}>
        {status.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        <span>{status.message}</span>
      </div>

      {/* Tabs Bar */}
      <div className={`flex space-x-2 border-b pb-2 overflow-x-auto ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <button
          onClick={() => setActiveTab('scan')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'scan'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
              : (isLight 
                  ? 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200')
          }`}
        >
          <ScanLine className="w-4 h-4" />
          <span>{isTh ? '🔍 สแกนและวิเคราะห์' : 'Scan & Analyze Document'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
              : (isLight 
                  ? 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200')
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{isTh ? '📊 ประวัติและรายงาน' : 'Dashboard & History'}</span>
          {history.length > 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
              isLight 
                ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
                : 'bg-slate-950 text-indigo-300 border-indigo-800'
            }`}>
              {history.length}
            </span>
          )}
        </button>

        <button
          onClick={() => requestSecurityCheck(() => setActiveTab('config'))}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'config'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
              : (isLight 
                  ? 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200')
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{isTh ? '⚙️ Grade Specs' : 'Grade Specs'}</span>
        </button>
      </div>

      {/* TAB 1: SCAN & ANALYZE */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Upload Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                {isTh ? 'อัปโหลดใบรับรอง Mill Test Cert' : 'Upload Mill Test Certificate'}
              </h3>

              <div className="relative border-2 border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px] bg-slate-950/60 hover:border-indigo-600 transition">
                {image ? (
                  <img src={image} alt="Cert Preview" className="max-h-[260px] w-full object-contain rounded-xl" />
                ) : (
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-300">
                      {isTh ? 'ลากไฟล์มาวาง หรือ คลิกเพื่ออัปโหลด' : 'Drag & drop image or click to upload'}
                    </p>
                    <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (COA Images)</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={extractData}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isTh ? 'สกัดข้อมูลด้วย AI' : 'Analyze with AI'}</span>
                </button>

                <button
                  onClick={loadDemoData}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-3 rounded-xl border border-slate-700 transition"
                  title="Load Demo Cert Data"
                >
                  Demo Data
                </button>
              </div>
            </div>
          </div>

          {/* Right Scanned Heat Numbers Panel */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  {isTh ? `รายการ Heat Numbers ที่พบ (${extractedItems.length})` : `Scanned Heat Numbers (${extractedItems.length})`}
                </h3>

                {extractedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrintBatchTags(extractedItems.filter((_, idx) => selectedIndices.includes(idx)))}
                      disabled={selectedIndices.length === 0}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-40"
                    >
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isTh ? `พิมพ์ Tag (${selectedIndices.length})` : `Print Tags (${selectedIndices.length})`}</span>
                    </button>

                    <button
                      onClick={saveSelectedToHistory}
                      disabled={selectedIndices.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20 disabled:opacity-40"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isTh ? `บันทึกลง Cloud (${selectedIndices.length})` : `Save Selected (${selectedIndices.length})`}</span>
                    </button>
                  </div>
                )}
              </div>

              {extractedItems.length === 0 ? (
                <div className="text-center py-16 text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                  <Zap className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-xs font-bold">{isTh ? 'ยังไม่มีข้อมูลสแกน' : 'No scanned data available'}</p>
                  <p className="text-[10px] text-slate-600">
                    {isTh ? 'อัปโหลดภาพ COA และกดปุ่มวิเคราะห์ด้วย AI หรือกด Demo Data' : 'Upload COA image and click Analyze with AI or Demo Data'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {extractedItems.map((item, idx) => {
                    const isSelected = selectedIndices.includes(idx);
                    const judgement = performJudgement(item);

                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl border transition-all space-y-4 ${
                          isSelected
                            ? 'bg-slate-900 border-indigo-600/80 shadow-lg ring-1 ring-indigo-500/20'
                            : 'bg-slate-950/80 border-slate-800 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleSelection(idx)}
                              className={`p-1 rounded-lg transition ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`}
                            >
                              {isSelected ? <CheckSquare className="w-5 h-5 fill-indigo-950" /> : <Square className="w-5 h-5" />}
                            </button>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                              <input
                                type="text"
                                value={item.heat_number}
                                onChange={(e) => updateItemField(idx, 'heat_number', e.target.value)}
                                placeholder="HEAT NO."
                                className="bg-slate-950 border border-indigo-900/60 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-400 uppercase"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              judgement === 'PASS' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                              judgement === 'FAIL' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                              'bg-amber-950 text-amber-300 border-amber-800'
                            }`}>
                              {judgement}
                            </span>

                            <button
                              onClick={() => handlePrintTag(item)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                              title="Print Tag"
                            >
                              <Tag className="w-3.5 h-3.5 text-indigo-400" />
                            </button>
                          </div>
                        </div>

                        {/* Top Metadata Fields */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Grade *</label>
                            <input
                              type="text"
                              value={item.grade}
                              onChange={(e) => updateItemField(idx, 'grade', e.target.value)}
                              placeholder="e.g. ZN-99.99"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Supplier</label>
                            <input
                              type="text"
                              value={item.supplier || ''}
                              onChange={(e) => updateItemField(idx, 'supplier', e.target.value)}
                              placeholder="Supplier Name"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">PO No.</label>
                            <input
                              type="text"
                              value={item.po_no || ''}
                              onChange={(e) => updateItemField(idx, 'po_no', e.target.value)}
                              placeholder="PO-2026-XXXX"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Drum / Lot</label>
                            <input
                              type="text"
                              value={item.drum || ''}
                              onChange={(e) => updateItemField(idx, 'drum', e.target.value)}
                              placeholder="DRUM-01"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Inspector</label>
                            <input
                              type="text"
                              value={item.inspector_name || ''}
                              onChange={(e) => updateItemField(idx, 'inspector_name', e.target.value)}
                              placeholder="Inspector"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Shift (กะ)</label>
                            <input
                              list="zn-shift-options"
                              type="text"
                              value={item.shift || ''}
                              onChange={(e) => updateItemField(idx, 'shift', e.target.value)}
                              placeholder="e.g. Day / Night / A"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                            <datalist id="zn-shift-options">
                              <option value="Day (กะกลางวัน / A)" />
                              <option value="Night (กะกลางคืน / B)" />
                              <option value="Shift A" />
                              <option value="Shift B" />
                              <option value="Shift C" />
                            </datalist>
                          </div>
                        </div>

                        {/* Physical & Mechanical Properties */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Weight (KG)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.weight_kg || ''}
                              onChange={(e) => updateItemField(idx, 'weight_kg', e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Diameter</label>
                            <input
                              type="text"
                              value={item.diameter || ''}
                              onChange={(e) => updateItemField(idx, 'diameter', e.target.value)}
                              placeholder="2.0 mm"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Tensile (T.S)</label>
                            <input
                              type="number"
                              value={item.tensile_strength || ''}
                              onChange={(e) => updateItemField(idx, 'tensile_strength', e.target.value)}
                              placeholder="MPa"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Elongation (%)</label>
                            <input
                              type="number"
                              value={item.elongation || ''}
                              onChange={(e) => updateItemField(idx, 'elongation', e.target.value)}
                              placeholder="%"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Chemical Compositions Grid */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase block">Chemical Compositions (%)</label>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {CHEM_ELEMENTS.map(el => (
                              <div key={el} className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 text-center">
                                <span className="text-[9px] font-bold text-indigo-400 block mb-0.5">{el}</span>
                                <input
                                  type="number"
                                  step="0.0001"
                                  value={item.chemical_composition?.[el] || ''}
                                  onChange={(e) => updateChemField(idx, el, e.target.value)}
                                  placeholder="0.00"
                                  className="w-full bg-transparent text-center font-mono text-xs font-bold text-slate-200 focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DASHBOARD & HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Inspected</span>
              <p className="text-2xl font-black text-white font-mono">{dashboardStats.total}</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-emerald-900/60 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Passed Lots</span>
              <p className="text-2xl font-black text-emerald-300 font-mono">{dashboardStats.ok}</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-rose-900/60 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase">Rejected Lots</span>
              <p className="text-2xl font-black text-rose-300 font-mono">{dashboardStats.ng}</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-indigo-900/60 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">Pass Rate</span>
              <p className="text-2xl font-black text-indigo-300 font-mono">{dashboardStats.okRate}%</p>
            </div>
          </div>

          {/* Search, Filter & Batch Print Action Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Heat No, Grade, Supplier, PO..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">{isTh ? 'ทุกเดือน' : 'All Months'}</option>
                  {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">{isTh ? 'ทุกปี' : 'All Years'}</option>
                  {['2025','2026','2027'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={exportToCSV}
                  disabled={filteredHistory.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20 disabled:opacity-40"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isTh ? 'ส่งออก CSV' : 'Export CSV'}</span>
                </button>
              </div>
            </div>

            {/* Batch Selection Status & Print Trigger Bar */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-300">
                  {isTh 
                    ? `เลือกแล้ว ${selectedHistoryItems.length} / ${filteredHistory.length} Heat Numbers`
                    : `Selected ${selectedHistoryItems.length} / ${filteredHistory.length} Heat Numbers`}
                </span>

                {selectedHistoryItems.length > 0 && (
                  <button
                    type="button"
                    onClick={clearHistorySelection}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-200 underline transition ml-1"
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
                      ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-500/20'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-60'
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
                    className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                    title={isTh ? "พิมพ์แท็กทั้งหมดที่ค้นหาได้ในรายการ" : "Print all filtered tags"}
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isTh ? `พิมพ์ทั้งหมด (${filteredHistory.length})` : `Print All (${filteredHistory.length})`}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* History Records Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[10px] uppercase">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={toggleSelectAllHistory}
                        disabled={filteredHistory.length === 0}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        title={isTh ? "เลือกทั้งหมด" : "Select All"}
                      />
                    </th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Heat No.</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3">Supplier & PO</th>
                    <th className="p-3 text-center">Wt (KG)</th>
                    <th className="p-3 text-center">Tensile / Elong</th>
                    <th className="p-3 text-center">Judgement</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        {isTh ? 'ไม่พบข้อมูลประวัติการตรวจรับ' : 'No inspection records found'}
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item, idx) => {
                      const itemKey = getHistoryItemKey(item, idx);
                      const isSelected = selectedHistoryIds.includes(itemKey);
                      return (
                        <tr 
                          key={itemKey} 
                          className={`transition ${isSelected ? 'bg-indigo-950/30' : 'hover:bg-slate-850/50'}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectHistory(itemKey)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                            />
                          </td>
                          <td className="p-3 font-mono text-slate-400 text-[11px]">{item.timestamp}</td>
                          <td className="p-3 font-mono font-bold text-indigo-300">{item.heat_number}</td>
                          <td className="p-3 font-bold text-slate-200">{item.grade}</td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            <div>{item.supplier || '-'}</div>
                            <div className="text-[10px] text-slate-500">
                              {item.inspector_name || 'QA'}{item.shift ? ` (${item.shift})` : ''} • Drum: {item.drum || '-'}
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-200">{item.weight_kg || '-'}</td>
                          <td className="p-3 text-center font-mono text-amber-300 font-bold">
                            {item.tensile_strength || '-'}/{item.elongation || '-'}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.judgement === 'PASS' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                              item.judgement === 'FAIL' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                              'bg-amber-950 text-amber-300 border-amber-800'
                            }`}>
                              {item.judgement}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleRequestEditHistory(item)}
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition border border-amber-500/30 flex items-center gap-1 text-[11px] font-bold"
                                title={isTh ? "แก้ไขข้อมูล (ต้องใส่ Password)" : "Edit Record (Password required)"}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{isTh ? 'แก้ไข' : 'Edit'}</span>
                              </button>
                              <button
                                onClick={() => handlePrintTag(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition"
                                title="Print Tag"
                              >
                                <Tag className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirmPassword('');
                                  setDeleteConfirmError(false);
                                  setDeleteConfirm({ show: true, id: item.id || null, type: 'history' });
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 transition"
                                title={isTh ? "ลบรายการ (ต้องใส่รหัสผ่านผู้ดูแลระบบ)" : "Delete Record (Admin password required)"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SPEC CONFIGURATION */}
      {activeTab === 'config' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>{isTh ? 'ตั้งค่า Grade Specification (Admin Security)' : 'Grade Spec Configuration'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTh ? 'กำหนดเกณฑ์ Min/Max สำหรับส่วนผสมเคมีและสมบัติเชิงกลของเกรดลวดสังกะสี' : 'Manage Min/Max specs for chemical composition and mechanical properties'}
              </p>
            </div>

            <button
              onClick={prepareNewGrade}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isTh ? 'เพิ่มเกรดใหม่' : 'Add New Grade'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Grade Sidebar */}
            <div className="md:col-span-4 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Grade List</label>
              {Object.keys(gradeSpecs).map(grade => (
                <div
                  key={grade}
                  onClick={() => setEditingGrade(grade)}
                  className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition flex items-center justify-between ${
                    editingGrade === grade
                      ? 'bg-indigo-950 border-indigo-600 text-indigo-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{grade}</span>
                  {editingGrade === grade && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>}
                </div>
              ))}
            </div>

            {/* Spec Editor Table */}
            <div className="md:col-span-8 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              {editingGrade === "NEW_GRADE_PENDING" ? (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-indigo-400 uppercase block">Name New Grade</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempGradeName}
                      onChange={(e) => setTempGradeName(e.target.value)}
                      placeholder="e.g. ZN-HIGH-PURITY"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 uppercase"
                    />
                    <button
                      onClick={handleSaveNewGrade}
                      disabled={!tempGradeName.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition disabled:opacity-40"
                    >
                      {isTh ? 'บันทึกชื่อเกรด' : 'Save Grade Name'}
                    </button>
                  </div>
                </div>
              ) : editingGrade && gradeSpecs[editingGrade] ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase">Editing Grade: {editingGrade}</h4>
                    <button
                      onClick={() => {
                        setDeleteConfirmPassword('');
                        setDeleteConfirmError(false);
                        setDeleteConfirm({ show: true, id: editingGrade, type: 'config' });
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isTh ? 'ลบเกรดนี้ (ต้องใส่รหัสผ่านผู้ดูแลระบบ)' : 'Delete Grade (Admin password required)'}</span>
                    </button>
                  </div>

                  {/* Elements Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-500 text-[10px] uppercase border-b border-slate-800">
                          <th className="py-2">Property / Element</th>
                          <th className="py-2 text-center">Min Spec</th>
                          <th className="py-2 text-center">Max Spec</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {CHEM_ELEMENTS.map(el => (
                          <tr key={el}>
                            <td className="py-2.5 font-bold text-indigo-400">{el} (%)</td>
                            <td className="py-2 text-center">
                              <input
                                type="number"
                                step="0.0001"
                                value={gradeSpecs[editingGrade]?.[el]?.min ?? 0}
                                onChange={(e) => updateSpecValue(el, 'min', e.target.value)}
                                className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </td>
                            <td className="py-2 text-center">
                              <input
                                type="number"
                                step="0.0001"
                                value={gradeSpecs[editingGrade]?.[el]?.max ?? 0}
                                onChange={(e) => updateSpecValue(el, 'max', e.target.value)}
                                className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </td>
                          </tr>
                        ))}

                        {/* Tensile & Elongation */}
                        <tr>
                          <td className="py-2.5 font-bold text-amber-400">Tensile Strength (MPa)</td>
                          <td className="py-2 text-center">
                            <input
                              type="number"
                              value={gradeSpecs[editingGrade]?.tensile_strength?.min ?? 0}
                              onChange={(e) => updateSpecValue('tensile_strength', 'min', e.target.value)}
                              className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2 text-center">
                            <input
                              type="number"
                              value={gradeSpecs[editingGrade]?.tensile_strength?.max ?? 0}
                              onChange={(e) => updateSpecValue('tensile_strength', 'max', e.target.value)}
                              className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="py-2.5 font-bold text-amber-400">Elongation (%)</td>
                          <td className="py-2 text-center">
                            <input
                              type="number"
                              value={gradeSpecs[editingGrade]?.elongation?.min ?? 0}
                              onChange={(e) => updateSpecValue('elongation', 'min', e.target.value)}
                              className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2 text-center">
                            <input
                              type="number"
                              value={gradeSpecs[editingGrade]?.elongation?.max ?? 0}
                              onChange={(e) => updateSpecValue('elongation', 'max', e.target.value)}
                              className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  {isTh ? 'เลือกเกรดจากรายการด้านซ้ายเพื่อตั้งค่า Spec' : 'Select a grade from sidebar to edit specs'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT HISTORY AUTHENTICATION MODAL */}
      {isHistoryAuthOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsHistoryAuthOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {isTh ? 'ยืนยันรหัสผ่านเพื่อแก้ไขข้อมูล' : 'Password Verification Required'}
              </h3>
              <p className="text-xs text-slate-400">
                {isTh 
                  ? 'กรอกรหัสผ่านผู้ดูแลระบบเพื่อแก้ไขรายการประวัติการตรวจรับที่เลือก' 
                  : 'Enter admin password to edit this inspection record'}
              </p>
            </div>

            <form onSubmit={handleVerifyHistoryPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={historyAuthPassword}
                  onChange={(e) => setHistoryAuthPassword(e.target.value)}
                  placeholder={isTh ? "รหัสผ่านผู้ดูแลระบบ" : "Admin Password"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {historyAuthError && (
                  <p className="text-xs text-rose-400 font-semibold text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง' : 'Incorrect password! Please try again'}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsHistoryAuthOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-amber-600/20 flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isTh ? 'ปลดล็อกเพื่อแก้ไข' : 'Unlock & Edit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT HISTORY RECORD MODAL */}
      {editingHistoryItem && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isTh ? 'แก้ไขข้อมูลการตรวจรับ IQA-03' : 'Edit IQA-03 Inspection Record'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Heat No: {editingHistoryItem.heat_number} | ID: {editingHistoryItem.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingHistoryItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Basic Meta Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Heat Number *
                  </label>
                  <input
                    type="text"
                    value={editingHistoryItem.heat_number || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, heat_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Grade Spec *
                  </label>
                  <input
                    type="text"
                    value={editingHistoryItem.grade || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, grade: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={editingHistoryItem.supplier || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, supplier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={editingHistoryItem.po_no || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, po_no: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Drum / Lot
                  </label>
                  <input
                    type="text"
                    value={editingHistoryItem.drum || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, drum: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Batch No.
                  </label>
                  <input
                    type="text"
                    value={editingHistoryItem.batch_no || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, batch_no: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Physical & Mechanical Properties */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  {isTh ? 'ขนาดและสมบัติเชิงกล' : 'Physical & Mechanical Properties'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Weight (KG)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingHistoryItem.weight_kg || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, weight_kg: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Diameter</label>
                    <input
                      type="text"
                      value={editingHistoryItem.diameter || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, diameter: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tensile (MPa)</label>
                    <input
                      type="number"
                      value={editingHistoryItem.tensile_strength || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, tensile_strength: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Elongation (%)</label>
                    <input
                      type="number"
                      value={editingHistoryItem.elongation || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, elongation: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Appearance</label>
                    <input
                      type="text"
                      value={editingHistoryItem.appearance || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, appearance: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Inspector Name</label>
                    <input
                      type="text"
                      value={editingHistoryItem.inspector_name || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, inspector_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Shift (กะ)</label>
                    <input
                      list="edit-zn-shift-options"
                      type="text"
                      placeholder="e.g. Day / Night / Shift A..."
                      value={editingHistoryItem.shift || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, shift: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <datalist id="edit-zn-shift-options">
                      <option value="Day (กะกลางวัน / A)" />
                      <option value="Night (กะกลางคืน / B)" />
                      <option value="Shift A" />
                      <option value="Shift B" />
                      <option value="Shift C" />
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Chemical Compositions */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  Chemical Composition (%)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {CHEM_ELEMENTS.map(el => (
                    <div key={el} className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] font-bold text-indigo-400 block mb-1">{el}</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={editingHistoryItem.chemical_composition?.[el] || ''}
                        onChange={(e) => setEditingHistoryItem({
                          ...editingHistoryItem,
                          chemical_composition: {
                            ...(editingHistoryItem.chemical_composition || {}),
                            [el]: e.target.value
                          }
                        })}
                        placeholder="0.00"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 text-center font-mono text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingHistoryItem(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
              >
                {isTh ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveEditedHistory}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isTh ? 'บันทึกการแก้ไข' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE PRINT TAG MODAL */}
      {activePrintItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isTh ? 'พิมพ์แท็กรับรองคุณภาพลวดสังกะสี (QR Tag)' : 'Zinc Wire QR Quality Tag'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Heat No: {activePrintItem.heat_number}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActivePrintItem(null)} 
                className="p-1.5 rounded-xl transition text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tag Visual Preview */}
            <div className="rounded-2xl p-4 bg-white text-slate-900 border-2 border-indigo-600 shadow-sm relative">
              <div className="bg-indigo-600 text-white text-center font-black py-1.5 px-3 rounded-lg text-xs tracking-wider uppercase shadow-xs mb-3">
                QUALITY APPROVED ZINC WIRE TAG
              </div>

              <div className="flex gap-3 items-stretch">
                {/* Simulated QR Code Graphic */}
                <div className="w-24 h-24 min-w-[96px] bg-slate-50 border-2 border-slate-900 rounded-xl flex flex-col items-center justify-center p-1 text-center">
                  <svg width="68" height="68" viewBox="0 0 100 100">
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
                    <rect x="45" y="45" width="12" height="12" fill="#000"/>
                    <rect x="65" y="55" width="15" height="15" fill="#000"/>
                    <rect x="45" y="65" width="10" height="20" fill="#000"/>
                    <rect x="65" y="75" width="20" height="15" fill="#000"/>
                  </svg>
                  <span className="text-[7px] font-mono font-bold text-slate-800 truncate max-w-full">
                    {activePrintItem.heat_number || 'ZN-WIRE'}
                  </span>
                </div>

                {/* Tag Meta Details */}
                <div className="flex-1 text-[11px] leading-tight space-y-1.5">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Heat Number</span>
                    <span className="font-mono font-bold text-sm text-slate-950">{activePrintItem.heat_number || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Grade:</span>
                    <span className="font-black text-xs px-2 py-0.5 rounded bg-indigo-600 text-white">
                      {activePrintItem.grade || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div>
                      <span className="text-slate-500">Supplier: </span>
                      <span className="font-bold truncate">{activePrintItem.supplier || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">PO: </span>
                      <span className="font-bold">{activePrintItem.po_no || '-'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div>
                      <span className="text-slate-500">Weight: </span>
                      <span className="font-bold">{activePrintItem.weight_kg || '0'} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Drum: </span>
                      <span className="font-bold">{activePrintItem.drum || '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-slate-500">Status: </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                      (activePrintItem.judgement || performJudgement(activePrintItem)) === 'PASS' ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}>
                      {activePrintItem.judgement || performJudgement(activePrintItem)}
                    </span>
                  </div>
                </div>
              </div>

              {activePrintItem.chemical_composition && Object.keys(activePrintItem.chemical_composition).length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-200 text-[9px] font-mono bg-slate-50 p-2 rounded-lg text-slate-700">
                  <strong>Chem: </strong>
                  {Object.entries(activePrintItem.chemical_composition).map(([k, v]) => `${k}:${v}`).join(' | ')}
                </div>
              )}

              <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 text-[8px] text-slate-400 flex items-center justify-between">
                <span>Inspector: {activePrintItem.inspector_name || 'QA Team'}</span>
                <span>{activePrintItem.timestamp || new Date().toLocaleDateString('th-TH')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const text = `[ZN WIRE TAG] Heat: ${activePrintItem.heat_number} | Grade: ${activePrintItem.grade} | Supplier: ${activePrintItem.supplier || '-'} | PO: ${activePrintItem.po_no || '-'} | Drum: ${activePrintItem.drum || '-'} | Weight: ${activePrintItem.weight_kg}kg | Status: ${activePrintItem.judgement || performJudgement(activePrintItem)}`;
                  navigator.clipboard.writeText(text);
                  setCopiedTagInfo(true);
                  setTimeout(() => setCopiedTagInfo(false), 2000);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              >
                {copiedTagInfo ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTagInfo ? (isTh ? 'คัดลอกแล้ว!' : 'Copied!') : (isTh ? 'คัดลอก' : 'Copy')}</span>
              </button>

              <button
                type="button"
                onClick={() => triggerDirectPrint(activePrintItem)}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>{isTh ? 'สั่งพิมพ์ทันที (Direct Print)' : 'Print Tag Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH PRINT TAG MODAL */}
      {activeBatchPrintItems && activeBatchPrintItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-5 shadow-2xl relative max-h-[92vh] flex flex-col text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {isTh ? 'พิมพ์แท็กรับรองคุณภาพลวดสังกะสีแบบกลุ่ม (Batch QR Tag Printing)' : 'Batch Zinc Wire QR Tag Printing'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                      {activeBatchPrintItems.length} {isTh ? 'แท็ก' : 'Tags'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {isTh 
                      ? `พิมพ์แท็กระบุ Heat Number ทั้งหมด ${activeBatchPrintItems.length} รายการพร้อมกันในคำสั่งเดียว`
                      : `Simultaneously print ${activeBatchPrintItems.length} Heat identification tags in one single print job`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveBatchPrintItems(null)} 
                className="p-1.5 rounded-xl transition text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options Bar: Layout Selector & Summary */}
            <div className="p-3 rounded-2xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-300">
                  {isTh ? 'รูปแบบการพิมพ์:' : 'Print Layout:'}
                </span>
                <div className="inline-flex rounded-xl p-1 bg-slate-800 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setBatchPrintLayout('roll')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      batchPrintLayout === 'roll'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🏷️ {isTh ? 'ม้วนสติกเกอร์ (100x100mm)' : 'Label Roll (100x100mm)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchPrintLayout('grid')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      batchPrintLayout === 'grid'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    📄 {isTh ? 'กระดาษ A4 (4 แท็ก/หน้า)' : 'A4 Sheet Grid (4/page)'}
                  </button>
                </div>
              </div>

              <div className="text-xs font-mono flex items-center gap-3">
                <span className="text-slate-400">
                  Heats: <strong className="text-white">{activeBatchPrintItems.length}</strong>
                </span>
                <span className="text-slate-400">
                  Qty: <strong className="text-white">
                    {activeBatchPrintItems.reduce((sum, it) => sum + (parseFloat(String(it.quantity_pcs)) || 0), 0)} pcs
                  </strong>
                </span>
                <span className="text-indigo-400">
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
                  const jg = item.judgement || performJudgement(item);
                  const isPass = jg === 'PASS';

                  return (
                    <div
                      key={item.id || (item.heat_number + index)}
                      className="rounded-2xl p-4 bg-white text-slate-900 border-2 border-indigo-600 shadow-sm relative flex flex-col justify-between"
                    >
                      <div>
                        {/* Tag Header */}
                        <div className="bg-indigo-600 text-white text-center font-black py-1.5 px-3 rounded-lg text-xs tracking-wider uppercase shadow-xs mb-2.5 flex items-center justify-between">
                          <span>QUALITY APPROVED ZINC WIRE TAG</span>
                          <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded font-mono">#{index + 1}</span>
                        </div>

                        <div className="flex gap-3 items-stretch">
                          {/* Simulated QR Code Graphic */}
                          <div className="w-20 h-20 min-w-[80px] bg-slate-50 border-2 border-slate-900 rounded-xl flex flex-col items-center justify-center p-1 text-center">
                            <svg width="56" height="56" viewBox="0 0 100 100">
                              <rect width="100" height="100" fill="#fff" />
                              <rect x="10" y="10" width="28" height="28" fill="#000"/>
                              <rect x="15" y="15" width="18" height="18" fill="#fff"/>
                              <rect x="19" y="19" width="10" height="10" fill="#000"/>
                              <rect x="62" y="10" width="28" height="28" fill="#000"/>
                              <rect x="67" y="15" width="18" height="18" fill="#fff"/>
                              <rect x="71" y="19" width="10" height="10" fill="#000"/>
                              <rect x="10" y="62" width="28" height="28" fill="#000"/>
                              <rect x="15" y="67" width="18" height="18" fill="#fff"/>
                              <rect x="19" y="71" width="10" height="10" fill="#000"/>
                              <rect x="45" y="45" width="12" height="12" fill="#000"/>
                              <rect x="62" y="52" width="14" height="14" fill="#000"/>
                              <rect x="45" y="65" width="10" height="18" fill="#000"/>
                              <rect x="62" y="72" width="20" height="15" fill="#000"/>
                            </svg>
                            <span className="text-[6.5px] font-mono font-bold text-slate-800 truncate max-w-full">
                              {item.heat_number || 'ZN-WIRE'}
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
                              <span className="font-black text-xs px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                                {item.grade || '-'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              <div>
                                <span className="text-slate-500">Drum: </span>
                                <span className="font-bold">{item.drum || '-'}</span>
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
                        <span>Supplier: {item.supplier || '-'}</span>
                        <span>{item.timestamp || (item.date ? item.date : new Date().toISOString().split('T')[0])}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const allText = activeBatchPrintItems.map((it, i) => 
                    `[TAG #${i + 1}] Heat: ${it.heat_number} | Grade: ${it.grade} | Supplier: ${it.supplier || '-'} | PO: ${it.po_no || '-'} | Drum: ${it.drum || '-'} | Qty: ${it.quantity_pcs || 0} pcs | Wt: ${it.weight_kg} kg | Status: ${it.judgement || 'PASS'}`
                  ).join('\n');
                  navigator.clipboard.writeText(allText);
                  setBatchCopiedInfo(true);
                  setTimeout(() => setBatchCopiedInfo(false), 2000);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              >
                {batchCopiedInfo ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{batchCopiedInfo ? (isTh ? 'คัดลอกครบทุกใบแล้ว!' : 'All Copied!') : (isTh ? 'คัดลอกข้อมูลทั้งหมด' : 'Copy All Data')}</span>
              </button>

              <button
                type="button"
                onClick={() => triggerDirectMultiplePrint(activeBatchPrintItems, batchPrintLayout)}
                className="flex-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
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
                className="px-4 py-2.5 rounded-xl text-xs font-bold transition border bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700"
              >
                {isTh ? 'ปิด' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZnWireIncomingApp;
