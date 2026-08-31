import { QAModule, InspectionActivity, SystemMetrics, UserProfile, ShiftInfo } from '../types';

export const INITIAL_MODULES: QAModule[] = [
  {
    id: 'mod-iqa-01',
    code: 'IQA-01',
    titleTh: 'ตรวจรับวัตถุดิบ Billet (Billet Incoming Inspection)',
    titleEn: 'Billet Incoming Inspection',
    descriptionTh: 'สแกนใบรับรอง Mill Test Cert, สกัดค่าส่วนผสมเคมี (Si, Fe, Cu, Mg ฯลฯ), ตรวจสอบเกณฑ์มาตรฐานเกรด และพิมพ์ QR Label',
    descriptionEn: 'Scan Mill Test Certs, AI extract chemical compositions, match grade specs (PASS/FAIL), and print QR tags.',
    category: 'IQA',
    iconName: 'PackageCheck',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 4,
    badgeType: 'warning',
    metrics: [
      { labelTh: 'ลอตตรวจวันนี้', labelEn: 'Lots Today', value: '18 Lots', trend: '+12%', trendUp: true },
      { labelTh: 'อัตราผ่าน (AQL)', labelEn: 'AQL Pass Rate', value: '98.5%', trend: '+0.5%', trendUp: true },
    ],
    specs: {
      targetUsersTh: 'วิศวกร IQA, เจ้าหน้าที่ตรวจรับวัตถุดิบ',
      targetUsersEn: 'IQA Inspector, Material Control Officer',
      checklistItemsCount: 15,
      estimatedTimeMin: 10,
      outputReportTypeTh: 'IQA Lot Acceptance Certificate (PDF)',
      outputReportTypeEn: 'IQA Lot Acceptance Certificate (PDF)',
      keyFeaturesTh: [
        'ระบบสุ่มตัวอย่างตามมาตรฐาน MIL-STD-105E / ISO 2859-1',
        'การสแกน QR Code/Barcode ลอตวัตถุดิบและเทียบ COA',
        'บันทึกภาพถ่ายจุดที่ไม่ผ่านเกณฑ์ (Defect Photo Capture)',
        'พิมพ์สติ๊กเกอร์สถานะ PASSED / REJECTED'
      ],
      keyFeaturesEn: [
        'MIL-STD-105E / ISO 2859-1 AQL Sampling Table Integrator',
        'Raw Material QR/Barcode Scanning & COA Matching',
        'Defect Photo Capture & Defect Code Classification',
        'Instant Approved/Rejected Lot Tag Label Printing'
      ]
    }
  },
  {
    id: 'mod-iqa-02',
    code: 'IQA-02',
    titleTh: 'ตรวจรับเคมีเคลือบผิว (Chemical Incoming Inspection)',
    titleEn: 'Chemical Incoming Inspection & COA AI OCR',
    descriptionTh: 'สกัดข้อมูลรายงาน COA จาก PDF/ภาพถ่าย ด้วย AI Gemini-2.5-Flash, ตรวจสอบเกณฑ์ Spec สารเคมีเคลือบผิว และบันทึกประวัติการตรวจรับ',
    descriptionEn: 'AI-powered COA extraction, chemical property spec verification, and Cloud history inspection tracking.',
    category: 'IQA',
    iconName: 'FlaskConical',
    status: 'ACTIVE',
    pinned: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 2,
    badgeType: 'info',
    metrics: [
      { labelTh: 'ลอตเคมีตรวจวันนี้', labelEn: 'Chemical Lots Today', value: '8 Lots', trend: '+100%', trendUp: true },
      { labelTh: 'อัตราผ่าน (Spec Pass)', labelEn: 'Spec Pass Rate', value: '100%', trend: '0%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'เจ้าหน้าที่ QC Chemist, เจ้าหน้าที่ IQA ตรวจรับวัตถุดิบเคมี',
      targetUsersEn: 'QA Chemist, IQA Chemical Incoming Officer',
      checklistItemsCount: 12,
      estimatedTimeMin: 5,
      outputReportTypeTh: 'รายงานผลการตรวจรับเคมีเคลือบผิว (Chemical Incoming COA Cert)',
      outputReportTypeEn: 'Chemical Incoming Inspection Report (PDF/CSV)',
      keyFeaturesTh: [
        'สกัดข้อมูล Header & ตารางผลการทดสอบเคมีด้วย AI Gemini 2.5 Flash',
        'การตรวจสอบเกณฑ์มาตรฐาน Min/Max Spec อัตโนมัติสำหรับสารเคมีแต่ละชนิด',
        'ระบบตั้งค่า Coating Chemical Spec พร้อมระบบรหัสผ่านผู้ดูแลระบบ (Admin Password)',
        'บันทึกประวัติการตรวจรับและส่งออกไฟล์ CSV สรุปผล'
      ],
      keyFeaturesEn: [
        'AI Gemini 2.5 Flash COA Header & Table Extraction',
        'Automated Min/Max Spec Validation for Coating Chemicals',
        'Admin-protected Chemical Spec Setting Manager',
        'Inspection History Tracking & CSV Export'
      ]
    }
  },
  {
    id: 'mod-iqa-03',
    code: 'IQA-03',
    titleTh: 'ตรวจรับลวดสังกะสี (Zn Wire Incoming Inspection)',
    titleEn: 'Zn Wire Incoming Inspection & COA OCR System',
    descriptionTh: 'สแกนรายงาน Mill Test Cert ลวดสังกะสี (Zn Wire), สกัดข้อมูลส่วนผสมเคมี (Pb, Fe, Cd, Sn, Cu, Zn) และสมบัติเชิงกล (Tensile, Elongation) ด้วย AI, ประเมินผลผ่าน/ไม่ผ่าน อัตโนมัติ พร้อมพิมพ์ QR Identification Tag',
    descriptionEn: 'AI OCR Mill Test Certificate scanner for Zinc Wire, chemical & mechanical property spec verification, pass/fail judgment & QR identification tag printing.',
    category: 'IQA',
    iconName: 'Zap',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 3,
    badgeType: 'info',
    metrics: [
      { labelTh: 'ลอตลวดสังกะสีตรวจวันนี้', labelEn: 'Zn Wire Lots Today', value: '14 Lots', trend: '+25%', trendUp: true },
      { labelTh: 'อัตราผ่าน (Pass Rate)', labelEn: 'Pass Rate', value: '99.2%', trend: '+0.5%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'เจ้าหน้าที่ IQA ตรวจรับวัตถุดิบ, วิศวกรควบคุมคุณภาพ (QA/QC Engineer)',
      targetUsersEn: 'IQA Material Inspector, QA/QC Engineer',
      checklistItemsCount: 16,
      estimatedTimeMin: 4,
      outputReportTypeTh: 'รายงานผลการตรวจรับลวดสังกะสี (Zn Wire Inspection Report & Tag)',
      outputReportTypeEn: 'Zn Wire Cloud Inspection Report & QR Tag (CSV/Print)',
      keyFeaturesTh: [
        'สกัดข้อมูล Heat Number, Grade, ส่วนผสมเคมี และสมบัติเชิงกลด้วย AI Gemini-2.5-Flash',
        'ตรวจสอบผลการผ่านเกณฑ์ (PASS / FAIL) เทียบกับ Grade Spec (Pb, Fe, Cd, Sn, Cu, Zn, Tensile, Elongation)',
        'พิมพ์ QR Code Identification Tag สำหรับติด Drum / ลอตลวดสังกะสี',
        'ระบบบริหารจัดการ Grade Spec สำหรับ Admin ป้องกันด้วยรหัสผ่าน (Admin Password)',
        'ส่งออกข้อมูลรายงานสรุปผล CSV/Excel พร้อมระบบค้นหาย้อนหลัง'
      ],
      keyFeaturesEn: [
        'AI Gemini-2.5-Flash extraction for Heat No, Grade, Chemical & Mechanical properties',
        'Automatic PASS/FAIL evaluation against loaded Grade Specs (Pb, Fe, Cd, Sn, Cu, Zn, Tensile, Elongation)',
        'Print QR Code Identification Tags for Drum / Zn Wire Lots',
        'Admin password-protected Grade Spec Manager (Admin Password Protected)',
        'CSV/Excel report export with search & filter capabilities'
      ]
    }
  },
  {
    id: 'mod-ipqa-01',
    code: 'IPQA-01',
    titleTh: 'การทดสอบแรงดึง (Tensile Measurement)',
    titleEn: 'Tensile Measurement & Quality Spec System',
    descriptionTh: 'บันทึกค่าแรงดึง (Tensile, Yield, Elongation), ตรวจสอบเกณฑ์มาตรฐาน Dimension & Spec อัตโนมัติ, กราฟแนวโน้ม Trend Dashboard และตั้งค่า Spec ควบคุมผ่าน Admin',
    descriptionEn: 'Tensile strength, yield strength, elongation measurement & dimension verification with trend charts and admin-protected quality spec manager.',
    category: 'IPQA',
    iconName: 'Activity',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 3,
    badgeType: 'info',
    metrics: [
      { labelTh: 'ลอตทดสอบวันนี้', labelEn: 'Tested Lots Today', value: '15 Samples', trend: '+12%', trendUp: true },
      { labelTh: 'อัตราผ่านเกณฑ์ (Pass Rate)', labelEn: 'Pass Rate', value: '96.5%', trend: '+1.5%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'เจ้าหน้าที่ IPQA, วิศวกรควบคุมคุณภาพ (Quality Engineer)',
      targetUsersEn: 'IPQA Auditor, Quality Engineer, Lab Tech',
      checklistItemsCount: 15,
      estimatedTimeMin: 5,
      outputReportTypeTh: 'รายงานการทดสอบแรงดึงประจำกะ (Tensile & Yield Test Report)',
      outputReportTypeEn: 'Tensile & Yield Strength Test Report (Excel/CSV)',
      keyFeaturesTh: [
        'บันทึกค่าขนาดชิ้นงาน (W/HL/HR) และค่าแรงดึง (Tensile, Yield, Elongation)',
        'คำนวณผลผ่านเกณฑ์ (PASS / FAIL) อัตโนมัติเปรียบเทียบตาม Profile & Process Spec',
        'กราฟแสดงแนวโน้ม Tensile, Yield และ Elongation แบบ Interactive Dashboard',
        'ระบบบริหารจัดการ Profile & Spec มาตรฐานพร้อมรหัสผ่านผู้ดูแลระบบ (Admin Security)'
      ],
      keyFeaturesEn: [
        'Dimension (W/HL/HR) & Tensile/Yield/Elongation test data entry',
        'Automated PASS/FAIL judgment against loaded Profile & Process Specs',
        'Interactive Trend Charts for Tensile, Yield, and Elongation',
        'Admin password-protected Quality Spec configuration manager'
      ]
    }
  },
  {
    id: 'mod-ipqa-02',
    code: 'IPQA-02',
    titleTh: 'การตรวจวัดความเรียบผิว (Roughness Measurement)',
    titleEn: 'Surface Roughness Measurement System (Ra/Rz/Rt/Ry)',
    descriptionTh: 'บันทึกค่าความเรียบผิว (Ra, Rz, Rt, Ry) หลายจุดทั้งขอบบน-ขอบล่าง, คำนวณ Rz Cal (3-Sigma) อัตโนมัติ, พร้อมกราฟ Sparkline Trend และตั้งค่า Profile Spec (Admin Security)',
    descriptionEn: 'Surface roughness (Ra, Rz, Rt, Ry) measurement for upper & lower surfaces, auto 3-Sigma Rz Cal, sparkline trend analysis & admin spec manager.',
    category: 'IPQA',
    iconName: 'Activity',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 2,
    badgeType: 'info',
    metrics: [
      { labelTh: 'ชิ้นงานวัดความเรียบผิววันนี้', labelEn: 'Inspected Lots Today', value: '28 Lots', trend: '+15%', trendUp: true },
      { labelTh: 'อัตราผ่านเกณฑ์ (Pass Rate)', labelEn: 'Pass Rate', value: '98.2%', trend: '+0.5%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'เจ้าหน้าที่ IPQA, วิศวกรตรวจสอบคุณภาพ (QA/QC Engineer)',
      targetUsersEn: 'IPQA Auditor, QA/QC Surface Metrology Tech',
      checklistItemsCount: 14,
      estimatedTimeMin: 4,
      outputReportTypeTh: 'รายงานผลการตรวจวัดความเรียบผิว (Surface Roughness Inspection Report)',
      outputReportTypeEn: 'Surface Roughness Cloud Inspection Report (CSV/Excel)',
      keyFeaturesTh: [
        'บันทึกค่าความเรียบผิว Ra, Rz, Rt, Ry ทั้งขอบบน (Up) และขอบล่าง (Lo) ได้หลายจุดพิกัด',
        'คำนวณสถิติและค่า Rz Cal (Average + 3*SD) ของกลุ่มลอตการผลิตอัจฉริยะ',
        'ตรวจสอบผลการผ่านเกณฑ์ (Pass / Fail) เปรียบเทียบขีดจำกัด Upper Limit อัตโนมัติ',
        'กราฟ Sparkline Trend วิเคราะห์แนวโน้มค่าความเรียบผิวแยกราย Profile และเดือน',
        'ระบบจัดการ Profile Spec สำหรับ Admin พร้อมรหัสผ่านป้องกัน'
      ],
      keyFeaturesEn: [
        'Multi-point surface roughness input (Ra, Rz, Rt, Ry) for Upper & Lower surfaces',
        'Automated batch statistics & 3-Sigma calculated Rz limit (Mean + 3*SD)',
        'Automatic PASS/FAIL evaluation against Profile Upper Spec limits',
        'Interactive Sparkline trend lines for Ra, Rz, Rt, and Ry parameters',
        'Admin password-protected Quality Spec manager'
      ]
    }
  },
  {
    id: 'mod-ipqa-03',
    code: 'IPQA-03',
    titleTh: 'การตรวจวัดด้วยรังสีเอกซ์ (X-Ray Measurement)',
    titleEn: 'X-Ray Coating Weight & Coverage Measurement System',
    descriptionTh: 'บันทึกและวิเคราะห์ค่าความหนาชั้นเคลือบสังกะสี (Zn weight), Flux weight, และ Coverage % ทั้งขอบบน (Up) และขอบล่าง (Lo), พร้อมประเมินผล Pass/Fail อัตโนมัติ, กราฟแนวโน้ม Sparkline, และตั้งค่า Profile Spec (Admin Security)',
    descriptionEn: 'X-ray measurement system for Zn coating weight, Flux weight & Coverage % (Up/Lo), automatic pass/fail judgment, sparkline trends & admin spec manager.',
    category: 'IPQA',
    iconName: 'Cpu',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 3,
    badgeType: 'info',
    metrics: [
      { labelTh: 'คอยล์วัดด้วย X-Ray วันนี้', labelEn: 'X-Ray Inspected Today', value: '42 Coils', trend: '+18%', trendUp: true },
      { labelTh: 'อัตราผ่านเกณฑ์ (Pass Rate)', labelEn: 'Pass Rate', value: '97.6%', trend: '+0.4%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'เจ้าหน้าที่ IPQA, ช่างเทคนิค X-Ray, วิศวกรควบคุมคุณภาพ (QA/QC Engineer)',
      targetUsersEn: 'IPQA Auditor, X-Ray Technician, QA/QC Engineer',
      checklistItemsCount: 16,
      estimatedTimeMin: 3,
      outputReportTypeTh: 'รายงานผลการตรวจวัด X-Ray (X-Ray Inspection Report)',
      outputReportTypeEn: 'X-Ray Cloud Inspection Report (CSV/Excel)',
      keyFeaturesTh: [
        'บันทึกค่า Zn weight, Flux weight และ Coverage % ทั้งขอบบน (Up) และขอบล่าง (Lo)',
        'ตรวจสอบค่าตาม Min/Max Specification Limits และประเมิน PASS/FAIL อัตโนมัติ',
        'กราฟ Sparkline Trend วิเคราะห์แนวโน้ม Zn, Flux และ Coverage แยกราย Profile',
        'ส่งออกรายงานรูปแบบ CSV/Excel พร้อมข้อมูลผู้ตรวจสอบและเครื่องจักร',
        'ระบบบริหารจัดการ Profile Spec สำหรับ Admin ป้องกันด้วยรหัสผ่าน'
      ],
      keyFeaturesEn: [
        'Record Zn weight, Flux weight & Coverage % for Upper and Lower surfaces',
        'Automatic PASS/FAIL judgment against loaded Min/Max Specification limits',
        'Interactive Sparkline trend lines for Zn, Flux, and Coverage parameters',
        'CSV/Excel report export with inspector and machine details',
        'Admin password-protected Quality Spec configuration manager'
      ]
    }
  },
  {
    id: 'mod-ipqa-04',
    code: 'IPQA-04',
    titleTh: 'การตรวจวัดการเคลือบผิว (Coating Measurement)',
    titleEn: 'Coating Weight, Area, Binder % & Hardness Measurement System',
    descriptionTh: 'บันทึกและคำนวณค่า Coating Width, Area, Total Wt, Dryer Wt, Binder Wt, Coating Weight Up/Lo, Binder %, Amount of Binder และ Hardness พร้อมประเมินผล Pass/Fail อัตโนมัติ, กราฟแนวโน้ม และตั้งค่า Profile Spec',
    descriptionEn: 'Coating thickness, binder weight, coating area, coating weight & hardness measurement system with automatic judgment & trend analysis.',
    category: 'IPQA',
    iconName: 'Layers',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 5,
    badgeType: 'info',
    metrics: [
      { labelTh: 'คอยล์วัด Coating วันนี้', labelEn: 'Coating Inspected Today', value: '38 Coils', trend: '+14%', trendUp: true },
      { labelTh: 'อัตราผ่านเกณฑ์ (Pass Rate)', labelEn: 'Pass Rate', value: '98.2%', trend: '+0.6%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'เจ้าหน้าที่ IPQA, ช่างเทคนิค Coating, วิศวกรควบคุมคุณภาพ (QA/QC Engineer)',
      targetUsersEn: 'IPQA Auditor, Coating Technician, QA/QC Engineer',
      checklistItemsCount: 18,
      estimatedTimeMin: 4,
      outputReportTypeTh: 'รายงานผลการตรวจวัด Coating (Coating Measurement Report)',
      outputReportTypeEn: 'Coating Cloud Inspection Report (CSV/Excel)',
      keyFeaturesTh: [
        'คำนวณค่า Coating Area, Binder Weight, Coating Weight Up/Lo, Binder % และ Amount of Binder อัตโนมัติ',
        'ตรวจสอบค่าตาม Min/Max Specification Limits และประเมิน PASS/FAIL อัตโนมัติ',
        'กราฟ Sparkline Trend วิเคราะห์แนวโน้ม Coating Weight, Binder % และ Amount of Binder',
        'ส่งออกรายงานรูปแบบ CSV/Excel พร้อมข้อมูล Mixing Lot, Inspector และ Machine',
        'ระบบบริหารจัดการ Profile Spec สำหรับ Admin ป้องกันด้วยรหัสผ่าน (Admin Password)'
      ],
      keyFeaturesEn: [
        'Automatic calculation of Coating Area, Binder Wt, Coating Wt Up/Lo, Binder % & Amount of Binder',
        'Automatic PASS/FAIL judgment against loaded Min/Max Specification limits',
        'Interactive Sparkline trend lines for Coating Weight, Binder %, and Amount of Binder',
        'CSV/Excel report export with Mixing Lot, Inspector, and Machine details',
        'Admin password-protected Quality Spec configuration manager'
      ]
    }
  },
  {
    id: 'mod-ipqa-05',
    code: 'IPQA-05',
    titleTh: 'การตรวจวัดขนาดจากการตัด (Cutting Dimension Measurement)',
    titleEn: 'Cutting Dimension & Tolerance Measurement System',
    descriptionTh: 'บันทึกและตรวจสอบมิติขนาดการตัด (Width, Height, Length, Bending, Camber, Twist) พร้อมเปรียบเทียบค่าพิกัดความคลาดเคลื่อน (Tolerance Limits) ประเมิน PASS/FAIL อัตโนมัติ, กราฟแนวโน้ม และระบบตั้งค่า Profile Spec (Admin Security)',
    descriptionEn: 'Cutting dimension inspection system for Width, Height, Length, Bending, Camber & Twist with automatic tolerance judgment, sparkline trend graphs & admin spec manager.',
    category: 'IPQA',
    iconName: 'Ruler',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 8,
    badgeType: 'info',
    metrics: [
      { labelTh: 'ชิ้นงานวัด Cutting วันนี้', labelEn: 'Cutting Samples Inspected Today', value: '52 Samples', trend: '+18%', trendUp: true },
      { labelTh: 'อัตราผ่านเกณฑ์ (Pass Rate)', labelEn: 'Pass Rate', value: '99.1%', trend: '+0.5%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'เจ้าหน้าที่ IPQA, ช่างตัดชิ้นงาน, วิศวกรควบคุมคุณภาพ (QA/QC Engineer)',
      targetUsersEn: 'IPQA Auditor, Cutting Operator, QA/QC Engineer',
      checklistItemsCount: 16,
      estimatedTimeMin: 3,
      outputReportTypeTh: 'รายงานผลการตรวจวัดขนาดจากการตัด (Cutting Dimension Report)',
      outputReportTypeEn: 'Cutting Inspection Cloud Report (CSV/Excel)',
      keyFeaturesTh: [
        'ตรวจวัดมิติขนาดการตัด Width, Height Left/Right, Length, Bending, Camber, Twist และจุดกำหนดพิเศษ',
        'ตรวจสอบค่าตาม Target Limits และ Tolerance Range ประเมิน PASS/FAIL อัตโนมัติ',
        'กราฟ Sparkline Trend วิเคราะห์แนวโน้มขนาดชิ้นงานและค่าเบี่ยงเบน',
        'ส่งออกรายงานรูปแบบ CSV/Excel พร้อมข้อมูล Work Order, Coil No, Inspector และ Machine',
        'ระบบบริหารจัดการ Profile Spec สำหรับ Admin ป้องกันด้วยรหัสผ่าน (Admin Password)'
      ],
      keyFeaturesEn: [
        'Cutting dimension measurement for Width, Height, Length, Bending, Camber, Twist & custom points',
        'Automatic PASS/FAIL judgment against loaded Target and Tolerance limits',
        'Interactive Sparkline trend lines for dimensional consistency and deviation analysis',
        'CSV/Excel report export with Work Order, Coil No, Inspector, and Machine details',
        'Admin password-protected Quality Spec configuration manager'
      ]
    }
  },
  {
    id: 'mod-ipqa-06',
    code: 'IPQA-06',
    titleTh: 'การตรวจวัดคุณภาพสารผสม (Mixing Inspection)',
    titleEn: 'Mixing Inspection System & Coating Spec Manager',
    descriptionTh: 'บันทึกและคำนวณข้อมูลการผสมสารเคลือบ (Cup Wt, Coating Wt, Dry 105/430, Binder %, Solid %, Grindometer, Viscosity) ประเมิน PASS/FAIL อัตโนมัติ พร้อม Admin Coating Spec Manager',
    descriptionEn: 'Mixing inspection system for Cup weight, Coating weight, Dry 105/430, Binder %, Solid %, Grindometer & Viscosity with automatic PASS/FAIL evaluation & Admin spec manager.',
    category: 'IPQA',
    iconName: 'Beaker',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 6,
    badgeType: 'info',
    metrics: [
      { labelTh: 'ถ้วยผสมที่ตรวจวันนี้', labelEn: 'Mixing Cups Inspected Today', value: '38 Cups', trend: '+12%', trendUp: true },
      { labelTh: 'อัตราผ่านเกณฑ์ (Pass Rate)', labelEn: 'Mixing Pass Rate', value: '98.5%', trend: '+0.3%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'เจ้าหน้าที่ IPQA, ช่างผสมสารเคลือบ (Mixing Operator), วิศวกรเคมี/ควบคุมคุณภาพ',
      targetUsersEn: 'IPQA Auditor, Mixing Operator, Chemical QA/QC Engineer',
      checklistItemsCount: 14,
      estimatedTimeMin: 4,
      outputReportTypeTh: 'รายงานผลการตรวจวัดสารผสม (Mixing Inspection Cloud Report)',
      outputReportTypeEn: 'Mixing Inspection Cloud Report (CSV/Excel)',
      keyFeaturesTh: [
        'คำนวณน้ำหนักสารเคลือบ Binder Wt, Total Coating Wt, Binder % และ Solid % อัตโนมัติ',
        'ตรวจสอบค่า Binder%, Solid%, Grindometer และ Viscosity เทียบกับ Coating Spec ประเมิน PASS/FAIL',
        'ระบบบริหารจัดการประเภทสารเคลือบและ Spec สำหรับ Admin ด้วยรหัสผ่าน (Admin Password)',
        'ส่งออกรายงานกลุ่มงาน CSV/Excel พร้อมข้อมูล Cup No, Mixing Lot, Inspector',
        'บันทึกประวัติการตรวจสอบ ค้นหาย้อนหลัง และทำงานบน Cloud Storage'
      ],
      keyFeaturesEn: [
        'Automatic calculation for Binder Wt, Total Coating Wt, Binder % & Solid %',
        'Real-time PASS/FAIL judgment against Coating Specs for Binder%, Solid%, Grindometer & Viscosity',
        'Admin password-protected Coating Type & Specification manager (Admin Password Protected)',
        'CSV/Excel report export with Cup No, Mixing Lot, Inspector and timestamp',
        'Cloud-synced historical inspection records & search filters'
      ]
    }
  },
  {
    id: 'mod-ipqa-07',
    code: 'IPQA-07',
    titleTh: 'วัดความหนาผนังชิ้นงาน (Thickness Wall Measurement)',
    titleEn: 'Thickness Wall Measurement System & Profile Spec Manager',
    descriptionTh: 'สกัดและวิเคราะห์ข้อมูลความหนาผนังชิ้นงานจากไฟล์ PDF/รูปถ่าย ด้วย AI (Gemini 2.5) ตรวจสอบค่า T1-T5, OR, IR, IHR, OHW, IHW, RA, IOR เทียบกับ Profile Spec พร้อม Dashboard สรุปผล และ Export Excel',
    descriptionEn: 'AI-powered thickness wall measurement system (Gemini 2.5) for T1-T5, OR, IR, IHR, OHW, IHW, RA, IOR data extraction, profile spec verification, interactive dashboard & Excel export.',
    category: 'IPQA',
    iconName: 'Ruler',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 5,
    badgeType: 'info',
    metrics: [
      { labelTh: 'วัดชิ้นงานวันนี้', labelEn: 'Thickness Inspected Today', value: '68 Samples', trend: '+14%', trendUp: true },
      { labelTh: 'อัตราผ่านเกณฑ์ (Pass Rate)', labelEn: 'Thickness Pass Rate', value: '98.8%', trend: '+0.4%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'เจ้าหน้าที่ IPQA, ช่างวัดมิติชิ้นงาน, วิศวกรควบคุมคุณภาพ (QA/QC Engineer)',
      targetUsersEn: 'IPQA Auditor, Dimension Inspector, QA/QC Engineer',
      checklistItemsCount: 18,
      estimatedTimeMin: 3,
      outputReportTypeTh: 'รายงานตรวจวัดความหนาผนังชิ้นงาน (Thickness Wall Measurement Report)',
      outputReportTypeEn: 'Thickness Wall Measurement Cloud Report (CSV/Excel)',
      keyFeaturesTh: [
        'สกัดข้อมูลจากไฟล์ PDF/รูปถ่ายมือถือด้วย AI (Gemini 2.5) ตรวจวัดมิติ T1-T5, OR, IR, IHR, OHW, IHW, RA, IOR',
        'เปรียบเทียบค่าความหนาเทียบกับ Profile Spec ประเมิน PASS/FAIL แต่ละแถวและภาพรวมอัตโนมัติ',
        'ระบบบริหารจัดการ Profile Spec สำหรับ Admin ป้องกันด้วยรหัสผ่าน (Admin Password)',
        'Dashboard แสดงผลสรุปจำนวนตัวอย่าง และกราฟเปรียบเทียบมิติชิ้นงาน',
        'ส่งออกรายงานไฟล์ Excel/CSV พร้อมข้อมูล Coil No, Inspector, Sample, Process และเวลา'
      ],
      keyFeaturesEn: [
        'AI document & photo data extraction for T1-T5, OR, IR, IHR, OHW, IHW, RA, IOR measurements',
        'Automatic PASS/FAIL judgment against loaded Profile Spec for line items & overall sample',
        'Admin password-protected Profile Specification manager (Admin Password Protected)',
        'Dashboard metrics & visual comparison charts for sample trends',
        'CSV/Excel inspection log export with Coil No, Inspector, Sample, Process and timestamp'
      ]
    }
  },
  {
    id: 'mod-ipqa-08',
    code: 'IPQA-08',
    titleTh: 'การตัดท่อนบิลเล็ต (Billet Cutting Inspection)',
    titleEn: 'Billet Cutting Inspection & Quality Spec System',
    descriptionTh: 'บันทึกและตรวจสอบมิติการตัดบิลเล็ต (Grade, Heat No, Supplier, Qty, Length, Diameter, Bending Lx0.15%, Cutting surface <2mm, Surface defect 2x50x100mm, Heat identify, Appearance, Judgement) พร้อม Dashboard สรุปผลตามเดือน/ปี, ประวัติ และ Export Excel (Admin Protection)',
    descriptionEn: 'Billet cutting inspection for Grade, Heat No, Supplier, Length, Diameter, Bending (Lx0.15%), Cutting surface (<2mm), Surface defect (2x50x100mm), Heat identity, Appearance & Judgement with Month/Year Dashboard, History & Excel export.',
    category: 'IPQA',
    iconName: 'Scissors',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 4,
    badgeType: 'info',
    metrics: [
      { labelTh: 'ท่อนบิลเล็ตตัดวันนี้', labelEn: 'Billets Cut Today', value: '142 Pcs', trend: '+16%', trendUp: true },
      { labelTh: 'อัตราผ่านเกณฑ์ (Pass Rate)', labelEn: 'Cutting Pass Rate', value: '99.4%', trend: '+0.4%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'เจ้าหน้าที่ IPQA, ช่างเลื่อยตัดบิลเล็ต (Billet Saw Operator), วิศวกรหลอม/รีด (QA/QC Engineer)',
      targetUsersEn: 'IPQA Auditor, Billet Saw Operator, QA/QC Engineer',
      checklistItemsCount: 12,
      estimatedTimeMin: 3,
      outputReportTypeTh: 'รายงานการตรวจตัดท่อนบิลเล็ต (Billet Cutting Inspection Report)',
      outputReportTypeEn: 'Billet Cutting Inspection Cloud Report (CSV/Excel)',
      keyFeaturesTh: [
        'บันทึก Header (Inspector name, Shift, Cutting length, Lot no.) และตารางวัดค่า Cutting measurement ครบถ้วน',
        'คำนวณเกณฑ์โก่งงอ Bending Max อัตโนมัติด้วยสูตร Length x 0.15% และตรวจเกณฑ์ Cutting surface < 2 mm',
        'ระบบบริหารจัดการ Billet Cutting Spec (Length, Diameter, Bending, Surface defect) ป้องกันด้วยรหัส admin2026',
        'Dashboard สรุปผลแยกตาม Billet Grade, Supplier, Length, Q\'ty กรองดูเป็นรายเดือน / รายปี ได้อย่างยืดหยุ่น',
        'ตารางประวัติย้อนหลังแสดงเบื้องต้นเฉพาะเดือนปัจจุบันเพื่อความรวดเร็ว พร้อม Export เป็น Excel / CSV (UTF-8 BOM)'
      ],
      keyFeaturesEn: [
        'Header logging (Inspector, Shift, Cutting length, Lot no.) & full Cutting measurement data table',
        'Auto-calculated Bending Max limit (Length x 0.15%) and Cutting surface tolerance check (< 2 mm)',
        'Admin password-protected Billet Cutting Spec manager (admin2026)',
        'Interactive Month/Year Dashboard summarizing Billet Grade, Supplier, Length & Total Q\'ty',
        'Inspection History default-filtered to Current Month with Excel/CSV export and admin-protected Edit/Delete'
      ]
    }
  },
  {
    id: 'mod-oqa-01',
    code: 'OQA-01',
    titleTh: 'ตรวจสินค้าก่อนจัดส่ง FG Pre-Shipment (Tag Label Checker)',
    titleEn: 'FG Pre-Shipment Tag Label Checker & AI Comparison System',
    descriptionTh: 'วิเคราะห์และเปรียบเทียบข้อมูลป้าย Tag Label ด้วย AI 2-Step Analysis (ดึงข้อมูล Auto-Fill และเปรียบเทียบ Reference vs Test Image), จัดการ Master Spec, สรุปประวัติ และส่งออก Excel',
    descriptionEn: 'FG Pre-Shipment Inspection system with 2-Step AI Label Analysis (auto-fill extraction & Reference vs Test image comparison), Master Spec profile manager, history log & Excel export.',
    category: 'OQA',
    iconName: 'TruckCheck',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 4,
    badgeType: 'info',
    metrics: [
      { labelTh: 'ตรวจ Pre-Shipment วันนี้', labelEn: 'Pre-Shipment Audited Today', value: '42 Tags', trend: '+15%', trendUp: true },
      { labelTh: 'อัตราถูกต้อง (Pass Rate)', labelEn: 'Tag Accuracy Rate', value: '98.8%', trend: '+0.5%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'เจ้าหน้าที่ OQA, เจ้าหน้าที่จัดส่งและคลังสินค้า, วิศวกรประกันคุณภาพ (QA/QC Engineer)',
      targetUsersEn: 'OQA Inspector, Shipping & Logistics Specialist, QA/QC Engineer',
      checklistItemsCount: 16,
      estimatedTimeMin: 3,
      outputReportTypeTh: 'รายงานตรวจป้ายฉลากสินค้าก่อนจัดส่ง (FG Pre-Shipment Inspection Report)',
      outputReportTypeEn: 'FG Pre-Shipment Inspection Report (CSV/Excel)',
      keyFeaturesTh: [
        'วิเคราะห์รูปถ่ายป้าย Tag 2 ขั้นตอน (Step 1: Auto-Fill Extraction, Step 2: Reference vs Test Image Comparison)',
        'ตรวจสอบความถูกต้องของ Part No, Drawing No, Destination TO, Box No, Dimension W/H/L และรายการ Coil',
        'ระบบบริหารจัดการ Master Spec (Profile Spec) ป้องกันด้วยรหัสผ่านผู้ดูแลระบบ (Admin Password)',
        'Dashboard สรุปผลการตรวจสอบ อัตรา Reject Rate แยกตาม Profile/เดือน/ปี',
        'ส่งออกข้อมูลประวัติการตรวจเข้าระบบไฟล์ Excel / CSV ได้ทันที'
      ],
      keyFeaturesEn: [
        '2-Step AI Tag Label Analysis (Step 1: Auto-fill extraction, Step 2: Reference vs Test image comparison)',
        'Validation of Part No, Drawing No, Destination TO, Box No, Dimension W/H/L & Coil details',
        'Admin password-protected Master Spec Profile Manager (Admin Password Protected)',
        'Dashboard metrics & reject rate breakdown filtered by profile/month/year',
        'Instant Excel / CSV inspection history log export'
      ]
    }
  },
  {
    id: 'mod-eqp-01',
    code: 'EQP-01',
    titleTh: 'ระบบควบคุมเครื่องมือวัด (Metrology & Calibration)',
    titleEn: 'Instrument Control & Metrology Calibration System',
    descriptionTh: 'จัดการ Master List เครื่องมือวัด, แผนการสอบเทียบ (Cal Plan), บันทึกผล Error/Uncertainty, แจ้งเตือนวันหมดอายุ, ระบบบันทึกงานซ่อม และพิมพ์ QR Calibration Tag',
    descriptionEn: 'Instrument control system for Master List management, calibration plan, error/uncertainty evaluation, expiration warnings, repair log tracking & QR calibration tag printing.',
    category: 'EQUIPMENT',
    iconName: 'Wrench',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 3,
    badgeType: 'danger',
    metrics: [
      { labelTh: 'เครื่องมือทั้งหมด', labelEn: 'Total Gauges', value: '18 Tools', trend: '+2', trendUp: true },
      { labelTh: 'ความพร้อมใช้งาน', labelEn: 'Calibration Rate', value: '94.4%', trend: '+1.2%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'วิศวกรมาตรวิทยา (Metrology Engineer), เจ้าหน้าที่คุมเครื่องมือวัด, วิศวกรประกันคุณภาพ (QA/QC Engineer)',
      targetUsersEn: 'Metrology Engineer, Tool Custodian, QA/QC Engineer',
      checklistItemsCount: 12,
      estimatedTimeMin: 5,
      outputReportTypeTh: 'รายงานควบคุมเครื่องมือวัดและแผนสอบเทียบ (Instrument Master List & Cal Plan)',
      outputReportTypeEn: 'Instrument Control Master List & Calibration Report (Excel/CSV)',
      keyFeaturesTh: [
        'จัดการ Master List เครื่องมือวัด (รหัส, ชื่อ, ยี่ห้อ, รุ่น, Serial No, Range, Permission Error Spec)',
        'คำนวณวันสอบเทียบครั้งถัดไป (Next Cal) และประเมินสถานะ Active, Due Soon, Expired, Repairing อัตโนมัติ',
        'บันทึกผลการสอบเทียบ คำนวณค่า Error เปรียบเทียบกับ Spec ตัดสิน PASS / FAIL อัตโนมัติ',
        'บันทึกประวัติการซ่อมบำรุง (Repair Log) พร้อมติดตามสถานะซ่อมเสร็จ',
        'พิมพ์ QR Code Identification & Calibration Status Tag สำหรับติดเครื่องมือวัด',
        'ส่งออกข้อมูล Master List & History เข้าสู่ระบบ Excel / CSV ได้ทันที'
      ],
      keyFeaturesEn: [
        'Master List management (ID, Name, Brand, Model, Serial No, Location, Range, Spec Limit)',
        'Automatic Next Cal calculation & real-time status tagging (Active, Due Soon, Expired, Repairing)',
        'Calibration entry log with automatic PASS/FAIL spec compliance evaluation',
        'Maintenance & Repair logging workflow with status management',
        'Print QR Code Identification & Calibration Status Tags for tools',
        'Instant Excel / CSV Master List and calibration history export'
      ]
    }
  },
  {
    id: 'mod-ncr-01',
    code: 'NCR-01',
    titleTh: 'จัดการของเสีย NCR & การแก้ไข CAPA (NCR & CAPA Center)',
    titleEn: 'Non-Conformance Report & CAPA Management Center',
    descriptionTh: 'ศูนย์รวบรวมของเสีย Fail / Out of Spec / NG อัตโนมัติจากทุกสถานีตรวจ แยกตาม Coil no., Profile, Inspection date, Inspector, Process และ Inspection result พร้อมระบบติดตาม 8D & CAPA',
    descriptionEn: 'Centralized non-conformance database automatically aggregated from all inspection stations separated by Coil no., Profile, Date, Inspector, Process & Result with 8D CAPA workflow.',
    category: 'NCR',
    iconName: 'AlertTriangle',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v2.0.0 (Live App)',
    badgeCount: 5,
    badgeType: 'danger',
    metrics: [
      { labelTh: 'NCR รอดำเนินการ', labelEn: 'Active NCRs', value: '5 Issues' },
      { labelTh: 'ระยะเวลาปิดงานเฉลี่ย', labelEn: 'Avg. Closure Time', value: '3.2 Days', trend: '-0.8 Days', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'ทีม QA Manager, วิศวกรประกันคุณภาพ, หัวหน้างานฝ่ายผลิต, เจ้าหน้าที่ IQA/IPQA/OQA',
      targetUsersEn: 'QA Manager, QA/QC Engineers, Production Supervisors, IQA/IPQA/OQA Officers',
      checklistItemsCount: 16,
      estimatedTimeMin: 15,
      outputReportTypeTh: 'รายงานแจ้งของเสีย NCR & แบบฟอร์ม 8D CAPA (CSV/Excel/Print)',
      outputReportTypeEn: '8D Problem Solving & Non-Conformance Report (CSV/Excel/Print)',
      keyFeaturesTh: [
        'ดึงข้อมูลรายการตรวจที่ไม่ผ่านเกณฑ์ (Fail / NG / Out of Spec) อัตโนมัติจากทุกโมดูล',
        'แยกข้อมูล 6 มิติหลัก: Coil no., Profile, Inspection date, Inspector, Process, Inspection result',
        'ระบบกักกันสินค้า (Quarantine / Red Tag Hold) และบันทึกคำสั่งจัดการ (Disposition)',
        'วิเคราะห์สาเหตุด้วยหลักการ 5-Why Analysis และบันทึกมาตรการแก้ไขและป้องกัน (CAPA)',
        'ส่งออกข้อมูลไฟล์ Excel/CSV และพิมพ์เอกสาร 8D Problem Solving Report มาตรฐาน'
      ],
      keyFeaturesEn: [
        'Automated ingestion of Fail / NG / Out-of-Spec inspection records from all modules',
        'Separates data into 6 dimensions: Coil no., Profile, Inspection date, Inspector, Process, and Result',
        'Quarantine & Red Tag hold status tracking with disposition workflow',
        '5-Why Root Cause Analysis and Corrective/Preventive Action (CAPA) tracking',
        'One-click Excel/CSV export and print-ready official 8D report format'
      ]
    }
  },
  {
    id: 'mod-ana-01',
    code: 'ANA-01',
    titleTh: 'แดชบอร์ดวิเคราะห์คุณภาพ & PPM (Quality Analytics & Pareto)',
    titleEn: 'Quality Analytics & Defect Rate Dashboard',
    descriptionTh: 'วิเคราะห์อัตราของเสีย Pareto Chart, First Pass Yield (FPY), แนวโน้ม PPM และสรุปรายงานผู้บริหาร',
    descriptionEn: 'Real-time Pareto defect chart, PPM trend analysis, FPY tracking, and executive summary export.',
    category: 'ANALYTICS',
    iconName: 'BarChart3',
    status: 'READY_FOR_DEV',
    pinned: true,
    version: 'v1.0.0',
    metrics: [
      { labelTh: 'Defect Rate รวม', labelEn: 'Total Defect Rate', value: '0.42%', trend: '-0.05%', trendUp: true },
      { labelTh: 'Plant PPM', labelEn: 'Plant PPM', value: '420 PPM', trend: '-25 PPM', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'ผู้บริหาร, QA Manager, วิศวกรปรับปรุงคุณภาพ (CI Engineer)',
      targetUsersEn: 'Executive Board, QA Manager, Continuous Improvement Engineer',
      checklistItemsCount: 5,
      estimatedTimeMin: 5,
      outputReportTypeTh: 'Monthly Quality Performance Presentation (PDF/Excel)',
      outputReportTypeEn: 'Monthly Quality Performance Presentation (PDF/Excel)',
      keyFeaturesTh: [
        'กราฟ Pareto วิเคราะห์สาเหตุของเสียอันดับแรก (Top Defect Types)',
        'การเปรียบเทียบประสิทธิภาพคุณภาพตามไลน์ผลิต (Line Comparison)',
        'การส่งออกข้อมูลดิบรูปแบบ Excel / CSV'
      ],
      keyFeaturesEn: [
        'Dynamic Pareto Chart for Top Defect Type Breakdown',
        'Multi-line Quality Yield & Scrap comparison analytics',
        'Data Export to Excel / CSV / PDF formats'
      ]
    }
  },
  {
    id: 'mod-coi-01',
    code: 'COI-01',
    titleTh: 'ออกใบรับรองผลการตรวจคุณภาพ (Certificate of Inspection - COI)',
    titleEn: 'Certificate of Inspection & Analysis (COI / COA)',
    descriptionTh: 'ระบบออกใบรับรองคุณภาพสินค้า COI พร้อมแท็บออกแบบหัวข้อตรวจสอบตามแต่ละ Profile และแท็บระบุรายละเอียด Coil No., Length เพื่อออกใบรับรองส่งลูกค้าทันที',
    descriptionEn: 'Automated Certificate of Inspection (COI / COA) with Profile Test Spec Designer and Issue Details Engine.',
    category: 'CERTIFICATE_COI',
    iconName: 'FileCheck',
    status: 'ACTIVE',
    pinned: true,
    isPopular: true,
    version: 'v1.1.0',
    metrics: [
      { labelTh: 'ออกใบ COI วันนี้', labelEn: 'COI Issued Today', value: '45 Certificates' },
      { labelTh: 'ความถูกต้องแม่นยำ', labelEn: 'Accuracy Rate', value: '100%', trend: '0%', trendUp: true }
    ],
    specs: {
      targetUsersTh: 'เจ้าหน้าที่ประกันคุณภาพ (QA Officer), QA Manager, ฝ่ายจัดส่ง',
      targetUsersEn: 'QA Officer, QA Manager, Shipping & Logistics Team',
      checklistItemsCount: 15,
      estimatedTimeMin: 1,
      outputReportTypeTh: 'Certificate of Inspection (COI / COA) Official PDF Document',
      outputReportTypeEn: 'Certificate of Inspection (COI / COA) Official PDF Document',
      keyFeaturesTh: [
        'แท็บ 1: ออกแบบหัวข้อการตรวจ (COI Design) กำหนดค่าเคมี แรงดึง ผิว ขนาด มิติ ของแต่ละ Profile',
        'แท็บ 2: ระบุรายละเอียดการออก (Issue Detail) เลือก Profile, Coil No., Length แล้วกดสร้าง COI',
        'ระบบดึงข้อมูลเกณฑ์มาตรฐานและผลการตรวจจริงจาก Tab Design มาสร้างเป็น COI ส่งลูกค้าทันที',
        'หน้าแสดงใบรับรองทางการ A4 พร้อมตราประทับ QA และ QR Code สำหรับตรวจสอบย้อนกลับ'
      ],
      keyFeaturesEn: [
        'Tab 1: COI Design Engine to configure chemical, mechanical, surface, and dimension specs per profile',
        'Tab 2: Issue Details to specify Profile, Coil No., Length and generate official COI',
        'Auto-populates inspection parameters from Tab Design into customer-ready Certificate',
        'Printable ISO 9001 standard A4 certificate layout with QA seal and digital verification'
      ]
    }
  }
];

export const INITIAL_ACTIVITIES: InspectionActivity[] = [
  {
    id: 'act-101',
    timestamp: '10:45 AM',
    moduleCode: 'IQA-01',
    moduleTitleTh: 'ตรวจรับวัตถุดิบและชิ้นส่วน',
    moduleTitleEn: 'Incoming Material Inspection',
    inspector: 'สมชาย รักดี (IQA-02)',
    batchLot: 'LOT-20260804-001 (Aluminum Alloy Sheet)',
    result: 'PASS',
    remarks: 'AQL 0.65 Level II Compliant'
  },
  {
    id: 'act-102',
    timestamp: '10:30 AM',
    moduleCode: 'IPQA-01',
    moduleTitleTh: 'การตรวจชิ้นงานแรก & สายการผลิต',
    moduleTitleEn: 'First Piece Line Patrol Check',
    inspector: 'วิภาวี สุขเจริญ (IPQA-01)',
    batchLot: 'LINE-02 (PCB Mainboard Assembly)',
    result: 'PASS',
    remarks: 'Solder joint & component placement verified'
  },
  {
    id: 'act-103',
    timestamp: '09:55 AM',
    moduleCode: 'NCR-01',
    moduleTitleTh: 'จัดการของเสีย NCR & การแก้ไข CAPA',
    moduleTitleEn: 'Non-Conformance Report',
    inspector: 'เดชา มั่นคง (QA Engineer)',
    batchLot: 'LOT-20260803-089 (Plastic Housing Casing)',
    result: 'REJECT',
    defectCount: 14,
    remarks: 'Surface scratch defect exceeded allowable limit (CAPA #2026-042 Issued)'
  },
  {
    id: 'act-104',
    timestamp: '09:15 AM',
    moduleCode: 'OQA-01',
    moduleTitleTh: 'ตรวจสินค้าก่อนจัดส่ง FG Pre-Shipment',
    moduleTitleEn: 'FG Pre-Shipment Quality Audit',
    inspector: 'กิตติพงษ์ ชัยชนะ (OQA Lead)',
    batchLot: 'FG-BATCH-882 (Model X-200 Smart Sensor)',
    result: 'PASS',
    remarks: 'Tag Label & Specification verified'
  },
  {
    id: 'act-105',
    timestamp: '08:30 AM',
    moduleCode: 'EQP-01',
    moduleTitleTh: 'ระบบสอบเทียบและดูแลเครื่องมือวัด',
    moduleTitleEn: 'Equipment Calibration & Gauge Tracking',
    inspector: 'ณัฐพล พัฒนกุล (Metrology)',
    batchLot: 'GAUGE-CAL-044 (Digital Vernier Caliper #12)',
    result: 'PASS',
    remarks: 'Calibrated with Master Block Grade 0. Deviation within +/-0.002mm'
  }
];

export const MOCK_SYSTEM_METRICS: SystemMetrics = {
  totalInspectionsToday: 48,
  passRatePercent: 97.8,
  activeDefects: 3,
  pendingNCRs: 5,
  calibratedToolsPercent: 96.8
};

export const MOCK_USER_PROFILE: UserProfile = {
  name: 'Anucha Supaporn',
  role: 'QA_ENGINEER',
  employeeId: 'QA-8802',
  department: 'Quality Assurance & Quality Control Dept.'
};

export const MOCK_SHIFT_INFO: ShiftInfo = {
  shiftName: 'Shift A (08:00 - 17:00)',
  lineCode: 'Line 01 - Smart Assembly Plant',
  factoryPlant: 'Plant 1 (Rayong Industrial Estate)'
};
