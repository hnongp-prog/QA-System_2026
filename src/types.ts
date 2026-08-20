export type QACategory = 
  | 'ALL'
  | 'IQC'        // Incoming Quality Control
  | 'IPQC'       // In-Process Quality Control
  | 'OQC'        // Outgoing Quality Control
  | 'EQUIPMENT'  // Metrology & Calibration
  | 'NCR'        // Non-Conformance Report & CAPA
  | 'ANALYTICS'  // QA Dashboard & Reports
  | 'CERTIFICATE_COI' // Certificate of Inspection (Certificate_COI)
  | 'CUSTOM';

export type ModuleStatus = 'ACTIVE' | 'READY_FOR_DEV' | 'IN_DEVELOPMENT' | 'PLANNED';

export interface ModuleMetric {
  labelTh: string;
  labelEn: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

export interface ModuleSpecs {
  targetUsersTh: string;
  targetUsersEn: string;
  checklistItemsCount: number;
  estimatedTimeMin: number;
  outputReportTypeTh: string;
  outputReportTypeEn: string;
  keyFeaturesTh: string[];
  keyFeaturesEn: string[];
}

export interface QAModule {
  id: string;
  code: string;
  titleTh: string;
  titleEn: string;
  descriptionTh: string;
  descriptionEn: string;
  category: QACategory;
  iconName: string;
  status: ModuleStatus;
  pinned: boolean;
  isPopular?: boolean;
  version: string;
  badgeCount?: number;
  badgeType?: 'warning' | 'info' | 'danger' | 'success';
  metrics: ModuleMetric[];
  specs: ModuleSpecs;
}

export type UserRole = 'INSPECTOR' | 'QA_ENGINEER' | 'QA_MANAGER' | 'AUDITOR';

export interface UserProfile {
  name: string;
  role: UserRole;
  employeeId: string;
  department: string;
  avatarUrl?: string;
}

export interface ShiftInfo {
  shiftName: string;
  lineCode: string;
  factoryPlant: string;
}

export interface SystemMetrics {
  totalInspectionsToday: number;
  passRatePercent: number;
  activeDefects: number;
  pendingNCRs: number;
  calibratedToolsPercent: number;
}

export interface InspectionActivity {
  id: string;
  timestamp: string;
  moduleCode: string;
  moduleTitleTh: string;
  moduleTitleEn: string;
  inspector: string;
  batchLot: string;
  result: 'PASS' | 'FAIL' | 'PENDING' | 'REJECT';
  defectCount?: number;
  remarks?: string;
  coilNo?: string;
  profile?: string;
  process?: string;
  inspectionDate?: string;
  inspectionResult?: string;
  defectReason?: string;
}

// NCR-01 Non-Conformance Report & CAPA Types
export type NcrStatus = 
  | 'OPEN' 
  | 'QUARANTINE' 
  | 'UNDER_INVESTIGATION' 
  | 'CAPA_IN_PROGRESS' 
  | 'REWORK' 
  | 'SCRAP' 
  | 'CONCESSION' 
  | 'CLOSED';

export type NcrSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface NcrRecord {
  id: string;                    // e.g. "NCR-2026-001"
  docId?: string;
  coilNo: string;                // Coil no. / Lot / Batch / Heat No.
  profile: string;               // Profile Name / Part No. / Spec
  inspectionDate: string;        // Inspection Date & Time
  inspector: string;             // Inspector name
  process: string;               // Process station / Module
  inspectionResult: string;      // Out of spec / NG defect details
  status: NcrStatus;             // Quarantine / Open / CAPA / Closed
  severity: NcrSeverity;         // Critical / Major / Minor
  sourceModuleCode: string;      // e.g. "IPQC-07", "IQC-01", "IPQC-01", "OQC-01", etc.
  defectCount?: number;
  rootCause?: string;            // 5-Why / Fishbone Cause
  immediateAction?: string;      // Containment / Hold Action
  correctiveAction?: string;     // Corrective Action (CAPA)
  preventiveAction?: string;     // Preventive Action
  assignedTo?: string;           // Responsible Engineer
  targetClosureDate?: string;    // Target closure date
  closedAt?: string;             // Actual closure date
  closedBy?: string;             // Approver
  notes?: string;
  createdAt: string;             // ISO String
}

export type Language = 'th' | 'en';

// Billet Incoming Inspection App Types
export type ChemElementKey = 'Si' | 'Fe' | 'Cu' | 'Mn' | 'Mg' | 'Cr' | 'Zn' | 'Ti' | 'Pb' | 'Cd' | 'Al';

export interface ElementMinMax {
  min: number;
  max: number;
}

export type ChemComposition = {
  [key in ChemElementKey]?: string | number;
};

export interface GradeSpec {
  color: string;
  elements: {
    [key in ChemElementKey]?: ElementMinMax;
  };
}

export interface GradeSpecMap {
  [gradeName: string]: GradeSpec;
}

export interface BilletInspectionItem {
  id?: string;
  heat_number: string;
  billet_size: string;
  grade: string;
  supplier_name: string;
  inspector_name: string;
  batch_no: string;
  invoice_no: string;
  diameter: string;
  length: string;
  bending: string;
  appearance: string;
  xrf: string;
  quantity_pcs: string | number;
  weight_kg: string | number;
  cutting_surface_lt2: boolean;
  billet_slid_lt25: boolean;
  defect_2x50x100: boolean;
  chemical_composition: ChemComposition;
  judgement?: 'PASS' | 'FAIL' | 'NO SPEC';
  timestamp?: string;
  createdAt?: number;
  _month?: string;
  _year?: string;
}

// Chemical Incoming Inspection App Types (IQC-02)
export interface ChemicalSpecItem {
  item: string;
  min: string | number;
  max: string | number;
}

export interface ChemicalSpecMap {
  [chemicalName: string]: ChemicalSpecItem[];
}

export interface ChemicalMeasureItem {
  description: string;
  total: string | number;
  status?: 'PASS' | 'FAIL' | '-';
}

export interface ChemicalInspectionHeader {
  inspector_name: string;
  coating_chemical: string;
  batch_lot: string;
  product_date: string;
  expiration_date: string;
  weight_kg: string | number;
  qty_pcs: string | number;
  packaging_situation: string;
  supplier: string;
}

export interface ChemicalInspectionEntry {
  id: string;
  timestamp: string;
  inspector: string;
  batch_lot: string;
  chemical: string;
  date: string;
  expiration: string;
  weight: string;
  qty: string;
  packaging: string;
  supplier: string;
  items: {
    description: string;
    value: string;
    status: string;
  }[];
  result: 'PASS' | 'FAIL';
  createdAt?: number;
}

// Tensile Measurement App Types (IPQC-01)
export interface TensileQualitySpec {
  id: string;
  profile: string;
  process: string;
  min_w: number;
  max_w: number;
  min_h: number;
  max_h: number;
  tensile: number;
  yield: number;
  elong: number;
}

export interface TensileRecord {
  id: string;
  coil_no: string;
  heat_no: string;
  profile: string;
  process: string;
  machine: string;
  inspector: string;
  sample_name: string;
  width: number;
  h_left: number;
  h_right: number;
  tensile: number;
  yield: number;
  elong: number;
  std?: TensileQualitySpec;
  decision: 'PASS' | 'FAIL';
  timestamp_raw: string;
  timestamp: string;
}

// Roughness Measurement App Types (IPQC-02)
export interface RoughnessProfileSpec {
  name: string;
  raUp: string;
  raLo: string;
  rzUp: string;
  rzLo: string;
  rzCalUp: string;
  rzCalLo: string;
  rtUp: string;
  rtLo: string;
  ryUp: string;
  ryLo: string;
}

export interface RoughnessInspectionRecord {
  id?: string;
  lotNumber: string;
  partId: string;
  process: string;
  raUp: string[];
  raLo: string[];
  rzUp: string[];
  rzLo: string[];
  rtUp: string[];
  rtLo: string[];
  ryUp: string[];
  ryLo: string[];
  raMax: string;
  rzMax: string;
  rtMax: string;
  ryMax: string;
  calculatedRzCal: string;
  status: 'Pass' | 'Fail' | 'Pending';
  remarks?: string;
  profileName: string;
  inspectorName: string;
  machineName: string;
  date: string;
  timestamp: string;
}

// X-Ray Measurement App Types (IPQC-03)
export interface XRayProfileSpec {
  id?: string;
  name: string;
  raUp: string; // Zn weight Min Up
  raLo: string; // Zn weight Min Lo
  rzUp: string; // Zn weight Max Up
  rzLo: string; // Zn weight Max Lo
  fluxMinUp: string;
  fluxMinLo: string;
  fluxMaxUp: string;
  fluxMaxLo: string;
  coverageLimitUp: string;
  coverageLimitLo: string;
}

export interface XRayInspectionRecord {
  id?: string;
  partId: string; // Side
  lotNumber: string; // Coil No.
  process: string;
  raUp: string; // Zn weight Up
  raLo: string; // Zn weight Lo
  rzUp: string; // Flux weight Up
  rzLo: string; // Flux weight Lo
  rtUp: string; // Coverage Up
  rtLo: string; // Coverage Lo
  status: 'Pass' | 'Fail' | 'Pending';
  remarks?: string;
  profileName: string;
  inspectorName: string;
  machine?: string;
  date: string;
  timestamp: string;
  timestamp_raw?: string;
}

// Coating Measurement App Types (IPQC-04)
export interface CoatingProfileSpec {
  id?: string;
  name: string;
  widthMin: string;
  widthMax: string;
  heightMin: string;
  heightMax: string;
  binderMin: string;
  binderMax: string;
  amtBinderMin: string;
  amtBinderMax: string;
  coatingWtMinUp: string;
  coatingWtMaxUp: string;
  pencilHardnessUp: string;
  coatingWtMinLo: string;
  coatingWtMaxLo: string;
  pencilHardnessLo: string;
  stdLength: string;
  stdCoatingWidth: string;
}

export interface CoatingInspectionRecord {
  id?: string;
  lotNumber: string; // Coil No.
  partId: string; // Side
  mixingLot?: string;
  width?: string;
  heightLeft?: string;
  heightRight?: string;
  length?: string;
  coatingWidth?: string;
  coatingArea?: string; // (coatingWidth * length) / 1000000
  totalWeight?: string;
  weightAfterDryer?: string;
  wtWithoutCoatUp?: string;
  wtWithoutCoatLo?: string;
  binderWt?: string; // totalWeight - weightAfterDryer
  totalCoatBinderWt?: string; // totalWeight - min(wtWithoutCoatUp, wtWithoutCoatLo)
  raUp?: string; // Coating Wt Up
  raLo?: string; // Coating Wt Lo
  binderPercent?: string; // (binderWt / totalCoatBinderWt) * 100
  amountOfBinder?: string; // binderWt / (coatingArea / 2)
  rtUp?: string; // Hardness Up
  rtLo?: string; // Hardness Lo
  status: 'Pass' | 'Fail' | 'Pending';
  remarks?: string;
  profileName: string;
  inspectorName: string;
  machine?: string;
  date: string;
  timestamp: string;
}

// Cutting Dimension Measurement App Types (IPQC-05)
export interface CuttingProfileSpec {
  id?: string;
  name: string;
  partNo?: string;
  widthTarget: string;
  widthTolPlus: string;
  widthTolMinus: string;
  heightTarget: string;
  heightTolPlus: string;
  heightTolMinus: string;
  lengthTarget: string;
  lengthTolPlus: string;
  lengthTolMinus: string;
  bendingMax: string;
  camberMax: string;
  twistMax: string;
}

export interface CuttingInspectionRecord {
  id?: string;
  lotNumber: string; // Coil No. / Work Order
  partId: string; // Part No / Sample Name
  sampleName?: string;
  workOrder?: string;
  width?: string;
  heightLeft?: string;
  heightRight?: string;
  length?: string;
  bending?: string;
  camber?: string;
  twist?: string;
  status: 'Pass' | 'Fail' | 'Pending';
  remarks?: string;
  profileName: string;
  inspectorName: string;
  employeeName?: string;
  machine?: string;
  date: string;
  timestamp: string;
}

// Mixing Inspection App Types (IPQC-06)
export interface MixingCoatingSpec {
  id?: string;
  name: string; // Coating Type Name
  binderSpec?: string;
  solidSpec?: string;
  grindoSpec?: string;
  viscoSpec?: string;
}

export interface MixingInspectionRecord {
  id?: string;
  inspectorName: string;
  mixingLot?: string;
  coatingType: string;
  lotNumber: string; // Cup No. / Lot No.
  cupWeight?: string;
  coatingWeight?: string;
  cupCoatingWeight?: string;
  wtAfterDry105?: string;
  wtAfterDry430?: string;
  weightOfBinder?: string;
  totalCoatingWeight?: string;
  binderPercent?: string;
  solidParticlePercent?: string;
  grindometer?: string;
  viscosity?: string;
  judgment: 'PASS' | 'FAIL' | 'PENDING';
  remarks?: string;
  date?: string;
  timestamp: string;
}

// Zn Wire Incoming Types (IQC-03)
export interface ZnWireElementLimit {
  min: number;
  max: number;
}

export interface ZnWireGradeSpec {
  [elementOrProp: string]: ZnWireElementLimit;
}

export interface ZnWireGradeSpecMap {
  [gradeName: string]: ZnWireGradeSpec;
}

export interface ZnWireInspectionRecord {
  id?: string;
  heat_number: string;
  grade: string;
  supplier?: string;
  inspector_name?: string;
  drum?: string;
  batch_no?: string;
  po_no?: string;
  diameter?: string;
  appearance?: string;
  quantity_pcs?: string;
  weight_kg?: string;
  tensile_strength?: string;
  elongation?: string;
  chemical_composition?: Record<string, string>;
  judgement?: 'PASS' | 'FAIL' | 'NO SPEC' | 'PENDING';
  timestamp?: string;
  timestamp_raw?: string;
  date?: string;
  user_id?: string;
  _month?: string;
  _year?: string;
}

export interface InstrumentCalHistoryItem {
  id?: string;
  type: 'CALIBRATION' | 'REPAIR_START' | 'REPAIR_END';
  date: string;
  sendDate?: string;
  receiveDate?: string;
  error?: number;
  result?: 'PASS' | 'FAIL' | 'NEW' | 'PENDING';
  lab?: string;
  certNo?: string;
  uncertainty?: number;
  officer?: string;
  note?: string;
  symptom?: string;
  detail?: string;
  repairBy?: string;
  cost?: number;
}

export interface InstrumentRepairLog {
  type: 'REPAIR_START';
  startDate: string;
  expectedEndDate: string;
  symptom: string;
  detail?: string;
  repairBy: string;
  cost?: number;
  date: string;
}

export interface InstrumentRecord {
  docId?: string;
  id: string; // Tool ID e.g. CAL-001
  name: string; // Name e.g. Vernier Caliper 0-150mm
  brand?: string;
  model?: string;
  serialNo?: string;
  location?: string;
  range?: string;
  spec: number; // Permission Error e.g. 0.02
  entryDate?: string;
  startDate?: string;
  lastCalDate?: string;
  frequency: number; // Months e.g. 12
  lastResult?: 'PASS' | 'FAIL' | 'NEW' | 'PENDING';
  lastError?: number;
  isRepairing?: boolean;
  currentRepair?: InstrumentRepairLog | null;
  history?: InstrumentCalHistoryItem[];
  category?: string;
}

export interface FgCoilItem {
  no: string;
  qty: number;
  coatingDate?: string;
  expireDate?: string;
}

export interface FgPreShipmentRecord {
  id?: string;
  docId?: string;
  timestamp?: string;
  timestampRaw?: string;
  inspectorName: string;
  destinationTo: string;
  profileName?: string;
  partNo: string;
  drawing?: string;
  colorTag?: string;
  boxNo: string;
  description?: string;
  dimW?: string;
  dimH?: string;
  dimL?: string;
  result: 'ถูกต้อง' | 'ไม่ถูกต้อง' | 'MATCH' | 'MISMATCH';
  reason?: string;
  coils: FgCoilItem[];
  refImage?: string;
  testImage?: string;
}

export interface FgProfileSpec {
  id?: string;
  profileName: string;
  partNo: string;
  drawing: string;
  destinationTo: string;
  description: string;
  dimW: string;
  dimH: string;
  dimL: string;
}

export interface WallMeasurementValRange {
  min: number | string;
  max: number | string;
}

export interface ThicknessWallRecordValues {
  t1: WallMeasurementValRange;
  t2: WallMeasurementValRange;
  t3: number | string;
  t4: number | string;
  t5_list: string[];
  or: WallMeasurementValRange;
  ir: WallMeasurementValRange;
  ihr: WallMeasurementValRange;
  ohw: WallMeasurementValRange;
  ihw: WallMeasurementValRange;
  ra: WallMeasurementValRange;
  ior: WallMeasurementValRange;
}

export interface ThicknessWallRecord {
  id?: string;
  docId?: string;
  timestamp: string;
  timestampRaw?: string;
  inspector: string;
  process: string;
  coil: string;
  sample: string;
  profile: string;
  vals: ThicknessWallRecordValues;
  overallStatus: 'PASS' | 'FAIL';
}

export interface ThicknessWallProfileItemSpec {
  item: string;
  min: number | string;
  max: number | string;
}

export interface ThicknessWallProfileSpec {
  id?: string;
  name: string;
  items: ThicknessWallProfileItemSpec[];
  updatedAt?: string;
}

// FG Shipment Inspection Tag (OQC-02) Types
export interface FgOqc02MasterSpec {
  id?: string;
  specCode: string; // e.g. SPEC-OQC02-01
  profileName: string; // e.g. PROFILE-A
  partNo: string; // e.g. P-8801-TK
  drawingNo: string; // e.g. DWG-2026-0881
  destinationTo: string; // e.g. TOKYO / JAPAN
  colorTag: string; // e.g. Green Tag
  boxPattern: string; // e.g. BOX-2026-XXX
  dimW: string; // e.g. 120.5 mm
  dimH: string; // e.g. 45.0 mm
  dimL: string; // e.g. 2500 mm
  mandatoryKeywords: string[]; // e.g. ["MADE IN THAILAND", "Q.C. APPROVED", "FG PASSED", "RECYCLABLE AL"]
  refImage?: string;
  description: string;
}

export interface FgOqc02InspectionRecord {
  id?: string;
  docId?: string;
  timestamp: string;
  timestampRaw?: string;
  inspectorName: string;
  partNo: string;
  partName: string;
  drawingNo: string;
  destinationTo: string;
  boxNo: string;
  colorTag: string;
  dimW: string;
  dimH: string;
  dimL: string;
  quantityPcs: string;
  productionDate: string;
  barcodeQrCode: string;
  mandatoryTextFound: string[];
  mandatoryTextMissing: string[];
  matchScore: number;
  judgement: 'PASS' | 'FAIL' | 'WARNING';
  reasonsThai: string;
  tagImage?: string;
  matchedMasterSpecCode?: string;
}




