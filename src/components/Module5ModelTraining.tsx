import React, { useState } from 'react';
import {
  Cpu,
  ArrowRight,
  TrendingUp,
  Layers,
  HelpCircle,
  ScatterChart as ScatterIcon,
  CheckCircle,
  BarChart,
  Activity,
  AlertCircle,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { RegressionResult, ModelComparison } from '../types/econometrics';

interface Module5Props {
  modelComparison: ModelComparison;
  activeModel: RegressionResult;
  onSelectModelType: (type: 'full' | 'refined') => void;
  onProceed: () => void;
}

export const Module5ModelTraining: React.FC<Module5Props> = ({
  modelComparison,
  activeModel,
  onSelectModelType,
  onProceed,
}) => {
  const [activeTab, setActiveTab] = useState<'kpis' | 'anova' | 'diagnostics'>('kpis');

  const { fullModel, refinedModel, selectedModelType } = modelComparison;

  // Prepare scatter data for Recharts: Actual vs Predicted
  const scatterData = activeModel.actuals.map((actual, idx) => ({
    index: idx + 1,
    actual,
    predicted: Math.round(activeModel.predictions[idx] * 100) / 100,
    residual: Math.round(activeModel.residuals[idx] * 100) / 100,
    standardizedResidual: Math.round(activeModel.standardizedResiduals[idx] * 100) / 100,
  }));

  // Min and max for 45-degree reference line
  const minVal = Math.min(...activeModel.actuals, ...activeModel.predictions);
  const maxVal = Math.max(...activeModel.actuals, ...activeModel.predictions);

  // ANOVA calculations
  const anovaRows = [
    {
      source: 'Regresión (Modelo Explicado)',
      ss: activeModel.sse,
      df: activeModel.dfModel,
      ms: activeModel.dfModel > 0 ? activeModel.sse / activeModel.dfModel : 0,
      f: activeModel.fStatistic,
      p: activeModel.fPValue,
    },
    {
      source: 'Residual (Error / No Explicado)',
      ss: activeModel.ssr,
      df: activeModel.dfResidual,
      ms: activeModel.dfResidual > 0 ? activeModel.ssr / activeModel.dfResidual : 0,
      f: null,
      p: null,
    },
    {
      source: 'Total Corregido',
      ss: activeModel.sst,
      df: activeModel.n - 1,
      ms: null,
      f: null,
      p: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>Módulo 5: Estimación OLS & Diagnóstico</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Entrenamiento OLS & Comparación de Modelos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estimación por Mínimos Cuadrados Ordinarios: $(X^TX)^{'{'}-1{'}'}X^TY$. Evalúa bondad de ajuste,
            significancia individual ($t$) y global ($F$), y tabla ANOVA.
          </p>
        </div>

        <button
          onClick={onProceed}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <span>Interpretar Ecuación</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Model Comparison Selector Toggle */}
      {refinedModel && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-indigo-950">
                Comparador de Modelos Econométricos
              </p>
              <p className="text-[11px] text-indigo-700">
                Compara el modelo con todos los regresores vs. el modelo parsimonioso depurado por significancia (p &lt; 0.05).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-indigo-200 shadow-xs self-start sm:self-auto">
            <button
              onClick={() => onSelectModelType('full')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                selectedModelType === 'full'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Modelo Completo ({fullModel.p} vars • R² Adj: {(fullModel.adjustedR2 * 100).toFixed(1)}%)
            </button>
            <button
              onClick={() => onSelectModelType('refined')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                selectedModelType === 'refined'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Modelo Refinado ({refinedModel.p} vars • R² Adj: {(refinedModel.adjustedR2 * 100).toFixed(1)}%)
            </button>
          </div>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* R² */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              R² (Determinación)
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold">
              Varianza
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {(activeModel.r2 * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">
            El modelo explica el {(activeModel.r2 * 100).toFixed(1)}% de la variación de {activeModel.targetVariable}.
          </p>
        </div>

        {/* Adjusted R² */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              R² Ajustado
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold">
              Penalizado
            </span>
          </div>
          <p className="text-2xl font-extrabold text-indigo-600 font-mono">
            {(activeModel.adjustedR2 * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">
            Penaliza la inclusión de variables no significativas.
          </p>
        </div>

        {/* F-Statistic */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Estadístico F
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold">
              Global
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {activeModel.fStatistic.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-500">
            p-val: {activeModel.fPValue < 0.001 ? '< 0.001 (***)' : activeModel.fPValue.toFixed(4)}
          </p>
        </div>

        {/* RMSE */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              RMSE (Error Cuadrático)
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {activeModel.rmse.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500">
            Desviación estándar de los residuales.
          </p>
        </div>

        {/* MAE */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              MAE (Error Absoluto)
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {activeModel.mae.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500">
            Magnitud promedio del error de pronóstico.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'kpis'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tabla de Coeficientes β & VIF
        </button>
        <button
          onClick={() => setActiveTab('anova')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'anova'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tabla ANOVA (Análisis de Varianza)
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'diagnostics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Gráficos Diagnósticos: Reales vs. Predichos & Residuales
        </button>
      </div>

      {/* Tab 1: Coefficients Table */}
      {activeTab === 'kpis' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Estimadores OLS, Errores Estándar, Estadísticos t, Valores p y VIF
              </h3>
              <p className="text-xs text-slate-500">
                Regla de decisión: Se rechaza H₀ si p &lt; 0.05 (*), indicando que el coeficiente es estadísticamente diferente de cero.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
              <span className="font-bold">Significancia:</span>
              <span className="text-emerald-700 font-bold">*** p &lt; 0.001</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">** p &lt; 0.01</span>
              <span>•</span>
              <span className="text-emerald-500">* p &lt; 0.05</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Variable</th>
                  <th className="px-3 py-2.5 text-right">Coeficiente (β)</th>
                  <th className="px-3 py-2.5 text-right">Error Estándar (SE)</th>
                  <th className="px-3 py-2.5 text-right">Estadístico t</th>
                  <th className="px-3 py-2.5 text-right">Valor p (P &gt; |t|)</th>
                  <th className="px-3 py-2.5 text-right">IC 95% [Inferior, Superior]</th>
                  <th className="px-3 py-2.5 text-right">VIF</th>
                  <th className="px-3 py-2.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {activeModel.coefficients.map((c) => {
                  const isIntercept = c.variable === '(Intercept)';
                  const stars = c.pValue < 0.001 ? '***' : c.pValue < 0.01 ? '**' : c.pValue < 0.05 ? '*' : '';
                  const hasVifWarning = c.vif && c.vif > 5;

                  return (
                    <tr
                      key={c.variable}
                      className={`hover:bg-slate-50/70 ${
                        c.isSignificant && !isIntercept ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 font-sans font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{c.label}</span>
                        {isIntercept && (
                          <span className="text-[10px] px-1.5 rounded bg-slate-100 text-slate-500 font-normal">
                            Constante
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-indigo-700">
                        {c.beta.toLocaleString('es-ES', { maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-500">
                        {c.standardError.toLocaleString('es-ES', { maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold">
                        {c.tStatistic.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold">
                        <span className={c.isSignificant ? 'text-emerald-700' : 'text-slate-400'}>
                          {c.pValue < 0.0001 ? '< 0.0001' : c.pValue.toFixed(4)} {stars}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-[11px] text-slate-500">
                        [{c.confidenceInterval95[0].toLocaleString('es-ES', { maximumFractionDigits: 2 })},{' '}
                        {c.confidenceInterval95[1].toLocaleString('es-ES', { maximumFractionDigits: 2 })}]
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {isIntercept ? (
                          <span className="text-slate-300">-</span>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            hasVifWarning ? 'bg-amber-100 text-amber-800 font-bold' : 'text-slate-600'
                          }`}>
                            {c.vif?.toFixed(1) ?? '1.0'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center font-sans">
                        {c.isSignificant ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            Significativa
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            No significativa
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: ANOVA Table */}
      {activeTab === 'anova' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Tabla de Análisis de Varianza (ANOVA)
            </h3>
            <p className="text-xs text-slate-500">
              Descomposición de la Suma de Cuadrados Total (SST = SSE + SSR) y prueba F de hipótesis conjunta.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-700 font-sans font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Fuente de Variación</th>
                  <th className="px-3 py-2.5 text-right">Suma de Cuadrados (SS)</th>
                  <th className="px-3 py-2.5 text-right">Grados Libertad (df)</th>
                  <th className="px-3 py-2.5 text-right">Cuadrado Medio (MS)</th>
                  <th className="px-3 py-2.5 text-right">Estadístico F</th>
                  <th className="px-3 py-2.5 text-right">Valor p</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {anovaRows.map((row, idx) => (
                  <tr key={idx} className={idx === 0 ? 'bg-indigo-50/20' : idx === 2 ? 'font-bold bg-slate-50/50' : ''}>
                    <td className="px-3 py-2.5 font-sans font-semibold text-slate-900">{row.source}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-indigo-700">
                      {row.ss.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5 text-right">{row.df}</td>
                    <td className="px-3 py-2.5 text-right">
                      {row.ms !== null ? row.ms.toLocaleString('es-ES', { maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold">
                      {row.f !== null ? row.f.toFixed(2) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                      {row.p !== null ? (row.p < 0.0001 ? '< 0.0001' : row.p.toFixed(4)) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Recharts Scatter Plots */}
      {activeTab === 'diagnostics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Actual vs Predicted */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ScatterIcon className="w-4 h-4 text-indigo-600" />
                  <span>Valores Reales vs. Valores Predichos (Ŷ)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Cuanto más cerca estén los puntos de la línea diagonal (45°), mayor es la precisión.
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={scatterData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="predicted"
                    name="Predicción"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    label={{ value: 'Valor Predicho (Ŷ)', position: 'insideBottom', offset: -10, fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="actual"
                    name="Real"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    label={{ value: 'Valor Real (Y)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value: any, name: any) => [
                      Number(value).toLocaleString('es-ES', { maximumFractionDigits: 2 }),
                      name === 'actual' ? 'Valor Real' : 'Predicción',
                    ]}
                  />
                  <Scatter name="Muestras" dataKey="actual" fill="#4f46e5" />
                  <ReferenceLine
                    segment={[
                      { x: minVal, y: minVal },
                      { x: maxVal, y: maxVal },
                    ]}
                    stroke="#dc2626"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{ value: 'Ajuste Ideal (y = x)', fill: '#dc2626', fontSize: 10 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Residuals vs Fitted */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Gráfico de Residuales (e = Y - Ŷ) vs. Valores Ajustados</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Verificación de homocedasticidad: los residuales deben dispersarse aleatoriamente alrededor de 0.
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={scatterData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="predicted"
                    name="Predicción"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    label={{ value: 'Valor Predicho (Ŷ)', position: 'insideBottom', offset: -10, fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="residual"
                    name="Residual"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    label={{ value: 'Residual (e)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      Number(value).toLocaleString('es-ES', { maximumFractionDigits: 2 }),
                      'Residual',
                    ]}
                  />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                  <Scatter name="Residuales" dataKey="residual" fill="#059669" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
