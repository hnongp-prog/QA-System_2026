import { NcrRecord, NcrSeverity, NcrStatus } from '../types';

export const INITIAL_NCR_RECORDS: NcrRecord[] = [
  {
    id: 'NCR-2026-001',
    docId: 'ncr-doc-001',
    coilNo: 'COIL-8802-B',
    profile: 'Profile B-002 (Al Extrusion)',
    inspectionDate: '2026-08-16 10:15',
    inspector: 'Somchai P. (IPQC)',
    process: 'IPQC-07 Thickness Wall Measurement (Line B - Extrusion #2)',
    inspectionResult: 'FAIL / Out of Spec: T1 max (3.70 mm > Spec 3.60 mm), T2 min (2.70 mm < Spec 2.80 mm), OR max (16.80 mm > Spec 16.50 mm)',
    status: 'QUARANTINE',
    severity: 'MAJOR',
    sourceModuleCode: 'IPQC-07',
    defectCount: 3,
    immediateAction: 'Hold and quarantine Coil #COIL-8802-B at Quarantine Bay Q-2. Red Tag applied.',
    rootCause: 'Extrusion die wear at mandrel tip #2 after 1,450 extrusion runs without calibration.',
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
    inspector: 'Kittisak N. (IPQC)',
    process: 'IPQC-01 Tensile Measurement (Tensile Machine M02)',
    inspectionResult: 'FAIL / Out of Spec: Tensile strength 382 MPa < Min 400 MPa, Elongation 17.5% < Min 20.0%',
    status: 'UNDER_INVESTIGATION',
    severity: 'CRITICAL',
    sourceModuleCode: 'IPQC-01',
    defectCount: 2,
    immediateAction: 'Stop slitting line batch. Tag 5 slit coils from Mother Coil B201 under quarantine.',
    rootCause: 'Annealing temperature in furnace zone #3 dropped by 35°C during midnight shift cycle.',
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
    inspector: 'Anan K. (IQC Inspector)',
    process: 'IQC-01 Billet Incoming (Chemical & Visual Inspection)',
    inspectionResult: 'FAIL / Out of Spec: Chemical composition Si = 0.65% (Spec Max: 0.60%), Fe = 0.38% (Spec Max: 0.35%)',
    status: 'CAPA_IN_PROGRESS',
    severity: 'CRITICAL',
    sourceModuleCode: 'IQC-01',
    defectCount: 2,
    immediateAction: 'Rejected incoming shipment of 18 tons. Placed in IQC Quarantine Area.',
    rootCause: 'Supplier scrap sorting error at foundry during melting furnace charge.',
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
    inspector: 'Prasert L. (IQC)',
    process: 'IQC-03 Zn Wire Incoming Inspection (Spool Weight & Diameter)',
    inspectionResult: 'FAIL / Out of Spec: Wire diameter 1.88 mm (Spec Min: 1.95 mm), Spool net weight 13.8 kg < 15.0 kg',
    status: 'REWORK',
    severity: 'MAJOR',
    sourceModuleCode: 'IQC-03',
    defectCount: 2,
    immediateAction: 'Tag 20 spools with Yellow Hold Tag. Do not feed to zinc spraying arc booth.',
    rootCause: 'Supplier drawing die undersized during final coil winding.',
    correctiveAction: 'Supplier replacement spools shipped on express freight.',
    preventiveAction: '100% digital caliper check at incoming receiving gate.',
    assignedTo: 'Prasert L. (IQC Lead)',
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
    inspector: 'Thanya K. (OQC Officer)',
    process: 'OQC-01 FG Pre-Shipment Tag & Packaging Verification',
    inspectionResult: 'FAIL / Out of Spec: Tag Drawing No. mismatch (Tag says DWG-2026-0881, Master Spec requires DWG-2026-0882-REV3)',
    status: 'CLOSED',
    severity: 'MINOR',
    sourceModuleCode: 'OQC-01',
    defectCount: 1,
    immediateAction: 'Re-print corrected barcode label and re-attach to packaging box.',
    rootCause: 'Operator used legacy template file from old revision folder.',
    correctiveAction: 'Deleted old template files from packaging workstation printer queue.',
    preventiveAction: 'Locked label printing software to pull drawing revisions strictly from ERP database.',
    assignedTo: 'Thanya K. (OQC Lead)',
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
 * Save NCR records to localStorage
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
    r.inspectionResult,
    r.status,
    r.severity,
    r.sourceModuleCode,
    r.defectCount ?? 1,
    r.immediateAction || '',
    r.rootCause || '',
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
