import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Settings,
  Cpu,
  Lock,
  ChevronRight,
  ArrowLeft,
  Download,
  Plus,
  Search,
  Sliders,
  FileSpreadsheet,
  Edit3,
  RotateCcw,
  Sun,
  Moon
} from 'lucide-react';

import { 
  XRayProfileSpec, 
  XRayInspectionRecord, 
  Language, 
  InspectionActivity,
  ThemeMode
} from '../types';
import { useCloudState } from '../services/firestoreSync';

interface XRayMeasurementAppProps {
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

const DEFAULT_PROFILES: XRayProfileSpec[] = [
  { 
    name: 'Standard_ZnCoating', 
    raUp: '0.80', raLo: '0.80', 
    rzUp: '1.20', rzLo: '1.20', 
    fluxMinUp: '1.00', fluxMinLo: '1.00',
    fluxMaxUp: '2.00', fluxMaxLo: '2.00',
    coverageLimitUp: '95.0', coverageLimitLo: '95.0'
  },
  {
    name: 'HEAVY-ZN-GALV',
    raUp: '1.20', raLo: '1.20',
    rzUp: '1.80', rzLo: '1.80',
    fluxMinUp: '1.50', fluxMinLo: '1.50',
    fluxMaxUp: '2.80', fluxMaxLo: '2.80',
    coverageLimitUp: '98.0', coverageLimitLo: '98.0'
  },
  {
    name: 'LIGHT-PRECOAT-01',
    raUp: '0.40', raLo: '0.40',
    rzUp: '0.70', rzLo: '0.70',
    fluxMinUp: '0.50', fluxMinLo: '0.50',
    fluxMaxUp: '1.20', fluxMaxLo: '1.20',
    coverageLimitUp: '90.0', coverageLimitLo: '90.0'
  }
];

const INITIAL_INSPECTIONS: XRayInspectionRecord[] = [
  {
    id: 'rec-xray-001',
    lotNumber: 'COIL-2026-X101',
    partId: 'UP-SIDE',
    process: 'GALVANIZING',
    raUp: '0.95', raLo: '0.92',
    rzUp: '1.45', rzLo: '1.40',
    rtUp: '96.5', rtLo: '95.8',
    status: 'Pass',
    profileName: 'Standard_ZnCoating',
    inspectorName: 'Somchai P. (X-Ray)',
    machine: 'XRAY-SURF-01',
    date: '2026-08-04',
    timestamp: '04/08/2026, 09:30:00'
  },
  {
    id: 'rec-xray-002',
    lotNumber: 'COIL-2026-X102',
    partId: 'LO-SIDE',
    process: 'GALVANIZING',
    raUp: '0.72', raLo: '0.75',
    rzUp: '1.85', rzLo: '1.80',
    rtUp: '92.0', rtLo: '91.5',
    status: 'Fail',
    remarks: 'Zn weight below spec min (0.80 g/m²)',
    profileName: 'Standard_ZnCoating',
    inspectorName: 'Somchai P. (X-Ray)',
    machine: 'XRAY-SURF-01',
    date: '2026-08-05',
    timestamp: '05/08/2026, 11:15:00'
  }
];

export const XRayMeasurementApp: React.FC<XRayMeasurementAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th',
  theme = 'light',
  onToggleTheme
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'new-batch' | 'settings' | 'dashboard' | 'history'>('new-batch');
  const tableRef = useRef<HTMLDivElement>(null);

  // Saved Profiles & Inspections with Real-time Cloud Sync
  const [savedProfiles, setSavedProfiles] = useCloudState<XRayProfileSpec[]>('xray_qc_profiles', DEFAULT_PROFILES);
  const [inspections, setInspections] = useCloudState<XRayInspectionRecord[]>('xray_qc_inspections', INITIAL_INSPECTIONS);

  // Auth State for Settings
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);

  // Header Info State (Clean initial state)
  const [headerInfo, setHeaderInfo] = useState({
    inspectorName: '',
    machine: '',
    date: new Date().toISOString().split('T')[0],
    profileName: '',
    requirementRaUp: '', requirementRaLo: '', 
    requirementRzUp: '', requirementRzLo: '', 
    requirementFluxMinUp: '', requirementFluxMinLo: '',
    requirementFluxMaxUp: '', requirementFluxMaxLo: '',
    requirementCoverageLimitUp: '', requirementCoverageLimitLo: ''
  });

  const [profileStatus, setProfileStatus] = useState<'found' | 'not-found'>('not-found');

  // Batch Data Entry Items State (Clean initial state)
  const [batchItems, setBatchItems] = useState([
    { 
      id: Date.now(), 
      partId: '', 
      lotNumber: '', 
      process: '', 
      raUp: '', raLo: '', 
      rzUp: '', rzLo: '', 
      rtUp: '', rtLo: '', 
      status: 'Pending' as 'Pass' | 'Fail' | 'Pending', 
      remarks: '' 
    }
  ]);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'profile' | 'history'; id: string; label: string } | null>(null);

  // History Edit Auth & Modal States
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<XRayInspectionRecord | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<XRayInspectionRecord | null>(null);
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState('');
  const [historyAuthError, setHistoryAuthError] = useState(false);

  const handleRequestEditHistory = (item: XRayInspectionRecord) => {
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
      avgZn: number; countZn: number;
      avgFlux: number; countFlux: number;
      avgCov: number; countCov: number;
    }> = {};

    inspections.forEach(item => {
      const pName = item.profileName || 'Unknown';
      if (!profileGroups[pName]) {
        profileGroups[pName] = { 
          name: pName, total: 0, pass: 0, fail: 0, 
          avgZn: 0, countZn: 0,
          avgFlux: 0, countFlux: 0,
          avgCov: 0, countCov: 0,
        };
      }
      profileGroups[pName].total++;
      if (item.status === 'Pass') profileGroups[pName].pass++;
      else profileGroups[pName].fail++;

      const znUp = parseFloat(item.raUp);
      const znLo = parseFloat(item.raLo);
      if (!isNaN(znUp)) { profileGroups[pName].avgZn += znUp; profileGroups[pName].countZn++; }
      if (!isNaN(znLo)) { profileGroups[pName].avgZn += znLo; profileGroups[pName].countZn++; }

      const fluxUp = parseFloat(item.rzUp);
      const fluxLo = parseFloat(item.rzLo);
      if (!isNaN(fluxUp)) { profileGroups[pName].avgFlux += fluxUp; profileGroups[pName].countFlux++; }
      if (!isNaN(fluxLo)) { profileGroups[pName].avgFlux += fluxLo; profileGroups[pName].countFlux++; }

      const covUp = parseFloat(item.rtUp);
      const covLo = parseFloat(item.rtLo);
      if (!isNaN(covUp)) { profileGroups[pName].avgCov += covUp; profileGroups[pName].countCov++; }
      if (!isNaN(covLo)) { profileGroups[pName].avgCov += covLo; profileGroups[pName].countCov++; }
    });

    const profileSummaries = Object.values(profileGroups).map(g => {
      return {
        ...g,
        avgZn: g.countZn > 0 ? (g.avgZn / g.countZn).toFixed(2) : '-',
        avgFlux: g.countFlux > 0 ? (g.avgFlux / g.countFlux).toFixed(2) : '-',
        avgCov: g.countCov > 0 ? (g.avgCov / g.countCov).toFixed(1) : '-',
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

    const groups: Record<string, { name: string; total: number; history: XRayInspectionRecord[] }> = {};
    filtered.forEach(item => {
      const pName = item.profileName || 'Unknown';
      if (!groups[pName]) groups[pName] = { name: pName, total: 0, history: [] };
      groups[pName].total++;
      groups[pName].history.push(item);
    });

    return Object.values(groups).map(g => {
      const sortedHistory = [...g.history].reverse(); 
      const trends = {
        zn: sortedHistory.map(item => {
          let sum = 0, count = 0;
          if (!isNaN(parseFloat(item.raUp))) { sum += parseFloat(item.raUp); count++; }
          if (!isNaN(parseFloat(item.raLo))) { sum += parseFloat(item.raLo); count++; }
          return count > 0 ? sum / count : 0;
        }),
        flux: sortedHistory.map(item => {
          let sum = 0, count = 0;
          if (!isNaN(parseFloat(item.rzUp))) { sum += parseFloat(item.rzUp); count++; }
          if (!isNaN(parseFloat(item.rzLo))) { sum += parseFloat(item.rzLo); count++; }
          return count > 0 ? sum / count : 0;
        }),
        coverage: sortedHistory.map(item => {
          let sum = 0, count = 0;
          if (!isNaN(parseFloat(item.rtUp))) { sum += parseFloat(item.rtUp); count++; }
          if (!isNaN(parseFloat(item.rtLo))) { sum += parseFloat(item.rtLo); count++; }
          return count > 0 ? sum / count : 0;
        })
      };
      return { ...g, trends };
    });
  }, [inspections, trendFilterProfile, trendFilterMonth]);

  const formatSpecValue = (val: any) => {
    if (val === undefined || val === null || val === '' || isNaN(parseFloat(val))) return '0.0';
    return String(val);
  };

  const selectProfile = (profile: XRayProfileSpec) => {
    setHeaderInfo(prev => ({
      ...prev,
      profileName: profile.name,
      requirementRaUp: formatSpecValue(profile.raUp),
      requirementRaLo: formatSpecValue(profile.raLo),
      requirementRzUp: formatSpecValue(profile.rzUp),
      requirementRzLo: formatSpecValue(profile.rzLo),
      requirementFluxMinUp: formatSpecValue(profile.fluxMinUp),
      requirementFluxMinLo: formatSpecValue(profile.fluxMinLo),
      requirementFluxMaxUp: formatSpecValue(profile.fluxMaxUp),
      requirementFluxMaxLo: formatSpecValue(profile.fluxMaxLo),
      requirementCoverageLimitUp: formatSpecValue(profile.coverageLimitUp),
      requirementCoverageLimitLo: formatSpecValue(profile.coverageLimitLo)
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
          requirementFluxMinUp: formatSpecValue(match.fluxMinUp),
          requirementFluxMinLo: formatSpecValue(match.fluxMinLo),
          requirementFluxMaxUp: formatSpecValue(match.fluxMaxUp),
          requirementFluxMaxLo: formatSpecValue(match.fluxMaxLo),
          requirementCoverageLimitUp: formatSpecValue(match.coverageLimitUp),
          requirementCoverageLimitLo: formatSpecValue(match.coverageLimitLo)
        }));
        setProfileStatus('found');
      } else {
        setProfileStatus('not-found');
      }
    }
  }, [headerInfo.profileName, savedProfiles]);

  const handleSaveProfile = () => {
    if (!headerInfo.profileName.trim()) {
      showNotification(isTh ? 'กรุณาระบุชื่อ Profile ก่อนบันทึก' : 'Please specify Profile Name', 'error');
      return;
    }

    const newProfile: XRayProfileSpec = {
      name: headerInfo.profileName.trim(),
      raUp: headerInfo.requirementRaUp, raLo: headerInfo.requirementRaLo,
      rzUp: headerInfo.requirementRzUp, rzLo: headerInfo.requirementRzLo,
      fluxMinUp: headerInfo.requirementFluxMinUp, fluxMinLo: headerInfo.requirementFluxMinLo,
      fluxMaxUp: headerInfo.requirementFluxMaxUp, fluxMaxLo: headerInfo.requirementFluxMaxLo,
      coverageLimitUp: headerInfo.requirementCoverageLimitUp,
      coverageLimitLo: headerInfo.requirementCoverageLimitLo,
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

  const reqZnUp = !headerInfo.profileName || parseFloat(headerInfo.requirementRaUp) > 0 || parseFloat(headerInfo.requirementRzUp) > 0;
  const reqZnLo = !headerInfo.profileName || parseFloat(headerInfo.requirementRaLo) > 0 || parseFloat(headerInfo.requirementRzLo) > 0;
  const reqFluxUp = !headerInfo.profileName || parseFloat(headerInfo.requirementFluxMinUp) > 0 || parseFloat(headerInfo.requirementFluxMaxUp) > 0;
  const reqFluxLo = !headerInfo.profileName || parseFloat(headerInfo.requirementFluxMinLo) > 0 || parseFloat(headerInfo.requirementFluxMaxLo) > 0;
  const reqCoverageUp = !headerInfo.profileName || parseFloat(headerInfo.requirementCoverageLimitUp) > 0;
  const reqCoverageLo = !headerInfo.profileName || parseFloat(headerInfo.requirementCoverageLimitLo) > 0;

  const judgeStatus = (item: typeof batchItems[0]): 'Pass' | 'Fail' | 'Pending' => {
    const specs = {
      znMinUp: parseFloat(headerInfo.requirementRaUp) || 0,
      znMaxUp: parseFloat(headerInfo.requirementRzUp) || 0,
      znMinLo: parseFloat(headerInfo.requirementRaLo) || 0,
      znMaxLo: parseFloat(headerInfo.requirementRzLo) || 0,
      fluxMinUp: parseFloat(headerInfo.requirementFluxMinUp) || 0,
      fluxMaxUp: parseFloat(headerInfo.requirementFluxMaxUp) || 0,
      fluxMinLo: parseFloat(headerInfo.requirementFluxMinLo) || 0,
      fluxMaxLo: parseFloat(headerInfo.requirementFluxMaxLo) || 0,
      coverageUp: parseFloat(headerInfo.requirementCoverageLimitUp) || 0,
      coverageLo: parseFloat(headerInfo.requirementCoverageLimitLo) || 0
    };

    if (reqZnUp && item.raUp === '') return 'Pending';
    if (reqZnLo && item.raLo === '') return 'Pending';
    if (reqFluxUp && item.rzUp === '') return 'Pending';
    if (reqFluxLo && item.rzLo === '') return 'Pending';

    let pass = true;

    if (reqZnUp) {
      const znUp = parseFloat(item.raUp);
      if (specs.znMinUp > 0 && znUp < specs.znMinUp) pass = false;
      if (specs.znMaxUp > 0 && znUp > specs.znMaxUp) pass = false;
    }

    if (reqZnLo) {
      const znLo = parseFloat(item.raLo);
      if (specs.znMinLo > 0 && znLo < specs.znMinLo) pass = false;
      if (specs.znMaxLo > 0 && znLo > specs.znMaxLo) pass = false;
    }

    if (reqFluxUp) {
      const fluxUp = parseFloat(item.rzUp);
      if (specs.fluxMinUp > 0 && fluxUp < specs.fluxMinUp) pass = false;
      if (specs.fluxMaxUp > 0 && fluxUp > specs.fluxMaxUp) pass = false;
    }

    if (reqFluxLo) {
      const fluxLo = parseFloat(item.rzLo);
      if (specs.fluxMinLo > 0 && fluxLo < specs.fluxMinLo) pass = false;
      if (specs.fluxMaxLo > 0 && fluxLo > specs.fluxMaxLo) pass = false;
    }

    if (reqCoverageUp && item.rtUp !== '' && parseFloat(item.rtUp) < specs.coverageUp) pass = false;
    if (reqCoverageLo && item.rtLo !== '' && parseFloat(item.rtLo) < specs.coverageLo) pass = false;

    return pass ? 'Pass' : 'Fail';
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleResetForm = () => {
    setHeaderInfo({
      inspectorName: '',
      machine: '',
      date: new Date().toISOString().split('T')[0],
      profileName: '',
      requirementRaUp: '', requirementRaLo: '', 
      requirementRzUp: '', requirementRzLo: '', 
      requirementFluxMinUp: '', requirementFluxMinLo: '',
      requirementFluxMaxUp: '', requirementFluxMaxLo: '',
      requirementCoverageLimitUp: '', requirementCoverageLimitLo: ''
    });
    setProfileStatus('not-found');
    setBatchItems([{ 
      id: Date.now(), 
      partId: '', 
      lotNumber: '', 
      process: '', 
      raUp: '', raLo: '', 
      rzUp: '', rzLo: '', 
      rtUp: '', rtLo: '', 
      status: 'Pending', 
      remarks: '' 
    }]);
  };

  const addRow = () => {
    const lastItem = batchItems[batchItems.length - 1];
    setBatchItems(prev => [...prev, { 
      id: Date.now() + Math.random(), 
      partId: lastItem ? lastItem.partId : '', 
      lotNumber: lastItem ? lastItem.lotNumber : '', 
      process: lastItem ? lastItem.process : '', 
      raUp: '', raLo: '', 
      rzUp: '', rzLo: '', 
      rtUp: '', rtLo: '', 
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

  const saveBatch = () => {
    const validItems = batchItems.filter(item => (item.partId || item.lotNumber) && judgeStatus(item) !== 'Pending');
    if (validItems.length === 0) {
      showNotification(isTh ? 'กรุณากรอกข้อมูลให้ครบถ้วนอย่างน้อย 1 รายการ' : 'Please enter inspection data', 'error');
      return;
    }

    const now = new Date();
    const newRecords: XRayInspectionRecord[] = validItems.map(item => {
      const decision = judgeStatus(item);
      const recId = `rec-xray-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      if (onLogNewActivity) {
        onLogNewActivity({
          id: recId,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'IPQA-03',
          moduleTitleTh: 'การตรวจวัดด้วยรังสีเอกซ์ (X-Ray Measurement)',
          moduleTitleEn: 'X-Ray Coating Weight & Coverage Measurement System',
          inspector: headerInfo.inspectorName || 'X-Ray Technician',
          batchLot: `${headerInfo.profileName} - ${item.lotNumber}`,
          result: decision === 'Pass' ? 'PASS' : 'REJECT',
          defectCount: decision === 'Fail' ? 1 : 0,
          remarks: `Zn: ${item.raUp}/${item.raLo}, Flux: ${item.rzUp}/${item.rzLo}, Coverage: ${item.rtUp}/${item.rtLo}%`
        });
      }

      return {
        id: recId,
        lotNumber: item.lotNumber.trim().toUpperCase() || 'COIL-UNTITLED',
        partId: item.partId.trim().toUpperCase() || 'UP-SIDE',
        process: item.process.trim().toUpperCase() || 'GALVANIZING',
        raUp: item.raUp,
        raLo: item.raLo,
        rzUp: item.rzUp,
        rzLo: item.rzLo,
        rtUp: item.rtUp,
        rtLo: item.rtLo,
        status: decision,
        remarks: item.remarks,
        profileName: headerInfo.profileName,
        inspectorName: headerInfo.inspectorName || 'X-Ray Inspector',
        machine: headerInfo.machine || 'XRAY-SURF-01',
        date: headerInfo.date,
        timestamp: now.toLocaleString('th-TH'),
        timestamp_raw: now.toISOString()
      };
    });

    setInspections(prev => [...newRecords, ...prev]);
    showNotification(isTh ? `บันทึกข้อมูล ${validItems.length} รายการเรียบร้อยแล้ว` : `Saved ${validItems.length} inspection items`);

    setBatchItems([{ 
      id: Date.now(), 
      partId: '', lotNumber: '', process: '', 
      raUp: '', raLo: '', rzUp: '', rzLo: '', rtUp: '', rtLo: '', 
      status: 'Pending', remarks: '' 
    }]);

    setActiveTab('history');
  };

  const isOutOfSpec = (val: string, min: string, max: string) => {
    const v = parseFloat(val);
    if (isNaN(v)) return false;
    const minVal = parseFloat(min) || 0;
    const maxVal = parseFloat(max) || 0;
    if (minVal > 0 && v < minVal) return true;
    if (maxVal > 0 && v > maxVal) return true;
    return false;
  };

  const exportToExcel = () => {
    if (inspections.length === 0) {
      showNotification(isTh ? 'ไม่มีข้อมูลสำหรับ Export' : 'No history to export', 'error');
      return;
    }

    const headers = [
      'Timestamp', 'Inspector', 'Machine', 'Profile Name', 'Coil No', 'Side', 'Process', 
      'Zn Up', 'Zn Lo', 'Flux Up', 'Flux Lo', 'Coverage Up', 'Coverage Lo', 'Status'
    ];

    const csvRows = inspections.map(ins => [
      `"${ins.timestamp}"`,
      `"${ins.inspectorName}"`,
      `"${ins.machine || '-'}"`,
      `"${ins.profileName}"`,
      `"${ins.lotNumber}"`,
      `"${ins.partId}"`,
      `"${ins.process}"`,
      ins.raUp, ins.raLo, ins.rzUp, ins.rzLo, ins.rtUp, ins.rtLo,
      `"${ins.status}"`
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Xray_Inspection_${new Date().toISOString().split('T')[0]}.csv`);
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
                isLight ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
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
                      ? 'bg-slate-50 border-slate-300 text-indigo-600 focus:border-indigo-500' 
                      : 'bg-slate-950 border-slate-800 text-indigo-300 focus:border-indigo-500'
                  }`}
                  autoFocus
                />
                {adminAuthError && (
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
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-md"
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
              <ArrowLeft className="w-4 h-4 text-indigo-600" />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-md ${
              isLight ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-600/20'
            }`}>
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                }`}>
                  IPQA-03
                </span>
                <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isTh ? 'ระบบตรวจวัดด้วยรังสีเอกซ์ (X-Ray Measurement)' : 'X-Ray Measurement System'}
                </h1>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh 
                  ? 'วัดค่า Zn Weight, Flux Weight, Coverage % ขอบบน-ขอบล่าง พร้อมกราฟแนวโน้ม' 
                  : 'X-Ray Zn weight, Flux weight & Coverage % (Up/Lo) with sparklines & admin spec manager'}
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
            isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cloud Sync Active</span>
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
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
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
            activeTab === 'settings'
              ? isLight
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
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
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
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
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{isTh ? '📜 ประวัติ' : 'History Log'}</span>
          {inspections.length > 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
              isLight ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-slate-950 text-indigo-300 border-indigo-800'
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
          {/* Header Metadata */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
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
                    const pName = e.target.value;
                    if (!pName) {
                      setHeaderInfo(prev => ({
                        ...prev,
                        profileName: '',
                        requirementRaUp: '', requirementRaLo: '', 
                        requirementRzUp: '', requirementRzLo: '', 
                        requirementFluxMinUp: '', requirementFluxMinLo: '',
                        requirementFluxMaxUp: '', requirementFluxMaxLo: '',
                        requirementCoverageLimitUp: '', requirementCoverageLimitLo: ''
                      }));
                      setProfileStatus('not-found');
                    } else {
                      const selected = savedProfiles.find(p => p.name === pName);
                      if (selected) selectProfile(selected);
                    }
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
                  placeholder={isTh ? 'ชื่อผู้ตรวจสอบ / Inspector name' : 'Inspector name'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
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
                  placeholder={isTh ? 'เช่น XRAY-SURF-01' : 'Machine No.'}
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
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
              <div><span className="text-slate-500">Zn Weight Limit:</span> <strong className="text-indigo-300">{headerInfo.requirementRaUp ? `${headerInfo.requirementRaUp} - ${headerInfo.requirementRzUp} g/m²` : '-'}</strong></div>
              <div><span className="text-slate-500">Flux Weight Limit:</span> <strong className="text-emerald-300">{headerInfo.requirementFluxMinUp ? `${headerInfo.requirementFluxMinUp} - ${headerInfo.requirementFluxMaxUp} g/m²` : '-'}</strong></div>
              <div><span className="text-slate-500">Coverage % Limit:</span> <strong className="text-amber-300">{headerInfo.requirementCoverageLimitUp ? `≥ ${headerInfo.requirementCoverageLimitUp}%` : '-'}</strong></div>
            </div>
          </div>

          {/* Measurement Table */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md overflow-hidden" ref={tableRef}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                {isTh ? '2. ตารางบันทึกค่ารังสีเอกซ์ (X-Ray Measurements Entry)' : '2. X-Ray Entry Table'}
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
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>{isTh ? '+ เพิ่มรายการ' : 'Add Row'}</span>
                </button>

                <button
                  type="button"
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
                      <th className="px-3 py-3 w-64">Coil Info (Side / Process)</th>
                      <th className="px-3 py-3 text-center bg-indigo-950/30 text-indigo-300 border-l border-slate-800" colSpan={2}>
                        Zn weight (Up / Lo)
                      </th>
                      <th className="px-3 py-3 text-center bg-emerald-950/30 text-emerald-300 border-l border-slate-800" colSpan={2}>
                        Flux weight (Up / Lo)
                      </th>
                      <th className="px-3 py-3 text-center bg-amber-950/30 text-amber-300 border-l border-slate-800" colSpan={2}>
                        Coverage % (Up / Lo)
                      </th>
                      <th className="px-3 py-3 text-center border-l border-slate-800">Status</th>
                      <th className="px-3 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {batchItems.map((item) => {
                      const currentStatus = judgeStatus(item);

                      const isZnUpFail = isOutOfSpec(item.raUp, headerInfo.requirementRaUp, headerInfo.requirementRzUp);
                      const isZnLoFail = isOutOfSpec(item.raLo, headerInfo.requirementRaLo, headerInfo.requirementRzLo);
                      const isFluxUpFail = isOutOfSpec(item.rzUp, headerInfo.requirementFluxMinUp, headerInfo.requirementFluxMaxUp);
                      const isFluxLoFail = isOutOfSpec(item.rzLo, headerInfo.requirementFluxMinLo, headerInfo.requirementFluxMaxLo);
                      const isCovUpFail = parseFloat(headerInfo.requirementCoverageLimitUp) > 0 && item.rtUp !== '' && parseFloat(item.rtUp) < parseFloat(headerInfo.requirementCoverageLimitUp);
                      const isCovLoFail = parseFloat(headerInfo.requirementCoverageLimitLo) > 0 && item.rtLo !== '' && parseFloat(item.rtLo) < parseFloat(headerInfo.requirementCoverageLimitLo);

                      return (
                        <tr key={item.id} className="hover:bg-slate-950/50 transition-colors">
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1.5 items-center">
                              <input 
                                type="text" 
                                placeholder="Coil No." 
                                value={item.lotNumber} 
                                onChange={(e) => handleItemChange(item.id, 'lotNumber', e.target.value)} 
                                className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-200 uppercase focus:outline-none focus:border-indigo-500" 
                              />
                              <input 
                                type="text" 
                                placeholder="Side" 
                                value={item.partId} 
                                onChange={(e) => handleItemChange(item.id, 'partId', e.target.value)} 
                                className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-200 uppercase focus:outline-none focus:border-indigo-500" 
                              />
                              <input 
                                type="text" 
                                placeholder="Process" 
                                value={item.process} 
                                onChange={(e) => handleItemChange(item.id, 'process', e.target.value)} 
                                className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-200 uppercase focus:outline-none focus:border-indigo-500" 
                              />
                            </div>
                          </td>

                          {/* Zn weight (Up / Lo) */}
                          <td className="px-2 py-2.5 text-center bg-indigo-950/10 border-l border-slate-800" colSpan={2}>
                            <div className="flex gap-2 justify-center">
                              {reqZnUp ? (
                                <input 
                                  type="number" step="0.01" 
                                  placeholder="Up" 
                                  value={item.raUp} 
                                  onChange={(e) => handleItemChange(item.id, 'raUp', e.target.value)} 
                                  className={`w-16 text-center border rounded-lg px-1 py-1.5 font-mono font-bold text-xs outline-none ${
                                    isZnUpFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-indigo-300 focus:border-indigo-500'
                                  }`} 
                                />
                              ) : <div className="w-16 py-1.5 text-slate-600 bg-slate-950 border border-slate-800 rounded-lg text-center">-</div>}

                              {reqZnLo ? (
                                <input 
                                  type="number" step="0.01" 
                                  placeholder="Lo" 
                                  value={item.raLo} 
                                  onChange={(e) => handleItemChange(item.id, 'raLo', e.target.value)} 
                                  className={`w-16 text-center border rounded-lg px-1 py-1.5 font-mono font-bold text-xs outline-none ${
                                    isZnLoFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-indigo-300 focus:border-indigo-500'
                                  }`} 
                                />
                              ) : <div className="w-16 py-1.5 text-slate-600 bg-slate-950 border border-slate-800 rounded-lg text-center">-</div>}
                            </div>
                          </td>

                          {/* Flux weight (Up / Lo) */}
                          <td className="px-2 py-2.5 text-center bg-emerald-950/10 border-l border-slate-800" colSpan={2}>
                            <div className="flex gap-2 justify-center">
                              {reqFluxUp ? (
                                <input 
                                  type="number" step="0.01" 
                                  placeholder="Up" 
                                  value={item.rzUp} 
                                  onChange={(e) => handleItemChange(item.id, 'rzUp', e.target.value)} 
                                  className={`w-16 text-center border rounded-lg px-1 py-1.5 font-mono font-bold text-xs outline-none ${
                                    isFluxUpFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-emerald-300 focus:border-emerald-500'
                                  }`} 
                                />
                              ) : <div className="w-16 py-1.5 text-slate-600 bg-slate-950 border border-slate-800 rounded-lg text-center">-</div>}

                              {reqFluxLo ? (
                                <input 
                                  type="number" step="0.01" 
                                  placeholder="Lo" 
                                  value={item.rzLo} 
                                  onChange={(e) => handleItemChange(item.id, 'rzLo', e.target.value)} 
                                  className={`w-16 text-center border rounded-lg px-1 py-1.5 font-mono font-bold text-xs outline-none ${
                                    isFluxLoFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-emerald-300 focus:border-emerald-500'
                                  }`} 
                                />
                              ) : <div className="w-16 py-1.5 text-slate-600 bg-slate-950 border border-slate-800 rounded-lg text-center">-</div>}
                            </div>
                          </td>

                          {/* Coverage % (Up / Lo) */}
                          <td className="px-2 py-2.5 text-center bg-amber-950/10 border-l border-slate-800" colSpan={2}>
                            <div className="flex gap-2 justify-center">
                              {reqCoverageUp ? (
                                <input 
                                  type="number" step="0.1" 
                                  placeholder="Up %" 
                                  value={item.rtUp} 
                                  onChange={(e) => handleItemChange(item.id, 'rtUp', e.target.value)} 
                                  className={`w-16 text-center border rounded-lg px-1 py-1.5 font-mono font-bold text-xs outline-none ${
                                    isCovUpFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-amber-300 focus:border-amber-500'
                                  }`} 
                                />
                              ) : <div className="w-16 py-1.5 text-slate-600 bg-slate-950 border border-slate-800 rounded-lg text-center">-</div>}

                              {reqCoverageLo ? (
                                <input 
                                  type="number" step="0.1" 
                                  placeholder="Lo %" 
                                  value={item.rtLo} 
                                  onChange={(e) => handleItemChange(item.id, 'rtLo', e.target.value)} 
                                  className={`w-16 text-center border rounded-lg px-1 py-1.5 font-mono font-bold text-xs outline-none ${
                                    isCovLoFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-amber-300 focus:border-amber-500'
                                  }`} 
                                />
                              ) : <div className="w-16 py-1.5 text-slate-600 bg-slate-950 border border-slate-800 rounded-lg text-center">-</div>}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2.5 text-center border-l border-slate-800">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              currentStatus === 'Pass' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                : currentStatus === 'Fail' 
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {currentStatus}
                            </span>
                          </td>

                          {/* Delete Row */}
                          <td className="px-3 py-2.5 text-center">
                            <button 
                              type="button" 
                              onClick={() => setBatchItems(prev => prev.filter(i => i.id !== item.id))} 
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                {isTh ? 'ตั้งค่า Spec มาตรฐาน (Profile Specifications)' : 'Profile Specifications Control'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTh ? 'กำหนดขีดจำกัด Min/Max ของ Zn weight, Flux weight และ Coverage %' : 'Manage Min/Max specs for Zn weight, Flux weight & Coverage %'}
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
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isTh ? 'รายการ Profile Spec ในระบบ' : 'Saved Profile Specs'}
              </span>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {savedProfiles.map((p) => (
                  <div
                    key={p.name}
                    className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                      headerInfo.profileName === p.name 
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                    onClick={() => selectProfile(p)}
                  >
                    <div>
                      <div className="font-bold text-xs">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Zn: {p.raUp}-{p.rzUp} | Flux: {p.fluxMinUp}-{p.fluxMaxUp} | Cov: {p.coverageLimitUp}%
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ type: 'profile', id: p.name, label: p.name });
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Spec Editor */}
            <div className="lg:col-span-2 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Profile Name *
                </label>
                <input
                  type="text"
                  name="profileName"
                  value={headerInfo.profileName}
                  onChange={handleHeaderChange}
                  placeholder="e.g. Standard_ZnCoating"
                  className="w-full bg-slate-950 border border-slate-800 text-indigo-300 font-bold rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upper Surface Spec */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase border-b border-slate-800 pb-2">
                    Upper Surface Specifications
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Zn weight Min (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name="requirementRaUp"
                        value={headerInfo.requirementRaUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Zn weight Max (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name="requirementRzUp"
                        value={headerInfo.requirementRzUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Flux weight Min (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name="requirementFluxMinUp"
                        value={headerInfo.requirementFluxMinUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Flux weight Max (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name="requirementFluxMaxUp"
                        value={headerInfo.requirementFluxMaxUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">Coverage Limit Min (%)</label>
                      <input
                        type="number" step="0.1"
                        name="requirementCoverageLimitUp"
                        value={headerInfo.requirementCoverageLimitUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Lower Surface Spec */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase border-b border-slate-800 pb-2">
                    Lower Surface Specifications
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Zn weight Min (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name="requirementRaLo"
                        value={headerInfo.requirementRaLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Zn weight Max (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name="requirementRzLo"
                        value={headerInfo.requirementRzLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Flux weight Min (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name="requirementFluxMinLo"
                        value={headerInfo.requirementFluxMinLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Flux weight Max (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name="requirementFluxMaxLo"
                        value={headerInfo.requirementFluxMaxLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">Coverage Limit Min (%)</label>
                      <input
                        type="number" step="0.1"
                        name="requirementCoverageLimitLo"
                        value={headerInfo.requirementCoverageLimitLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500"
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
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Inspected</p>
                    <p className="text-2xl font-bold text-white">{dashboardStats.total} <span className="text-xs font-normal text-slate-500">Coils</span></p>
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Passed</p>
                    <p className="text-2xl font-bold text-emerald-400">{dashboardStats.passCount} <span className="text-xs font-normal text-slate-500">Coils</span></p>
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                  <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Failed</p>
                    <p className="text-2xl font-bold text-rose-400">{dashboardStats.failCount} <span className="text-xs font-normal text-slate-500">Coils</span></p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-purple-950 p-5 rounded-2xl border border-indigo-800 flex items-center gap-4 text-white">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Target className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-indigo-300 uppercase">Pass Rate</p>
                    <p className="text-2xl font-bold text-white">{dashboardStats.passRatio}%</p>
                  </div>
                </div>
              </div>

              {/* Profile Summary Table */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Summary Statistics by Profile
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Profile Name</th>
                        <th className="px-4 py-3 text-center">Total Lots</th>
                        <th className="px-4 py-3 text-center">Avg Zn (g/m²)</th>
                        <th className="px-4 py-3 text-center">Avg Flux (g/m²)</th>
                        <th className="px-4 py-3 text-center">Avg Coverage %</th>
                        <th className="px-4 py-3 text-center">Pass / Fail</th>
                        <th className="px-4 py-3 text-right">Pass Rate (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono">
                      {dashboardStats.profileSummaries.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-950/40 transition">
                          <td className="px-4 py-3 font-sans font-bold text-slate-200">{p.name}</td>
                          <td className="px-4 py-3 text-center text-slate-300">{p.total}</td>
                          <td className="px-4 py-3 text-center text-indigo-300 font-bold">{p.avgZn}</td>
                          <td className="px-4 py-3 text-center text-emerald-300 font-bold">{p.avgFlux}</td>
                          <td className="px-4 py-3 text-center text-amber-300 font-bold">{p.avgCov}</td>
                          <td className="px-4 py-3 text-center font-sans">
                            <span className="text-emerald-400 font-bold">{p.pass}</span>
                            <span className="text-slate-600 mx-1">/</span>
                            <span className="text-rose-400 font-bold">{p.fail}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-sans font-bold">
                            <span className={parseFloat(p.passRate) >= 95 ? 'text-emerald-400' : 'text-rose-400'}>
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
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    X-Ray Measurement Trend Analysis
                  </h3>

                  <div className="flex items-center gap-2">
                    <select
                      value={trendFilterProfile}
                      onChange={(e) => setTrendFilterProfile(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="All">All Profiles</option>
                      {availableProfiles.filter(p => p !== 'All').map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>

                    <select
                      value={trendFilterMonth}
                      onChange={(e) => setTrendFilterMonth(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="All">All Months</option>
                      {availableMonths.filter(m => m !== 'All').map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  {filteredTrends.map((p, idx) => (
                    <div key={idx} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-sm text-indigo-300">{p.name}</h4>
                          <span className="text-[10px] text-slate-500 uppercase">Sample Count: {p.total}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Sparkline data={p.trends.zn} color="#818cf8" label="Zn Weight Trend (g/m²)" />
                        <Sparkline data={p.trends.flux} color="#34d399" label="Flux Weight Trend (g/m²)" />
                        <Sparkline data={p.trends.coverage} color="#fbbf24" label="Coverage % Trend" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 space-y-2">
              <PieChart className="w-12 h-12 mx-auto opacity-30" />
              <p className="text-xs font-semibold">{isTh ? 'ยังไม่มีข้อมูลการตรวจวัด' : 'No inspection records found'}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HISTORY & EXPORT */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {isTh ? 'ประวัติการตรวจวัด X-Ray (Cloud Sync)' : 'Inspection History'}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  placeholder={isTh ? 'ค้นหา Coil / Profile...' : 'Search Coil / Profile...'}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500 w-48"
                />
              </div>

              <button
                onClick={exportToExcel}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3">Timestamp</th>
                  <th className="px-3 py-3">Machine</th>
                  <th className="px-3 py-3">Coil / Side / Process</th>
                  <th className="px-3 py-3">Profile Spec</th>
                  <th className="px-3 py-3 text-center">Zn Wt (Up/Lo)</th>
                  <th className="px-3 py-3 text-center">Flux Wt (Up/Lo)</th>
                  <th className="px-3 py-3 text-center">Coverage (Up/Lo)</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3">Inspector</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredInspections.map((ins, idx) => (
                  <tr key={ins.id || idx} className="hover:bg-slate-950/50 transition-colors">
                    <td className="px-3 py-3 text-slate-400 text-[11px]">{ins.timestamp}</td>
                    <td className="px-3 py-3 font-semibold text-indigo-400">{ins.machine || '-'}</td>
                    <td className="px-3 py-3 font-sans font-bold text-slate-200">
                      {ins.lotNumber} / <span className="text-indigo-300">{ins.partId}</span> / <span className="text-slate-400">{ins.process}</span>
                    </td>
                    <td className="px-3 py-3 font-sans text-slate-300">{ins.profileName}</td>
                    <td className="px-3 py-3 text-center text-indigo-300">
                      {ins.raUp || '-'} / {ins.raLo || '-'}
                    </td>
                    <td className="px-3 py-3 text-center text-emerald-300">
                      {ins.rzUp || '-'} / {ins.rzLo || '-'}
                    </td>
                    <td className="px-3 py-3 text-center text-amber-300">
                      {ins.rtUp || '-'}% / {ins.rtLo || '-'}%
                    </td>
                    <td className="px-3 py-3 text-center font-sans">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ins.status === 'Pass' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {ins.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-sans text-slate-400">{ins.inspectorName}</td>
                    <td className="px-3 py-3 text-center">
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
                          onClick={() => setDeleteConfirm({ type: 'history', id: ins.id || String(idx), label: ins.lotNumber })}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
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
                  ? 'กรอกรหัสผ่านเพื่อแก้ไขรายการตรวจวัด IPQA-03 (Password: admin2026)' 
                  : 'Enter password to edit IPQA-03 record (Password: admin2026)'}
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
                    {isTh ? 'แก้ไขข้อมูลการตรวจวัดรังสีเอกซ์ (IPQA-03)' : 'Edit X-Ray Measurement Record'}
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Machine</label>
                  <input
                    type="text"
                    value={editingHistoryItem.machine || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, machine: e.target.value })}
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
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">X-Ray Measured Values</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Zn Wt Up (g/m²)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.raUp || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, raUp: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Zn Wt Lo (g/m²)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.raLo || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, raLo: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Flux Wt Up (g/m²)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.rzUp || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, rzUp: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Flux Wt Lo (g/m²)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.rzLo || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, rzLo: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Coverage Up (%)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.rtUp || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, rtUp: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Coverage Lo (%)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.rtLo || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, rtLo: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
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
