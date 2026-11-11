import React, { useState } from 'react';
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  Wand2,
} from 'lucide-react';
import {
  DatasetState,
  ImputationConfig,
  ImputationStrategy,
  DummyEncodingConfig,
} from '../types/econometrics';
import { imputeDataset, applyDummyEncoding, profileColumns } from '../utils/dataParser';

interface Module2Props {
  dataset: DatasetState;
  setDataset: (ds: DatasetState) => void;
  imputationConfig: ImputationConfig;
  setImputationConfig: (cfg: ImputationConfig) => void;
  dummyConfig: DummyEncodingConfig;
  setDummyConfig: (cfg: DummyEncodingConfig) => void;
  onProceed: () => void;
}

export const Module2DataPrep: React.FC<Module2Props> = ({
  dataset,
  setDataset,
  imputationConfig,
  setImputationConfig,
  dummyConfig,
  setDummyConfig,
  onProceed,
}) => {
  const [prepSuccessMessage, setPrepSuccessMessage] = useState<string | null>(null);

  // Categorical columns eligible for One-Hot Encoding
  const categoricalCols = dataset.profiles.filter((p) => p.type === 'categorical');
  const numericCols = dataset.profiles.filter((p) => p.type === 'numeric');
  const columnsWithNulls = dataset.profiles.filter((p) => p.nullCount > 0);

  // Set global default imputation
  const applyRecommendedImputation = () => {
    const newConfig: ImputationConfig = {};
    dataset.profiles.forEach((p) => {
      if (p.nullCount > 0) {
        if (p.nullPercentage > 40) {
          newConfig[p.name] = 'drop';
        } else if (p.type === 'numeric') {
          newConfig[p.name] = 'median';
        } else {
          newConfig[p.name] = 'mode';
        }
      }
    });
    setImputationConfig(newConfig);

    // Apply immediately to dataset
    const cleaned = imputeDataset(dataset.data, dataset.profiles, newConfig);
    const newProfiles = profileColumns(cleaned, dataset.headers);
    setDataset({
      ...dataset,
      cleanedData: cleaned,
      profiles: newProfiles,
      rowCount: cleaned.length,
    });
    setPrepSuccessMessage('Imputación recomendada aplicada con éxito.');
    setTimeout(() => setPrepSuccessMessage(null), 3000);
  };

  // Toggle category for dummy encoding
  const toggleDummyColumn = (colName: string) => {
    const isSelected = dummyConfig.columnsToEncode.includes(colName);
    const updated = isSelected
      ? dummyConfig.columnsToEncode.filter((c) => c !== colName)
      : [...dummyConfig.columnsToEncode, colName];

    const newConfig = { ...dummyConfig, columnsToEncode: updated };
    setDummyConfig(newConfig);
    executeDataPrep(imputationConfig, newConfig);
  };

  const handleStrategyChange = (colName: string, strat: ImputationStrategy) => {
    const newConfig = { ...imputationConfig, [colName]: strat };
    setImputationConfig(newConfig);
    executeDataPrep(newConfig, dummyConfig);
  };

  const executeDataPrep = (impCfg: ImputationConfig, dumCfg: DummyEncodingConfig) => {
    // 1. Impute
    const imputed = imputeDataset(dataset.data, dataset.profiles, impCfg);

    // 2. Dummy encode if selected
    if (dumCfg.columnsToEncode.length > 0) {
      const { encodedData, allColumns } = applyDummyEncoding(imputed, dumCfg);
      const newProfiles = profileColumns(encodedData, allColumns);
      setDataset({
        ...dataset,
        cleanedData: encodedData,
        profiles: newProfiles,
        rowCount: encodedData.length,
      });
    } else {
      const newProfiles = profileColumns(imputed, dataset.headers);
      setDataset({
        ...dataset,
        cleanedData: imputed,
        profiles: newProfiles,
        rowCount: imputed.length,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Módulo 2: Data Prep & Calidad</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Diagnóstico, Limpieza y Codificación Dummy
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prepara la matriz de diseño: imputa valores ausentes y transforma variables cualitativas
            evitando la trampa de las variables ficticias (multicolinealidad perfecta).
          </p>
        </div>

        <button
          onClick={onProceed}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <span>Continuar a EDA</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {prepSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{prepSuccessMessage}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            #
          </div>
          <div>
            <p className="text-xs text-slate-500">Variables Numéricas</p>
            <p className="text-lg font-bold text-slate-900">{numericCols.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
            Aa
          </div>
          <div>
            <p className="text-xs text-slate-500">Variables Categóricas</p>
            <p className="text-lg font-bold text-slate-900">{categoricalCols.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
            columnsWithNulls.length === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            !
          </div>
          <div>
            <p className="text-xs text-slate-500">Columnas con Nulos</p>
            <p className="text-lg font-bold text-slate-900">
              {columnsWithNulls.length === 0 ? '0 (Dataset Completo)' : `${columnsWithNulls.length} columnas`}
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Missing Values & Imputation */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Análisis e Imputación de Valores Faltantes (Missing Values)</span>
            </h3>
            <p className="text-xs text-slate-500">
              El estimador OLS requiere matrices sin valores nulos. Define la estrategia de imputación por columna.
            </p>
          </div>

          {columnsWithNulls.length > 0 && (
            <button
              onClick={applyRecommendedImputation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition border border-indigo-200/80"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Imputación Automática Recomendada</span>
            </button>
          )}
        </div>

        {columnsWithNulls.length === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200/60 flex items-center gap-3 text-xs text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">¡Excelente calidad de datos!</p>
              <p className="text-emerald-700 text-[11px]">
                No se detectaron valores nulos o celdas vacías en ninguna columna. No se requiere imputación.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Columna</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Nulos (Conteo)</th>
                  <th className="px-3 py-2">% Faltante</th>
                  <th className="px-3 py-2">Estrategia de Imputación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {columnsWithNulls.map((col) => {
                  const currentStrat = imputationConfig[col.name] || (col.type === 'numeric' ? 'median' : 'mode');
                  return (
                    <tr key={col.name} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-medium text-slate-800">{col.name}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            col.type === 'numeric' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {col.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-rose-600 font-semibold">{col.nullCount}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full"
                              style={{ width: `${Math.min(100, col.nullPercentage)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-600">
                            {col.nullPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={currentStrat}
                          onChange={(e) => handleStrategyChange(col.name, e.target.value as ImputationStrategy)}
                          className="text-xs p-1.5 border border-slate-300 rounded bg-white text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500"
                        >
                          {col.type === 'numeric' ? (
                            <>
                              <option value="median">Imputar con Mediana ({col.median ?? 'N/A'})</option>
                              <option value="mean">Imputar con Media ({col.mean ?? 'N/A'})</option>
                              <option value="drop">Eliminar fila con nulo</option>
                            </>
                          ) : (
                            <>
                              <option value="mode">Imputar con Moda (Más frecuente: "{col.mode}")</option>
                              <option value="drop">Eliminar fila con nulo</option>
                            </>
                          )}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: One-Hot / Dummy Encoding */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Codificación Dummy (One-Hot Encoding) & Regla Drop-First</span>
            </h3>
            <p className="text-xs text-slate-500">
              Convierte columnas categóricas en variables binarias (0 y 1).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Regla drop-first:</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              Activada (Previene Trampa Dummy)
            </span>
          </div>
        </div>

        {/* Dummy Variable Trap Explainer Box */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Fundamento Econométrico: La Trampa de las Variables Ficticias</p>
            <p className="text-blue-800/90 text-[11px] leading-relaxed">
              Si una variable cualitativa tiene <em>K</em> categorías y el modelo incluye intercepto ($\beta_0$),
              debemos incluir exactamente <strong>$K - 1$ variables dummy</strong>. La categoría excluida actúa como
              <strong> categoría de referencia base</strong>. Incluir las <em>K</em> categorías crearía colinealidad exacta,
              haciendo la matriz $(X^TX)$ no invertible (determinante cero).
            </p>
          </div>
        </div>

        {categoricalCols.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No se detectaron columnas cualitativas/categóricas en este dataset. Todas las columnas son cuantitativas.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoricalCols.map((col) => {
              const isSelected = dummyConfig.columnsToEncode.includes(col.name);
              const sampleVals = col.sampleValues.map((v) => String(v));
              const uniqueVals = Array.from(new Set(dataset.data.map((r) => String(r[col.name] ?? '')))).filter(Boolean);
              const referenceCategory = uniqueVals[0] || 'Base';
              const activeDummies = uniqueVals.slice(1);

              return (
                <div
                  key={col.name}
                  className={`p-4 rounded-xl border transition ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-50/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`check_${col.name}`}
                        checked={isSelected}
                        onChange={() => toggleDummyColumn(col.name)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label
                        htmlFor={`check_${col.name}`}
                        className="text-xs font-bold text-slate-800 cursor-pointer"
                      >
                        {col.name}
                      </label>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      {uniqueVals.length} categorías
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-2">
                    Categorías observadas: {uniqueVals.join(', ')}
                  </p>

                  {isSelected && (
                    <div className="p-2.5 rounded-lg bg-white border border-indigo-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Categoría de Referencia (omitida):</span>
                        <span className="font-bold text-slate-700">"{referenceCategory}"</span>
                      </div>
                      <div className="text-slate-500">
                        <span>Dummies generadas ({activeDummies.length}):</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activeDummies.map((d) => (
                            <span
                              key={d}
                              className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[10px]"
                            >
                              {col.name}_{d.replace(/[^\w]/g, '_')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
