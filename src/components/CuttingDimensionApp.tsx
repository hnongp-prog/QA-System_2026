import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Ruler, 
  History, 
  PlusCircle, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Save,
  BarChart3,
  Lock,
  ArrowLeft,
  Plus,
  Search,
  Settings,
  ArrowRightLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Rotate3D,
  Sliders,
  Check,
  ListOrdered,
  Edit3,
  X,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Tag,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckSquare,
  Square,
  Wrench,
  Disc
} from 'lucide-react';

import { 
  CuttingProfileSpec, 
  CuttingInspectionRecord, 
  CuttingCustomPointSpec,
  CuttingEvaluationType,
  MicroType,
  Language, 
  InspectionActivity 
} from '../types';
import { useCloudState } from '../services/firestoreSync';
import { ProcessSelector, MachineSelector } from './common/ProcessMachineSelector';
import { STANDARD_PROCESS_OPTIONS, STANDARD_MACHINE_OPTIONS } from '../constants/processOptions';

export interface ActiveCuttingPoint {
  id: string; // 'width' | 'height' | 'length' | 'bending' | 'camber' | 'twist' | custom id
  key?: string;
  isStandard?: boolean;
  type?: 'standard' | 'custom';
  name: string;
  unit: string;
  evalType: CuttingEvaluationType;
  target?: string;
  tolPlus?: string;
  tolMinus?: string;
  maxLimit?: string;
  minLimit?: string;
  isSC: boolean;
  microType: MicroType;
  order: number;
  specText?: string;
  description?: string;
}

interface CuttingDimensionAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
}

// Sparkline Component
const Sparkline = ({ data, color, label }: { data: number[]; color: string; label: string }) => {
  const validData = data.filter(v => !isNaN(v));
  
  if (!validData || validData.length === 0) {
    return (
      <div className="flex flex-col w-full h-full justify-end">
        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</span>
        <div className="h-16 flex items-center justify-center text-[10px] text-slate-500 bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
          No trend data
        </div>
      </div>
    );
  }
  
  const width = 300; 
  const height = 60;  
  const padding = 8;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  
  const maxVal = Math.max(...validData, 0.1);
  const minVal = Math.max(0, Math.min(...validData) * 0.8); 
  const range = maxVal - minVal || 1;

  const getX = (index: number) => {
    if (validData.length === 1) return width / 2;
    return padding + (index / (validData.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding + innerHeight - ((val - minVal) / range) * innerHeight;
  };

  const points = validData.map((val, i) => `${getX(i)},${getY(val)}`).join(' ');

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-1.5">
         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
         <span className="text-[10px] text-indigo-300 font-mono font-bold">Last: {validData[validData.length-1].toFixed(2)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 overflow-visible bg-slate-950/80 rounded-xl border border-slate-800">
        {validData.length > 1 && (
          <polyline 
            points={points} 
            fill="none" 
            stroke={color} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}
        {validData.map((val, i) => (
           <circle 
             key={i} 
             cx={getX(i)} 
             cy={getY(val)} 
             r="3.5" 
             fill="#0f172a" 
             stroke={color} 
             strokeWidth="2" 
             className="hover:r-5 transition-all" 
           />
        ))}
      </svg>
    </div>
  );
};

const DEFAULT_PROFILES: CuttingProfileSpec[] = [
  { 
    name: 'CUT-PROFILE-STD-100', 
    partNo: 'PART-100-A',
    widthName: 'ความกว้าง W (Width)',
    widthTarget: '100.00', widthTolPlus: '0.50', widthTolMinus: '0.50',
    widthIsSC: true,
    widthMicroType: 'Blade',
    widthOrder: 1,
    heightName: 'ความสูง H (Height)',
    heightTarget: '50.00', heightTolPlus: '0.30', heightTolMinus: '0.30',
    heightIsSC: true,
    heightMicroType: 'Blade',
    heightOrder: 2,
    lengthName: 'ความยาวตัด L (Length)',
    lengthTarget: '2000.00', lengthTolPlus: '2.00', lengthTolMinus: '2.00',
    lengthIsSC: false,
    lengthMicroType: 'None',
    lengthOrder: 3,
    bendingName: 'ความโก่ง Bending',
    bendingMax: '1.50',
    bendingIsSC: false,
    bendingMicroType: 'None',
    bendingOrder: 6,
    camberName: 'ความคด Camber',
    camberMax: '1.00',
    camberIsSC: false,
    camberMicroType: 'None',
    camberOrder: 7,
    twistName: 'ความบิด Twist',
    twistMax: '0.50',
    twistIsSC: false,
    twistMicroType: 'None',
    twistOrder: 8,
    customControlPoints: [
      {
        id: 'cp-w2',
        name: 'ความกว้าง W2 (Side Width)',
        unit: 'mm',
        evalType: 'target_tol',
        target: '25.00',
        tolPlus: '0.20',
        tolMinus: '0.20',
        description: 'วัดความกว้างปีกข้าง',
        isSC: true,
        microType: 'Blade',
        order: 4
      },
      {
        id: 'cp-angle',
        name: 'มุมตัด (Cut Chamfer Angle)',
        unit: 'deg',
        evalType: 'target_tol',
        target: '45.00',
        tolPlus: '1.00',
        tolMinus: '1.00',
        description: 'มุมบากหัวตัด',
        isSC: false,
        microType: 'None',
        order: 5
      }
    ],
    pointOrderList: ['width', 'height', 'length', 'cp-w2', 'cp-angle', 'bending', 'camber', 'twist']
  },
  { 
    name: 'HEAVY-CUT-PROFILE-200', 
    partNo: 'PART-200-B',
    widthName: 'ความกว้างหน้าตัด (Main Width)',
    widthTarget: '200.00', widthTolPlus: '1.00', widthTolMinus: '1.00',
    widthIsSC: true,
    widthMicroType: 'Blade',
    widthOrder: 1,
    heightName: 'ความสูงชิ้นงาน (Main Height)',
    heightTarget: '100.00', heightTolPlus: '0.50', heightTolMinus: '0.50',
    heightIsSC: true,
    heightMicroType: 'Blade',
    heightOrder: 2,
    lengthName: 'ความยาวตัดท่อน (Cut Length)',
    lengthTarget: '3000.00', lengthTolPlus: '3.00', lengthTolMinus: '3.00',
    lengthIsSC: false,
    lengthMicroType: 'None',
    lengthOrder: 3,
    bendingName: 'ความแอ่นแนวระนาบ (Bending)',
    bendingMax: '2.00',
    bendingIsSC: false,
    bendingMicroType: 'None',
    bendingOrder: 6,
    camberName: 'ความคดงอแนวแกน (Camber)',
    camberMax: '1.50',
    camberIsSC: false,
    camberMicroType: 'None',
    camberOrder: 7,
    twistName: 'องศาการบิดตัว (Twist)',
    twistMax: '1.00',
    twistIsSC: false,
    twistMicroType: 'None',
    twistOrder: 8,
    customControlPoints: [
      {
        id: 'cp-flange-t',
        name: 'ความหนาปีก (Flange Thickness)',
        unit: 'mm',
        evalType: 'min_max',
        minLimit: '3.80',
        maxLimit: '4.20',
        description: 'ความหนาปีกช่วงกลาง',
        isSC: true,
        microType: 'Rod',
        order: 4
      },
      {
        id: 'cp-pitch',
        name: 'ระยะรูเจาะ (Hole Pitch)',
        unit: 'mm',
        evalType: 'target_tol',
        target: '50.00',
        tolPlus: '0.30',
        tolMinus: '0.30',
        description: 'ระยะห่างระหว่างจุดศูนย์กลางรู',
        isSC: false,
        microType: 'None',
        order: 5
      }
    ],
    pointOrderList: ['width', 'height', 'length', 'cp-flange-t', 'cp-pitch', 'bending', 'camber', 'twist']
  }
];

const INITIAL_INSPECTIONS: CuttingInspectionRecord[] = [
  {
    id: 'rec-cut-001',
    lotNumber: 'COIL-2026-X101',
    partId: 'PART-100-A',
    sampleName: 'Sample 1',
    workOrder: 'WO-2026-8801',
    width: '100.15',
    height: '50.10',
    length: '2000.50',
    bending: '0.80',
    camber: '0.40',
    twist: '0.20',
    customPointValues: {
      'cp-w2': '25.08',
      'cp-angle': '45.2'
    },
    status: 'Pass',
    profileName: 'CUT-PROFILE-STD-100',
    inspectorName: 'Anan S.',
    employeeName: 'Somchai W.',
    machine: 'CUT-LINE-01',
    date: '2026-08-05',
    timestamp: '05/08/2026, 09:15:00'
  },
  {
    id: 'rec-cut-002',
    lotNumber: 'COIL-2026-X102',
    partId: 'PART-100-A',
    sampleName: 'Sample 2',
    workOrder: 'WO-2026-8801',
    width: '101.20',
    height: '50.80',
    length: '2004.00',
    bending: '2.80',
    camber: '1.50',
    twist: '0.80',
    customPointValues: {
      'cp-w2': '25.35',
      'cp-angle': '46.8'
    },
    status: 'Fail',
    remarks: 'Width & Bending exceed maximum allowed tolerances',
    profileName: 'CUT-PROFILE-STD-100',
    inspectorName: 'Anan S.',
    employeeName: 'Somchai W.',
    machine: 'CUT-LINE-01',
    date: '2026-08-05',
    timestamp: '05/08/2026, 10:45:00'
  }
];

export const CuttingDimensionApp: React.FC<CuttingDimensionAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th'
}) => {
  const isTh = language === 'th';
  const [activeTab, setActiveTab] = useState<'new-batch' | 'settings' | 'dashboard' | 'history'>('new-batch');
  const tableRef = useRef<HTMLDivElement>(null);

  // Profiles and Inspections with Real-time Cloud Sync
  const [savedProfiles, setSavedProfiles] = useCloudState<CuttingProfileSpec[]>('cutting_qc_profiles', DEFAULT_PROFILES);
  const [inspections, setInspections] = useCloudState<CuttingInspectionRecord[]>('cutting_qc_inspections', INITIAL_INSPECTIONS);

  // Auth State for Settings
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);

  // Header Metadata State (including customControlPoints, customizable point names, SC, MicroType, Order)
  const [headerInfo, setHeaderInfo] = useState<{
    inspectorName: string;
    shift: string;
    employeeName: string;
    process: string;
    machine: string;
    workOrder: string;
    coilNo: string;
    date: string;
    profileName: string;
    partNo: string;
    widthName: string;
    widthTarget: string;
    widthTolPlus: string;
    widthTolMinus: string;
    widthIsSC: boolean;
    widthMicroType: MicroType;
    widthOrder: number;
    heightName: string;
    heightTarget: string;
    heightTolPlus: string;
    heightTolMinus: string;
    heightIsSC: boolean;
    heightMicroType: MicroType;
    heightOrder: number;
    lengthName: string;
    lengthTarget: string;
    lengthTolPlus: string;
    lengthTolMinus: string;
    lengthIsSC: boolean;
    lengthMicroType: MicroType;
    lengthOrder: number;
    bendingName: string;
    bendingMax: string;
    bendingIsSC: boolean;
    bendingMicroType: MicroType;
    bendingOrder: number;
    camberName: string;
    camberMax: string;
    camberIsSC: boolean;
    camberMicroType: MicroType;
    camberOrder: number;
    twistName: string;
    twistMax: string;
    twistIsSC: boolean;
    twistMicroType: MicroType;
    twistOrder: number;
    customControlPoints: CuttingCustomPointSpec[];
    pointOrderList?: string[];
  }>({
    inspectorName: '',
    shift: '',
    employeeName: '',
    process: 'CUT',
    machine: '',
    workOrder: '',
    coilNo: '',
    date: new Date().toISOString().split('T')[0],
    profileName: '',
    partNo: '',
    widthName: 'ความกว้าง (Width)',
    widthTarget: '', widthTolPlus: '', widthTolMinus: '',
    widthIsSC: false,
    widthMicroType: 'Blade',
    widthOrder: 1,
    heightName: 'ความสูง (Height)',
    heightTarget: '', heightTolPlus: '', heightTolMinus: '',
    heightIsSC: false,
    heightMicroType: 'Blade',
    heightOrder: 2,
    lengthName: 'ความยาว (Length)',
    lengthTarget: '', lengthTolPlus: '', lengthTolMinus: '',
    lengthIsSC: false,
    lengthMicroType: 'None',
    lengthOrder: 3,
    bendingName: 'ความโก่ง (Bending)',
    bendingMax: '',
    bendingIsSC: false,
    bendingMicroType: 'None',
    bendingOrder: 6,
    camberName: 'ความคด (Camber)',
    camberMax: '',
    camberIsSC: false,
    camberMicroType: 'None',
    camberOrder: 7,
    twistName: 'ความบิด (Twist)',
    twistMax: '',
    twistIsSC: false,
    twistMicroType: 'None',
    twistOrder: 8,
    customControlPoints: [],
    pointOrderList: []
  });

  const [profileStatus, setProfileStatus] = useState<'found' | 'not-found'>('not-found');

  // Batch Rows Data Entry State with customPointValues
  const [batchItems, setBatchItems] = useState<Array<{
    id: number;
    sampleName: string;
    width: string;
    height: string;
    length: string;
    bending: string;
    camber: string;
    twist: string;
    customPointValues: Record<string, string>;
    status: 'Pass' | 'Fail' | 'Pending';
    remarks: string;
  }>>([
    {
      id: Date.now(),
      sampleName: 'Sample 1',
      width: '',
      height: '',
      length: '',
      bending: '',
      camber: '',
      twist: '',
      customPointValues: {},
      status: 'Pending',
      remarks: ''
    }
  ]);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'profile' | 'history'; id: string; label: string } | null>(null);
  const [viewDetailRecord, setViewDetailRecord] = useState<CuttingInspectionRecord | null>(null);

  // History Edit Auth & Modal States
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<CuttingInspectionRecord | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<CuttingInspectionRecord | null>(null);
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState('');
  const [historyAuthError, setHistoryAuthError] = useState(false);

  const handleRequestEditHistory = (item: CuttingInspectionRecord) => {
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
    setInspections(prev => prev.map(ins => ins.id === editingHistoryItem.id ? editingHistoryItem : ins));
    setEditingHistoryItem(null);
    setTargetEditHistoryItem(null);
    showNotification(isTh ? 'บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว' : 'Record updated successfully');
  };

  const [trendFilterProfile, setTrendFilterProfile] = useState('All');
  const [trendFilterMonth, setTrendFilterMonth] = useState('All');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // Handle Admin Verification
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin2026') {
      setIsAdminAuthenticated(true);
      setAdminAuthError(false);
      setAdminPasswordInput('');
      setShowAdminModal(false);
      setActiveTab('settings');
    } else {
      setAdminAuthError(true);
      showNotification(isTh ? 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่' : 'Incorrect password', 'error');
    }
  };

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setActiveTab('settings');
    } else {
      setShowAdminModal(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = (e.target as HTMLElement).closest('form') || tableRef.current;
      if (!form) return;

      const focusableElements = Array.from(
        form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input:not([disabled]), select:not([disabled])')
      );
      
      const index = focusableElements.indexOf(e.target as HTMLInputElement);
      if (index > -1 && index < focusableElements.length - 1) {
        (focusableElements[index + 1] as HTMLElement).focus();
      } else if (index === focusableElements.length - 1) {
        addRow();
        setTimeout(() => {
          const updated = Array.from(
            form.querySelectorAll<HTMLInputElement>('input:not([disabled])')
          );
          if (updated[index + 1]) (updated[index + 1] as HTMLElement).focus();
        }, 50);
      }
    }
  };

  const availableProfiles = useMemo(() => {
    return ['All', ...Array.from(new Set(inspections.map(i => i.profileName || 'Unknown')))];
  }, [inspections]);

  const availableMonths = useMemo(() => {
    const months = inspections.map(i => i.date ? i.date.substring(0, 7) : null).filter(Boolean) as string[];
    return ['All', ...Array.from(new Set(months))].sort((a, b) => b.localeCompare(a));
  }, [inspections]);

  // Dashboard Summary Metrics
  const dashboardStats = useMemo(() => {
    if (inspections.length === 0) return null;

    const total = inspections.length;
    const passCount = inspections.filter(i => i.status === 'Pass').length;
    const failCount = total - passCount;
    const passRatio = ((passCount / total) * 100).toFixed(1);

    const profileGroups: Record<string, { 
      name: string; total: number; pass: number; fail: number; 
      avgWidth: number; countWidth: number;
      avgHeight: number; countHeight: number;
      avgLength: number; countLength: number;
      avgBending: number; countBending: number;
    }> = {};

    inspections.forEach(item => {
      const pName = item.profileName || 'Unknown';
      if (!profileGroups[pName]) {
        profileGroups[pName] = { 
          name: pName, total: 0, pass: 0, fail: 0, 
          avgWidth: 0, countWidth: 0,
          avgHeight: 0, countHeight: 0,
          avgLength: 0, countLength: 0,
          avgBending: 0, countBending: 0,
        };
      }
      profileGroups[pName].total++;
      if (item.status === 'Pass') profileGroups[pName].pass++;
      else profileGroups[pName].fail++;

      const w = parseFloat(item.width || '0');
      if (!isNaN(w) && w > 0) { profileGroups[pName].avgWidth += w; profileGroups[pName].countWidth++; }

      const h = parseFloat(item.height || item.heightLeft || '0');
      if (!isNaN(h) && h > 0) { profileGroups[pName].avgHeight += h; profileGroups[pName].countHeight++; }

      const l = parseFloat(item.length || '0');
      if (!isNaN(l) && l > 0) { profileGroups[pName].avgLength += l; profileGroups[pName].countLength++; }

      const b = parseFloat(item.bending || '0');
      if (!isNaN(b) && b > 0) { profileGroups[pName].avgBending += b; profileGroups[pName].countBending++; }
    });

    const profileSummaries = Object.values(profileGroups).map(g => {
      return {
        ...g,
        avgWidth: g.countWidth > 0 ? (g.avgWidth / g.countWidth).toFixed(2) : '-',
        avgHeight: g.countHeight > 0 ? (g.avgHeight / g.countHeight).toFixed(2) : '-',
        avgLength: g.countLength > 0 ? (g.avgLength / g.countLength).toFixed(2) : '-',
        avgBending: g.countBending > 0 ? (g.avgBending / g.countBending).toFixed(2) : '-',
        passRate: ((g.pass / g.total) * 100).toFixed(1),
      };
    });

    return { total, passCount, failCount, passRatio, profileSummaries };
  }, [inspections]);

  // Filtered Sparkline Trends
  const filteredTrends = useMemo(() => {
    if (inspections.length === 0) return [];

    let filtered = inspections;
    if (trendFilterProfile !== 'All') {
      filtered = filtered.filter(i => (i.profileName || 'Unknown') === trendFilterProfile);
    }
    if (trendFilterMonth !== 'All') {
      filtered = filtered.filter(i => i.date && i.date.startsWith(trendFilterMonth));
    }

    const groups: Record<string, { name: string; total: number; history: CuttingInspectionRecord[] }> = {};
    filtered.forEach(item => {
      const pName = item.profileName || 'Unknown';
      if (!groups[pName]) groups[pName] = { name: pName, total: 0, history: [] };
      groups[pName].total++;
      groups[pName].history.push(item);
    });

    return Object.values(groups).map(g => {
      const sortedHistory = [...g.history].reverse(); 
      const trends = {
        width: sortedHistory.map(item => parseFloat(item.width || '0')),
        height: sortedHistory.map(item => parseFloat(item.height || item.heightLeft || '0')),
        length: sortedHistory.map(item => parseFloat(item.length || '0')),
        bending: sortedHistory.map(item => parseFloat(item.bending || '0')),
        camber: sortedHistory.map(item => parseFloat(item.camber || '0')),
        twist: sortedHistory.map(item => parseFloat(item.twist || '0'))
      };
      return { ...g, trends };
    });
  }, [inspections, trendFilterProfile, trendFilterMonth]);

  const formatSpecValue = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    return String(val);
  };

  const selectProfile = (profile: CuttingProfileSpec) => {
    setHeaderInfo(prev => ({
      ...prev,
      profileName: profile.name,
      partNo: profile.partNo || '',
      widthName: profile.widthName || 'ความกว้าง (Width)',
      widthTarget: formatSpecValue(profile.widthTarget),
      widthTolPlus: formatSpecValue(profile.widthTolPlus),
      widthTolMinus: formatSpecValue(profile.widthTolMinus),
      widthIsSC: profile.widthIsSC ?? true,
      widthMicroType: profile.widthMicroType || 'Blade',
      widthOrder: profile.widthOrder ?? 1,
      heightName: profile.heightName || 'ความสูง (Height)',
      heightTarget: formatSpecValue(profile.heightTarget),
      heightTolPlus: formatSpecValue(profile.heightTolPlus),
      heightTolMinus: formatSpecValue(profile.heightTolMinus),
      heightIsSC: profile.heightIsSC ?? true,
      heightMicroType: profile.heightMicroType || 'Blade',
      heightOrder: profile.heightOrder ?? 2,
      lengthName: profile.lengthName || 'ความยาว (Length)',
      lengthTarget: formatSpecValue(profile.lengthTarget),
      lengthTolPlus: formatSpecValue(profile.lengthTolPlus),
      lengthTolMinus: formatSpecValue(profile.lengthTolMinus),
      lengthIsSC: profile.lengthIsSC ?? false,
      lengthMicroType: profile.lengthMicroType || 'None',
      lengthOrder: profile.lengthOrder ?? 3,
      bendingName: profile.bendingName || 'ความโก่ง (Bending)',
      bendingMax: formatSpecValue(profile.bendingMax),
      bendingIsSC: profile.bendingIsSC ?? false,
      bendingMicroType: profile.bendingMicroType || 'None',
      bendingOrder: profile.bendingOrder ?? 6,
      camberName: profile.camberName || 'ความคด (Camber)',
      camberMax: formatSpecValue(profile.camberMax),
      camberIsSC: profile.camberIsSC ?? false,
      camberMicroType: profile.camberMicroType || 'None',
      camberOrder: profile.camberOrder ?? 7,
      twistName: profile.twistName || 'ความบิด (Twist)',
      twistMax: formatSpecValue(profile.twistMax),
      twistIsSC: profile.twistIsSC ?? false,
      twistMicroType: profile.twistMicroType || 'None',
      twistOrder: profile.twistOrder ?? 8,
      customControlPoints: profile.customControlPoints ? JSON.parse(JSON.stringify(profile.customControlPoints)) : [],
      pointOrderList: profile.pointOrderList ? [...profile.pointOrderList] : []
    }));
    setProfileStatus('found');
  };

  useEffect(() => {
    if (headerInfo.profileName) {
      const match = savedProfiles.find(p => p.name.toLowerCase() === headerInfo.profileName.toLowerCase());
      if (match) {
        setHeaderInfo(prev => ({
          ...prev,
          partNo: match.partNo || '',
          widthName: match.widthName || prev.widthName || 'ความกว้าง (Width)',
          widthTarget: formatSpecValue(match.widthTarget),
          widthTolPlus: formatSpecValue(match.widthTolPlus),
          widthTolMinus: formatSpecValue(match.widthTolMinus),
          widthIsSC: match.widthIsSC ?? prev.widthIsSC ?? true,
          widthMicroType: match.widthMicroType || prev.widthMicroType || 'Blade',
          widthOrder: match.widthOrder ?? prev.widthOrder ?? 1,
          heightName: match.heightName || prev.heightName || 'ความสูง (Height)',
          heightTarget: formatSpecValue(match.heightTarget),
          heightTolPlus: formatSpecValue(match.heightTolPlus),
          heightTolMinus: formatSpecValue(match.heightTolMinus),
          heightIsSC: match.heightIsSC ?? prev.heightIsSC ?? true,
          heightMicroType: match.heightMicroType || prev.heightMicroType || 'Blade',
          heightOrder: match.heightOrder ?? prev.heightOrder ?? 2,
          lengthName: match.lengthName || prev.lengthName || 'ความยาว (Length)',
          lengthTarget: formatSpecValue(match.lengthTarget),
          lengthTolPlus: formatSpecValue(match.lengthTolPlus),
          lengthTolMinus: formatSpecValue(match.lengthTolMinus),
          lengthIsSC: match.lengthIsSC ?? prev.lengthIsSC ?? false,
          lengthMicroType: match.lengthMicroType || prev.lengthMicroType || 'None',
          lengthOrder: match.lengthOrder ?? prev.lengthOrder ?? 3,
          bendingName: match.bendingName || prev.bendingName || 'ความโก่ง (Bending)',
          bendingMax: formatSpecValue(match.bendingMax),
          bendingIsSC: match.bendingIsSC ?? prev.bendingIsSC ?? false,
          bendingMicroType: match.bendingMicroType || prev.bendingMicroType || 'None',
          bendingOrder: match.bendingOrder ?? prev.bendingOrder ?? 6,
          camberName: match.camberName || prev.camberName || 'ความคด (Camber)',
          camberMax: formatSpecValue(match.camberMax),
          camberIsSC: match.camberIsSC ?? prev.camberIsSC ?? false,
          camberMicroType: match.camberMicroType || prev.camberMicroType || 'None',
          camberOrder: match.camberOrder ?? prev.camberOrder ?? 7,
          twistName: match.twistName || prev.twistName || 'ความบิด (Twist)',
          twistMax: formatSpecValue(match.twistMax),
          twistIsSC: match.twistIsSC ?? prev.twistIsSC ?? false,
          twistMicroType: match.twistMicroType || prev.twistMicroType || 'None',
          twistOrder: match.twistOrder ?? prev.twistOrder ?? 8,
          customControlPoints: match.customControlPoints ? JSON.parse(JSON.stringify(match.customControlPoints)) : prev.customControlPoints,
          pointOrderList: match.pointOrderList ? [...match.pointOrderList] : prev.pointOrderList
        }));
        setProfileStatus('found');
      } else {
        setProfileStatus('not-found');
      }
    } else {
      setProfileStatus('not-found');
    }
  }, [headerInfo.profileName, savedProfiles]);

  const handleAddCustomPoint = () => {
    const newId = `cp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nextOrder = 4 + headerInfo.customControlPoints.length;
    const newPoint: CuttingCustomPointSpec = {
      id: newId,
      name: `จุดควบคุมที่ ${headerInfo.customControlPoints.length + 1}`,
      unit: 'mm',
      evalType: 'target_tol',
      target: '10.00',
      tolPlus: '0.20',
      tolMinus: '0.20',
      description: '',
      isSC: false,
      microType: 'Blade',
      order: nextOrder
    };
    setHeaderInfo(prev => ({
      ...prev,
      customControlPoints: [...prev.customControlPoints, newPoint],
      pointOrderList: prev.pointOrderList ? [...prev.pointOrderList, newId] : [newId]
    }));
    showNotification(isTh ? 'เพิ่มจุดควบคุมกำหนดเองใหม่แล้ว' : 'Added new custom control point');
  };

  const handleApplyCustomPointTemplate = (templateOrType: string | Partial<CuttingCustomPointSpec>) => {
    const newId = `cp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nextOrder = 4 + headerInfo.customControlPoints.length;
    let newPoint: CuttingCustomPointSpec;

    if (typeof templateOrType === 'object') {
      newPoint = {
        id: newId,
        name: templateOrType.name || 'จุดควบคุมพิเศษ',
        unit: templateOrType.unit || 'mm',
        evalType: templateOrType.evalType || 'target_tol',
        target: templateOrType.target || '',
        tolPlus: templateOrType.tolPlus || '',
        tolMinus: templateOrType.tolMinus || '',
        maxLimit: templateOrType.maxLimit || '',
        minLimit: templateOrType.minLimit || '',
        description: templateOrType.description || '',
        isSC: templateOrType.isSC ?? false,
        microType: templateOrType.microType || 'Blade',
        order: templateOrType.order ?? nextOrder
      };
    } else if (templateOrType === 'w2') {
      newPoint = { id: newId, name: 'ความกว้าง W2 (Side Width)', unit: 'mm', evalType: 'target_tol', target: '25.00', tolPlus: '0.20', tolMinus: '0.20', description: 'วัดความกว้างปีกข้างตำแหน่งที่ 2', isSC: true, microType: 'Blade', order: nextOrder };
    } else if (templateOrType === 'flange') {
      newPoint = { id: newId, name: 'ความหนาปีก (Flange Thickness)', unit: 'mm', evalType: 'min_max', minLimit: '3.80', maxLimit: '4.20', description: 'ความหนาปีกหน้าแปลน', isSC: true, microType: 'Rod', order: nextOrder };
    } else if (templateOrType === 'angle') {
      newPoint = { id: newId, name: 'มุมตัด (Cut Angle / Chamfer)', unit: 'deg', evalType: 'target_tol', target: '45.00', tolPlus: '1.00', tolMinus: '1.00', description: 'มุมเอียงหน้าตัดชิ้นงาน', isSC: false, microType: 'None', order: nextOrder };
    } else if (templateOrType === 'radius') {
      newPoint = { id: newId, name: 'รัศมีมุม R (Corner Radius)', unit: 'mm', evalType: 'max_only', maxLimit: '2.50', description: 'ความโค้งรัศมีมุมตัด', isSC: false, microType: 'None', order: nextOrder };
    } else if (templateOrType === 'pitch') {
      newPoint = { id: newId, name: 'ระยะ Pitch รูเจาะ (Hole Pitch)', unit: 'mm', evalType: 'target_tol', target: '50.00', tolPlus: '0.30', tolMinus: '0.30', description: 'ระยะกึ่งกลางระหว่างรู', isSC: false, microType: 'None', order: nextOrder };
    } else if (templateOrType === 'flatness') {
      newPoint = { id: newId, name: 'ความเรียบผิว (Surface Flatness)', unit: 'mm', evalType: 'max_only', maxLimit: '0.30', description: 'ความเรียบแนวระนาบ', isSC: false, microType: 'None', order: nextOrder };
    } else {
      newPoint = { id: newId, name: 'จุดควบคุมพิเศษ', unit: 'mm', evalType: 'target_tol', target: '10.00', tolPlus: '0.10', tolMinus: '0.10', description: '', isSC: false, microType: 'Blade', order: nextOrder };
    }

    setHeaderInfo(prev => ({
      ...prev,
      customControlPoints: [...prev.customControlPoints, newPoint],
      pointOrderList: prev.pointOrderList ? [...prev.pointOrderList, newId] : [newId]
    }));
    showNotification(isTh ? `เพิ่มจุดควบคุม "${newPoint.name}" สำเร็จ` : `Added ${newPoint.name}`);
  };

  const handleRemoveCustomPoint = (pointId: string) => {
    setHeaderInfo(prev => ({
      ...prev,
      customControlPoints: prev.customControlPoints.filter(p => p.id !== pointId),
      pointOrderList: prev.pointOrderList ? prev.pointOrderList.filter(id => id !== pointId) : []
    }));
  };

  const handleUpdateCustomPoint = (pointId: string, field: keyof CuttingCustomPointSpec, value: any) => {
    setHeaderInfo(prev => ({
      ...prev,
      customControlPoints: prev.customControlPoints.map(p => {
        if (p.id === pointId) {
          return { ...p, [field]: value };
        }
        return p;
      })
    }));
  };

  // Helper to check if a measurement value should be ignored (e.g. "-", "N/A", blank, etc.)
  const isIgnoredValue = (valStr?: string | number): boolean => {
    if (valStr === undefined || valStr === null) return true;
    const s = String(valStr).trim();
    return s === '' || s === '-' || s === '--' || s === '---' || s === 'N/A' || s === 'n/a' || s === 'none' || s === 'null' || s === 'undefined';
  };

  const getFieldStatus = (valStr?: string, targetStr?: string, tolPlusStr?: string, tolMinusStr?: string): 'neutral' | 'pass' | 'fail' => {
    if (isIgnoredValue(valStr)) return 'neutral';
    const s = String(valStr).trim();
    const v = parseFloat(s);
    if (isNaN(v)) return 'neutral';
    
    const t = parseFloat(targetStr || '0');
    const tp = parseFloat(tolPlusStr || '0');
    const tm = parseFloat(tolMinusStr || '0');
    if (targetStr !== undefined && targetStr.trim() !== '' && !isNaN(t)) {
      if (v > t + tp || v < t - tm) return 'fail';
      return 'pass';
    }
    return 'neutral';
  };

  const getLimitStatus = (valStr?: string, maxStr?: string): 'neutral' | 'pass' | 'fail' => {
    if (isIgnoredValue(valStr)) return 'neutral';
    const s = String(valStr).trim();
    const v = parseFloat(s);
    if (isNaN(v)) return 'neutral';
    
    const mx = parseFloat(maxStr || '0');
    if (maxStr !== undefined && maxStr.trim() !== '' && !isNaN(mx) && mx > 0) {
      if (v > mx) return 'fail';
      return 'pass';
    }
    return 'neutral';
  };

  const validateCustomPoint = (valStr: string | undefined, point: CuttingCustomPointSpec): 'Pass' | 'Fail' | 'Pending' => {
    if (isIgnoredValue(valStr)) return 'Pending';
    const s = String(valStr).trim();
    const v = parseFloat(s);
    if (isNaN(v)) return 'Pending';

    if (point.evalType === 'target_tol') {
      const t = parseFloat(point.target || '0');
      const tp = parseFloat(point.tolPlus || '0');
      const tm = parseFloat(point.tolMinus || '0');
      if (point.target !== undefined && point.target.trim() !== '' && !isNaN(t)) {
        if (v > t + tp || v < t - tm) return 'Fail';
        return 'Pass';
      }
    } else if (point.evalType === 'max_only') {
      const mx = parseFloat(point.maxLimit || '0');
      if (point.maxLimit !== undefined && point.maxLimit.trim() !== '' && !isNaN(mx)) {
        if (v > mx) return 'Fail';
        return 'Pass';
      }
    } else if (point.evalType === 'min_only') {
      const mn = parseFloat(point.minLimit || '0');
      if (point.minLimit !== undefined && point.minLimit.trim() !== '' && !isNaN(mn)) {
        if (v < mn) return 'Fail';
        return 'Pass';
      }
    } else if (point.evalType === 'min_max') {
      const mn = parseFloat(point.minLimit || '0');
      const mx = parseFloat(point.maxLimit || '0');
      if (point.minLimit !== undefined && point.minLimit.trim() !== '' && !isNaN(mn) && v < mn) return 'Fail';
      if (point.maxLimit !== undefined && point.maxLimit.trim() !== '' && !isNaN(mx) && v > mx) return 'Fail';
      return 'Pass';
    }
    return 'Pass';
  };

  const handleResetForm = () => {
    setHeaderInfo({
      inspectorName: '',
      shift: '',
      employeeName: '',
      process: 'CUT',
      machine: '',
      workOrder: '',
      coilNo: '',
      date: new Date().toISOString().split('T')[0],
      profileName: '',
      partNo: '',
      widthName: 'ความกว้าง (Width)',
      widthTarget: '', widthTolPlus: '', widthTolMinus: '',
      widthIsSC: false,
      widthMicroType: 'Blade',
      widthOrder: 1,
      heightName: 'ความสูง (Height)',
      heightTarget: '', heightTolPlus: '', heightTolMinus: '',
      heightIsSC: false,
      heightMicroType: 'Blade',
      heightOrder: 2,
      lengthName: 'ความยาว (Length)',
      lengthTarget: '', lengthTolPlus: '', lengthTolMinus: '',
      lengthIsSC: false,
      lengthMicroType: 'None',
      lengthOrder: 3,
      bendingName: 'ความโก่ง (Bending)',
      bendingMax: '',
      bendingIsSC: false,
      bendingMicroType: 'None',
      bendingOrder: 6,
      camberName: 'ความคด (Camber)',
      camberMax: '',
      camberIsSC: false,
      camberMicroType: 'None',
      camberOrder: 7,
      twistName: 'ความบิด (Twist)',
      twistMax: '',
      twistIsSC: false,
      twistMicroType: 'None',
      twistOrder: 8,
      customControlPoints: [],
      pointOrderList: []
    });
    setProfileStatus('not-found');
    setBatchItems([
      {
        id: Date.now(),
        sampleName: 'Sample 1',
        width: '',
        height: '',
        length: '',
        bending: '',
        camber: '',
        twist: '',
        customPointValues: {},
        status: 'Pending' as 'Pass' | 'Fail' | 'Pending',
        remarks: ''
      }
    ]);
    showNotification(isTh ? 'ล้างข้อมูลฟอร์มเรียบร้อยแล้ว' : 'Form reset successfully');
  };

  const handleSaveProfile = () => {
    if (!headerInfo.profileName.trim()) {
      showNotification(isTh ? 'กรุณาระบุชื่อ Profile ก่อนบันทึก' : 'Please specify Profile Name', 'error');
      return;
    }

    const newProfile: CuttingProfileSpec = {
      name: headerInfo.profileName.trim(),
      partNo: headerInfo.partNo,
      widthName: headerInfo.widthName || 'ความกว้าง (Width)',
      widthTarget: headerInfo.widthTarget,
      widthTolPlus: headerInfo.widthTolPlus,
      widthTolMinus: headerInfo.widthTolMinus,
      widthIsSC: headerInfo.widthIsSC,
      widthMicroType: headerInfo.widthMicroType,
      widthOrder: headerInfo.widthOrder,
      heightName: headerInfo.heightName || 'ความสูง (Height)',
      heightTarget: headerInfo.heightTarget,
      heightTolPlus: headerInfo.heightTolPlus,
      heightTolMinus: headerInfo.heightTolMinus,
      heightIsSC: headerInfo.heightIsSC,
      heightMicroType: headerInfo.heightMicroType,
      heightOrder: headerInfo.heightOrder,
      lengthName: headerInfo.lengthName || 'ความยาว (Length)',
      lengthTarget: headerInfo.lengthTarget,
      lengthTolPlus: headerInfo.lengthTolPlus,
      lengthTolMinus: headerInfo.lengthTolMinus,
      lengthIsSC: headerInfo.lengthIsSC,
      lengthMicroType: headerInfo.lengthMicroType,
      lengthOrder: headerInfo.lengthOrder,
      bendingName: headerInfo.bendingName || 'ความโก่ง (Bending)',
      bendingMax: headerInfo.bendingMax,
      bendingIsSC: headerInfo.bendingIsSC,
      bendingMicroType: headerInfo.bendingMicroType,
      bendingOrder: headerInfo.bendingOrder,
      camberName: headerInfo.camberName || 'ความคด (Camber)',
      camberMax: headerInfo.camberMax,
      camberIsSC: headerInfo.camberIsSC,
      camberMicroType: headerInfo.camberMicroType,
      camberOrder: headerInfo.camberOrder,
      twistName: headerInfo.twistName || 'ความบิด (Twist)',
      twistMax: headerInfo.twistMax,
      twistIsSC: headerInfo.twistIsSC,
      twistMicroType: headerInfo.twistMicroType,
      twistOrder: headerInfo.twistOrder,
      customControlPoints: headerInfo.customControlPoints,
      pointOrderList: headerInfo.pointOrderList || orderedActivePoints.map(p => p.id)
    };

    setSavedProfiles(prev => {
      const idx = prev.findIndex(p => p.name.toLowerCase() === newProfile.name.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newProfile;
        return copy;
      }
      return [...prev, newProfile];
    });

    showNotification(isTh ? `บันทึก Profile "${newProfile.name}" พร้อม ${headerInfo.customControlPoints.length} จุดควบคุมเรียบร้อยแล้ว` : `Saved Profile "${newProfile.name}" with ${headerInfo.customControlPoints.length} custom points`);
  };

  const handleDeleteProfile = (profileName: string) => {
    setSavedProfiles(prev => prev.filter(p => p.name !== profileName));
    if (headerInfo.profileName === profileName) {
      setHeaderInfo(prev => ({ ...prev, profileName: '', customControlPoints: [] }));
      setProfileStatus('not-found');
    }
    showNotification(isTh ? `ลบ Profile สำเร็จ` : `Deleted profile`);
    setDeleteConfirm(null);
  };

  const handleDeleteHistoryItem = (docId: string) => {
    setInspections(prev => prev.filter(i => i.id !== docId));
    showNotification(isTh ? 'ลบรายการประวัติสำเร็จ' : 'Deleted history item');
    setDeleteConfirm(null);
  };

  // Determine active measurement points defined in profile spec
  // If no profile is selected, display all standard fields for manual entry
  // When a profile is loaded, strictly display only points specified with targets/limits in profile spec
  const hasProfile = Boolean(headerInfo.profileName);
  const showWidth = !hasProfile || Boolean(headerInfo.widthTarget && headerInfo.widthTarget.trim() !== '');
  const showHeight = !hasProfile || Boolean(headerInfo.heightTarget && headerInfo.heightTarget.trim() !== '');
  const showLength = !hasProfile || Boolean(headerInfo.lengthTarget && headerInfo.lengthTarget.trim() !== '');
  const showBending = !hasProfile || Boolean(headerInfo.bendingMax && headerInfo.bendingMax.trim() !== '');
  const showCamber = !hasProfile || Boolean(headerInfo.camberMax && headerInfo.camberMax.trim() !== '');
  const showTwist = !hasProfile || Boolean(headerInfo.twistMax && headerInfo.twistMax.trim() !== '');
  const activeCustomPoints = headerInfo.customControlPoints || [];

  // Active points computation: Standard + Custom sorted by order
  const orderedActivePoints: ActiveCuttingPoint[] = useMemo(() => {
    const list: ActiveCuttingPoint[] = [];

    if (showWidth) {
      list.push({
        id: 'width',
        name: headerInfo.widthName || 'ความกว้าง (Width)',
        key: 'width',
        isStandard: true,
        isSC: headerInfo.widthIsSC ?? true,
        microType: headerInfo.widthMicroType || 'Blade',
        order: headerInfo.widthOrder ?? 1,
        unit: 'mm',
        evalType: 'target_tol',
        target: headerInfo.widthTarget,
        tolPlus: headerInfo.widthTolPlus,
        tolMinus: headerInfo.widthTolMinus,
        specText: headerInfo.widthTarget ? `${headerInfo.widthTarget} (+${headerInfo.widthTolPlus || '0'}/-${headerInfo.widthTolMinus || '0'})` : '-'
      });
    }

    if (showHeight) {
      list.push({
        id: 'height',
        name: headerInfo.heightName || 'ความสูง (Height)',
        key: 'height',
        isStandard: true,
        isSC: headerInfo.heightIsSC ?? true,
        microType: headerInfo.heightMicroType || 'Blade',
        order: headerInfo.heightOrder ?? 2,
        unit: 'mm',
        evalType: 'target_tol',
        target: headerInfo.heightTarget,
        tolPlus: headerInfo.heightTolPlus,
        tolMinus: headerInfo.heightTolMinus,
        specText: headerInfo.heightTarget ? `${headerInfo.heightTarget} (+${headerInfo.heightTolPlus || '0'}/-${headerInfo.heightTolMinus || '0'})` : '-'
      });
    }

    if (showLength) {
      list.push({
        id: 'length',
        name: headerInfo.lengthName || 'ความยาว (Length)',
        key: 'length',
        isStandard: true,
        isSC: headerInfo.lengthIsSC ?? false,
        microType: headerInfo.lengthMicroType || 'None',
        order: headerInfo.lengthOrder ?? 3,
        unit: 'mm',
        evalType: 'target_tol',
        target: headerInfo.lengthTarget,
        tolPlus: headerInfo.lengthTolPlus,
        tolMinus: headerInfo.lengthTolMinus,
        specText: headerInfo.lengthTarget ? `${headerInfo.lengthTarget} (+${headerInfo.lengthTolPlus || '0'}/-${headerInfo.lengthTolMinus || '0'})` : '-'
      });
    }

    // Custom points
    activeCustomPoints.forEach((cp, idx) => {
      let specStr = '-';
      if (cp.evalType === 'target_tol' && cp.target) {
        specStr = `${cp.target} (+${cp.tolPlus || '0'}/-${cp.tolMinus || '0'})`;
      } else if (cp.evalType === 'min_max') {
        specStr = `${cp.minLimit || '-'} - ${cp.maxLimit || '-'}`;
      } else if (cp.evalType === 'max_only') {
        specStr = `≤ ${cp.maxLimit}`;
      } else if (cp.evalType === 'min_only') {
        specStr = `≥ ${cp.minLimit}`;
      }

      list.push({
        id: cp.id,
        name: cp.name,
        isStandard: false,
        isSC: cp.isSC ?? false,
        microType: cp.microType || 'Blade',
        order: cp.order ?? (4 + idx),
        unit: cp.unit,
        evalType: cp.evalType,
        target: cp.target,
        tolPlus: cp.tolPlus,
        tolMinus: cp.tolMinus,
        maxLimit: cp.maxLimit,
        minLimit: cp.minLimit,
        specText: specStr,
        description: cp.description
      });
    });

    if (showBending) {
      list.push({
        id: 'bending',
        name: headerInfo.bendingName || 'ความโก่ง (Bending)',
        key: 'bending',
        isStandard: true,
        isSC: headerInfo.bendingIsSC ?? false,
        microType: headerInfo.bendingMicroType || 'None',
        order: headerInfo.bendingOrder ?? 100,
        unit: 'mm/m',
        evalType: 'max_only',
        maxLimit: headerInfo.bendingMax,
        specText: headerInfo.bendingMax ? `≤ ${headerInfo.bendingMax}` : '-'
      });
    }

    if (showCamber) {
      list.push({
        id: 'camber',
        name: headerInfo.camberName || 'ความคด (Camber)',
        key: 'camber',
        isStandard: true,
        isSC: headerInfo.camberIsSC ?? false,
        microType: headerInfo.camberMicroType || 'None',
        order: headerInfo.camberOrder ?? 101,
        unit: 'mm/m',
        evalType: 'max_only',
        maxLimit: headerInfo.camberMax,
        specText: headerInfo.camberMax ? `≤ ${headerInfo.camberMax}` : '-'
      });
    }

    if (showTwist) {
      list.push({
        id: 'twist',
        name: headerInfo.twistName || 'ความบิด (Twist)',
        key: 'twist',
        isStandard: true,
        isSC: headerInfo.twistIsSC ?? false,
        microType: headerInfo.twistMicroType || 'None',
        order: headerInfo.twistOrder ?? 102,
        unit: 'deg/m',
        evalType: 'max_only',
        maxLimit: headerInfo.twistMax,
        specText: headerInfo.twistMax ? `≤ ${headerInfo.twistMax}` : '-'
      });
    }

    // Sort by order ascending
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [
    showWidth, showHeight, showLength, showBending, showCamber, showTwist,
    headerInfo.widthName, headerInfo.widthTarget, headerInfo.widthTolPlus, headerInfo.widthTolMinus, headerInfo.widthIsSC, headerInfo.widthMicroType, headerInfo.widthOrder,
    headerInfo.heightName, headerInfo.heightTarget, headerInfo.heightTolPlus, headerInfo.heightTolMinus, headerInfo.heightIsSC, headerInfo.heightMicroType, headerInfo.heightOrder,
    headerInfo.lengthName, headerInfo.lengthTarget, headerInfo.lengthTolPlus, headerInfo.lengthTolMinus, headerInfo.lengthIsSC, headerInfo.lengthMicroType, headerInfo.lengthOrder,
    headerInfo.bendingName, headerInfo.bendingMax, headerInfo.bendingIsSC, headerInfo.bendingMicroType, headerInfo.bendingOrder,
    headerInfo.camberName, headerInfo.camberMax, headerInfo.camberIsSC, headerInfo.camberMicroType, headerInfo.camberOrder,
    headerInfo.twistName, headerInfo.twistMax, headerInfo.twistIsSC, headerInfo.twistMicroType, headerInfo.twistOrder,
    activeCustomPoints
  ]);

  // Helpers to adjust order, SC status, and MicroType across standard and custom points
  const applyPointOrderUpdate = (pointId: string, newOrder: number) => {
    setHeaderInfo(prev => {
      if (pointId === 'width') return { ...prev, widthOrder: newOrder };
      if (pointId === 'height') return { ...prev, heightOrder: newOrder };
      if (pointId === 'length') return { ...prev, lengthOrder: newOrder };
      if (pointId === 'bending') return { ...prev, bendingOrder: newOrder };
      if (pointId === 'camber') return { ...prev, camberOrder: newOrder };
      if (pointId === 'twist') return { ...prev, twistOrder: newOrder };
      return {
        ...prev,
        customControlPoints: prev.customControlPoints.map(cp => cp.id === pointId ? { ...cp, order: newOrder } : cp)
      };
    });
  };

  const handleMovePoint = (pointId: string, direction: 'up' | 'down') => {
    const currentList = [...orderedActivePoints];
    const currentIndex = currentList.findIndex(p => p.id === pointId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const currentPoint = currentList[currentIndex];
    const targetPoint = currentList[targetIndex];

    const currentOrder = currentPoint.order ?? (currentIndex + 1);
    const targetOrder = targetPoint.order ?? (targetIndex + 1);

    const newCurrentOrder = targetOrder;
    const newTargetOrder = currentOrder === targetOrder ? (direction === 'up' ? currentOrder + 1 : currentOrder - 1) : currentOrder;

    applyPointOrderUpdate(currentPoint.id, newCurrentOrder);
    applyPointOrderUpdate(targetPoint.id, newTargetOrder);
  };

  const handleTogglePointSC = (pointId: string) => {
    setHeaderInfo(prev => {
      if (pointId === 'width') return { ...prev, widthIsSC: !prev.widthIsSC };
      if (pointId === 'height') return { ...prev, heightIsSC: !prev.heightIsSC };
      if (pointId === 'length') return { ...prev, lengthIsSC: !prev.lengthIsSC };
      if (pointId === 'bending') return { ...prev, bendingIsSC: !prev.bendingIsSC };
      if (pointId === 'camber') return { ...prev, camberIsSC: !prev.camberIsSC };
      if (pointId === 'twist') return { ...prev, twistIsSC: !prev.twistIsSC };
      return {
        ...prev,
        customControlPoints: prev.customControlPoints.map(cp => cp.id === pointId ? { ...cp, isSC: !cp.isSC } : cp)
      };
    });
  };

  const handleSetPointMicroType = (pointId: string, microType: MicroType) => {
    setHeaderInfo(prev => {
      if (pointId === 'width') return { ...prev, widthMicroType: microType };
      if (pointId === 'height') return { ...prev, heightMicroType: microType };
      if (pointId === 'length') return { ...prev, lengthMicroType: microType };
      if (pointId === 'bending') return { ...prev, bendingMicroType: microType };
      if (pointId === 'camber') return { ...prev, camberMicroType: microType };
      if (pointId === 'twist') return { ...prev, twistMicroType: microType };
      return {
        ...prev,
        customControlPoints: prev.customControlPoints.map(cp => cp.id === pointId ? { ...cp, microType } : cp)
      };
    });
  };

  const handleSetPointOrderDirect = (pointId: string, orderVal: number) => {
    applyPointOrderUpdate(pointId, orderVal);
  };

  const judgeStatus = (item: typeof batchItems[0]): 'Pass' | 'Fail' | 'Pending' => {
    let hasFailed = false;
    let numericEvaluatedCount = 0;

    const checkTargetTol = (valStr?: string, targetStr?: string, tolPlusStr?: string, tolMinusStr?: string) => {
      if (isIgnoredValue(valStr)) return;
      const s = String(valStr).trim();
      const v = parseFloat(s);
      if (isNaN(v)) return;

      const t = parseFloat(targetStr || '0');
      const tp = parseFloat(tolPlusStr || '0');
      const tm = parseFloat(tolMinusStr || '0');
      if (targetStr !== undefined && targetStr.trim() !== '' && !isNaN(t)) {
        numericEvaluatedCount++;
        if (v > t + tp || v < t - tm) {
          hasFailed = true;
        }
      }
    };

    const checkMaxLimit = (valStr?: string, maxStr?: string) => {
      if (isIgnoredValue(valStr)) return;
      const s = String(valStr).trim();
      const v = parseFloat(s);
      if (isNaN(v)) return;

      const mx = parseFloat(maxStr || '0');
      if (maxStr !== undefined && maxStr.trim() !== '' && !isNaN(mx) && mx > 0) {
        numericEvaluatedCount++;
        if (v > mx) {
          hasFailed = true;
        }
      }
    };

    if (showWidth) checkTargetTol(item.width, headerInfo.widthTarget, headerInfo.widthTolPlus, headerInfo.widthTolMinus);
    if (showHeight) checkTargetTol(item.height, headerInfo.heightTarget, headerInfo.heightTolPlus, headerInfo.heightTolMinus);
    if (showLength) checkTargetTol(item.length, headerInfo.lengthTarget, headerInfo.lengthTolPlus, headerInfo.lengthTolMinus);

    if (showBending) checkMaxLimit(item.bending, headerInfo.bendingMax);
    if (showCamber) checkMaxLimit(item.camber, headerInfo.camberMax);
    if (showTwist) checkMaxLimit(item.twist, headerInfo.twistMax);

    // Validate Custom Control Points
    if (activeCustomPoints.length > 0) {
      for (const point of activeCustomPoints) {
        const val = item.customPointValues?.[point.id];
        if (!isIgnoredValue(val)) {
          const res = validateCustomPoint(val, point);
          if (res === 'Fail') {
            hasFailed = true;
            numericEvaluatedCount++;
          } else if (res === 'Pass') {
            numericEvaluatedCount++;
          }
        }
      }
    }

    if (numericEvaluatedCount === 0) return 'Pending';

    return hasFailed ? 'Fail' : 'Pass';
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addRow = () => {
    const nextNum = batchItems.length + 1;
    // Pre-populate custom point values if target exists
    const initialCustomVals: Record<string, string> = {};
    headerInfo.customControlPoints.forEach(cp => {
      if (cp.evalType === 'target_tol' && cp.target) {
        initialCustomVals[cp.id] = cp.target;
      } else {
        initialCustomVals[cp.id] = '';
      }
    });

    setBatchItems(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        sampleName: `Sample ${nextNum}`,
        width: showWidth ? (headerInfo.widthTarget || '') : '',
        height: showHeight ? (headerInfo.heightTarget || '') : '',
        length: showLength ? (headerInfo.lengthTarget || '') : '',
        bending: '',
        camber: '',
        twist: '',
        customPointValues: initialCustomVals,
        status: 'Pending' as 'Pass' | 'Fail' | 'Pending',
        remarks: ''
      }
    ]);
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHeaderInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id: number, field: string, value: string) => {
    setBatchItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleCustomPointValueChange = (itemId: number, pointId: string, value: string) => {
    setBatchItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          customPointValues: {
            ...(item.customPointValues || {}),
            [pointId]: value
          }
        };
      }
      return item;
    }));
  };

  const saveBatch = () => {
    const validItems = batchItems.filter(item => {
      const hasCustom = Object.values(item.customPointValues || {}).some(v => v && String(v).trim() !== '');
      return (item.sampleName || item.width || item.height || item.length || hasCustom) && judgeStatus(item) !== 'Pending';
    });

    if (validItems.length === 0) {
      showNotification(isTh ? 'กรุณากรอกข้อมูลให้ครบถ้วนอย่างน้อย 1 รายการ' : 'Please enter inspection data', 'error');
      return;
    }

    const now = new Date();
    const newRecords: CuttingInspectionRecord[] = validItems.map(item => {
      const decision = judgeStatus(item);
      const recId = `rec-cut-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      const rec: CuttingInspectionRecord = {
        id: recId,
        lotNumber: headerInfo.coilNo.trim().toUpperCase() || 'COIL-UNTITLED',
        partId: headerInfo.partNo.trim().toUpperCase() || 'PART-UNTITLED',
        sampleName: item.sampleName,
        workOrder: headerInfo.workOrder,
        width: item.width,
        height: item.height,
        length: item.length,
        bending: item.bending,
        camber: item.camber,
        twist: item.twist,
        customPointValues: { ...(item.customPointValues || {}) },
        status: decision,
        remarks: item.remarks,
        profileName: headerInfo.profileName,
        inspectorName: headerInfo.inspectorName || 'Cutting Inspector',
        shift: headerInfo.shift || '',
        employeeName: headerInfo.employeeName || '-',
        machine: headerInfo.machine || 'CUT-LINE-01',
        date: headerInfo.date,
        timestamp: now.toLocaleString('th-TH')
      };

      if (onLogNewActivity) {
        const isPass = decision === 'Pass';
        const customPointsSummary = headerInfo.customControlPoints.map(cp => {
          const val = item.customPointValues?.[cp.id];
          return `${cp.name}: ${val || '-'}${cp.unit}`;
        }).join(', ');

        const resText = isPass 
          ? `PASS (Standard & ${headerInfo.customControlPoints.length} Custom Points within tolerances)` 
          : `FAIL / Out of Spec: W:${item.width || '-'}mm, H:${item.height || '-'}mm, L:${item.length || '-'}mm, Bending:${item.bending || '-'}mm ${customPointsSummary ? `[${customPointsSummary}]` : ''}`;

        onLogNewActivity({
          id: recId,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'IPQA-05',
          moduleTitleTh: 'ตรวจสอบขนาดตัดชิ้นงาน (Cutting Dimension & Dynamic Profile Points)',
          moduleTitleEn: 'Cutting Dimension & Dynamic Profile Points Inspection',
          inspector: headerInfo.inspectorName || 'Cutting Inspector',
          shift: headerInfo.shift || '',
          batchLot: `Coil: ${headerInfo.coilNo || '-'} (Profile: ${headerInfo.profileName})`,
          result: isPass ? 'PASS' : 'REJECT',
          defectCount: isPass ? 0 : 1,
          remarks: resText,
          coilNo: headerInfo.coilNo || 'COIL-N/A',
          profile: `${headerInfo.profileName} (${headerInfo.partNo || 'Part'})`,
          process: `IPQA-05 Cutting Dimension (${headerInfo.machine || 'Line'})`,
          inspectionDate: now.toLocaleString('sv-SE').slice(0, 16),
          inspectionResult: resText
        });
      }

      return rec;
    });

    setInspections(prev => [...newRecords, ...prev]);
    showNotification(isTh ? `บันทึกข้อมูล ${validItems.length} รายการเรียบร้อยแล้ว` : `Saved ${validItems.length} inspection items`);

    setBatchItems([
      {
        id: Date.now(),
        sampleName: 'Sample 1',
        width: '',
        height: '',
        length: '',
        bending: '',
        camber: '',
        twist: '',
        customPointValues: {},
        status: 'Pending' as 'Pass' | 'Fail' | 'Pending',
        remarks: ''
      }
    ]);

    setActiveTab('history');
  };

  const exportToExcel = () => {
    if (inspections.length === 0) {
      showNotification(isTh ? 'ไม่มีข้อมูลสำหรับ Export' : 'No history to export', 'error');
      return;
    }

    // Collect all unique custom control point ids & names across saved profiles & inspections
    const allCustomPointMap: Record<string, string> = {};
    savedProfiles.forEach(p => {
      p.customControlPoints?.forEach(cp => {
        allCustomPointMap[cp.id] = `${cp.name} (${cp.unit || 'mm'})`;
      });
    });
    inspections.forEach(ins => {
      if (ins.customPointValues) {
        Object.keys(ins.customPointValues).forEach(k => {
          if (!allCustomPointMap[k]) {
            allCustomPointMap[k] = `Point ${k}`;
          }
        });
      }
    });

    const customPointKeys = Object.keys(allCustomPointMap);

    const baseHeaders = [
      'Timestamp', 'Inspector', 'Employee', 'Machine', 'Work Order', 'Coil No', 'Profile Name', 'Part No', 'Sample Name', 
      'Width (mm)', 'Height (mm)', 'Length (mm)', 'Bending (mm/m)', 'Camber (mm/m)', 'Twist (deg/m)'
    ];

    const customHeaders = customPointKeys.map(k => `"${allCustomPointMap[k]}"`);
    const finalHeaders = [...baseHeaders, ...customHeaders, 'Status', 'Remarks'];

    const csvRows = inspections.map(ins => {
      const baseValues = [
        `"${ins.timestamp}"`,
        `"${ins.inspectorName}"`,
        `"${ins.employeeName || '-'}"`,
        `"${ins.machine || '-'}"`,
        `"${ins.workOrder || '-'}"`,
        `"${ins.lotNumber}"`,
        `"${ins.profileName}"`,
        `"${ins.partId}"`,
        `"${ins.sampleName || '-'}"`,
        ins.width || '-', ins.height || ins.heightLeft || '-', ins.length || '-',
        ins.bending || '-', ins.camber || '-', ins.twist || '-'
      ];

      const customValues = customPointKeys.map(k => {
        const val = ins.customPointValues?.[k];
        return val ? `"${val}"` : `"-"`;
      });

      return [...baseValues, ...customValues, `"${ins.status}"`, `"${ins.remarks || '-'}"`];
    });

    const csvContent = [finalHeaders.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cutting_Inspection_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(isTh ? 'ส่งออกไฟล์ CSV เรียบร้อยแล้ว' : 'Exported CSV successfully');
  };

  const filteredInspections = useMemo(() => {
    if (!historySearchTerm) return inspections;
    const term = historySearchTerm.toLowerCase();
    return inspections.filter(i => 
      i.lotNumber.toLowerCase().includes(term) ||
      i.profileName.toLowerCase().includes(term) ||
      i.inspectorName.toLowerCase().includes(term) ||
      (i.workOrder && i.workOrder.toLowerCase().includes(term)) ||
      (i.partId && i.partId.toLowerCase().includes(term))
    );
  }, [inspections, historySearchTerm]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-4 sm:p-6 space-y-6">

      {/* Admin Security Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Admin Verification</h3>
              <p className="text-xs text-slate-400">
                {isTh ? 'กรุณาระบุรหัสผ่านเพื่อตั้งค่า Profile Spec' : 'Enter admin password to manage profile specifications'}
              </p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                {adminAuthError && (
                  <p className="text-rose-400 text-xs font-semibold text-center mt-2">
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่' : 'Incorrect password. Please try again.'}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-800 space-y-4">
             <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7" />
             </div>
             <div className="text-center">
               <h3 className="text-lg font-bold text-white">{isTh ? 'ยืนยันการลบข้อมูล?' : 'Confirm Deletion'}</h3>
               <p className="text-xs text-slate-400 mt-1">{isTh ? 'คุณต้องการลบ' : 'Delete'} <b>{deleteConfirm.label}</b> {isTh ? 'ใช่หรือไม่?' : 'permanently?'}</p>
             </div>
             <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'profile') handleDeleteProfile(deleteConfirm.id);
                    if (deleteConfirm.type === 'history') handleDeleteHistoryItem(deleteConfirm.id);
                  }} 
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/20 transition"
                >
                  {isTh ? 'ยืนยันลบ' : 'Delete'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Return to QA Portal"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <Ruler className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  IPQA-05
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {isTh ? 'การตรวจวัดขนาดจากการตัด (Cutting Dimension Measurement)' : 'Cutting Dimension System'}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTh 
                  ? 'บันทึกและตรวจสอบขนาดการตัด (Width, Height, Length, Bending, Camber, Twist) พร้อมเปรียบเทียบ Spec อัตโนมัติ' 
                  : 'Cutting dimension inspection system for Width, Height, Length, Bending, Camber & Twist'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cloud Sync Active</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('new-batch')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'new-batch'
              ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isTh ? '➕ บันทึกกลุ่มงาน' : 'Data Entry'}</span>
        </button>

        <button
          onClick={handleAdminAccess}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{isTh ? '⚙️ Profile Spec' : 'Profile Spec'}</span>
          {isAdminAuthenticated && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{isTh ? '📊 Dashboard' : 'Dashboard'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{isTh ? '📜 ประวัติ' : 'History'}</span>
          {inspections.length > 0 && (
            <span className="ml-1 bg-slate-950 text-indigo-300 px-2 py-0.5 rounded-full text-[10px] font-mono border border-indigo-800">
              {inspections.length}
            </span>
          )}
        </button>
      </div>

      {/* Notifications Banner */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 shadow-lg border text-xs font-bold animate-in fade-in ${
          notification.type === 'error' ? 'bg-rose-950/80 border-rose-800 text-rose-300' : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TAB 1: NEW BATCH DATA ENTRY */}
      {activeTab === 'new-batch' && (
        <div className="space-y-6">
          {/* Header Metadata Form */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Ruler className="w-4 h-4 text-indigo-400" />
                {isTh ? '1. ข้อมูลการตรวจสอบหลัก (Header Metadata)' : '1. Header Metadata'}
              </h3>

              <div className="flex items-center gap-2">
                {profileStatus === 'found' ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SPEC LOADED: {headerInfo.profileName}</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isTh ? 'ไม่พบ Spec ของ Profile นี้' : 'Profile Spec Not Found'}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Profile Name *
                </label>
                <select
                  value={headerInfo.profileName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      handleResetForm();
                      return;
                    }
                    const selected = savedProfiles.find(p => p.name === val);
                    if (selected) selectProfile(selected);
                  }}
                  className="w-full bg-slate-950 border border-indigo-900/80 text-indigo-300 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-400 uppercase"
                >
                  <option value="">-- {isTh ? 'เลือก Profile' : 'Select Profile'} --</option>
                  {savedProfiles.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Part No.
                </label>
                <input
                  type="text"
                  name="partNo"
                  value={headerInfo.partNo}
                  onChange={handleHeaderChange}
                  placeholder={isTh ? 'เช่น PART-100-A' : 'Part No.'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Work Order
                </label>
                <input
                  type="text"
                  name="workOrder"
                  value={headerInfo.workOrder}
                  onChange={handleHeaderChange}
                  placeholder={isTh ? 'เช่น WO-2026-8801' : 'Work Order'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Coil No. / Lot No.
                </label>
                <input
                  type="text"
                  name="coilNo"
                  value={headerInfo.coilNo}
                  onChange={handleHeaderChange}
                  placeholder={isTh ? 'เช่น COIL-2026-X103' : 'Coil No. / Lot'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Inspector Name
                </label>
                <input
                  type="text"
                  name="inspectorName"
                  value={headerInfo.inspectorName}
                  onChange={handleHeaderChange}
                  placeholder={isTh ? 'ชื่อผู้ตรวจสอบ' : 'Inspector name'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Shift (กะ)
                </label>
                <input
                  list="cutting-shift-options"
                  type="text"
                  name="shift"
                  value={headerInfo.shift}
                  onChange={handleHeaderChange}
                  placeholder="e.g. Day / Night / Shift A..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
                <datalist id="cutting-shift-options">
                  <option value="Day (กะกลางวัน / A)" />
                  <option value="Night (กะกลางคืน / B)" />
                  <option value="Shift A" />
                  <option value="Shift B" />
                  <option value="Shift C" />
                </datalist>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Operator Employee
                </label>
                <input
                  type="text"
                  name="employeeName"
                  value={headerInfo.employeeName}
                  onChange={handleHeaderChange}
                  placeholder={isTh ? 'ชื่อพนักงานผู้ตัด' : 'Operator name'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <ProcessSelector
                id="cutting-header-process"
                label={isTh ? 'Process (กระบวนการ)' : 'Process'}
                value={headerInfo.process || 'CUT'}
                onChange={(proc) => setHeaderInfo(prev => ({ ...prev, process: proc }))}
              />

              <MachineSelector
                id="cutting-header-machine"
                label={isTh ? 'Machine No. (เครื่องจักร)' : 'Machine No.'}
                value={headerInfo.machine}
                onChange={(mac) => setHeaderInfo(prev => ({ ...prev, machine: mac }))}
              />

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Inspection Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={headerInfo.date}
                  onChange={handleHeaderChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Loaded Target Limits Quick Bar */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-slate-300">
                {showWidth && <div><span className="text-slate-500">{headerInfo.widthName || 'Width'}:</span> <strong className="text-indigo-300">{headerInfo.widthTarget ? `${headerInfo.widthTarget} (+${headerInfo.widthTolPlus}/-${headerInfo.widthTolMinus}) mm` : '-'}</strong></div>}
                {showHeight && <div><span className="text-slate-500">{headerInfo.heightName || 'Height'}:</span> <strong className="text-indigo-300">{headerInfo.heightTarget ? `${headerInfo.heightTarget} (+${headerInfo.heightTolPlus}/-${headerInfo.heightTolMinus}) mm` : '-'}</strong></div>}
                {showLength && <div><span className="text-slate-500">{headerInfo.lengthName || 'Length'}:</span> <strong className="text-indigo-300">{headerInfo.lengthTarget ? `${headerInfo.lengthTarget} (+${headerInfo.lengthTolPlus}/-${headerInfo.lengthTolMinus}) mm` : '-'}</strong></div>}
                {showBending && <div><span className="text-slate-500">{headerInfo.bendingName || 'Bending'}:</span> <strong className="text-amber-300">{headerInfo.bendingMax ? `≤ ${headerInfo.bendingMax} mm/m` : '-'}</strong></div>}
                {showCamber && <div><span className="text-slate-500">{headerInfo.camberName || 'Camber'}:</span> <strong className="text-amber-300">{headerInfo.camberMax ? `≤ ${headerInfo.camberMax} mm/m` : '-'}</strong></div>}
                {showTwist && <div><span className="text-slate-500">{headerInfo.twistName || 'Twist'}:</span> <strong className="text-amber-300">{headerInfo.twistMax ? `≤ ${headerInfo.twistMax} deg/m` : '-'}</strong></div>}
                <div><span className="text-slate-500">Part No:</span> <strong className="text-purple-300">{headerInfo.partNo || '-'}</strong></div>
              </div>

              {/* Dynamic Custom Control Points Bar */}
              {headerInfo.customControlPoints && headerInfo.customControlPoints.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{isTh ? 'จุดควบคุมพิเศษประจำ Profile:' : 'Custom Profile Points:'}</span>
                  </div>
                  {headerInfo.customControlPoints.map((cp, cIdx) => (
                    <span 
                      key={cp.id || cIdx} 
                      className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-[11px] font-mono flex items-center gap-1.5"
                    >
                      <span className="font-sans font-bold text-slate-300">{cp.name}:</span>
                      <strong className="text-cyan-200">
                        {cp.evalType === 'target_tol' && `${cp.target} (+${cp.tolPlus}/-${cp.tolMinus}) ${cp.unit}`}
                        {cp.evalType === 'max_only' && `≤ ${cp.maxLimit} ${cp.unit}`}
                        {cp.evalType === 'min_only' && `≥ ${cp.minLimit} ${cp.unit}`}
                        {cp.evalType === 'min_max' && `${cp.minLimit} - ${cp.maxLimit} ${cp.unit}`}
                      </strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cutting Measurement Entry Table */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md overflow-hidden" ref={tableRef}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                {isTh ? '2. ตารางบันทึกค่าขนาดจากการตัด (Cutting Measurement Entry Table)' : '2. Cutting Dimension Table'}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  title={isTh ? 'ล้างฟอร์มทั้งหมด' : 'Reset Form'}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isTh ? 'ล้างฟอร์ม' : 'Reset'}</span>
                </button>

                <button
                  onClick={addRow}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>{isTh ? '+ เพิ่มรายการ' : 'Add Row'}</span>
                </button>

                <button
                  onClick={saveBatch}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{isTh ? '💾 บันทึกทั้งหมด' : 'Save Batch'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <form onKeyDown={handleKeyDown}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px] uppercase">
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5 min-w-[130px]">{isTh ? 'ชื่อตัวอย่าง / Sample' : 'Sample Name'}</th>

                      {/* Dynamic Columns rendered strictly in configured sequence */}
                      {orderedActivePoints.map((point, pIdx) => {
                        const isCustom = !point.isStandard;
                        return (
                          <th 
                            key={point.id} 
                            className={`p-2.5 min-w-[125px] text-center border-x border-slate-800/60 ${
                              point.isSC 
                                ? 'bg-amber-950/25 text-amber-200' 
                                : isCustom 
                                ? 'bg-cyan-950/25 text-cyan-200' 
                                : 'bg-slate-950 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-slate-850 text-slate-300 flex items-center justify-center border border-slate-700">
                                {pIdx + 1}
                              </span>
                              <span className="font-bold">{point.name}</span>
                            </div>

                            {/* Badges: SC Check & Micro Type Tip */}
                            <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                              {point.isSC && (
                                <span 
                                  title={isTh ? 'จุดควบคุมพิเศษวิกฤต (Special Characteristic - SC)' : 'Critical Special Characteristic (SC)'} 
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-0.5"
                                >
                                  <Shield className="w-2.5 h-2.5 text-amber-400" />
                                  <span>SC</span>
                                </span>
                              )}
                              <span 
                                title={isTh ? `ประเภทหัววัด Micrometer: ${point.microType}` : `Micrometer Tip: ${point.microType}`}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border flex items-center gap-0.5 ${
                                  point.microType === 'Blade'
                                    ? 'bg-amber-950 text-amber-300 border-amber-800/80'
                                    : point.microType === 'Rod'
                                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800/80'
                                    : 'bg-slate-900 text-slate-400 border-slate-800'
                                }`}
                              >
                                {point.microType === 'Blade' ? '🔪 Blade' : point.microType === 'Rod' ? '🦯 Rod' : 'None'}
                              </span>
                            </div>

                            <div className="text-[9px] font-mono text-slate-400 font-normal mt-0.5">
                              {point.specText}
                            </div>
                          </th>
                        );
                      })}

                      <th className="p-2.5 w-24 text-center">{isTh ? 'ผลการตรวจ' : 'Status'}</th>
                      <th className="p-2.5 min-w-[130px]">{isTh ? 'หมายเหตุ' : 'Remarks'}</th>
                      <th className="p-2.5 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {batchItems.map((item, idx) => {
                      const currentStatus = judgeStatus(item);

                      return (
                        <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="p-2.5 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>
                          
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.sampleName}
                              onChange={(e) => handleItemChange(item.id, 'sampleName', e.target.value)}
                              placeholder={`Sample ${idx + 1}`}
                              className="w-full bg-slate-950 border border-slate-800 text-indigo-300 font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                            />
                          </td>

                          {/* Dynamic Point Input Cells strictly matching column sequence */}
                          {orderedActivePoints.map((point) => {
                            let val = '';
                            let fieldStatus: 'pass' | 'fail' | 'neutral' = 'neutral';
                            let placeholder = point.specText || '-';

                            if (point.isStandard) {
                              if (point.key === 'width') {
                                val = item.width || '';
                                fieldStatus = getFieldStatus(item.width, headerInfo.widthTarget, headerInfo.widthTolPlus, headerInfo.widthTolMinus);
                                placeholder = headerInfo.widthTarget || '-';
                              } else if (point.key === 'height') {
                                val = item.height || '';
                                fieldStatus = getFieldStatus(item.height, headerInfo.heightTarget, headerInfo.heightTolPlus, headerInfo.heightTolMinus);
                                placeholder = headerInfo.heightTarget || '-';
                              } else if (point.key === 'length') {
                                val = item.length || '';
                                fieldStatus = getFieldStatus(item.length, headerInfo.lengthTarget, headerInfo.lengthTolPlus, headerInfo.lengthTolMinus);
                                placeholder = headerInfo.lengthTarget || '-';
                              } else if (point.key === 'bending') {
                                val = item.bending || '';
                                fieldStatus = getLimitStatus(item.bending, headerInfo.bendingMax);
                                placeholder = headerInfo.bendingMax ? `≤ ${headerInfo.bendingMax}` : '-';
                              } else if (point.key === 'camber') {
                                val = item.camber || '';
                                fieldStatus = getLimitStatus(item.camber, headerInfo.camberMax);
                                placeholder = headerInfo.camberMax ? `≤ ${headerInfo.camberMax}` : '-';
                              } else if (point.key === 'twist') {
                                val = item.twist || '';
                                fieldStatus = getLimitStatus(item.twist, headerInfo.twistMax);
                                placeholder = headerInfo.twistMax ? `≤ ${headerInfo.twistMax}` : '-';
                              }
                            } else {
                              val = item.customPointValues?.[point.id] || '';
                              const cpSpec: CuttingCustomPointSpec = {
                                id: point.id,
                                name: point.name,
                                unit: point.unit,
                                evalType: point.evalType,
                                target: point.target,
                                tolPlus: point.tolPlus,
                                tolMinus: point.tolMinus,
                                maxLimit: point.maxLimit,
                                minLimit: point.minLimit,
                                description: point.description,
                                isSC: point.isSC,
                                microType: point.microType,
                                order: point.order
                              };
                              const cStatus = validateCustomPoint(val, cpSpec);
                              if (!isIgnoredValue(val)) {
                                fieldStatus = cStatus === 'Pass' ? 'pass' : cStatus === 'Fail' ? 'fail' : 'neutral';
                              }
                              placeholder = point.evalType === 'target_tol' ? (point.target || '0.00')
                                : point.evalType === 'max_only' ? `≤ ${point.maxLimit}`
                                : point.evalType === 'min_only' ? `≥ ${point.minLimit}`
                                : `${point.minLimit}-${point.maxLimit}`;
                            }

                            let borderClass = 'border-slate-800 text-slate-100 focus:border-indigo-500';
                            if (fieldStatus === 'pass') {
                              borderClass = 'border-emerald-500/80 bg-emerald-950/30 text-emerald-200 focus:border-emerald-400';
                            } else if (fieldStatus === 'fail') {
                              borderClass = 'border-rose-500/80 bg-rose-950/40 text-rose-200 focus:border-rose-400';
                            }

                            return (
                              <td 
                                key={point.id} 
                                className={`p-2 border-x border-slate-800/40 ${
                                  point.isSC ? 'bg-amber-950/10' : !point.isStandard ? 'bg-cyan-950/10' : ''
                                }`}
                              >
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={val}
                                  onChange={(e) => {
                                    if (point.isStandard && point.key) {
                                      handleItemChange(item.id, point.key, e.target.value);
                                    } else {
                                      handleCustomPointValueChange(item.id, point.id, e.target.value);
                                    }
                                  }}
                                  placeholder={placeholder}
                                  title={`${point.name} (${point.unit}) ${point.isSC ? '[SC]' : ''} [${point.microType}]`}
                                  className={`w-full bg-slate-950 border font-mono text-center rounded-lg px-2 py-1.5 focus:outline-none font-semibold ${borderClass}`}
                                />
                              </td>
                            );
                          })}

                          {/* Status Badge */}
                          <td className="p-2 text-center">
                            {currentStatus === 'Pass' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PASS
                              </span>
                            ) : currentStatus === 'Fail' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 border border-rose-800 text-rose-300 flex items-center justify-center gap-1 animate-pulse">
                                <AlertCircle className="w-3 h-3 text-rose-400" /> FAIL
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950 border border-slate-800 text-slate-500 flex items-center justify-center">
                                PENDING
                              </span>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.remarks}
                              onChange={(e) => handleItemChange(item.id, 'remarks', e.target.value)}
                              placeholder={isTh ? 'หมายเหตุ' : 'Remarks'}
                              className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                            />
                          </td>

                          {/* Remove Row */}
                          <td className="p-2 text-center">
                            {batchItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setBatchItems(prev => prev.filter(i => i.id !== item.id))}
                                className="p-1.5 text-slate-500 hover:text-rose-400 transition hover:bg-slate-800 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE SPEC MANAGER (ADMIN) */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>{isTh ? 'การจัดการ Profile Specification (Cutting Quality Spec)' : 'Cutting Quality Spec Manager'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isTh ? 'กำหนดค่า Target Limits และ Tolerance Range สำหรับการตรวจสอบขนาดการตัด' : 'Configure Target Limits and Tolerance Range for cutting measurement'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveProfile}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{isTh ? 'บันทึก Profile Spec' : 'Save Profile Spec'}</span>
                </button>
              </div>
            </div>

            {/* Profile Selection & Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile list sidebar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{isTh ? 'รายการ Profile ที่บันทึกไว้' : 'Saved Profile Specs'}</span>
                  <span className="bg-slate-900 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-800">
                    {savedProfiles.length}
                  </span>
                </h4>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {savedProfiles.map(p => (
                    <div
                      key={p.name}
                      onClick={() => selectProfile(p)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        headerInfo.profileName === p.name
                          ? 'bg-indigo-950/60 border-indigo-700 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.customControlPoints && p.customControlPoints.length > 0 && (
                            <span className="px-1.5 py-0.2 text-[9px] rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                              +{p.customControlPoints.length} Custom
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Part: {p.partNo || 'N/A'}</div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ type: 'profile', id: p.name, label: p.name });
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile details editor */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Profile Name *
                    </label>
                    <input
                      type="text"
                      name="profileName"
                      value={headerInfo.profileName}
                      onChange={handleHeaderChange}
                      placeholder="e.g. CUT-PROFILE-STD-100"
                      className="w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Part No.
                    </label>
                    <input
                      type="text"
                      name="partNo"
                      value={headerInfo.partNo}
                      onChange={handleHeaderChange}
                      placeholder="e.g. PART-100-A"
                      className="w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 uppercase"
                    />
                  </div>
                </div>

                {/* Specification Limits Form */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{isTh ? 'กำหนดค่า Target, ค่าความคลาดเคลื่อน (Tolerance) และชื่อจุดวัด' : 'Target, Tolerance & Point Names Configuration'}</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {isTh ? '* สามารถแก้ไขชื่อจุดวัดและค่ามาตรฐานได้ตามต้องการ' : '* You can customize point names & standard limits'}
                    </span>
                  </div>

                  {/* Standard Limits Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Width Target/Tols */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-indigo-300 uppercase block flex items-center gap-1">
                          <Tag className="w-3 h-3 text-indigo-400" />
                          <span>{isTh ? '1. ชื่อจุดวัดความกว้าง (Width)' : '1. Width Point Name'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleTogglePointSC('width')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                            headerInfo.widthIsSC
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{headerInfo.widthIsSC ? 'SC (Critical)' : 'General'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        name="widthName"
                        value={headerInfo.widthName}
                        onChange={handleHeaderChange}
                        placeholder={isTh ? 'ความกว้าง W (Width)' : 'Width (mm)'}
                        className="w-full bg-slate-950 border border-slate-800 text-indigo-200 font-semibold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                      />

                      {/* Micro Type & Order */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Micro Type</span>
                          <select
                            value={headerInfo.widthMicroType || 'Blade'}
                            onChange={(e) => handleSetPointMicroType('width', e.target.value as MicroType)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-amber-300 font-semibold rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Blade">Blade</option>
                            <option value="Rod">Rod</option>
                            <option value="None">None</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">ลำดับ (Order)</span>
                          <input
                            type="number"
                            value={headerInfo.widthOrder ?? 1}
                            onChange={(e) => handleSetPointOrderDirect('width', parseInt(e.target.value) || 1)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-white font-mono font-bold rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          {isTh ? 'ค่ามาตรฐานความกว้าง (Target mm)' : 'Width Target (mm)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="widthTarget"
                          value={headerInfo.widthTarget}
                          onChange={handleHeaderChange}
                          placeholder="100.00"
                          className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] font-bold text-emerald-400 block mb-0.5">+ Tol (mm)</span>
                          <input
                            type="number"
                            step="0.01"
                            name="widthTolPlus"
                            value={headerInfo.widthTolPlus}
                            onChange={handleHeaderChange}
                            placeholder="0.50"
                            className="w-full bg-slate-950 border border-slate-800 text-emerald-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 font-mono font-semibold"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-rose-400 block mb-0.5">- Tol (mm)</span>
                          <input
                            type="number"
                            step="0.01"
                            name="widthTolMinus"
                            value={headerInfo.widthTolMinus}
                            onChange={handleHeaderChange}
                            placeholder="0.50"
                            className="w-full bg-slate-950 border border-slate-800 text-rose-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-rose-500 font-mono font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Height Target/Tols */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-indigo-300 uppercase block flex items-center gap-1">
                          <Tag className="w-3 h-3 text-indigo-400" />
                          <span>{isTh ? '2. ชื่อจุดวัดความสูง (Height)' : '2. Height Point Name'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleTogglePointSC('height')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                            headerInfo.heightIsSC
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{headerInfo.heightIsSC ? 'SC (Critical)' : 'General'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        name="heightName"
                        value={headerInfo.heightName}
                        onChange={handleHeaderChange}
                        placeholder={isTh ? 'ความสูง H (Height)' : 'Height (mm)'}
                        className="w-full bg-slate-950 border border-slate-800 text-indigo-200 font-semibold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                      />

                      {/* Micro Type & Order */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Micro Type</span>
                          <select
                            value={headerInfo.heightMicroType || 'Blade'}
                            onChange={(e) => handleSetPointMicroType('height', e.target.value as MicroType)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-amber-300 font-semibold rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Blade">Blade</option>
                            <option value="Rod">Rod</option>
                            <option value="None">None</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">ลำดับ (Order)</span>
                          <input
                            type="number"
                            value={headerInfo.heightOrder ?? 2}
                            onChange={(e) => handleSetPointOrderDirect('height', parseInt(e.target.value) || 2)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-white font-mono font-bold rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          {isTh ? 'ค่ามาตรฐานความสูง (Target mm)' : 'Height Target (mm)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="heightTarget"
                          value={headerInfo.heightTarget}
                          onChange={handleHeaderChange}
                          placeholder="50.00"
                          className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] font-bold text-emerald-400 block mb-0.5">+ Tol (mm)</span>
                          <input
                            type="number"
                            step="0.01"
                            name="heightTolPlus"
                            value={headerInfo.heightTolPlus}
                            onChange={handleHeaderChange}
                            placeholder="0.30"
                            className="w-full bg-slate-950 border border-slate-800 text-emerald-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 font-mono font-semibold"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-rose-400 block mb-0.5">- Tol (mm)</span>
                          <input
                            type="number"
                            step="0.01"
                            name="heightTolMinus"
                            value={headerInfo.heightTolMinus}
                            onChange={handleHeaderChange}
                            placeholder="0.30"
                            className="w-full bg-slate-950 border border-slate-800 text-rose-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-rose-500 font-mono font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Length Target/Tols */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-indigo-300 uppercase block flex items-center gap-1">
                          <Tag className="w-3 h-3 text-indigo-400" />
                          <span>{isTh ? '3. ชื่อจุดวัดความยาว (Length)' : '3. Length Point Name'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleTogglePointSC('length')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                            headerInfo.lengthIsSC
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{headerInfo.lengthIsSC ? 'SC (Critical)' : 'General'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        name="lengthName"
                        value={headerInfo.lengthName}
                        onChange={handleHeaderChange}
                        placeholder={isTh ? 'ความยาวตัด L (Length)' : 'Length (mm)'}
                        className="w-full bg-slate-950 border border-slate-800 text-indigo-200 font-semibold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                      />

                      {/* Micro Type & Order */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Micro Type</span>
                          <select
                            value={headerInfo.lengthMicroType || 'None'}
                            onChange={(e) => handleSetPointMicroType('length', e.target.value as MicroType)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-semibold rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="None">None</option>
                            <option value="Blade">Blade</option>
                            <option value="Rod">Rod</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">ลำดับ (Order)</span>
                          <input
                            type="number"
                            value={headerInfo.lengthOrder ?? 3}
                            onChange={(e) => handleSetPointOrderDirect('length', parseInt(e.target.value) || 3)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-white font-mono font-bold rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          {isTh ? 'ค่ามาตรฐานความยาว (Target mm)' : 'Length Target (mm)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="lengthTarget"
                          value={headerInfo.lengthTarget}
                          onChange={handleHeaderChange}
                          placeholder="2000.00"
                          className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] font-bold text-emerald-400 block mb-0.5">+ Tol (mm)</span>
                          <input
                            type="number"
                            step="0.01"
                            name="lengthTolPlus"
                            value={headerInfo.lengthTolPlus}
                            onChange={handleHeaderChange}
                            placeholder="2.00"
                            className="w-full bg-slate-950 border border-slate-800 text-emerald-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 font-mono font-semibold"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-rose-400 block mb-0.5">- Tol (mm)</span>
                          <input
                            type="number"
                            step="0.01"
                            name="lengthTolMinus"
                            value={headerInfo.lengthTolMinus}
                            onChange={handleHeaderChange}
                            placeholder="2.00"
                            className="w-full bg-slate-950 border border-slate-800 text-rose-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-rose-500 font-mono font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bending, Camber, Twist Maximum Limits */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {/* Bending */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-amber-300 uppercase block flex items-center gap-1">
                          <Tag className="w-3 h-3 text-amber-400" />
                          <span>{isTh ? '4. ชื่อจุดวัดความโก่ง (Bending)' : '4. Bending Name'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleTogglePointSC('bending')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                            headerInfo.bendingIsSC
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{headerInfo.bendingIsSC ? 'SC' : 'General'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        name="bendingName"
                        value={headerInfo.bendingName}
                        onChange={handleHeaderChange}
                        placeholder={isTh ? 'ความโก่ง Bending' : 'Bending (mm/m)'}
                        className="w-full bg-slate-950 border border-slate-800 text-amber-200 font-semibold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                      />

                      {/* Micro Type & Order */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Micro Type</span>
                          <select
                            value={headerInfo.bendingMicroType || 'None'}
                            onChange={(e) => handleSetPointMicroType('bending', e.target.value as MicroType)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-semibold rounded px-1.5 py-1 focus:outline-none focus:border-amber-500"
                          >
                            <option value="None">None</option>
                            <option value="Blade">Blade</option>
                            <option value="Rod">Rod</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">ลำดับ (Order)</span>
                          <input
                            type="number"
                            value={headerInfo.bendingOrder ?? 100}
                            onChange={(e) => handleSetPointOrderDirect('bending', parseInt(e.target.value) || 100)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-white font-mono font-bold rounded px-1.5 py-1 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          {isTh ? 'ค่าสูงสุดที่ยอมรับได้ (≤ Max mm/m)' : 'Bending Max Limit (≤ mm/m)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="bendingMax"
                          value={headerInfo.bendingMax}
                          onChange={handleHeaderChange}
                          placeholder="1.50"
                          className="w-full bg-slate-950 border border-slate-800 text-amber-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-bold font-mono"
                        />
                      </div>
                    </div>

                    {/* Camber */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-amber-300 uppercase block flex items-center gap-1">
                          <Tag className="w-3 h-3 text-amber-400" />
                          <span>{isTh ? '5. ชื่อจุดวัดความคด (Camber)' : '5. Camber Name'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleTogglePointSC('camber')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                            headerInfo.camberIsSC
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{headerInfo.camberIsSC ? 'SC' : 'General'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        name="camberName"
                        value={headerInfo.camberName}
                        onChange={handleHeaderChange}
                        placeholder={isTh ? 'ความคด Camber' : 'Camber (mm/m)'}
                        className="w-full bg-slate-950 border border-slate-800 text-amber-200 font-semibold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                      />

                      {/* Micro Type & Order */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Micro Type</span>
                          <select
                            value={headerInfo.camberMicroType || 'None'}
                            onChange={(e) => handleSetPointMicroType('camber', e.target.value as MicroType)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-semibold rounded px-1.5 py-1 focus:outline-none focus:border-amber-500"
                          >
                            <option value="None">None</option>
                            <option value="Blade">Blade</option>
                            <option value="Rod">Rod</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">ลำดับ (Order)</span>
                          <input
                            type="number"
                            value={headerInfo.camberOrder ?? 101}
                            onChange={(e) => handleSetPointOrderDirect('camber', parseInt(e.target.value) || 101)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-white font-mono font-bold rounded px-1.5 py-1 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          {isTh ? 'ค่าสูงสุดที่ยอมรับได้ (≤ Max mm/m)' : 'Camber Max Limit (≤ mm/m)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="camberMax"
                          value={headerInfo.camberMax}
                          onChange={handleHeaderChange}
                          placeholder="1.00"
                          className="w-full bg-slate-950 border border-slate-800 text-amber-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-bold font-mono"
                        />
                      </div>
                    </div>

                    {/* Twist */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-purple-300 uppercase block flex items-center gap-1">
                          <Tag className="w-3 h-3 text-purple-400" />
                          <span>{isTh ? '6. ชื่อจุดวัดความบิด (Twist)' : '6. Twist Name'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleTogglePointSC('twist')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                            headerInfo.twistIsSC
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{headerInfo.twistIsSC ? 'SC' : 'General'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        name="twistName"
                        value={headerInfo.twistName}
                        onChange={handleHeaderChange}
                        placeholder={isTh ? 'ความบิด Twist' : 'Twist (deg/m)'}
                        className="w-full bg-slate-950 border border-slate-800 text-purple-200 font-semibold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
                      />

                      {/* Micro Type & Order */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Micro Type</span>
                          <select
                            value={headerInfo.twistMicroType || 'None'}
                            onChange={(e) => handleSetPointMicroType('twist', e.target.value as MicroType)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-semibold rounded px-1.5 py-1 focus:outline-none focus:border-purple-500"
                          >
                            <option value="None">None</option>
                            <option value="Blade">Blade</option>
                            <option value="Rod">Rod</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">ลำดับ (Order)</span>
                          <input
                            type="number"
                            value={headerInfo.twistOrder ?? 102}
                            onChange={(e) => handleSetPointOrderDirect('twist', parseInt(e.target.value) || 102)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-white font-mono font-bold rounded px-1.5 py-1 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          {isTh ? 'ค่าสูงสุดที่ยอมรับได้ (≤ Max deg/m)' : 'Twist Max Limit (≤ deg/m)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="twistMax"
                          value={headerInfo.twistMax}
                          onChange={handleHeaderChange}
                          placeholder="0.50"
                          className="w-full bg-slate-950 border border-slate-800 text-purple-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 font-bold font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* MEASUREMENT SEQUENCE & POINT CONFIGURATION MANAGER */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-900/50 space-y-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <ListOrdered className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          {isTh ? '1. จัดลำดับหัวข้อการวัด และคุณลักษณะพิเศษ (Measurement Sequence & SC Manager)' : 'Measurement Sequence & Control Point Order'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {orderedActivePoints.length} {isTh ? 'จุดวัด' : 'Points'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {isTh
                          ? 'จัดลำดับหัวข้อการวัดเพื่อให้ตำแหน่งคอลัมน์ในส่วนบันทึก (Entry Table) สอดคล้องกับลำดับการวัดจริง พร้อมกำหนดจุด SC และประเภทหัววัด Micro Type'
                          : 'Reorder measurement sequence to align table columns with physical inspection flow. Configure SC checklist and Micrometer tips.'}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[10px] uppercase">
                          <th className="p-2.5 w-14 text-center">{isTh ? 'ลำดับ' : 'Order'}</th>
                          <th className="p-2.5 w-20 text-center">{isTh ? 'ปรับลำดับ' : 'Move'}</th>
                          <th className="p-2.5 min-w-[140px]">{isTh ? 'ชื่อจุดวัด (Point Name)' : 'Point Name'}</th>
                          <th className="p-2.5 min-w-[130px]">{isTh ? 'สเปคกำหนด (Spec)' : 'Specification'}</th>
                          <th className="p-2.5 w-32 text-center">{isTh ? '2. จุด SC (Checklist)' : '2. SC Point'}</th>
                          <th className="p-2.5 min-w-[170px] text-center">{isTh ? '3. Micro Type (Checklist)' : '3. Micro Type'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {orderedActivePoints.map((point, idx) => {
                          const isFirst = idx === 0;
                          const isLast = idx === orderedActivePoints.length - 1;

                          return (
                            <tr key={point.id} className="hover:bg-slate-850/50 transition-colors">
                              {/* Order number */}
                              <td className="p-2.5 text-center font-mono font-bold text-indigo-300">
                                <span className="w-6 h-6 rounded-md bg-indigo-950 border border-indigo-800 flex items-center justify-center mx-auto text-xs">
                                  {idx + 1}
                                </span>
                              </td>

                              {/* Up / Down Move buttons */}
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    disabled={isFirst}
                                    onClick={() => handleMovePoint(point.id, 'up')}
                                    className={`p-1 rounded-lg border transition ${
                                      isFirst 
                                        ? 'text-slate-600 border-slate-800/40 cursor-not-allowed' 
                                        : 'text-indigo-300 border-indigo-800 bg-indigo-950/60 hover:bg-indigo-900 hover:text-white'
                                    }`}
                                    title={isTh ? 'เลื่อนขึ้น' : 'Move Up'}
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isLast}
                                    onClick={() => handleMovePoint(point.id, 'down')}
                                    className={`p-1 rounded-lg border transition ${
                                      isLast 
                                        ? 'text-slate-600 border-slate-800/40 cursor-not-allowed' 
                                        : 'text-indigo-300 border-indigo-800 bg-indigo-950/60 hover:bg-indigo-900 hover:text-white'
                                    }`}
                                    title={isTh ? 'เลื่อนลง' : 'Move Down'}
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                              {/* Point Name & Type */}
                              <td className="p-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-xs">{point.name}</span>
                                  {!point.isStandard && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                {point.description && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">{point.description}</div>
                                )}
                              </td>

                              {/* Spec Limit */}
                              <td className="p-2.5 font-mono text-[11px] text-slate-300">
                                {point.specText} <span className="text-slate-500 font-sans">{point.unit}</span>
                              </td>

                              {/* 2. SC Checklist Toggle */}
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePointSC(point.id)}
                                  className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                                    point.isSC
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm shadow-amber-500/10'
                                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
                                  }`}
                                  title={isTh ? 'คลิกเพื่อตั้งค่าเป็นจุด Special Characteristic (SC)' : 'Toggle Special Characteristic (SC)'}
                                >
                                  {point.isSC ? (
                                    <>
                                      <CheckSquare className="w-4 h-4 text-amber-400" />
                                      <span>SC (วิกฤต)</span>
                                    </>
                                  ) : (
                                    <>
                                      <Square className="w-4 h-4 text-slate-600" />
                                      <span>ทั่วไป</span>
                                    </>
                                  )}
                                </button>
                              </td>

                              {/* 3. Micro Type Checklist / Selector */}
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {(['Blade', 'Rod', 'None'] as MicroType[]).map(type => (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() => handleSetPointMicroType(point.id, type)}
                                      className={`px-2 py-1 rounded text-[11px] font-semibold transition border ${
                                        point.microType === type
                                          ? type === 'Blade'
                                            ? 'bg-amber-950 text-amber-300 border-amber-600 font-bold'
                                            : type === 'Rod'
                                            ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold'
                                            : 'bg-slate-800 text-slate-200 border-slate-600 font-bold'
                                          : 'bg-slate-950 text-slate-500 border-slate-800/80 hover:text-slate-300'
                                      }`}
                                    >
                                      {type === 'Blade' ? '🔪 Blade' : type === 'Rod' ? '🦯 Rod' : 'None'}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* DYNAMIC CUSTOM CONTROL POINTS BUILDER */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-900/50 space-y-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                          {isTh ? 'จุดควบคุมกำหนดเองเฉพาะ Profile (Custom Control Points)' : 'Profile Custom Control Points'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {headerInfo.customControlPoints?.length || 0} {isTh ? 'จุด' : 'points'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {isTh 
                          ? 'เพิ่มจุดวัดขนาดเฉพาะของ Profile นี้ เช่น ความกว้างที่ 2, ความหนาปีก, องศามุมตัด, หรือระยะรูเจาะ' 
                          : 'Define custom dimension measurement points specific to this profile'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomPoint}
                      className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isTh ? '+ เพิ่มจุดควบคุมใหม่' : '+ Add Custom Point'}</span>
                    </button>
                  </div>

                  {/* Preset Template Quick-Add Chips */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isTh ? 'เทมเพลตสำเร็จรูปยอดนิยม (คลิกเพื่อเพิ่มทันที):' : 'Quick Presets (Click to add):'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Width 2 (W2)', unit: 'mm', evalType: 'target_tol' as const, target: '25.00', tolPlus: '0.20', tolMinus: '0.20', description: 'ความกว้างช่วงที่ 2' },
                        { name: 'Flange Thickness (tf)', unit: 'mm', evalType: 'target_tol' as const, target: '4.00', tolPlus: '0.15', tolMinus: '0.15', description: 'ความหนาปีก' },
                        { name: 'Web Thickness (tw)', unit: 'mm', evalType: 'target_tol' as const, target: '3.20', tolPlus: '0.15', tolMinus: '0.15', description: 'ความหนาเอว' },
                        { name: 'Cut Angle (องศาตัด)', unit: 'deg', evalType: 'target_tol' as const, target: '45.00', tolPlus: '1.00', tolMinus: '1.00', description: 'มุมตัดเฉียง' },
                        { name: 'Hole Pitch (ระยะเจาะ)', unit: 'mm', evalType: 'target_tol' as const, target: '50.00', tolPlus: '0.50', tolMinus: '0.50', description: 'ระยะห่างรูเจาะ' },
                        { name: 'Flatness (ความเรียบ)', unit: 'mm', evalType: 'max_only' as const, maxLimit: '0.50', description: 'ความโก่งเฉพาะจุด' },
                        { name: 'Radius (รัศมีมุม R)', unit: 'mm', evalType: 'min_max' as const, minLimit: '1.50', maxLimit: '2.50', description: 'รัศมีขอบมุม R' },
                      ].map((tpl, tIdx) => (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={() => handleApplyCustomPointTemplate(tpl)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-cyan-300 rounded-lg border border-slate-700/80 hover:border-cyan-500/60 transition flex items-center gap-1.5"
                        >
                          <Plus className="w-3 h-3 text-cyan-400" />
                          <span>{tpl.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of Custom Control Points */}
                  {(!headerInfo.customControlPoints || headerInfo.customControlPoints.length === 0) ? (
                    <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                        <SlidersHorizontal className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-slate-400 font-semibold">
                        {isTh 
                          ? 'ยังไม่มีจุดควบคุมพิเศษสำหรับ Profile นี้ (ใช้ค่ามาตรฐาน 6 ค่า: Width, Height, Length, Bending, Camber, Twist)' 
                          : 'No custom control points defined for this profile'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isTh ? 'กดปุ่ม "+ เพิ่มจุดควบคุมใหม่" หรือเลือกเทมเพลตด้านบนเพื่อเริ่มกำหนด' : 'Click "+ Add Custom Point" or choose a preset above'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {headerInfo.customControlPoints.map((cp, cpIdx) => (
                        <div 
                          key={cp.id} 
                          className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-cyan-800/80 transition-colors space-y-3 relative group"
                        >
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] font-mono font-bold flex items-center justify-center">
                                #{cpIdx + 1}
                              </span>
                              <span className="text-xs font-bold text-white font-mono">{cp.name || `Custom Point ${cpIdx + 1}`}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                {cp.evalType === 'target_tol' ? 'Target ± Tol' : cp.evalType === 'max_only' ? 'Max Limit (≤)' : cp.evalType === 'min_only' ? 'Min Limit (≥)' : 'Min-Max Range'}
                              </span>
                              {cp.isSC && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                                  <Shield className="w-2.5 h-2.5 text-amber-400" />
                                  <span>SC</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleTogglePointSC(cp.id)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                                  cp.isSC
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                    : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                                }`}
                              >
                                <Shield className="w-3 h-3" />
                                <span>{cp.isSC ? 'SC (Critical)' : 'Set SC'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveCustomPoint(cp.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 transition hover:bg-slate-800 rounded-lg"
                                title={isTh ? 'ลบจุดควบคุมนี้' : 'Delete control point'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                            {/* Point Name */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                {isTh ? 'ชื่อจุดควบคุม (Point Name) *' : 'Point Name *'}
                              </label>
                              <input
                                type="text"
                                value={cp.name}
                                onChange={(e) => handleUpdateCustomPoint(cp.id, 'name', e.target.value)}
                                placeholder="e.g. Width 2, Angle 1"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none focus:border-cyan-500"
                              />
                            </div>

                            {/* Evaluation Type */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                {isTh ? 'รูปแบบการประเมิน (Eval Type)' : 'Evaluation Type'}
                              </label>
                              <select
                                value={cp.evalType}
                                onChange={(e) => handleUpdateCustomPoint(cp.id, 'evalType', e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-cyan-300 font-semibold focus:outline-none focus:border-cyan-500"
                              >
                                <option value="target_tol">{isTh ? 'Target ± ค่าเผื่อ (Tol)' : 'Target ± Tolerance'}</option>
                                <option value="max_only">{isTh ? 'กำหนดค่าสูงสุด (≤ Max Limit)' : 'Max Limit Only (≤)'}</option>
                                <option value="min_only">{isTh ? 'กำหนดค่าต่ำสุด (≥ Min Limit)' : 'Min Limit Only (≥)'}</option>
                                <option value="min_max">{isTh ? 'ช่วงต่ำสุด-สูงสุด (Min - Max Range)' : 'Min - Max Range'}</option>
                              </select>
                            </div>

                            {/* Micro Type */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                {isTh ? 'Micro Type (หัววัด)' : 'Micro Type'}
                              </label>
                              <select
                                value={cp.microType || 'Blade'}
                                onChange={(e) => handleUpdateCustomPoint(cp.id, 'microType', e.target.value as MicroType)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-amber-300 font-semibold focus:outline-none focus:border-cyan-500"
                              >
                                <option value="Blade">Blade</option>
                                <option value="Rod">Rod</option>
                                <option value="None">None</option>
                              </select>
                            </div>

                            {/* Unit */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                {isTh ? 'หน่วยวัด (Unit)' : 'Unit'}
                              </label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={cp.unit}
                                  onChange={(e) => handleUpdateCustomPoint(cp.id, 'unit', e.target.value)}
                                  placeholder="mm, deg, mm/m"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                                />
                              </div>
                            </div>

                            {/* Location Note / Description */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                {isTh ? 'คำอธิบายจุดวัด (Description)' : 'Description'}
                              </label>
                              <input
                                type="text"
                                value={cp.description || ''}
                                onChange={(e) => handleUpdateCustomPoint(cp.id, 'description', e.target.value)}
                                placeholder={isTh ? 'เช่น จุดกึ่งกลางชิ้นงาน' : 'e.g. Center position'}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          </div>

                          {/* Dynamic Numeric Limit Inputs based on EvalType */}
                          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                            {cp.evalType === 'target_tol' && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold text-indigo-300 uppercase block mb-1">
                                    {isTh ? `Target (${cp.unit}) *` : `Target (${cp.unit}) *`}
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={cp.target || ''}
                                    onChange={(e) => handleUpdateCustomPoint(cp.id, 'target', e.target.value)}
                                    placeholder="100.00"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                                    {isTh ? `+ Tolerance (+${cp.unit})` : `+ Tolerance (+${cp.unit})`}
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={cp.tolPlus || ''}
                                    onChange={(e) => handleUpdateCustomPoint(cp.id, 'tolPlus', e.target.value)}
                                    placeholder="0.50"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-rose-400 uppercase block mb-1">
                                    {isTh ? `- Tolerance (-${cp.unit})` : `- Tolerance (-${cp.unit})`}
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={cp.tolMinus || ''}
                                    onChange={(e) => handleUpdateCustomPoint(cp.id, 'tolMinus', e.target.value)}
                                    placeholder="0.50"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-rose-300 font-mono font-bold focus:outline-none focus:border-rose-500"
                                  />
                                </div>
                              </div>
                            )}

                            {cp.evalType === 'max_only' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                                    {isTh ? `ค่าสูงสุดที่ยอมรับได้ (≤ Max Limit in ${cp.unit}) *` : `Max Acceptable Limit (≤ ${cp.unit}) *`}
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={cp.maxLimit || ''}
                                    onChange={(e) => handleUpdateCustomPoint(cp.id, 'maxLimit', e.target.value)}
                                    placeholder="1.00"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                                  />
                                </div>
                                <div className="flex items-center text-xs text-slate-400 pt-5">
                                  <span>{isTh ? `เกณฑ์ตัดสิน: ค่าที่วัดได้ต้องน้อยกว่าหรือเท่ากับ (≤) ${cp.maxLimit || '-'} ${cp.unit}` : `Criterion: Measured value ≤ ${cp.maxLimit || '-'} ${cp.unit}`}</span>
                                </div>
                              </div>
                            )}

                            {cp.evalType === 'min_only' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                                    {isTh ? `ค่าต่ำสุดที่ยอมรับได้ (≥ Min Limit in ${cp.unit}) *` : `Min Acceptable Limit (≥ ${cp.unit}) *`}
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={cp.minLimit || ''}
                                    onChange={(e) => handleUpdateCustomPoint(cp.id, 'minLimit', e.target.value)}
                                    placeholder="10.00"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                                  />
                                </div>
                                <div className="flex items-center text-xs text-slate-400 pt-5">
                                  <span>{isTh ? `เกณฑ์ตัดสิน: ค่าที่วัดได้ต้องมากกว่าหรือเท่ากับ (≥) ${cp.minLimit || '-'} ${cp.unit}` : `Criterion: Measured value ≥ ${cp.minLimit || '-'} ${cp.unit}`}</span>
                                </div>
                              </div>
                            )}

                            {cp.evalType === 'min_max' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold text-indigo-300 uppercase block mb-1">
                                    {isTh ? `ช่วงต่ำสุด (Min Limit in ${cp.unit}) *` : `Min Limit (${cp.unit}) *`}
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={cp.minLimit || ''}
                                    onChange={(e) => handleUpdateCustomPoint(cp.id, 'minLimit', e.target.value)}
                                    placeholder="1.50"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-indigo-300 uppercase block mb-1">
                                    {isTh ? `ช่วงสูงสุด (Max Limit in ${cp.unit}) *` : `Max Limit (${cp.unit}) *`}
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={cp.maxLimit || ''}
                                    onChange={(e) => handleUpdateCustomPoint(cp.id, 'maxLimit', e.target.value)}
                                    placeholder="2.50"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DASHBOARD STATS & TRENDS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {dashboardStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
                <div className="text-[10px] font-bold text-slate-400 uppercase">{isTh ? 'จำนวนตัวอย่างทั้งหมด' : 'Total Samples'}</div>
                <div className="text-2xl font-bold text-white mt-1 font-mono">{dashboardStats.total} <span className="text-xs text-slate-400 font-sans">{isTh ? 'ชิ้นงาน' : 'Items'}</span></div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-900/40 shadow-md">
                <div className="text-[10px] font-bold text-emerald-400 uppercase">{isTh ? 'จำนวนที่ผ่านเกณฑ์ (Pass)' : 'Passed Samples'}</div>
                <div className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{dashboardStats.passCount} <span className="text-xs text-slate-400 font-sans">({dashboardStats.passRatio}%)</span></div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-rose-900/40 shadow-md">
                <div className="text-[10px] font-bold text-rose-400 uppercase">{isTh ? 'จำนวนที่ไม่ผ่านเกณฑ์ (Fail)' : 'Failed Samples'}</div>
                <div className="text-2xl font-bold text-rose-300 mt-1 font-mono">{dashboardStats.failCount} <span className="text-xs text-slate-400 font-sans">{isTh ? 'ชิ้นงาน' : 'Items'}</span></div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-indigo-900/40 shadow-md">
                <div className="text-[10px] font-bold text-indigo-400 uppercase">{isTh ? 'อัตราการผ่านเกณฑ์' : 'Overall Pass Rate'}</div>
                <div className="text-2xl font-bold text-indigo-300 mt-1 font-mono">{dashboardStats.passRatio}%</div>
              </div>
            </div>
          )}

          {/* Profile Summaries */}
          {dashboardStats && dashboardStats.profileSummaries.length > 0 && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {isTh ? 'สรุปผลการตรวจแยกตาม Profile (Profile Summary Breakdown)' : 'Profile Summary Breakdown'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardStats.profileSummaries.map(p => (
                  <div key={p.name} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="font-bold text-xs text-white">{p.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        parseFloat(p.passRate) >= 95 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        Pass Rate: {p.passRate}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                      <div>Width Avg: <strong className="text-indigo-300">{p.avgWidth} mm</strong></div>
                      <div>Height Avg: <strong className="text-indigo-300">{p.avgHeight || p.avgHeightLeft} mm</strong></div>
                      <div>Length Avg: <strong className="text-indigo-300">{p.avgLength} mm</strong></div>
                      <div>Bending Avg: <strong className="text-amber-300">{p.avgBending} mm/m</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend Filters & Sparkline Charts */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {isTh ? 'กราฟแนวโน้มขนาดการตัด (Dimensional Sparkline Trends)' : 'Dimensional Sparkline Trends'}
              </h3>

              <div className="flex items-center gap-3">
                <select
                  value={trendFilterProfile}
                  onChange={(e) => setTrendFilterProfile(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
                >
                  {availableProfiles.map(p => (
                    <option key={p} value={p}>{p === 'All' ? (isTh ? 'ทุก Profile' : 'All Profiles') : p}</option>
                  ))}
                </select>

                <select
                  value={trendFilterMonth}
                  onChange={(e) => setTrendFilterMonth(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{m === 'All' ? (isTh ? 'ทุกเดือน' : 'All Months') : m}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredTrends.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                {isTh ? 'ไม่พบข้อมูลกราฟตามเงื่อนไขที่เลือก' : 'No trend data for selected filters'}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredTrends.map(group => (
                  <div key={group.name} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-bold text-xs text-indigo-300">{group.name}</span>
                      <span className="text-[10px] text-slate-400">{group.total} {isTh ? 'รายการล่าสุด' : 'inspection points'}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Sparkline data={group.trends.width} color="#818cf8" label="Width (mm)" />
                      <Sparkline data={group.trends.height || group.trends.heightLeft} color="#34d399" label="Height (mm)" />
                      <Sparkline data={group.trends.length} color="#a78bfa" label="Length (mm)" />
                      <Sparkline data={group.trends.bending} color="#f59e0b" label="Bending (mm/m)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: INSPECTION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <span>{isTh ? 'ประวัติการตรวจวัดขนาดจากการตัด (Cutting Inspection Records)' : 'Cutting Inspection History'}</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  placeholder={isTh ? 'ค้นหา Coil, WO, Profile...' : 'Search Coil, WO, Profile...'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={exportToExcel}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <span>Export CSV/Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px] uppercase">
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">Profile & Part</th>
                  <th className="p-2.5">Coil / WO</th>
                  <th className="p-2.5 text-center">Width</th>
                  <th className="p-2.5 text-center">Height</th>
                  <th className="p-2.5 text-center">Length</th>
                  <th className="p-2.5 text-center">Bending</th>
                  <th className="p-2.5 text-center">Camber</th>
                  <th className="p-2.5 text-center">Twist</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5">Inspector</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInspections.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-6 text-center text-slate-500 text-xs">
                      {isTh ? 'ไม่พบข้อมูลประวัติการตรวจวัด' : 'No inspection records found'}
                    </td>
                  </tr>
                ) : (
                  filteredInspections.map(ins => (
                    <tr key={ins.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">{ins.timestamp}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-indigo-300">{ins.profileName}</div>
                        <div className="text-[10px] text-slate-400">Part: {ins.partId}</div>
                      </td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-200">{ins.lotNumber}</div>
                        <div className="text-[10px] text-slate-400">WO: {ins.workOrder || '-'}</div>
                      </td>
                      <td className="p-2.5 text-center font-mono font-semibold text-slate-200">{ins.width || '-'}</td>
                      <td className="p-2.5 text-center font-mono font-semibold text-slate-200">{ins.height || ins.heightLeft || '-'}</td>
                      <td className="p-2.5 text-center font-mono font-semibold text-slate-200">{ins.length || '-'}</td>
                      <td className="p-2.5 text-center font-mono font-semibold text-amber-300">{ins.bending || '-'}</td>
                      <td className="p-2.5 text-center font-mono font-semibold text-amber-300">{ins.camber || '-'}</td>
                      <td className="p-2.5 text-center font-mono font-semibold text-purple-300">{ins.twist || '-'}</td>
                      
                      {/* Status */}
                      <td className="p-2.5 text-center">
                        {ins.status === 'Pass' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">PASS</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 border border-rose-800 text-rose-300">FAIL</span>
                        )}
                        {ins.customPointValues && Object.keys(ins.customPointValues).length > 0 && (
                          <div className="text-[9px] text-cyan-400 font-mono mt-0.5" title={JSON.stringify(ins.customPointValues)}>
                            +{Object.keys(ins.customPointValues).length} Custom
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-300">
                        <div>{ins.inspectorName}</div>
                        {ins.shift && <div className="text-[10px] text-cyan-400">Shift: {ins.shift}</div>}
                        <div className="text-[10px] text-slate-500">Op: {ins.employeeName || '-'}</div>
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRequestEditHistory(ins)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition border border-amber-500/30 flex items-center gap-1 text-[11px] font-bold"
                            title={isTh ? "แก้ไขข้อมูล (ต้องใส่ Password)" : "Edit Record (Password required)"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isTh ? 'แก้ไข' : 'Edit'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ type: 'history', id: ins.id || '', label: ins.lotNumber })}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition hover:bg-slate-800 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                  ? 'กรอกรหัสผ่านผู้ดูแลระบบเพื่อแก้ไขรายการตรวจวัด IPQA-05' 
                  : 'Enter admin password to edit IPQA-05 record'}
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
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isTh ? 'แก้ไขข้อมูลมิติตัด (IPQA-05)' : 'Edit Cutting Dimension Record'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Coil: {editingHistoryItem.lotNumber} | ID: {editingHistoryItem.id}
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
                    value={editingHistoryItem.lotNumber || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, lotNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Part ID</label>
                  <input
                    type="text"
                    value={editingHistoryItem.partId || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, partId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Profile Spec</label>
                  <input
                    type="text"
                    value={editingHistoryItem.profileName || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, profileName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inspector Name</label>
                  <input
                    type="text"
                    value={editingHistoryItem.inspectorName || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, inspectorName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <MachineSelector
                  id="edit-cutting-machine"
                  label="Machine No."
                  value={editingHistoryItem.machine || ''}
                  onChange={(mac) => setEditingHistoryItem({ ...editingHistoryItem, machine: mac })}
                />

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Shift (กะ)</label>
                  <input
                    list="edit-cutting-shift-options"
                    type="text"
                    placeholder="e.g. Day / Night / Shift A..."
                    value={editingHistoryItem.shift || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, shift: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="edit-cutting-shift-options">
                    <option value="Day (กะกลางวัน / A)" />
                    <option value="Night (กะกลางคืน / B)" />
                    <option value="Shift A" />
                    <option value="Shift B" />
                    <option value="Shift C" />
                  </datalist>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label>
                  <select
                    value={editingHistoryItem.status}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, status: e.target.value as 'Pass' | 'Fail' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Dimension Measured Values</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Width (mm)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.width || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, width: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Height (mm)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.height || editingHistoryItem.heightLeft || ''}
                      onChange={(e) => setEditingHistoryItem({ 
                        ...editingHistoryItem, 
                        height: e.target.value,
                        heightLeft: e.target.value,
                        heightRight: e.target.value
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Length (mm)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.length || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, length: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Bending (mm)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.bending || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, bending: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Camber (mm)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.camber || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, camber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Twist (mm)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.twist || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, twist: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-purple-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Custom Points Values in Edit Modal */}
                {editingHistoryItem.customPointValues && Object.keys(editingHistoryItem.customPointValues).length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isTh ? 'จุดควบคุมเฉพาะ Profile (Custom Control Points)' : 'Custom Control Points'}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {Object.entries(editingHistoryItem.customPointValues).map(([cpKey, cpVal]) => (
                        <div key={cpKey}>
                          <label className="text-[10px] font-bold text-cyan-300 uppercase block mb-1 truncate">
                            {cpKey}
                          </label>
                          <input
                            type="text"
                            value={cpVal}
                            onChange={(e) => {
                              const updatedCustomValues = {
                                ...(editingHistoryItem.customPointValues || {}),
                                [cpKey]: e.target.value
                              };
                              setEditingHistoryItem({
                                ...editingHistoryItem,
                                customPointValues: updatedCustomValues
                              });
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-cyan-200 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

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

    </div>
  );
};
