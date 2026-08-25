import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, 
  History, 
  PlusCircle, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  X, 
  Save,
  BarChart3,
  PieChart,
  TrendingUp,
  Target,
  Filter,
  Settings2,
  Download,
  Lock,
  Unlock,
  Plus,
  ArrowLeft,
  Search,
  Gauge,
  Cpu,
  FileSpreadsheet,
  FileText,
  Sliders,
  Edit3,
  RotateCcw,
  Sun,
  Moon
} from 'lucide-react';

import { 
  RoughnessProfileSpec, 
  RoughnessInspectionRecord, 
  Language, 
  InspectionActivity,
  ThemeMode
} from '../types';
import { useCloudState } from '../services/firestoreSync';

interface RoughnessMeasurementAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
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
         <span className="text-[10px] text-cyan-300 font-mono font-bold">Last: {validData[validData.length-1].toFixed(2)}</span>
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

const DEFAULT_PROFILES: RoughnessProfileSpec[] = [
  { 
    name: 'Standard_Default', 
    raUp: '0.8', raLo: '0.8', 
    rzUp: '3.2', rzLo: '3.2', 
    rzCalUp: '3.5', rzCalLo: '3.5', 
    rtUp: '4.0', rtLo: '4.0',
    ryUp: '3.2', ryLo: '3.2'
  },
  {
    name: 'CR-SMOOTH-01',
    raUp: '0.4', raLo: '0.4',
    rzUp: '2.0', rzLo: '2.0',
    rzCalUp: '2.2', rzCalLo: '2.2',
    rtUp: '2.8', rtLo: '2.8',
    ryUp: '2.0', ryLo: '2.0'
  },
  {
    name: 'HR-ROUGH-02',
    raUp: '1.6', raLo: '1.6',
    rzUp: '6.3', rzLo: '6.3',
    rzCalUp: '6.8', rzCalLo: '6.8',
    rtUp: '8.0', rtLo: '8.0',
    ryUp: '6.3', ryLo: '6.3'
  }
];

const INITIAL_INSPECTIONS: RoughnessInspectionRecord[] = [
  {
    id: 'rec-rough-001',
    lotNumber: 'COIL-2026-R101',
    partId: 'UP-SIDE',
    process: 'COLD_ROLL',
    raUp: ['0.42'], raLo: ['0.38'],
    rzUp: ['2.10'], rzLo: ['1.95'],
    rtUp: ['2.60'], rtLo: ['2.45'],
    ryUp: ['2.05'], ryLo: ['1.90'],
    raMax: '0.420',
    rzMax: '2.100',
    rtMax: '2.600',
    ryMax: '2.050',
    calculatedRzCal: '2.150',
    status: 'Pass',
    profileName: 'CR-SMOOTH-01',
    inspectorName: 'Wichai T. (IPQA)',
    machineName: 'SURFTEST-01',
    date: '2026-08-04',
    timestamp: '04/08/2026, 09:15:00'
  },
  {
    id: 'rec-rough-002',
    lotNumber: 'COIL-2026-R102',
    partId: 'LO-SIDE',
    process: 'COLD_ROLL',
    raUp: ['0.48'], raLo: ['0.45'],
    rzUp: ['2.35'], rzLo: ['2.20'],
    rtUp: ['3.10'], rtLo: ['2.90'],
    ryUp: ['2.30'], ryLo: ['2.10'],
    raMax: '0.480',
    rzMax: '2.350',
    rtMax: '3.100',
    ryMax: '2.300',
    calculatedRzCal: '2.410',
    status: 'Fail',
    profileName: 'CR-SMOOTH-01',
    inspectorName: 'Wichai T. (IPQA)',
    machineName: 'SURFTEST-01',
    date: '2026-08-05',
    timestamp: '05/08/2026, 10:30:00'
  }
];

export const RoughnessMeasurementApp: React.FC<RoughnessMeasurementAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th',
  theme = 'light',
  onToggleTheme
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'new-batch' | 'profile-settings' | 'dashboard' | 'history'>('new-batch');

  // Saved Profiles & Inspections with Real-time Cloud Sync
  const [savedProfiles, setSavedProfiles, isProfilesReady] = useCloudState<RoughnessProfileSpec[]>('roughness_qc_profiles', DEFAULT_PROFILES);
  const [inspections, setInspections, isInspectionsReady] = useCloudState<RoughnessInspectionRecord[]>('roughness_qc_inspections', INITIAL_INSPECTIONS);

  // Point Configuration
  const [pointConfig, setPointConfig] = useState({
    ra: 1,
    rz: 1,
    rt: 1,
    ry: 1
  });

  // Admin Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);

  // Header State (Clean start for new inspection entry)
  const [headerInfo, setHeaderInfo] = useState({
    inspectorName: '',
    machineName: '',
    date: new Date().toISOString().split('T')[0],
    profileName: '',
    requirementRaUp: '', requirementRaLo: '',
    requirementRzUp: '', requirementRzLo: '',
    requirementRzCalUp: '', requirementRzCalLo: '',
    requirementRtUp: '', requirementRtLo: '',
    requirementRyUp: '', requirementRyLo: ''
  });

  const [profileStatus, setProfileStatus] = useState<'found' | 'not-found'>('not-found');

  // Helper function for empty point array
  const createEmptyPointArray = (count: number) => Array(count).fill('');

  // Batch Items State (Clean start without demo data)
  const [batchItems, setBatchItems] = useState([
    { 
      id: Date.now(), 
      partId: '', 
      lotNumber: '', 
      process: '', 
      raUp: createEmptyPointArray(1), raLo: createEmptyPointArray(1), 
      rzUp: createEmptyPointArray(1), rzLo: createEmptyPointArray(1), 
      rtUp: createEmptyPointArray(1), rtLo: createEmptyPointArray(1), 
      ryUp: createEmptyPointArray(1), ryLo: createEmptyPointArray(1),
      status: 'Pending' as 'Pass' | 'Fail' | 'Pending', 
      remarks: '' 
    }
  ]);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'profile' | 'history'; id: string; label: string } | null>(null);

  // History Edit Auth & Modal States
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<RoughnessInspectionRecord | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<RoughnessInspectionRecord | null>(null);
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState('');
  const [historyAuthError, setHistoryAuthError] = useState(false);

  const handleRequestEditHistory = (item: RoughnessInspectionRecord) => {
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

  // Available Filter Options
  const availableProfiles = useMemo(() => {
    return ['All', ...Array.from(new Set(inspections.map(i => i.profileName || 'Unknown')))];
  }, [inspections]);

  const availableMonths = useMemo(() => {
    const months = inspections.map(i => i.date ? i.date.substring(0, 7) : null).filter(Boolean) as string[];
    return ['All', ...Array.from(new Set(months))].sort((a, b) => b.localeCompare(a));
  }, [inspections]);

  // Point Addition Handler
  const addPoint = (type: 'ra' | 'rz' | 'rt' | 'ry') => {
    setPointConfig(prev => {
      const newCount = prev[type] + 1;
      setBatchItems(prevItems => prevItems.map(item => ({
        ...item,
        [`${type}Up`]: [...item[`${type}Up` as keyof typeof item] as string[], ''],
        [`${type}Lo`]: [...item[`${type}Lo` as keyof typeof item] as string[], '']
      })));
      return { ...prev, [type]: newCount };
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index?: number, field?: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = (e.target as HTMLElement).closest('form') || document;
      const inputs = Array.from(form.querySelectorAll('input'));
      const indexInForm = inputs.indexOf(e.target as HTMLInputElement);
      const nextInput = inputs[indexInForm + 1];
      
      if (nextInput) {
        nextInput.focus();
      } else {
        addRow();
        setTimeout(() => {
          const allInputs = document.querySelectorAll('input');
          if (allInputs[indexInForm + 1]) {
            allInputs[indexInForm + 1].focus();
          }
        }, 50);
      }
    }
  };

  // Dashboard Stats calculation
  const dashboardStats = useMemo(() => {
    if (inspections.length === 0) return null;

    const total = inspections.length;
    const passCount = inspections.filter(i => i.status === 'Pass').length;
    const failCount = total - passCount;
    const passRatio = ((passCount / total) * 100).toFixed(1);

    const profileGroups: Record<string, {
      name: string; total: number; pass: number; fail: number;
      avgRa: number; countRa: number;
      avgRz: number; countRz: number;
      avgRt: number; countRt: number;
      avgRy: number; countRy: number;
    }> = {};

    inspections.forEach(item => {
      const pName = item.profileName || 'Unknown';
      if (!profileGroups[pName]) {
        profileGroups[pName] = { 
          name: pName, total: 0, pass: 0, fail: 0, 
          avgRa: 0, countRa: 0,
          avgRz: 0, countRz: 0,
          avgRt: 0, countRt: 0,
          avgRy: 0, countRy: 0,
        };
      }
      profileGroups[pName].total++;
      if (item.status === 'Pass') profileGroups[pName].pass++;
      else profileGroups[pName].fail++;

      const raMax = parseFloat(item.raMax || '0');
      if (raMax > 0) { profileGroups[pName].avgRa += raMax; profileGroups[pName].countRa++; }

      const rzMax = parseFloat(item.rzMax || '0');
      if (rzMax > 0) { profileGroups[pName].avgRz += rzMax; profileGroups[pName].countRz++; }

      const rtMax = parseFloat(item.rtMax || '0');
      if (rtMax > 0) { profileGroups[pName].avgRt += rtMax; profileGroups[pName].countRt++; }
      
      const ryMax = parseFloat(item.ryMax || '0');
      if (ryMax > 0) { profileGroups[pName].avgRy += ryMax; profileGroups[pName].countRy++; }
    });

    const profileSummaries = Object.values(profileGroups).map(g => {
      return {
        ...g,
        avgRa: g.countRa > 0 ? (g.avgRa / g.countRa).toFixed(3) : '-',
        avgRz: g.countRz > 0 ? (g.avgRz / g.countRz).toFixed(3) : '-',
        avgRt: g.countRt > 0 ? (g.avgRt / g.countRt).toFixed(3) : '-',
        avgRy: g.countRy > 0 ? (g.avgRy / g.countRy).toFixed(3) : '-',
        passRate: ((g.pass / g.total) * 100).toFixed(1),
      };
    });

    return { total, passCount, failCount, passRatio, profileSummaries };
  }, [inspections]);

  // Filtered Trends calculation
  const filteredTrends = useMemo(() => {
    if (inspections.length === 0) return [];

    let filtered = inspections;
    if (trendFilterProfile !== 'All') {
      filtered = filtered.filter(i => (i.profileName || 'Unknown') === trendFilterProfile);
    }
    if (trendFilterMonth !== 'All') {
      filtered = filtered.filter(i => i.date && i.date.startsWith(trendFilterMonth));
    }

    const groups: Record<string, { name: string; total: number; history: RoughnessInspectionRecord[] }> = {};
    filtered.forEach(item => {
      const pName = item.profileName || 'Unknown';
      if (!groups[pName]) groups[pName] = { name: pName, total: 0, history: [] };
      groups[pName].total++;
      groups[pName].history.push(item);
    });

    return Object.values(groups).map(g => {
      const sortedHistory = [...g.history].reverse(); 
      const trends = {
        ra: sortedHistory.map(item => parseFloat(item.raMax) || 0),
        rz: sortedHistory.map(item => parseFloat(item.rzMax) || 0),
        rt: sortedHistory.map(item => parseFloat(item.rtMax) || 0),
        ry: sortedHistory.map(item => parseFloat(item.ryMax) || 0)
      };
      return { ...g, trends };
    });
  }, [inspections, trendFilterProfile, trendFilterMonth]);

  const formatSpecValue = (val: any) => {
    if (val === undefined || val === null || val === '' || isNaN(parseFloat(val))) return '0.0';
    return String(val);
  };

  const selectProfile = (profile: RoughnessProfileSpec) => {
    setHeaderInfo(prev => ({
      ...prev,
      profileName: profile.name,
      requirementRaUp: formatSpecValue(profile.raUp),
      requirementRaLo: formatSpecValue(profile.raLo),
      requirementRzUp: formatSpecValue(profile.rzUp),
      requirementRzLo: formatSpecValue(profile.rzLo),
      requirementRzCalUp: formatSpecValue(profile.rzCalUp),
      requirementRzCalLo: formatSpecValue(profile.rzCalLo),
      requirementRtUp: formatSpecValue(profile.rtUp),
      requirementRtLo: formatSpecValue(profile.rtLo),
      requirementRyUp: formatSpecValue(profile.ryUp),
      requirementRyLo: formatSpecValue(profile.ryLo)
    }));
    setProfileStatus('found');
  };

  useEffect(() => {
    if (headerInfo.profileName) {
      const match = savedProfiles.find(p => p.name.toLowerCase() === headerInfo.profileName.toLowerCase());
      if (match) {
        setHeaderInfo(prev => ({
          ...prev,
          requirementRaUp: formatSpecValue(match.raUp),
          requirementRaLo: formatSpecValue(match.raLo),
          requirementRzUp: formatSpecValue(match.rzUp),
          requirementRzLo: formatSpecValue(match.rzLo),
          requirementRzCalUp: formatSpecValue(match.rzCalUp),
          requirementRzCalLo: formatSpecValue(match.rzCalLo),
          requirementRtUp: formatSpecValue(match.rtUp),
          requirementRtLo: formatSpecValue(match.rtLo),
          requirementRyUp: formatSpecValue(match.ryUp),
          requirementRyLo: formatSpecValue(match.ryLo)
        }));
        setProfileStatus('found');
      } else {
        setProfileStatus('not-found');
      }
    }
  }, [headerInfo.profileName, savedProfiles]);

  const handleSaveProfile = () => {
    if (!headerInfo.profileName.trim()) {
      showNotification(isTh ? 'กรุณาระบุชื่อ Profile ก่อนบันทึก' : 'Please enter Profile Name before saving', 'error');
      return;
    }
    const newProfile: RoughnessProfileSpec = {
      name: headerInfo.profileName.trim(),
      raUp: headerInfo.requirementRaUp, raLo: headerInfo.requirementRaLo,
      rzUp: headerInfo.requirementRzUp, rzLo: headerInfo.requirementRzLo,
      rzCalUp: headerInfo.requirementRzCalUp, rzCalLo: headerInfo.requirementRzCalLo,
      rtUp: headerInfo.requirementRtUp, rtLo: headerInfo.requirementRtLo,
      ryUp: headerInfo.requirementRyUp, ryLo: headerInfo.requirementRyLo,
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

    showNotification(isTh ? `บันทึก Profile "${newProfile.name}" สำเร็จ` : `Saved profile "${newProfile.name}" successfully`);
  };

  const handleDeleteProfile = (profileName: string) => {
    setSavedProfiles(prev => prev.filter(p => p.name !== profileName));
    if (headerInfo.profileName === profileName) {
      setHeaderInfo(prev => ({ ...prev, profileName: '' }));
      setProfileStatus('not-found');
    }
    showNotification(isTh ? `ลบ Profile "${profileName}" สำเร็จ` : `Deleted profile "${profileName}"`);
    setDeleteConfirm(null);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setInspections(prev => prev.filter(i => i.id !== id));
    showNotification(isTh ? 'ลบรายการประวัติสำเร็จ' : 'Deleted history record');
    setDeleteConfirm(null);
  };

  const getGroupMaxRz = (lotNumber: string, process: string) => {
    if (!lotNumber || !process) return [];
    const relatedItems = batchItems.filter(i => i.lotNumber === lotNumber && i.process === process);
    const allRzValues: number[] = [];
    relatedItems.forEach(item => {
      item.rzUp.forEach(v => v !== '' && allRzValues.push(parseFloat(v)));
      item.rzLo.forEach(v => v !== '' && allRzValues.push(parseFloat(v)));
    });
    return allRzValues;
  };

  const calculatedStats = useMemo(() => {
    const groups: Record<string, number[]> = {};
    batchItems.forEach(item => {
      const key = `${item.lotNumber}-${item.process}`;
      if (!item.lotNumber || !item.process) return;
      if (!groups[key]) groups[key] = getGroupMaxRz(item.lotNumber, item.process);
    });

    const results: Record<string, { avg: number; sd: number; rzCal: number }> = {};
    Object.keys(groups).forEach(key => {
      const values = groups[key];
      const n = values.length;
      if (n === 0) return;
      const avg = values.reduce((a, b) => a + b, 0) / n;
      let sd = 0;
      if (n > 1) {
        const sqDiff = values.map(v => Math.pow(v - avg, 2));
        sd = Math.sqrt(sqDiff.reduce((a, b) => a + b, 0) / (n - 1));
      }
      const rzCal = avg + (3 * sd);
      results[key] = { avg, sd, rzCal };
    });
    return results;
  }, [batchItems]);

  const judgeStatus = (item: typeof batchItems[0]): 'Pass' | 'Fail' | 'Pending' => {
    const specs = {
      raUp: parseFloat(headerInfo.requirementRaUp) || 0,
      raLo: parseFloat(headerInfo.requirementRaLo) || 0,
      rzUp: parseFloat(headerInfo.requirementRzUp) || 0,
      rzLo: parseFloat(headerInfo.requirementRzLo) || 0,
      rtUp: parseFloat(headerInfo.requirementRtUp) || 0,
      rtLo: parseFloat(headerInfo.requirementRtLo) || 0,
      ryUp: parseFloat(headerInfo.requirementRyUp) || 0,
      ryLo: parseFloat(headerInfo.requirementRyLo) || 0,
      rzCalUp: parseFloat(headerInfo.requirementRzCalUp) || 0,
      rzCalLo: parseFloat(headerInfo.requirementRzCalLo) || 0
    };

    const isRaReq = specs.raUp > 0 || specs.raLo > 0;
    const isRzReq = specs.rzUp > 0 || specs.rzLo > 0;
    const isRtReq = specs.rtUp > 0 || specs.rtLo > 0;
    const isRyReq = specs.ryUp > 0 || specs.ryLo > 0;

    const hasValue = (arr: string[]) => arr.some(v => v !== '' && !isNaN(parseFloat(v)));
    if (isRaReq && (!hasValue(item.raUp) || !hasValue(item.raLo))) return 'Pending';
    if (isRzReq && (!hasValue(item.rzUp) || !hasValue(item.rzLo))) return 'Pending';
    if (isRtReq && (!hasValue(item.rtUp) || !hasValue(item.rtLo))) return 'Pending';
    if (isRyReq && (!hasValue(item.ryUp) || !hasValue(item.ryLo))) return 'Pending';

    let pass = true;

    const checkArrayAgainstLimit = (arr: string[], limit: number) => {
      if (limit <= 0) return true;
      return !arr.some(v => parseFloat(v) > limit);
    };

    if (specs.raUp > 0 && !checkArrayAgainstLimit(item.raUp, specs.raUp)) pass = false;
    if (specs.raLo > 0 && !checkArrayAgainstLimit(item.raLo, specs.raLo)) pass = false;
    if (specs.rzUp > 0 && !checkArrayAgainstLimit(item.rzUp, specs.rzUp)) pass = false;
    if (specs.rzLo > 0 && !checkArrayAgainstLimit(item.rzLo, specs.rzLo)) pass = false;
    if (specs.rtUp > 0 && !checkArrayAgainstLimit(item.rtUp, specs.rtUp)) pass = false;
    if (specs.rtLo > 0 && !checkArrayAgainstLimit(item.rtLo, specs.rtLo)) pass = false;
    if (specs.ryUp > 0 && !checkArrayAgainstLimit(item.ryUp, specs.ryUp)) pass = false;
    if (specs.ryLo > 0 && !checkArrayAgainstLimit(item.ryLo, specs.ryLo)) pass = false;

    const stats = calculatedStats[`${item.lotNumber}-${item.process}`];
    if (stats) {
      if (specs.rzCalUp > 0 && stats.rzCal > specs.rzCalUp) pass = false;
    }
    return pass ? 'Pass' : 'Fail';
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleResetForm = () => {
    setHeaderInfo({
      inspectorName: '',
      machineName: '',
      date: new Date().toISOString().split('T')[0],
      profileName: '',
      requirementRaUp: '', requirementRaLo: '',
      requirementRzUp: '', requirementRzLo: '',
      requirementRzCalUp: '', requirementRzCalLo: '',
      requirementRtUp: '', requirementRtLo: '',
      requirementRyUp: '', requirementRyLo: ''
    });
    setProfileStatus('not-found');
    setBatchItems([{ 
      id: Date.now(), 
      partId: '', 
      lotNumber: '', 
      process: '', 
      raUp: createEmptyPointArray(pointConfig.ra), raLo: createEmptyPointArray(pointConfig.ra), 
      rzUp: createEmptyPointArray(pointConfig.rz), rzLo: createEmptyPointArray(pointConfig.rz), 
      rtUp: createEmptyPointArray(pointConfig.rt), rtLo: createEmptyPointArray(pointConfig.rt), 
      ryUp: createEmptyPointArray(pointConfig.ry), ryLo: createEmptyPointArray(pointConfig.ry),
      status: 'Pending', remarks: '' 
    }]);
  };

  const addRow = () => {
    const lastItem = batchItems[batchItems.length - 1];
    setBatchItems(prev => [...prev, { 
      id: Date.now() + Math.random(), 
      partId: lastItem ? lastItem.partId : '', 
      lotNumber: lastItem ? lastItem.lotNumber : '', 
      process: lastItem ? lastItem.process : '', 
      raUp: createEmptyPointArray(pointConfig.ra), 
      raLo: createEmptyPointArray(pointConfig.ra), 
      rzUp: createEmptyPointArray(pointConfig.rz), 
      rzLo: createEmptyPointArray(pointConfig.rz), 
      rtUp: createEmptyPointArray(pointConfig.rt), 
      rtLo: createEmptyPointArray(pointConfig.rt), 
      ryUp: createEmptyPointArray(pointConfig.ry),
      ryLo: createEmptyPointArray(pointConfig.ry),
      status: 'Pending', remarks: '' 
    }]);
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHeaderInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id: number, field: string, value: string) => {
    setBatchItems(prevItems => prevItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDynamicPointChange = (id: number, field: string, index: number, value: string) => {
    setBatchItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const newArr = [...(item[field as keyof typeof item] as string[])];
        newArr[index] = value;
        return { ...item, [field]: newArr };
      }
      return item;
    }));
  };

  const saveBatch = () => {
    const validItems = batchItems.filter(item => (item.partId || item.lotNumber) && judgeStatus(item) !== 'Pending');
    if (validItems.length === 0) {
      showNotification(isTh ? 'กรุณากรอกข้อมูลให้ครบถ้วนอย่างน้อย 1 รายการ' : 'Please complete at least 1 inspection entry', 'error');
      return;
    }

    const now = new Date();
    const newRecords: RoughnessInspectionRecord[] = validItems.map(item => {
      const stats = calculatedStats[`${item.lotNumber}-${item.process}`];
      const getMax = (up: string[], lo: string[]) => Math.max(
        ...up.map(v => parseFloat(v) || 0),
        ...lo.map(v => parseFloat(v) || 0)
      );

      const decision = judgeStatus(item);
      const recId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      if (onLogNewActivity) {
        onLogNewActivity({
          id: recId,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'IPQA-02',
          moduleTitleTh: 'การตรวจวัดความเรียบผิว (Roughness Measurement)',
          moduleTitleEn: 'Surface Roughness Measurement System (Ra/Rz/Rt/Ry)',
          inspector: headerInfo.inspectorName || 'IPQA Officer',
          batchLot: `${headerInfo.profileName || 'General Profile'} - ${item.lotNumber}`,
          coilNo: item.lotNumber,
          profile: headerInfo.profileName,
          process: item.process,
          inspectionResult: `${decision === 'Pass' ? 'PASS' : 'FAIL'} / Ra: ${getMax(item.raUp, item.raLo).toFixed(3)} µm, Rz: ${getMax(item.rzUp, item.rzLo).toFixed(3)} µm`,
          result: decision === 'Pass' ? 'PASS' : 'FAIL',
          defectCount: decision === 'Fail' ? 1 : 0,
          remarks: `Ra Max: ${getMax(item.raUp, item.raLo).toFixed(3)} µm, Rz Max: ${getMax(item.rzUp, item.rzLo).toFixed(3)} µm, RzCal: ${stats ? stats.rzCal.toFixed(3) : '0.000'}`
        });
      }

      return {
        id: recId,
        lotNumber: item.lotNumber.trim().toUpperCase() || 'COIL-UNTITLED',
        partId: item.partId.trim().toUpperCase() || 'SIDE-A',
        process: item.process.trim().toUpperCase() || 'COLD_ROLL',
        raUp: item.raUp,
        raLo: item.raLo,
        rzUp: item.rzUp,
        rzLo: item.rzLo,
        rtUp: item.rtUp,
        rtLo: item.rtLo,
        ryUp: item.ryUp,
        ryLo: item.ryLo,
        raMax: getMax(item.raUp, item.raLo).toFixed(3),
        rzMax: getMax(item.rzUp, item.rzLo).toFixed(3),
        rtMax: getMax(item.rtUp, item.rtLo).toFixed(3),
        ryMax: getMax(item.ryUp, item.ryLo).toFixed(3),
        status: decision,
        remarks: item.remarks,
        profileName: headerInfo.profileName,
        inspectorName: headerInfo.inspectorName || 'IPQA Inspector',
        machineName: headerInfo.machineName || 'SURFTEST-01',
        date: headerInfo.date,
        calculatedRzCal: stats ? stats.rzCal.toFixed(3) : '0.000',
        timestamp: now.toLocaleString('th-TH')
      };
    });

    setInspections(prev => [...newRecords, ...prev]);
    showNotification(isTh ? `บันทึกข้อมูล ${validItems.length} รายการเรียบร้อยแล้ว` : `Saved ${validItems.length} inspection entries successfully`);

    setBatchItems([{ 
      id: Date.now(), 
      partId: '', lotNumber: '', process: '', 
      raUp: createEmptyPointArray(pointConfig.ra), raLo: createEmptyPointArray(pointConfig.ra),
      rzUp: createEmptyPointArray(pointConfig.rz), rzLo: createEmptyPointArray(pointConfig.rz),
      rtUp: createEmptyPointArray(pointConfig.rt), rtLo: createEmptyPointArray(pointConfig.rt),
      ryUp: createEmptyPointArray(pointConfig.ry), ryLo: createEmptyPointArray(pointConfig.ry),
      status: 'Pending', remarks: '' 
    }]);

    setActiveTab('history');
  };

  const exportToExcel = () => {
    if (inspections.length === 0) {
      showNotification(isTh ? 'ไม่มีข้อมูลสำหรับ Export' : 'No history to export', 'error');
      return;
    }
    const headers = [
      'Timestamp', 'Date', 'Coil No.', 'Side', 'Process', 'Profile Name', 
      'Ra Max', 'Rz Max', 'Rt Max', 'Ry Max', 
      'Rz Cal (Batch)', 'Status', 'Machine', 'Inspector'
    ];
    const csvContent = [
      headers.join(','),
      ...inspections.map(item => [
        `"${item.timestamp}"`,
        `"${item.date}"`,
        `"${item.lotNumber}"`,
        `"${item.partId}"`,
        `"${item.process}"`,
        `"${item.profileName}"`,
        item.raMax, item.rzMax, item.rtMax, (item.ryMax || '0.000'),
        item.calculatedRzCal,
        `"${item.status}"`,
        `"${item.machineName}"`,
        `"${item.inspectorName}"`
      ].join(','))
    ].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Roughness_Inspection_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(isTh ? 'Export ข้อมูลเรียบร้อยแล้ว' : 'Exported CSV successfully');
  };

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setActiveTab('profile-settings');
    } else {
      setShowAdminModal(true);
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin2026') {
      setIsAdminAuthenticated(true);
      setShowPasswordError(false);
      setAdminPasswordInput('');
      setShowAdminModal(false);
      setActiveTab('profile-settings');
    } else {
      setShowPasswordError(true);
      setAdminPasswordInput('');
    }
  };

  const isRaActive = !headerInfo.profileName || parseFloat(headerInfo.requirementRaUp) > 0 || parseFloat(headerInfo.requirementRaLo) > 0;
  const isRzActive = !headerInfo.profileName || parseFloat(headerInfo.requirementRzUp) > 0 || parseFloat(headerInfo.requirementRzLo) > 0;
  const isRtActive = !headerInfo.profileName || parseFloat(headerInfo.requirementRtUp) > 0 || parseFloat(headerInfo.requirementRtLo) > 0;
  const isRyActive = !headerInfo.profileName || parseFloat(headerInfo.requirementRyUp) > 0 || parseFloat(headerInfo.requirementRyLo) > 0;
  const isRzCalActive = !headerInfo.profileName || parseFloat(headerInfo.requirementRzCalUp) > 0 || parseFloat(headerInfo.requirementRzCalLo) > 0;

  // Filter history
  const filteredInspections = useMemo(() => {
    if (!historySearchTerm) return inspections;
    const term = historySearchTerm.toLowerCase();
    return inspections.filter(i => 
      i.lotNumber.toLowerCase().includes(term) ||
      i.profileName.toLowerCase().includes(term) ||
      i.inspectorName.toLowerCase().includes(term)
    );
  }, [inspections, historySearchTerm]);

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 space-y-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>

      {/* Admin Verification Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="text-center space-y-2">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto ${
                isLight ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              }`}>
                <Lock className="w-7 h-7" />
              </div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Admin Verification</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
                  className={`w-full border rounded-2xl px-4 py-3 text-center text-lg font-mono focus:outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-blue-600 focus:border-blue-500' 
                      : 'bg-slate-950 border-slate-800 text-cyan-300 focus:border-cyan-500'
                  }`}
                  autoFocus
                />
                {showPasswordError && (
                  <p className="text-rose-500 text-xs font-semibold text-center mt-2">
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่' : 'Incorrect password. Please try again.'}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className={`flex-1 font-bold text-xs py-3 rounded-xl transition ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className={`flex-1 font-bold text-xs py-3 rounded-xl transition shadow-md ${
                    isLight
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                  }`}
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
          <div className={`rounded-3xl shadow-2xl max-w-md w-full p-6 border space-y-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
             <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7" />
             </div>
             <div className="text-center">
               <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{isTh ? 'ยืนยันการลบข้อมูล?' : 'Confirm Deletion'}</h3>
               <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{isTh ? 'คุณต้องการลบ' : 'Delete'} <b>{deleteConfirm.label}</b> {isTh ? 'ใช่หรือไม่?' : 'permanently?'}</p>
             </div>
             <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className={`flex-1 py-2.5 font-bold rounded-xl text-xs transition ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'profile') handleDeleteProfile(deleteConfirm.id);
                    if (deleteConfirm.type === 'history') handleDeleteHistoryItem(deleteConfirm.id);
                  }} 
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  {isTh ? 'ยืนยันลบ' : 'Delete'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b transition-colors ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Return to QA Portal"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-md ${
              isLight ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-slate-950 shadow-indigo-500/20'
            }`}>
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                }`}>
                  IPQA-02
                </span>
                <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isTh ? 'ระบบตรวจวัดความเรียบผิว (Roughness System)' : 'Surface Roughness Measurement System'}
                </h1>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh 
                  ? 'วัดค่า Ra, Rz, Rt, Ry ขอบบน-ขอบล่าง, คำนวณ Rz Cal (3-Sigma) พร้อมบันทึกฐานข้อมูลกลาง Firestore' 
                  : 'Surface metrology parameters (Ra, Rz, Rt, Ry), 3-Sigma Rz Cal, Sparklines & Central Firestore DB Sync'}
              </p>
            </div>
          </div>
        </div>

        {/* Status indicator & Theme Toggle */}
        <div className="flex items-center gap-2.5">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                isLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Clean'}
            >
              {isLight ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isLight ? (isTh ? 'สว่าง' : 'Light') : (isTh ? 'มืด' : 'Dark')}</span>
            </button>
          )}

          <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            isInspectionsReady && isProfilesReady
              ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
              : isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-950/60 border-amber-800/80 text-amber-300'
          }`}
          title="Central Firestore Database (qa_master_data / roughness_qc_inspections)"
          >
            <span className={`w-2 h-2 rounded-full ${isInspectionsReady && isProfilesReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span>{isInspectionsReady && isProfilesReady ? 'Firestore DB Connected' : 'Connecting DB...'}</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className={`flex space-x-2 border-b pb-2 overflow-x-auto ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <button
          onClick={() => setActiveTab('new-batch')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'new-batch'
              ? isLight
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isTh ? '➕ บันทึกกลุ่มงาน' : 'Data Entry'}</span>
        </button>

        <button
          onClick={handleAdminAccess}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'profile-settings'
              ? isLight
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>{isTh ? '⚙️ Profile Spec' : 'Profile Spec'}</span>
          {isAdminAuthenticated && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'dashboard'
              ? isLight
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
              ? isLight
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{isTh ? '📜 ประวัติ' : 'History Log'}</span>
          {inspections.length > 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
              isLight ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-950 text-cyan-300 border-cyan-800'
            }`}>
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
          {/* Metadata Section */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                {isTh ? '1. ข้อมูลการตรวจสอบหลัก (Inspection Metadata)' : '1. Inspection Header Metadata'}
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
                    const pName = e.target.value;
                    if (!pName) {
                      setHeaderInfo(prev => ({
                        ...prev,
                        profileName: '',
                        requirementRaUp: '', requirementRaLo: '',
                        requirementRzUp: '', requirementRzLo: '',
                        requirementRzCalUp: '', requirementRzCalLo: '',
                        requirementRtUp: '', requirementRtLo: '',
                        requirementRyUp: '', requirementRyLo: ''
                      }));
                      setProfileStatus('not-found');
                    } else {
                      const selected = savedProfiles.find(p => p.name === pName);
                      if (selected) selectProfile(selected);
                    }
                  }}
                  className="w-full bg-slate-950 border border-cyan-900/80 text-cyan-300 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 uppercase"
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
                  placeholder={isTh ? 'ชื่อผู้ตรวจสอบ / Inspector name' : 'Inspector name'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Machine Name
                </label>
                <input
                  type="text"
                  name="machineName"
                  value={headerInfo.machineName}
                  onChange={handleHeaderChange}
                  placeholder={isTh ? 'เช่น SURFTEST-M01' : 'Machine name'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 uppercase"
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
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Spec summary row */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs grid grid-cols-2 sm:grid-cols-5 gap-2 text-slate-300">
              <div><span className="text-slate-500">Max Ra Limit:</span> <strong className="text-cyan-300">{headerInfo.requirementRaUp ? `≤ ${headerInfo.requirementRaUp} µm` : '-'}</strong></div>
              <div><span className="text-slate-500">Max Rz Limit:</span> <strong className="text-emerald-300">{headerInfo.requirementRzUp ? `≤ ${headerInfo.requirementRzUp} µm` : '-'}</strong></div>
              <div><span className="text-slate-500">Max Rt Limit:</span> <strong className="text-amber-300">{headerInfo.requirementRtUp ? `≤ ${headerInfo.requirementRtUp} µm` : '-'}</strong></div>
              <div><span className="text-slate-500">Max Ry Limit:</span> <strong className="text-indigo-300">{headerInfo.requirementRyUp ? `≤ ${headerInfo.requirementRyUp} µm` : '-'}</strong></div>
              <div><span className="text-slate-500">3-Sigma Rz Cal:</span> <strong className="text-rose-300">{headerInfo.requirementRzCalUp ? `≤ ${headerInfo.requirementRzCalUp} µm` : '-'}</strong></div>
            </div>
          </div>

          {/* Measurement Table */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                {isTh ? '2. ตารางบันทึกค่าความเรียบผิว (Roughness Points Entry)' : '2. Surface Points Entry'}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                  title={isTh ? 'ล้างข้อมูลฟอร์มเริ่มต้นใหม่' : 'Reset Form'}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isTh ? '↺ ล้างฟอร์ม' : 'Reset'}</span>
                </button>

                <button
                  type="button"
                  onClick={addRow}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>{isTh ? '+ เพิ่มรายการชิ้นงาน' : 'Add Row'}</span>
                </button>

                <button
                  type="button"
                  onClick={saveBatch}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{isTh ? '💾 บันทึกขึ้น Cloud' : 'Save Batch'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <form onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="px-3 py-3 w-64">Coil Info (Side/Process)</th>
                      {isRaActive && (
                        <th className="px-3 py-3 text-center bg-cyan-950/30 text-cyan-300 border-l border-slate-800" colSpan={pointConfig.ra * 2}>
                          <div className="flex items-center justify-center gap-2">
                            Ra (Up / Lo) 
                            <button type="button" onClick={() => addPoint('ra')} className="p-0.5 bg-cyan-600 text-slate-950 rounded hover:bg-cyan-500 transition">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </th>
                      )}
                      {isRzActive && (
                        <th className="px-3 py-3 text-center bg-emerald-950/30 text-emerald-300 border-l border-slate-800" colSpan={pointConfig.rz * 2}>
                          <div className="flex items-center justify-center gap-2">
                            Rz (Up / Lo) 
                            <button type="button" onClick={() => addPoint('rz')} className="p-0.5 bg-emerald-600 text-slate-950 rounded hover:bg-emerald-500 transition">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </th>
                      )}
                      {isRzCalActive && (
                        <th className="px-3 py-3 text-center bg-rose-950/30 text-rose-300 border-l border-slate-800">
                          3-Sigma Rz Cal
                        </th>
                      )}
                      {isRtActive && (
                        <th className="px-3 py-3 text-center bg-amber-950/30 text-amber-300 border-l border-slate-800" colSpan={pointConfig.rt * 2}>
                          <div className="flex items-center justify-center gap-2">
                            Rt (Up / Lo) 
                            <button type="button" onClick={() => addPoint('rt')} className="p-0.5 bg-amber-600 text-slate-950 rounded hover:bg-amber-500 transition">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </th>
                      )}
                      {isRyActive && (
                        <th className="px-3 py-3 text-center bg-indigo-950/30 text-indigo-300 border-l border-slate-800" colSpan={pointConfig.ry * 2}>
                          <div className="flex items-center justify-center gap-2">
                            Ry (Up / Lo) 
                            <button type="button" onClick={() => addPoint('ry')} className="p-0.5 bg-indigo-600 text-slate-950 rounded hover:bg-indigo-500 transition">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </th>
                      )}
                      <th className="px-3 py-3 text-center border-l border-slate-800">Status</th>
                      <th className="px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {batchItems.map((item, index) => {
                      const stats = calculatedStats[`${item.lotNumber}-${item.process}`];
                      const currentStatus = judgeStatus(item);
                      return (
                        <tr key={item.id} className="hover:bg-slate-950/40">
                          <td className="px-3 py-3 space-y-1">
                            <input
                              type="text"
                              placeholder="Coil No."
                              value={item.lotNumber}
                              onKeyDown={(e) => handleKeyDown(e, index, 'lotNumber')}
                              onChange={(e) => handleItemChange(item.id, 'lotNumber', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-mono font-bold uppercase focus:outline-none focus:border-cyan-500"
                            />
                            <div className="flex gap-1">
                              <input
                                type="text"
                                placeholder="Side"
                                value={item.partId}
                                onChange={(e) => handleItemChange(item.id, 'partId', e.target.value)}
                                className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 uppercase focus:outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Proc"
                                value={item.process}
                                onChange={(e) => handleItemChange(item.id, 'process', e.target.value)}
                                className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 uppercase focus:outline-none"
                              />
                            </div>
                          </td>

                          {/* Ra Points */}
                          {isRaActive && (
                            <td className="px-2 py-3 bg-cyan-950/10 border-l border-slate-800/80" colSpan={pointConfig.ra * 2}>
                              <div className="flex gap-2 justify-center">
                                {Array(pointConfig.ra).fill(0).map((_, pIdx) => (
                                  <div key={pIdx} className="flex gap-1 items-center">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.raUp[pIdx]}
                                      onChange={(e) => handleDynamicPointChange(item.id, 'raUp', pIdx, e.target.value)}
                                      placeholder="Up"
                                      className={`w-12 bg-slate-950 border text-center font-mono text-xs rounded py-1 focus:outline-none ${
                                        item.raUp[pIdx] && parseFloat(item.raUp[pIdx]) > parseFloat(headerInfo.requirementRaUp)
                                          ? 'border-rose-500 text-rose-300 bg-rose-950/40'
                                          : 'border-slate-800 text-cyan-300'
                                      }`}
                                    />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.raLo[pIdx]}
                                      onChange={(e) => handleDynamicPointChange(item.id, 'raLo', pIdx, e.target.value)}
                                      placeholder="Lo"
                                      className={`w-12 bg-slate-950 border text-center font-mono text-xs rounded py-1 focus:outline-none ${
                                        item.raLo[pIdx] && parseFloat(item.raLo[pIdx]) > parseFloat(headerInfo.requirementRaLo)
                                          ? 'border-rose-500 text-rose-300 bg-rose-950/40'
                                          : 'border-slate-800 text-cyan-300'
                                      }`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </td>
                          )}

                          {/* Rz Points */}
                          {isRzActive && (
                            <td className="px-2 py-3 bg-emerald-950/10 border-l border-slate-800/80" colSpan={pointConfig.rz * 2}>
                              <div className="flex gap-2 justify-center">
                                {Array(pointConfig.rz).fill(0).map((_, pIdx) => (
                                  <div key={pIdx} className="flex gap-1 items-center">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.rzUp[pIdx]}
                                      onChange={(e) => handleDynamicPointChange(item.id, 'rzUp', pIdx, e.target.value)}
                                      placeholder="Up"
                                      className={`w-12 bg-slate-950 border text-center font-mono text-xs rounded py-1 focus:outline-none ${
                                        item.rzUp[pIdx] && parseFloat(item.rzUp[pIdx]) > parseFloat(headerInfo.requirementRzUp)
                                          ? 'border-rose-500 text-rose-300 bg-rose-950/40'
                                          : 'border-slate-800 text-emerald-300'
                                      }`}
                                    />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.rzLo[pIdx]}
                                      onChange={(e) => handleDynamicPointChange(item.id, 'rzLo', pIdx, e.target.value)}
                                      placeholder="Lo"
                                      className={`w-12 bg-slate-950 border text-center font-mono text-xs rounded py-1 focus:outline-none ${
                                        item.rzLo[pIdx] && parseFloat(item.rzLo[pIdx]) > parseFloat(headerInfo.requirementRzLo)
                                          ? 'border-rose-500 text-rose-300 bg-rose-950/40'
                                          : 'border-slate-800 text-emerald-300'
                                      }`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </td>
                          )}

                          {/* Rz Cal */}
                          {isRzCalActive && (
                            <td className="px-3 py-3 text-center border-l border-slate-800 font-mono font-bold text-xs bg-rose-950/10">
                              <span className={stats && (stats.rzCal > parseFloat(headerInfo.requirementRzCalUp)) ? 'text-rose-400' : 'text-rose-300'}>
                                {stats ? stats.rzCal.toFixed(3) : '-'}
                              </span>
                            </td>
                          )}

                          {/* Rt Points */}
                          {isRtActive && (
                            <td className="px-2 py-3 bg-amber-950/10 border-l border-slate-800/80" colSpan={pointConfig.rt * 2}>
                              <div className="flex gap-2 justify-center">
                                {Array(pointConfig.rt).fill(0).map((_, pIdx) => (
                                  <div key={pIdx} className="flex gap-1 items-center">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.rtUp[pIdx]}
                                      onChange={(e) => handleDynamicPointChange(item.id, 'rtUp', pIdx, e.target.value)}
                                      placeholder="Up"
                                      className={`w-12 bg-slate-950 border text-center font-mono text-xs rounded py-1 focus:outline-none ${
                                        item.rtUp[pIdx] && parseFloat(item.rtUp[pIdx]) > parseFloat(headerInfo.requirementRtUp)
                                          ? 'border-rose-500 text-rose-300 bg-rose-950/40'
                                          : 'border-slate-800 text-amber-300'
                                      }`}
                                    />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.rtLo[pIdx]}
                                      onChange={(e) => handleDynamicPointChange(item.id, 'rtLo', pIdx, e.target.value)}
                                      placeholder="Lo"
                                      className={`w-12 bg-slate-950 border text-center font-mono text-xs rounded py-1 focus:outline-none ${
                                        item.rtLo[pIdx] && parseFloat(item.rtLo[pIdx]) > parseFloat(headerInfo.requirementRtLo)
                                          ? 'border-rose-500 text-rose-300 bg-rose-950/40'
                                          : 'border-slate-800 text-amber-300'
                                      }`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </td>
                          )}

                          {/* Ry Points */}
                          {isRyActive && (
                            <td className="px-2 py-3 bg-indigo-950/10 border-l border-slate-800/80" colSpan={pointConfig.ry * 2}>
                              <div className="flex gap-2 justify-center">
                                {Array(pointConfig.ry).fill(0).map((_, pIdx) => (
                                  <div key={pIdx} className="flex gap-1 items-center">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.ryUp[pIdx]}
                                      onChange={(e) => handleDynamicPointChange(item.id, 'ryUp', pIdx, e.target.value)}
                                      placeholder="Up"
                                      className={`w-12 bg-slate-950 border text-center font-mono text-xs rounded py-1 focus:outline-none ${
                                        item.ryUp[pIdx] && parseFloat(item.ryUp[pIdx]) > parseFloat(headerInfo.requirementRyUp)
                                          ? 'border-rose-500 text-rose-300 bg-rose-950/40'
                                          : 'border-slate-800 text-indigo-300'
                                      }`}
                                    />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.ryLo[pIdx]}
                                      onChange={(e) => handleDynamicPointChange(item.id, 'ryLo', pIdx, e.target.value)}
                                      placeholder="Lo"
                                      className={`w-12 bg-slate-950 border text-center font-mono text-xs rounded py-1 focus:outline-none ${
                                        item.ryLo[pIdx] && parseFloat(item.ryLo[pIdx]) > parseFloat(headerInfo.requirementRyLo)
                                          ? 'border-rose-500 text-rose-300 bg-rose-950/40'
                                          : 'border-slate-800 text-indigo-300'
                                      }`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </td>
                          )}

                          {/* Status Judgment */}
                          <td className="px-3 py-3 text-center border-l border-slate-800">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              currentStatus === 'Pass'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : currentStatus === 'Fail'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {currentStatus === 'Pass' ? '✓ PASS' : currentStatus === 'Fail' ? '✕ FAIL' : 'PENDING'}
                            </span>
                          </td>

                          <td className="px-2 py-3 text-center">
                            {batchItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setBatchItems(prev => prev.filter(i => i.id !== item.id))}
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <X className="w-4 h-4" />
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

      {/* TAB 2: PROFILE SPEC MANAGER */}
      {activeTab === 'profile-settings' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-cyan-400" />
                <span>{isTh ? 'การตั้งค่า Profile Specification (Admin Mode)' : 'Profile Spec Configuration'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isTh ? 'กำหนดค่า Upper Specification Limit (USL) ของ Ra, Rz, Rt, Ry และ Rz Cal' : 'Set Upper Specification Limits (USL) for Ra, Rz, Rt, Ry and Rz Cal'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveProfile}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                <Save className="w-4 h-4" />
                <span>{isTh ? 'บันทึก Profile' : 'Save Profile'}</span>
              </button>

              <button
                onClick={() => setIsAdminAuthenticated(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isTh ? 'ออกจากระบบ Admin' : 'Exit Admin'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Saved Profile List Sidebar */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isTh ? 'รายการ Profile ที่บันทึกแล้ว' : 'Saved Profiles'}
              </h4>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {savedProfiles.map((p) => (
                  <div
                    key={p.name}
                    onClick={() => selectProfile(p)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      headerInfo.profileName === p.name
                        ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="text-xs block font-bold">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Ra: ≤{p.raUp} | Rz: ≤{p.rzUp}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ type: 'profile', id: p.name, label: `Profile: ${p.name}` });
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Spec Form Editor */}
            <div className="md:col-span-2 bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Profile Name / Model Code *
                </label>
                <input
                  type="text"
                  name="profileName"
                  value={headerInfo.profileName}
                  onChange={handleHeaderChange}
                  placeholder="e.g. CR-SMOOTH-01"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Upper Surface Specs */}
                <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Upper Surface Spec Limits (Up)</span>
                  </h5>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Max Ra (µm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="requirementRaUp"
                        value={headerInfo.requirementRaUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Max Rz (µm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="requirementRzUp"
                        value={headerInfo.requirementRzUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Max Rt (µm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="requirementRtUp"
                        value={headerInfo.requirementRtUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Max Ry (µm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="requirementRyUp"
                        value={headerInfo.requirementRyUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-rose-400 block mb-1">Max 3-Sigma Rz Cal (µm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="requirementRzCalUp"
                        value={headerInfo.requirementRzCalUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-950 border border-rose-900/60 rounded-lg px-2 py-1.5 text-xs text-rose-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Lower Surface Specs */}
                <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Lower Surface Spec Limits (Lo)</span>
                  </h5>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Max Ra (µm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="requirementRaLo"
                        value={headerInfo.requirementRaLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Max Rz (µm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="requirementRzLo"
                        value={headerInfo.requirementRzLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Max Rt (µm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="requirementRtLo"
                        value={headerInfo.requirementRtLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Max Ry (µm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="requirementRyLo"
                        value={headerInfo.requirementRyLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-rose-400 block mb-1">Max 3-Sigma Rz Cal (µm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="requirementRzCalLo"
                        value={headerInfo.requirementRzCalLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-950 border border-rose-900/60 rounded-lg px-2 py-1.5 text-xs text-rose-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {dashboardStats ? (
            <>
              {/* Metric Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Inspected</span>
                  <p className="text-2xl font-bold text-white font-mono">{dashboardStats.total}</p>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-900/50 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Passed</span>
                  <p className="text-2xl font-bold text-emerald-300 font-mono">{dashboardStats.passCount}</p>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-rose-900/50 space-y-1">
                  <span className="text-[10px] font-bold text-rose-400 uppercase">Failed</span>
                  <p className="text-2xl font-bold text-rose-300 font-mono">{dashboardStats.failCount}</p>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-cyan-900/50 space-y-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">Quality Ratio</span>
                  <p className="text-2xl font-bold text-cyan-300 font-mono">{dashboardStats.passRatio}%</p>
                </div>
              </div>

              {/* Profile Summary Table */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 bg-slate-950 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Summary Statistics by Profile</span>
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Profile Name</th>
                        <th className="px-4 py-3 text-center">Inspected</th>
                        <th className="px-4 py-3 text-center">Avg Ra Max</th>
                        <th className="px-4 py-3 text-center">Avg Rz Max</th>
                        <th className="px-4 py-3 text-center">Avg Rt Max</th>
                        <th className="px-4 py-3 text-center">Avg Ry Max</th>
                        <th className="px-4 py-3 text-center">Pass Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {dashboardStats.profileSummaries.map((p) => (
                        <tr key={p.name} className="hover:bg-slate-950/40">
                          <td className="px-4 py-3 font-bold text-slate-200">{p.name}</td>
                          <td className="px-4 py-3 text-center font-mono">{p.total}</td>
                          <td className="px-4 py-3 text-center font-mono text-cyan-300 font-bold">{p.avgRa} µm</td>
                          <td className="px-4 py-3 text-center font-mono text-emerald-300 font-bold">{p.avgRz} µm</td>
                          <td className="px-4 py-3 text-center font-mono text-amber-300 font-bold">{p.avgRt} µm</td>
                          <td className="px-4 py-3 text-center font-mono text-indigo-300 font-bold">{p.avgRy} µm</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              parseFloat(p.passRate) >= 95 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {p.passRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sparkline Trends Section */}
              <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Sparkline Parameter Trends</span>
                  </h4>

                  <div className="flex items-center gap-3">
                    <select
                      value={trendFilterProfile}
                      onChange={(e) => setTrendFilterProfile(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {availableProfiles.map(p => (
                        <option key={p} value={p}>{p === 'All' ? 'All Profiles' : p}</option>
                      ))}
                    </select>

                    <select
                      value={trendFilterMonth}
                      onChange={(e) => setTrendFilterMonth(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {availableMonths.map(m => (
                        <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredTrends.map((group) => (
                    <div key={group.name} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <strong className="text-sm font-bold text-cyan-300">{group.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">Sample Size: {group.total}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Sparkline data={group.trends.ra} color="#06b6d4" label="Ra Max Trend" />
                        <Sparkline data={group.trends.rz} color="#10b981" label="Rz Max Trend" />
                        <Sparkline data={group.trends.rt} color="#f59e0b" label="Rt Max Trend" />
                        <Sparkline data={group.trends.ry} color="#6366f1" label="Ry Max Trend" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 p-12 rounded-2xl border border-slate-800 text-center text-slate-500">
              {isTh ? 'ยังไม่มีข้อมูลการตรวจวัดความเรียบผิว' : 'No inspection records for dashboard summary'}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isTh ? "ค้นหา Coil No, Profile, Inspector..." : "Search Coil No, Profile..."}
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 uppercase font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportToExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isTh ? 'ส่งออก CSV' : 'Export CSV'}</span>
              </button>

              <button
                onClick={() => setInspections([])}
                className="bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp / Date</th>
                    <th className="px-4 py-3">Coil / Side / Process</th>
                    <th className="px-4 py-3">Profile Name</th>
                    <th className="px-4 py-3">Max Params (Ra / Rz / Rt / Ry)</th>
                    <th className="px-4 py-3 text-center">Rz Cal</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Inspector</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredInspections.map((ins) => (
                    <tr key={ins.id} className="hover:bg-slate-950/40">
                      <td className="px-4 py-3 font-mono">
                        <strong className="text-slate-200 block text-xs">{ins.date}</strong>
                        <span className="text-[10px] text-slate-500">{ins.timestamp}</span>
                      </td>
                      <td className="px-4 py-3">
                        <strong className="text-cyan-300 text-xs block font-mono">{ins.lotNumber}</strong>
                        <span className="text-[10px] text-slate-400">{ins.partId} | {ins.process}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-300">
                        {ins.profileName}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="text-cyan-300">{ins.raMax}</span> / <span className="text-emerald-300">{ins.rzMax}</span> / <span className="text-amber-300">{ins.rtMax}</span> / <span className="text-indigo-300">{ins.ryMax} µm</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-rose-300">
                        {ins.calculatedRzCal}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          ins.status === 'Pass'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {ins.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {ins.inspectorName}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRequestEditHistory(ins)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition border border-amber-500/30 flex items-center gap-1 text-[11px] font-bold"
                            title={isTh ? "แก้ไขข้อมูล (ต้องใส่ Password)" : "Edit Record (Password required)"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isTh ? 'แก้ไข' : 'Edit'}</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'history', id: ins.id!, label: `Record: ${ins.lotNumber}` })}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredInspections.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500">
                        {isTh ? 'ไม่พบรายการประวัติการตรวจวัด' : 'No roughness measurement records found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                  ? 'กรอกรหัสผ่านเพื่อแก้ไขรายการตรวจวัด IPQA-02 (Password: admin2026)' 
                  : 'Enter password to edit IPQA-02 record (Password: admin2026)'}
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
                    {isTh ? 'แก้ไขข้อมูลการตรวจวัดความเรียบผิว (IPQA-02)' : 'Edit Surface Roughness Record'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Coil / Lot: {editingHistoryItem.lotNumber} | ID: {editingHistoryItem.id}
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Lot / Coil Number</label>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Profile Name</label>
                  <input
                    type="text"
                    value={editingHistoryItem.profileName || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, profileName: e.target.value })}
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inspector Name</label>
                  <input
                    type="text"
                    value={editingHistoryItem.inspectorName || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, inspectorName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
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
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Max Roughness Parameters (µm)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ra Max</label>
                    <input
                      type="text"
                      value={editingHistoryItem.raMax || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, raMax: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-cyan-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rz Max</label>
                    <input
                      type="text"
                      value={editingHistoryItem.rzMax || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, rzMax: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rt Max</label>
                    <input
                      type="text"
                      value={editingHistoryItem.rtMax || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, rtMax: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ry Max</label>
                    <input
                      type="text"
                      value={editingHistoryItem.ryMax || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, ryMax: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
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

    </div>
  );
};

export default RoughnessMeasurementApp;
