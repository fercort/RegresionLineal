import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  Download,
  Printer,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCcw,
  Target,
  ArrowRight,
} from 'lucide-react';
import {
  RegressionResult,
  ScenarioDefinition,
  GeminiStrategicReport,
} from '../types/econometrics';
import { generateStrategicReport } from '../services/geminiService';

interface Module8Props {
  businessContext: string;
  model: RegressionResult;
  scenarios: ScenarioDefinition[];
  datasetName: string;
}

export const Module8StrategicReport: React.FC<Module8Props> = ({
  businessContext,
  model,
  scenarios,
  datasetName,
}) => {
  const [report, setReport] = useState<GeminiStrategicReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await generateStrategicReport(businessContext, model, scenarios);
      setReport(res);
    } catch (err) {
      console.error('Error generating report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [model.targetVariable, businessContext]);

  // Download JSON report
  const downloadJSON = () => {
    const reportData = {
      titulo: 'Informe Ejecutivo de Regresión Econométrica & Simulación',
      fecha: new Date().toISOString(),
      dataset: datasetName,
      preguntaDeNegocio: businessContext,
      metricasModelo: {
        target: model.targetVariable,
        r2: model.r2,
        r2Ajustado: model.adjustedR2,
        rmse: model.rmse,
        fStatistic: model.fStatistic,
        pValGlobal: model.fPValue,
        ecuacion: model.equationString,
      },
      coeficientes: model.coefficients,
      escenarios: scenarios,
      analisisEstrategico: report,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_econometrico_${model.targetVariable}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download CSV coefficients
  const downloadCSV = () => {
    const headers = ['Variable', 'Coeficiente_Beta', 'Error_Estandar', 'Estadistico_t', 'Valor_p', 'Significativo_95', 'VIF'];
    const rows = model.coefficients.map((c) => [
      c.variable,
      c.beta,
      c.standardError,
      c.tStatistic,
      c.pValue,
      c.isSignificant ? 'SI' : 'NO',
      c.vif ?? 1.0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coeficientes_regresion_${model.targetVariable}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>Módulo 8: Dictamen Ejecutivo</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Recomendaciones Estratégicas sobre la Pregunta de Negocio
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Traducción ejecutiva de las métricas econométricas hacia palancas de impacto,
            gestión de riesgos y decisiones presupuestarias.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Coeficientes</span>
          </button>

          <button
            onClick={downloadJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON Completo</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Executive Document Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
              Informe Econométrico de Negocio
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Fecha: {new Date().toLocaleDateString('es-ES')}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Dictamen Estratégico & Análisis de Sensibilidad: {model.targetVariable}
          </h1>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
            <Target className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Pregunta de Negocio Inicial:</span>
              <p className="text-slate-600 mt-0.5 italic">"{businessContext}"</p>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>1. Síntesis Ejecutiva para el Directorio</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
            {report?.executiveSummary || 'Cargando síntesis ejecutiva...'}
          </p>
        </div>

        {/* Section 2: Direct Answer to Business Question */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>2. Respuesta Concreta a la Pregunta de Negocio</span>
          </h3>
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
            {report?.businessQuestionAnswer || 'Generando respuesta a la pregunta de negocio...'}
          </div>
        </div>

        {/* Section 3: Key Strategic Drivers Ranked */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>3. Jerarquización de Palancas de Crecimiento & Retorno</span>
          </h3>
          <p className="text-xs text-slate-500">
            Variables ordenadas por su peso estadístico e impacto marginal en {model.targetVariable}.
          </p>

          <div className="space-y-2.5">
            {report?.keyDriversRanked?.map((driver, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white transition space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {driver.variable}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {driver.impact}
                  </span>
                </div>
                <p className="text-xs text-slate-700 pl-7">
                  <strong>Recomendación:</strong> {driver.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Scenario Guidance (Optimistic vs Pessimistic) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>4. Estrategia Frente a Escenarios Probabilísticos</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Optimistic Plan */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wide">
                <span>▲</span>
                <span>Plan de Captura (Escenario Optimista)</span>
              </span>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {report?.scenarioAdvice?.optimisticAction}
              </p>
            </div>

            {/* Pessimistic Mitigation Plan */}
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5 uppercase tracking-wide">
                <span>▼</span>
                <span>Plan de Mitigación (Escenario Pesimista)</span>
              </span>
              <p className="text-xs text-rose-800 leading-relaxed">
                {report?.scenarioAdvice?.pessimisticMitigation}
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Econometric Confidence & Caveats */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>5. Solidez Econométrica & Límites del Modelo</span>
          </h3>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
            <p>{report?.econometricConfidence}</p>
            <p className="text-slate-500 text-[11px]">
              Nota metodológica: Las estimaciones OLS asumen linealidad en los parámetros y ausencia de correlación entre los residuales y los regresores (exogeneidad estricta). Cambios de régimen de mercado o eventos de fuerza mayor requerirán una actualización muestral.
            </p>
          </div>
        </div>

        {/* Section 6: Actionable Next Steps */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>6. Próximos Pasos Operacionales Inmediatos</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report?.nextSteps?.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 bg-white flex items-start gap-2.5 text-xs text-slate-800"
              >
                <div className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign-off footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>Generado automáticamente por el motor econométrico OLS & Gemini AI</span>
          <span>EconometrIX • Listo para producción en Vercel</span>
        </div>
      </div>
    </div>
  );
};
