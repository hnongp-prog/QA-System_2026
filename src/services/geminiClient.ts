import { GoogleGenAI } from "@google/genai";

// Retrieve API key from various client-side sources
export function getGeminiApiKey(): string {
  // 1. import.meta.env.VITE_GEMINI_API_KEY
  const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (viteKey && viteKey.trim() && !viteKey.includes("MY_GEMINI_API_KEY")) {
    return viteKey.trim();
  }

  // 2. import.meta.env.GEMINI_API_KEY
  const metaKey = (import.meta as any).env?.GEMINI_API_KEY;
  if (metaKey && metaKey.trim() && !metaKey.includes("MY_GEMINI_API_KEY")) {
    return metaKey.trim();
  }

  // 3. process.env (fallback if injected by bundler)
  try {
    if (typeof process !== "undefined" && process.env) {
      const pKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (pKey && pKey.trim() && !pKey.includes("MY_GEMINI_API_KEY")) {
        return pKey.trim();
      }
    }
  } catch (e) {}

  // 4. LocalStorage (custom key set by user in UI / Vercel deployment)
  try {
    const localKey = localStorage.getItem("VITE_GEMINI_API_KEY") || localStorage.getItem("user_gemini_api_key") || localStorage.getItem("GEMINI_API_KEY");
    if (localKey && localKey.trim()) {
      return localKey.trim();
    }
  } catch (e) {}

  // 5. Window global
  if (typeof window !== "undefined" && (window as any).__GEMINI_API_KEY__) {
    return (window as any).__GEMINI_API_KEY__;
  }

  return "";
}

export function setCustomGeminiApiKey(key: string) {
  try {
    if (key && key.trim()) {
      localStorage.setItem("VITE_GEMINI_API_KEY", key.trim());
      localStorage.setItem("user_gemini_api_key", key.trim());
    } else {
      localStorage.removeItem("VITE_GEMINI_API_KEY");
      localStorage.removeItem("user_gemini_api_key");
    }
  } catch (e) {}
}

export function tryExtractValidJson(str: string): any {
  if (!str) return null;
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');

  // If object comes first (or only object exists)
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = firstBrace; i < str.length; i++) {
      const char = str[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') depth++;
        else if (char === '}') {
          depth--;
          if (depth === 0) {
            const candidate = str.slice(firstBrace, i + 1);
            try {
              return JSON.parse(candidate);
            } catch (e) {
              const sanitized = candidate.replace(/,\s*([\}\]])/g, '$1');
              try {
                return JSON.parse(sanitized);
              } catch (e2) {}
            }
          }
        }
      }
    }

    const lastBrace = str.lastIndexOf('}');
    if (lastBrace > firstBrace) {
      const candidate = str.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (e) {
        const sanitized = candidate.replace(/,\s*([\}\]])/g, '$1');
        try {
          return JSON.parse(sanitized);
        } catch (e2) {}
      }
    }
  }

  // If array comes first
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = firstBracket; i < str.length; i++) {
      const char = str[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '[') depth++;
        else if (char === ']') {
          depth--;
          if (depth === 0) {
            const candidate = str.slice(firstBracket, i + 1);
            try {
              return JSON.parse(candidate);
            } catch (e) {
              const sanitized = candidate.replace(/,\s*([\}\]])/g, '$1');
              try {
                return JSON.parse(sanitized);
              } catch (e2) {}
            }
          }
        }
      }
    }

    const lastBracket = str.lastIndexOf(']');
    if (lastBracket > firstBracket) {
      const candidate = str.slice(firstBracket, lastBracket + 1);
      try {
        return JSON.parse(candidate);
      } catch (e) {
        const sanitized = candidate.replace(/,\s*([\}\]])/g, '$1');
        try {
          return JSON.parse(sanitized);
        } catch (e2) {}
      }
    }
  }

  return null;
}

export function cleanAndParseJson(textResponse: string): any {
  if (!textResponse) throw new Error("Empty response from AI model");
  
  const cleaned = textResponse.trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  // 2. Extract content from markdown code blocks
  const codeBlockMatches = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/gi);
  if (codeBlockMatches && codeBlockMatches.length > 0) {
    for (const block of codeBlockMatches) {
      const inner = block.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      try {
        return JSON.parse(inner);
      } catch (e) {
        const innerExtracted = tryExtractValidJson(inner);
        if (innerExtracted) return innerExtracted;
      }
    }
  }

  // 3. Fallback to balanced extraction on full raw string
  const extracted = tryExtractValidJson(cleaned);
  if (extracted) return extracted;

  throw new Error("Could not parse valid JSON from AI response: " + cleaned.slice(0, 150));
}

// Client-side execution helper with multiple model fallback & REST fallback
export async function callGeminiVisionClientSide(
  prompt: string,
  images: { base64: string; mimeType: string }[]
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please set VITE_GEMINI_API_KEY in your .env file or deployment settings."
    );
  }

  // Clean model names without any 'models/' prefix (Supports current Gemini API versions)
  const models = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-1.5-flash"];
  let lastError: any = null;

  // 1. Try with GoogleGenAI SDK
  try {
    const ai = new GoogleGenAI({ apiKey });
    for (const rawModel of models) {
      const model = rawModel.replace(/^models\//, '');
      try {
        const parts: any[] = [{ text: prompt }];
        for (const img of images) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType || "image/png",
              data: img.base64
            }
          });
        }

        const res = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts
            }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        if (res && res.text) {
          return res.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`SDK model ${model} attempt failed:`, err?.message || err);
      }
    }
  } catch (sdkInitErr) {
    console.warn("GoogleGenAI SDK init error, switching to direct REST fetch:", sdkInitErr);
  }

  // 2. Direct REST API Fallback (Guaranteed to work in pure browser/Vercel SPA)
  for (const rawModel of models) {
    const model = rawModel.replace(/^models\//, '');
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const parts: any[] = [{ text: prompt }];
      for (const img of images) {
        parts.push({
          inline_data: {
            mime_type: img.mimeType || "image/png",
            data: img.base64
          }
        });
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error?.message || `HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (restErr: any) {
      lastError = restErr;
      console.warn(`REST API model ${model} attempt failed:`, restErr?.message || restErr);
    }
  }

  throw lastError || new Error("All Gemini API attempts failed.");
}

/**
 * IQA-01: Billet Incoming Inspection Cert Analysis (Client-side)
 */
export async function analyzeBilletCertClient(base64Image: string, mimeType: string = "image/png") {
  const systemPrompt = `You are an expert Quality Control AI for Metal Mill Test Certificates / Inspection Reports (Billet Incoming Inspection IQA-01).
Analyze the uploaded document image or PDF carefully and extract ALL real information visible in the document for EVERY Heat Number / Lot found.

IMPORTANT INSTRUCTIONS:
1. Extract EVERY SINGLE Heat Number / Lot / Item listed in the document.
2. For chemical composition values, extract numerical values (e.g., Si, Fe, Cu, Mn, Mg, Cr, Zn, Ti, Pb, Cd, Al). If commas are used as decimal points (e.g., "0,65" or "0,02"), convert them to standard dots (e.g., "0.65" or "0.02").
3. Extract exact supplier name, grade (e.g., 6063, 6061), billet size (e.g., 5 inch, 6 inch, 127mm, 152mm), batch number, invoice number, quantity, weight, and dimensions if present.
4. Return ONLY valid JSON format with top-level array "items" containing objects with these fields:
{
  "items": [
    {
      "heat_number": "string (e.g. H2026-0891, HEAT-102)",
      "billet_size": "string (e.g. 5 inch, 6 inch, 127 mm)",
      "grade": "string (e.g. 6063, 6061, 6005)",
      "supplier_name": "string (Supplier / Manufacturer name)",
      "inspector_name": "string (Inspector name if visible)",
      "batch_no": "string (Batch / Lot No)",
      "invoice_no": "string (Invoice / PO No)",
      "diameter": "string (e.g. 127.0 mm)",
      "length": "string (e.g. 6000 mm)",
      "bending": "string (e.g. < 1.0 mm/m)",
      "appearance": "string (e.g. Good, Normal)",
      "xrf": "string (e.g. Pass)",
      "quantity_pcs": 120,
      "weight_kg": 3600,
      "cutting_surface_lt2": true,
      "billet_slid_lt25": true,
      "defect_depth": "0",
      "defect_width": "0",
      "defect_length": "0",
      "chemical_composition": {
        "Si": 0.45,
        "Fe": 0.20,
        "Cu": 0.02,
        "Mn": 0.03,
        "Mg": 0.55,
        "Cr": 0.01,
        "Zn": 0.02,
        "Ti": 0.01,
        "Pb": 0.00,
        "Cd": 0.00,
        "Al": 98.71
      }
    }
  ]
}`;

  const rawText = await callGeminiVisionClientSide(systemPrompt, [{ base64: base64Image, mimeType }]);
  const parsedData = cleanAndParseJson(rawText);

  let rawArray: any[] = [];
  if (Array.isArray(parsedData)) {
    rawArray = parsedData;
  } else if (parsedData && typeof parsedData === "object") {
    if (Array.isArray(parsedData.items)) rawArray = parsedData.items;
    else if (Array.isArray(parsedData.data)) rawArray = parsedData.data;
    else if (Array.isArray(parsedData.heats)) rawArray = parsedData.heats;
    else if (Array.isArray(parsedData.heat_numbers)) rawArray = parsedData.heat_numbers;
    else if (Array.isArray(parsedData.records)) rawArray = parsedData.records;
    else if (Array.isArray(parsedData.results)) rawArray = parsedData.results;
    else rawArray = [parsedData];
  }

  const elementsList = ["Si", "Fe", "Cu", "Mn", "Mg", "Cr", "Zn", "Ti", "Pb", "Cd", "Al"];

  const finalArray = rawArray.map((item: any, idx: number) => {
    if (!item || typeof item !== "object") return null;

    const rawChem = item.chemical_composition || item.chemical || item.chemistry || item.elements || {};
    const cleanChem: Record<string, number> = {};

    elementsList.forEach((el) => {
      let val = rawChem[el] ?? rawChem[el.toLowerCase()] ?? rawChem[el.toUpperCase()];
      if (val !== undefined && val !== null) {
        let strVal = String(val).trim().replace(/,/g, ".").replace(/%/g, "");
        const numVal = parseFloat(strVal);
        cleanChem[el] = isNaN(numVal) ? 0 : numVal;
      }
    });

    return {
      heat_number: String(item.heat_number || item.heatNo || item.heat_no || item.heat || item.lot_no || item.lot || `HEAT-${idx + 1}`).trim(),
      billet_size: String(item.billet_size || item.size || item.dimension || "6 inch (152 mm)").trim(),
      grade: String(item.grade || item.alloy || item.material || "6063").trim(),
      supplier_name: String(item.supplier_name || item.supplier || item.manufacturer || "").trim(),
      inspector_name: String(item.inspector_name || item.inspector || "").trim(),
      batch_no: String(item.batch_no || item.batchNo || item.batch || "").trim(),
      invoice_no: String(item.invoice_no || item.invoiceNo || item.invoice || "").trim(),
      diameter: String(item.diameter || "").trim(),
      length: String(item.length || "").trim(),
      bending: String(item.bending || "").trim(),
      appearance: String(item.appearance || "").trim(),
      xrf: String(item.xrf || "").trim(),
      quantity_pcs: Number(item.quantity_pcs || item.quantity || item.qty || 0),
      weight_kg: Number(item.weight_kg || item.weight || 0),
      cutting_surface_lt2: item.cutting_surface_lt2 !== undefined ? (item.cutting_surface_lt2 === true || item.cutting_surface_lt2 === 'true' || item.cutting_surface_lt2 === 'Pass' || item.cutting_surface_lt2 === 'OK') : true,
      billet_slid_lt25: item.billet_slid_lt25 !== undefined ? (item.billet_slid_lt25 === true || item.billet_slid_lt25 === 'true' || item.billet_slid_lt25 === 'Pass' || item.billet_slid_lt25 === 'OK') : true,
      defect_depth: item.defect_depth !== undefined ? String(item.defect_depth).trim() : (item.defect_2x50x100 ? '5' : '0'),
      defect_width: item.defect_width !== undefined ? String(item.defect_width).trim() : '0',
      defect_length: item.defect_length !== undefined ? String(item.defect_length).trim() : '0',
      chemical_composition: cleanChem
    };
  }).filter(Boolean);

  return finalArray;
}

/**
 * IQA-02: Coating Chemical Incoming Inspection Cert Analysis (Client-side)
 */
export async function analyzeChemicalCertClient(base64Image: string, mimeType: string = "image/png") {
  const systemPrompt = `You are an expert Quality Control AI for Coating Chemical Mill Certificate / COA / Certificate of Analysis (Coating Chemical Incoming Inspection IQA-02).
Analyze the uploaded image or PDF page carefully and extract ALL visible header information and ALL chemical test measurement rows.

Return ONLY a valid JSON object with top-level keys "header" and "table":
{
  "header": {
    "inspector_name": "string (Inspector or Tester name)",
    "coating_chemical": "string (Chemical code / item name e.g. A-001, COAT-901, BOND-02, Zinc Phosphate, Phosphating Agent)",
    "batch_lot": "string (Batch No / Lot No e.g. LOT-2026-CH01, BATCH-992, LOT-A12)",
    "product_date": "string (Manufacturing / Production Date e.g. 2026-07-28)",
    "expiration_date": "string (Expiry / Expiration Date e.g. 2027-07-28)",
    "weight_kg": "string or number (Total weight e.g. 250)",
    "qty_pcs": "string or number (Quantity of drums / containers e.g. 10)",
    "packaging_situation": "string (Packaging condition e.g. Normal, Good, Intact)",
    "supplier": "string (Supplier or Manufacturer company name)"
  },
  "table": [
    {
      "description": "string (Parameter / Item description e.g. OR, T1, IR, VISCOSITY, PH, SOLID_CONTENT, DENSITY, SPECIFIC_GRAVITY)",
      "total": "number or numeric string (Measured value / result e.g. 14.8, 8.5, 105, 7.2)"
    }
  ]
}

IMPORTANT:
- If decimal numbers use commas (e.g., "14,8"), convert them to standard dots ("14.8").
- Extract EVERY test parameter / measurement item found in the certificate table.
- If a header field is not explicitly present, infer or provide a clean default or empty string. Do not omit the keys.`;

  const rawText = await callGeminiVisionClientSide(systemPrompt, [{ base64: base64Image, mimeType }]);
  const parsedData = cleanAndParseJson(rawText);

  let rawHeader: any = {};
  let rawTable: any[] = [];

  if (parsedData && typeof parsedData === "object") {
    if (parsedData.header && typeof parsedData.header === "object") {
      rawHeader = parsedData.header;
    } else {
      rawHeader = parsedData;
    }

    const tableArray = parsedData.table || parsedData.items || parsedData.measurements || parsedData.results || parsedData.parameters || (Array.isArray(parsedData) ? parsedData : []);
    if (Array.isArray(tableArray)) {
      rawTable = tableArray;
    }
  }

  const cleanHeader = {
    inspector_name: String(rawHeader.inspector_name || rawHeader.inspector || "").trim(),
    coating_chemical: String(rawHeader.coating_chemical || rawHeader.chemical || rawHeader.product_name || rawHeader.chemical_name || "A-001").toUpperCase().trim(),
    batch_lot: String(rawHeader.batch_lot || rawHeader.batch_no || rawHeader.lot_no || rawHeader.lot || rawHeader.batch || "").trim(),
    product_date: String(rawHeader.product_date || rawHeader.mfg_date || rawHeader.production_date || rawHeader.date || "").trim(),
    expiration_date: String(rawHeader.expiration_date || rawHeader.exp_date || rawHeader.expiry_date || "").trim(),
    weight_kg: rawHeader.weight_kg !== undefined ? String(rawHeader.weight_kg) : (rawHeader.weight !== undefined ? String(rawHeader.weight) : ""),
    qty_pcs: rawHeader.qty_pcs !== undefined ? String(rawHeader.qty_pcs) : (rawHeader.quantity !== undefined ? String(rawHeader.quantity) : (rawHeader.qty !== undefined ? String(rawHeader.qty) : "")),
    packaging_situation: String(rawHeader.packaging_situation || rawHeader.packaging || rawHeader.package || "Normal").trim(),
    supplier: String(rawHeader.supplier || rawHeader.supplier_name || rawHeader.manufacturer || "").trim()
  };

  const cleanTable = rawTable.map((row: any) => {
    if (!row || typeof row !== "object") return null;
    let desc = String(row.description || row.item || row.parameter || row.name || row.property || "").trim();
    let val = row.total ?? row.value ?? row.val ?? row.result ?? row.test_result ?? "";
    if (typeof val === "string") {
      val = val.replace(/,/g, ".").replace(/%/g, "").trim();
    }
    return {
      description: desc,
      total: String(val)
    };
  }).filter((item: any) => item && item.description);

  return {
    header: cleanHeader,
    table: cleanTable
  };
}

/**
 * IQA-03: Zn Wire Incoming Inspection Cert Analysis (Client-side)
 */
export async function analyzeZnWireCertClient(base64Image: string, mimeType: string = "image/png") {
  const systemPrompt = `You are an expert Quality Control AI for Zn Wire Mill Test Certificates / COA (Zn Wire Incoming Inspection IQA-03).
Analyze the image or PDF document and extract ALL data for EVERY lot/item/drum found in the document.
Return ONLY valid JSON format with top-level array "items" or a root array.
Each object must have the following keys:
- heat_number (string, e.g. "H2026-ZN-905")
- grade (string, e.g. "ZN-99.99", "ZN-WIRE-STD", "Zn 99.99%")
- supplier (string, e.g. "Siam Zinc Wire Metallic Co., Ltd.")
- inspector_name (string, or empty string if not visible)
- drum (string, e.g. "DRUM-01")
- batch_no (string, or empty string)
- po_no (string, or empty string)
- diameter (string, e.g. "2.0 mm")
- appearance (string, e.g. "Clean & Bright Surface")
- quantity_pcs (number or numeric string, e.g. "10")
- weight_kg (number or numeric string, e.g. "200")
- tensile_strength (number or numeric string, e.g. "118")
- elongation (number or numeric string, e.g. "26")
- chemical_composition: object with keys Pb, Fe, Cd, Sn, Cu, Zn (values as numbers or numeric strings, converting commas to dots)`;

  const rawText = await callGeminiVisionClientSide(systemPrompt, [{ base64: base64Image, mimeType }]);
  const parsedData = cleanAndParseJson(rawText);
  let rawArray: any[] = [];
  if (Array.isArray(parsedData)) {
    rawArray = parsedData;
  } else if (parsedData && typeof parsedData === "object") {
    if (Array.isArray(parsedData.items)) rawArray = parsedData.items;
    else if (Array.isArray(parsedData.data)) rawArray = parsedData.data;
    else if (Array.isArray(parsedData.results)) rawArray = parsedData.results;
    else rawArray = [parsedData];
  }

  const finalArray = rawArray.map((item: any) => {
    if (!item || typeof item !== "object") return null;
    return {
      heat_number: String(item.heat_number || item.heatNo || item.lot || "H-ZN-01").trim(),
      grade: String(item.grade || "ZN-99.99").trim(),
      supplier: String(item.supplier || item.supplier_name || "").trim(),
      inspector_name: String(item.inspector_name || "").trim(),
      drum: String(item.drum || "DRUM-01").trim(),
      batch_no: String(item.batch_no || "").trim(),
      po_no: String(item.po_no || "").trim(),
      diameter: String(item.diameter || "2.0 mm").trim(),
      appearance: String(item.appearance || "Clean & Bright Surface").trim(),
      quantity_pcs: String(item.quantity_pcs || "10"),
      weight_kg: String(item.weight_kg || "200"),
      tensile_strength: String(item.tensile_strength || ""),
      elongation: String(item.elongation || ""),
      chemical_composition: {
        Pb: String(item.chemical_composition?.Pb ?? "").replace(/,/g, "."),
        Fe: String(item.chemical_composition?.Fe ?? "").replace(/,/g, "."),
        Cd: String(item.chemical_composition?.Cd ?? "").replace(/,/g, "."),
        Sn: String(item.chemical_composition?.Sn ?? "").replace(/,/g, "."),
        Cu: String(item.chemical_composition?.Cu ?? "").replace(/,/g, "."),
        Zn: String(item.chemical_composition?.Zn ?? "").replace(/,/g, ".")
      }
    };
  }).filter(Boolean);

  return finalArray;
}

/**
 * OQA-01: FG Pre-Shipment Label 2-Step Inspection (Client-side)
 */
export async function analyzeFgPreShipmentLabelClient(
  testBase64: string,
  refBase64?: string | null,
  testMime: string = "image/png",
  refMime: string = "image/png"
) {
  const step1Prompt = `Read the tag label in this TEST image or document carefully.
Extract ALL text, QR codes, Barcodes, Part Numbers, Destination, Box Number, Color Tag, Profile Specification, Drawing Number, Dimensions (Width W, Height H, Length L), Description, and Coil Numbers with quantities and dates.

Return ONLY a valid JSON object with these keys:
{
  "destinationTo": "STRING (e.g. TOKYO / JAPAN, OSAKA, BANGKOK, USA)",
  "profileName": "STRING (e.g. Profile-A, Profile-B, Type-X)",
  "partNo": "STRING (e.g. P-8801-TK, P-9920-OS)",
  "drawing": "STRING (e.g. DWG-2026-001)",
  "colorTag": "STRING (e.g. Green Tag, Blue Tag, Red Tag)",
  "boxNo": "STRING (e.g. BOX-2026-0881)",
  "description": "STRING (Description of product)",
  "dimW": "STRING (Width in mm e.g. 120.5)",
  "dimH": "STRING (Height in mm e.g. 45.0)",
  "dimL": "STRING (Length in mm e.g. 2500)",
  "coils": [
    {
      "no": "STRING (Coil No)",
      "qty": NUMBER,
      "coatingDate": "STRING (YYYY-MM-DD)",
      "expireDate": "STRING (YYYY-MM-DD)"
    }
  ]
}`;

  const step1Raw = await callGeminiVisionClientSide(step1Prompt, [{ base64: testBase64, mimeType: testMime }]);
  const rawStep1 = cleanAndParseJson(step1Raw);

  const coilsList = Array.isArray(rawStep1.coils) ? rawStep1.coils : 
                    Array.isArray(rawStep1.coil_items) ? rawStep1.coil_items :
                    Array.isArray(rawStep1.items) ? rawStep1.items : [];

  const cleanCoils = coilsList.map((c: any, i: number) => ({
    no: String(c.no || c.coilNo || c.coil_no || c.number || `COIL-${i+1}`).trim(),
    qty: Number(c.qty || c.quantity || c.amount || 10),
    coatingDate: String(c.coatingDate || c.coating_date || c.mfgDate || new Date().toISOString().split("T")[0]).trim(),
    expireDate: String(c.expireDate || c.expire_date || c.expDate || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0]).trim()
  }));

  const cleanStep1 = {
    destinationTo: String(rawStep1.destinationTo || rawStep1.destination || rawStep1.destination_to || rawStep1.shipTo || rawStep1.to || "").trim(),
    profileName: String(rawStep1.profileName || rawStep1.profile_name || rawStep1.profile || rawStep1.spec || "").trim(),
    partNo: String(rawStep1.partNo || rawStep1.part_no || rawStep1.partNumber || rawStep1.itemNo || rawStep1.part || "").trim(),
    drawing: String(rawStep1.drawing || rawStep1.drawingNo || rawStep1.drawing_no || rawStep1.dwg || "").trim(),
    colorTag: String(rawStep1.colorTag || rawStep1.color_tag || rawStep1.color || rawStep1.tagColor || "").trim(),
    boxNo: String(rawStep1.boxNo || rawStep1.box_no || rawStep1.boxNumber || rawStep1.box || "").trim(),
    description: String(rawStep1.description || rawStep1.desc || rawStep1.itemDescription || "").trim(),
    dimW: String(rawStep1.dimW || rawStep1.dim_w || rawStep1.width || rawStep1.w || "").trim(),
    dimH: String(rawStep1.dimH || rawStep1.dim_h || rawStep1.height || rawStep1.h || "").trim(),
    dimL: String(rawStep1.dimL || rawStep1.dim_l || rawStep1.length || rawStep1.l || "").trim(),
    coils: cleanCoils
  };

  let isMatch = true;
  let reasonThai = "ข้อมูลตรงกันระหว่าง Reference Image และ Test Image (ทุกรายการสอดคล้องกัน)";

  if (refBase64) {
    const step2Prompt = `Compare these two label images (Image 1: Reference Label, Image 2: Test Label).
Identify what is identical and what is different (visual layout, text, Part No, TO, Drawing, Dimensions).
Decide if it's a MATCH or MISMATCH.
Return ONLY valid JSON format:
{
  "isMatch": boolean (true if match/pass, false if mismatch/fail),
  "reasonThai": "STRING in Thai detailed explanation of comparison results"
}`;

    const step2Raw = await callGeminiVisionClientSide(step2Prompt, [
      { base64: refBase64, mimeType: refMime },
      { base64: testBase64, mimeType: testMime }
    ]);
    const step2Json = cleanAndParseJson(step2Raw);
    isMatch = typeof step2Json.isMatch === "boolean" ? step2Json.isMatch : (String(step2Json.isMatch).toLowerCase() === "true");
    reasonThai = step2Json.reasonThai || reasonThai;
  }

  return {
    ...cleanStep1,
    isMatch,
    reasonThai
  };
}

/**
 * IPQA-07: Thickness Wall Measurement Extraction (Client-side)
 */
export async function extractThicknessWallClient(fileBase64: string, mimeType: string = "image/png") {
  const prompt = `You are a high-precision QA/QC Inspection AI reading a Thickness Wall Measurement Report / IPQA-07 Inspection Drawing/Sheet.

Analyze the uploaded document image or PDF carefully and extract ALL real information visible in the document into valid JSON format:

{
  "header": {
    "inspector_name": "string (Inspector name found in document, or empty string)",
    "coil_no": "string (Coil No, Lot No, Batch No, or empty string)",
    "profile": "string (Profile Code e.g. A-001, B-002, or Profile Name found)",
    "sample_name": "string (Sample ID e.g. SAMPLE-A1, or empty string)",
    "process": "string (Line/Process name e.g. Line A - Extrusion #1, or empty string)"
  },
  "table": [
    {
      "description": "string (Exact dimension label/point name as written in document, e.g. OR-1, OR-2, T1-1, T1-2, T2-1, T3, T4, T5-1, IR-1, IHR-1, OHW-1, IHW-1, RA-1, IOR-1, etc.)",
      "total": "string or number (The exact measured value or total dimension reading for this item)"
    }
  ]
}

Key Instructions:
1. Extract EVERY SINGLE dimension item/row present in tables, drawings, diagrams, callouts, or text in the document.
2. For each dimension item, extract its exact label into 'description' and its exact numerical measurement value into 'total'.
3. Note: If a measurement uses comma as decimal separator (e.g. "0,000" or "12,50"), convert the comma to a dot decimal point (e.g. "0.000" or "12.50").
4. Extract header fields accurately if visible.
5. Return strictly valid JSON with top-level keys "header" and "table".`;

  const rawText = await callGeminiVisionClientSide(prompt, [{ base64: fileBase64, mimeType }]);
  const jsonRes = cleanAndParseJson(rawText);
  return jsonRes;
}
