import { CuttingCustomPointSpec, CuttingProfileSpec } from '../types';

/**
 * Safely evaluates standard arithmetic expressions containing numbers, +, -, *, /, (, )
 * without using eval() or Function().
 */
export function evaluateMathString(rawExpr: string): number | null {
  if (!rawExpr || typeof rawExpr !== 'string') return null;

  // Clean expression: normalize spaces and common math symbols
  const expr = rawExpr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '') // remove thousand separators if any
    .trim();

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
}

/**
 * Builds a list of available variable candidates from header/profile info
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
  }
): AvailablePointVariable[] {
  const vars: AvailablePointVariable[] = [];

  // 1. Standard points
  vars.push({
    id: 'length',
    key: 'length',
    name: 'Length',
    displayName: headerInfo.lengthName || 'ความยาว (Length)',
    unit: 'mm',
    target: headerInfo.lengthTarget,
    currentValue: currentRowValues?.length,
    isStandard: true
  });

  vars.push({
    id: 'width',
    key: 'width',
    name: 'Width',
    displayName: headerInfo.widthName || 'ความกว้าง (Width)',
    unit: 'mm',
    target: headerInfo.widthTarget,
    currentValue: currentRowValues?.width,
    isStandard: true
  });

  vars.push({
    id: 'height',
    key: 'height',
    name: 'Height',
    displayName: headerInfo.heightName || 'ความสูง (Height)',
    unit: 'mm',
    target: headerInfo.heightTarget,
    currentValue: currentRowValues?.height,
    isStandard: true
  });

  if (headerInfo.bendingMax) {
    vars.push({
      id: 'bending',
      key: 'bending',
      name: 'Bending',
      displayName: headerInfo.bendingName || 'ความโก่ง (Bending)',
      unit: 'mm/m',
      target: headerInfo.bendingMax,
      currentValue: currentRowValues?.bending,
      isStandard: true
    });
  }

  if (headerInfo.camberMax) {
    vars.push({
      id: 'camber',
      key: 'camber',
      name: 'Camber',
      displayName: headerInfo.camberName || 'ความคด (Camber)',
      unit: 'mm/m',
      target: headerInfo.camberMax,
      currentValue: currentRowValues?.camber,
      isStandard: true
    });
  }

  if (headerInfo.twistMax) {
    vars.push({
      id: 'twist',
      key: 'twist',
      name: 'Twist',
      displayName: headerInfo.twistName || 'ความบิด (Twist)',
      unit: 'deg/m',
      target: headerInfo.twistMax,
      currentValue: currentRowValues?.twist,
      isStandard: true
    });
  }

  // 2. Custom points (exclude current point to prevent circular dependency)
  if (headerInfo.customControlPoints) {
    headerInfo.customControlPoints.forEach(cp => {
      if (currentPointId && cp.id === currentPointId) return;
      // Skip pass/fail points as they are non-numeric
      if (cp.evalType === 'pass_fail') return;

      vars.push({
        id: cp.id,
        name: cp.name,
        displayName: cp.name,
        unit: cp.unit,
        target: cp.target || cp.maxLimit || cp.minLimit,
        currentValue: currentRowValues?.customPointValues?.[cp.id],
        isStandard: false
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
  formula: string,
  variables: AvailablePointVariable[]
): FormulaEvaluationResult {
  if (!formula || !formula.trim()) {
    return { value: '', numValue: null, breakdown: '', error: 'ไม่มีสูตรคำนวณ', pendingVars: [] };
  }

  let exprWithValues = formula;
  let breakdownExpr = formula;
  const pendingVars: string[] = [];

  // Helper to find variable by name, id, or key (case-insensitive)
  const findVariable = (token: string): AvailablePointVariable | undefined => {
    const clean = token.toLowerCase().trim();
    return variables.find(v => 
      v.name.toLowerCase() === clean ||
      v.id.toLowerCase() === clean ||
      (v.key && v.key.toLowerCase() === clean) ||
      v.displayName.toLowerCase() === clean ||
      v.displayName.toLowerCase().includes(`(${clean})`) ||
      clean.includes(v.name.toLowerCase())
    );
  };

  // 1. Process bracketed variables e.g. [Length] or [EF length]
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
        pendingVars.push(variable.name);
      } else {
        const num = parseFloat(rawVal);
        // Replace all occurrences of this exact bracket
        const escaped = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        exprWithValues = exprWithValues.replace(new RegExp(escaped, 'g'), num.toString());
        breakdownExpr = breakdownExpr.replace(new RegExp(escaped, 'g'), num.toFixed(2));
      }
    }
  } else {
    // 2. Try matching unbracketed variable names (sorted longest first to avoid partial name conflicts)
    const sortedVars = [...variables].sort((a, b) => b.name.length - a.name.length);
    for (const variable of sortedVars) {
      // Regex word match or case-insensitive boundary
      const safeName = variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-zA-Z0-9_])${safeName}([^a-zA-Z0-9_]|$)`, 'gi');
      
      if (regex.test(exprWithValues)) {
        const rawVal = variable.currentValue;
        if (rawVal === undefined || rawVal === '' || rawVal === '-' || isNaN(parseFloat(rawVal))) {
          pendingVars.push(variable.name);
        } else {
          const num = parseFloat(rawVal);
          exprWithValues = exprWithValues.replace(new RegExp(`(^|[^a-zA-Z0-9_])${safeName}([^a-zA-Z0-9_]|$)`, 'gi'), `$1${num}$2`);
          breakdownExpr = breakdownExpr.replace(new RegExp(`(^|[^a-zA-Z0-9_])${safeName}([^a-zA-Z0-9_]|$)`, 'gi'), `$1${num.toFixed(2)}$2`);
        }
      }
    }
  }

  // If any referenced variable is missing its measurement, return pending
  if (pendingVars.length > 0) {
    return {
      value: '',
      numValue: null,
      breakdown: `${formula} (รอค่า: ${pendingVars.join(', ')})`,
      error: null,
      pendingVars
    };
  }

  // Clean expression for math evaluation
  const mathResult = evaluateMathString(exprWithValues);
  if (mathResult === null || isNaN(mathResult)) {
    return {
      value: '',
      numValue: null,
      breakdown: breakdownExpr,
      error: 'รูปแบบสูตรคำนวณไม่ถูกต้อง หรือหารด้วยศูนย์',
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
  headerInfo: Partial<CuttingProfileSpec>
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
      });

      const res = evaluatePointFormula(cp.formula || '', vars);
      if (res.value) {
        updatedCustomVals[cp.id] = res.value;
      }
    }
  }

  return updatedCustomVals;
}
