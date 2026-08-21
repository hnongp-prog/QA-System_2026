import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ruler, 
  FileText, 
  BarChart3, 
  Settings, 
  Upload, 
  Sparkles, 
  Save, 
  Copy, 
  FileSpreadsheet, 
  Trash2, 
  Lock, 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  Check, 
  RotateCcw,
  Edit,
  Cpu,
  History,
  Info,
  Edit3,
  X,
  AlertCircle
} from 'lucide-react';

import { 
  ThicknessWallRecord, 
  ThicknessWallProfileSpec, 
  ThicknessWallProfileItemSpec, 
  Language, 
  InspectionActivity 
} from '../types';
import { extractThicknessWallClient } from '../services/geminiClient';

interface ThicknessWallAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
}

const ADMIN_PASS = 'admin2026';

const INITIAL_PROFILES: Record<string, ThicknessWallProfileItemSpec[]> = {
  'A-001': [
    { item: 'OR', min: 12.0, max: 13.5 },
    { item: 'T1', min: 2.1, max: 2.5 },
    { item: 'T2', min: 2.0, max: 2.4 },
    { item: 'T3', min: 3.0, max: 3.5 },
    { item: 'T4', min: 3.0, max: 3.5 },
    { item: 'T5', min: 1.8, max: 2.3 },
    { item: 'IR', min: 8.0, max: 9.2 },
    { item: 'IHR', min: 1.5, max: 2.0 },
    { item: 'OHW', min: 2.2, max: 2.8 },
    { item: 'IHW', min: 2.0, max: 2.6 },
    { item: 'RA', min: 0.5, max: 1.2 },
    { item: 'IOR', min: 10.0, max: 11.5 }
  ],
  'B-002': [
    { item: 'OR', min: 15.0, max: 16.5 },
    { item: 'T1', min: 3.0, max: 3.6 },
    { item: 'T2', min: 2.8, max: 3.4 },
    { item: 'T3', min: 4.0, max: 4.8 },
    { item: 'T4', min: 4.0, max: 4.8 },
    { item: 'T5', min: 2.5, max: 3.0 },
    { item: 'IR', min: 10.0, max: 11.8 }
  ]
};

const INITIAL_RECORDS: ThicknessWallRecord[] = [
  {
    docId: 'tw-doc-101',
    id: 'TW-2026-001',
    timestamp: '2026-08-05 14:30',
    timestampRaw: '2026-08-05T14:30:00Z',
    inspector: 'Kitti M.',
    process: 'Line A - Extrusion #1',
    coil: 'COIL-9901-A',
    sample: 'SAMPLE-A1',
    profile: 'A-001',
    vals: {
      t1: { min: 2.2, max: 2.4 },
      t2: { min: 2.1, max: 2.3 },
      t3: 3.2,
      t4: 3.3,
      t5_list: ['T5-1: 2.0', 'T5-2: 2.1', 'T5-3: 1.9'],
      or: { min: 12.2, max: 13.1 },
      ir: { min: 8.2, max: 8.9 },
      ihr: { min: 1.6, max: 1.8 },
      ohw: { min: 2.3, max: 2.6 },
      ihw: { min: 2.1, max: 2.4 },
      ra: { min: 0.8, max: 1.0 },
      ior: { min: 10.2, max: 11.0 }
    },
    overallStatus: 'PASS'
  },
  {
    docId: 'tw-doc-102',
    id: 'TW-2026-002',
    timestamp: '2026-08-04 10:15',
    timestampRaw: '2026-08-04T10:15:00Z',
    inspector: 'Somchai P.',
    process: 'Line B - Extrusion #2',
    coil: 'COIL-8802-B',
    sample: 'SAMPLE-B2',
    profile: 'B-002',
    vals: {
      t1: { min: 2.9, max: 3.7 },
      t2: { min: 2.7, max: 3.5 },
      t3: 4.2,
      t4: 4.1,
      t5_list: ['T5-1: 2.6', 'T5-2: 2.7'],
      or: { min: 15.2, max: 16.8 },
      ir: { min: 10.1, max: 11.5 },
      ihr: { min: 1.5, max: 1.9 },
      ohw: { min: 2.2, max: 2.7 },
      ihw: { min: 2.0, max: 2.5 },
      ra: { min: 0.6, max: 1.1 },
      ior: { min: 10.1, max: 11.2 }
    },
    overallStatus: 'FAIL'
  }
];

export const ThicknessWallApp: React.FC<ThicknessWallAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th'
}) => {
  const isTh = language === 'th';

  // Tab State
  const [activeTab, setActiveTab] = useState<'extraction' | 'dashboard' | 'settings'>('extraction');

  // Admin Modal Security
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Profile Specs & History Records State
  const [profileSpecs, setProfileSpecs] = useState<Record<string, ThicknessWallProfileItemSpec[]>>(() => {
    const saved = localStorage.getItem('tw_profile_specs');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [savedRecords, setSavedRecords] = useState<ThicknessWallRecord[]>(() => {
    const saved = localStorage.getItem('tw_measurement_records');
    return saved ? JSON.parse(saved) : INITIAL_RECORDS;
  });

  useEffect(() => {
    localStorage.setItem('tw_profile_specs', JSON.stringify(profileSpecs));
  }, [profileSpecs]);

  useEffect(() => {
    localStorage.setItem('tw_measurement_records', JSON.stringify(savedRecords));
  }, [savedRecords]);

  // File Upload & AI State
  const [currentFileBase64, setCurrentFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>('image/png');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Results Form State
  const [hasResults, setHasResults] = useState(false);
  const [inspectorInput, setInspectorInput] = useState('');
  const [profileInput, setProfileInput] = useState('');
  const [coilInput, setCoilInput] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [processInput, setProcessInput] = useState('');

  const [tableItems, setTableItems] = useState<{ description: string; total: string }[]>([]);

  // Dashboard Filters
  const [dashFilterProfile, setDashFilterProfile] = useState('ALL');
  const [dashFilterMonth, setDashFilterMonth] = useState('ALL');
  const [dashFilterYear, setDashFilterYear] = useState('ALL');

  // Spec Setting Form
  const [specProfileName, setSpecProfileName] = useState('');
  const [specItems, setSpecItems] = useState<ThicknessWallProfileItemSpec[]>([
    { item: 'OR', min: 12.0, max: 13.5 },
    { item: 'T1', min: 2.1, max: 2.5 }
  ]);

  // History Edit Auth & Modal States
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<ThicknessWallRecord | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<ThicknessWallRecord | null>(null);
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState('');
  const [historyAuthError, setHistoryAuthError] = useState(false);

  const handleRequestEditHistory = (item: ThicknessWallRecord) => {
    setTargetEditHistoryItem(item);
    setHistoryAuthPassword('');
    setHistoryAuthError(false);
    setIsHistoryAuthOpen(true);
  };

  const handleVerifyHistoryPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (historyAuthPassword === 'admin2026') {
      setIsHistoryAuthOpen(false);
      setHistoryAuthError(false);
      if (targetEditHistoryItem) {
        setEditingHistoryItem(JSON.parse(JSON.stringify(targetEditHistoryItem)));
      }
    } else {
      setHistoryAuthError(true);
      setHistoryAuthPassword('');
    }
  };

  const handleSaveEditedHistory = () => {
    if (!editingHistoryItem) return;
    setSavedRecords(prev => prev.map(ins => ins.id === editingHistoryItem.id ? editingHistoryItem : ins));
    setEditingHistoryItem(null);
    setTargetEditHistoryItem(null);
  };

  // Handle Tab Switch
  const handleSwitchTab = (tab: 'extraction' | 'dashboard' | 'settings') => {
    if (tab === 'settings' && !isAdminAuthorized) {
      setAuthModalVisible(true);
      return;
    }
    setActiveTab(tab);
  };

  const verifyAdmin = () => {
    if (adminPasswordInput === ADMIN_PASS) {
      setIsAdminAuthorized(true);
      setAuthModalVisible(false);
      setAdminPasswordInput('');
      setAuthError(false);
      setActiveTab('settings');
    } else {
      setAuthError(true);
      setAdminPasswordInput('');
    }
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let mime = file.type;
    if (!mime || mime === 'application/octet-stream') {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') mime = 'application/pdf';
      else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
      else if (ext === 'png') mime = 'image/png';
      else if (ext === 'webp') mime = 'image/webp';
      else mime = 'image/png';
    }

    setFileName(file.name);
    setFileMimeType(mime);
    setHasResults(false);
    setTableItems([]);
    setInspectorInput('');
    setProfileInput('');
    setCoilInput('');
    setSampleInput('');
    setProcessInput('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      setCurrentFileBase64(res.split(',')[1]);
      if (mime.startsWith('image/')) {
        setPreviewUrl(res);
      } else {
        setPreviewUrl(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load Demo IPQC-07 Document
  const loadDemoDocument = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="none">
    <rect width="600" height="800" fill="#0f172a"/>
    <rect x="20" y="20" width="560" height="760" rx="12" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <rect x="40" y="40" width="520" height="60" rx="8" fill="#334155"/>
    <text x="60" y="75" fill="#f8fafc" font-family="sans-serif" font-size="18" font-weight="bold">QUALITY CONTROL INSPECTION REPORT (IPQC-07)</text>
    <text x="60" y="92" fill="#94a3b8" font-family="sans-serif" font-size="11">THICKNESS &amp; WALL MEASUREMENT SPECIFICATION</text>
    <rect x="40" y="115" width="250" height="90" rx="6" fill="#0f172a" stroke="#475569"/>
    <text x="55" y="140" fill="#cbd5e1" font-family="sans-serif" font-size="12">Inspector: Kitti M.</text>
    <text x="55" y="162" fill="#cbd5e1" font-family="sans-serif" font-size="12">Coil No: COIL-9901-A</text>
    <text x="55" y="184" fill="#cbd5e1" font-family="sans-serif" font-size="12">Process: Line A - Extrusion #1</text>
    <rect x="310" y="115" width="250" height="90" rx="6" fill="#0f172a" stroke="#475569"/>
    <text x="325" y="140" fill="#cbd5e1" font-family="sans-serif" font-size="12">Profile: A-001</text>
    <text x="325" y="162" fill="#cbd5e1" font-family="sans-serif" font-size="12">Sample ID: SAMPLE-A1</text>
    <text x="325" y="184" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="bold">Status: IPQC PASS</text>
    <rect x="40" y="220" width="520" height="180" rx="8" fill="#0f172a" stroke="#334155"/>
    <circle cx="300" cy="310" r="70" stroke="#38bdf8" stroke-width="3" fill="none"/>
    <circle cx="300" cy="310" r="50" stroke="#818cf8" stroke-width="3" stroke-dasharray="4 4" fill="none"/>
    <line x1="230" y1="310" x2="370" y2="310" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line x1="300" y1="240" x2="300" y2="380" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text x="380" y="315" fill="#38bdf8" font-family="sans-serif" font-size="11" font-weight="bold">OR-1 (12.5mm)</text>
    <text x="210" y="315" fill="#818cf8" font-family="sans-serif" font-size="11" font-weight="bold">T1-1 (2.3mm)</text>
    <rect x="40" y="415" width="520" height="30" fill="#334155"/>
    <text x="60" y="435" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">Item / Description</text>
    <text x="300" y="435" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">Measured Value (mm)</text>
    <text x="480" y="435" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">Judgment</text>
    <g font-family="sans-serif" font-size="12" fill="#e2e8f0">
      <text x="60" y="470">OR-1</text><text x="300" y="470">12.50</text><text x="480" y="470" fill="#4ade80">PASS</text>
      <text x="60" y="495">OR-2</text><text x="300" y="495">12.80</text><text x="480" y="495" fill="#4ade80">PASS</text>
      <text x="60" y="520">T1-1</text><text x="300" y="520">2.30</text><text x="480" y="520" fill="#4ade80">PASS</text>
      <text x="60" y="545">T1-2</text><text x="300" y="545">2.40</text><text x="480" y="545" fill="#4ade80">PASS</text>
      <text x="60" y="570">T2-1</text><text x="300" y="570">2.20</text><text x="480" y="570" fill="#4ade80">PASS</text>
      <text x="60" y="595">T3</text><text x="300" y="595">3.20</text><text x="480" y="595" fill="#4ade80">PASS</text>
      <text x="60" y="620">T4</text><text x="300" y="620">3.30</text><text x="480" y="620" fill="#4ade80">PASS</text>
      <text x="60" y="645">T5-1</text><text x="300" y="645">2.00</text><text x="480" y="645" fill="#4ade80">PASS</text>
      <text x="60" y="670">IR-1</text><text x="300" y="670">8.50</text><text x="480" y="670" fill="#4ade80">PASS</text>
      <text x="60" y="695">IOR-1</text><text x="300" y="695">10.50</text><text x="480" y="695" fill="#4ade80">PASS</text>
    </g>
  </svg>`;
    const dataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)));
    setFileName('IPQC-07_Sample_Report.svg');
    setFileMimeType('image/svg+xml');
    setPreviewUrl(dataUri);
    const b64 = btoa(unescape(encodeURIComponent(svgContent)));
    setCurrentFileBase64(b64);
    
    setInspectorInput('Kitti M.');
    setCoilInput('COIL-9901-A');
    setProfileInput('A-001');
    setSampleInput('SAMPLE-A1');
    setProcessInput('Line A - Extrusion #1');
    setTableItems([
      { description: 'OR-1', total: '12.5' },
      { description: 'OR-2', total: '12.8' },
      { description: 'T1-1', total: '2.3' },
      { description: 'T1-2', total: '2.4' },
      { description: 'T2-1', total: '2.2' },
      { description: 'T3', total: '3.2' },
      { description: 'T4', total: '3.3' },
      { description: 'T5-1', total: '2.0' },
      { description: 'T5-2', total: '2.1' },
      { description: 'IR-1', total: '8.5' },
      { description: 'IHR-1', total: '1.7' },
      { description: 'OHW-1', total: '2.4' },
      { description: 'IHW-1', total: '2.2' },
      { description: 'RA-1', total: '0.9' },
      { description: 'IOR-1', total: '10.5' }
    ]);
    setHasResults(true);
    return { b64, mime: 'image/svg+xml' };
  };

  // AI Data Extraction (Client-side)
  const processFileWithAI = async () => {
    if (!currentFileBase64) {
      alert(isTh ? 'กรุณาเลือกหรืออัปโหลดเอกสาร IPQC-07 ก่อนทำการสกัดข้อมูล' : 'Please upload or select an IPQC-07 document before scanning.');
      return;
    }

    setIsScanning(true);

    try {
      const data = await extractThicknessWallClient(currentFileBase64, fileMimeType);

      if (data) {
        let rootObj = data;
        if (data.report) rootObj = data.report;
        else if (data.document) rootObj = data.document;
        else if (data.ipqc07) rootObj = data.ipqc07;
        else if (data.inspection) rootObj = data.inspection;

          // Extract Header Metadata
          let inspector = '';
          let coil = '';
          let profile = '';
          let sample = '';
          let process = '';

          const extractHeader = (h: any) => {
            if (!h || typeof h !== 'object') return;
            inspector = inspector || h.inspector_name || h.inspectorName || h.inspector || h.qc_inspector || h.operator || '';
            coil = coil || h.coil_no || h.coilNo || h.coil || h.lot_no || h.batch_no || h.coil_number || '';
            profile = profile || h.profile || h.profile_no || h.profileName || h.profile_code || h.item_code || '';
            sample = sample || h.sample_name || h.sampleName || h.sample || h.sample_id || '';
            process = process || h.process || h.process_name || h.line || h.machine || '';
          };

          if (typeof rootObj === 'object' && !Array.isArray(rootObj)) {
            if (rootObj.header) extractHeader(rootObj.header);
            if (rootObj.metadata) extractHeader(rootObj.metadata);
            extractHeader(rootObj);
          }

          if (inspector) setInspectorInput(String(inspector));
          if (coil) setCoilInput(String(coil));
          if (profile) setProfileInput(String(profile).toUpperCase());
          if (sample) setSampleInput(String(sample));
          if (process) setProcessInput(String(process));

          // Extract Table Items Array
          let rawTable: any[] = [];

          if (Array.isArray(data)) {
            rawTable = data;
          } else if (Array.isArray(rootObj)) {
            rawTable = rootObj;
          } else if (typeof rootObj === 'object' && rootObj !== null) {
            const possibleArrayKeys = [
              'table', 'items', 'measurements', 'data', 'rows', 'dimensions',
              'results', 'specs', 'details', 'wall_thickness', 'thickness_wall',
              'inspection_results', 'list', 'measurement_list', 'points', 'values'
            ];

            for (const k of possibleArrayKeys) {
              if (Array.isArray(rootObj[k])) {
                rawTable = rootObj[k];
                break;
              }
            }

            // Check any array property
            if (rawTable.length === 0) {
              for (const val of Object.values(rootObj)) {
                if (Array.isArray(val) && val.length > 0) {
                  rawTable = val;
                  break;
                }
              }
            }

            // Check key-value pairs
            if (rawTable.length === 0) {
              const directItems: { description: string; total: string }[] = [];
              const ignoredKeys = new Set(['header', 'metadata', 'inspector_name', 'coil_no', 'profile', 'sample_name', 'process', 'status', 'isMatch']);
              for (const [key, val] of Object.entries(rootObj)) {
                if (!ignoredKeys.has(key)) {
                  if (typeof val === 'number' || typeof val === 'string') {
                    directItems.push({ description: key.trim(), total: String(val) });
                  } else if (typeof val === 'object' && val !== null) {
                    const itemVal = (val as any).total ?? (val as any).value ?? (val as any).measurement;
                    if (itemVal !== undefined && itemVal !== null) {
                      directItems.push({ description: key.trim(), total: String(itemVal) });
                    }
                  }
                }
              }
              if (directItems.length > 0) {
                rawTable = directItems;
              }
            }
          }

          if (rawTable.length > 0) {
            const parsedItems = rawTable.map((t: any) => {
              if (typeof t === 'object' && t !== null) {
                const desc = String(t.description || t.item || t.name || t.label || t.parameter || t.point || t.code || 'ITEM').trim();
                const rawVal = t.total !== undefined ? String(t.total)
                  : (t.value !== undefined ? String(t.value)
                  : (t.measurement !== undefined ? String(t.measurement)
                  : (t.reading !== undefined ? String(t.reading)
                  : (t.val !== undefined ? String(t.val) : '0'))));
                const val = rawVal.trim().replace(/,/g, '.');
                return { description: desc, total: val };
              } else {
                return { description: 'ITEM', total: String(t).trim().replace(/,/g, '.') };
              }
            });

            setTableItems(parsedItems);
            setHasResults(true);
            return;
          } else {
            if (inspector || coil || profile || sample || process) {
              setHasResults(true);
              alert(isTh ? 'สกัดข้อมูลส่วนหัวสำเร็จแล้ว (Client-side) แต่ไม่พบตารางรายการวัด สามารถเพิ่มรายการย่อยเองได้' : 'Header metadata extracted successfully. You can add measurement items.');
            } else {
              alert(isTh ? 'สกัดข้อมูลสำเร็จ แต่ไม่พบตารางรายการวัดในเอกสารนี้' : 'Document analyzed successfully, but no measurement table rows were detected.');
            }
          }
        } else {
          alert(isTh ? 'ไม่สามารถประมวลผลข้อมูล AI ได้ กรุณาตรวจสอบความชัดเจนของไฟล์เอกสาร' : 'Could not process AI data. Please check file clarity.');
        }
    } catch (err: any) {
      console.error('Extraction Error:', err);
      alert(isTh ? 'เกิดข้อผิดพลาด: ' + (err.message || 'Error') : 'Error: ' + (err.message || 'Error'));
    } finally {
      setIsScanning(false);
    }
  };

  // Validate Table Item Against Spec
  const getRowValidationStatus = (desc: string, totalStr: string) => {
    const profName = profileInput.trim().toUpperCase();
    const specs = profileSpecs[profName];
    if (!specs || !profName) return { status: 'NONE', label: '-' };

    const cleanTotal = (totalStr || '').trim().replace(/,/g, '.');
    const val = parseFloat(cleanTotal);
    if (isNaN(val)) return { status: 'NONE', label: '-' };

    const descUpper = desc.trim().toUpperCase();
    // Sort specs by length descending so longer spec keys (e.g. 'IOR', 'IHR', 'OHW', 'IHW') are matched before shorter ones ('OR', 'IR')
    const sortedSpecs = [...specs].sort((a, b) => b.item.length - a.item.length);
    const matchingSpec = sortedSpecs.find(s => {
      const specItemUpper = s.item.toUpperCase();
      return descUpper.startsWith(specItemUpper) || descUpper.includes(specItemUpper);
    });

    if (!matchingSpec) return { status: 'NONE', label: '-' };

    const minVal = parseFloat(String(matchingSpec.min));
    const maxVal = parseFloat(String(matchingSpec.max));

    const isPass = (isNaN(minVal) || val >= minVal) && (isNaN(maxVal) || val <= maxVal);
    return isPass ? { status: 'PASS', label: 'PASS' } : { status: 'FAIL', label: 'FAIL' };
  };

  // Save Current Extracted Data
  const saveCurrentData = () => {
    if (tableItems.length === 0) return;

    let allPassed = true;
    const series: Record<string, number[]> = {
      t1: [], t2: [], or: [], ir: [], ihr: [], ohw: [], ihw: [], ra: [], ior: []
    };

    let t3Val: string | number = '-';
    let t4Val: string | number = '-';
    const t5List: string[] = [];

    tableItems.forEach(item => {
      const desc = item.description.trim().toUpperCase();
      const cleanTotal = item.total.trim().replace(/,/g, '.');
      const val = parseFloat(cleanTotal);
      const isNum = !isNaN(val) && cleanTotal !== '';

      const { status } = getRowValidationStatus(desc, item.total);
      if (status === 'FAIL') allPassed = false;

      if (/^OR/.test(desc) && isNum) series.or.push(val);
      else if (/^T1/.test(desc) && isNum) series.t1.push(val);
      else if (/^T2/.test(desc) && isNum) series.t2.push(val);
      else if (/^IR/.test(desc) && isNum) series.ir.push(val);
      else if (/^IHR/.test(desc) && isNum) series.ihr.push(val);
      else if (/^OHW/.test(desc) && isNum) series.ohw.push(val);
      else if (/^IHW/.test(desc) && isNum) series.ihw.push(val);
      else if (/^RA/.test(desc) && isNum) series.ra.push(val);
      else if (/^IOR/.test(desc) && isNum) series.ior.push(val);
      else if (/^T5/.test(desc)) t5List.push(`${desc}: ${cleanTotal}`);
      else if (desc === 'T3') t3Val = cleanTotal;
      else if (desc === 'T4') t4Val = cleanTotal;
    });

    const getRange = (arr: number[]) => ({
      min: arr.length > 0 ? Math.min(...arr) : '-',
      max: arr.length > 0 ? Math.max(...arr) : '-'
    });

    const newRecord: ThicknessWallRecord = {
      docId: `tw-doc-${Date.now()}`,
      id: `TW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('sv-SE').slice(0, 16),
      timestampRaw: new Date().toISOString(),
      inspector: inspectorInput || '-',
      process: processInput || '-',
      coil: coilInput || '-',
      sample: sampleInput || '-',
      profile: profileInput.toUpperCase() || '-',
      vals: {
        t1: getRange(series.t1),
        t2: getRange(series.t2),
        t3: t3Val,
        t4: t4Val,
        t5_list: t5List,
        or: getRange(series.or),
        ir: getRange(series.ir),
        ihr: getRange(series.ihr),
        ohw: getRange(series.ohw),
        ihw: getRange(series.ihw),
        ra: getRange(series.ra),
        ior: getRange(series.ior)
      },
      overallStatus: allPassed ? 'PASS' : 'FAIL'
    };

    setSavedRecords(prev => [newRecord, ...prev]);

    const outOfSpecDetails = tableItems
      .filter(item => item.status === 'FAIL')
      .map(item => `${item.item_desc}: ${item.total} (Spec: ${item.spec_min}-${item.spec_max})`)
      .join(', ');

    const inspectionResultText = allPassed 
      ? 'PASS (All measurements within specification limits)' 
      : `FAIL / Out of Spec: ${outOfSpecDetails || 'Exceeded tolerance limits'}`;

    if (onLogNewActivity) {
      onLogNewActivity({
        id: newRecord.docId!,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        moduleCode: 'IPQC-07',
        moduleTitleTh: 'วัดความหนาผนังชิ้นงาน (Thickness Wall Measurement)',
        moduleTitleEn: 'Thickness Wall Measurement System',
        inspector: inspectorInput || 'IPQC Inspector',
        batchLot: `Coil: ${coilInput || '-'} (Profile: ${profileInput || '-'})`,
        result: allPassed ? 'PASS' : 'REJECT',
        defectCount: allPassed ? 0 : tableItems.filter(i => i.status === 'FAIL').length || 1,
        remarks: inspectionResultText,
        coilNo: coilInput || 'UNKNOWN-COIL',
        profile: profileInput || 'PROFILE-SPEC',
        process: processInput ? `${processInput} (IPQC-07)` : 'Line A - Extrusion (IPQC-07)',
        inspectionDate: newRecord.timestamp,
        inspectionResult: inspectionResultText
      });
    }

    alert(isTh ? 'บันทึกข้อมูลผลการวัดความหนาลงระบบเรียบร้อยแล้ว (จัดเก็บเฉพาะ Text Data)' : 'Saved measurement record successfully (Pure Text Data).');
    // Reset Current Extraction UI and release image memory
    setHasResults(false);
    setCurrentFileBase64(null);
    setFileName(null);
    setPreviewUrl(null);
  };

  // Export Saved History to Excel / CSV
  const handleExportExcel = () => {
    if (savedRecords.length === 0) {
      alert(isTh ? 'ไม่มีข้อมูลสำหรับส่งออก' : 'No records to export.');
      return;
    }

    const headers = [
      "Timestamp", "Inspector", "Process", "Coil No.", "Sample", "Profile",
      "T1-Min", "T1-Max", "T2-Min", "T2-Max", "T3", "T4", "T5-Series",
      "OR-Min", "OR-Max", "IR-Min", "IR-Max", "IHR-Min", "IHR-Max",
      "OHW-Min", "OHW-Max", "IHW-Min", "IHW-Max", "RA-Min", "RA-Max", "IOR-Min", "IOR-Max", "Status"
    ];

    const rows = savedRecords.map(r => [
      r.timestamp,
      r.inspector,
      r.process,
      r.coil,
      r.sample,
      r.profile,
      r.vals.t1.min, r.vals.t1.max,
      r.vals.t2.min, r.vals.t2.max,
      r.vals.t3, r.vals.t4,
      `"${r.vals.t5_list.join(' | ')}"`,
      r.vals.or.min, r.vals.or.max,
      r.vals.ir.min, r.vals.ir.max,
      r.vals.ihr.min, r.vals.ihr.max,
      r.vals.ohw.min, r.vals.ohw.max,
      r.vals.ihw.min, r.vals.ihw.max,
      r.vals.ra.min, r.vals.ra.max,
      r.vals.ior.min, r.vals.ior.max,
      r.overallStatus
    ]);

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(row => row.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Thickness_Wall_Measurement_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const copyJSONData = () => {
    const exportObj = {
      header: {
        inspector_name: inspectorInput,
        process: processInput,
        coil_no: coilInput,
        profile: profileInput,
        sample_name: sampleInput
      },
      table: tableItems
    };
    navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2));
    alert(isTh ? 'คัดลอกข้อมูล JSON เรียบร้อยแล้ว' : 'Copied JSON to clipboard!');
  };

  // Spec Setting Handlers
  const handleSaveProfileSpec = () => {
    const name = specProfileName.trim().toUpperCase();
    if (!name) {
      alert(isTh ? 'กรุณาระบุชื่อ Profile Name' : 'Profile Name is required.');
      return;
    }

    if (specItems.length === 0) {
      alert(isTh ? 'กรุณาเพิ่มอย่างน้อย 1 รายการ Measurement Item' : 'Add at least one measurement item.');
      return;
    }

    setProfileSpecs(prev => ({
      ...prev,
      [name]: specItems
    }));

    alert(isTh ? `บันทึก Master Spec Profile ${name} เรียบร้อยแล้ว` : `Saved Master Spec for Profile ${name}`);
    setSpecProfileName('');
    setSpecItems([{ item: 'OR', min: 12.0, max: 13.5 }]);
  };

  const handleDeleteProfile = (name: string) => {
    setProfileSpecs(prev => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const handleEditProfile = (name: string) => {
    setSpecProfileName(name);
    setSpecItems(profileSpecs[name] || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dashboard Data Calculations
  const filteredDashboardRecords = useMemo(() => {
    return savedRecords.filter(r => {
      if (dashFilterProfile !== 'ALL' && r.profile !== dashFilterProfile) return false;
      if (dashFilterMonth !== 'ALL' && r.timestampRaw) {
        const d = new Date(r.timestampRaw);
        if (d.getMonth().toString() !== dashFilterMonth) return false;
      }
      if (dashFilterYear !== 'ALL' && r.timestampRaw) {
        const d = new Date(r.timestampRaw);
        if (d.getFullYear().toString() !== dashFilterYear) return false;
      }
      return true;
    });
  }, [savedRecords, dashFilterProfile, dashFilterMonth, dashFilterYear]);

  const dashTotalCount = filteredDashboardRecords.length;
  const dashPassCount = filteredDashboardRecords.filter(r => r.overallStatus === 'PASS').length;
  const dashFailCount = dashTotalCount - dashPassCount;

  const latestRecord = filteredDashboardRecords.length > 0 ? filteredDashboardRecords[0] : null;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-4 sm:p-6 space-y-6">

      {/* Admin Security Auth Modal */}
      {authModalVisible && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Admin Authorization</h3>
              <p className="text-xs text-slate-400">
                {isTh ? 'กรุณากรอกรหัสผ่านเพื่อเข้าสู่โหมดปรับแต่ง Profile Spec (admin2026)' : 'Enter admin password for Spec Settings (admin2026)'}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); verifyAdmin(); }} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => { setAdminPasswordInput(e.target.value); setAuthError(false); }}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                {authError && (
                  <p className="text-xs text-rose-400 font-bold mt-1 text-center">
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง ( admin2026 )' : 'Incorrect password (admin2026)'}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setAuthModalVisible(false); setAdminPasswordInput(''); setAuthError(false); }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
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

      {/* Top Navigation Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <Ruler className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  IPQC-07
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {isTh ? 'ระบบวัดความหนาผนังชิ้นงาน (Thickness Wall Measurement)' : 'Thickness Wall Measure System'}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTh ? 'สกัดข้อมูลด้วย Gemini AI 2.5 • Cloud Real-time Synced Hub' : 'AI-powered wall thickness extraction & quality specification audit'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => handleSwitchTab('extraction')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'extraction' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isTh ? 'Data Extraction' : 'Data Extraction'}</span>
          </button>

          <button
            onClick={() => handleSwitchTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{isTh ? 'Dashboard' : 'Dashboard'}</span>
          </button>

          <button
            onClick={() => handleSwitchTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{isTh ? 'Profile Spec Setting' : 'Spec Setting'}</span>
          </button>
        </div>
      </header>

      {/* TAB 1: DATA EXTRACTION */}
      {activeTab === 'extraction' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Upload Panel */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>1. นำเข้าไฟล์ (PDF / Image)</span>
                </h2>

                <div 
                  className="relative border-2 border-dashed border-slate-800 rounded-2xl h-80 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-all group overflow-hidden bg-slate-950/60 p-4 text-center"
                  onClick={() => document.getElementById('fileInputThickness')?.click()}
                >
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-indigo-500 shadow-[0_0_15px_#6366f1] animate-pulse top-1/2 z-20" />
                  )}

                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                  ) : fileName ? (
                    <div className="space-y-2">
                      <FileText className="w-16 h-16 text-indigo-400 mx-auto" />
                      <p className="text-xs font-bold text-white max-w-[200px] truncate">{fileName}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-xs text-slate-300">ลากไฟล์มาวาง หรือ คลิกเพื่อเลือก</p>
                      <p className="text-[10px] text-slate-500">รองรับไฟล์ PDF, สแกน หรือรูปถ่ายมือถือ</p>
                    </div>
                  )}

                  <input
                    type="file"
                    id="fileInputThickness"
                    accept="image/*, application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={loadDemoDocument}
                    type="button"
                    className="w-full py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700/60"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isTh ? 'โหลดไฟล์ตัวอย่าง (Demo Document)' : 'Load Demo Document'}</span>
                  </button>

                  <button
                    onClick={processFileWithAI}
                    disabled={isScanning}
                    className={`w-full font-black py-4 rounded-2xl transition shadow-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider ${
                      isScanning
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:brightness-110 shadow-indigo-600/20'
                    }`}
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                        <span>กำลังสกัดข้อมูลด้วย AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>สกัดข้อมูลด้วย AI แม่นยำสูง</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Result Panel */}
            <div className="lg:col-span-7">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 min-h-[500px] flex flex-col overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${hasResults ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                    <h3 className="font-bold text-xs text-white">ผลการสกัดข้อมูล (Structured Data)</h3>
                  </div>

                  {hasResults && (
                    <div className="flex gap-2">
                      <button
                        onClick={saveCurrentData}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>บันทึกข้อมูล</span>
                      </button>

                      <button
                        onClick={copyJSONData}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                  {!hasResults ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-3">
                      <Ruler className="w-16 h-16 text-slate-700 stroke-1" />
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">รอการนำเข้าและสกัดข้อมูลไฟล์</h4>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in">
                      {/* Header Input Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Inspector Name</label>
                          <input
                            type="text"
                            value={inspectorInput}
                            onChange={(e) => setInspectorInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Profile</label>
                          <input
                            type="text"
                            value={profileInput}
                            onChange={(e) => setProfileInput(e.target.value)}
                            className="w-full bg-slate-900 border border-indigo-800 rounded-xl px-3 py-2 text-xs font-bold text-indigo-200 focus:outline-none focus:border-indigo-500 uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Coil No.</label>
                          <input
                            type="text"
                            value={coilInput}
                            onChange={(e) => setCoilInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sample Name</label>
                          <input
                            type="text"
                            value={sampleInput}
                            onChange={(e) => setSampleInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Process</label>
                          <input
                            type="text"
                            value={processInput}
                            onChange={(e) => setProcessInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Items Measurement Table */}
                      <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] font-bold uppercase">
                            <tr>
                              <th className="px-3 py-3 text-center w-12">#</th>
                              <th className="px-3 py-3 text-left">Measurement Item</th>
                              <th className="px-3 py-3 text-right">Measure Value</th>
                              <th className="px-3 py-3 text-center w-20">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 bg-slate-900">
                            {tableItems.map((item, idx) => {
                              const { status, label } = getRowValidationStatus(item.description, item.total);
                              return (
                                <tr key={idx} className="hover:bg-slate-800/40 transition">
                                  <td className="px-3 py-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                                  <td className="px-3 py-2.5">
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) => {
                                        const newItems = [...tableItems];
                                        newItems[idx].description = e.target.value;
                                        setTableItems(newItems);
                                      }}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <input
                                      type="text"
                                      value={item.total}
                                      onChange={(e) => {
                                        const newItems = [...tableItems];
                                        newItems[idx].total = e.target.value.replace(/,/g, '.');
                                        setTableItems(newItems);
                                      }}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-right font-bold text-indigo-200 font-mono"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                      status === 'PASS' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                                      status === 'FAIL' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                                      'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                      {label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* History Records Table Section */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-xs text-white">ประวัติการบันทึกข้อมูล (Cloud Shared Hub)</h3>
                <span className="text-[10px] text-slate-400 font-mono">({savedRecords.length} Records)</span>
              </div>

              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export to Excel</span>
              </button>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-[11px] min-w-[2200px] border-collapse">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-center">
                  <tr className="divide-x divide-slate-800">
                    <th rowSpan={2} className="p-3 text-left sticky left-0 bg-slate-950 z-10 w-[140px]">วัน/เวลา</th>
                    <th rowSpan={2} className="p-3 text-left sticky left-[140px] bg-slate-950 z-10 w-[120px]">Inspector</th>
                    <th rowSpan={2} className="p-3 text-left">Process</th>
                    <th rowSpan={2} className="p-3 text-left">Coil No.</th>
                    <th rowSpan={2} className="p-3 text-left">Sample</th>
                    <th rowSpan={2} className="p-3 text-left">Profile</th>
                    <th colSpan={2} className="p-2 bg-indigo-950/50 text-indigo-300">T1</th>
                    <th colSpan={2} className="p-2 bg-cyan-950/50 text-cyan-300">T2</th>
                    <th rowSpan={2} className="p-3">T3</th>
                    <th rowSpan={2} className="p-3">T4</th>
                    <th rowSpan={2} className="p-3">T5 Series</th>
                    <th colSpan={2} className="p-2 bg-emerald-950/50 text-emerald-300">OR</th>
                    <th colSpan={2} className="p-2 bg-amber-950/50 text-amber-300">IR</th>
                    <th colSpan={2} className="p-2 bg-rose-950/50 text-rose-300">IHR</th>
                    <th colSpan={2} className="p-2 bg-purple-950/50 text-purple-300">OHW</th>
                    <th colSpan={2} className="p-2 bg-blue-950/50 text-blue-300">IHW</th>
                    <th colSpan={2} className="p-2 bg-yellow-950/50 text-yellow-300">RA</th>
                    <th colSpan={2} className="p-2 bg-teal-950/50 text-teal-300">IOR</th>
                    <th rowSpan={2} className="p-3">Status</th>
                    <th rowSpan={2} className="p-3">Action</th>
                  </tr>
                  <tr className="divide-x divide-slate-800 border-t border-slate-800 text-[9px]">
                    <th className="p-1">min</th><th className="p-1">max</th>
                    <th className="p-1">min</th><th className="p-1">max</th>
                    <th className="p-1">min</th><th className="p-1">max</th>
                    <th className="p-1">min</th><th className="p-1">max</th>
                    <th className="p-1">min</th><th className="p-1">max</th>
                    <th className="p-1">min</th><th className="p-1">max</th>
                    <th className="p-1">min</th><th className="p-1">max</th>
                    <th className="p-1">min</th><th className="p-1">max</th>
                    <th className="p-1">min</th><th className="p-1">max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-center bg-slate-900">
                  {savedRecords.map((rec) => (
                    <tr key={rec.docId || rec.id} className="hover:bg-slate-800/40 transition divide-x divide-slate-800/60">
                      <td className="p-2.5 text-left text-slate-400 font-mono sticky left-0 bg-slate-900 z-10">{rec.timestamp}</td>
                      <td className="p-2.5 text-left font-bold text-white sticky left-[140px] bg-slate-900 z-10">{rec.inspector}</td>
                      <td className="p-2.5 text-left text-indigo-300">{rec.process}</td>
                      <td className="p-2.5 text-left font-mono text-slate-300">{rec.coil}</td>
                      <td className="p-2.5 text-left text-slate-400">{rec.sample}</td>
                      <td className="p-2.5 text-left font-bold text-cyan-400">{rec.profile}</td>

                      <td className="p-2 text-indigo-300 font-mono">{rec.vals.t1.min}</td>
                      <td className="p-2 text-indigo-300 font-mono">{rec.vals.t1.max}</td>
                      <td className="p-2 text-cyan-300 font-mono">{rec.vals.t2.min}</td>
                      <td className="p-2 text-cyan-300 font-mono">{rec.vals.t2.max}</td>

                      <td className="p-2 font-mono font-bold text-amber-300">{rec.vals.t3}</td>
                      <td className="p-2 font-mono font-bold text-amber-300">{rec.vals.t4}</td>

                      <td className="p-2 text-left text-[10px]">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {rec.vals.t5_list.map((t5, idx) => (
                            <span key={idx} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300 font-mono">
                              {t5}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-2 text-emerald-300 font-mono">{rec.vals.or.min}</td>
                      <td className="p-2 text-emerald-300 font-mono">{rec.vals.or.max}</td>
                      <td className="p-2 text-amber-300 font-mono">{rec.vals.ir.min}</td>
                      <td className="p-2 text-amber-300 font-mono">{rec.vals.ir.max}</td>
                      <td className="p-2 text-rose-300 font-mono">{rec.vals.ihr.min}</td>
                      <td className="p-2 text-rose-300 font-mono">{rec.vals.ihr.max}</td>
                      <td className="p-2 text-purple-300 font-mono">{rec.vals.ohw.min}</td>
                      <td className="p-2 text-purple-300 font-mono">{rec.vals.ohw.max}</td>
                      <td className="p-2 text-blue-300 font-mono">{rec.vals.ihw.min}</td>
                      <td className="p-2 text-blue-300 font-mono">{rec.vals.ihw.max}</td>
                      <td className="p-2 text-yellow-300 font-mono">{rec.vals.ra.min}</td>
                      <td className="p-2 text-yellow-300 font-mono">{rec.vals.ra.max}</td>
                      <td className="p-2 text-teal-300 font-mono">{rec.vals.ior.min}</td>
                      <td className="p-2 text-teal-300 font-mono">{rec.vals.ior.max}</td>

                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.overallStatus === 'PASS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {rec.overallStatus}
                        </span>
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => handleRequestEditHistory(rec)}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition border border-amber-500/30 flex items-center justify-center gap-1 text-[11px] font-bold mx-auto"
                          title="แก้ไขข้อมูล (ต้องใส่ Password)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>แก้ไข</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter by Profile</label>
              <select
                value={dashFilterProfile}
                onChange={(e) => setDashFilterProfile(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="ALL">ALL PROFILES</option>
                {Object.keys(profileSpecs).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter by Month</label>
              <select
                value={dashFilterMonth}
                onChange={(e) => setDashFilterMonth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="ALL">ALL MONTHS</option>
                <option value="0">January</option>
                <option value="1">February</option>
                <option value="2">March</option>
                <option value="3">April</option>
                <option value="4">May</option>
                <option value="5">June</option>
                <option value="6">July</option>
                <option value="7">August</option>
                <option value="8">September</option>
                <option value="9">October</option>
                <option value="10">November</option>
                <option value="11">December</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter by Year</label>
              <select
                value={dashFilterYear}
                onChange={(e) => setDashFilterYear(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="ALL">ALL YEARS</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => { setDashFilterProfile('ALL'); setDashFilterMonth('ALL'); setDashFilterYear('ALL'); }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-4 shadow-xl">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Samples Inspected</p>
                <h3 className="text-3xl font-black text-white">{dashTotalCount}</h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-emerald-900/40 rounded-3xl p-6 flex items-center gap-4 shadow-xl">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Pass (งานดี)</p>
                <h3 className="text-3xl font-black text-emerald-300">{dashPassCount}</h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-rose-900/40 rounded-3xl p-6 flex items-center gap-4 shadow-xl">
              <div className="w-14 h-14 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center">
                <XCircle className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Fail (งานเสีย)</p>
                <h3 className="text-3xl font-black text-rose-300">{dashFailCount}</h3>
              </div>
            </div>
          </div>

          {/* Visual Trend Bars / Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>T1 & T2 Min/Max Measurements (Latest Sample)</span>
              </h3>

              {latestRecord ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                      <span>T1 Range (Min: {latestRecord.vals.t1.min} - Max: {latestRecord.vals.t1.max})</span>
                    </div>
                    <div className="h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                      <span>T2 Range (Min: {latestRecord.vals.t2.min} - Max: {latestRecord.vals.t2.max})</span>
                    </div>
                    <div className="h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-6 text-center">ไม่มีข้อมูลตัวอย่าง</p>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>T3 & T4 Standard Values (Latest Sample)</span>
              </h3>

              {latestRecord ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                      <span>T3 Value: {latestRecord.vals.t3}</span>
                    </div>
                    <div className="h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                      <span>T4 Value: {latestRecord.vals.t4}</span>
                    </div>
                    <div className="h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full" style={{ width: '82%' }} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-6 text-center">ไม่มีข้อมูลตัวอย่าง</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE SPEC SETTING */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          {/* Add / Edit Profile Spec Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>ตั้งค่า Spec ใหม่ (Profile Specification Manager)</span>
              </h3>
            </div>

            <div className="max-w-md space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Profile Name</label>
              <input
                type="text"
                value={specProfileName}
                onChange={(e) => setSpecProfileName(e.target.value.toUpperCase())}
                placeholder="เช่น A-001, B-002"
                className="w-full bg-slate-950 border border-indigo-800 rounded-2xl px-4 py-3 text-lg font-bold text-indigo-300 uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Spec Items Table */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Measurement Item (Prefix)</th>
                    <th className="px-4 py-3 text-center w-36">Min Spec</th>
                    <th className="px-4 py-3 text-center w-36">Max Spec</th>
                    <th className="px-4 py-3 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900">
                  {specItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.item}
                          onChange={(e) => {
                            const newItems = [...specItems];
                            newItems[idx].item = e.target.value.toUpperCase();
                            setSpecItems(newItems);
                          }}
                          placeholder="Prefix (e.g. OR, T1, IR)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold uppercase font-mono"
                        />
                      </td>

                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="any"
                          value={item.min}
                          onChange={(e) => {
                            const newItems = [...specItems];
                            newItems[idx].min = e.target.value;
                            setSpecItems(newItems);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-center font-mono text-emerald-300"
                        />
                      </td>

                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="any"
                          value={item.max}
                          onChange={(e) => {
                            const newItems = [...specItems];
                            newItems[idx].max = e.target.value;
                            setSpecItems(newItems);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-center font-mono text-rose-300"
                        />
                      </td>

                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => setSpecItems(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSpecItems(prev => [...prev, { item: '', min: 0, max: 0 }])}
                className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มจุดวัด (Measurement Item)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveProfileSpec}
                className="py-3 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 ml-auto"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการตั้งค่า Spec</span>
              </button>
            </div>
          </div>

          {/* Configured Profiles Cards Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>รายการ Profile (Synced from Cloud)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(profileSpecs).map((profName) => (
                <div key={profName} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-indigo-300 text-lg">{profName}</h4>
                      <p className="text-[10px] text-slate-500">{profileSpecs[profName].length} Measurement Items</p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditProfile(profName)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteProfile(profName)}
                        className="p-1.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profileSpecs[profName].map((itemSpec, idx) => (
                      <span key={idx} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                        {itemSpec.item}: {itemSpec.min}-{itemSpec.max}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
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
                ยืนยันรหัสผ่านเพื่อแก้ไขข้อมูล
              </h3>
              <p className="text-xs text-slate-400">
                กรอกรหัสผ่านเพื่อแก้ไขรายการตรวจวัด IPQC-07 (Password: admin2026)
              </p>
            </div>

            <form onSubmit={handleVerifyHistoryPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={historyAuthPassword}
                  onChange={(e) => setHistoryAuthPassword(e.target.value)}
                  placeholder="Password: admin2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {historyAuthError && (
                  <p className="text-xs text-rose-400 font-semibold text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>รหัสผ่านไม่ถูกต้อง! (กรุณาใช้ admin2026)</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsHistoryAuthOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-amber-600/20 flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>ปลดล็อกเพื่อแก้ไข</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT HISTORY RECORD MODAL */}
      {editingHistoryItem && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    แก้ไขข้อมูล Thickness & Wall (IPQC-07)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Coil: {editingHistoryItem.coil} | ID: {editingHistoryItem.id}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Coil Number</label>
                  <input
                    type="text"
                    value={editingHistoryItem.coil || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, coil: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inspector Name</label>
                  <input
                    type="text"
                    value={editingHistoryItem.inspector || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, inspector: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Process</label>
                  <input
                    type="text"
                    value={editingHistoryItem.process || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, process: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Profile Spec</label>
                  <input
                    type="text"
                    value={editingHistoryItem.profile || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, profile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-indigo-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Overall Status</label>
                  <select
                    value={editingHistoryItem.overallStatus}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, overallStatus: e.target.value as 'PASS' | 'FAIL' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Thickness & Dimension Values</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">T1 Min</label>
                    <input
                      type="text"
                      value={editingHistoryItem.vals?.t1?.min || ''}
                      onChange={(e) => setEditingHistoryItem({
                        ...editingHistoryItem,
                        vals: { ...editingHistoryItem.vals, t1: { ...editingHistoryItem.vals.t1, min: e.target.value } }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">T1 Max</label>
                    <input
                      type="text"
                      value={editingHistoryItem.vals?.t1?.max || ''}
                      onChange={(e) => setEditingHistoryItem({
                        ...editingHistoryItem,
                        vals: { ...editingHistoryItem.vals, t1: { ...editingHistoryItem.vals.t1, max: e.target.value } }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">T3 Value</label>
                    <input
                      type="text"
                      value={editingHistoryItem.vals?.t3 || ''}
                      onChange={(e) => setEditingHistoryItem({
                        ...editingHistoryItem,
                        vals: { ...editingHistoryItem.vals, t3: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">T4 Value</label>
                    <input
                      type="text"
                      value={editingHistoryItem.vals?.t4 || ''}
                      onChange={(e) => setEditingHistoryItem({
                        ...editingHistoryItem,
                        vals: { ...editingHistoryItem.vals, t4: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">OR Min</label>
                    <input
                      type="text"
                      value={editingHistoryItem.vals?.or?.min || ''}
                      onChange={(e) => setEditingHistoryItem({
                        ...editingHistoryItem,
                        vals: { ...editingHistoryItem.vals, or: { ...editingHistoryItem.vals.or, min: e.target.value } }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">OR Max</label>
                    <input
                      type="text"
                      value={editingHistoryItem.vals?.or?.max || ''}
                      onChange={(e) => setEditingHistoryItem({
                        ...editingHistoryItem,
                        vals: { ...editingHistoryItem.vals, or: { ...editingHistoryItem.vals.or, max: e.target.value } }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingHistoryItem(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveEditedHistory}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
