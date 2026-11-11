import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Sparkles,
  ArrowRight,
  Target,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { DatasetState, GeminiAnalysisSchema } from '../types/econometrics';
import { recommendVariables } from '../services/geminiService';

interface Module4Props {
  businessContext: string;
  dataset: DatasetState;
  targetVariable: string;
  setTargetVariable: (v: string) => void;
  selectedPredictors: string[];
  setSelectedPredictors: (v: string[]) => void;
  onProceed: () => void;
}

export const Module4VariableSelection: React.FC<Module4Props> = ({
  businessContext,
  dataset,
  targetVariable,
  setTargetVariable,
  selectedPredictors,
  setSelectedPredictors,
  onProceed,
}) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<GeminiAnalysisSchema | null>(null);

  // Available numeric columns from cleanedData
  const availableNumericCols = dataset.profiles
    .filter((p) => p.type === 'numeric')
    .map((p) => p.name);

  // Fetch AI Recommendation
  const fetchRecommendation = async () => {
    setLoadingAI(true);
    try {
      const rec = await recommendVariables(businessContext, dataset.profiles, dataset.cleanedData);
      setAiRecommendation(rec);

      // Set target if not set or valid
      if (rec.recommendedTarget && availableNumericCols.includes(rec.recommendedTarget)) {
        setTargetVariable(rec.recommendedTarget);
      }

      // Filter predictors that exist in available numeric columns and are not target
      const validPreds = rec.recommendedPredictors.filter(
        (p) => availableNumericCols.includes(p) && p !== (rec.recommendedTarget || targetVariable)
      );
      if (validPreds.length > 0) {
        setSelectedPredictors(validPreds);
      }
    } catch (err) {
      console.error('Error fetching AI recommendation', err);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (!targetVariable && availableNumericCols.length > 0) {
      // Default to last numeric column before AI completes
      setTargetVariable(availableNumericCols[availableNumericCols.length - 1]);
      setSelectedPredictors(availableNumericCols.slice(0, availableNumericCols.length - 1));
    }
    fetchRecommendation();
  }, [dataset.rawFileName]);

  // Handle target change
  const handleTargetChange = (newTarget: string) => {
    setTargetVariable(newTarget);
    // Remove new target from selected predictors if present
    setSelectedPredictors(selectedPredictors.filter((p) => p !== newTarget));
  };

  // Toggle predictor
  const togglePredictor = (colName: string) => {
    if (selectedPredictors.includes(colName)) {
      setSelectedPredictors(selectedPredictors.filter((p) => p !== colName));
    } else {
      setSelectedPredictors([...selectedPredictors, colName]);
    }
  };

  // Degrees of freedom calculation
  const n = dataset.cleanedData.length;
  const p = selectedPredictors.length;
  const dfResidual = n - p - 1;
  const isDfHealthy = dfResidual >= 10;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Módulo 4: Selección Inteligente</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Selección Inteligente de Variables (Asistida por IA)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configura la especificación del modelo econométrico: define la variable dependiente (Y)
            y el conjunto de regresores (X₁, X₂, ...) con sustento estadístico y de negocio.
          </p>
        </div>

        <button
          onClick={onProceed}
          disabled={selectedPredictors.length === 0 || !targetVariable || dfResidual <= 0}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold shadow-xs transition self-start sm:self-auto ${
            selectedPredictors.length > 0 && targetVariable && dfResidual > 0
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Entrenar Modelo OLS</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* AI Recommendation Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-700/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-cyan-300 flex items-center justify-center border border-indigo-400/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                Diagnóstico Asistido por Inteligencia Artificial (Gemini)
              </h3>
              <p className="text-[11px] text-indigo-200/80">
                Sugerencias basadas en el contexto de negocio y características distribucionales
              </p>
            </div>
          </div>

          <button
            onClick={fetchRecommendation}
            disabled={loadingAI}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-indigo-100 transition disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loadingAI ? 'animate-spin' : ''}`} />
            <span>{loadingAI ? 'Analizando...' : 'Recalcular'}</span>
          </button>
        </div>

        {aiRecommendation && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                <Target className="w-4 h-4" />
                <span>Variable Objetivo Sugerida (Y):</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 font-bold font-mono">
                  {aiRecommendation.recommendedTarget}
                </span>
              </div>
              <p className="text-indigo-100/90 text-[11px] leading-relaxed">
                {aiRecommendation.targetRationale}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Criterio de Predictores Sugeridos:</span>
              </div>
              <p className="text-indigo-100/90 text-[11px] leading-relaxed">
                {aiRecommendation.predictorsRationale}
              </p>
              {aiRecommendation.cautionVariables && aiRecommendation.cautionVariables.length > 0 && (
                <div className="pt-1 text-[10px] text-amber-300 flex items-center gap-1">
                  <span>Variables descartadas por precaución:</span>
                  <span className="font-mono">{aiRecommendation.cautionVariables.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selection Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Target Variable Selection (Y) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  Y
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Variable Dependiente / Objetivo (Y)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    La métrica que deseas predecir, modelar y simular
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                Target OLS
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Selecciona la variable dependiente:
              </label>
              <select
                value={targetVariable}
                onChange={(e) => handleTargetChange(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {availableNumericCols.map((col) => (
                  <option key={col} value={col}>
                    {col} {col === aiRecommendation?.recommendedTarget ? '★ (Recomendada por IA)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Variable Profile Card */}
            {targetVariable && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Perfil de "{targetVariable}":
                </span>
                {(() => {
                  const prof = dataset.profiles.find((p) => p.name === targetVariable);
                  return prof ? (
                    <div className="grid grid-cols-2 gap-2 text-slate-700 font-mono text-[11px]">
                      <div>Media: <span className="font-bold">{prof.mean?.toLocaleString('es-ES')}</span></div>
                      <div>Mediana: <span className="font-bold">{prof.median?.toLocaleString('es-ES')}</span></div>
                      <div>Mín: <span className="font-bold">{prof.min?.toLocaleString('es-ES')}</span></div>
                      <div>Máx: <span className="font-bold">{prof.max?.toLocaleString('es-ES')}</span></div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* Degrees of Freedom & Statistical Health Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Condiciones Econométricas de Identificación</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Observaciones muestrales (N):</span>
                <span className="font-mono font-bold text-slate-800">{n}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Regresores seleccionados (P):</span>
                <span className="font-mono font-bold text-indigo-600">{p}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Grados de libertad residuales (df = N - P - 1):</span>
                <span className={`font-mono font-bold ${dfResidual > 5 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {dfResidual}
                </span>
              </div>
            </div>

            {dfResidual <= 0 ? (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Sobredeterminación: Hay más parámetros que observaciones. Reduce el número de variables predictoras.
                </span>
              </div>
            ) : !isDfHealthy ? (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Muestra reducida: Se recomienda tener al menos 10 observaciones por variable para estimaciones OLS robustas.
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Grados de libertad adecuados para inferencia estadística válida.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Predictor Variables Selection (X) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    X
                  </div>
                  <span>Variables Independientes / Predictoras (X₁, X₂, ...)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Selecciona los factores explicativos que entrarán en la matriz de diseño
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPredictors(availableNumericCols.filter((c) => c !== targetVariable))}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded bg-indigo-50"
                >
                  Seleccionar Todas
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPredictors([])}
                  className="text-[11px] text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded bg-slate-100"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {availableNumericCols
                .filter((col) => col !== targetVariable)
                .map((col) => {
                  const isChecked = selectedPredictors.includes(col);
                  const isRecommended = aiRecommendation?.recommendedPredictors.includes(col);
                  const isCaution = aiRecommendation?.cautionVariables?.includes(col);
                  const prof = dataset.profiles.find((p) => p.name === col);

                  return (
                    <div
                      key={col}
                      onClick={() => togglePredictor(col)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'border-indigo-400 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{col}</span>
                            {isRecommended && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                                IA Recomendada
                              </span>
                            )}
                            {isCaution && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                                Precaución (ID / Colineal)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Media: {prof?.mean?.toLocaleString('es-ES') ?? 'N/A'} • σ: {prof?.stdDev?.toLocaleString('es-ES') ?? 'N/A'}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-semibold text-indigo-600">
                        {isChecked ? 'Incluida' : 'Omitida'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
