import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { DatasetState, GeminiEdaInsights } from '../types/econometrics';
import { computeCorrelationMatrix } from '../utils/mathEngine';
import { getEdaInsights } from '../services/geminiService';

interface Module3Props {
  businessContext: string;
  dataset: DatasetState;
  targetVariable: string;
  onProceed: () => void;
}

export const Module3EDA: React.FC<Module3Props> = ({
  businessContext,
  dataset,
  targetVariable,
  onProceed,
}) => {
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insights, setInsights] = useState<GeminiEdaInsights | null>(null);

  // Compute numeric columns from cleanedData
  const numericProfiles = dataset.profiles.filter(
    (p) => p.type === 'numeric' && p.mean !== undefined
  );
  const numericColNames = numericProfiles.map((p) => p.name);

  // Correlation matrix
  const correlationData = React.useMemo(() => {
    return computeCorrelationMatrix(dataset.cleanedData, numericColNames);
  }, [dataset.cleanedData, numericColNames]);

  // Load AI Insights
  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const result = await getEdaInsights(
        businessContext,
        dataset.profiles,
        correlationData,
        targetVariable || numericColNames[numericColNames.length - 1] || 'Target'
      );
      setInsights(result);
    } catch (err) {
      console.error('Error fetching EDA insights', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [dataset.rawFileName, businessContext]);

  // Heatmap color generator
  const getCorrelationColor = (val: number) => {
    if (val === 1) return 'bg-indigo-600 text-white font-bold';
    if (val > 0.7) return 'bg-blue-600 text-white font-bold';
    if (val > 0.4) return 'bg-blue-200 text-blue-900 font-semibold';
    if (val > 0.1) return 'bg-blue-50 text-blue-800';
    if (val > -0.1) return 'bg-slate-50 text-slate-600';
    if (val > -0.4) return 'bg-rose-50 text-rose-800';
    if (val > -0.7) return 'bg-rose-200 text-rose-900 font-semibold';
    return 'bg-rose-600 text-white font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Módulo 3: Análisis Exploratorio & Econometría</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Estadísticos Descriptivos, Matriz de Correlación & Reglas de Negocio
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analiza la dispersión de variables y las asociaciones lineales bivariadas de Pearson
            para prevenir multicolinealidad y fundamentar la selección de variables.
          </p>
        </div>

        <button
          onClick={onProceed}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <span>Seleccionar Variables</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* AI Business Validation Panel */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 border-b border-indigo-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-cyan-300 flex items-center justify-center border border-indigo-400/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                Validación con Inteligencia Artificial & Reglas de Negocio
              </h3>
              <p className="text-[11px] text-indigo-200/80">
                Diagnóstico de correlaciones y anomalías según el contexto del negocio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {insights?.dataQualityRating && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                Calidad: {insights.dataQualityRating}
              </span>
            )}
            <button
              onClick={loadInsights}
              disabled={loadingInsights}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-100 transition disabled:opacity-50"
              title="Volver a consultar a Gemini"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loadingInsights ? (
          <div className="py-6 flex items-center justify-center gap-3 text-indigo-200 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
            <span>Gemini está analizando la matriz estadística y el contexto de negocio...</span>
          </div>
        ) : insights ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Summary */}
            <div className="space-y-2 md:col-span-1 border-r border-indigo-800/50 pr-4">
              <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider block">
                Resumen Ejecutivo EDA
              </span>
              <p className="text-indigo-100/90 leading-relaxed text-[11px]">
                {insights.businessSummary}
              </p>
            </div>

            {/* Correlations */}
            <div className="space-y-2 md:col-span-1 border-r border-indigo-800/50 pr-4">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Correlaciones Más Destacadas</span>
              </span>
              <ul className="space-y-1.5 text-indigo-100/90">
                {insights.keyCorrelations.map((corr, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{corr}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Anomalies / Business Rules */}
            <div className="space-y-2 md:col-span-1">
              <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Reglas de Negocio & Alertas</span>
              </span>
              <ul className="space-y-1.5 text-indigo-100/90">
                {insights.anomaliesOrRisks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-amber-400 font-bold">▲</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      {/* Descriptive Statistics Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Estadísticos Descriptivos Paramétricos y de Posición
            </h3>
            <p className="text-xs text-slate-500">
              Media, Mediana, Desviación Estándar, Mínimo y Máximo de las variables continuas.
            </p>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
            N = {dataset.cleanedData.length} obs
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Variable</th>
                <th className="px-3 py-2 text-right">Media (μ)</th>
                <th className="px-3 py-2 text-right">Mediana</th>
                <th className="px-3 py-2 text-right">Desv. Estándar (σ)</th>
                <th className="px-3 py-2 text-right">Mínimo</th>
                <th className="px-3 py-2 text-right">Máximo</th>
                <th className="px-3 py-2 text-right">Rango</th>
                <th className="px-3 py-2 text-right">Coef. Variación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {numericProfiles.map((p) => {
                const cv = p.mean && p.stdDev ? ((p.stdDev / Math.abs(p.mean)) * 100).toFixed(1) + '%' : 'N/A';
                const range = (p.max ?? 0) - (p.min ?? 0);
                return (
                  <tr key={p.name} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2 font-sans font-semibold text-slate-900">{p.name}</td>
                    <td className="px-3 py-2 text-right">{p.mean?.toLocaleString('es-ES')}</td>
                    <td className="px-3 py-2 text-right">{p.median?.toLocaleString('es-ES')}</td>
                    <td className="px-3 py-2 text-right text-indigo-700 font-semibold">
                      {p.stdDev?.toLocaleString('es-ES')}
                    </td>
                    <td className="px-3 py-2 text-right">{p.min?.toLocaleString('es-ES')}</td>
                    <td className="px-3 py-2 text-right">{p.max?.toLocaleString('es-ES')}</td>
                    <td className="px-3 py-2 text-right text-slate-500">{range.toLocaleString('es-ES')}</td>
                    <td className="px-3 py-2 text-right text-slate-500">{cv}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pearson Correlation Heatmap Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Matriz de Correlación Lineal de Pearson (r)
            </h3>
            <p className="text-xs text-slate-500">
              Mide la fuerza y dirección de la relación lineal (-1.00 a +1.00). Coeficientes |r| &gt; 0.85 entre predictores señalan posible multicolinealidad.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold">-1.0</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">-0.5</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">0.0</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">+0.5</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold">+1.0</span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-center text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left">Variable</th>
                {correlationData.columns.map((col) => (
                  <th key={col} className="px-2 py-2 whitespace-nowrap text-[11px]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {correlationData.columns.map((rowCol, rIdx) => (
                <tr key={rowCol}>
                  <td className="px-3 py-2 text-left font-semibold text-slate-900 whitespace-nowrap bg-slate-50/50">
                    {rowCol}
                  </td>
                  {correlationData.columns.map((colCol, cIdx) => {
                    const val = correlationData.matrix[rIdx][cIdx];
                    const colorClass = getCorrelationColor(val);
                    return (
                      <td
                        key={colCol}
                        title={`Correlación entre ${rowCol} y ${colCol}: ${val}`}
                        className={`px-2 py-2 font-mono text-[11px] transition-colors border-r border-slate-100 last:border-0 ${colorClass}`}
                      >
                        {val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
