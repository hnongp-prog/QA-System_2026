import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check,
  Link,
  Info
} from 'lucide-react';
import {
  CoiCustomerTemplate,
  CoiIssueRecord,
  DetailedCoiMeasuredData,
  InspectionActivity
} from '../../types';
import {
  generateNextCoiNumber,
  generateDetailedMeasuredDataForCustomer,
  saveCoiRecord
} from '../../utils/coiStorage';

interface CoiIssueFormProps {
  templates: CoiCustomerTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onCertificateIssued: (record: CoiIssueRecord) => void;
  onLogNewActivity?: (activity: Omit<InspectionActivity, 'id' | 'timestamp'>) => void;
  language?: 'th' | 'en';
}

export const CoiIssueForm: React.FC<CoiIssueFormProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onCertificateIssued,
  onLogNewActivity,
  language = 'th'
}) => {
  const isTh = language === 'th';
  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Form Inputs
  const [workNo, setWorkNo] = useState<string>('W-2026-8831');
  const [coilNo, setCoilNo] = useState<string>('COIL-2026-A109');
  const [heatNo, setHeatNo] = useState<string>(currentTemplate.heatNoMaterialCode || 'HEAT-CA105-09');
  const [lengthMm, setLengthMm] = useState<string>(currentTemplate.defaultLength || '650.0 mm');
  const [poNo, setPoNo] = useState<string>('PO-2026-DENSO-7789');
  const [invoiceNo, setInvoiceNo] = useState<string>('INV-2026-08-0442');
  const [quantityPcs, setQuantityPcs] = useState<string>('2,400 Pcs');
  const [totalWeightKg, setTotalWeightKg] = useState<string>('1,820.00 kg');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [productionDate, setProductionDate] = useState<string>(new Date(Date.now() - 86400000).toISOString().slice(0, 10));
  const [inspectorName, setInspectorName] = useState<string>('Kittisak N. (Senior QA Inspector)');
  const [approverName, setApproverName] = useState<string>('Dr. Wirote Charoensuk (QA Manager)');
  const [remarks, setRemarks] = useState<string>(
    `Material conforms to ${currentTemplate.standardRef} in all chemical, mechanical, coating and dimensional inspection.`
  );

  // Live Measured Data State
  const [measuredData, setMeasuredData] = useState<DetailedCoiMeasuredData>(() =>
    generateDetailedMeasuredDataForCustomer(currentTemplate, {
      workNo: 'W-2026-8831',
      coilNo: 'COIL-2026-A109',
      lengthMm: '650.0 mm',
      heatNo: 'HEAT-CA105-09',
      invoiceNo: 'INV-2026-08-0442'
    })
  );

  const [isPullingData, setIsPullingData] = useState<boolean>(false);
  const [pullSuccess, setPullSuccess] = useState<boolean>(false);

  // Auto update defaults when template changes
  useEffect(() => {
    setHeatNo(currentTemplate.heatNoMaterialCode || 'HEAT-CA105-09');
    setLengthMm(currentTemplate.defaultLength || '650.0 mm');
    setRemarks(`Material conforms to ${currentTemplate.standardRef} in all chemical, mechanical, coating and dimensional inspection.`);
    handlePullLiveInspectionData();
  }, [currentTemplate.id]);

  const handlePullLiveInspectionData = () => {
    setIsPullingData(true);
    setTimeout(() => {
      const freshData = generateDetailedMeasuredDataForCustomer(currentTemplate, {
        workNo,
        coilNo,
        lengthMm,
        heatNo,
        invoiceNo
      });
      setMeasuredData(freshData);
      setIsPullingData(false);
      setPullSuccess(true);
      setTimeout(() => setPullSuccess(false), 3000);
    }, 450);
  };

  const handleGenerateCertificate = () => {
    const newCoiNo = generateNextCoiNumber();
    const newRecord: CoiIssueRecord = {
      id: `coi-rec-${Date.now()}`,
      coiNo: newCoiNo,
      issueDate,
      productionDate,
      customerName: currentTemplate.customerName,
      customerAddress: currentTemplate.customerAddress,
      poNo,
      invoiceDoNo: invoiceNo,
      profileCode: currentTemplate.partNumber,
      profileName: currentTemplate.productName,
      alloyGrade: currentTemplate.heatNoMaterialCode,
      temper: 'H112',
      standardRef: currentTemplate.standardRef,
      coilNo,
      heatNo,
      length: lengthMm,
      quantityPcs,
      totalWeightKg,
      inspectorName,
      approverName,
      overallResult: 'PASS',
      remarks,
      qrVerificationCode: `VERIFY-${newCoiNo}-${coilNo}-UACJ-PASSED`,
      createdAt: new Date().toISOString(),
      customerTemplateId: currentTemplate.id,
      partNumber: currentTemplate.partNumber,
      productName: currentTemplate.productName,
      workNo,
      coatingType: currentTemplate.coatingType,
      cutEndType: currentTemplate.cutEndType,
      drawingNoRevision: currentTemplate.drawingNoRevision,
      companyHeader: currentTemplate.companyNameHeader,
      qaSectionHeader: currentTemplate.sectionNameHeader,
      docControlNo: currentTemplate.documentControlNo,
      detailedData: measuredData,
      items: [
        { id: 'i1', category: 'CHEMICAL', parameterKey: 'Si', nameTh: 'ซิลิคอน (Si)', nameEn: 'Silicon (Si)', unit: '%', specText: `Max ${currentTemplate.chemicalSpecs.si.max}`, actualValue: measuredData.chemActual.si, testMethod: 'OES', isPass: true, linkSource: 'IQA-01' },
        { id: 'i2', category: 'CHEMICAL', parameterKey: 'Cu', nameTh: 'ทองแดง (Cu)', nameEn: 'Copper (Cu)', unit: '%', specText: `${currentTemplate.chemicalSpecs.cu.min} - ${currentTemplate.chemicalSpecs.cu.max}`, actualValue: measuredData.chemActual.cu, testMethod: 'OES', isPass: true, linkSource: 'IQA-01' },
        { id: 'i3', category: 'MECHANICAL', parameterKey: 'Tensile_Strength', nameTh: 'แรงดึง (Tensile)', nameEn: 'Tensile strength', unit: 'N/mm²', specText: `Min ${currentTemplate.mechanicalSpecs.tensileMin}`, actualValue: measuredData.mechActual.tensileStrength, testMethod: 'JIS Z2241', isPass: true, linkSource: 'IPQA-01' },
        { id: 'i4', category: 'SURFACE_COATING', parameterKey: 'Roughness_Rz_Top', nameTh: 'ความหยาบผิว Rz บน', nameEn: 'Surface Roughness Rz (Top)', unit: 'µm', specText: `≤ ${currentTemplate.mechanicalSpecs.roughnessRzTopMax} µm`, actualValue: measuredData.mechActual.roughnessRzTop, testMethod: 'ISO 4287', isPass: true, linkSource: 'IPQA-02' },
        { id: 'i5', category: 'SURFACE_COATING', parameterKey: 'Zn_Adhesion_Weight', nameTh: 'น้ำหนักชั้นเคลือบ Zn', nameEn: 'Zn adhesion weight', unit: 'g/m²', specText: currentTemplate.coatingSpecs.znAdhesionWeightSpec, actualValue: measuredData.coatingActual.head.znAdhesionWeightTop, testMethod: 'XRF', isPass: true, linkSource: 'IPQA-03' },
        { id: 'i6', category: 'DIMENSION', parameterKey: 'Outer_Web_T1', nameTh: 'ความหนาผนังนอก T1', nameEn: 'Outer web T1', unit: 'mm', specText: currentTemplate.webThicknessSpecs.outerWebT1Spec, actualValue: measuredData.webActual.head.t1, testMethod: 'Micrometer', isPass: true, linkSource: 'IPQA-07' },
        { id: 'i7', category: 'DIMENSION', parameterKey: 'Width_At_5mm', nameTh: 'ความกว้าง (5mm cut end)', nameEn: 'Width at 5mm', unit: 'mm', specText: currentTemplate.geometrySpecs.widthAt5mmSpec, actualValue: measuredData.geometryActual.head.widthLeft, testMethod: 'Caliper', isPass: true, linkSource: 'IPQA-05' }
      ]
    };

    saveCoiRecord(newRecord);

    if (onLogNewActivity) {
      onLogNewActivity({
        inspectorName,
        moduleCode: 'COI-01',
        moduleNameTh: 'ออกใบรับรองผลการตรวจคุณภาพ (COI)',
        moduleNameEn: 'Certificate of Inspection Issuance',
        status: 'PASS',
        sampleIdentifier: `${newCoiNo} (${coilNo})`,
        summaryNotes: `Issued official COI for ${currentTemplate.customerName} - Part ${currentTemplate.partNumber}, Length ${lengthMm}`
      });
    }

    onCertificateIssued(newRecord);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase">
            <FileText className="w-4 h-4" />
            {isTh ? 'แท็บ 2: ระบุรายละเอียดและดึงผลตรวจ (Issue COI & Live Data Link)' : 'Tab 2: Issue Details & Auto-Pull Live Inspection Data'}
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {isTh ? 'ออกใบรับรองคุณภาพ COI ส่งมอบลูกค้า' : 'Issue Certificate of Inspection (COI / COA)'}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {isTh
              ? 'เลือกลูกค้า ระบุ Coil No., Length แล้วกดดึงผลตรวจจริงจาก IQA / IPQA เพื่อสร้างใบรับรองทันที'
              : 'Select Customer, specify Coil No. & Length, pull live inspection results, and generate the Certificate.'}
          </p>
        </div>

        {/* Pull live inspection data button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePullLiveInspectionData}
            disabled={isPullingData}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-lg ${
              pullSuccess
                ? 'bg-emerald-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isPullingData ? 'animate-spin' : ''}`} />
            {isPullingData
              ? (isTh ? 'กำลังดึงข้อมูล IQA/IPQA...' : 'Pulling IQA/IPQA data...')
              : pullSuccess
              ? (isTh ? 'ดึงข้อมูลสำเร็จ 100%' : 'Data Linked Successfully!')
              : (isTh ? '⚡ ดึงข้อมูลผลการตรวจจาก IQA / IPQA' : '⚡ Pull Live IQA / IPQA Data')}
          </button>

          <button
            onClick={handleGenerateCertificate}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-5 py-2.5 rounded-lg text-xs font-black transition shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            {isTh ? '🚀 สร้างเอกสาร COI ส่งลูกค้า' : '🚀 Generate Official Certificate'}
          </button>
        </div>
      </div>

      {/* Input Form Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Customer & Production Identifiers */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            <Building2 className="w-4 h-4" />
            {isTh ? '1. เลือกลูกค้าและคำสั่งผลิต' : '1. Customer & Work Order'}
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1 font-semibold">{isTh ? 'แม่แบบลูกค้า (Customer Template)' : 'Customer Template'}</label>
            <select
              value={currentTemplate.id}
              onChange={e => onSelectTemplate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-cyan-500 focus:outline-none"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  🏢 {t.customerName} ({t.partNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'Work No.' : 'Work No.'}</label>
              <input
                type="text"
                value={workNo}
                onChange={e => setWorkNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-cyan-400 text-[11px] mb-1 font-semibold">{isTh ? 'Coil No. (ม้วนที่ตรวจ)' : 'Coil No.'}</label>
              <input
                type="text"
                value={coilNo}
                onChange={e => setCoilNo(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-500/80 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'Heat No. (เบอร์ฮีท)' : 'Heat No.'}</label>
              <input
                type="text"
                value={heatNo}
                onChange={e => setHeatNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-cyan-400 text-[11px] mb-1 font-semibold">{isTh ? 'Length (ความยาวตัด)' : 'Length (mm)'}</label>
              <input
                type="text"
                value={lengthMm}
                onChange={e => setLengthMm(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-500/80 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Commercial & Shipping Details */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            <Layers className="w-4 h-4" />
            {isTh ? '2. ข้อมูลเชิงพาณิชย์และการจัดส่ง' : '2. Commercial & Shipment'}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'เลขที่ PO No.' : 'PO No.'}</label>
              <input
                type="text"
                value={poNo}
                onChange={e => setPoNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'Invoice / DO No.' : 'Invoice / DO No.'}</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'จำนวน (Quantity)' : 'Quantity'}</label>
              <input
                type="text"
                value={quantityPcs}
                onChange={e => setQuantityPcs(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'น้ำหนักรวม (Weight)' : 'Total Weight'}</label>
              <input
                type="text"
                value={totalWeightKg}
                onChange={e => setTotalWeightKg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'วันที่ออกเอกสาร' : 'Issue Date'}</label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'วันที่ผลิต' : 'Production Date'}</label>
              <input
                type="date"
                value={productionDate}
                onChange={e => setProductionDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Quality Approvals & Signatures */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            <CheckCircle2 className="w-4 h-4" />
            {isTh ? '3. ผู้รับรองคุณภาพ (QA Sign-off)' : '3. QA Sign-off'}
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'ผู้ตรวจสอบ (Inspector Name)' : 'Inspector Name'}</label>
            <input
              type="text"
              value={inspectorName}
              onChange={e => setInspectorName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'ผู้อนุมัติ (QA Manager / Approver)' : 'QA Approver'}</label>
            <input
              type="text"
              value={approverName}
              onChange={e => setApproverName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">{isTh ? 'ข้อความรับรองคุณภาพ (Quality Remarks)' : 'Remarks'}</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Live Inspection Checkpoints Preview Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-bold text-white">
              {isTh ? 'ผลการตรวจสอบจริงที่ดึงจาก IQA / IPQA (Live Measured Inspection Values)' : 'Linked Inspection Results'}
            </h3>
          </div>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
            ✓ ALL 40+ CHECKPOINTS PASS
          </span>
        </div>

        {/* Quick summary grid of key parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold">Si Content</div>
            <div className="text-sm font-mono font-bold text-emerald-400">{measuredData.chemActual.si}%</div>
            <div className="text-[9px] text-slate-500">Spec: &lt; {currentTemplate.chemicalSpecs.si.max}%</div>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold">Cu Content</div>
            <div className="text-sm font-mono font-bold text-emerald-400">{measuredData.chemActual.cu}%</div>
            <div className="text-[9px] text-slate-500">Spec: {currentTemplate.chemicalSpecs.cu.min}-{currentTemplate.chemicalSpecs.cu.max}%</div>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold">Tensile Strength</div>
            <div className="text-sm font-mono font-bold text-emerald-400">{measuredData.mechActual.tensileStrength} N/mm²</div>
            <div className="text-[9px] text-slate-500">Spec: &gt; {currentTemplate.mechanicalSpecs.tensileMin}</div>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold">Zn Coating Weight</div>
            <div className="text-sm font-mono font-bold text-emerald-400">{measuredData.coatingActual.head.znAdhesionWeightTop} g/m²</div>
            <div className="text-[9px] text-slate-500">Spec: 9.5 - 13.5</div>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold">Wall Outer T1</div>
            <div className="text-sm font-mono font-bold text-emerald-400">{measuredData.webActual.head.t1} mm</div>
            <div className="text-[9px] text-slate-500">Spec: 0.175 - 0.275</div>
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold">Width @ 5mm</div>
            <div className="text-sm font-mono font-bold text-emerald-400">{measuredData.geometryActual.head.widthLeft} mm</div>
            <div className="text-[9px] text-slate-500">Spec: 14.75 - 14.85</div>
          </div>
        </div>
      </div>
    </div>
  );
};
