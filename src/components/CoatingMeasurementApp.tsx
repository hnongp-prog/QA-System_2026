import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ClipboardCheck, 
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
  Download,
  Plus,
  Search,
  Settings,
  Layers,
  FileSpreadsheet,
  Edit3,
  X,
  RotateCcw,
  HelpCircle,
  Calculator
} from 'lucide-react';

import { 
  CoatingProfileSpec, 
  CoatingInspectionRecord, 
  Language, 
  InspectionActivity 
} from '../types';
import { useCloudState } from '../services/firestoreSync';

interface CoatingMeasurementAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
}

// Sparkline SVG Component
const Sparkline = ({ data, color, label }: { data: number[]; color: string; label: string }) => {
  const validData = data.filter(v => v > 0);
  
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

const DEFAULT_PROFILES: CoatingProfileSpec[] = [
  { 
    name: 'Standard_Coating_01', 
    widthMin: '1000', widthMax: '1020',
    heightMin: '0.40', heightMax: '0.60',
    binderMin: '5.00', binderMax: '10.00',
    amtBinderMin: '1.00', amtBinderMax: '3.00',
    coatingWtMinUp: '10.0', coatingWtMaxUp: '20.0',
    pencilHardnessUp: '2H',
    coatingWtMinLo: '10.0', coatingWtMaxLo: '20.0',
    pencilHardnessLo: '2H',
    scothMagicTapeMax: '0.50',
    scothMagicTapeMaxUp: '0.50',
    scothMagicTapeMaxLo: '0.50',
    scothMagicTape: '0.50',
    scothMagicTapeUp: '0.50',
    scothMagicTapeLo: '0.50',
    stdLength: '200',
    stdCoatingWidth: '100'
  },
  {
    name: 'HEAVY-COATING-PRO',
    widthMin: '1200', widthMax: '1220',
    heightMin: '0.50', heightMax: '0.80',
    binderMin: '8.00', binderMax: '15.00',
    amtBinderMin: '2.00', amtBinderMax: '5.00',
    coatingWtMinUp: '15.0', coatingWtMaxUp: '30.0',
    pencilHardnessUp: '3H',
    coatingWtMinLo: '15.0', coatingWtMaxLo: '30.0',
    pencilHardnessLo: '3H',
    scothMagicTapeMax: '0.50',
    scothMagicTapeMaxUp: '0.50',
    scothMagicTapeMaxLo: '0.50',
    scothMagicTape: '0.50',
    scothMagicTapeUp: '0.50',
    scothMagicTapeLo: '0.50',
    stdLength: '200',
    stdCoatingWidth: '100'
  }
];

const INITIAL_INSPECTIONS: CoatingInspectionRecord[] = [
  {
    id: 'rec-coat-001',
    lotNumber: 'COIL-2026-C101',
    partId: 'UP-SIDE',
    mixingLot: 'MIX-2026-B08',
    width: '100',
    heightLeft: '0.48',
    heightRight: '0.50',
    length: '200',
    coatingWidth: '100',
    coatingArea: '0.020000',
    totalWeight: '1.2500',
    weightAfterDryer: '1.1800',
    wtWithoutCoatUp: '1.0200',
    wtWithoutCoatLo: '0.8800',
    binderWt: '0.0700',
    totalCoatBinderWt: '0.3700',
    raUp: '8.00',
    raLo: '7.00',
    binderPercent: '18.92',
    amountOfBinder: '7.00',
    rtUp: '2H',
    rtLo: '2H',
    scothMagicTape: '0.12',
    scothMagicTapeUp: '0.12',
    scothMagicTapeLo: '0.10',
    status: 'Pass',
    profileName: 'Standard_Coating_01',
    inspectorName: 'Somchai P.',
    machine: 'COAT-LINE-01',
    date: '2026-08-05',
    timestamp: '05/08/2026, 09:30:00'
  },
  {
    id: 'rec-coat-002',
    lotNumber: 'COIL-2026-C102',
    partId: 'LO-SIDE',
    mixingLot: 'MIX-2026-B08',
    width: '100',
    heightLeft: '0.52',
    heightRight: '0.51',
    length: '200',
    coatingWidth: '100',
    coatingArea: '0.020000',
    totalWeight: '1.1000',
    weightAfterDryer: '1.0800',
    wtWithoutCoatUp: '1.0500',
    wtWithoutCoatLo: '0.9200',
    binderWt: '0.0200',
    totalCoatBinderWt: '0.1800',
    raUp: '1.50',
    raLo: '6.50',
    binderPercent: '11.11',
    amountOfBinder: '2.00',
    rtUp: '2H',
    rtLo: '2H',
    scothMagicTape: '0.15',
    scothMagicTapeUp: '0.15',
    scothMagicTapeLo: '0.14',
    status: 'Fail',
    remarks: 'Coating Wt Up below spec min (10.0 g/m²)',
    profileName: 'Standard_Coating_01',
    inspectorName: 'Somchai P.',
    machine: 'COAT-LINE-01',
    date: '2026-08-05',
    timestamp: '05/08/2026, 11:15:00'
  }
];

export const CoatingMeasurementApp: React.FC<CoatingMeasurementAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th'
}) => {
  const isTh = language === 'th';
  const [activeTab, setActiveTab] = useState<'new-batch' | 'settings' | 'dashboard' | 'history'>('new-batch');
  const tableRef = useRef<HTMLDivElement>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Saved Profiles & Inspections with Real-time Cloud Sync
  const [savedProfiles, setSavedProfiles] = useCloudState<CoatingProfileSpec[]>('coating_qc_profiles', DEFAULT_PROFILES);
  const [inspections, setInspections] = useCloudState<CoatingInspectionRecord[]>('coating_qc_inspections', INITIAL_INSPECTIONS);

  // Auth State for Settings
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);

  // Header Info State (Clean initial state)
  const [headerInfo, setHeaderInfo] = useState({
    inspectorName: '',
    shift: '',
    machine: '',
    mixingLot: '',
    date: new Date().toISOString().split('T')[0],
    profileName: '',
    reqWidthMin: '', reqWidthMax: '',
    reqHeightMin: '', reqHeightMax: '',
    reqBinderMin: '', reqBinderMax: '',
    reqAmtBinderMin: '', reqAmtBinderMax: '',
    reqCoatingWtMinUp: '', reqCoatingWtMaxUp: '',
    reqPencilHardnessUp: '',
    reqCoatingWtMinLo: '', reqCoatingWtMaxLo: '',
    reqPencilHardnessLo: '',
    reqScothMagicTapeMax: '0.50',
    reqScothMagicTapeMaxUp: '0.50',
    reqScothMagicTapeMaxLo: '0.50',
    reqScothMagicTape: '0.50',
    reqScothMagicTapeUp: '0.50',
    reqScothMagicTapeLo: '0.50',
    stdLength: '200',
    stdCoatingWidth: '100'
  });

  const [profileStatus, setProfileStatus] = useState<'found' | 'not-found'>('not-found');

  // Auto calculate helper for row items using official IPQA-04 formulas:
  const parseNumOrNull = (val: any): number | null => {
    if (val === undefined || val === null) return null;
    const s = String(val).trim();
    if (s === '' || s === '-' || s === 'N/A') return null;
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };

  // 1. Coating wt Up = (Dryer Wt - Empty Up) / (Std Coating Width x Std Length / 1,000,000)
  // 2. Coating wt Lo = (Empty Up - Empty Lo) / (Std Coating Width x Std Length / 1,000,000)
  // 3. Binder% = (Total Wt - Dryer Wt) / (Total Wt - min(Empty Up, Empty Lo)) * 100
  // 4. Amt Binder = (Total Wt - Dryer Wt) / ((Std Coating Width x Std Length / 1,000,000) / 2)
  const calculateAutoFields = (item: any, currentHeader = headerInfo) => {
    const total = parseNumOrNull(item.totalWeight);
    const dryer = parseNumOrNull(item.weightAfterDryer);
    const wtUp = parseNumOrNull(item.wtWithoutCoatUp);
    const wtLo = parseNumOrNull(item.wtWithoutCoatLo);
    
    // Sample Strip Dimensions from Spec (Standard Test Dimensions (mm)):
    const stdCoatingWidth = parseNumOrNull(item.coatingWidth) || parseNumOrNull(currentHeader?.stdCoatingWidth) || 100;
    const stdLength = parseNumOrNull(item.length) || parseNumOrNull(currentHeader?.stdLength) || 200;

    // Formula denominator: (Std Coating Width x Std Length / 1000000) in m²
    const coatingAreaVal = stdCoatingWidth > 0 && stdLength > 0 ? (stdCoatingWidth * stdLength) / 1000000 : 0;
    const coatingAreaStr = coatingAreaVal > 0 ? coatingAreaVal.toFixed(6) : '';

    // Binder Weight = Total Wt - Dryer Wt
    const binderWtVal = total !== null && dryer !== null && total > 0 && dryer > 0 ? (total - dryer) : null;
    const binderWtStr = binderWtVal !== null && binderWtVal > 0 ? binderWtVal.toFixed(4) : '';

    // Total Coat & Binder Wt = Total Wt - min(Empty Up, Empty Lo)
    let totalCoatBinderWtVal: number | null = null;
    let totalCoatBinderWtStr = '';
    if (total !== null && total > 0 && (wtUp !== null || wtLo !== null)) {
        const values = [wtUp, wtLo].filter((v): v is number => v !== null && v > 0);
        if (values.length > 0) {
          const minEmpty = Math.min(...values);
          totalCoatBinderWtVal = (total - minEmpty);
          totalCoatBinderWtStr = totalCoatBinderWtVal > 0 ? totalCoatBinderWtVal.toFixed(4) : '';
        }
    }

    // 3. Binder% = (Total Wt - Dryer Wt) / (Total Wt - min(Empty Up, Empty Lo)) * 100
    let binderPercent = '';
    if (binderWtVal !== null && binderWtVal > 0 && totalCoatBinderWtVal !== null && totalCoatBinderWtVal > 0) {
      binderPercent = ((binderWtVal / totalCoatBinderWtVal) * 100).toFixed(2);
    }

    // 4. Amt Binder = (Total Wt - Dryer Wt) / ((Std Coating Width x Std Length / 1000000) / 2)
    let amountOfBinder = '';
    if (binderWtVal !== null && binderWtVal > 0 && coatingAreaVal > 0) {
      amountOfBinder = (binderWtVal / (coatingAreaVal / 2)).toFixed(2);
    }

    // 1. Coating wt Up = (Dryer Wt - Empty Up) / (Std Coating Width x Std Length / 1000000)
    // 2. Coating wt Lo = (Empty Up - Empty Lo) / (Std Coating Width x Std Length / 1000000)
    let raUp = item.raUp || '';
    let raLo = item.raLo || '';
    if (coatingAreaVal > 0) {
        if (dryer !== null && dryer > 0 && wtUp !== null && wtUp > 0) {
          raUp = ((dryer - wtUp) / coatingAreaVal).toFixed(2);
        }
        if (wtUp !== null && wtUp > 0 && wtLo !== null && wtLo > 0) {
          raLo = ((wtUp - wtLo) / coatingAreaVal).toFixed(2);
        }
    }

    return { 
      coatingWidth: String(stdCoatingWidth),
      length: String(stdLength),
      coatingArea: coatingAreaStr, 
      binderWt: binderWtStr, 
      totalCoatBinderWt: totalCoatBinderWtStr, 
      binderPercent, 
      raUp, 
      raLo, 
      amountOfBinder 
    };
  };

  // Batch Data Entry Items State (Clean initial state)
  const [batchItems, setBatchItems] = useState(() => {
    const initial = { 
      id: Date.now(), 
      partId: '', 
      lotNumber: '', 
      width: '', 
      heightLeft: '', 
      heightRight: '',
      length: '200', 
      coatingWidth: '100', 
      coatingArea: '', 
      totalWeight: '', 
      weightAfterDryer: '', 
      wtWithoutCoatUp: '', 
      wtWithoutCoatLo: '',
      binderWt: '', 
      totalCoatBinderWt: '', 
      amountOfBinder: '',
      raUp: '', raLo: '', 
      binderPercent: '', 
      rtUp: '', rtLo: '', 
      scothMagicTapeUp: '',
      scothMagicTapeLo: '',
      scothMagicTape: '',
      status: 'Pending' as 'Pass' | 'Fail' | 'Pending', 
      remarks: '' 
    };
    const autos = calculateAutoFields(initial);
    return [{ ...initial, ...autos }];
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'profile' | 'history'; id: string; label: string } | null>(null);

  // History Edit Auth & Modal States
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<CoatingInspectionRecord | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<CoatingInspectionRecord | null>(null);
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState('');
  const [historyAuthError, setHistoryAuthError] = useState(false);

  const handleRequestEditHistory = (item: CoatingInspectionRecord) => {
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

  // Handle Admin Auth
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
      showNotification(isTh ? 'รหัสผ่านไม่ถูกต้อง ( admin2026 )' : 'Incorrect password', 'error');
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

  // Dashboard Stats
  const dashboardStats = useMemo(() => {
    if (inspections.length === 0) return null;

    const total = inspections.length;
    const passCount = inspections.filter(i => i.status === 'Pass').length;
    const failCount = total - passCount;
    const passRatio = ((passCount / total) * 100).toFixed(1);

    const profileGroups: Record<string, { 
      name: string; total: number; pass: number; fail: number; 
      avgCoatingUp: number; countUp: number;
      avgBinderPct: number; countBinder: number;
      avgAmtBinder: number; countAmtBinder: number;
    }> = {};

    inspections.forEach(item => {
      const pName = item.profileName || 'Unknown';
      if (!profileGroups[pName]) {
        profileGroups[pName] = { 
          name: pName, total: 0, pass: 0, fail: 0, 
          avgCoatingUp: 0, countUp: 0,
          avgBinderPct: 0, countBinder: 0,
          avgAmtBinder: 0, countAmtBinder: 0,
        };
      }
      profileGroups[pName].total++;
      if (item.status === 'Pass') profileGroups[pName].pass++;
      else profileGroups[pName].fail++;

      const coatingUp = parseFloat(item.raUp || '0');
      if (!isNaN(coatingUp) && coatingUp > 0) {
        profileGroups[pName].avgCoatingUp += coatingUp;
        profileGroups[pName].countUp++;
      }

      const binderPct = parseFloat(item.binderPercent || '0');
      if (!isNaN(binderPct) && binderPct > 0) {
        profileGroups[pName].avgBinderPct += binderPct;
        profileGroups[pName].countBinder++;
      }

      const amtBinder = parseFloat(item.amountOfBinder || '0');
      if (!isNaN(amtBinder) && amtBinder > 0) {
        profileGroups[pName].avgAmtBinder += amtBinder;
        profileGroups[pName].countAmtBinder++;
      }
    });

    const profileSummaries = Object.values(profileGroups).map(g => {
      return {
        ...g,
        avgCoatingUp: g.countUp > 0 ? (g.avgCoatingUp / g.countUp).toFixed(2) : '-',
        avgBinderPct: g.countBinder > 0 ? (g.avgBinderPct / g.countBinder).toFixed(2) : '-',
        avgAmtBinder: g.countAmtBinder > 0 ? (g.avgAmtBinder / g.countAmtBinder).toFixed(2) : '-',
        passRate: ((g.pass / g.total) * 100).toFixed(1),
      };
    });

    return { total, passCount, failCount, passRatio, profileSummaries };
  }, [inspections]);

  // Filtered Trends
  const filteredTrends = useMemo(() => {
    if (inspections.length === 0) return [];

    let filtered = inspections;
    if (trendFilterProfile !== 'All') {
      filtered = filtered.filter(i => (i.profileName || 'Unknown') === trendFilterProfile);
    }
    if (trendFilterMonth !== 'All') {
      filtered = filtered.filter(i => i.date && i.date.startsWith(trendFilterMonth));
    }

    const groups: Record<string, { name: string; total: number; history: CoatingInspectionRecord[] }> = {};
    filtered.forEach(item => {
      const pName = item.profileName || 'Unknown';
      if (!groups[pName]) groups[pName] = { name: pName, total: 0, history: [] };
      groups[pName].total++;
      groups[pName].history.push(item);
    });

    return Object.values(groups).map(g => {
      const sortedHistory = [...g.history].reverse(); 
      const trends = {
        coatingUp: sortedHistory.map(item => parseFloat(item.raUp || '0')),
        coatingLo: sortedHistory.map(item => parseFloat(item.raLo || '0')),
        binderPercent: sortedHistory.map(item => parseFloat(item.binderPercent || '0')),
        amountOfBinder: sortedHistory.map(item => parseFloat(item.amountOfBinder || '0'))
      };
      return { ...g, trends };
    });
  }, [inspections, trendFilterProfile, trendFilterMonth]);

  const formatSpecValue = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    return String(val);
  };

  const selectProfile = (profile: CoatingProfileSpec) => {
    const tapeMaxUp = profile.scothMagicTapeMaxUp || profile.scothMagicTapeMax || profile.scothMagicTapeUp || profile.scothMagicTape || '0.50';
    const tapeMaxLo = profile.scothMagicTapeMaxLo || profile.scothMagicTapeMax || profile.scothMagicTapeLo || profile.scothMagicTape || '0.50';
    const stdLen = formatSpecValue(profile.stdLength) || '200';
    const stdCoatW = formatSpecValue(profile.stdCoatingWidth) || '100';

    const newHeader = {
      ...headerInfo,
      profileName: profile.name,
      reqWidthMin: formatSpecValue(profile.widthMin),
      reqWidthMax: formatSpecValue(profile.widthMax),
      reqHeightMin: formatSpecValue(profile.heightMin),
      reqHeightMax: formatSpecValue(profile.heightMax),
      reqBinderMin: formatSpecValue(profile.binderMin),
      reqBinderMax: formatSpecValue(profile.binderMax),
      reqAmtBinderMin: formatSpecValue(profile.amtBinderMin),
      reqAmtBinderMax: formatSpecValue(profile.amtBinderMax),
      reqCoatingWtMinUp: formatSpecValue(profile.coatingWtMinUp),
      reqCoatingWtMaxUp: formatSpecValue(profile.coatingWtMaxUp),
      reqPencilHardnessUp: formatSpecValue(profile.pencilHardnessUp),
      reqCoatingWtMinLo: formatSpecValue(profile.coatingWtMinLo),
      reqCoatingWtMaxLo: formatSpecValue(profile.coatingWtMaxLo),
      reqPencilHardnessLo: formatSpecValue(profile.pencilHardnessLo),
      reqScothMagicTapeMax: formatSpecValue(tapeMaxUp),
      reqScothMagicTapeMaxUp: formatSpecValue(tapeMaxUp),
      reqScothMagicTapeMaxLo: formatSpecValue(tapeMaxLo),
      reqScothMagicTape: formatSpecValue(tapeMaxUp),
      reqScothMagicTapeUp: formatSpecValue(tapeMaxUp),
      reqScothMagicTapeLo: formatSpecValue(tapeMaxLo),
      stdLength: stdLen,
      stdCoatingWidth: stdCoatW
    };

    setHeaderInfo(newHeader);
    setProfileStatus('found');

    setBatchItems(prevItems => prevItems.map(item => {
      const updated = {
        ...item,
        length: stdLen,
        coatingWidth: stdCoatW
      };
      const autos = calculateAutoFields(updated, newHeader);
      return { ...updated, ...autos };
    }));
  };

  useEffect(() => {
    if (headerInfo.profileName) {
      const match = savedProfiles.find(p => p.name.toLowerCase() === headerInfo.profileName.toLowerCase());
      if (match) {
        const tapeMaxUp = match.scothMagicTapeMaxUp || match.scothMagicTapeMax || match.scothMagicTapeUp || match.scothMagicTape || '0.50';
        const tapeMaxLo = match.scothMagicTapeMaxLo || match.scothMagicTapeMax || match.scothMagicTapeLo || match.scothMagicTape || '0.50';
        const stdLen = formatSpecValue(match.stdLength) || '200';
        const stdCoatW = formatSpecValue(match.stdCoatingWidth) || '100';

        setHeaderInfo(prev => ({
          ...prev,
          reqWidthMin: formatSpecValue(match.widthMin),
          reqWidthMax: formatSpecValue(match.widthMax),
          reqHeightMin: formatSpecValue(match.heightMin),
          reqHeightMax: formatSpecValue(match.heightMax),
          reqBinderMin: formatSpecValue(match.binderMin),
          reqBinderMax: formatSpecValue(match.binderMax),
          reqAmtBinderMin: formatSpecValue(match.amtBinderMin),
          reqAmtBinderMax: formatSpecValue(match.amtBinderMax),
          reqCoatingWtMinUp: formatSpecValue(match.coatingWtMinUp),
          reqCoatingWtMaxUp: formatSpecValue(match.coatingWtMaxUp),
          reqPencilHardnessUp: formatSpecValue(match.pencilHardnessUp),
          reqCoatingWtMinLo: formatSpecValue(match.coatingWtMinLo),
          reqCoatingWtMaxLo: formatSpecValue(match.coatingWtMaxLo),
          reqPencilHardnessLo: formatSpecValue(match.pencilHardnessLo),
          reqScothMagicTapeMax: formatSpecValue(tapeMaxUp),
          reqScothMagicTapeMaxUp: formatSpecValue(tapeMaxUp),
          reqScothMagicTapeMaxLo: formatSpecValue(tapeMaxLo),
          reqScothMagicTape: formatSpecValue(tapeMaxUp),
          reqScothMagicTapeUp: formatSpecValue(tapeMaxUp),
          reqScothMagicTapeLo: formatSpecValue(tapeMaxLo),
          stdLength: stdLen,
          stdCoatingWidth: stdCoatW
        }));
        setProfileStatus('found');
      } else {
        setProfileStatus('not-found');
      }
    } else {
      setProfileStatus('not-found');
    }
  }, [headerInfo.profileName, savedProfiles]);

  const handleResetForm = () => {
    setHeaderInfo({
      inspectorName: '',
      shift: '',
      machine: '',
      mixingLot: '',
      date: new Date().toISOString().split('T')[0],
      profileName: '',
      reqWidthMin: '', reqWidthMax: '',
      reqHeightMin: '', reqHeightMax: '',
      reqBinderMin: '', reqBinderMax: '',
      reqAmtBinderMin: '', reqAmtBinderMax: '',
      reqCoatingWtMinUp: '', reqCoatingWtMaxUp: '',
      reqPencilHardnessUp: '',
      reqCoatingWtMinLo: '', reqCoatingWtMaxLo: '',
      reqPencilHardnessLo: '',
      reqScothMagicTapeMax: '0.50',
      reqScothMagicTapeMaxUp: '0.50',
      reqScothMagicTapeMaxLo: '0.50',
      reqScothMagicTape: '0.50',
      reqScothMagicTapeUp: '0.50',
      reqScothMagicTapeLo: '0.50',
      stdLength: '200',
      stdCoatingWidth: '100'
    });
    setProfileStatus('not-found');
    const resetRow = { 
      id: Date.now(), 
      partId: '', 
      lotNumber: '', 
      width: '', 
      heightLeft: '', 
      heightRight: '',
      length: '200', 
      coatingWidth: '100', 
      coatingArea: '0.020000', 
      totalWeight: '', 
      weightAfterDryer: '', 
      wtWithoutCoatUp: '', 
      wtWithoutCoatLo: '',
      binderWt: '', 
      totalCoatBinderWt: '', 
      amountOfBinder: '',
      raUp: '', raLo: '', 
      binderPercent: '', 
      rtUp: '', rtLo: '', 
      scothMagicTapeUp: '',
      scothMagicTapeLo: '',
      scothMagicTape: '',
      status: 'Pending' as 'Pass' | 'Fail' | 'Pending', 
      remarks: '' 
    };
    const autos = calculateAutoFields(resetRow);
    setBatchItems([{ ...resetRow, ...autos }]);
    showNotification(isTh ? 'ล้างข้อมูลฟอร์มเรียบร้อยแล้ว' : 'Form reset successfully');
  };

  const handleSaveProfile = () => {
    if (!headerInfo.profileName.trim()) {
      showNotification(isTh ? 'กรุณาระบุชื่อ Profile ก่อนบันทึก' : 'Please specify Profile Name', 'error');
      return;
    }

    const tapeUp = headerInfo.reqScothMagicTapeMaxUp || headerInfo.reqScothMagicTapeUp || '0.50';
    const tapeLo = headerInfo.reqScothMagicTapeMaxLo || headerInfo.reqScothMagicTapeLo || '0.50';

    const newProfile: CoatingProfileSpec = {
      name: headerInfo.profileName.trim(),
      widthMin: headerInfo.reqWidthMin, widthMax: headerInfo.reqWidthMax,
      heightMin: headerInfo.reqHeightMin, heightMax: headerInfo.reqHeightMax,
      binderMin: headerInfo.reqBinderMin, binderMax: headerInfo.reqBinderMax,
      amtBinderMin: headerInfo.reqAmtBinderMin, amtBinderMax: headerInfo.reqAmtBinderMax,
      coatingWtMinUp: headerInfo.reqCoatingWtMinUp, coatingWtMaxUp: headerInfo.reqCoatingWtMaxUp,
      pencilHardnessUp: headerInfo.reqPencilHardnessUp,
      coatingWtMinLo: headerInfo.reqCoatingWtMinLo, coatingWtMaxLo: headerInfo.reqCoatingWtMaxLo,
      pencilHardnessLo: headerInfo.reqPencilHardnessLo,
      scothMagicTapeMax: tapeUp,
      scothMagicTapeMaxUp: tapeUp,
      scothMagicTapeMaxLo: tapeLo,
      scothMagicTape: tapeUp,
      scothMagicTapeUp: tapeUp,
      scothMagicTapeLo: tapeLo,
      stdLength: headerInfo.stdLength,
      stdCoatingWidth: headerInfo.stdCoatingWidth
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

    showNotification(isTh ? `บันทึก Profile "${newProfile.name}" เรียบร้อยแล้ว` : `Saved Profile "${newProfile.name}"`);
  };

  const handleDeleteProfile = (profileName: string) => {
    setSavedProfiles(prev => prev.filter(p => p.name !== profileName));
    if (headerInfo.profileName === profileName) {
      setHeaderInfo(prev => ({ ...prev, profileName: '' }));
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

  const isScothTapeFail = (measuredStr?: string, maxLimitStr?: string) => {
    if (!measuredStr || measuredStr.trim() === '') return false;
    const s = measuredStr.trim().toLowerCase();
    if (s === '-' || s === 'n/a' || s === 'none' || s === 'untested') return false;
    if (s === 'fail' || s === 'ng') return true;
    if (s === 'pass' || s === 'ok' || s === 'no peeling') return false;
    const val = parseFloat(measuredStr);
    const max = parseFloat(maxLimitStr || '0.50');
    if (!isNaN(val) && !isNaN(max) && max > 0) {
      // Must be less than or equal to standard limit (ค่าน้อยกว่าหรือเท่ากับมาตรฐาน)
      return val > max;
    }
    return false;
  };

  const judgeStatus = (item: typeof batchItems[0]): 'Pass' | 'Fail' | 'Pending' => {
    let pass = true;

    const checkMinMax = (valStr?: string, minStr?: string, maxStr?: string) => {
      if (!valStr) return;
      const s = String(valStr).trim();
      if (s === '' || s === '-' || s === 'N/A') return; // Ignored if unmeasured
      const v = parseFloat(s);
      if (isNaN(v)) return;
      const minVal = parseFloat(minStr || '0');
      const maxVal = parseFloat(maxStr || '0');
      if (minStr && minStr !== '' && minVal > 0 && v < minVal) pass = false;
      if (maxStr && maxStr !== '' && maxVal > 0 && v > maxVal) pass = false;
    };

    checkMinMax(item.width, headerInfo.reqWidthMin, headerInfo.reqWidthMax);
    checkMinMax(item.heightLeft, headerInfo.reqHeightMin, headerInfo.reqHeightMax);
    checkMinMax(item.heightRight, headerInfo.reqHeightMin, headerInfo.reqHeightMax);
    checkMinMax(item.raUp, headerInfo.reqCoatingWtMinUp, headerInfo.reqCoatingWtMaxUp);
    checkMinMax(item.raLo, headerInfo.reqCoatingWtMinLo, headerInfo.reqCoatingWtMaxLo);
    checkMinMax(item.binderPercent, headerInfo.reqBinderMin, headerInfo.reqBinderMax);
    checkMinMax(item.amountOfBinder, headerInfo.reqAmtBinderMin, headerInfo.reqAmtBinderMax);

    // Scoth Magic Tape evaluation (Weight check: measured weight must be <= standard max limit)
    const maxTapeUp = headerInfo.reqScothMagicTapeMaxUp || headerInfo.reqScothMagicTapeUp || headerInfo.reqScothMagicTapeMax || '0.50';
    const maxTapeLo = headerInfo.reqScothMagicTapeMaxLo || headerInfo.reqScothMagicTapeLo || headerInfo.reqScothMagicTapeMax || '0.50';

    if (isScothTapeFail(item.scothMagicTapeUp, maxTapeUp)) pass = false;
    if (isScothTapeFail(item.scothMagicTapeLo, maxTapeLo)) pass = false;
    if (isScothTapeFail(item.scothMagicTape, maxTapeUp)) pass = false;

    if (!item.lotNumber && !item.totalWeight && !item.partId) return 'Pending';

    return pass ? 'Pass' : 'Fail';
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addRow = () => {
    const lastItem = batchItems[batchItems.length - 1];
    const newItem = { 
      id: Date.now() + Math.random(), 
      partId: lastItem ? lastItem.partId : '', 
      lotNumber: lastItem ? lastItem.lotNumber : '', 
      width: headerInfo.reqWidthMin || (lastItem ? lastItem.width : ''),
      heightLeft: lastItem ? lastItem.heightLeft : '',
      heightRight: lastItem ? lastItem.heightRight : '',
      length: headerInfo.stdLength || (lastItem ? lastItem.length : '100'),
      coatingWidth: headerInfo.stdCoatingWidth || (lastItem ? lastItem.coatingWidth : '100'),
      coatingArea: '',
      totalWeight: '',
      weightAfterDryer: '',
      wtWithoutCoatUp: '',
      wtWithoutCoatLo: '',
      binderWt: '',
      totalCoatBinderWt: '',
      amountOfBinder: '',
      raUp: '', raLo: '', binderPercent: '',
      rtUp: headerInfo.reqPencilHardnessUp || '', 
      rtLo: headerInfo.reqPencilHardnessLo || '', 
      scothMagicTapeUp: headerInfo.reqScothMagicTapeUp || (lastItem ? lastItem.scothMagicTapeUp : 'Pass') || 'Pass',
      scothMagicTapeLo: headerInfo.reqScothMagicTapeLo || (lastItem ? lastItem.scothMagicTapeLo : 'Pass') || 'Pass',
      scothMagicTape: headerInfo.reqScothMagicTape || (lastItem ? lastItem.scothMagicTape : 'Pass') || 'Pass',
      status: 'Pending' as 'Pass' | 'Fail' | 'Pending', 
      remarks: '' 
    };
    const autos = calculateAutoFields(newItem);
    setBatchItems(prev => [...prev, { ...newItem, ...autos }]);
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHeaderInfo(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'stdLength' || name === 'stdCoatingWidth') {
        setBatchItems(prevItems => prevItems.map(item => {
          const updated = {
            ...item,
            length: name === 'stdLength' ? value : (item.length || next.stdLength),
            coatingWidth: name === 'stdCoatingWidth' ? value : (item.coatingWidth || next.stdCoatingWidth)
          };
          const autos = calculateAutoFields(updated, next);
          return { ...updated, ...autos };
        }));
      }
      return next;
    });
  };

  const handleItemChange = (id: number, field: string, value: string) => {
    setBatchItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        const autos = calculateAutoFields(updated, headerInfo);
        return { ...updated, ...autos };
      }
      return item;
    }));
  };

  const saveBatch = () => {
    const validItems = batchItems.filter(item => (item.partId || item.lotNumber) && judgeStatus(item) !== 'Pending');
    if (validItems.length === 0) {
      showNotification(isTh ? 'กรุณากรอกข้อมูลให้ครบถ้วนอย่างน้อย 1 รายการ' : 'Please enter inspection data', 'error');
      return;
    }

    const now = new Date();
    const newRecords: CoatingInspectionRecord[] = validItems.map(item => {
      const decision = judgeStatus(item);
      const recId = `rec-coat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      if (onLogNewActivity) {
        onLogNewActivity({
          id: recId,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'IPQA-04',
          moduleTitleTh: 'การตรวจวัดการเคลือบผิว (Coating Measurement)',
          moduleTitleEn: 'Coating Thickness, Area & Binder Measurement System',
          inspector: headerInfo.inspectorName || 'Coating Technician',
          shift: headerInfo.shift || '',
          batchLot: `${headerInfo.profileName} - ${item.lotNumber}`,
          result: decision === 'Pass' ? 'PASS' : 'REJECT',
          defectCount: decision === 'Fail' ? 1 : 0,
          remarks: `Coat Wt: ${item.raUp}/${item.raLo}, Binder%: ${item.binderPercent}%, AmtBinder: ${item.amountOfBinder}, Scoth Tape: ${item.scothMagicTapeUp || 'Pass'}/${item.scothMagicTapeLo || 'Pass'}`
        });
      }

      return {
        id: recId,
        lotNumber: item.lotNumber.trim().toUpperCase() || 'COIL-UNTITLED',
        partId: item.partId.trim().toUpperCase() || 'UP-SIDE',
        mixingLot: headerInfo.mixingLot,
        width: item.width,
        heightLeft: item.heightLeft,
        heightRight: item.heightRight,
        length: item.length,
        coatingWidth: item.coatingWidth,
        coatingArea: item.coatingArea,
        totalWeight: item.totalWeight,
        weightAfterDryer: item.weightAfterDryer,
        wtWithoutCoatUp: item.wtWithoutCoatUp,
        wtWithoutCoatLo: item.wtWithoutCoatLo,
        binderWt: item.binderWt,
        totalCoatBinderWt: item.totalCoatBinderWt,
        raUp: item.raUp,
        raLo: item.raLo,
        binderPercent: item.binderPercent,
        amountOfBinder: item.amountOfBinder,
        rtUp: item.rtUp,
        rtLo: item.rtLo,
        scothMagicTape: item.scothMagicTape || item.scothMagicTapeUp || 'Pass',
        scothMagicTapeUp: item.scothMagicTapeUp || 'Pass',
        scothMagicTapeLo: item.scothMagicTapeLo || 'Pass',
        status: decision,
        remarks: item.remarks,
        profileName: headerInfo.profileName,
        inspectorName: headerInfo.inspectorName || 'Coating Inspector',
        shift: headerInfo.shift || '',
        machine: headerInfo.machine || 'COAT-LINE-01',
        date: headerInfo.date,
        timestamp: now.toLocaleString('th-TH')
      };
    });

    setInspections(prev => [...newRecords, ...prev]);
    showNotification(isTh ? `บันทึกข้อมูล ${validItems.length} รายการเรียบร้อยแล้ว` : `Saved ${validItems.length} inspection items`);

    const resetRow = { 
      id: Date.now(), 
      partId: '', lotNumber: '', width: '', heightLeft: '', heightRight: '', 
      length: headerInfo.stdLength || '100', coatingWidth: headerInfo.stdCoatingWidth || '100',
      coatingArea: '0.010000', totalWeight: '', weightAfterDryer: '', wtWithoutCoatUp: '', wtWithoutCoatLo: '',
      binderWt: '', totalCoatBinderWt: '', amountOfBinder: '', raUp: '', raLo: '', binderPercent: '',
      rtUp: headerInfo.reqPencilHardnessUp || '', rtLo: headerInfo.reqPencilHardnessLo || '',
      scothMagicTapeUp: headerInfo.reqScothMagicTapeUp || 'Pass',
      scothMagicTapeLo: headerInfo.reqScothMagicTapeLo || 'Pass',
      scothMagicTape: headerInfo.reqScothMagicTape || 'Pass',
      status: 'Pending' as 'Pass' | 'Fail' | 'Pending', remarks: '' 
    };
    const resetAutos = calculateAutoFields(resetRow);
    setBatchItems([{ ...resetRow, ...resetAutos }]);

    setActiveTab('history');
  };

  const isOutOfSpec = (val?: string, min?: string, max?: string) => {
    if (!val || val === '') return false;
    const v = parseFloat(val);
    if (isNaN(v)) return false;
    const minVal = parseFloat(min || '0');
    const maxVal = parseFloat(max || '0');
    if (min && min !== '' && minVal > 0 && v < minVal) return true;
    if (max && max !== '' && maxVal > 0 && v > maxVal) return true;
    return false;
  };

  const exportToExcel = () => {
    if (inspections.length === 0) {
      showNotification(isTh ? 'ไม่มีข้อมูลสำหรับ Export' : 'No history to export', 'error');
      return;
    }

    const headers = [
      'Timestamp', 'Inspector', 'Machine', 'Mixing Lot', 'Profile Name', 'Coil No', 'Side', 
      'Width', 'H-Left', 'H-Right', 'Length', 'Coating Width', 'Coating Area',
      'Total Wt', 'Dryer Wt', 'Empty Up', 'Empty Lo', 'Binder Wt', 'Coat+Binder Wt',
      'Coating Wt Up', 'Coating Wt Lo', 'Binder %', 'Amount of Binder', 'Hardness Up', 'Hardness Lo',
      'Scoth Magic Tape Up', 'Scoth Magic Tape Lo', 'Status'
    ];

    const csvRows = inspections.map(ins => [
      `"${ins.timestamp}"`,
      `"${ins.inspectorName}"`,
      `"${ins.machine || '-'}"`,
      `"${ins.mixingLot || '-'}"`,
      `"${ins.profileName}"`,
      `"${ins.lotNumber}"`,
      `"${ins.partId}"`,
      ins.width || '-', ins.heightLeft || '-', ins.heightRight || '-',
      ins.length || '-', ins.coatingWidth || '-', ins.coatingArea || '-',
      ins.totalWeight || '-', ins.weightAfterDryer || '-', ins.wtWithoutCoatUp || '-', ins.wtWithoutCoatLo || '-',
      ins.binderWt || '-', ins.totalCoatBinderWt || '-',
      ins.raUp || '-', ins.raLo || '-', ins.binderPercent || '-', ins.amountOfBinder || '-',
      `"${ins.rtUp || '-'}"`, `"${ins.rtLo || '-'}"`,
      `"${ins.scothMagicTapeUp || ins.scothMagicTape || '-'}"`, `"${ins.scothMagicTapeLo || '-'}"`,
      `"${ins.status}"`
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Coating_Inspection_${new Date().toISOString().split('T')[0]}.csv`);
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
      (i.mixingLot && i.mixingLot.toLowerCase().includes(term))
    );
  }, [inspections, historySearchTerm]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-4 sm:p-6 space-y-6">

      {/* Admin Verification Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Admin Verification</h3>
              <p className="text-xs text-slate-400">
                {isTh ? 'กรุณาระบุรหัสผ่านเพื่อตั้งค่า Profile Spec (admin2026)' : 'Enter admin password to manage profile specifications'}
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
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  IPQA-04
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {isTh ? 'การตรวจวัดการเคลือบผิว (Coating Measurement)' : 'Coating Measurement System'}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTh 
                  ? 'คำนวณ Coating Area, Total Wt, Dryer Wt, Coating Wt Up/Lo, Binder % และ Amount of Binder' 
                  : 'Coating thickness, area, binder weight, coating weight & hardness measurement system'}
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

      {/* Notifications */}
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
          {/* Header Metadata */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
                  list="coating-shift-options"
                  type="text"
                  name="shift"
                  value={headerInfo.shift}
                  onChange={handleHeaderChange}
                  placeholder="e.g. Day / Night / Shift A..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
                <datalist id="coating-shift-options">
                  <option value="Day (กะกลางวัน / A)" />
                  <option value="Night (กะกลางคืน / B)" />
                  <option value="Shift A" />
                  <option value="Shift B" />
                  <option value="Shift C" />
                </datalist>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Machine No.
                </label>
                <input
                  type="text"
                  name="machine"
                  value={headerInfo.machine}
                  onChange={handleHeaderChange}
                  placeholder={isTh ? 'เช่น COAT-LINE-01' : 'Machine No.'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Mixing Lot
                </label>
                <input
                  type="text"
                  name="mixingLot"
                  value={headerInfo.mixingLot}
                  onChange={handleHeaderChange}
                  placeholder={isTh ? 'เช่น MIX-2026-B08' : 'Mixing Lot'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

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

            {/* Spec summary row */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs grid grid-cols-1 sm:grid-cols-5 gap-2 text-slate-300">
              <div><span className="text-slate-500">Width Spec:</span> <strong className="text-indigo-300">{headerInfo.reqWidthMin ? `${headerInfo.reqWidthMin} - ${headerInfo.reqWidthMax} mm` : '-'}</strong></div>
              <div><span className="text-slate-500">Coating Wt:</span> <strong className="text-emerald-300">{headerInfo.reqCoatingWtMinUp ? `${headerInfo.reqCoatingWtMinUp} - ${headerInfo.reqCoatingWtMaxUp} g/m²` : '-'}</strong></div>
              <div><span className="text-slate-500">Binder %:</span> <strong className="text-amber-300">{headerInfo.reqBinderMin ? `${headerInfo.reqBinderMin} - ${headerInfo.reqBinderMax} %` : '-'}</strong></div>
              <div><span className="text-slate-500">Amt Binder:</span> <strong className="text-purple-300">{headerInfo.reqAmtBinderMin ? `${headerInfo.reqAmtBinderMin} - ${headerInfo.reqAmtBinderMax} g/m²` : '-'}</strong></div>
              <div>
                <span className="text-slate-500">Scoth Tape Limit:</span>{' '}
                <strong className="text-pink-300 font-mono">
                  ≤ {headerInfo.reqScothMagicTapeMaxUp || headerInfo.reqScothMagicTapeUp || headerInfo.reqScothMagicTapeMax || '0.50'} g/m²
                </strong>
              </div>
            </div>
          </div>

          {/* Measurement Table */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md overflow-hidden" ref={tableRef}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                {isTh ? '2. ตารางบันทึกค่าการเคลือบผิว (Coating Measurement Entry)' : '2. Coating Entry Table'}
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
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="px-3 py-3 w-56">Coil Info (Side / Dimension)</th>
                      <th className="px-3 py-3 text-center bg-indigo-950/30 text-indigo-300 border-l border-slate-800" colSpan={4}>
                        Weight Inputs (Total / Dryer / Empty Up / Lo)
                      </th>
                      <th className="px-3 py-3 text-center bg-emerald-950/30 text-emerald-300 border-l border-slate-800" colSpan={4}>
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Calculated Coating & Binder Metrics</span>
                          <button
                            type="button"
                            onClick={() => setShowFormulaModal(true)}
                            className="text-emerald-400 hover:text-emerald-200 bg-emerald-900/50 hover:bg-emerald-800/80 px-1.5 py-0.5 rounded text-[9px] font-bold inline-flex items-center gap-0.5 border border-emerald-500/30 transition cursor-pointer"
                            title="View Calculation Formulas"
                          >
                            <Calculator className="w-3 h-3" />
                            <span>Formula fx</span>
                          </button>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center bg-purple-950/30 text-purple-300 border-l border-slate-800" colSpan={2}>
                        Hardness
                      </th>
                      <th className="px-3 py-3 text-center bg-pink-950/30 text-pink-300 border-l border-slate-800" colSpan={2}>
                        <div className="flex flex-col items-center justify-center">
                          <span>Scoth Magic Tape</span>
                          <span className="text-[9px] text-pink-400 font-mono font-normal">
                            ≤ {headerInfo.reqScothMagicTapeMaxUp || headerInfo.reqScothMagicTapeUp || headerInfo.reqScothMagicTapeMax || '0.50'} g/m²
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center border-l border-slate-800">Status</th>
                      <th className="px-3 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {batchItems.map((item) => {
                      const currentStatus = judgeStatus(item);

                      const isWidthFail = isOutOfSpec(item.width, headerInfo.reqWidthMin, headerInfo.reqWidthMax);
                      const isHLeftFail = isOutOfSpec(item.heightLeft, headerInfo.reqHeightMin, headerInfo.reqHeightMax);
                      const isHRightFail = isOutOfSpec(item.heightRight, headerInfo.reqHeightMin, headerInfo.reqHeightMax);
                      const isCoatUpFail = isOutOfSpec(item.raUp, headerInfo.reqCoatingWtMinUp, headerInfo.reqCoatingWtMaxUp);
                      const isCoatLoFail = isOutOfSpec(item.raLo, headerInfo.reqCoatingWtMinLo, headerInfo.reqCoatingWtMaxLo);
                      const isBinderPctFail = isOutOfSpec(item.binderPercent, headerInfo.reqBinderMin, headerInfo.reqBinderMax);
                      const isAmtBinderFail = isOutOfSpec(item.amountOfBinder, headerInfo.reqAmtBinderMin, headerInfo.reqAmtBinderMax);

                      const tapeLimitUp = headerInfo.reqScothMagicTapeMaxUp || headerInfo.reqScothMagicTapeUp || headerInfo.reqScothMagicTapeMax || '0.50';
                      const tapeLimitLo = headerInfo.reqScothMagicTapeMaxLo || headerInfo.reqScothMagicTapeLo || headerInfo.reqScothMagicTapeMax || '0.50';
                      const isTapeUpFail = isScothTapeFail(item.scothMagicTapeUp, tapeLimitUp);
                      const isTapeLoFail = isScothTapeFail(item.scothMagicTapeLo, tapeLimitLo);

                      return (
                        <tr key={item.id} className="hover:bg-slate-950/50 transition-colors">
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex gap-1.5 items-center">
                                <input 
                                  type="text" 
                                  placeholder="Coil No." 
                                  value={item.lotNumber} 
                                  onChange={(e) => handleItemChange(item.id, 'lotNumber', e.target.value)} 
                                  className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold text-slate-200 uppercase focus:outline-none focus:border-indigo-500" 
                                />
                                <input 
                                  type="text" 
                                  placeholder="Side" 
                                  value={item.partId} 
                                  onChange={(e) => handleItemChange(item.id, 'partId', e.target.value)} 
                                  className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold text-slate-200 uppercase focus:outline-none focus:border-indigo-500" 
                                />
                              </div>
                              <div className="flex gap-1 items-center">
                                <input 
                                  type="number" 
                                  placeholder="Width" 
                                  value={item.width} 
                                  onChange={(e) => handleItemChange(item.id, 'width', e.target.value)} 
                                  className={`w-16 border rounded-lg px-1.5 py-1 text-[11px] font-bold outline-none ${
                                    isWidthFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'
                                  }`} 
                                />
                                <input 
                                  type="number" step="0.01" 
                                  placeholder="H-L" 
                                  value={item.heightLeft} 
                                  onChange={(e) => handleItemChange(item.id, 'heightLeft', e.target.value)} 
                                  className={`w-14 border rounded-lg px-1.5 py-1 text-[11px] font-bold outline-none ${
                                    isHLeftFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'
                                  }`} 
                                />
                                <input 
                                  type="number" step="0.01" 
                                  placeholder="H-R" 
                                  value={item.heightRight} 
                                  onChange={(e) => handleItemChange(item.id, 'heightRight', e.target.value)} 
                                  className={`w-14 border rounded-lg px-1.5 py-1 text-[11px] font-bold outline-none ${
                                    isHRightFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'
                                  }`} 
                                />
                              </div>
                            </div>
                          </td>

                          {/* Weight Inputs */}
                          <td className="px-2 py-2.5 text-center bg-indigo-950/10 border-l border-slate-800" colSpan={4}>
                            <div className="grid grid-cols-2 gap-1.5">
                              <input 
                                type="number" step="0.0001" 
                                placeholder="Total Wt (g)" 
                                value={item.totalWeight} 
                                onChange={(e) => handleItemChange(item.id, 'totalWeight', e.target.value)} 
                                className="w-full bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg px-1.5 py-1 text-xs text-center font-bold"
                              />
                              <input 
                                type="number" step="0.0001" 
                                placeholder="Dryer Wt (g)" 
                                value={item.weightAfterDryer} 
                                onChange={(e) => handleItemChange(item.id, 'weightAfterDryer', e.target.value)} 
                                className="w-full bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg px-1.5 py-1 text-xs text-center font-bold"
                              />
                              <input 
                                type="number" step="0.0001" 
                                placeholder="Empty Up (g)" 
                                value={item.wtWithoutCoatUp} 
                                onChange={(e) => handleItemChange(item.id, 'wtWithoutCoatUp', e.target.value)} 
                                className="w-full bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg px-1.5 py-1 text-xs text-center font-bold"
                              />
                              <input 
                                type="number" step="0.0001" 
                                placeholder="Empty Lo (g)" 
                                value={item.wtWithoutCoatLo} 
                                onChange={(e) => handleItemChange(item.id, 'wtWithoutCoatLo', e.target.value)} 
                                className="w-full bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg px-1.5 py-1 text-xs text-center font-bold"
                              />
                            </div>
                          </td>

                          {/* Calculated Metrics */}
                          <td className="px-2 py-2.5 text-center bg-emerald-950/10 border-l border-slate-800" colSpan={4}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              <div className="flex flex-col">
                                <span className="text-[9px] text-slate-500 font-bold">Coat Wt Up</span>
                                <input 
                                  type="text" readOnly value={item.raUp || '-'} 
                                  className={`w-full text-center border rounded-lg px-1 py-1 font-bold text-xs ${
                                    isCoatUpFail ? 'border-rose-500 bg-rose-950 text-rose-300' : 'bg-slate-950 border-slate-800 text-emerald-400'
                                  }`} 
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] text-slate-500 font-bold">Coat Wt Lo</span>
                                <input 
                                  type="text" readOnly value={item.raLo || '-'} 
                                  className={`w-full text-center border rounded-lg px-1 py-1 font-bold text-xs ${
                                    isCoatLoFail ? 'border-rose-500 bg-rose-950 text-rose-300' : 'bg-slate-950 border-slate-800 text-emerald-400'
                                  }`} 
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] text-slate-500 font-bold">Binder %</span>
                                <input 
                                  type="text" readOnly value={item.binderPercent ? `${item.binderPercent}%` : '-'} 
                                  className={`w-full text-center border rounded-lg px-1 py-1 font-bold text-xs ${
                                    isBinderPctFail ? 'border-rose-500 bg-rose-950 text-rose-300' : 'bg-slate-950 border-slate-800 text-amber-400'
                                  }`} 
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] text-slate-500 font-bold">Amt Binder</span>
                                <input 
                                  type="text" readOnly value={item.amountOfBinder || '-'} 
                                  className={`w-full text-center border rounded-lg px-1 py-1 font-bold text-xs ${
                                    isAmtBinderFail ? 'border-rose-500 bg-rose-950 text-rose-300' : 'bg-slate-950 border-slate-800 text-purple-400'
                                  }`} 
                                />
                              </div>
                            </div>
                          </td>

                          {/* Hardness */}
                          <td className="px-2 py-2.5 text-center bg-purple-950/10 border-l border-slate-800" colSpan={2}>
                            <div className="flex gap-1.5 justify-center">
                              <input 
                                type="text" placeholder="Up" value={item.rtUp} 
                                onChange={(e) => handleItemChange(item.id, 'rtUp', e.target.value)} 
                                className="w-14 bg-slate-950 border border-slate-800 text-purple-300 rounded-lg px-1 py-1 text-center font-bold text-xs" 
                              />
                              <input 
                                type="text" placeholder="Lo" value={item.rtLo} 
                                onChange={(e) => handleItemChange(item.id, 'rtLo', e.target.value)} 
                                className="w-14 bg-slate-950 border border-slate-800 text-purple-300 rounded-lg px-1 py-1 text-center font-bold text-xs" 
                              />
                            </div>
                          </td>

                          {/* Scoth Magic Tape Weight Inputs */}
                          <td className="px-2 py-2.5 text-center bg-pink-950/10 border-l border-slate-800" colSpan={2}>
                            <div className="flex gap-1.5 justify-center items-center">
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] text-slate-500 font-bold">Up (g/m²)</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder={`≤ ${tapeLimitUp}`}
                                  value={item.scothMagicTapeUp || ''}
                                  onChange={(e) => handleItemChange(item.id, 'scothMagicTapeUp', e.target.value)}
                                  className={`w-16 text-center text-[11px] font-bold rounded-lg px-1 py-1 border outline-none font-mono ${
                                    isTapeUpFail
                                      ? 'bg-rose-950/80 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                                      : item.scothMagicTapeUp && item.scothMagicTapeUp !== ''
                                      ? 'bg-slate-950 border-emerald-500/50 text-emerald-300'
                                      : 'bg-slate-950 border-slate-800 text-pink-300 focus:border-pink-500'
                                  }`}
                                />
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] text-slate-500 font-bold">Lo (g/m²)</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder={`≤ ${tapeLimitLo}`}
                                  value={item.scothMagicTapeLo || ''}
                                  onChange={(e) => handleItemChange(item.id, 'scothMagicTapeLo', e.target.value)}
                                  className={`w-16 text-center text-[11px] font-bold rounded-lg px-1 py-1 border outline-none font-mono ${
                                    isTapeLoFail
                                      ? 'bg-rose-950/80 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                                      : item.scothMagicTapeLo && item.scothMagicTapeLo !== ''
                                      ? 'bg-slate-950 border-emerald-500/50 text-emerald-300'
                                      : 'bg-slate-950 border-slate-800 text-pink-300 focus:border-pink-500'
                                  }`}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2.5 text-center border-l border-slate-800">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              currentStatus === 'Pass' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                : currentStatus === 'Fail' 
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {currentStatus}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => setBatchItems(prev => prev.filter(i => i.id !== item.id))}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* TAB 2: PROFILE SPEC SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <span>{isTh ? 'การตั้งค่า Profile Specification (Admin Only)' : 'Profile Specification Management'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isTh ? 'กำหนดเกณฑ์มาตรฐาน (Min / Max) สำหรับประเมินผล Coating' : 'Define Min/Max specification limits for Coating parameters'}
              </p>
            </div>

            <button
              onClick={handleSaveProfile}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{isTh ? 'บันทึก Profile Spec' : 'Save Profile Spec'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Saved Profiles List */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {isTh ? 'รายการ Profile ที่บันทึกไว้' : 'Saved Profiles'}
              </h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {savedProfiles.map((p) => (
                  <div
                    key={p.name}
                    onClick={() => selectProfile(p)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      headerInfo.profileName === p.name
                        ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Coat: {p.coatingWtMinUp}-{p.coatingWtMaxUp} | Binder: {p.binderMin}-{p.binderMax}% | Tape Max: ≤{p.scothMagicTapeMaxUp || p.scothMagicTapeMax || p.scothMagicTapeUp || p.scothMagicTape || '0.50'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ type: 'profile', id: p.name, label: p.name });
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Spec Editor */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Profile Name *
                </label>
                <input
                  type="text"
                  name="profileName"
                  value={headerInfo.profileName}
                  onChange={handleHeaderChange}
                  placeholder="e.g. Standard_Coating_01"
                  className="w-full bg-slate-950 border border-slate-800 text-indigo-300 font-bold rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-400">Width Specification (mm)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Min Width</label>
                      <input type="number" name="reqWidthMin" value={headerInfo.reqWidthMin} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Width</label>
                      <input type="number" name="reqWidthMax" value={headerInfo.reqWidthMax} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-400">Height Specification (mm)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Min Height</label>
                      <input type="number" step="0.01" name="reqHeightMin" value={headerInfo.reqHeightMin} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Height</label>
                      <input type="number" step="0.01" name="reqHeightMax" value={headerInfo.reqHeightMax} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-emerald-400">Coating Wt Up Specification (g/m²)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Min Coating Wt</label>
                      <input type="number" step="0.1" name="reqCoatingWtMinUp" value={headerInfo.reqCoatingWtMinUp} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Coating Wt</label>
                      <input type="number" step="0.1" name="reqCoatingWtMaxUp" value={headerInfo.reqCoatingWtMaxUp} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-amber-400">Binder % Specification (%)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Min Binder %</label>
                      <input type="number" step="0.1" name="reqBinderMin" value={headerInfo.reqBinderMin} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Binder %</label>
                      <input type="number" step="0.1" name="reqBinderMax" value={headerInfo.reqBinderMax} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-purple-400">Amount of Binder Spec (g/m²)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Min Amt Binder</label>
                      <input type="number" step="0.1" name="reqAmtBinderMin" value={headerInfo.reqAmtBinderMin} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Amt Binder</label>
                      <input type="number" step="0.1" name="reqAmtBinderMax" value={headerInfo.reqAmtBinderMax} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-pink-400">Scoth Magic Tape (Max Weight Limit)</h5>
                    <span className="text-[10px] text-pink-400 font-mono font-bold">≤ มาตรฐาน</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Limit Up (g/m²)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="reqScothMagicTapeMaxUp"
                        value={headerInfo.reqScothMagicTapeMaxUp || headerInfo.reqScothMagicTapeUp || ''}
                        onChange={handleHeaderChange}
                        placeholder="e.g. 0.50"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-pink-300 font-mono font-bold focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Limit Lo (g/m²)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="reqScothMagicTapeMaxLo"
                        value={headerInfo.reqScothMagicTapeMaxLo || headerInfo.reqScothMagicTapeLo || ''}
                        onChange={handleHeaderChange}
                        placeholder="e.g. 0.50"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-pink-300 font-mono font-bold focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isTh ? '* ตรวจสอบน้ำหนักสารเคลือบ ต้องมีค่าน้อยกว่าหรือเท่ากับเกณฑ์ที่กำหนด (≤ Max)' : '* Measured coating weight must be less than or equal to standard limit.'}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-300">Standard Test Dimensions (mm)</h5>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">ใช้ในสูตรคำนวณพื้นที่ (Area)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Std Length (mm)</label>
                      <input type="number" name="stdLength" value={headerInfo.stdLength} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Std Coating Width (mm)</label>
                      <input type="number" name="stdCoatingWidth" value={headerInfo.stdCoatingWidth} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isTh 
                      ? '* ค่า Std Coating Width และ Std Length จะถูกนำไปใช้เป็นตัวหารในสูตรคำนวณ Coating Wt Up, Coating Wt Lo และ Amt Binder โดยอัตโนมัติ' 
                      : '* Std Coating Width and Std Length are automatically used in the calculation denominators for Coating Wt Up, Coating Wt Lo, and Amt Binder.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DASHBOARD & TRENDS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {dashboardStats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">{isTh ? 'จำนวนการตรวจทั้งหมด' : 'Total Inspected'}</div>
                  <div className="text-2xl font-black text-white mt-1">{dashboardStats.total}</div>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">{isTh ? 'ผ่านเกณฑ์ (Pass)' : 'Passed'}</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{dashboardStats.passCount}</div>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">{isTh ? 'ไม่ผ่านเกณฑ์ (Fail)' : 'Failed'}</div>
                  <div className="text-2xl font-black text-rose-400 mt-1">{dashboardStats.failCount}</div>
                </div>
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">{isTh ? 'อัตราผ่านเกณฑ์ (Pass Rate)' : 'Pass Rate'}</div>
                  <div className="text-2xl font-black text-indigo-300 mt-1">{dashboardStats.passRatio}%</div>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-300 rounded-xl border border-indigo-500/20">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
              {isTh ? 'ยังไม่มีข้อมูลการตรวจวัด' : 'No inspection records yet'}
            </div>
          )}

          {/* Sparkline Trends Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>{isTh ? 'แนวโน้มการตรวจวัด (Sparkline Trends)' : 'Measurement Trends'}</span>
              </h3>

              <div className="flex gap-3">
                <select
                  value={trendFilterProfile}
                  onChange={(e) => setTrendFilterProfile(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  {availableProfiles.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <select
                  value={trendFilterMonth}
                  onChange={(e) => setTrendFilterMonth(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTrends.map(group => (
                <div key={group.name} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-300">{group.name}</span>
                    <span className="text-[10px] text-slate-400">{group.total} tests</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Sparkline data={group.trends.coatingUp} color="#10b981" label="Coating Wt Up (g/m²)" />
                    <Sparkline data={group.trends.binderPercent} color="#f59e0b" label="Binder % (%)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HISTORY TABLE */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  placeholder={isTh ? 'ค้นหาตาม Coil No, Profile, Inspector...' : 'Search coil no, profile, inspector...'}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={exportToExcel}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{isTh ? 'ส่งออก CSV / Excel' : 'Export CSV / Excel'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3">Timestamp</th>
                  <th className="px-3 py-3">Coil No.</th>
                  <th className="px-3 py-3">Profile</th>
                  <th className="px-3 py-3">Inspector</th>
                  <th className="px-3 py-3 text-center">Coat Wt (Up/Lo)</th>
                  <th className="px-3 py-3 text-center">Binder %</th>
                  <th className="px-3 py-3 text-center">Amt Binder</th>
                  <th className="px-3 py-3 text-center">Hardness</th>
                  <th className="px-3 py-3 text-center">Scoth Tape</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredInspections.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-950/50 transition">
                    <td className="px-3 py-2.5 text-slate-400 text-[11px]">{ins.timestamp}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-200">{ins.lotNumber}</td>
                    <td className="px-3 py-2.5 text-indigo-300 font-semibold">{ins.profileName}</td>
                    <td className="px-3 py-2.5 text-slate-400">
                      <div>{ins.inspectorName}</div>
                      {ins.shift && <div className="text-[10px] text-slate-500">Shift: {ins.shift}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-center text-emerald-400 font-bold">
                      {ins.raUp || '-'}/{ins.raLo || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center text-amber-400 font-bold">
                      {ins.binderPercent ? `${ins.binderPercent}%` : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center text-purple-400 font-bold">
                      {ins.amountOfBinder || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-300">
                      {ins.rtUp || '-'}/{ins.rtLo || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="inline-flex items-center gap-1 font-mono text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          isScothTapeFail(ins.scothMagicTapeUp || ins.scothMagicTape, ins.scothMagicTapeMaxUp || ins.scothMagicTapeMax || '0.50')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-pink-500/10 text-pink-300 border border-pink-500/20'
                        }`}>
                          U:{ins.scothMagicTapeUp || ins.scothMagicTape || '-'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          isScothTapeFail(ins.scothMagicTapeLo, ins.scothMagicTapeMaxLo || ins.scothMagicTapeMax || '0.50')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-pink-500/10 text-pink-300 border border-pink-500/20'
                        }`}>
                          L:{ins.scothMagicTapeLo || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        ins.status === 'Pass' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {ins.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleRequestEditHistory(ins)}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition border border-amber-500/30 flex items-center gap-1 text-[11px] font-bold"
                          title={isTh ? "แก้ไขข้อมูล (ต้องใส่ Password)" : "Edit Record (Password required)"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isTh ? 'แก้ไข' : 'Edit'}</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'history', id: ins.id!, label: ins.lotNumber })}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                  ? 'กรอกรหัสผ่านเพื่อแก้ไขรายการตรวจวัด IPQA-04 (Password: admin2026)' 
                  : 'Enter password to edit IPQA-04 record (Password: admin2026)'}
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
                    <span>{isTh ? 'รหัสผ่านไม่ถูกต้อง! (กรุณาใช้ admin2026)' : 'Incorrect password! (Use admin2026)'}</span>
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
                    {isTh ? 'แก้ไขข้อมูลการตรวจวัดสารเคลือบผิว (IPQA-04)' : 'Edit Coating Measurement Record'}
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Side / Part ID</label>
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

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Shift (กะ)</label>
                  <input
                    list="edit-coating-shift-options"
                    type="text"
                    placeholder="e.g. Day / Night / Shift A..."
                    value={editingHistoryItem.shift || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, shift: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="edit-coating-shift-options">
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
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Coating Measured Values</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Coat Wt Up (g/m²)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.raUp || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, raUp: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Coat Wt Lo (g/m²)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.raLo || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, raLo: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Binder %</label>
                    <input
                      type="text"
                      value={editingHistoryItem.binderPercent || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, binderPercent: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Amount of Binder</label>
                    <input
                      type="text"
                      value={editingHistoryItem.amountOfBinder || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, amountOfBinder: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-purple-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Hardness Up</label>
                    <input
                      type="text"
                      value={editingHistoryItem.rtUp || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, rtUp: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Hardness Lo</label>
                    <input
                      type="text"
                      value={editingHistoryItem.rtLo || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, rtLo: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-pink-400 uppercase block mb-1">Tape Up (g/m²)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="≤ Max"
                      value={editingHistoryItem.scothMagicTapeUp || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, scothMagicTapeUp: e.target.value, scothMagicTape: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-pink-300 font-bold focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-pink-400 uppercase block mb-1">Tape Lo (g/m²)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="≤ Max"
                      value={editingHistoryItem.scothMagicTapeLo || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, scothMagicTapeLo: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-pink-300 font-bold focus:outline-none focus:border-pink-500"
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

      {/* FORMULA REFERENCE & VERIFICATION MODAL */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-[130] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isTh ? 'สูตรการคำนวณการตรวจวัด IPQA-04' : 'IPQA-04 Calculation Formulas'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isTh ? 'การตรวจวัดการเคลือบผิว (Calculated Coating & Binder Metrics)' : 'Coating & Binder Metrics Calculation Specs'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Formula 1 */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                    1. Coating wt Up (g/m²)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    Formula Verified ✓
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-emerald-300 border border-slate-800 text-xs sm:text-sm text-center">
                  Coating wt Up = (Dryer Wt - Empty Up) / (Std Coating Width × Std Length / 1,000,000)
                </div>
                <p className="text-[11px] text-slate-400">
                  {isTh 
                    ? 'น้ำหนักเคลือบผิวแถบบน = (น้ำหนักหลังอบแห้ง - น้ำหนักแผ่นบนเปล่า) ÷ (Std Coating Width × Std Length ÷ 1,000,000 ม.²)' 
                    : 'Upper coating weight in g/m² = (Dryer Wt - Empty Up) ÷ (Std Coating Width × Std Length / 1,000,000 m²)'}
                </p>
              </div>

              {/* Formula 2 */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                    2. Coating wt Lo (g/m²)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    Formula Verified ✓
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-emerald-300 border border-slate-800 text-xs sm:text-sm text-center">
                  Coating wt Lo = (Empty Up - Empty Lo) / (Std Coating Width × Std Length / 1,000,000)
                </div>
                <p className="text-[11px] text-slate-400">
                  {isTh 
                    ? 'น้ำหนักเคลือบผิวแถบล่าง = (น้ำหนักแผ่นบนเปล่า - น้ำหนักแผ่นล่างเปล่า) ÷ (Std Coating Width × Std Length ÷ 1,000,000 ม.²)' 
                    : 'Lower coating weight in g/m² = (Empty Up - Empty Lo) ÷ (Std Coating Width × Std Length / 1,000,000 m²)'}
                </p>
              </div>

              {/* Formula 3 */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                    3. Binder % (%)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                    Formula Verified ✓
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-amber-300 border border-slate-800 text-xs sm:text-sm text-center">
                  Binder% = (Total Wt - Dryer Wt) / (Total Wt - min(Empty Up, Empty Lo)) × 100
                </div>
                <p className="text-[11px] text-slate-400">
                  {isTh ? 'เปอร์เซ็นต์ไบน์เดอร์ = (น้ำหนักรวม - น้ำหนักหลังอบแห้ง) ÷ (น้ำหนักรวม - ค่าต่ำสุดของ Empty Up/Lo) × 100%' : 'Percentage of binder relative to the total active coating and binder mass.'}
                </p>
              </div>

              {/* Formula 4 */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-400 uppercase tracking-wider text-[11px]">
                    4. Amount of Binder (Amt Binder)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                    Formula Verified ✓
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-purple-300 border border-slate-800 text-xs sm:text-sm text-center">
                  Amt Binder = (Total Wt - Dryer Wt) / ((Std Coating Width × Std Length / 1,000,000) / 2)
                </div>
                <p className="text-[11px] text-slate-400">
                  {isTh 
                    ? 'ปริมาณไบน์เดอร์ = (น้ำหนักรวม - น้ำหนักหลังอบแห้ง) ÷ ((Std Coating Width × Std Length ÷ 1,000,000) ÷ 2)' 
                    : 'Amount of binder = (Total Wt - Dryer Wt) ÷ ((Std Coating Width × Std Length / 1,000,000) / 2)'}
                </p>
              </div>

              {/* Formula 5: Scoth Magic Tape */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-pink-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pink-400 uppercase tracking-wider text-[11px]">
                    5. Scoth Magic Tape (Weight ≤ Max Limit)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono text-[10px] font-bold">
                    Quality Standard ✓
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-pink-300 border border-slate-800 text-xs sm:text-sm text-center">
                  Scoth Magic Tape Weight: Measured Value ≤ Max Limit Spec (g/m²)
                </div>
                <p className="text-[11px] text-slate-400">
                  {isTh ? 'การตรวจวัดน้ำหนักสารเคลือบด้วยเทป Scotch Magic Tape ตรวจสอบทั้งแถบบน (Up) และแถบล่าง (Lo) โดยค่าน้ำหนักสารเคลือบที่ติดเทปต้องมีค่าน้อยกว่าหรือเท่ากับเกณฑ์มาตรฐานที่กำหนด (≤ Max Limit)' : 'Measured coating weight removed by Scotch Magic Tape must be less than or equal to the specified maximum limit (≤ Max Limit).'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFormulaModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-2.5 rounded-xl transition"
              >
                {isTh ? 'ปิดหน้าต่าง' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
