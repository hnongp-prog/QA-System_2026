import React, { useState, useMemo, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  StatsOverview 
} from './components/StatsOverview';
import { 
  ModuleGrid 
} from './components/ModuleGrid';
import { 
  ModuleDetailModal 
} from './components/ModuleDetailModal';
import { 
  QuickActivityLog 
} from './components/QuickActivityLog';
import { 
  AddCustomModuleModal 
} from './components/AddCustomModuleModal';
import { 
  Footer 
} from './components/Footer';

import { 
  INITIAL_MODULES, 
  INITIAL_ACTIVITIES, 
  MOCK_SYSTEM_METRICS, 
  MOCK_USER_PROFILE, 
  MOCK_SHIFT_INFO 
} from './data/mockData';

import { 
  QAModule, 
  QACategory, 
  Language, 
  ThemeMode,
  UserRole, 
  InspectionActivity, 
  SystemMetrics, 
  UserProfile, 
  ShiftInfo 
} from './types';

import { BilletIncomingApp } from './components/BilletIncomingApp';
import { ChemicalIncomingApp } from './components/ChemicalIncomingApp';
import { TensileMeasurementApp } from './components/TensileMeasurementApp';
import { RoughnessMeasurementApp } from './components/RoughnessMeasurementApp';
import { XRayMeasurementApp } from './components/XRayMeasurementApp';
import { CoatingMeasurementApp } from './components/CoatingMeasurementApp';
import { CuttingDimensionApp } from './components/CuttingDimensionApp';
import { MixingInspectionApp } from './components/MixingInspectionApp';
import { ZnWireIncomingApp } from './components/ZnWireIncomingApp';
import { MetrologyCalibrationApp } from './components/MetrologyCalibrationApp';
import { FgPreShipmentApp } from './components/FgPreShipmentApp';
import { ThicknessWallApp } from './components/ThicknessWallApp';
import { NcrManagementApp } from './components/NcrManagementApp';
import { CoiManagementApp } from './components/CoiManagementApp';
import { createNcrFromFailInspection, getStoredNcrRecords } from './utils/ncrStorage';
import { subscribeToCloudData, saveCloudData, logCloudInspectionActivity } from './services/firestoreSync';

import { 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Code2, 
  HelpCircle,
  FileText,
  SlidersHorizontal,
  LayoutGrid,
  Activity,
  Play,
  PackageCheck
} from 'lucide-react';

export default function App() {
  // Main System State
  const [modules, setModules] = useState<QAModule[]>(INITIAL_MODULES);
  const [activities, setActivities] = useState<InspectionActivity[]>(INITIAL_ACTIVITIES);
  const [metrics, setMetrics] = useState<SystemMetrics>(MOCK_SYSTEM_METRICS);
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo>(MOCK_SHIFT_INFO);

  // Real-time Cloud Data Subscriptions (Firebase Firestore)
  useEffect(() => {
    const unsubActivities = subscribeToCloudData<InspectionActivity[]>(
      'inspection_activities_list',
      (data) => {
        if (Array.isArray(data) && data.length > 0) {
          setActivities(data);
        }
      },
      INITIAL_ACTIVITIES
    );

    const unsubModules = subscribeToCloudData<QAModule[]>(
      'qa_system_modules',
      (data) => {
        if (Array.isArray(data) && data.length > 0) {
          setModules(data);
        }
      },
      INITIAL_MODULES
    );

    return () => {
      unsubActivities();
      unsubModules();
    };
  }, []);

  // Active Sub-App state
  const [activeSubApp, setActiveSubApp] = useState<string | null>(null);


  // UI Navigation & Controls
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [language, setLanguage] = useState<Language>('th');
  const [selectedCategory, setSelectedCategory] = useState<QACategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainTab, setActiveMainTab] = useState<'PORTAL' | 'LOGS'>('PORTAL');

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Modals
  const [selectedModuleForDetail, setSelectedModuleForDetail] = useState<QAModule | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isTh = language === 'th';

  // Toggle Module Pin
  const handleTogglePin = (id: string) => {
    setModules(prev => {
      const updated = prev.map(m => (m.id === id ? { ...m, pinned: !m.pinned } : m));
      saveCloudData('qa_system_modules', updated);
      return updated;
    });
  };

  // Add new Custom Sub-App Module
  const handleAddModule = (newMod: QAModule) => {
    setModules(prev => {
      const updated = [newMod, ...prev];
      saveCloudData('qa_system_modules', updated);
      return updated;
    });
  };

  // Add Test Activity from Sandbox or Sub-App
  const handleAddTestActivity = (newAct: InspectionActivity) => {
    setActivities(prev => {
      const updated = [newAct, ...prev];
      saveCloudData('inspection_activities_list', updated);
      return updated;
    });

    // Also log event document to collection for audit trail
    logCloudInspectionActivity(newAct);

    const isFail = newAct.result === 'FAIL' || newAct.result === 'REJECT';

    // If fail/reject/out of spec, automatically log into NCR-01 system!
    if (isFail) {
      // Helper extraction from batchLot if explicit fields are not provided
      let extractedCoil = newAct.coilNo || '';
      let extractedProfile = newAct.profile || '';

      if (!extractedCoil) {
        if (newAct.batchLot.includes('Coil:')) {
          const m = newAct.batchLot.match(/Coil:\s*([^,\(]+)/i);
          if (m) extractedCoil = m[1].trim();
        } else if (newAct.batchLot.includes('Box:')) {
          const m = newAct.batchLot.match(/Box:\s*([^,\(]+)/i);
          if (m) extractedCoil = m[1].trim();
        } else if (newAct.batchLot.includes(' - ')) {
          extractedCoil = newAct.batchLot.split(' - ')[1]?.trim() || newAct.batchLot;
        } else {
          extractedCoil = newAct.batchLot || 'LOT-AUTO-DETECT';
        }
      }

      if (!extractedProfile) {
        if (newAct.batchLot.includes('Profile:')) {
          const m = newAct.batchLot.match(/Profile:\s*([^,\)]+)/i);
          if (m) extractedProfile = m[1].trim();
        } else if (newAct.batchLot.includes('Part:')) {
          const m = newAct.batchLot.match(/Part:\s*([^,\)]+)/i);
          if (m) extractedProfile = m[1].trim();
        } else if (newAct.batchLot.includes(' - ')) {
          extractedProfile = newAct.batchLot.split(' - ')[0]?.trim() || 'Standard Spec';
        } else {
          extractedProfile = `${newAct.moduleTitleTh} Spec`;
        }
      }

      const processName = newAct.process || `${newAct.moduleCode} ${newAct.moduleTitleTh}`;
      const resultDetail = newAct.inspectionResult || newAct.remarks || 'FAIL / Out of Spec: Tolerance exceeded';

      try {
        createNcrFromFailInspection({
          coilNo: extractedCoil,
          profile: extractedProfile,
          inspectionDate: newAct.inspectionDate || new Date().toLocaleString('sv-SE').slice(0, 16),
          inspector: newAct.inspector,
          process: processName,
          inspectionResult: resultDetail,
          sourceModuleCode: newAct.moduleCode,
          severity: newAct.defectCount && newAct.defectCount > 2 ? 'CRITICAL' : 'MAJOR',
          status: 'QUARANTINE'
        });
      } catch (err) {
        console.warn('Failed to auto-create NCR from inspection fail:', err);
      }
    }

    // Update real-time metrics KPI
    const currentNcrCount = getStoredNcrRecords().filter(r => r.status !== 'CLOSED').length;
    setMetrics(prev => ({
      ...prev,
      totalInspectionsToday: prev.totalInspectionsToday + 1,
      activeDefects: isFail ? prev.activeDefects + 1 : prev.activeDefects,
      pendingNCRs: currentNcrCount
    }));
  };

  // Handle Launch Sub-App
  const handleLaunchApp = (code: string) => {
    setActiveSubApp(code);
  };

  // Filtered Modules Calculation
  const filteredModules = useMemo(() => {
    return modules
      .filter(mod => {
        // Category Filter
        if (selectedCategory !== 'ALL' && mod.category !== selectedCategory) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = mod.code.toLowerCase().includes(q);
          const matchTitleTh = mod.titleTh.toLowerCase().includes(q);
          const matchTitleEn = mod.titleEn.toLowerCase().includes(q);
          const matchDescTh = mod.descriptionTh.toLowerCase().includes(q);
          const matchDescEn = mod.descriptionEn.toLowerCase().includes(q);
          const matchCat = mod.category.toLowerCase().includes(q);
          return matchCode || matchTitleTh || matchTitleEn || matchDescTh || matchDescEn || matchCat;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned items stay first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
  }, [modules, selectedCategory, searchQuery]);

  // If a sub-app is active, render its full application screen (MUST be after all hooks)
  if (activeSubApp === 'IPQA-01' || activeSubApp === 'IPQC-01') {
    return (
      <TensileMeasurementApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'IPQA-02' || activeSubApp === 'IPQC-02') {
    return (
      <RoughnessMeasurementApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'IPQA-03' || activeSubApp === 'IPQC-03') {
    return (
      <XRayMeasurementApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'IPQA-04' || activeSubApp === 'IPQC-04') {
    return (
      <CoatingMeasurementApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'IPQA-05' || activeSubApp === 'IPQC-05') {
    return (
      <CuttingDimensionApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'IPQA-06' || activeSubApp === 'IPQC-06') {
    return (
      <MixingInspectionApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'IQA-01' || activeSubApp === 'IQC-01') {
    return (
      <BilletIncomingApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'IQA-02' || activeSubApp === 'IQC-02') {
    return (
      <ChemicalIncomingApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'IQA-03' || activeSubApp === 'IQC-03') {
    return (
      <ZnWireIncomingApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'EQP-01') {
    return (
      <MetrologyCalibrationApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'OQA-01' || activeSubApp === 'OQC-01') {
    return (
      <FgPreShipmentApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'IPQA-07' || activeSubApp === 'IPQC-07') {
    return (
      <ThicknessWallApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'NCR-01') {
    return (
      <NcrManagementApp
        onBackToPortal={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSubApp === 'COI-01') {
    return (
      <CoiManagementApp
        onBackToPortal={() => setActiveSubApp(null)}
        onBackToMenu={() => setActiveSubApp(null)}
        onLogNewActivity={handleAddTestActivity}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }


  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen font-sans flex flex-col antialiased transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Global Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
        userProfile={userProfile}
        onUserProfileChange={(role: UserRole) => setUserProfile({ ...userProfile, role })}
        shiftInfo={shiftInfo}
        onShiftInfoChange={setShiftInfo}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        totalModulesCount={modules.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">

        {/* Top KPI Banner & Category Selector */}
        <StatsOverview
          metrics={metrics}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          language={language}
          theme={theme}
          totalModulesCount={modules.length}
          filteredCount={filteredModules.length}
          onOpenNcr={() => setActiveSubApp('NCR-01')}
        />

        {/* Main View Switcher Tabs */}
        <div className={`flex items-center justify-between border-b pb-2 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMainTab('PORTAL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                activeMainTab === 'PORTAL'
                  ? isLight
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/50 shadow-md shadow-cyan-500/20'
                  : isLight
                    ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>{isTh ? 'คลังเมนูแอปย่อย (Sub-Apps Portal)' : 'Sub-Apps Portal'}</span>
            </button>

            <button
              onClick={() => setActiveMainTab('LOGS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                activeMainTab === 'LOGS'
                  ? isLight
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/50 shadow-md shadow-cyan-500/20'
                  : isLight
                    ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{isTh ? 'บันทึกการตรวจเรียลไทม์ (Inspection Logs)' : 'Inspection Logs'}</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: SUB-APPS PORTAL GRID */}
        {activeMainTab === 'PORTAL' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isTh ? 'เมนูระบบย่อยการตรวจคุณภาพ (QA Sub-App Modules)' : 'QA Sub-App Modules'}
                  <span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    ({filteredModules.length} {isTh ? 'เมนู' : 'modules'})
                  </span>
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isTh 
                    ? 'กด "เปิดแอป / ดูสเปค" บนแต่ละเมนู เพื่อเปิดหน้าต่างทดสอบจำลองหรือเตรียมสั่งสร้างแอปย่อย' 
                    : 'Click "Launch / Specs" on any module to open interactive sandbox or view sub-app specs.'}
                </p>
              </div>
            </div>

            {/* Grid of QA Sub-Apps */}
            <ModuleGrid
              modules={filteredModules}
              onSelectModule={(mod) => {
                if (mod.code === 'IPQA-01' || mod.code === 'IPQC-01') {
                  setActiveSubApp('IPQA-01');
                } else if (mod.code === 'IPQA-02' || mod.code === 'IPQC-02') {
                  setActiveSubApp('IPQA-02');
                } else if (mod.code === 'IPQA-03' || mod.code === 'IPQC-03') {
                  setActiveSubApp('IPQA-03');
                } else if (mod.code === 'IPQA-04' || mod.code === 'IPQC-04') {
                  setActiveSubApp('IPQA-04');
                } else if (mod.code === 'IPQA-05' || mod.code === 'IPQC-05') {
                  setActiveSubApp('IPQA-05');
                } else if (mod.code === 'IPQA-06' || mod.code === 'IPQC-06') {
                  setActiveSubApp('IPQA-06');
                } else if (mod.code === 'IQA-01' || mod.code === 'IQC-01') {
                  setActiveSubApp('IQA-01');
                } else if (mod.code === 'IQA-02' || mod.code === 'IQC-02') {
                  setActiveSubApp('IQA-02');
                } else if (mod.code === 'IQA-03' || mod.code === 'IQC-03') {
                  setActiveSubApp('IQA-03');
                } else if (mod.code === 'EQP-01') {
                  setActiveSubApp('EQP-01');
                } else if (mod.code === 'OQA-01' || mod.code === 'OQC-01') {
                  setActiveSubApp('OQA-01');
                } else if (mod.code === 'IPQA-07' || mod.code === 'IPQC-07') {
                  setActiveSubApp('IPQA-07');
                } else if (mod.code === 'NCR-01') {
                  setActiveSubApp('NCR-01');
                } else if (mod.code === 'COI-01') {
                  setActiveSubApp('COI-01');
                } else {
                  setSelectedModuleForDetail(mod);
                }
              }}
              onTogglePin={handleTogglePin}
              language={language}
              theme={theme}
            />
          </div>
        )}

        {/* VIEW 2: LIVE LOGS */}
        {activeMainTab === 'LOGS' && (
          <QuickActivityLog
            activities={activities}
            language={language}
            theme={theme}
          />
        )}

      </main>

      {/* Detail & Interactive Sandbox Modal */}
      <ModuleDetailModal
        module={selectedModuleForDetail}
        onClose={() => setSelectedModuleForDetail(null)}
        language={language}
        theme={theme}
        onAddTestActivity={handleAddTestActivity}
        onLaunchApp={handleLaunchApp}
      />

      {/* Add Custom Module Modal */}
      <AddCustomModuleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddModule={handleAddModule}
        language={language}
        theme={theme}
      />

      {/* Global Footer */}
      <Footer language={language} theme={theme} />

    </div>
  );

}
