import { RegressionResult, CoefficientDetail } from '../types/econometrics';

/**
 * Mathematical & Econometric Engine for Multiple Linear Regression (OLS)
 * Pure TypeScript implementation of matrix operations, OLS estimation,
 * hypothesis testing, ANOVA, and VIF calculation.
 */

// --- MATRIX OPERATIONS ---

export function transpose(A: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0].length;
  const AT: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      AT[j][i] = A[i][j];
    }
  }
  return AT;
}

export function multiply(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const rowsB = B.length;
  const colsB = B[0].length;

  if (colsA !== rowsB) {
    throw new Error(`Matrix dimensions mismatch: ${rowsA}x${colsA} * ${rowsB}x${colsB}`);
  }

  const result: number[][] = Array.from({ length: rowsA }, () => new Array(colsB).fill(0));
  for (let i = 0; i < rowsA; i++) {
    for (let k = 0; k < colsA; k++) {
      const a_ik = A[i][k];
      if (a_ik !== 0) {
        for (let j = 0; j < colsB; j++) {
          result[i][j] += a_ik * B[k][j];
        }
      }
    }
  }
  return result;
}

export function multiplyMatrixVector(A: number[][], v: number[]): number[] {
  const rows = A.length;
  const cols = A[0].length;
  if (cols !== v.length) {
    throw new Error(`Matrix-vector mismatch: ${rows}x${cols} * ${v.length}`);
  }
  const result = new Array(rows).fill(0);
  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += A[i][j] * v[j];
    }
    result[i] = sum;
  }
  return result;
}

/**
 * Matrix inversion using Gauss-Jordan elimination with partial pivoting.
 * Includes ridge stabilization if singular or near-singular.
 */
export function invertMatrix(M: number[][], ridgeLambda: number = 0): number[][] {
  const n = M.length;
  if (n === 0 || M[0].length !== n) {
    throw new Error('Matrix must be square for inversion');
  }

  // Clone and augment with identity matrix
  const A: number[][] = Array.from({ length: n }, (_, i) => {
    const row = new Array(2 * n).fill(0);
    for (let j = 0; j < n; j++) {
      row[j] = M[i][j] + (i === j ? ridgeLambda : 0);
    }
    row[n + i] = 1.0;
    return row;
  });

  for (let i = 0; i < n; i++) {
    // Partial pivoting
    let maxRow = i;
    let maxVal = Math.abs(A[i][i]);
    for (let k = i + 1; k < n; k++) {
      const val = Math.abs(A[k][i]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = k;
      }
    }

    if (maxVal < 1e-12) {
      if (ridgeLambda === 0) {
        // Retry with small L2 ridge stabilization to handle multicollinearity
        return invertMatrix(M, 1e-6);
      }
      throw new Error('Matriz singular: existe multicolinealidad perfecta o variables colineales.');
    }

    // Swap rows
    if (maxRow !== i) {
      const temp = A[i];
      A[i] = A[maxRow];
      A[maxRow] = temp;
    }

    // Normalize pivot row
    const pivot = A[i][i];
    for (let j = 0; j < 2 * n; j++) {
      A[i][j] /= pivot;
    }

    // Eliminate other rows
    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = A[r][i];
        if (factor !== 0) {
          for (let c = 0; c < 2 * n; c++) {
            A[r][c] -= factor * A[i][c];
          }
        }
      }
    }
  }

  // Extract right half
  const inv: number[][] = Array.from({ length: n }, (_, i) => A[i].slice(n));
  return inv;
}

// --- STATISTICAL DISTRIBUTIONS (Student's t and Fisher's F p-values) ---

/**
 * Log Gamma function approximation (Lanczos approximation)
 */
function logGamma(z: number): number {
  const p = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.138571095857209,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    x += p[i] / (z + i + 1);
  }
  const t = z + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Continued fraction for regularized incomplete beta function
 */
function betaContinuedFraction(a: number, b: number, x: number): number {
  const maxIterations = 200;
  const epsilon = 1e-12;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;

  let c = 1.0;
  let d = 1.0 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1.0 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1.0 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1.0 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1.0 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1.0 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1.0) < epsilon) break;
  }
  return h;
}

/**
 * Regularized incomplete beta function I_x(a, b)
 */
export function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x < 0 || x > 1) return 0;
  if (x === 0) return 0;
  if (x === 1) return 1;

  const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const factor = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta);

  if (x < (a + 1) / (a + b + 2)) {
    return (factor * betaContinuedFraction(a, b, x)) / a;
  } else {
    return 1 - (factor * betaContinuedFraction(b, a, 1 - x)) / b;
  }
}

/**
 * Student's t two-tailed p-value given t statistic and degrees of freedom df
 */
export function studentTPValue(t: number, df: number): number {
  if (isNaN(t) || isNaN(df) || df <= 0) return 1.0;
  const absT = Math.abs(t);
  const x = df / (df + absT * absT);
  const pOneTailed = 0.5 * regularizedIncompleteBeta(x, df / 2, 0.5);
  const pTwoTailed = Math.min(1.0, Math.max(0.0, 2 * pOneTailed));
  return Number.isFinite(pTwoTailed) ? pTwoTailed : 0.0001;
}

/**
 * Fisher-Snedecor F-distribution upper tail p-value P(F > f)
 */
export function fDistributionPValue(f: number, df1: number, df2: number): number {
  if (isNaN(f) || f <= 0 || df1 <= 0 || df2 <= 0) return 1.0;
  const x = df2 / (df2 + df1 * f);
  const p = regularizedIncompleteBeta(x, df2 / 2, df1 / 2);
  return Number.isFinite(p) ? Math.min(1.0, Math.max(0.0, p)) : 0.0001;
}

// --- VARIANCE INFLATION FACTOR (VIF) ---

/**
 * Computes VIF for each predictor in XMatrix
 */
export function calculateVIFs(XData: number[][], predictorNames: string[]): Record<string, number> {
  const p = predictorNames.length;
  const n = XData.length;
  const vifs: Record<string, number> = {};

  if (p <= 1 || n <= p + 2) {
    predictorNames.forEach(name => { vifs[name] = 1.0; });
    return vifs;
  }

  for (let j = 0; j < p; j++) {
    const currentName = predictorNames[j];
    const ySub = XData.map(row => row[j]);
    const otherIndices = Array.from({ length: p }, (_, k) => k).filter(k => k !== j);
    const xOther = XData.map(row => otherIndices.map(idx => row[idx]));
    const otherNames = otherIndices.map(idx => predictorNames[idx]);

    try {
      const subRegression = fitOLS(ySub, xOther, currentName, otherNames);
      const r2 = Math.min(0.9999, Math.max(0, subRegression.r2));
      const vif = 1 / (1 - r2);
      vifs[currentName] = Number.isFinite(vif) ? Math.round(vif * 100) / 100 : 99.9;
    } catch {
      vifs[currentName] = 1.0;
    }
  }

  return vifs;
}

// --- ORDINARY LEAST SQUARES (OLS) REGRESSION ENGINE ---

/**
 * Fits Ordinary Least Squares (OLS) Multiple Linear Regression
 * Y = X * Beta + epsilon
 * Beta = (X^T * X)^(-1) * X^T * Y
 */
export function fitOLS(
  y: number[],
  X: number[][],
  targetName: string,
  predictorNames: string[]
): RegressionResult {
  const n = y.length;
  const p = predictorNames.length;

  if (n <= p + 1) {
    throw new Error(`Número insuficiente de observaciones (${n}) para ${p} variables predictoras. Se requieren al menos ${p + 2} filas.`);
  }

  // Construct design matrix X_design with intercept column of 1's
  const X_design: number[][] = Array.from({ length: n }, (_, i) => [1.0, ...X[i]]);
  const k = p + 1; // number of parameters including intercept

  // 1. X^T
  const XT = transpose(X_design);

  // 2. X^T * X (k x k)
  const XTX = multiply(XT, X_design);

  // 3. (X^T * X)^(-1)
  const XTX_inv = invertMatrix(XTX);

  // 4. X^T * Y (k x 1)
  const Y_col: number[][] = y.map(val => [val]);
  const XTY = multiply(XT, Y_col);

  // 5. Beta = (X^T * X)^(-1) * X^T * Y
  const BetaMatrix = multiply(XTX_inv, XTY);
  const beta = BetaMatrix.map(row => row[0]);

  // 6. Fitted values & residuals
  const predictions: number[] = new Array(n);
  const residuals: number[] = new Array(n);
  let ssr = 0; // Sum of squared residuals
  let sumY = 0;

  for (let i = 0; i < n; i++) {
    let yHat = beta[0]; // intercept
    for (let j = 0; j < p; j++) {
      yHat += beta[j + 1] * X[i][j];
    }
    predictions[i] = yHat;
    const res = y[i] - yHat;
    residuals[i] = res;
    ssr += res * res;
    sumY += y[i];
  }

  const meanY = sumY / n;
  let sst = 0; // Total sum of squares
  let sse = 0; // Explained sum of squares
  let sumAbsResidual = 0;

  for (let i = 0; i < n; i++) {
    const diff = y[i] - meanY;
    sst += diff * diff;
    sse += (predictions[i] - meanY) ** 2;
    sumAbsResidual += Math.abs(residuals[i]);
  }

  if (sst === 0) sst = 1e-10;

  // Degrees of freedom
  const dfResidual = n - k;
  const dfModel = p;

  // Residual variance: s^2 = SSR / (n - k)
  const residualVariance = ssr / dfResidual;
  const residualStdError = Math.sqrt(Math.max(0, residualVariance));

  // Metrics
  const r2 = Math.max(0, Math.min(1, 1 - ssr / sst));
  const adjustedR2 = Math.max(0, 1 - ((ssr / dfResidual) / (sst / (n - 1))));
  const rmse = Math.sqrt(ssr / n);
  const mae = sumAbsResidual / n;

  // Standardized residuals
  const standardizedResiduals = residuals.map(r =>
    residualStdError > 0 ? r / residualStdError : 0
  );

  // Global F-Statistic
  const msModel = sse / dfModel;
  const msResidual = ssr / dfResidual;
  const fStatistic = msResidual > 0 ? msModel / msResidual : 0;
  const fPValue = fDistributionPValue(fStatistic, dfModel, dfResidual);

  // Calculate VIFs for predictors
  const vifs = calculateVIFs(X, predictorNames);

  // Coefficient details (Intercept + Predictors)
  const coefficients: CoefficientDetail[] = [];

  // Critical t for 95% confidence interval (~1.96 for large n)
  const tCrit95 = dfResidual > 30 ? 1.96 : 2.05;

  // Intercept (beta_0)
  const se0 = Math.sqrt(Math.max(0, residualVariance * XTX_inv[0][0]));
  const t0 = se0 > 0 ? beta[0] / se0 : 0;
  const p0 = studentTPValue(t0, dfResidual);

  coefficients.push({
    variable: '(Intercept)',
    label: 'Constante (β₀)',
    beta: beta[0],
    standardError: se0,
    tStatistic: t0,
    pValue: p0,
    isSignificant: p0 < 0.05,
    confidenceInterval95: [beta[0] - tCrit95 * se0, beta[0] + tCrit95 * se0],
    businessInterpretation: `Valor base estimado de ${targetName} cuando todos los predictores son cero: ${beta[0].toLocaleString('es-ES', { maximumFractionDigits: 2 })}.`,
  });

  // Predictor coefficients
  for (let j = 0; j < p; j++) {
    const varName = predictorNames[j];
    const betaJ = beta[j + 1];
    const seJ = Math.sqrt(Math.max(0, residualVariance * XTX_inv[j + 1][j + 1]));
    const tJ = seJ > 0 ? betaJ / seJ : 0;
    const pJ = studentTPValue(tJ, dfResidual);
    const vifJ = vifs[varName] || 1.0;

    const direction = betaJ >= 0 ? 'aumenta' : 'disminuye';
    const absBetaFormatted = Math.abs(betaJ).toLocaleString('es-ES', { maximumFractionDigits: 4 });

    const businessInterpretation = `Por cada 1 unidad adicional en "${varName}", manteniendo todos los demás factores constantes (ceteris paribus), ${targetName} ${direction} en promedio ${absBetaFormatted} unidades.`;

    coefficients.push({
      variable: varName,
      label: varName,
      beta: betaJ,
      standardError: seJ,
      tStatistic: tJ,
      pValue: pJ,
      isSignificant: pJ < 0.05,
      vif: vifJ,
      confidenceInterval95: [betaJ - tCrit95 * seJ, betaJ + tCrit95 * seJ],
      businessInterpretation,
    });
  }

  // Equation formatted string
  let equation = `\\hat{Y} = ${beta[0].toFixed(3)}`;
  for (let j = 0; j < p; j++) {
    const sign = beta[j + 1] >= 0 ? '+' : '-';
    equation += ` ${sign} ${Math.abs(beta[j + 1]).toFixed(3)} \\cdot [${predictorNames[j]}]`;
  }

  return {
    targetVariable: targetName,
    predictorVariables: predictorNames,
    n,
    p,
    dfModel,
    dfResidual,
    r2,
    adjustedR2,
    rmse,
    mae,
    fStatistic,
    fPValue,
    ssr,
    sse,
    sst,
    coefficients,
    intercept: beta[0],
    equationString: equation,
    predictions,
    residuals,
    standardizedResiduals,
    actuals: y,
  };
}

/**
 * Generates a refined parsimonious model through backward elimination
 * filtering out non-significant variables (p >= 0.05).
 */
export function fitRefinedModel(
  y: number[],
  XData: number[][],
  targetName: string,
  predictorNames: string[],
  fullModelResult: RegressionResult
): RegressionResult | undefined {
  // Find predictors with p < 0.05 in the full model (excluding intercept)
  const significantNames = fullModelResult.coefficients
    .filter(c => c.variable !== '(Intercept)' && c.pValue < 0.05)
    .map(c => c.variable);

  if (significantNames.length === 0 || significantNames.length === predictorNames.length) {
    // If all are significant or none are, no distinct refined model needed
    return undefined;
  }

  const subIndices = significantNames.map(name => predictorNames.indexOf(name));
  const subX = XData.map(row => subIndices.map(idx => row[idx]));

  try {
    return fitOLS(y, subX, targetName, significantNames);
  } catch {
    return undefined;
  }
}

/**
 * Pearson correlation coefficient between two numeric vectors
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return Math.max(-1, Math.min(1, num / den));
}

/**
 * Computes full Pearson correlation matrix
 */
export function computeCorrelationMatrix(
  data: Record<string, any>[],
  numericColumns: string[]
): { columns: string[]; matrix: number[][] } {
  const k = numericColumns.length;
  const vectors: number[][] = numericColumns.map(col =>
    data.map(row => Number(row[col]) || 0)
  );

  const matrix: number[][] = Array.from({ length: k }, () => new Array(k).fill(0));

  for (let i = 0; i < k; i++) {
    matrix[i][i] = 1.0;
    for (let j = i + 1; j < k; j++) {
      const r = pearsonCorrelation(vectors[i], vectors[j]);
      matrix[i][j] = Math.round(r * 1000) / 1000;
      matrix[j][i] = matrix[i][j];
    }
  }

  return { columns: numericColumns, matrix };
}
