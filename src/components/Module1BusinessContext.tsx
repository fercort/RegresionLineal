import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  HelpCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Table,
} from 'lucide-react';
import { SAMPLE_DATASETS, SampleDataset } from '../utils/sampleDatasets';
import { parseCSV, parseExcel, profileColumns } from '../utils/dataParser';
import { DatasetState } from '../types/econometrics';

interface Module1Props {
  businessContext: string;
  setBusinessContext: (ctx: string) => void;
  dataset: DatasetState | null;
  setDataset: (data: DatasetState | null) => void;
  onProceed: () => void;
  onLoadSample: (sample: SampleDataset) => void;
}

export const Module1BusinessContext: React.FC<Module1Props> = ({
  businessContext,
  setBusinessContext,
  dataset,
  setDataset,
  onProceed,
  onLoadSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsProcessingFile(true);
    setFileError(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let headers: string[] = [];
      let data: Record<string, any>[] = [];

      if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        const parsed = parseCSV(text);
        headers = parsed.headers;
        data = parsed.data;
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const parsed = parseExcel(buffer);
        headers = parsed.headers;
        data = parsed.data;
      } else {
        throw new Error('Formato no soportado. Por favor sube archivos .csv, .txt, .xls o .xlsx.');
      }

      if (data.length < 5) {
        throw new Error('El archivo debe contener al menos 5 filas de datos para realizar regresión.');
      }

      const profiles = profileColumns(data, headers);

      setDataset({
        rawFileName: file.name,
        rowCount: data.length,
        columnCount: headers.length,
        headers,
        data,
        cleanedData: data,
        profiles,
      });
    } catch (err: any) {
      setFileError(err.message || 'Error al procesar el archivo');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-indigo-200 to-transparent"></div>
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold backdrop-blur border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Módulo 1: Contexto de Negocio & Carga de Datos</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Regresión Lineal Múltiple & Simulación de Negocio
          </h2>
          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Convierte datos crudos en decisiones ejecutivas. Define tu pregunta de negocio,
            carga un archivo o selecciona un caso de estudio precargado, y nuestro motor econométrico
            y de Inteligencia Artificial guiará cada paso del análisis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Business Context Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>1. Pregunta o Contexto de Negocio</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                Guía a la IA
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Describe qué decisión necesitas tomar o qué variable te interesa predecir y explicar.
            </p>
            <textarea
              rows={4}
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
              placeholder="Ejemplo: Deseamos entender qué atributos y amenidades influyen con mayor fuerza en el precio de venta de inmuebles residenciales para fijar precios óptimos de preventa..."
              className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 transition"
            />

            {/* Quick Inspiration Pills */}
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
                Sugerencias rápidas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Estimar precio de venta inmobiliario según m², ubicación y antigüedad.',
                  'Predecir demanda retail e impacto de promociones y canales digitales.',
                  'Modelar ingresos recurrentes (ARR) en función del uso y satisfacción SaaS.',
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBusinessContext(sug)}
                    className="text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 px-2.5 py-1 rounded-md text-left transition"
                  >
                    "{sug.slice(0, 48)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preset Datasets Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span>Casos de Estudio Precargados</span>
              </h3>
              <span className="text-[11px] text-slate-400">1-click demo</span>
            </div>
            <div className="space-y-2.5">
              {SAMPLE_DATASETS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => onLoadSample(sample)}
                  className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="space-y-0.5 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                        {sample.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {sample.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{sample.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition">
                    →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: File Upload & Preview */}
        <div className="lg:col-span-7 space-y-4">
          {/* File Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
                : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  Arrastra tu archivo aquí o <span className="text-indigo-600 underline">haz clic para explorar</span>
                </p>
                <p className="text-xs text-slate-500">
                  Formatos compatibles: CSV, TXT (delimitado por coma, tabulador o punto y coma), Excel (.xlsx, .xls)
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>100% procesado en tu navegador</span>
                <span>•</span>
                <span>Sin subir datos sensibles a servidores externos</span>
              </div>
            </div>
          </div>

          {fileError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {fileError}
            </div>
          )}

          {/* Dataset Preview */}
          {dataset && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      Dataset cargado: {dataset.rawFileName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {dataset.rowCount} observaciones • {dataset.columnCount} variables detectadas
                    </p>
                  </div>
                </div>

                <button
                  onClick={onProceed}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <span>Continuar al Diagnóstico</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Data Table Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-slate-400" />
                    <span>Vista previa (primeras 5 filas)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Desplaza horizontalmente para ver todas las columnas</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-64">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="px-3 py-2 border-r border-slate-200 text-[10px] text-slate-400">#</th>
                        {dataset.headers.map((h) => {
                          const profile = dataset.profiles.find((p) => p.name === h);
                          const isNum = profile?.type === 'numeric';
                          return (
                            <th key={h} className="px-3 py-2 border-r border-slate-200 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <span>{h}</span>
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-normal ${
                                    isNum ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {isNum ? '123' : 'ABC'}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {dataset.data.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          <td className="px-3 py-1.5 border-r border-slate-200 text-[10px] text-slate-400 font-mono">
                            {idx + 1}
                          </td>
                          {dataset.headers.map((h) => (
                            <td key={h} className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap">
                              {row[h] !== null && row[h] !== undefined ? String(row[h]) : (
                                <span className="text-rose-400 italic">null</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
