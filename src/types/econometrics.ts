export type ColumnType = 'numeric' | 'categorical' | 'id_or_constant';

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  totalCount: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  sampleValues: (string | number)[];
  mean?: number;
  median?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  mode?: string | number;
}

export interface DatasetState {
  rawFileName: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  data: Record<string, any>[];
  cleanedData: Record<string, any>[];
  profiles: ColumnProfile[];
}

export type ImputationStrategy = 'drop' | 'mean' | 'median' | 'mode';

export interface ImputationConfig {
  [columnName: string]: ImputationStrategy;
}

export interface DummyEncodingConfig {
  columnsToEncode: string[];
  dropFirst: boolean;
  mappings: Record<string, { categories: string[]; referenceCategory: string; dummyColumns: string[] }>;
}

export interface CoefficientDetail {
  variable: string;
  label: string;
  beta: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
  isSignificant: boolean; // p < 0.05
  vif?: number; // Variance Inflation Factor
  confidenceInterval95: [number, number];
  businessInterpretation?: string;
}

export interface RegressionResult {
  targetVariable: string;
  predictorVariables: string[];
  n: number; // Observations
  p: number; // Predictors (excluding intercept)
  dfModel: number;
  dfResidual: number;
  r2: number;
  adjustedR2: number;
  rmse: number;
  mae: number;
  fStatistic: number;
  fPValue: number;
  ssr: number; // Sum of squared residuals
  sse: number; // Explained sum of squares
  sst: number; // Total sum of squares
  coefficients: CoefficientDetail[];
  intercept: number;
  equationString: string;
  predictions: number[];
  residuals: number[];
  standardizedResiduals: number[];
  actuals: number[];
}

export interface ModelComparison {
  fullModel: RegressionResult;
  refinedModel?: RegressionResult;
  selectedModelType: 'full' | 'refined';
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  values: Record<string, number>;
  predictedY: number;
  deltaFromBase: number;
  deltaPercentFromBase: number;
}

export interface VariableDistribution {
  name: string;
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  median: number;
  p10: number;
  p90: number;
  step: number;
}

export interface GeminiAnalysisSchema {
  recommendedTarget: string;
  targetRationale: string;
  recommendedPredictors: string[];
  predictorsRationale: string;
  cautionVariables?: string[];
}

export interface GeminiEdaInsights {
  businessSummary: string;
  anomaliesOrRisks: string[];
  keyCorrelations: string[];
  dataQualityRating: 'Excelente' | 'Buena' | 'Aceptable' | 'Requiere Atención';
}

export interface GeminiStrategicReport {
  executiveSummary: string;
  businessQuestionAnswer: string;
  keyDriversRanked: { variable: string; impact: string; recommendation: string }[];
  scenarioAdvice: {
    optimisticAction: string;
    pessimisticMitigation: string;
  };
  econometricConfidence: string;
  nextSteps: string[];
}
