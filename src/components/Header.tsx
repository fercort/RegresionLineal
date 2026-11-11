import React from 'react';
import { LineChart, Sparkles, Database, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { SAMPLE_DATASETS, SampleDataset } from '../utils/sampleDatasets';

interface HeaderProps {
  currentDatasetName: string;
  rowCount: number;
  colCount: number;
  onSelectSample: (sample: SampleDataset) => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDatasetName,
  rowCount,
  colCount,
  onSelectSample,
  onReset,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* App Title & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Econometr<span className="text-indigo-600">IX</span>
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60">
                OLS & Simulador
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Regresión Lineal Múltiple Automática & Simulación de Negocio
            </p>
          </div>
        </div>

        {/* Dataset Status & Sample Datasets Dropdown */}
        <div className="flex items-center gap-3">
          {rowCount > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-medium max-w-[150px] truncate">{currentDatasetName}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">{rowCount} filas × {colCount} cols</span>
            </div>
          )}

          {/* Quick Sample Selector */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition border border-indigo-200/80">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Cargar Ejemplo</span>
              <span className="text-[10px] bg-indigo-200/60 px-1 rounded text-indigo-800">3</span>
            </button>
            <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-50">
              <div className="px-3 py-1 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Datasets de Negocio Precargados
              </div>
              {SAMPLE_DATASETS.map(sample => (
                <button
                  key={sample.id}
                  onClick={() => onSelectSample(sample)}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-50/70 transition flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{sample.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                      {sample.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 line-clamp-1">{sample.description}</span>
                </button>
              ))}
            </div>
          </div>

          {rowCount > 0 && (
            <button
              onClick={onReset}
              title="Reiniciar análisis y cargar nuevo dataset"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
