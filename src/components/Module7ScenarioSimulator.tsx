import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Sliders,
  CheckCircle2,
  BookmarkPlus,
  BarChart3,
  Percent,
  Compass,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  RegressionResult,
  ScenarioDefinition,
  VariableDistribution,
} from '../types/econometrics';
import {
  calculateVariableDistribution,
  predictY,
  generateIntelligentScenarios,
  buildAuxiliaryRelationships,
} from '../utils/simulationEngine';

interface Module7Props {
  datasetRows: Record<string, any>[];
  model: RegressionResult;
  onProceed: () => void;
  scenarios: ScenarioDefinition[];
  setScenarios: React.Dispatch<React.SetStateAction<ScenarioDefinition[]>>;
}

export const Module7ScenarioSimulator: React.FC<Module7Props> = ({
  datasetRows,
  model,
  onProceed,
  scenarios,
  setScenarios,
}) => {
  // Distributions for each predictor variable
  const distributions: Record<string, VariableDistribution> = useMemo(() => {
    const map: Record<string, VariableDistribution> = {};
    model.predictorVariables.forEach((pred) => {
      const vals = datasetRows.map((r) => Number(r[pred]) || 0);
      map[pred] = calculateVariableDistribution(vals, pred);
    });
    return map;
  }, [datasetRows, model.predictorVariables]);

  // Auxiliary relationship slopes
  const auxiliaryRels = useMemo(() => {
    return buildAuxiliaryRelationships(datasetRows, model.predictorVariables);
  }, [datasetRows, model.predictorVariables]);

  // Initial scenario generation
  useMemo(() => {
    if (scenarios.length === 0) {
      const gen = generateIntelligentScenarios(model, distributions);
      setScenarios(gen);
    }
  }, [model, distributions]);

  // Active slider values state
  const [currentValues, setCurrentValues] = useState<Record<string, number>>(() => {
    const base = scenarios.find((s) => s.id === 'base');
    if (base) return { ...base.values };
    const initial: Record<string, number> = {};
    model.predictorVariables.forEach((p) => {
      initial[p] = distributions[p]?.median ?? 0;
    });
    return initial;
  });

  // Toggle for auxiliary coherent co-movement
  const [coMovementEnabled, setCoMovementEnabled] = useState(true);

  // Active scenario preset selected
  const [activePresetId, setActivePresetId] = useState<string>('base');

  // Real-time predicted Y
  const currentYHat = useMemo(() => {
    return predictY(currentValues, model);
  }, [currentValues, model]);

  // Base YHat for delta comparison
  const baseYHat = useMemo(() => {
    const base = scenarios.find((s) => s.id === 'base');
    return base ? base.predictedY : model.intercept;
  }, [scenarios, model.intercept]);

  const deltaY = currentYHat - baseYHat;
  const deltaPercent = baseYHat !== 0 ? (deltaY / Math.abs(baseYHat)) * 100 : 0;

  // Handle slider change with optional coherent co-movement
  const handleSliderChange = (varName: string, newVal: number) => {
    const oldVal = currentValues[varName] ?? newVal;
    const diff = newVal - oldVal;

    const nextValues = { ...currentValues, [varName]: newVal };

    if (coMovementEnabled && Math.abs(diff) > 1e-6) {
      // Adjust strongly correlated variables according to auxiliary regressions
      const relsForVar = auxiliaryRels[varName] || {};
      for (const [otherVar, rel] of Object.entries(relsForVar)) {
        if (Math.abs(rel.correlation) > 0.45) {
          const expectedShift = diff * rel.slope;
          const currentOther = currentValues[otherVar] ?? 0;
          const dist = distributions[otherVar];
          const clamped = Math.max(
            dist.min,
            Math.min(dist.max, Math.round((currentOther + expectedShift) * 100) / 100)
          );
          nextValues[otherVar] = clamped;
        }
      }
    }

    setCurrentValues(nextValues);
    setActivePresetId('custom');
  };

  // Apply a preset scenario
  const applyPreset = (scen: ScenarioDefinition) => {
    setCurrentValues({ ...scen.values });
    setActivePresetId(scen.id);
  };

  // Reset to Base
  const resetToBase = () => {
    const base = scenarios.find((s) => s.id === 'base');
    if (base) {
      applyPreset(base);
    }
  };

  // Prepare scenario comparison chart data
  const comparisonChartData = useMemo(() => {
    const data = scenarios.map((s) => ({
      name: s.name.split(' (')[0],
      predictedY: Math.round(s.predictedY * 10) / 10,
      isCurrent: s.id === activePresetId,
    }));

    if (activePresetId === 'custom') {
      data.push({
        name: 'Simulación Actual',
        predictedY: Math.round(currentYHat * 10) / 10,
        isCurrent: true,
      });
    }

    return data;
  }, [scenarios, activePresetId, currentYHat]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Módulo 7: Simulador Interactivo What-If</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Simulador de Escenarios & Pronóstico en Tiempo Real
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mueve los controles o selecciona escenarios probabilísticos coherentes (Base, Optimista, Pesimista)
            para proyectar el impacto sobre <strong>{model.targetVariable}</strong>.
          </p>
        </div>

        <button
          onClick={onProceed}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <span>Ver Reporte Estratégico</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Preset Scenario Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {scenarios.map((scen) => {
          const isSelected = activePresetId === scen.id;
          const isPositiveDelta = scen.deltaFromBase >= 0;

          return (
            <div
              key={scen.id}
              onClick={() => applyPreset(scen)}
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">
                    {scen.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {scen.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Ŷ Pronosticado</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {scen.predictedY.toLocaleString('es-ES', { maximumFractionDigits: 1 })}
                  </span>
                </div>

                {scen.id !== 'base' && (
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isPositiveDelta ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isPositiveDelta ? '+' : ''}
                    {scen.deltaPercentFromBase.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-Time Prediction Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-semibold border border-indigo-400/30">
              Pronóstico Activo en Tiempo Real
            </span>
            {activePresetId === 'custom' && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                Modo Personalizado
              </span>
            )}
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-indigo-200">
            Valor Esperado para: <strong className="text-white font-bold">{model.targetVariable}</strong>
          </h3>
          <div className="flex items-baseline gap-4">
            <span className="text-3xl sm:text-4xl font-extrabold text-cyan-300 font-mono tracking-tight">
              {currentYHat.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
            </span>

            {/* Delta against base */}
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
              <span
                className={`px-2 py-0.5 rounded ${
                  deltaY >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {deltaY >= 0 ? '+' : ''}
                {deltaY.toLocaleString('es-ES', { maximumFractionDigits: 2 })} ({deltaPercent >= 0 ? '+' : ''}
                {deltaPercent.toFixed(1)}%)
              </span>
              <span className="text-xs text-indigo-300/80 font-normal">vs. Base</span>
            </div>
          </div>
        </div>

        {/* Co-movement toggle & reset */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => setCoMovementEnabled(!coMovementEnabled)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
              coMovementEnabled
                ? 'bg-indigo-600/80 border-cyan-400/50 text-white shadow-sm'
                : 'bg-white/10 border-white/20 text-slate-300 hover:bg-white/15'
            }`}
            title="Ajusta variables correlacionadas según sus regresiones auxiliares empíricas"
          >
            <Compass className="w-4 h-4 text-cyan-300" />
            <span>Simulación Coherente {coMovementEnabled ? '(Activada)' : '(Manual)'}</span>
          </button>

          <button
            onClick={resetToBase}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-indigo-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Base</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sliders on Left + Scenario Comparison Chart on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Container */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Controles de Sensibilidad de Variables (What-If)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Desplaza los controles para simular variaciones dentro del rango histórico observado.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {model.predictorVariables.map((pred) => {
                const dist = distributions[pred] || {
                  min: 0,
                  max: 100,
                  step: 1,
                  mean: 50,
                  median: 50,
                };
                const val = currentValues[pred] ?? dist.median;
                const coef = model.coefficients.find((c) => c.variable === pred);
                const beta = coef ? coef.beta : 0;
                const isSignificant = coef ? coef.isSignificant : false;

                return (
                  <div key={pred} className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{pred}</span>
                        {isSignificant && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-semibold font-mono">
                            β = {beta.toFixed(3)}
                          </span>
                        )}
                      </div>

                      {/* Number input for precise setting */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={val}
                          step={dist.step}
                          onChange={(e) => handleSliderChange(pred, Number(e.target.value))}
                          className="w-24 text-right font-mono font-bold text-xs p-1 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Range Slider */}
                    <input
                      type="range"
                      min={dist.min}
                      max={dist.max}
                      step={dist.step}
                      value={val}
                      onChange={(e) => handleSliderChange(pred, Number(e.target.value))}
                      className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />

                    {/* Min, Median, Max Labels */}
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Mín: {dist.min.toLocaleString('es-ES')}</span>
                      <span className="text-slate-600">Mediana: {dist.median.toLocaleString('es-ES')}</span>
                      <span>Máx: {dist.max.toLocaleString('es-ES')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Comparative Chart */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Comparativa Gráfica de Escenarios</span>
              </h3>
              <p className="text-xs text-slate-500">
                Respuesta esperada de <strong>{model.targetVariable}</strong> bajo cada condición.
              </p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any) => [
                      Number(val).toLocaleString('es-ES', { maximumFractionDigits: 1 }),
                      'Ŷ Predicho',
                    ]}
                  />
                  <Bar dataKey="predictedY" radius={[4, 4, 0, 0]}>
                    {comparisonChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isCurrent ? '#4f46e5' : '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Nota sobre el Modo Simulación Coherente:</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Cuando está activo, cambiar una variable independiente proyecta cambios en variables co-dependientes
                utilizando la covarianza muestral empírica (regresiones auxiliares). Esto evita simular combinaciones
                imposibles en la realidad operativa del negocio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
