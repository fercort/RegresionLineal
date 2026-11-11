import { RegressionResult, ScenarioDefinition, VariableDistribution } from '../types/econometrics';
import { pearsonCorrelation } from './mathEngine';

/**
 * Calculates distribution statistics and slider bounds for a numeric variable
 */
export function calculateVariableDistribution(
  values: number[],
  name: string
): VariableDistribution {
  const sorted = [...values].filter(v => Number.isFinite(v)).sort((a, b) => a - b);
  const n = sorted.length;

  if (n === 0) {
    return {
      name,
      min: 0,
      max: 100,
      mean: 50,
      stdDev: 10,
      median: 50,
      p10: 10,
      p90: 90,
      step: 1,
    };
  }

  const min = sorted[0];
  const max = sorted[n - 1];
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;

  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  const p10 = sorted[Math.floor(n * 0.1)] ?? min;
  const p90 = sorted[Math.floor(n * 0.9)] ?? max;

  const variance = sorted.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (n > 1 ? n - 1 : 1);
  const stdDev = Math.sqrt(variance);

  // Compute clean step size for slider
  const range = max - min;
  let step = 1;
  if (range <= 1) step = 0.01;
  else if (range <= 10) step = 0.1;
  else if (range <= 100) step = 0.5;
  else if (range <= 1000) step = 5;
  else if (range <= 10000) step = 50;
  else step = 100;

  return {
    name,
    min: Math.floor(min * 100) / 100,
    max: Math.ceil(max * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    median: Math.round(median * 100) / 100,
    p10: Math.round(p10 * 100) / 100,
    p90: Math.round(p90 * 100) / 100,
    step,
  };
}

/**
 * Predicts Y given variable values and a regression model
 */
export function predictY(
  values: Record<string, number>,
  model: RegressionResult
): number {
  let yHat = model.intercept;
  for (const coef of model.coefficients) {
    if (coef.variable === '(Intercept)') continue;
    const xVal = values[coef.variable] ?? 0;
    yHat += coef.beta * xVal;
  }
  return yHat;
}

/**
 * Auxiliary linear relationship matrix between predictors:
 * Estimates how variable X_target moves when variable X_source changes by 1 unit:
 * slope = Cov(X_source, X_target) / Var(X_source)
 */
export interface AuxiliaryRelationship {
  source: string;
  target: string;
  slope: number;
  correlation: number;
}

export function buildAuxiliaryRelationships(
  data: Record<string, any>[],
  predictors: string[]
): Record<string, Record<string, AuxiliaryRelationship>> {
  const rels: Record<string, Record<string, AuxiliaryRelationship>> = {};
  const vectors: Record<string, number[]> = {};

  predictors.forEach(p => {
    vectors[p] = data.map(r => Number(r[p]) || 0);
    rels[p] = {};
  });

  for (const src of predictors) {
    const vSrc = vectors[src];
    const n = vSrc.length;
    const meanSrc = vSrc.reduce((a, b) => a + b, 0) / n;
    let varSrc = 0;
    for (let i = 0; i < n; i++) {
      varSrc += (vSrc[i] - meanSrc) ** 2;
    }

    for (const tgt of predictors) {
      if (src === tgt) continue;
      const vTgt = vectors[tgt];
      const meanTgt = vTgt.reduce((a, b) => a + b, 0) / n;
      let cov = 0;
      for (let i = 0; i < n; i++) {
        cov += (vSrc[i] - meanSrc) * (vTgt[i] - meanTgt);
      }
      const slope = varSrc > 1e-9 ? cov / varSrc : 0;
      const r = pearsonCorrelation(vSrc, vTgt);

      rels[src][tgt] = {
        source: src,
        target: tgt,
        slope,
        correlation: r,
      };
    }
  }

  return rels;
}

/**
 * Generates intelligent coherent business scenarios:
 * 1. Base (median of all variables)
 * 2. Optimistic (levers aligned to maximize target value within business reality)
 * 3. Pessimistic (stress test / market headwinds)
 * 4. High Growth (+1 StdDev on significant positive drivers)
 */
export function generateIntelligentScenarios(
  model: RegressionResult,
  distributions: Record<string, VariableDistribution>
): ScenarioDefinition[] {
  const baseValues: Record<string, number> = {};
  const optimisticValues: Record<string, number> = {};
  const pessimisticValues: Record<string, number> = {};
  const highGrowthValues: Record<string, number> = {};

  const predictors = model.predictorVariables;

  predictors.forEach(pred => {
    const dist = distributions[pred] || {
      median: 0,
      mean: 0,
      p10: 0,
      p90: 0,
      min: 0,
      max: 100,
      stdDev: 10,
    };
    const coef = model.coefficients.find(c => c.variable === pred);
    const beta = coef ? coef.beta : 0;

    // Base Scenario: Median / Typical market conditions
    baseValues[pred] = dist.median;

    // Optimistic Scenario:
    // If variable increases target (beta > 0), set to 85th/90th percentile
    // If variable decreases target (beta < 0), set to 10th percentile
    if (beta >= 0) {
      optimisticValues[pred] = dist.p90;
      pessimisticValues[pred] = dist.p10;
      highGrowthValues[pred] = Math.min(dist.max, dist.mean + 1.2 * dist.stdDev);
    } else {
      optimisticValues[pred] = dist.p10;
      pessimisticValues[pred] = dist.p90;
      highGrowthValues[pred] = Math.max(dist.min, dist.mean - 0.8 * dist.stdDev);
    }
  });

  const basePred = predictY(baseValues, model);
  const optPred = predictY(optimisticValues, model);
  const pessPred = predictY(pessimisticValues, model);
  const highGrowthPred = predictY(highGrowthValues, model);

  const calcDelta = (pred: number) => pred - basePred;
  const calcDeltaPct = (pred: number) => (basePred !== 0 ? ((pred - basePred) / Math.abs(basePred)) * 100 : 0);

  return [
    {
      id: 'base',
      name: 'Escenario Base (Tendencia Central)',
      description: 'Variables en sus valores típicos de mercado (mediana histórica observada).',
      values: baseValues,
      predictedY: basePred,
      deltaFromBase: 0,
      deltaPercentFromBase: 0,
    },
    {
      id: 'optimistic',
      name: 'Escenario Optimista (Alto Desempeño)',
      description: 'Condiciones favorables: palancas positivas en percentil 90 y factores adversos minimizados.',
      values: optimisticValues,
      predictedY: optPred,
      deltaFromBase: calcDelta(optPred),
      deltaPercentFromBase: calcDeltaPct(optPred),
    },
    {
      id: 'pessimistic',
      name: 'Escenario Pesimista (Estrés de Negocio)',
      description: 'Entorno de contracción o estrés: factores de costo elevados y demanda/tráfico en percentil 10.',
      values: pessimisticValues,
      predictedY: pessPred,
      deltaFromBase: calcDelta(pessPred),
      deltaPercentFromBase: calcDeltaPct(pessPred),
    },
    {
      id: 'high_growth',
      name: 'Expansión Agresiva (+1σ en Palancas)',
      description: 'Impulso intensivo en variables clave con alta significancia econométrica.',
      values: highGrowthValues,
      predictedY: highGrowthPred,
      deltaFromBase: calcDelta(highGrowthPred),
      deltaPercentFromBase: calcDeltaPct(highGrowthPred),
    },
  ];
}
