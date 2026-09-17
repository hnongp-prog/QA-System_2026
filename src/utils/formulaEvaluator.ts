import { CuttingCustomPointSpec, CuttingProfileSpec } from '../types';

/**
 * Cleans a formula expression by stripping assignments (e.g. "L inside = ...")
 * and normalizing unicode math operators.
 */
export function cleanFormulaExpression(rawFormula: string): string {
  if (!rawFormula || typeof rawFormula !== 'string') return '';
  let cleaned = rawFormula.trim();
  // Strip assignment like "L inside = [Length] - [EF length]" or "fx = ..."
  cleaned = cleaned.replace(/^[^=]+=\s*/, '');
  // Normalize symbols
  cleaned = cleaned
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/,/g, '')
    .trim();
  return cleaned;
}

/**
 * Safely evaluates standard arithmetic expressions containing numbers, +, -, *, /, (, )
 * without using eval() or Function().
 */
export function evaluateMathString(rawExpr: string): number | null {
  if (!rawExpr || typeof rawExpr !== 'string') return null;

  // Clean expression: normalize spaces, assignments, and math symbols
  const expr = cleanFormulaExpression(rawExpr);

  if (!expr) return null;

  // Tokenize
  const tokens: string[] = [];
  let i = 0;
  let expectUnary = true; // start of expr or after operator / open paren means a minus is unary

  while (i < expr.length) {
    const char = expr[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (char === '+' || char === '*' || char === '/' || char === '(' || char === ')') {
      tokens.push(char);
      expectUnary = char !== ')';
      i++;
      continue;
    }

    if (char === '-') {
      if (expectUnary) {
        // Unary minus: check if next characters form a number
        let numStr = '-';
        i++;
        while (i < expr.length && (/[0-9.]/.test(expr[i]))) {
          numStr += expr[i];
          i++;
        }
        if (numStr === '-') {
          // It's a unary operator before parenthesis e.g. -(2+3)
          tokens.push('-1');
          tokens.push('*');
        } else {
          tokens.push(numStr);
        }
        expectUnary = false;
        continue;
      } else {
        tokens.push('-');
        expectUnary = true;
        i++;
        continue;
      }
    }

    if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      tokens.push(numStr);
      expectUnary = false;
      continue;
    }

    // Invalid character
    return null;
  }

  // Shunting-yard algorithm to convert infix to postfix (RPN)
  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2
  };

  const outputQueue: string[] = [];
  const operatorStack: string[] = [];

  for (const token of tokens) {
    if (!isNaN(Number(token))) {
      outputQueue.push(token);
    } else if (token in precedence) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] in precedence &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      let foundOpen = false;
      while (operatorStack.length > 0) {
        const top = operatorStack.pop()!;
        if (top === '(') {
          foundOpen = true;
          break;
        }
        outputQueue.push(top);
      }
      if (!foundOpen) return null; // Mismatched parentheses
    } else {
      return null;
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op === '(' || op === ')') return null; // Mismatched parentheses
    outputQueue.push(op);
  }

  // Evaluate RPN
  const evalStack: number[] = [];

  for (const token of outputQueue) {
    if (!isNaN(Number(token))) {
      evalStack.push(Number(token));
    } else {
      if (evalStack.length < 2) return null;
      const b = evalStack.pop()!;
      const a = evalStack.pop()!;
      let res = 0;
      switch (token) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          if (b === 0) return null; // Division by zero
          res = a / b;
          break;
        default:
          return null;
      }
      evalStack.push(res);
    }
  }

  if (evalStack.length !== 1) return null;
  const result = evalStack[0];
  return isFinite(result) ? result : null;
}

/**
 * Extracts variable names from formula, e.g. "[Length] - [EF length]" -> ["Length", "EF length"]
 */
export function extractFormulaVariables(formula: string): string[] {
  if (!formula) return [];
  const matches = formula.match(/\[([^\]]+)\]/g);
  if (matches) {
    const list = matches.map(m => m.slice(1, -1).trim()).filter(Boolean);
    return Array.from(new Set(list));
  }
  return [];
}

export interface AvailablePointVariable {
  id: string;
  key?: string;
  name: string;
  displayName: string;
  unit?: string;
  target?: string;
  currentValue?: string;
  isStandard?: boolean;
  order?: number;
  aliases?: string[];
}

export const STANDARD_POINT_ALIASES: Record<string, string[]> = {
  length: [
    'length', 'lenght', 'l', 'len', 'cut length', 'cutlength', 'cut_length', 'cut-length', 'cutlen', 'cut',
    'ความยาว', 'ความยาวตัด', 'ความยาวตัดท่อน', 'ความยาวตัด l', 'ตัดท่อน', 'ยาว', 'ระยะยาว'
  ],
  width: [
    'width', 'widht', 'wigth', 'w', 'w1', 'wid', 'main width',
    'ความกว้าง', 'ความกว้างหน้าตัด', 'ความกว้าง w', 'กว้าง', 'ระยะกว้าง', 'หน้ากว้าง'
  ],
  height: [
    'height', 'heigth', 'h', 'h1', 'hei', 'main height',
    'ความสูง', 'ความสูงชิ้นงาน', 'ความสูง h', 'สูง', 'ระยะสูง'
  ],
  bending: [
    'bending', 'bend', 'b',
    'ความโก่ง', 'โก่ง', 'ความแอ่น', 'แอ่น', 'ความแอ่นแนวระนาบ', 'ความโก่ง bending'
  ],
  camber: [
    'camber', 'cam', 'c',
    'ความคด', 'คด', 'ความคดงอ', 'ความคดงอแนวแกน', 'ความคด camber'
  ],
  twist: [
    'twist', 't',
    'ความบิด', 'บิด', 'องศาการบิดตัว', 'การบิด', 'ความบิด twist'
  ]
};

/**
 * Builds rich, deduplicated aliases for a control point (standard or custom)
 */
export function buildPointAliases(
  id: string,
  name: string,
  displayName: string,
  order?: number,
  standardKey?: string,
  extraAliases: string[] = []
): string[] {
  const aliasSet = new Set<string>();

  const addClean = (s?: string) => {
    if (!s) return;
    const clean = s.trim().toLowerCase();
    if (!clean) return;
    aliasSet.add(clean);

    // Strip common emojis like 📐, 📏, 👁️, 🔍, ⚙️, etc.
    const noEmoji = clean.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    if (noEmoji && noEmoji !== clean) {
      aliasSet.add(noEmoji);
    }

    // Extract inside/outside parentheses or brackets:
    // e.g. "EF length (ระยะปลาย)" -> "EF length", "ระยะปลาย"
    // e.g. "ความยาวตัด L (Length)" -> "ความยาวตัด L", "Length", "ความยาวตัด"
    const parenMatches = clean.match(/^(.*?)\s*[\(\[]\s*(.*?)\s*[\)\]]$/);
    if (parenMatches) {
      const before = parenMatches[1].trim();
      const inside = parenMatches[2].trim();
      if (before) {
        aliasSet.add(before);
        const beforeBase = before.replace(/\s+[a-z0-9]$/i, '').trim();
        if (beforeBase && beforeBase !== before) aliasSet.add(beforeBase);
      }
      if (inside) {
        aliasSet.add(inside);
        const insideBase = inside.replace(/\s+[a-z0-9]$/i, '').trim();
        if (insideBase && insideBase !== inside) aliasSet.add(insideBase);
      }
    }

    // Common typos tolerance
    if (clean.includes('lenght')) {
      aliasSet.add(clean.replace(/lenght/g, 'length'));
    }
    if (clean.includes('widht')) {
      aliasSet.add(clean.replace(/widht/g, 'width'));
    }
    if (clean.includes('heigth')) {
      aliasSet.add(clean.replace(/heigth/g, 'height'));
    }
  };

  addClean(id);
  addClean(name);
  addClean(displayName);
  extraAliases.forEach(addClean);

  // Standard predefined aliases
  if (standardKey && STANDARD_POINT_ALIASES[standardKey]) {
    STANDARD_POINT_ALIASES[standardKey].forEach(addClean);
  }

  // Order / position aliases e.g. Point 1, P1, Col 1, จุดที่ 1, #1
  if (typeof order === 'number' && order > 0) {
    aliasSet.add(`p${order}`);
    aliasSet.add(`point${order}`);
    aliasSet.add(`point ${order}`);
    aliasSet.add(`col${order}`);
    aliasSet.add(`col ${order}`);
    aliasSet.add(`c${order}`);
    aliasSet.add(`column${order}`);
    aliasSet.add(`column ${order}`);
    aliasSet.add(`จุดที่ ${order}`);
    aliasSet.add(`จุดที่${order}`);
    aliasSet.add(`จุด ${order}`);
    aliasSet.add(`จุด${order}`);
    aliasSet.add(`#${order}`);
    aliasSet.add(String(order));
  }

  return Array.from(aliasSet);
}

/**
 * Builds a list of available variable candidates from header/profile info or active UI points
 */
export function getAvailablePointVariables(
  headerInfo: Partial<CuttingProfileSpec>,
  currentPointId?: string,
  currentRowValues?: {
    width?: string;
    height?: string;
    length?: string;
    bending?: string;
    camber?: string;
    twist?: string;
    customPointValues?: Record<string, string>;
  },
  activePoints?: Array<{
    id: string;
    name: string;
    key?: string;
    isStandard?: boolean;
    order?: number;
    unit?: string;
    target?: string;
    evalType?: string;
    isCalculated?: boolean;
    formula?: string;
  }>
): AvailablePointVariable[] {
  const vars: AvailablePointVariable[] = [];

  // Priority 1: If activePoints (the exact visible UI table columns) are provided,
  // build variables directly from the active columns.
  if (activePoints && activePoints.length > 0) {
    activePoints.forEach((ap, idx) => {
      if (currentPointId && ap.id === currentPointId) return;
      if (ap.evalType === 'pass_fail') return;

      const order = ap.order ?? (idx + 1);
      let val: string | undefined;
      if (ap.isStandard && ap.key) {
        val = (currentRowValues as any)?.[ap.key];
      } else {
        val = currentRowValues?.customPointValues?.[ap.id];
      }

      vars.push({
        id: ap.id,
        key: ap.key,
        name: ap.name,
        displayName: ap.name,
        unit: ap.unit,
        target: ap.target,
        currentValue: val,
        isStandard: ap.isStandard ?? false,
        order: order,
        aliases: buildPointAliases(ap.id, ap.name, ap.name, order, ap.key)
      });
    });
    return vars;
  }

  // Priority 2: Fallback when activePoints are not provided (e.g. previewing in profile modal)
  const customPoints = headerInfo.customControlPoints || [];
  const customNamesLower = new Set(customPoints.map(cp => cp.name.toLowerCase().trim()));
  const hasProfile = Boolean(headerInfo.name || (headerInfo as any).profileName);

  // 1. Standard points (only include if active/targeted and not shadowed by a custom point of the same name)
  const shouldIncludeLength = (!hasProfile || Boolean(headerInfo.lengthTarget && headerInfo.lengthTarget.trim() !== '')) &&
    !customNamesLower.has('length') && !customNamesLower.has('ความยาว') && !customNamesLower.has('ความยาวตัด (length)');

  if (shouldIncludeLength) {
    const lengthOrder = headerInfo.lengthOrder ?? 3;
    vars.push({
      id: 'length',
      key: 'length',
      name: 'Length',
      displayName: headerInfo.lengthName || 'ความยาวตัด (Length)',
      unit: 'mm',
      target: headerInfo.lengthTarget,
      currentValue: currentRowValues?.length,
      isStandard: true,
      order: lengthOrder,
      aliases: buildPointAliases('length', 'Length', headerInfo.lengthName || 'ความยาวตัด (Length)', lengthOrder, 'length')
    });
  }

  const shouldIncludeWidth = (!hasProfile || Boolean(headerInfo.widthTarget && headerInfo.widthTarget.trim() !== '')) &&
    !customNamesLower.has('width') && !customNamesLower.has('ความกว้าง') && !customNamesLower.has('ความกว้าง w (width)');

  if (shouldIncludeWidth) {
    const widthOrder = headerInfo.widthOrder ?? 1;
    vars.push({
      id: 'width',
      key: 'width',
      name: 'Width',
      displayName: headerInfo.widthName || 'ความกว้าง W (Width)',
      unit: 'mm',
      target: headerInfo.widthTarget,
      currentValue: currentRowValues?.width,
      isStandard: true,
      order: widthOrder,
      aliases: buildPointAliases('width', 'Width', headerInfo.widthName || 'ความกว้าง W (Width)', widthOrder, 'width')
    });
  }

  const shouldIncludeHeight = (!hasProfile || Boolean(headerInfo.heightTarget && headerInfo.heightTarget.trim() !== '')) &&
    !customNamesLower.has('height') && !customNamesLower.has('ความสูง') && !customNamesLower.has('ความสูง h (height)');

  if (shouldIncludeHeight) {
    const heightOrder = headerInfo.heightOrder ?? 2;
    vars.push({
      id: 'height',
      key: 'height',
      name: 'Height',
      displayName: headerInfo.heightName || 'ความสูง H (Height)',
      unit: 'mm',
      target: headerInfo.heightTarget,
      currentValue: currentRowValues?.height,
      isStandard: true,
      order: heightOrder,
      aliases: buildPointAliases('height', 'Height', headerInfo.heightName || 'ความสูง H (Height)', heightOrder, 'height')
    });
  }

  if (headerInfo.bendingMax && !customNamesLower.has('bending') && !customNamesLower.has('ความโก่ง') && !customNamesLower.has('ความโก่ง (bending)')) {
    const bendingOrder = headerInfo.bendingOrder ?? 6;
    vars.push({
      id: 'bending',
      key: 'bending',
      name: 'Bending',
      displayName: headerInfo.bendingName || 'ความโก่ง (Bending)',
      unit: 'mm/m',
      target: headerInfo.bendingMax,
      currentValue: currentRowValues?.bending,
      isStandard: true,
      order: bendingOrder,
      aliases: buildPointAliases('bending', 'Bending', headerInfo.bendingName || 'ความโก่ง (Bending)', bendingOrder, 'bending')
    });
  }

  if (headerInfo.camberMax && !customNamesLower.has('camber') && !customNamesLower.has('ความคด') && !customNamesLower.has('ความคด (camber)')) {
    const camberOrder = headerInfo.camberOrder ?? 7;
    vars.push({
      id: 'camber',
      key: 'camber',
      name: 'Camber',
      displayName: headerInfo.camberName || 'ความคด (Camber)',
      unit: 'mm/m',
      target: headerInfo.camberMax,
      currentValue: currentRowValues?.camber,
      isStandard: true,
      order: camberOrder,
      aliases: buildPointAliases('camber', 'Camber', headerInfo.camberName || 'ความคด (Camber)', camberOrder, 'camber')
    });
  }

  if (headerInfo.twistMax && !customNamesLower.has('twist') && !customNamesLower.has('ความบิด') && !customNamesLower.has('ความบิด (twist)')) {
    const twistOrder = headerInfo.twistOrder ?? 8;
    vars.push({
      id: 'twist',
      key: 'twist',
      name: 'Twist',
      displayName: headerInfo.twistName || 'ความบิด (Twist)',
      unit: 'deg/m',
      target: headerInfo.twistMax,
      currentValue: currentRowValues?.twist,
      isStandard: true,
      order: twistOrder,
      aliases: buildPointAliases('twist', 'Twist', headerInfo.twistName || 'ความบิด (Twist)', twistOrder, 'twist')
    });
  }

  // 2. Custom points (exclude current point to prevent circular dependency)
  if (headerInfo.customControlPoints) {
    headerInfo.customControlPoints.forEach((cp, idx) => {
      if (currentPointId && cp.id === currentPointId) return;
      // Skip pass/fail points as they are non-numeric
      if (cp.evalType === 'pass_fail') return;

      const cpOrder = cp.order ?? (4 + idx);
      const extraList: string[] = [];
      if (cp.description) extraList.push(cp.description);

      vars.push({
        id: cp.id,
        name: cp.name,
        displayName: cp.name,
        unit: cp.unit,
        target: cp.target || cp.maxLimit || cp.minLimit,
        currentValue: currentRowValues?.customPointValues?.[cp.id],
        isStandard: false,
        order: cpOrder,
        aliases: buildPointAliases(cp.id, cp.name, cp.name, cpOrder, undefined, extraList)
      });
    });
  }

  return vars;
}

/**
 * Result of evaluating a formula for a given row
 */
export interface FormulaEvaluationResult {
  value: string;
  numValue: number | null;
  breakdown: string;
  error: string | null;
  pendingVars: string[];
}

/**
 * Evaluates formula for a single inspection row
 */
export function evaluatePointFormula(
  rawFormula: string,
  variables: AvailablePointVariable[]
): FormulaEvaluationResult {
  const formula = cleanFormulaExpression(rawFormula);
  if (!formula) {
    return { value: '', numValue: null, breakdown: '', error: 'ไม่มีสูตรคำนวณ', pendingVars: [] };
  }

  let exprWithValues = formula;
  let breakdownExpr = formula;
  const pendingVars: string[] = [];

  // Helper to pick the best candidate among multiple matches
  const pickBestCandidate = (candidates: AvailablePointVariable[]): AvailablePointVariable | undefined => {
    if (candidates.length === 0) return undefined;
    if (candidates.length === 1) return candidates[0];

    // 1. Prefer candidate that currently has a valid numeric value in this row
    const withValue = candidates.find(v => 
      v.currentValue !== undefined && 
      v.currentValue !== '' && 
      v.currentValue !== '-' && 
      !isNaN(parseFloat(v.currentValue))
    );
    if (withValue) return withValue;

    // 2. Prefer custom point over standard point (user explicitly defined custom points)
    const custom = candidates.find(v => !v.isStandard);
    if (custom) return custom;

    // 3. Fallback to first
    return candidates[0];
  };

  // Helper to find variable by token (case-insensitive, alias-matched, order-matched, non-shadowing)
  const findVariable = (token: string): AvailablePointVariable | undefined => {
    const clean = token.toLowerCase().trim();
    if (!clean) return undefined;

    // Level 1: Exact in aliases, id, key, or names
    const level1Matches: AvailablePointVariable[] = [];
    for (const v of variables) {
      if (
        v.id.toLowerCase() === clean ||
        (v.key && v.key.toLowerCase() === clean) ||
        v.name.toLowerCase() === clean ||
        v.displayName.toLowerCase() === clean ||
        (v.aliases && v.aliases.includes(clean))
      ) {
        level1Matches.push(v);
      }
    }
    if (level1Matches.length > 0) {
      return pickBestCandidate(level1Matches);
    }

    // Level 2: Point index / column number match e.g. "3", "p3", "point 3", "จุดที่ 3", "#3"
    const numMatch = clean.match(/^(?:point\s*|จุดที่\s*|จุด\s*|p|col(?:umn)?\s*|c|#)?(\d+)$/i);
    if (numMatch) {
      const targetOrder = parseInt(numMatch[1], 10);
      const foundByOrder = variables.filter(v => v.order === targetOrder);
      if (foundByOrder.length > 0) return pickBestCandidate(foundByOrder);
    }

    // Level 3: Normalized typo match (remove spaces, hyphens, non-alphanumeric/non-thai)
    const normClean = clean.replace(/[^a-z0-9ก-๙]/gi, '');
    if (normClean) {
      const level3Matches: AvailablePointVariable[] = [];
      for (const v of variables) {
        const normId = v.id.replace(/[^a-z0-9ก-๙]/gi, '').toLowerCase();
        const normName = v.name.replace(/[^a-z0-9ก-๙]/gi, '').toLowerCase();
        if (normId === normClean || normName === normClean) {
          level3Matches.push(v);
          continue;
        }
        if (v.aliases) {
          for (const a of v.aliases) {
            if (a.replace(/[^a-z0-9ก-๙]/gi, '').toLowerCase() === normClean) {
              level3Matches.push(v);
              break;
            }
          }
        }
      }
      if (level3Matches.length > 0) {
        return pickBestCandidate(level3Matches);
      }
    }

    // Level 4: Word overlap similarity (safe matching without false single-word triggers)
    const tokenWords = clean.replace(/[^a-z0-9ก-๙]/gi, ' ').split(/\s+/).filter(w => w.length > 0);
    if (tokenWords.length > 0) {
      let bestCandidate: AvailablePointVariable | undefined;
      let bestScore = 0;

      for (const v of variables) {
        const checkStrings = [v.name.toLowerCase(), v.displayName.toLowerCase(), ...(v.aliases || [])];
        for (const s of checkStrings) {
          const targetWords = s.replace(/[^a-z0-9ก-๙]/gi, ' ').split(/\s+/).filter(w => w.length > 0);
          if (targetWords.length === 0) continue;
          
          const commonWords = tokenWords.filter(w => targetWords.includes(w)).length;
          const score = commonWords / Math.max(tokenWords.length, targetWords.length);

          // Require at least 65% word overlap to avoid false positive shadowing
          if (score >= 0.65 && score > bestScore) {
            bestScore = score;
            bestCandidate = v;
          }
        }
      }

      if (bestCandidate) return bestCandidate;
    }

    return undefined;
  };

  // 1. Process bracketed variables e.g. [Length] or [EF length] or [ความยาวตัด]
  const bracketMatches = formula.match(/\[([^\]]+)\]/g);
  if (bracketMatches && bracketMatches.length > 0) {
    for (const match of bracketMatches) {
      const varName = match.slice(1, -1).trim();
      const variable = findVariable(varName);

      if (!variable) {
        return {
          value: '',
          numValue: null,
          breakdown: formula,
          error: `ไม่พบจุดวัดชื่อ: ${varName}`,
          pendingVars: [varName]
        };
      }

      const rawVal = variable.currentValue;
      if (rawVal === undefined || rawVal === '' || rawVal === '-' || isNaN(parseFloat(rawVal))) {
        pendingVars.push(variable.displayName || variable.name);
      } else {
        const num = parseFloat(rawVal);
        const escaped = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Wrap number in parentheses to avoid adjacent sign issues
        exprWithValues = exprWithValues.replace(new RegExp(escaped, 'g'), `(${num})`);
        breakdownExpr = breakdownExpr.replace(new RegExp(escaped, 'g'), num.toFixed(2));
      }
    }
  } else {
    // 2. Process unbracketed variables (e.g. "Length - EF length" or "ความยาวตัด - ระยะปลาย")
    // Collect all candidate (alias, variable) pairs and sort by alias length DESCENDING
    const allPairs: { alias: string; variable: AvailablePointVariable }[] = [];
    for (const v of variables) {
      const uniqueAliases = new Set<string>([
        v.name,
        v.displayName,
        ...(v.aliases || [])
      ]);
      for (const a of uniqueAliases) {
        if (a && a.length >= 1) {
          allPairs.push({ alias: a, variable: v });
        }
      }
    }

    allPairs.sort((a, b) => b.alias.length - a.alias.length);

    const replacedTokens = new Set<string>();

    for (const { alias: candName, variable } of allPairs) {
      const safeName = candName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Boundary matching: letters, numbers, underscore, and Thai unicode characters
      const regex = new RegExp(`(^|[^a-zA-Z0-9_ก-๙])${safeName}([^a-zA-Z0-9_ก-๙]|$)`, 'gi');

      if (regex.test(exprWithValues)) {
        if (replacedTokens.has(variable.id)) continue;
        replacedTokens.add(variable.id);

        const rawVal = variable.currentValue;
        if (rawVal === undefined || rawVal === '' || rawVal === '-' || isNaN(parseFloat(rawVal))) {
          if (!pendingVars.includes(variable.displayName || variable.name)) {
            pendingVars.push(variable.displayName || variable.name);
          }
        } else {
          const num = parseFloat(rawVal);
          exprWithValues = exprWithValues.replace(regex, `$1(${num})$2`);
          breakdownExpr = breakdownExpr.replace(regex, `$1${num.toFixed(2)}$2`);
        }
      }
    }
  }

  // If any referenced variable is missing its measurement, return pending
  if (pendingVars.length > 0) {
    const uniquePending = Array.from(new Set(pendingVars));
    return {
      value: '',
      numValue: null,
      breakdown: `${formula} (รอค่า: ${uniquePending.join(', ')})`,
      error: null,
      pendingVars: uniquePending
    };
  }

  // Evaluate math expression
  const mathResult = evaluateMathString(exprWithValues);
  if (mathResult === null || isNaN(mathResult)) {
    return {
      value: '',
      numValue: null,
      breakdown: breakdownExpr,
      error: 'รูปแบบสูตรคำนวณไม่ถูกต้อง หรือมีตัวแปรที่ยังไม่ได้แทนค่า',
      pendingVars: []
    };
  }

  // Format to 2 decimal places (standard engineering precision in cutting)
  const formattedVal = (Math.round(mathResult * 100) / 100).toFixed(2);
  return {
    value: formattedVal,
    numValue: mathResult,
    breakdown: `${breakdownExpr} = ${formattedVal}`,
    error: null,
    pendingVars: []
  };
}

/**
 * Generates a preview string using target values of points to test formula in the spec editor
 */
export function previewFormulaWithTargets(
  formula: string,
  variables: AvailablePointVariable[]
): { previewText: string; isSuccess: boolean; resultNum: number | null } {
  if (!formula || !formula.trim()) {
    return { previewText: 'กรุณากรอกสูตรคำนวณ', isSuccess: false, resultNum: null };
  }

  // Map targets as values
  const varsWithTargets = variables.map(v => ({
    ...v,
    currentValue: v.target || '10.00' // fallback test number if no target
  }));

  const res = evaluatePointFormula(formula, varsWithTargets);
  if (res.error) {
    return { previewText: `⚠️ ข้อผิดพลาด: ${res.error}`, isSuccess: false, resultNum: null };
  }
  if (res.pendingVars.length > 0) {
    return {
      previewText: `รอค่าตัวแปร: ${res.pendingVars.join(', ')}`,
      isSuccess: false,
      resultNum: null
    };
  }

  return {
    previewText: `ตัวอย่างคำนวณ: ${res.breakdown}`,
    isSuccess: true,
    resultNum: res.numValue
  };
}

/**
 * Recalculates all calculated points in a row in dependency order
 */
export function computeRowCalculatedPoints(
  item: {
    width: string;
    height: string;
    length: string;
    bending?: string;
    camber?: string;
    twist?: string;
    customPointValues?: Record<string, string>;
  },
  customPoints: CuttingCustomPointSpec[],
  headerInfo: Partial<CuttingProfileSpec>,
  activePoints?: Array<{
    id: string;
    name: string;
    key?: string;
    isStandard?: boolean;
    order?: number;
    unit?: string;
    target?: string;
    evalType?: string;
    isCalculated?: boolean;
    formula?: string;
  }>
): Record<string, string> {
  const updatedCustomVals: Record<string, string> = { ...(item.customPointValues || {}) };
  const calculatedPoints = customPoints.filter(cp => cp.isCalculated && cp.formula);

  if (calculatedPoints.length === 0) {
    return updatedCustomVals;
  }

  // Multiple passes to resolve nested calculations (e.g., C depends on B, which depends on A)
  for (let pass = 0; pass < 3; pass++) {
    for (const cp of calculatedPoints) {
      const vars = getAvailablePointVariables(headerInfo, cp.id, {
        width: item.width,
        height: item.height,
        length: item.length,
        bending: item.bending,
        camber: item.camber,
        twist: item.twist,
        customPointValues: updatedCustomVals
      }, activePoints);

      const res = evaluatePointFormula(cp.formula || '', vars);
      if (res.value) {
        updatedCustomVals[cp.id] = res.value;
      } else if (res.pendingVars.length > 0) {
        updatedCustomVals[cp.id] = '';
      }
    }
  }

  return updatedCustomVals;
}
