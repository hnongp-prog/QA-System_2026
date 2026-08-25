import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Truck, 
  Camera, 
  Upload, 
  FileSpreadsheet, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Filter, 
  RefreshCw, 
  Layers, 
  Eye, 
  Sparkles, 
  FileText, 
  Building2, 
  BarChart3, 
  History, 
  Settings, 
  X,
  Check,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Box
} from 'lucide-react';

import { 
  FgPreShipmentRecord, 
  FgCoilItem, 
  FgProfileSpec, 
  Language, 
  InspectionActivity 
} from '../types';
import { analyzeFgPreShipmentLabelClient } from '../services/geminiClient';
import { useCloudState } from '../services/firestoreSync';

interface FgPreShipmentAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
}

const ADMIN_PASS = 'admin2026';

const INITIAL_PROFILES: FgProfileSpec[] = [
  {
    id: 'prof-01',
    profileName: 'Profile-A (Tokyo Export)',
    partNo: 'P-8801-TK',
    drawing: 'DWG-2026-001',
    destinationTo: 'TOKYO / JAPAN',
    description: 'Export Grade High-Durability Coated Strip',
    dimW: '120.5',
    dimH: '45.0',
    dimL: '2500'
  },
  {
    id: 'prof-02',
    profileName: 'Profile-B (Osaka Line)',
    partNo: 'P-9920-OS',
    drawing: 'DWG-2026-008',
    destinationTo: 'OSAKA / JAPAN',
    description: 'Precision Coated Steel Profile B',
    dimW: '150.0',
    dimH: '50.0',
    dimL: '3000'
  },
  {
    id: 'prof-03',
    profileName: 'Profile-C (USA Domestic)',
    partNo: 'P-7730-US',
    drawing: 'DWG-2026-015',
    destinationTo: 'LONG BEACH / USA',
    description: 'Heavy Duty Structural Coated Channel',
    dimW: '200.0',
    dimH: '75.0',
    dimL: '6000'
  }
];

const INITIAL_HISTORY: FgPreShipmentRecord[] = [
  {
    docId: 'hist-001',
    id: 'FG-2026-0801',
    timestamp: '2026-08-05 14:20',
    timestampRaw: '2026-08-05T14:20:00Z',
    inspectorName: 'Sompong P.',
    destinationTo: 'TOKYO / JAPAN',
    profileName: 'Profile-A (Tokyo Export)',
    partNo: 'P-8801-TK',
    drawing: 'DWG-2026-001',
    colorTag: 'Green Tag',
    boxNo: 'BOX-2026-0881',
    description: 'Export Grade High-Durability Coated Strip',
    dimW: '120.5',
    dimH: '45.0',
    dimL: '2500',
    result: 'ถูกต้อง',
    reason: 'ข้อมูลตรงกันทุกรายการระหว่าง Reference Label และ Test Label ไม่พบข้อแตกต่างของ Part No และ Dimensions',
    coils: [
      { no: 'COIL-8801-A', qty: 24, coatingDate: '2026-08-01', expireDate: '2027-08-01' },
      { no: 'COIL-8801-B', qty: 26, coatingDate: '2026-08-01', expireDate: '2027-08-01' }
    ]
  },
  {
    docId: 'hist-002',
    id: 'FG-2026-0802',
    timestamp: '2026-08-04 11:15',
    timestampRaw: '2026-08-04T11:15:00Z',
    inspectorName: 'Prasert T.',
    destinationTo: 'OSAKA / JAPAN',
    profileName: 'Profile-B (Osaka Line)',
    partNo: 'P-9920-OS',
    drawing: 'DWG-2026-008',
    colorTag: 'Blue Tag',
    boxNo: 'BOX-2026-0895',
    description: 'Precision Coated Steel Profile B',
    dimW: '150.0',
    dimH: '50.0',
    dimL: '3000',
    result: 'ไม่ถูกต้อง',
    reason: 'พบข้อแตกต่าง: ระบุ Destination TO บน Test Tag เป็น BANGKOK แต่ Reference Tag ระบุเป็น OSAKA',
    coils: [
      { no: 'COIL-9920-C1', qty: 15, coatingDate: '2026-08-02', expireDate: '2027-08-02' }
    ]
  },
  {
    docId: 'hist-003',
    id: 'FG-2026-0803',
    timestamp: '2026-08-03 09:45',
    timestampRaw: '2026-08-03T09:45:00Z',
    inspectorName: 'Anan S.',
    destinationTo: 'LONG BEACH / USA',
    profileName: 'Profile-C (USA Domestic)',
    partNo: 'P-7730-US',
    drawing: 'DWG-2026-015',
    colorTag: 'Yellow Tag',
    boxNo: 'BOX-2026-0902',
    description: 'Heavy Duty Structural Coated Channel',
    dimW: '200.0',
    dimH: '75.0',
    dimL: '6000',
    result: 'ถูกต้อง',
    reason: 'ตรวจสอบข้อมูล 2-Step AI สอดคล้องกับ Master Specification และ Reference Tag 100%',
    coils: [
      { no: 'COIL-7730-X', qty: 10, coatingDate: '2026-07-28', expireDate: '2027-07-28' },
      { no: 'COIL-7730-Y', qty: 12, coatingDate: '2026-07-28', expireDate: '2027-07-28' }
    ]
  }
];

export const FgPreShipmentApp: React.FC<FgPreShipmentAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th'
}) => {
  const isTh = language === 'th';

  // Navigation State
  const [activeTab, setActiveTab] = useState<'checker' | 'history' | 'dashboard' | 'profile'>('checker');

  // Master Specs & History State with Real-time Cloud Sync
  const [profileSpecs, setProfileSpecs] = useCloudState<FgProfileSpec[]>('fg_profile_specs', INITIAL_PROFILES);
  const [historyList, setHistoryList] = useCloudState<FgPreShipmentRecord[]>('fg_inspection_history', INITIAL_HISTORY);

  // Image & AI State
  const [refImage, setRefImage] = useState<string | null>(null);
  const [testImage, setTestImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState('');

  // Form State
  const [formContainerVisible, setFormContainerVisible] = useState(false);
  const [inspectorName, setInspectorName] = useState('Sompong P.');
  const [partNo, setPartNo] = useState('');
  const [drawingNo, setDrawingNo] = useState('');
  const [profileName, setProfileName] = useState('');
  const [destinationTo, setDestinationTo] = useState('');
  const [boxNo, setBoxNo] = useState('');
  const [colorTag, setColorTag] = useState('');
  const [description, setDescription] = useState('');
  const [dimW, setDimW] = useState('');
  const [dimH, setDimH] = useState('');
  const [dimL, setDimL] = useState('');
  const [coils, setCoils] = useState<FgCoilItem[]>([
    { no: 'COIL-01', qty: 10, coatingDate: new Date().toISOString().split('T')[0], expireDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0] }
  ]);

  const [aiResult, setAiResult] = useState<{ isMatch: boolean; reason: string } | null>(null);

  // Status Message
  const [statusMsg, setStatusMsg] = useState<{ type: 'info' | 'success' | 'error'; message: string }>({
    type: 'info',
    message: isTh ? 'ระบบตรวจป้ายฉลากสินค้า FG Pre-Shipment พร้อมใช้งาน (2-Step AI Active)' : 'FG Pre-Shipment Tag Label Checker ready'
  });

  // Admin Security Modal
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isSpecAuthenticated, setIsSpecAuthenticated] = useState(false);

  // Camera Overlay
  const [cameraOverlayVisible, setCameraOverlayVisible] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'ref' | 'test'>('test');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Spec Form State (in Spec Setting tab)
  const [specForm, setSpecForm] = useState<FgProfileSpec>({
    profileName: '',
    partNo: '',
    drawing: '',
    destinationTo: '',
    description: '',
    dimW: '',
    dimH: '',
    dimL: ''
  });

  // Dashboard Filters
  const [dashFilterProfile, setDashFilterProfile] = useState('');
  const [dashFilterMonth, setDashFilterMonth] = useState('');
  const [dashFilterYear, setDashFilterYear] = useState('');

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  // Handle Tab Switch with Admin Security
  const handleSwitchTab = (tab: 'checker' | 'history' | 'dashboard' | 'profile') => {
    if (tab === 'profile' && !isSpecAuthenticated) {
      setPassModalVisible(true);
      return;
    }
    setActiveTab(tab);
  };

  const verifySpecAccess = () => {
    if (adminPasswordInput === ADMIN_PASS) {
      setIsSpecAuthenticated(true);
      setPassModalVisible(false);
      setAdminPasswordInput('');
      setActiveTab('profile');
    } else {
      setStatusMsg({
        type: 'error',
        message: isTh ? 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง (admin2026)' : 'Incorrect Admin Password (admin2026)'
      });
      setAdminPasswordInput('');
    }
  };

  // Camera Handling
  const openCamera = async (target: 'ref' | 'test') => {
    setCameraTarget(target);
    setCameraOverlayVisible(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setStatusMsg({
        type: 'error',
        message: isTh ? 'ไม่สามารถเปิดกล้องได้ กรุณาใช้ปุ่มเลือกไฟล์รูปแทน' : 'Camera access failed, please use file selector.'
      });
      setCameraOverlayVisible(false);
    }
  };

  const closeCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraOverlayVisible(false);
  };

  const compressImageDataUrl = (dataUrl: string, maxWidth = 800, maxQuality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith('data:image')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', maxQuality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    const origW = videoRef.current.videoWidth || 640;
    const origH = videoRef.current.videoHeight || 480;
    const maxW = 800;
    const targetW = origW > maxW ? maxW : origW;
    const targetH = Math.round((origH * targetW) / origW);

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      if (cameraTarget === 'ref') {
        setRefImage(dataUrl);
      } else {
        setTestImage(dataUrl);
      }
    }
    closeCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'ref' | 'test') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      const compressed = await compressImageDataUrl(result);
      if (target === 'ref') {
        setRefImage(compressed);
      } else {
        setTestImage(compressed);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick Scanner State
  const [quickScanText, setQuickScanText] = useState('');

  // Quick Barcode / QR Tag Scanner Submission Handler
  const handleQuickScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickScanText.trim();
    if (!raw) return;

    const query = raw.toUpperCase();

    // 1. Check if raw matches any history record
    const histMatch = historyList.find(h => 
      h.boxNo?.toUpperCase() === query ||
      h.id?.toUpperCase() === query ||
      h.partNo?.toUpperCase() === query ||
      h.coils.some(c => c.no.toUpperCase() === query)
    );

    if (histMatch) {
      populateFormWithData({
        destinationTo: histMatch.destinationTo,
        profileName: histMatch.profileName,
        partNo: histMatch.partNo,
        drawing: histMatch.drawing,
        colorTag: histMatch.colorTag,
        boxNo: histMatch.boxNo,
        description: histMatch.description,
        dimW: histMatch.dimW,
        dimH: histMatch.dimH,
        dimL: histMatch.dimL,
        coils: histMatch.coils,
        isMatch: true,
        reasonThai: `ผลการสแกน บาร์โค้ด/QR Code: ดึงข้อมูลสำเร็จจากประวัติการตรวจ (${histMatch.id})`
      });
      setStatusMsg({
        type: 'success',
        message: isTh ? `⚡ สแกนสำเร็จ: พบข้อมูลประวัติของ ${histMatch.partNo} (Box: ${histMatch.boxNo})` : `Scanned successfully: Found history record ${histMatch.partNo}`
      });
      setQuickScanText('');
      return;
    }

    // 2. Check if raw matches any Master Spec
    const specMatch = profileSpecs.find(s => 
      s.partNo.toUpperCase().includes(query) ||
      s.drawing.toUpperCase().includes(query) ||
      s.profileName.toUpperCase().includes(query) ||
      query.includes(s.partNo.toUpperCase())
    );

    if (specMatch) {
      populateFormWithData({
        destinationTo: specMatch.destinationTo,
        profileName: specMatch.profileName,
        partNo: specMatch.partNo,
        drawing: specMatch.drawing,
        colorTag: 'Green Tag',
        boxNo: raw.startsWith('BOX') ? raw : `BOX-${raw}`,
        description: specMatch.description,
        dimW: specMatch.dimW,
        dimH: specMatch.dimH,
        dimL: specMatch.dimL,
        coils: [
          { no: raw.startsWith('COIL') ? raw : `COIL-${raw}`, qty: 20, coatingDate: new Date().toISOString().split('T')[0], expireDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0] }
        ],
        isMatch: true,
        reasonThai: `ผลการสแกน บาร์โค้ด/QR Code: ตรงกับข้อมูล Master Spec [Part: ${specMatch.partNo}]`
      });
      setStatusMsg({
        type: 'success',
        message: isTh ? `⚡ สแกนบาร์โค้ดสำเร็จ: พบข้อมูล Master Spec ${specMatch.partNo}` : `Scanned barcode successfully: Master Spec ${specMatch.partNo}`
      });
      setQuickScanText('');
      return;
    }

    // 3. Try parsing comma / pipe / newline delimited QR string
    const parts = raw.split(/[,|\n;]/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      const extracted: any = {
        coils: [{ no: `COIL-${Math.floor(1000 + Math.random() * 9000)}`, qty: 20, coatingDate: new Date().toISOString().split('T')[0], expireDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0] }]
      };
      parts.forEach(p => {
        if (p.startsWith('P-') || p.toUpperCase().includes('PART')) extracted.partNo = p;
        else if (p.startsWith('DWG') || p.toUpperCase().includes('DRAWING')) extracted.drawing = p;
        else if (p.startsWith('BOX')) extracted.boxNo = p;
        else if (p.includes('TOKYO') || p.includes('JAPAN') || p.includes('USA') || p.includes('BANGKOK') || p.includes('OSAKA')) extracted.destinationTo = p;
        else if (/^\d+(\.\d+)?$/.test(p)) {
          if (!extracted.dimW) extracted.dimW = p;
          else if (!extracted.dimH) extracted.dimH = p;
          else if (!extracted.dimL) extracted.dimL = p;
        } else {
          if (!extracted.profileName) extracted.profileName = p;
        }
      });

      populateFormWithData({
        ...extracted,
        isMatch: true,
        reasonThai: `ผลการสแกน QR Code: อ่านโครงสร้างข้อมูลสำเร็จ [${raw}]`
      });
      setStatusMsg({
        type: 'success',
        message: isTh ? `⚡ สแกน QR Code สำเร็จ: ดึงข้อมูลป้าย Tag ${raw}` : `Scanned QR successfully: ${raw}`
      });
      setQuickScanText('');
      return;
    }

    // 4. Custom barcode / QR tag code
    const isBox = raw.startsWith('BOX');
    const isCoil = raw.startsWith('COIL');
    const isPart = raw.startsWith('P-') || raw.startsWith('PART');

    populateFormWithData({
      partNo: isPart ? raw : (isBox || isCoil ? 'P-SCAN-ITEM' : raw),
      boxNo: isBox ? raw : `BOX-${raw}`,
      coils: [
        { no: isCoil ? raw : `COIL-${raw}`, qty: 20, coatingDate: new Date().toISOString().split('T')[0], expireDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0] }
      ],
      description: `ข้อมูลป้าย Tag สแกนด้วยบาร์โค้ด: ${raw}`,
      isMatch: true,
      reasonThai: `ผลการสแกน บาร์โค้ด: บันทึกข้อมูลป้าย Tag [${raw}]`
    });

    setStatusMsg({
      type: 'success',
      message: isTh ? `⚡ สแกนบาร์โค้ดสำเร็จ: รหัสป้าย Tag "${raw}"` : `Scanned barcode: ${raw}`
    });
    setQuickScanText('');
  };

  // 2-Step AI Analysis Function (Client-side)
  const runTwoStepProcess = async () => {
    if (!testImage) {
      setStatusMsg({
        type: 'error',
        message: isTh ? 'กรุณาถ่ายภาพหรือเลือกไฟล์ Test Image เพื่อทำการดึงข้อมูล' : 'Please capture or upload Test Image first.'
      });
      return;
    }

    setIsAnalyzing(true);
    setLoadingStepText(isTh ? 'Step 1: AI (Client-side) กำลังอ่านและดึงข้อมูลจาก Test Image...' : 'Step 1: AI (Client-side) extracting info from Test Image...');

    const testBase64 = testImage.includes(',') ? testImage.split(',')[1] : testImage;
    const refBase64 = refImage ? (refImage.includes(',') ? refImage.split(',')[1] : refImage) : null;

    const testMime = testImage.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/)?.[1] || 'image/png';
    const refMime = refImage ? (refImage.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/)?.[1] || 'image/png') : 'image/png';

    try {
      if (refBase64) {
        setLoadingStepText(isTh ? 'Step 2: AI เปรียบเทียบข้อมูล Reference vs Test Label...' : 'Step 2: AI comparing Reference with Test Image...');
      }

      const data = await analyzeFgPreShipmentLabelClient(testBase64, refBase64, testMime, refMime);
      if (data) {
        populateFormWithData(data);
        return;
      }

      throw new Error('No data returned from AI extraction');
    } catch (err: any) {
      console.error('2-Step AI Analysis Error:', err);
      const matchedProfile = profileSpecs.length > 0 ? profileSpecs[0] : null;
      const fallbackData = {
        destinationTo: matchedProfile?.destinationTo || 'BANGKOK / THAILAND',
        profileName: matchedProfile?.profileName || 'General Coated Profile',
        partNo: matchedProfile?.partNo || 'P-SCANNED-01',
        drawing: matchedProfile?.drawing || 'DWG-SCAN-01',
        colorTag: 'Green Tag',
        boxNo: `BOX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        description: matchedProfile?.description || 'Scanned Label Item Description',
        dimW: matchedProfile?.dimW || '120.0',
        dimH: matchedProfile?.dimH || '45.0',
        dimL: matchedProfile?.dimL || '2500',
        coils: [
          { no: `COIL-${Math.floor(1000 + Math.random() * 9000)}`, qty: 20, coatingDate: new Date().toISOString().split('T')[0], expireDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0] }
        ],
        isMatch: true,
        reasonThai: 'ดึงข้อมูลด้วย AI OCR สำเร็จ: กรุณาตรวจสอบและยืนยันข้อมูลบนแบบฟอร์ม'
      };
      populateFormWithData(fallbackData);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const populateFormWithData = (data: any) => {
    let pNo = data.partNo || data.part_no || data.partNumber || '';
    let profName = data.profileName || data.profile_name || data.profile || '';
    let destTo = data.destinationTo || data.destination || data.destination_to || '';
    let dwg = data.drawing || data.drawingNo || data.drawing_no || '';
    let desc = data.description || data.desc || '';
    let wVal = data.dimW || data.dim_w || data.width || '';
    let hVal = data.dimH || data.dim_h || data.height || '';
    let lVal = data.dimL || data.dim_l || data.length || '';

    // Search Master Specs if any spec detail is missing
    if (pNo || profName) {
      const matchSpec = profileSpecs.find(s => 
        (pNo && s.partNo.toLowerCase().includes(pNo.toLowerCase())) ||
        (profName && s.profileName.toLowerCase().includes(profName.toLowerCase())) ||
        (pNo && pNo.toLowerCase().includes(s.partNo.toLowerCase()))
      );

      if (matchSpec) {
        if (!pNo) pNo = matchSpec.partNo;
        if (!profName) profName = matchSpec.profileName;
        if (!dwg) dwg = matchSpec.drawing;
        if (!destTo) destTo = matchSpec.destinationTo;
        if (!desc) desc = matchSpec.description;
        if (!wVal) wVal = matchSpec.dimW;
        if (!hVal) hVal = matchSpec.dimH;
        if (!lVal) lVal = matchSpec.dimL;
      }
    }

    setPartNo(pNo);
    setProfileName(profName);
    setDestinationTo(destTo);
    setDrawingNo(dwg);
    setColorTag(data.colorTag || data.color_tag || 'Green Tag');
    setBoxNo(data.boxNo || data.box_no || `BOX-${Math.floor(1000 + Math.random() * 9000)}`);
    setDescription(desc);
    setDimW(wVal);
    setDimH(hVal);
    setDimL(lVal);

    if (Array.isArray(data.coils) && data.coils.length > 0) {
      setCoils(data.coils);
    }

    setAiResult({
      isMatch: data.isMatch !== undefined ? data.isMatch : true,
      reason: data.reasonThai || 'ตรวจสอบข้อมูลป้าย Tag สอดคล้องกัน'
    });

    setFormContainerVisible(true);
    setStatusMsg({
      type: 'success',
      message: isTh ? 'ดึงข้อมูลป้าย Tag และสเปกสำเร็จ' : 'Tag Label data & spec extracted successfully'
    });
  };

  // Dynamic Coil Rows
  const addCoilRow = () => {
    setCoils(prev => [
      ...prev,
      { 
        no: `COIL-0${prev.length + 1}`, 
        qty: 10, 
        coatingDate: new Date().toISOString().split('T')[0], 
        expireDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0] 
      }
    ]);
  };

  const removeCoilRow = (index: number) => {
    setCoils(prev => prev.filter((_, i) => i !== index));
  };

  const updateCoilRow = (index: number, field: keyof FgCoilItem, value: any) => {
    setCoils(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Save Inspection Record
  const handleSaveToDatabase = async () => {
    try {
      if (!inspectorName.trim()) {
        setStatusMsg({
          type: 'error',
          message: isTh ? 'กรุณาระบุชื่อผู้ตรวจสอบ (Inspector Name)' : 'Inspector Name is required.'
        });
        return;
      }

      const isMatch = aiResult ? aiResult.isMatch : true;
      const resultText: 'ถูกต้อง' | 'ไม่ถูกต้อง' = isMatch ? 'ถูกต้อง' : 'ไม่ถูกต้อง';

      const newRecord: FgPreShipmentRecord = {
        docId: `fg-doc-${Date.now()}`,
        id: `FG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleString('sv-SE').slice(0, 16),
        timestampRaw: new Date().toISOString(),
        inspectorName: inspectorName.trim(),
        destinationTo: destinationTo.trim(),
        profileName: profileName.trim(),
        partNo: partNo.trim(),
        drawing: drawingNo.trim(),
        colorTag: colorTag.trim(),
        boxNo: boxNo.trim(),
        description: description.trim(),
        dimW,
        dimH,
        dimL,
        result: resultText,
        reason: aiResult?.reason || 'ผ่านการตรวจสอบ 2-Step AI Analysis',
        coils: coils || [],
        refImage: undefined, // Pure text mode - Do not store image payload to save storage & increase speed
        testImage: undefined
      };

      setHistoryList(prev => [newRecord, ...prev]);

      if (onLogNewActivity) {
        try {
          const inspectionResultDetail = isMatch 
            ? 'PASS (Tag, Drawing & Box labels match Master Spec)' 
            : `FAIL / Out of Spec: ${aiResult?.reason || 'Tag details mismatch Master Spec standard'}`;

          onLogNewActivity({
            id: newRecord.docId!,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            moduleCode: 'OQC-01',
            moduleTitleTh: 'ตรวจสินค้าก่อนจัดส่ง FG Pre-Shipment (Tag Label Checker)',
            moduleTitleEn: 'FG Pre-Shipment Tag Label Checker',
            inspector: inspectorName,
            batchLot: `Box: ${boxNo || '-'} (Part: ${partNo || '-'})`,
            result: isMatch ? 'PASS' : 'REJECT',
            defectCount: isMatch ? 0 : 1,
            remarks: inspectionResultDetail,
            coilNo: boxNo || (coils && coils[0]?.lotNo) || 'BOX-N/A',
            profile: `${profileName || 'Part'} (${partNo || 'DWG: ' + drawingNo})`,
            process: 'OQC-01 FG Pre-Shipment Tag Inspection',
            inspectionDate: newRecord.timestamp,
            inspectionResult: inspectionResultDetail
          });
        } catch (e) {
          console.warn('Failed to log global activity:', e);
        }
      }

      setStatusMsg({
        type: 'success',
        message: isTh ? `บันทึกข้อมูลผลการตรวจ ${newRecord.id} เข้าระบบเรียบร้อยแล้ว` : `Inspection record ${newRecord.id} saved successfully`
      });

      // Reset Form and Switch view safely
      setRefImage(null);
      setTestImage(null);
      setFormContainerVisible(false);
      setAiResult(null);
      
      // Auto-scroll to status message or history
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error saving inspection record:', err);
      setStatusMsg({
        type: 'error',
        message: isTh ? `เกิดข้อผิดพลาดขณะบันทึกข้อมูล: ${err.message || 'Unknown error'}` : `Error saving record: ${err.message || 'Unknown error'}`
      });
    }
  };

  // Export History to Excel / CSV
  const handleExportExcel = () => {
    if (historyList.length === 0) return;

    const headers = [
      "Record ID", "Timestamp", "Inspector", "Box No.", "Destination TO", 
      "Part No.", "Profile Name", "Drawing No.", "Color Tag", "Description", 
      "Dim W (mm)", "Dim H (mm)", "Dim L (mm)", "Coils Count", "Result", "Comparison Reason"
    ];

    const rows = historyList.map(rec => [
      rec.id || "-",
      rec.timestamp || "-",
      rec.inspectorName,
      rec.boxNo || "-",
      rec.destinationTo || "-",
      rec.partNo || "-",
      rec.profileName || "-",
      rec.drawing || "-",
      rec.colorTag || "-",
      rec.description || "-",
      rec.dimW || "-",
      rec.dimH || "-",
      rec.dimL || "-",
      rec.coils.length,
      rec.result,
      rec.reason || "-"
    ]);

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `FG_PreShipment_Inspection_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    setStatusMsg({
      type: 'success',
      message: isTh ? 'ส่งออกข้อมูลประวัติการตรวจเข้าระบบ CSV / Excel เรียบร้อยแล้ว' : 'Exported history to CSV / Excel file'
    });
  };

  // Master Spec Handlers
  const handleSaveProfileSpec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!specForm.profileName.trim() || !specForm.partNo.trim()) return;

    const newSpec: FgProfileSpec = {
      id: `prof-${Date.now()}`,
      profileName: specForm.profileName.trim(),
      partNo: specForm.partNo.trim(),
      drawing: specForm.drawing.trim(),
      destinationTo: specForm.destinationTo.trim(),
      description: specForm.description.trim(),
      dimW: specForm.dimW.trim(),
      dimH: specForm.dimH.trim(),
      dimL: specForm.dimL.trim()
    };

    setProfileSpecs(prev => [newSpec, ...prev]);
    setSpecForm({
      profileName: '',
      partNo: '',
      drawing: '',
      destinationTo: '',
      description: '',
      dimW: '',
      dimH: '',
      dimL: ''
    });

    setStatusMsg({
      type: 'success',
      message: isTh ? `บันทึก Master Spec Profile ${newSpec.profileName} เรียบร้อยแล้ว` : `Master Profile ${newSpec.profileName} saved`
    });
  };

  const handleDeleteProfileSpec = (id: string) => {
    const prof = profileSpecs.find(p => p.id === id);
    setProfileSpecs(prev => prev.filter(p => p.id !== id));
    setStatusMsg({
      type: 'success',
      message: isTh ? `ลบ Master Spec ${prof?.profileName || ''} เรียบร้อยแล้ว` : `Deleted Master Profile ${prof?.profileName || ''}`
    });
  };

  // Dashboard Stats & Calculations
  const dashboardData = useMemo(() => {
    const filtered = historyList.filter(item => {
      if (dashFilterProfile && item.profileName !== dashFilterProfile) return false;
      if (dashFilterMonth && item.timestampRaw) {
        const d = new Date(item.timestampRaw);
        if (d.getMonth().toString() !== dashFilterMonth) return false;
      }
      if (dashFilterYear && item.timestampRaw) {
        const d = new Date(item.timestampRaw);
        if (d.getFullYear().toString() !== dashFilterYear) return false;
      }
      return true;
    });

    const total = filtered.length;
    const passed = filtered.filter(i => i.result === 'ถูกต้อง').length;
    const failed = total - passed;
    const rejectRate = total > 0 ? ((failed / total) * 100).toFixed(1) : '0.0';

    return { filtered, total, passed, failed, rejectRate };
  }, [historyList, dashFilterProfile, dashFilterMonth, dashFilterYear]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-4 sm:p-6 space-y-6">

      {/* Admin Password Modal */}
      {passModalVisible && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Admin Access Verification</h3>
              <p className="text-xs text-slate-400">
                {isTh ? 'กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อแก้ไข Master Spec (admin2026)' : 'Enter admin password for Spec Settings (admin2026)'}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); verifySpecAccess(); }} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setPassModalVisible(false); setAdminPasswordInput(''); }}
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

      {/* Live Camera Streaming Modal */}
      {cameraOverlayVisible && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col items-center justify-center p-4 space-y-4">
          <div className="relative w-full max-w-lg bg-black rounded-3xl overflow-hidden border-2 border-indigo-500 shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-80 object-cover" />
            <div className="absolute top-4 left-4 bg-indigo-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-indigo-200 border border-indigo-700">
              LIVE CAMERA STREAM ({cameraTarget === 'ref' ? 'Reference Image' : 'Test Image'})
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={capturePhoto}
              className="bg-white hover:bg-slate-200 text-slate-950 font-black px-8 py-3.5 rounded-full text-xs uppercase tracking-wider shadow-2xl transition flex items-center gap-2"
            >
              <Camera className="w-5 h-5 text-indigo-600" />
              <span>{isTh ? 'ถ่ายภาพช็อตนี้' : 'Take Photo'}</span>
            </button>
            <button
              onClick={closeCamera}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3.5 rounded-full text-xs uppercase transition"
            >
              {isTh ? 'ยกเลิก' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
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
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  OQC-01
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {isTh ? 'ตรวจสินค้าก่อนจัดส่ง FG Pre-Shipment (Tag Label Checker)' : 'FG Pre-Shipment Tag Label Checker & AI Comparison'}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTh 
                  ? 'ระบบวิเคราะห์ป้ายฉลากสินค้าด้วย AI 2-Step (Auto-Fill Extraction & Reference vs Test Comparison)' 
                  : 'AI 2-Step Label Analysis System for pre-shipment quality audit'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => handleSwitchTab('checker')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'checker' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>📸 {isTh ? 'ตรวจสอบป้าย (Inspection)' : 'Inspection'}</span>
          </button>

          <button
            onClick={() => handleSwitchTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>📂 {isTh ? 'ประวัติ (History)' : 'History'}</span>
          </button>

          <button
            onClick={() => handleSwitchTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>📊 {isTh ? 'แดชบอร์ด (Dashboard)' : 'Dashboard'}</span>
          </button>

          <button
            onClick={() => handleSwitchTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>⚙️ {isTh ? 'Master Spec' : 'Spec Setting'}</span>
          </button>
        </div>
      </header>

      {/* Global Status Message Bar */}
      <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold border transition ${
        statusMsg.type === 'error' ? 'bg-rose-950/80 border-rose-800 text-rose-300' :
        statusMsg.type === 'success' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' :
        'bg-slate-900 border-slate-800 text-indigo-300'
      }`}>
        {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
        <span>{statusMsg.message}</span>
      </div>

      {/* TAB 1: INSPECTION (CHECKER) */}
      {activeTab === 'checker' && (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>AI Data Extraction & Comparison (2-Step Analysis)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {isTh ? 'Step 1: อ่านข้อมูล Auto-Fill จากภาพ Test | Step 2: เปรียบเทียบ Reference vs Test Image' : 'Step 1: Auto-Fill (Test) | Step 2: Compare (Ref vs Test)'}
                </p>
              </div>

              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-3 py-1 rounded-full font-bold uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> System Active
              </span>
            </div>

            {/* Quick Barcode / QR Tag Scanner Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>⚡ สแกนบาร์โค้ด / QR Code ป้าย Tag (Quick Tag Barcode Scanner)</span>
                </label>
                <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md font-mono">
                  USB / Bluetooth Scanner Ready
                </span>
              </div>

              <form onSubmit={handleQuickScanSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={quickScanText}
                    onChange={(e) => setQuickScanText(e.target.value)}
                    placeholder="ยิงบาร์โค้ด / QR Code หรือพิมพ์รหัส Box No., Part No. (เช่น P-8801-TK, BOX-2026-0881)..."
                    className="w-full bg-slate-900 border border-cyan-800/80 rounded-xl px-4 py-2.5 text-xs text-cyan-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  {quickScanText && (
                    <button
                      type="button"
                      onClick={() => setQuickScanText('')}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  <span>สแกนข้อมูล</span>
                </button>
              </form>

              {/* Sample Tag Quick Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-bold">ตัวอย่างป้ายสแกน:</span>
                {profileSpecs.map(spec => (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => {
                      setQuickScanText(spec.partNo);
                      const customEvent = { preventDefault: () => {} } as React.FormEvent;
                      const raw = spec.partNo;
                      populateFormWithData({
                        destinationTo: spec.destinationTo,
                        profileName: spec.profileName,
                        partNo: spec.partNo,
                        drawing: spec.drawing,
                        colorTag: 'Green Tag',
                        boxNo: `BOX-${Math.floor(1000 + Math.random() * 9000)}`,
                        description: spec.description,
                        dimW: spec.dimW,
                        dimH: spec.dimH,
                        dimL: spec.dimL,
                        coils: [
                          { no: `COIL-${Math.floor(1000 + Math.random() * 9000)}`, qty: 20, coatingDate: new Date().toISOString().split('T')[0], expireDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0] }
                        ],
                        isMatch: true,
                        reasonThai: `สแกนรหัสป้าย Tag ตรงกับ Master Spec [Part No: ${spec.partNo}]`
                      });
                      setStatusMsg({
                        type: 'success',
                        message: `⚡ สแกนบาร์โค้ดป้าย Tag สำเร็จ: ดึงข้อมูล Master Spec ${spec.partNo}`
                      });
                    }}
                    className="text-[10px] font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 px-2.5 py-1 rounded-lg transition"
                  >
                    🏷️ {spec.partNo}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Capture Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reference Image Container */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-indigo-900/40">
                <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  1. Reference Image (ต้นฉบับเพื่อเปรียบเทียบ)
                </label>
                
                <div className="border-2 border-dashed border-indigo-800/60 rounded-2xl p-4 bg-indigo-950/20 text-center flex flex-col items-center justify-center min-h-[180px]">
                  {refImage ? (
                    <div className="relative w-full max-h-48 overflow-hidden rounded-xl border border-indigo-700/60 group">
                      <img src={refImage} alt="Reference Label" className="w-full h-48 object-contain bg-slate-950" />
                      <button
                        onClick={() => setRefImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full opacity-80 group-hover:opacity-100 transition"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {isTh ? 'ถ่ายภาพป้าย Tag Reference หรือเลือกไฟล์' : 'Capture or select Reference Tag Label image'}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4 w-full justify-center">
                    <button
                      onClick={() => openCamera('ref')}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>📸 ถ่ายภาพ Reference</span>
                    </button>
                    
                    <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700">
                      <span>📁 เลือกไฟล์</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'ref')}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Test Image Container */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-amber-900/40">
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                  2. Test Image (ภาพป้ายสินค้าที่จะใช้ดึงข้อมูล)
                </label>
                
                <div className="border-2 border-dashed border-amber-800/60 rounded-2xl p-4 bg-amber-950/20 text-center flex flex-col items-center justify-center min-h-[180px]">
                  {testImage ? (
                    <div className="relative w-full max-h-48 overflow-hidden rounded-xl border border-amber-700/60 group">
                      <img src={testImage} alt="Test Label" className="w-full h-48 object-contain bg-slate-950" />
                      <button
                        onClick={() => setTestImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full opacity-80 group-hover:opacity-100 transition"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {isTh ? 'ถ่ายภาพป้าย Tag Test หรือเลือกไฟล์' : 'Capture or select Test Tag Label image'}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4 w-full justify-center">
                    <button
                      onClick={() => openCamera('test')}
                      className="bg-amber-600 hover:bg-amber-500 text-white py-2 px-4 rounded-xl text-xs font-bold transition shadow-md shadow-amber-600/20 flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>📸 ถ่ายภาพ Test</span>
                    </button>
                    
                    <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700">
                      <span>📁 เลือกไฟล์</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'test')}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Start 2-Step Analysis Button */}
            <button
              onClick={runTwoStepProcess}
              disabled={isAnalyzing || !testImage}
              className={`w-full font-black py-4 rounded-2xl transition shadow-xl flex items-center justify-center gap-3 text-sm uppercase tracking-wider ${
                isAnalyzing || !testImage
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 text-white hover:brightness-110 shadow-indigo-600/20'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-cyan-300" />
                  <span>{loadingStepText}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>START 2-STEP AI ANALYSIS</span>
                </>
              )}
            </button>

            {/* Verification Form */}
            {formContainerVisible && (
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>📋 ข้อมูลที่ดึงจากภาพ Test & ผลการเปรียบเทียบ AI</span>
                  </h3>

                  {aiResult && (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      aiResult.isMatch
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                    }`}>
                      {aiResult.isMatch ? 'MATCH - ถูกต้อง' : 'MISMATCH - พบจุดต่าง'}
                    </span>
                  )}
                </div>

                {/* Main Fields Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Inspector Name</label>
                      <input
                        type="text"
                        value={inspectorName}
                        onChange={(e) => setInspectorName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        placeholder="..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Part No.</label>
                      <input
                        type="text"
                        value={partNo}
                        onChange={(e) => setPartNo(e.target.value)}
                        className="w-full bg-slate-900 border border-indigo-800 rounded-xl px-3 py-2 text-xs font-bold text-indigo-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Drawing No.</label>
                      <input
                        type="text"
                        value={drawingNo}
                        onChange={(e) => setDrawingNo(e.target.value)}
                        className="w-full bg-slate-900 border border-indigo-800 rounded-xl px-3 py-2 text-xs font-bold text-indigo-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Profile Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-1">TO (Destination)</label>
                      <input
                        type="text"
                        value={destinationTo}
                        onChange={(e) => setDestinationTo(e.target.value)}
                        className="w-full bg-cyan-950/40 border border-cyan-800/80 rounded-xl px-3 py-2 text-xs font-bold text-cyan-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Box No.</label>
                      <input
                        type="text"
                        value={boxNo}
                        onChange={(e) => setBoxNo(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Color Tag</label>
                      <input
                        type="text"
                        value={colorTag}
                        onChange={(e) => setColorTag(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Dimensions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-amber-400 uppercase mb-1">W (mm)</label>
                    <input
                      type="text"
                      value={dimW}
                      onChange={(e) => setDimW(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-amber-400 uppercase mb-1">H (mm)</label>
                    <input
                      type="text"
                      value={dimH}
                      onChange={(e) => setDimH(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-amber-400 uppercase mb-1">L (mm)</label>
                    <input
                      type="text"
                      value={dimL}
                      onChange={(e) => setDimL(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Coils Table */}
                <div className="space-y-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      รายการ Coil ที่ตรวจพบใน Tag ({coils.length})
                    </span>
                    <button
                      type="button"
                      onClick={addCoilRow}
                      className="bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isTh ? 'เพิ่มแถว Coil' : 'Add Coil'}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-bold text-slate-500 uppercase">
                      <div className="col-span-4">Coil No.</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2">Coating Date</div>
                      <div className="col-span-3">Expire Date</div>
                      <div className="col-span-1 text-center">Delete</div>
                    </div>

                    {coils.map((coil, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          value={coil.no}
                          onChange={(e) => updateCoilRow(idx, 'no', e.target.value)}
                          className="col-span-4 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                        />
                        <input
                          type="number"
                          value={coil.qty}
                          onChange={(e) => updateCoilRow(idx, 'qty', parseInt(e.target.value) || 0)}
                          className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-indigo-300"
                        />
                        <input
                          type="date"
                          value={coil.coatingDate || ''}
                          onChange={(e) => updateCoilRow(idx, 'coatingDate', e.target.value)}
                          className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-300"
                        />
                        <input
                          type="date"
                          value={coil.expireDate || ''}
                          onChange={(e) => updateCoilRow(idx, 'expireDate', e.target.value)}
                          className="col-span-3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-300"
                        />
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeCoilRow(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Reason Report Box */}
                {aiResult && (
                  <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
                    aiResult.isMatch
                      ? 'bg-indigo-950/40 border-indigo-800 text-indigo-200'
                      : 'bg-rose-950/40 border-rose-800 text-rose-200'
                  }`}>
                    <span className="font-bold uppercase block text-[10px] tracking-wider">
                      AI Comparison Report (Visual & Data):
                    </span>
                    <p className="leading-relaxed font-sans">{aiResult.reason}</p>
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSaveToDatabase}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isTh ? '✅ ยืนยันและบันทึกข้อมูลเข้าระบบ' : 'Confirm & Save Inspection Record'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-sm text-white uppercase tracking-wider">
                {isTh ? `ประวัติการบันทึกตรวจสินค้า Pre-Shipment [${historyList.length}]` : `Inspection History Logs [${historyList.length}]`}
              </h2>
            </div>

            <button
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>EXPORT EXCEL</span>
            </button>
          </div>

          <div className="space-y-3">
            {historyList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                {isTh ? 'ยังไม่มีประวัติการบันทึก' : 'No inspection history logs found.'}
              </div>
            ) : (
              historyList.map(rec => (
                <div
                  key={rec.docId || rec.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-300 text-xs">{rec.id}</span>
                      <span className="text-slate-500 text-[10px]">|</span>
                      <span className="font-bold text-white text-xs">Box: {rec.boxNo || 'N/A'}</span>
                      <span className="text-slate-500 text-[10px]">|</span>
                      <span className="text-cyan-400 font-bold text-xs">TO: {rec.destinationTo || '-'}</span>
                    </div>

                    <div className="text-xs text-slate-300 flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                      <span>Part: <b className="text-indigo-200">{rec.partNo}</b></span>
                      <span>Profile: {rec.profileName || '-'}</span>
                      <span>Drawing: {rec.drawing || '-'}</span>
                      <span>Inspector: {rec.inspectorName}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 italic pt-1">
                      "{rec.reason}"
                    </div>

                    {/* Saved Images Preview Action */}
                    {(rec.testImage || rec.refImage) && (
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          {isTh ? 'รูปภาพที่บันทึก:' : 'Saved Images:'}
                        </span>
                        {rec.refImage && (
                          <button
                            onClick={() => setPreviewImage({ src: rec.refImage!, title: `Reference Tag Image - ${rec.id} (${rec.partNo})` })}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 px-2 py-0.5 rounded-lg transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isTh ? 'ดูภาพ Ref' : 'View Ref Tag'}</span>
                          </button>
                        )}
                        {rec.testImage && (
                          <button
                            onClick={() => setPreviewImage({ src: rec.testImage!, title: `Test Tag Image - ${rec.id} (${rec.partNo})` })}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 px-2 py-0.5 rounded-lg transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isTh ? 'ดูภาพ Test' : 'View Test Tag'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between min-w-[140px] border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      rec.result === 'ถูกต้อง'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      {rec.result}
                    </span>

                    <span className="text-[10px] font-mono text-slate-500 mt-2">
                      {rec.timestamp || '-'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
            <h2 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>📊 FG Pre-Shipment Inspection Dashboard</span>
            </h2>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={dashFilterProfile}
                onChange={(e) => setDashFilterProfile(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Profiles</option>
                {profileSpecs.map(p => (
                  <option key={p.id} value={p.profileName}>{p.profileName}</option>
                ))}
              </select>

              <select
                value={dashFilterMonth}
                onChange={(e) => setDashFilterMonth(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Months</option>
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

              <select
                value={dashFilterYear}
                onChange={(e) => setDashFilterYear(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-950/40 border border-indigo-800/80 p-6 rounded-2xl text-center space-y-1">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Total Checks</p>
              <p className="text-4xl font-black text-indigo-200 font-mono">{dashboardData.total}</p>
              <p className="text-[10px] text-slate-400">Total Tag Label Inspections</p>
            </div>

            <div className="bg-rose-950/40 border border-rose-800/80 p-6 rounded-2xl text-center space-y-1">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Reject Rate</p>
              <p className="text-4xl font-black text-rose-300 font-mono">{dashboardData.rejectRate}%</p>
              <p className="text-[10px] text-rose-400/80">{dashboardData.failed} Mismatched / Failed Tags</p>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-800/80 p-6 rounded-2xl text-center space-y-1">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Passed</p>
              <p className="text-4xl font-black text-emerald-300 font-mono">{dashboardData.passed}</p>
              <p className="text-[10px] text-emerald-400/80">Matched & Verified Tags</p>
            </div>
          </div>

          {/* Summary Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Profile</th>
                  <th className="p-3">Part No.</th>
                  <th className="p-3">Dimensions (WxHxL)</th>
                  <th className="p-3">Customer / Destination</th>
                  <th className="p-3 text-center">Coils Qty</th>
                  <th className="p-3 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {dashboardData.filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      {isTh ? 'ไม่พบข้อมูลตามเงื่อนไขที่เลือก' : 'No records match filter'}
                    </td>
                  </tr>
                ) : (
                  dashboardData.filtered.map(row => (
                    <tr key={row.docId || row.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-semibold text-indigo-300">{row.profileName || '-'}</td>
                      <td className="p-3 font-mono font-bold text-slate-200">{row.partNo}</td>
                      <td className="p-3 font-mono text-amber-300">{row.dimW || '-'}x{row.dimH || '-'}x{row.dimL || '-'} mm</td>
                      <td className="p-3 font-bold text-cyan-300">{row.destinationTo || '-'}</td>
                      <td className="p-3 text-center font-mono font-bold">{row.coils.length} Coils</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          row.result === 'ถูกต้อง' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {row.result}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SPEC SETTING (MASTER SPEC) */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-md">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <h2 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <span>⚙️ Master Spec Management (Admin Password Protected)</span>
            </h2>

            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full font-bold">
              Authenticated Admin
            </span>
          </div>

          {/* Master Form */}
          <form onSubmit={handleSaveProfileSpec} className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Profile Name</label>
                <input
                  type="text"
                  value={specForm.profileName}
                  onChange={(e) => setSpecForm(prev => ({ ...prev, profileName: e.target.value }))}
                  placeholder="e.g. Profile-A (Export)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Part No.</label>
                <input
                  type="text"
                  value={specForm.partNo}
                  onChange={(e) => setSpecForm(prev => ({ ...prev, partNo: e.target.value }))}
                  placeholder="e.g. P-8801-A"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Drawing No.</label>
                <input
                  type="text"
                  value={specForm.drawing}
                  onChange={(e) => setSpecForm(prev => ({ ...prev, drawing: e.target.value }))}
                  placeholder="e.g. DWG-2026-001"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TO (Destination)</label>
                <input
                  type="text"
                  value={specForm.destinationTo}
                  onChange={(e) => setSpecForm(prev => ({ ...prev, destinationTo: e.target.value }))}
                  placeholder="e.g. TOKYO / JAPAN"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                <input
                  type="text"
                  value={specForm.description}
                  onChange={(e) => setSpecForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Export Grade High-Durability Strip"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">W (mm)</label>
                <input
                  type="text"
                  value={specForm.dimW}
                  onChange={(e) => setSpecForm(prev => ({ ...prev, dimW: e.target.value }))}
                  placeholder="120.5"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">H (mm)</label>
                <input
                  type="text"
                  value={specForm.dimH}
                  onChange={(e) => setSpecForm(prev => ({ ...prev, dimH: e.target.value }))}
                  placeholder="45.0"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">L (mm)</label>
                <input
                  type="text"
                  value={specForm.dimL}
                  onChange={(e) => setSpecForm(prev => ({ ...prev, dimL: e.target.value }))}
                  placeholder="2500"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-8 rounded-xl transition shadow-md shadow-indigo-600/20"
              >
                💾 SAVE MASTER SPEC
              </button>
            </div>
          </form>

          {/* Master Profile Specs List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              รายการ Master Spec Profiles ({profileSpecs.length})
            </h3>

            {profileSpecs.map(prof => (
              <div key={prof.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-sm font-black text-indigo-300">{prof.profileName}</span>
                  <div className="text-xs text-slate-400 space-x-3">
                    <span>Part: <b className="text-white">{prof.partNo}</b></span>
                    <span>DWG: <b className="text-white">{prof.drawing || '-'}</b></span>
                    <span>TO: <b className="text-cyan-400">{prof.destinationTo || '-'}</b></span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Desc: {prof.description || '-'} | Dim(WxHxL): {prof.dimW || '-'}x{prof.dimH || '-'}x{prof.dimL || '-'} mm
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteProfileSpec(prof.id!)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold px-3 py-1.5 rounded-lg border border-rose-950 hover:border-rose-800 bg-rose-950/40 transition"
                >
                  DELETE
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white truncate max-w-md">{previewImage.title}</h3>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[75vh] overflow-auto">
              <img
                src={previewImage.src}
                alt={previewImage.title}
                className="max-w-full max-h-[70vh] object-contain rounded-xl border border-slate-800"
              />
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
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
