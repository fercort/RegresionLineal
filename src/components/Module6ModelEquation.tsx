import React, { useState, useEffect } from 'react';
import {
  Sigma,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  TrendingUp,
  Info,
  Briefcase,
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
  ReferenceLine,
} from 'recharts';
import { RegressionResult } from '../types/econometrics';
import { interpretModel } from '../services/geminiService';

interface Module6Props {
  businessContext: string;
  model: RegressionResult;
  onProceed: () => void;
}

export const Module6ModelEquation: React.FC<Module6Props> = ({
  businessContext,
  model,
  onProceed,
}) => {
  const [copied, setCopied] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<{
    equationExplanation: string;
    executiveTakeaway: string;
  } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterpretation = async () => {
      setLoadingAI(true);
      try {
        const res = await interpretModel(businessContext, model);
        setAiInterpretation(res);
      } catch (err) {
        console.error('Error fetching interpretation', err);
      } finally {
        setLoadingAI(false);
      }
    };
    fetchInterpretation();
  }, [model.equationString]);

  const handleCopyEquation = () => {
    navigator.clipboard.writeText(model.equationString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sensitivity bar chart data (excluding intercept)
  const sensitivityData = model.coefficients
    .filter((c) => c.variable !== '(Intercept)')
    .map((c) => ({
      name: c.variable,
      beta: Math.round(c.beta * 1000) / 1000,
      absBeta: Math.abs(c.beta),
      isPositive: c.beta >= 0,
      isSignificant: c.isSignificant,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-1">
            <Sigma className="w-3.5 h-3.5" />
            <span>Módulo 6: Ecuación & Ceteris Paribus</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Ecuación del Modelo e Interpretación de Coeficientes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Traducción matemática rigurosa a lenguaje de negocio comprensible para la toma de decisiones.
          </p>
        </div>

        <button
          onClick={onProceed}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <span>Ir al Simulador What-If</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Equation Display Box */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-cyan-300 font-bold">
              Ecuación de Regresión Paramétrica Estimada
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              OLS Ŷ
            </span>
          </div>

          <button
            onClick={handleCopyEquation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-indigo-100 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiada' : 'Copiar Ecuación'}</span>
          </button>
        </div>

        {/* Big Equation Formula */}
        <div className="py-4 overflow-x-auto text-base sm:text-lg md:text-xl font-mono leading-relaxed tracking-wide text-indigo-50 bg-black/30 p-4 rounded-xl border border-indigo-500/20">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-cyan-300 font-extrabold text-lg sm:text-2xl">
              {model.targetVariable}̂ =
            </span>

            {/* Intercept */}
            <span
              onMouseEnter={() => setHoveredTerm('(Intercept)')}
              onMouseLeave={() => setHoveredTerm(null)}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                hoveredTerm === '(Intercept)' ? 'bg-cyan-500/30 text-cyan-200' : 'text-slate-200'
              }`}
            >
              {model.intercept.toLocaleString('es-ES', { maximumFractionDigits: 3 })}
            </span>

            {/* Terms */}
            {model.coefficients
              .filter((c) => c.variable !== '(Intercept)')
              .map((c) => {
                const sign = c.beta >= 0 ? '+' : '-';
                const isHovered = hoveredTerm === c.variable;
                return (
                  <span
                    key={c.variable}
                    onMouseEnter={() => setHoveredTerm(c.variable)}
                    onMouseLeave={() => setHoveredTerm(null)}
                    className={`px-2 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                      isHovered
                        ? 'bg-indigo-500/40 text-cyan-200 ring-1 ring-cyan-400'
                        : c.isSignificant
                        ? 'text-indigo-200'
                        : 'text-slate-400'
                    }`}
                  >
                    <span>{sign}</span>
                    <span className="font-bold">
                      {Math.abs(c.beta).toLocaleString('es-ES', { maximumFractionDigits: 3 })}
                    </span>
                    <span className="text-xs sm:text-sm font-sans bg-indigo-800/60 px-1.5 py-0.5 rounded border border-indigo-400/30 text-white">
                      [{c.variable}]
                    </span>
                  </span>
                );
              })}
          </div>
        </div>

        {/* AI Executive Translation */}
        <div className="pt-2 text-xs text-indigo-200/90 space-y-2 border-t border-indigo-800/60">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Interpretación de Alto Nivel para Tomadores de Decisión:</span>
          </div>
          <p className="leading-relaxed">
            {aiInterpretation?.equationExplanation || (
              <span>
                La ecuación refleja el valor esperado de <strong>{model.targetVariable}</strong>.
                Cada coeficiente representa el impacto neto que tiene incrementar en una unidad
                el predictor correspondiente, asumiendo que todos los demás factores permanecen
                invariables (condición econométrica <em>ceteris paribus</em>).
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Grid: Coefficient Business Meanings + Sensitivity Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Business Plain-Language Cards for Each Coefficient */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Desglose Didáctico de Coeficientes Marginales</span>
            </h3>
            <span className="text-xs text-slate-400">Condición Ceteris Paribus</span>
          </div>

          <div className="space-y-3">
            {model.coefficients.map((c) => {
              const isIntercept = c.variable === '(Intercept)';
              const isPositive = c.beta >= 0;
              const absVal = Math.abs(c.beta).toLocaleString('es-ES', { maximumFractionDigits: 4 });

              return (
                <div
                  key={c.variable}
                  onMouseEnter={() => setHoveredTerm(c.variable)}
                  onMouseLeave={() => setHoveredTerm(null)}
                  className={`p-4 rounded-xl border transition ${
                    hoveredTerm === c.variable
                      ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {c.label}
                      </span>
                      {c.isSignificant && !isIntercept && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          Significativa (p &lt; 0.05)
                        </span>
                      )}
                      {!c.isSignificant && !isIntercept && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                          No concluyente
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isPositive ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      β = {c.beta.toLocaleString('es-ES', { maximumFractionDigits: 4 })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {c.businessInterpretation}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>SE: {c.standardError.toFixed(4)}</span>
                    <span>t: {c.tStatistic.toFixed(2)}</span>
                    <span>p-val: {c.pValue < 0.001 ? '< 0.001' : c.pValue.toFixed(4)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Sensitivity Bar Chart */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Sensibilidad & Dirección de los Coeficientes (β)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Magnitud del cambio esperado en {model.targetVariable} por incremento unitario.
              </p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sensitivityData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }}
                  />
                  <Tooltip
                    formatter={(val: any) => [
                      Number(val).toLocaleString('es-ES', { maximumFractionDigits: 4 }),
                      'Coeficiente β',
                    ]}
                  />
                  <ReferenceLine x={0} stroke="#94a3b8" />
                  <Bar dataKey="beta" radius={[0, 4, 4, 0]}>
                    {sensitivityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.beta >= 0 ? '#4f46e5' : '#e11d48'}
                        opacity={entry.isSignificant ? 1 : 0.5}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-indigo-600 rounded-xs" />
                <span>Impacto Positivo (+)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-rose-600 rounded-xs" />
                <span>Impacto Negativo (-)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-slate-300 rounded-xs" />
                <span>Atenuado (p ≥ 0.05)</span>
              </div>
            </div>
          </div>

          {/* Econometric Confidence Box */}
          <div className="bg-indigo-50/60 rounded-xl border border-indigo-200/70 p-4 space-y-2 text-xs text-indigo-950">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Conclusión Ejecutiva</span>
            </div>
            <p className="text-indigo-800 text-[11px] leading-relaxed">
              {aiInterpretation?.executiveTakeaway || (
                <span>
                  El modelo cuenta con un R² de {(model.r2 * 100).toFixed(1)}% y significancia conjunta F ({model.fStatistic.toFixed(1)}).
                  Es adecuado para simular escenarios de sensibilidad operativa y proyecciones de negocio.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
