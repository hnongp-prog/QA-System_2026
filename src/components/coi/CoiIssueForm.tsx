import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers,
  RefreshCw,
  Link,
  KeyRound,
  Database,
  Ruler
} from 'lucide-react';
import {
  CoiCustomerTemplate,
  CoiIssueRecord,
  DetailedCoiMeasuredData,
  InspectionActivity
} from '../../types';
import {
  generateNextCoiNumber,
  saveCoiRecord
} from '../../utils/coiStorage';
import {
  AllCloudInspectionDatasets,
  CoiLiveLinkResult,
  extractLinkSuggestions,
  fetchFreshCloudInspectionDatasets,
  getCachedCloudInspectionDatasets,
  linkLiveCoiData
} from '../../utils/coiLiveDataLinker';

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

  // Cached & Live Cloud Datasets (IQA-01..03, IPQA-01..08, OQA-01)
  const [datasets, setDatasets] = useState<AllCloudInspectionDatasets>(() => getCachedCloudInspectionDatasets());

  const suggestions = useMemo(() => extractLinkSuggestions(datasets), [datasets]);

  // Form Inputs (Primary Link Keys: Heat No. (Billet), Coil No., Length)
  const [workNo, setWorkNo] = useState<string>('W-2026-8831');
  const [coilNo, setCoilNo] = useState<string>(() => {
    const cached = getCachedCloudInspectionDatasets();
    const s = extractLinkSuggestions(cached);
    return s.coilNumbers[0] || 'COIL-2026-A109';
  });
  const [heatNo, setHeatNo] = useState<string>(() => {
    const cached = getCachedCloudInspectionDatasets();
    const s = extractLinkSuggestions(cached);
    return s.heatNumbers[0] || currentTemplate.heatNoMaterialCode || 'HEAT-2026-9011';
  });
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

  // Live Linked Data State
  const [linkResult, setLinkResult] = useState<CoiLiveLinkResult>(() =>
    linkLiveCoiData({
      template: currentTemplate,
      heatNo: heatNo,
      coilNo: coilNo,
      lengthMm: currentTemplate.defaultLength || '650.0 mm',
      workNo: 'W-2026-8831',
      invoiceNo: 'INV-2026-08-0442',
      datasets: getCachedCloudInspectionDatasets()
    })
  );

  const measuredData: DetailedCoiMeasuredData = linkResult.measuredData;

  const [isPullingData, setIsPullingData] = useState<boolean>(false);
  const [pullSuccess, setPullSuccess] = useState<boolean>(false);

  // Run initial live Firestore fetch on mount
  useEffect(() => {
    let active = true;
    fetchFreshCloudInspectionDatasets().then(freshDatasets => {
      if (!active) return;
      setDatasets(freshDatasets);
      const res = linkLiveCoiData({
        template: currentTemplate,
        heatNo,
        coilNo,
        lengthMm,
        workNo,
        invoiceNo,
        datasets: freshDatasets
      });
      setLinkResult(res);
    });
    return () => {
      active = false;
    };
  }, []);

  // Re-link automatically whenever Heat No., Coil No., Length, or Template changes
  useEffect(() => {
    const res = linkLiveCoiData({
      template: currentTemplate,
      heatNo,
      coilNo,
      lengthMm,
      workNo,
      invoiceNo,
      datasets
    });
    setLinkResult(res);
  }, [currentTemplate, heatNo, coilNo, lengthMm, workNo, invoiceNo, datasets]);

  // Update remarks & default length when template changes
  useEffect(() => {
    setLengthMm(currentTemplate.defaultLength || '650.0 mm');
    setRemarks(`Material conforms to ${currentTemplate.standardRef} in all chemical, mechanical, coating and dimensional inspection.`);
  }, [currentTemplate.id]);

  // Pull Live IQA & IPQA Data from Firestore (force refresh)
  const handlePullLiveInspectionData = async () => {
    setIsPullingData(true);
    try {
      const freshDatasets = await fetchFreshCloudInspectionDatasets();
      setDatasets(freshDatasets);

      const res = linkLiveCoiData({
        template: currentTemplate,
        heatNo,
        coilNo,
        lengthMm,
        workNo,
        invoiceNo,
        datasets: freshDatasets
      });
      setLinkResult(res);

      // Auto-fill detected Length or Work No. if matched from IPQA-05 / IPQA-01 / OQA-01
      if (res.detectedLengthMm) {
        setLengthMm(res.detectedLengthMm);
      }
      if (res.detectedWorkNo) {
        setWorkNo(res.detectedWorkNo);
      }

      setPullSuccess(true);
      setTimeout(() => setPullSuccess(false), 3000);
    } finally {
      setIsPullingData(false);
    }
  };

  // Helper to check numeric range against template spec
  const checkWithinSpec = (val: number, min?: number, max?: number): boolean => {
    if (min !== undefined && val < min) return false;
    if (max !== undefined && val > max) return false;
    return true;
  };

  const siPass = checkWithinSpec(measuredData.chemActual.si, undefined, currentTemplate.chemicalSpecs.si.max);
  const cuPass = checkWithinSpec(measuredData.chemActual.cu, currentTemplate.chemicalSpecs.cu.min, currentTemplate.chemicalSpecs.cu.max);
  const tensilePass = checkWithinSpec(measuredData.mechActual.tensileStrength, currentTemplate.mechanicalSpecs.tensileMin);
  const rzTopPass = checkWithinSpec(measuredData.mechActual.roughnessRzTop, undefined, currentTemplate.mechanicalSpecs.roughnessRzTopMax);
  const znPass = checkWithinSpec(
    measuredData.coatingActual.head.znAdhesionWeightTop,
    currentTemplate.coatingSpecs.znAdhesionWeightMin,
    currentTemplate.coatingSpecs.znAdhesionWeightMax
  );
  const t1Pass = checkWithinSpec(
    measuredData.webActual.head.t1,
    currentTemplate.webThicknessSpecs.outerWebT1Min,
    currentTemplate.webThicknessSpecs.outerWebT1Max
  );
  const widthPass = checkWithinSpec(
    measuredData.geometryActual.head.widthLeft,
    currentTemplate.geometrySpecs.widthMin,
    currentTemplate.geometrySpecs.widthMax
  );

  const allKeyCheckpointsPass =
    siPass && cuPass && tensilePass && rzTopPass && znPass && t1Pass && widthPass && !linkResult.hasAnyFail;

  // Quick-pick helpers when user selects a Coil No.
  const normalizedCoil = coilNo.trim().toUpperCase().replace(/\s+/g, '');
  const suggestedHeatForCoil = suggestions.coilToHeat[normalizedCoil];
  const suggestedLengthsForCoil = suggestions.coilToLengths[normalizedCoil] || [];

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
      overallResult: allKeyCheckpointsPass ? 'PASS' : 'REJECT',
      remarks,
      qrVerificationCode: `VERIFY-${newCoiNo}-${coilNo}-${heatNo}-UACJ-${allKeyCheckpointsPass ? 'PASSED' : 'CHECK'}`,
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
        { id: 'i1', category: 'CHEMICAL', parameterKey: 'Si', nameTh: 'ซิลิคอน (Si)', nameEn: 'Silicon (Si)', unit: '%', specText: `Max ${currentTemplate.chemicalSpecs.si.max}`, actualValue: measuredData.chemActual.si, testMethod: 'OES', isPass: siPass, linkSource: 'IQA-01' },
        { id: 'i2', category: 'CHEMICAL', parameterKey: 'Cu', nameTh: 'ทองแดง (Cu)', nameEn: 'Copper (Cu)', unit: '%', specText: `${currentTemplate.chemicalSpecs.cu.min} - ${currentTemplate.chemicalSpecs.cu.max}`, actualValue: measuredData.chemActual.cu, testMethod: 'OES', isPass: cuPass, linkSource: 'IQA-01' },
        { id: 'i3', category: 'MECHANICAL', parameterKey: 'Tensile_Strength', nameTh: 'แรงดึง (Tensile)', nameEn: 'Tensile strength', unit: 'N/mm²', specText: `Min ${currentTemplate.mechanicalSpecs.tensileMin}`, actualValue: measuredData.mechActual.tensileStrength, testMethod: 'JIS Z2241', isPass: tensilePass, linkSource: 'IPQA-01' },
        { id: 'i4', category: 'SURFACE_COATING', parameterKey: 'Roughness_Rz_Top', nameTh: 'ความหยาบผิว Rz บน', nameEn: 'Surface Roughness Rz (Top)', unit: 'µm', specText: `≤ ${currentTemplate.mechanicalSpecs.roughnessRzTopMax} µm`, actualValue: measuredData.mechActual.roughnessRzTop, testMethod: 'ISO 4287', isPass: rzTopPass, linkSource: 'IPQA-02' },
        { id: 'i5', category: 'SURFACE_COATING', parameterKey: 'Zn_Adhesion_Weight', nameTh: 'น้ำหนักชั้นเคลือบ Zn', nameEn: 'Zn adhesion weight', unit: 'g/m²', specText: currentTemplate.coatingSpecs.znAdhesionWeightSpec, actualValue: measuredData.coatingActual.head.znAdhesionWeightTop, testMethod: 'XRF', isPass: znPass, linkSource: 'IPQA-03' },
        { id: 'i6', category: 'DIMENSION', parameterKey: 'Outer_Web_T1', nameTh: 'ความหนาผนังนอก T1', nameEn: 'Outer web T1', unit: 'mm', specText: currentTemplate.webThicknessSpecs.outerWebT1Spec, actualValue: measuredData.webActual.head.t1, testMethod: 'Micrometer', isPass: t1Pass, linkSource: 'IPQA-07' },
        { id: 'i7', category: 'DIMENSION', parameterKey: 'Width_At_5mm', nameTh: 'ความกว้าง (5mm cut end)', nameEn: 'Width at 5mm', unit: 'mm', specText: currentTemplate.geometrySpecs.widthAt5mmSpec, actualValue: measuredData.geometryActual.head.widthLeft, testMethod: 'Caliper', isPass: widthPass, linkSource: 'IPQA-05' }
      ]
    };

    saveCoiRecord(newRecord);

    if (onLogNewActivity) {
      onLogNewActivity({
        inspectorName,
        moduleCode: 'COI-01',
        moduleNameTh: 'ออกใบรับรองผลการตรวจคุณภาพ (COI)',
        moduleNameEn: 'Certificate of Inspection Issuance',
        status: allKeyCheckpointsPass ? 'PASS' : 'FAIL',
        sampleIdentifier: `${newCoiNo} (${coilNo} / ${heatNo})`,
        summaryNotes: `Issued official COI for ${currentTemplate.customerName} - Heat ${heatNo}, Coil ${coilNo}, Length ${lengthMm} (${linkResult.matchedModulesCount}/${linkResult.totalCheckedModules} linked)`
      });
    }

    onCertificateIssued(newRecord);
  };

  return (
    <div className="space-y-6">
      {/* Datalists for Auto-Suggest from Real IQA & IPQA Records */}
      <datalist id="coi-heat-no-list">
        {suggestions.heatNumbers.map(h => (
          <option key={h} value={h} />
        ))}
      </datalist>
      <datalist id="coi-coil-no-list">
        {suggestions.coilNumbers.map(c => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="coi-length-list">
        {(suggestedLengthsForCoil.length > 0 ? suggestedLengthsForCoil : suggestions.lengths).map(l => (
          <option key={l} value={l} />
        ))}
      </datalist>

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
              ? 'ระบุ Heat No. (Billet), Coil No. และ Length ของ Coil No. เพื่อเชื่อมโยงและดึงผลตรวจจริงจาก IQA (เคมีบิลเล็ต) และ IPQA (01–08) อัตโนมัติ'
              : 'Specify Heat No. (Billet), Coil No., and Length to auto-link and pull live IQA & IPQA inspection records.'}
          </p>
        </div>

        {/* Pull live inspection data button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
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
              ? (isTh ? 'กำลังดึงข้อมูลจาก Cloud IQA/IPQA...' : 'Syncing Cloud IQA/IPQA...')
              : pullSuccess
              ? (isTh ? `เชื่อมข้อมูลแล้ว (${linkResult.matchedModulesCount}/${linkResult.totalCheckedModules} โมดูล)` : `Linked (${linkResult.matchedModulesCount}/${linkResult.totalCheckedModules})`)
              : (isTh ? '⚡ ดึงข้อมูลผลการตรวจจาก IQA / IPQA' : '⚡ Pull Live IQA / IPQA Data')}
          </button>

          <button
            type="button"
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
        {/* Card 1: Customer & Primary Link Keys (Heat No., Coil No., Length) */}
        <div className="bg-slate-900/90 border border-cyan-500/30 p-4 rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              {isTh ? '1. ลูกค้า & Key เชื่อมข้อมูล IQA/IPQA' : '1. Customer & Data Link Keys'}
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/70">
              <KeyRound className="w-3 h-3" />
              Heat + Coil
            </span>
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

          {/* Primary Link Key #1: Heat No. (Billet) & Primary Link Key #2: Coil No. */}
          <div className="p-2.5 rounded-lg bg-slate-950/90 border border-cyan-900/60 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold">
              <span className="flex items-center gap-1">
                <Link className="w-3 h-3" />
                {isTh ? 'Key หลักสำหรับ Link ข้อมูล IQA & IPQA' : 'Primary Traceability Link Keys'}
              </span>
              <span className="text-slate-400 font-normal">
                {suggestions.heatNumbers.length} Heat • {suggestions.coilNumbers.length} Coil
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-amber-300 text-[11px] mb-1 font-bold">
                  {isTh ? '🔑 Heat No. (Billet) [IQA-01/08]' : '🔑 Heat No. (Billet)'}
                </label>
                <input
                  type="text"
                  list="coi-heat-no-list"
                  value={heatNo}
                  onChange={e => setHeatNo(e.target.value)}
                  placeholder="e.g. HEAT-2026-9011"
                  className="w-full bg-slate-900 border border-amber-500/70 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-cyan-300 text-[11px] mb-1 font-bold">
                  {isTh ? '🔑 Coil No. (IPQA-01..07)' : '🔑 Coil No.'}
                </label>
                <input
                  type="text"
                  list="coi-coil-no-list"
                  value={coilNo}
                  onChange={e => setCoilNo(e.target.value)}
                  placeholder="e.g. COIL-2026-A109"
                  className="w-full bg-slate-900 border border-cyan-500/80 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono font-bold focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Auto-suggest Heat or Length detected from Coil No. */}
            {(suggestedHeatForCoil && suggestedHeatForCoil.toUpperCase() !== heatNo.trim().toUpperCase()) ||
            suggestedLengthsForCoil.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                {suggestedHeatForCoil && suggestedHeatForCoil.toUpperCase() !== heatNo.trim().toUpperCase() && (
                  <button
                    type="button"
                    onClick={() => setHeatNo(suggestedHeatForCoil)}
                    className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/70 font-mono transition"
                    title={isTh ? 'คลิกเพื่อใช้ Heat No. ที่ผูกกับ Coil นี้จาก IPQA-01' : 'Use Heat No. linked to this Coil'}
                  >
                    + ใช้ Heat: {suggestedHeatForCoil}
                  </button>
                )}
                {suggestedLengthsForCoil.map(len => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setLengthMm(len)}
                    className={`px-2 py-0.5 rounded border font-mono transition ${
                      lengthMm.trim() === len
                        ? 'bg-cyan-600 text-slate-950 border-cyan-400 font-bold'
                        : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-800/70'
                    }`}
                  >
                    L: {len}
                  </button>
                ))}
              </div>
            ) : null}
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
              <label className="block text-cyan-400 text-[11px] mb-1 font-semibold flex items-center gap-1">
                <Ruler className="w-3 h-3" />
                <span>{isTh ? 'Length ของ Coil No.' : 'Coil Length (mm)'}</span>
              </label>
              <input
                type="text"
                list="coi-length-list"
                value={lengthMm}
                onChange={e => setLengthMm(e.target.value)}
                placeholder="e.g. 650.0 mm"
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
              list="qa-inspector-list"
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

      {/* Live IQA & IPQA Traceability Link Status Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {isTh
                ? 'สถานะการเชื่อมโยงข้อมูล IQA & IPQA (เชื่อมด้วย Key: Heat No. & Coil No.)'
                : 'Live IQA & IPQA Traceability Link Status (Key: Heat No. & Coil No.)'}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              {isTh
                ? `เชื่อมข้อมูลจริงแล้ว ${linkResult.matchedModulesCount} / ${linkResult.totalCheckedModules} โมดูล`
                : `Linked ${linkResult.matchedModulesCount} / ${linkResult.totalCheckedModules} Modules`}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Sync: {linkResult.lastSyncedAt}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {linkResult.moduleStatuses.map((mod) => {
            const keyBadge =
              mod.linkKeyType === 'HEAT_NO'
                ? 'Key: Heat No.'
                : mod.linkKeyType === 'HEAT_AND_COIL'
                  ? 'Key: Heat / Coil'
                  : mod.linkKeyType === 'COIL_AND_LENGTH'
                    ? 'Key: Coil + Length'
                    : 'Key: Coil No.';

            return (
              <div
                key={mod.moduleCode}
                className={`p-3 rounded-xl border text-xs transition ${
                  mod.matched
                    ? mod.status === 'FAIL'
                      ? 'bg-rose-950/30 border-rose-700/70'
                      : 'bg-emerald-950/25 border-emerald-700/60'
                    : 'bg-slate-950/80 border-slate-800/90 opacity-85'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {mod.moduleCode}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">{keyBadge}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      mod.status === 'PASS'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : mod.status === 'FAIL'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    {mod.matched ? `${mod.status} (${mod.recordCount})` : isTh ? 'ไม่พบข้อมูล' : 'Not Found'}
                  </span>
                </div>

                <div className="font-bold text-slate-200 text-[11px] truncate">
                  {isTh ? mod.moduleNameTh : mod.moduleNameEn}
                </div>
                <div className="text-[10px] font-mono text-amber-300/90 mt-0.5 truncate">
                  {mod.matched ? `✓ ${mod.matchedKeyDisplay}` : `Query: ${mod.matchedKeyDisplay}`}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {mod.summary}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Inspection Checkpoints Preview Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${allKeyCheckpointsPass ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`}></span>
            <h3 className="text-sm font-bold text-white">
              {isTh ? 'ผลการตรวจสอบจริงที่ดึงจาก IQA / IPQA (Live Measured Inspection Values)' : 'Linked Inspection Results'}
            </h3>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 w-fit ${
            allKeyCheckpointsPass
              ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
              : 'text-rose-300 bg-rose-950/60 border-rose-800'
          }`}>
            {allKeyCheckpointsPass ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>✓ ALL CHECKPOINTS PASS</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>⚠ OUT OF SPEC / FAIL DETECTED</span>
              </>
            )}
          </span>
        </div>

        {/* Summary grid of key parameters from IQA & IPQA */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>Si / Fe (OES)</span>
              <span className="text-amber-400 font-mono">IQA-01</span>
            </div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${siPass ? 'text-emerald-400' : 'text-rose-400'}`}>
              {measuredData.chemActual.si}% / {measuredData.chemActual.fe}%
            </div>
            <div className="text-[9px] text-slate-500">
              Spec: Si ≤ {currentTemplate.chemicalSpecs.si.max}%, Fe ≤ {currentTemplate.chemicalSpecs.fe.max}%
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>Cu / Mn (OES)</span>
              <span className="text-amber-400 font-mono">IQA-01</span>
            </div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${cuPass ? 'text-emerald-400' : 'text-rose-400'}`}>
              {measuredData.chemActual.cu}% / {measuredData.chemActual.mn}%
            </div>
            <div className="text-[9px] text-slate-500">
              Spec Cu: {currentTemplate.chemicalSpecs.cu.min}-{currentTemplate.chemicalSpecs.cu.max}%
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>Tensile / Elong</span>
              <span className="text-cyan-400 font-mono">IPQA-01</span>
            </div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${tensilePass ? 'text-emerald-400' : 'text-rose-400'}`}>
              {measuredData.mechActual.tensileStrength} / {measuredData.mechActual.elongation}%
            </div>
            <div className="text-[9px] text-slate-500">
              Spec: ≥ {currentTemplate.mechanicalSpecs.tensileMin} MPa
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>Rz Top / Bot</span>
              <span className="text-cyan-400 font-mono">IPQA-02</span>
            </div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${rzTopPass ? 'text-emerald-400' : 'text-rose-400'}`}>
              {measuredData.mechActual.roughnessRzTop} / {measuredData.mechActual.roughnessRzBottom} µm
            </div>
            <div className="text-[9px] text-slate-500">
              Spec: ≤ {currentTemplate.mechanicalSpecs.roughnessRzTopMax} µm
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>Zn / Flux Wt</span>
              <span className="text-cyan-400 font-mono">IPQA-03/04</span>
            </div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${znPass ? 'text-emerald-400' : 'text-rose-400'}`}>
              {measuredData.coatingActual.head.znAdhesionWeightTop} / {measuredData.coatingActual.head.fluxAdhesionWeightTop} g/m²
            </div>
            <div className="text-[9px] text-slate-500">
              Spec Zn: {currentTemplate.coatingSpecs.znAdhesionWeightMin}-{currentTemplate.coatingSpecs.znAdhesionWeightMax}
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>Wall T1 / Width</span>
              <span className="text-cyan-400 font-mono">IPQA-07/05</span>
            </div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${t1Pass && widthPass ? 'text-emerald-400' : 'text-rose-400'}`}>
              {measuredData.webActual.head.t1} / {measuredData.geometryActual.head.widthLeft} mm
            </div>
            <div className="text-[9px] text-slate-500">
              L={measuredData.geometryActual.head.lengthMm} mm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
