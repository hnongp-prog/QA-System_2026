import { NcrRecord, NcrSeverity, NcrStatus } from '../types';
import { saveCloudData, subscribeToCloudData } from '../services/firestoreSync';

export const ROOT_CAUSE_CATEGORIES = ['Man', 'Method', 'Machine', 'Materail', 'Enviroment'] as const;
export type RootCauseCategory = typeof ROOT_CAUSE_CATEGORIES[number];

/**
 * Extracts strictly ONLY the Out-of-Spec / NG points from inspection result text.
 * Strips redundant generic prefixes (e.g. "FAIL / Out of Spec:"),
 * filters out any passed/in-spec parameters, and returns an array of clean failure points.
 */
export function extractOnlyOutOfSpecPoints(rawResult?: string): string[] {
  if (!rawResult || typeof rawResult !== 'string') return ['-'];
  let text = rawResult.trim();
  if (!text) return ['-'];

  // If the whole string is an explicit overall PASS without any failure indicator
  if (/^PASS\b/i.test(text) && !/\b(fail|ng|out\s*of\s*spec|exceed|below|above|under|over|reject)\b/i.test(text) && !/[><≠]/.test(text)) {
    return ['-'];
  }

  // 1. Remove leading general prefixes
  text = text
    .replace(/^FAIL\s*\/\s*Out\s*of\s*Spec\s*:\s*/i, '')
    .replace(/^FAIL\s*:\s*/i, '')
    .replace(/^Out\s*of\s*Spec\s*:\s*/i, '')
    .replace(/^NG\s*:\s*/i, '')
    .replace(/^REJECT\s*:\s*/i, '')
    .trim();

  // 2. Parse segments separated by comma, semicolon, newline, or pipe outside parentheses/brackets
  const segments: string[] = [];
  let current = '';
  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth++;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);

    if ((char === ',' || char === ';' || char === '\n' || char === '|') && parenDepth === 0 && bracketDepth === 0) {
      if (current.trim()) segments.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) segments.push(current.trim());

  if (segments.length === 0) return ['-'];

  // Helper: check if a segment has an explicit failure indicator or comparison operator
  const isSegmentNg = (s: string): boolean => {
    // Has explicit fail keywords
    if (/\b(fail|ng|out\s*of\s*spec|exceed|exceeded|below|above|under|over|mismatch|reject|quarantine|defect|error|not\s+in\s+spec|out\s*of\s*tolerance)\b/i.test(s)) {
      return true;
    }
    // Has comparison operator with a limit (e.g. > 13.0, < 12.0, < Min, > Max)
    if (/[><≠≤≥]/.test(s)) {
      return true;
    }
    // Has spec violation markers like (Spec: ...), (Limit: ...), (Spec Min: ...), (Spec Max: ...)
    if (/\b(spec\s*:|spec\s+min|spec\s+max|limit\s*:|target\s*:)\b/i.test(s)) {
      return true;
    }
    // Has max(...) or min(...) markers indicating limit breach
    if (/\b(max\s*\(|min\s*\()/i.test(s)) {
      return true;
    }
    return false;
  };

  // Helper: check if a segment is an in-spec / passing mechanical property from Tensile test or normal measure
  // e.g. "Tensile 425 MPa", "Tensile: 425.0 MPa", "Yield: 265 MPa", "Elong: 22.5%", "Elongation 22%"
  const isMechanicalWithinSpec = (s: string): boolean => {
    const hasMechKeyword = /\b(tensile|yield|elong|elongation)\b/i.test(s);
    if (!hasMechKeyword) return false;
    // If it mentions tensile/yield/elong but does NOT have any fail indicator, comparison operator, or spec breach:
    return !isSegmentNg(s);
  };

  // Check if any segment in the collection is explicitly marked as NG or out-of-spec
  const hasAnyExplicitNg = segments.some(seg => isSegmentNg(seg.trim()));

  // 3. Filter segments:
  const outOfSpecSegments = segments.filter(seg => {
    const s = seg.trim();
    if (!s) return false;

    // Discard any segment explicitly marked with PASS / OK / Good / In Spec without failure indicators
    const isExplicitPass = /\b(pass|ok|good|within\s+spec|in\s+spec|normal)\b/i.test(s);
    if (isExplicitPass && !isSegmentNg(s)) {
      return false;
    }

    // Tensile test specific: If tensile, yield, or elongation are listed without an explicit failure indicator,
    // they are normal measurements that are within spec! Discard them!
    if (isMechanicalWithinSpec(s)) {
      return false;
    }

    // If at least one segment in the row is explicitly marked NG / has a violation operator,
    // then any other segment that does NOT have any NG indicator or comparison is a passing dimension/reading!
    if (hasAnyExplicitNg && !isSegmentNg(s)) {
      return false;
    }

    return true;
  });

  // 4. Format and clean each remaining segment
  const finalPoints = (outOfSpecSegments.length > 0 ? outOfSpecSegments : [])
    .map(seg => {
      return seg
        .replace(/^FAIL\s*\/\s*Out\s*of\s*Spec\s*:\s*/i, '')
        .replace(/^FAIL\s*:\s*/i, '')
        .replace(/^Out\s*of\s*Spec\s*:\s*/i, '')
        .replace(/^NG\s*:\s*/i, '')
        .replace(/^REJECT\s*:\s*/i, '')
        .trim();
    })
    .filter(Boolean);

  // If after filtering everything was discarded (i.e. all points were actually within spec or general text),
  // fallback safely to non-mechanical segments if dimension was the one present
  if (finalPoints.length === 0) {
    const nonMech = segments.filter(s => !isMechanicalWithinSpec(s.trim()));
    if (nonMech.length > 0) {
      return nonMech.map(s => s.replace(/^(FAIL|NG|REJECT|Out of Spec)\s*(\/|:)?\s*/i, '').trim()).filter(Boolean);
    }
    return [text.replace(/^(FAIL|NG|REJECT|Out of Spec)\s*(\/|:)?\s*/i, '').trim() || '-'];
  }

  return finalPoints;
}

export const INITIAL_NCR_RECORDS: NcrRecord[] = [
  {
    id: 'NCR-2026-001',
    docId: 'ncr-doc-001',
    coilNo: 'COIL-8802-B',
    profile: 'Profile B-002 (Al Extrusion)',
    inspectionDate: '2026-08-16 10:15',
    inspector: 'Somchai P. (IPQA)',
    process: 'IPQA-07 Thickness Wall Measurement (Line B - Extrusion #2)',
    inspectionResult: 'FAIL / Out of Spec: T1 max (3.70 mm > Spec 3.60 mm), T2 min (2.70 mm < Spec 2.80 mm), OR max (16.80 mm > Spec 16.50 mm)',
    status: 'QUARANTINE',
    severity: 'MAJOR',
    sourceModuleCode: 'IPQA-07',
    defectCount: 3,
    immediateAction: 'Hold and quarantine Coil #COIL-8802-B at Quarantine Bay Q-2. Red Tag applied.',
    rootCause: 'Extrusion die wear at mandrel tip #2 after 1,450 extrusion runs without calibration.',
    rootCauseCategories: ['Machine', 'Method'],
    correctiveAction: 'Replace extrusion die #D-8802 with newly polished die; readjust puller tension.',
    preventiveAction: 'Set automated die maintenance alert after 1,200 runs instead of 1,500 runs.',
    assignedTo: 'Wichai T. (Tooling & Die Engineer)',
    targetClosureDate: '2026-08-20',
    notes: 'Quarantined in Zone Q2. Sample sent to Lab for full dimensional verification.',
    createdAt: '2026-08-16T10:15:00.000Z'
  },
  {
    id: 'NCR-2026-002',
    docId: 'ncr-doc-002',
    coilNo: 'COIL-2026-B201',
    profile: 'CR-SS400 (Cold Rolled Strip)',
    inspectionDate: '2026-08-15 14:40',
    inspector: 'Kittisak N. (IPQA)',
    process: 'IPQA-01 Tensile Measurement (Tensile Machine M02)',
    inspectionResult: 'FAIL / Out of Spec: Tensile strength 382 MPa < Min 400 MPa, Elongation 17.5% < Min 20.0%',
    status: 'UNDER_INVESTIGATION',
    severity: 'CRITICAL',
    sourceModuleCode: 'IPQA-01',
    defectCount: 2,
    immediateAction: 'Stop slitting line batch. Tag 5 slit coils from Mother Coil B201 under quarantine.',
    rootCause: 'Annealing temperature in furnace zone #3 dropped by 35°C during midnight shift cycle.',
    rootCauseCategories: ['Machine', 'Enviroment'],
    correctiveAction: 'Recalibrate furnace thermocouple #TC-03 and perform re-annealing test on coil tail sample.',
    preventiveAction: 'Install automated IoT temperature alarm with WhatsApp/SMS notification.',
    assignedTo: 'Nattaporn S. (Metallurgical QA)',
    targetClosureDate: '2026-08-19',
    notes: 'Awaiting re-test result after pilot re-annealing.',
    createdAt: '2026-08-15T14:40:00.000Z'
  },
  {
    id: 'NCR-2026-003',
    docId: 'ncr-doc-003',
    coilNo: 'HEAT-99420 (Lot 2026-08/B1)',
    profile: 'Billet AA6063 (Ø 5.0 inch)',
    inspectionDate: '2026-08-14 09:30',
    inspector: 'Anan K. (IQA Inspector)',
    process: 'IQA-01 Billet Incoming (Chemical & Visual Inspection)',
    inspectionResult: 'FAIL / Out of Spec: Chemical composition Si = 0.65% (Spec Max: 0.60%), Fe = 0.38% (Spec Max: 0.35%)',
    status: 'CAPA_IN_PROGRESS',
    severity: 'CRITICAL',
    sourceModuleCode: 'IQA-01',
    defectCount: 2,
    immediateAction: 'Rejected incoming shipment of 18 tons. Placed in IQA Quarantine Area.',
    rootCause: 'Supplier scrap sorting error at foundry during melting furnace charge.',
    rootCauseCategories: ['Materail', 'Man'],
    correctiveAction: 'Return 18 tons to supplier for credit note; request 8D report from supplier.',
    preventiveAction: 'Require Supplier Mill Certificate pre-approval prior to truck dispatch.',
    assignedTo: 'Surasak P. (Supplier Quality Engineer)',
    targetClosureDate: '2026-08-22',
    notes: 'Supplier acknowledged defect on 2026-08-14. Pending 8D formal submission.',
    createdAt: '2026-08-14T09:30:00.000Z'
  },
  {
    id: 'NCR-2026-004',
    docId: 'ncr-doc-004',
    coilNo: 'LOT-ZN-2026-88',
    profile: 'Zn Wire Pure 99.99% (Ø 2.0 mm)',
    inspectionDate: '2026-08-13 16:15',
    inspector: 'Prasert L. (IQA)',
    process: 'IQA-03 Zn Wire Incoming Inspection (Spool Weight & Diameter)',
    inspectionResult: 'FAIL / Out of Spec: Wire diameter 1.88 mm (Spec Min: 1.95 mm), Spool net weight 13.8 kg < 15.0 kg',
    status: 'REWORK',
    severity: 'MAJOR',
    sourceModuleCode: 'IQA-03',
    defectCount: 2,
    immediateAction: 'Tag 20 spools with Yellow Hold Tag. Do not feed to zinc spraying arc booth.',
    rootCause: 'Supplier drawing die undersized during final coil winding.',
    rootCauseCategories: ['Materail', 'Machine'],
    correctiveAction: 'Supplier replacement spools shipped on express freight.',
    preventiveAction: '100% digital caliper check at incoming receiving gate.',
    assignedTo: 'Prasert L. (IQA Lead)',
    targetClosureDate: '2026-08-18',
    notes: 'Rework / return to vendor for weight credit adjustment.',
    createdAt: '2026-08-13T16:15:00.000Z'
  },
  {
    id: 'NCR-2026-005',
    docId: 'ncr-doc-005',
    coilNo: 'BOX-2026-0881',
    profile: 'Part P-8801-TK (Automotive Bracket Frame)',
    inspectionDate: '2026-08-12 11:20',
    inspector: 'Thanya K. (OQA Officer)',
    process: 'OQA-01 FG Pre-Shipment Tag & Packaging Verification',
    inspectionResult: 'FAIL / Out of Spec: Tag Drawing No. mismatch (Tag says DWG-2026-0881, Master Spec requires DWG-2026-0882-REV3)',
    status: 'CLOSED',
    severity: 'MINOR',
    sourceModuleCode: 'OQA-01',
    defectCount: 1,
    immediateAction: 'Re-print corrected barcode label and re-attach to packaging box.',
    rootCause: 'Operator used legacy template file from old revision folder.',
    rootCauseCategories: ['Man', 'Method'],
    correctiveAction: 'Deleted old template files from packaging workstation printer queue.',
    preventiveAction: 'Locked label printing software to pull drawing revisions strictly from ERP database.',
    assignedTo: 'Thanya K. (OQA Lead)',
    targetClosureDate: '2026-08-13',
    closedAt: '2026-08-13 15:00',
    closedBy: 'Manager QA-01',
    notes: 'CAPA verified and closed successfully.',
    createdAt: '2026-08-12T11:20:00.000Z'
  }
];

const LOCAL_STORAGE_KEY = 'qa_ncr_records';

/**
 * Retrieve all NCR records from localStorage or initial mock data
 */
export function getStoredNcrRecords(): NcrRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_NCR_RECORDS));
      return INITIAL_NCR_RECORDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_NCR_RECORDS;
  } catch (err) {
    console.warn('Failed to load NCR records from localStorage:', err);
    return INITIAL_NCR_RECORDS;
  }
}

/**
 * Save NCR records to localStorage and Cloud Firestore
 */
export function saveNcrRecords(records: NcrRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    // Dispatch a custom event so other components or tabs can re-sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ncr_records_updated', { detail: records }));
    }
  } catch (err) {
    console.error('Failed to save NCR records:', err);
  }

  // Sync to Firebase Cloud Firestore for multi-device sync
  saveCloudData<NcrRecord[]>(LOCAL_STORAGE_KEY, records).catch((err) => {
    console.warn('Failed to sync NCR records to Firestore:', err);
  });
}

/**
 * Subscribe to real-time NCR records updates from Firestore
 */
export function subscribeToNcrRecords(callback: (records: NcrRecord[]) => void) {
  return subscribeToCloudData<NcrRecord[]>(
    LOCAL_STORAGE_KEY,
    (records) => {
      if (Array.isArray(records)) {
        callback(records);
      }
    },
    INITIAL_NCR_RECORDS
  );
}

/**
 * Add a new NCR record
 */
export function addNcrRecord(
  data: Omit<NcrRecord, 'id' | 'createdAt'> & { id?: string }
): NcrRecord {
  const currentList = getStoredNcrRecords();
  const year = new Date().getFullYear();
  const nextNum = currentList.length + 1;
  const newId = data.id || `NCR-${year}-${String(nextNum).padStart(3, '0')}`;

  const newRecord: NcrRecord = {
    ...data,
    id: newId,
    docId: data.docId || `ncr-doc-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  const updatedList = [newRecord, ...currentList];
  saveNcrRecords(updatedList);
  return newRecord;
}

/**
 * Automatically create an NCR record from any inspection finding FAIL / NG / Out-of-Spec
 */
export function createNcrFromFailInspection(params: {
  coilNo: string;
  profile: string;
  inspectionDate?: string;
  inspector: string;
  process: string;
  inspectionResult: string;
  sourceModuleCode: string;
  severity?: NcrSeverity;
  status?: NcrStatus;
  defectCount?: number;
  notes?: string;
}): NcrRecord {
  const now = new Date();
  const dateStr = params.inspectionDate || now.toLocaleString('sv-SE').slice(0, 16);

  return addNcrRecord({
    coilNo: params.coilNo || 'UNKNOWN-COIL',
    profile: params.profile || 'STANDARD-SPEC',
    inspectionDate: dateStr,
    inspector: params.inspector || 'QA Inspector',
    process: params.process,
    inspectionResult: params.inspectionResult,
    sourceModuleCode: params.sourceModuleCode,
    status: params.status || 'QUARANTINE',
    severity: params.severity || 'MAJOR',
    defectCount: params.defectCount || 1,
    immediateAction: `Auto-generated from ${params.process}. Lot quarantined for QA disposition.`,
    notes: params.notes || `Detected out-of-spec during ${params.process} inspection.`
  });
}

/**
 * Export NCR records to CSV format with the 6 separated fields
 */
export function exportNcrToCsv(records: NcrRecord[]): void {
  if (!records || records.length === 0) return;

  const headers = [
    'NCR Number',
    'Coil No. / Lot',
    'Profile / Part / Spec',
    'Inspection Date',
    'Inspector',
    'Process / Station',
    'Inspection Result (Out of Spec / NG Detail)',
    'Status',
    'Severity',
    'Source Module',
    'Defect Count',
    'Immediate Action',
    'Root Cause',
    'Root Cause Categories (5M/4M1E)',
    'Corrective Action (CAPA)',
    'Preventive Action',
    'Assigned To',
    'Target Closure Date',
    'Closed Date',
    'Closed By'
  ];

  const rows = records.map((r) => [
    r.id,
    r.coilNo,
    r.profile,
    r.inspectionDate,
    r.inspector,
    r.process,
    extractOnlyOutOfSpecPoints(r.inspectionResult).join(' | '),
    r.status,
    r.severity,
    r.sourceModuleCode,
    r.defectCount ?? 1,
    r.immediateAction || '',
    r.rootCause || '',
    (r.rootCauseCategories || []).join('; '),
    r.correctiveAction || '',
    r.preventiveAction || '',
    r.assignedTo || '',
    r.targetClosureDate || '',
    r.closedAt || '',
    r.closedBy || ''
  ]);

  const csvContent =
    '\uFEFF' +
    headers.map((h) => `"${h}"`).join(',') +
    '\n' +
    rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `NCR_Non_Conformance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}
