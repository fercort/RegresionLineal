import React from 'react';
import {
  FileText,
  SlidersHorizontal,
  BarChart2,
  CheckSquare,
  Cpu,
  Sigma,
  TrendingUp,
  Award,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export interface StepItem {
  id: number;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
}

export const STEPS: StepItem[] = [
  { id: 1, title: 'Contexto & Datos', shortTitle: '1. Ingesta', icon: FileText },
  { id: 2, title: 'Diagnóstico & Prep', shortTitle: '2. Limpieza', icon: SlidersHorizontal },
  { id: 3, title: 'Análisis Exploratorio', shortTitle: '3. EDA', icon: BarChart2 },
  { id: 4, title: 'Selección de Variables', shortTitle: '4. Selección', icon: CheckSquare },
  { id: 5, title: 'Entrenamiento OLS', shortTitle: '5. Modelo OLS', icon: Cpu },
  { id: 6, title: 'Ecuación & Coeficientes', shortTitle: '6. Ecuación', icon: Sigma },
  { id: 7, title: 'Simulador What-If', shortTitle: '7. Simulador', icon: TrendingUp },
  { id: 8, title: 'Reporte Estratégico', shortTitle: '8. Estrategia', icon: Award },
];

interface StepNavigationProps {
  currentStep: number;
  maxUnlockedStep: number;
  onSelectStep: (stepId: number) => void;
  canProceed: boolean;
  onNext: () => void;
  onPrev: () => void;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  maxUnlockedStep,
  onSelectStep,
  canProceed,
  onNext,
  onPrev,
}) => {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Horizontal Stepper Bar */}
        <div className="flex items-center justify-between overflow-x-auto py-2.5 no-scrollbar gap-1 sm:gap-2">
          {STEPS.map(step => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isUnlocked = step.id <= maxUnlockedStep;

            return (
              <button
                key={step.id}
                disabled={!isUnlocked}
                onClick={() => onSelectStep(step.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/50'
                    : isUnlocked
                    ? 'text-slate-600 hover:bg-slate-100'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : isCompleted
                      ? 'bg-indigo-600 text-white'
                      : isUnlocked
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-slate-100 text-slate-300'
                  }`}
                >
                  {isCompleted ? '✓' : step.id}
                </div>
                <Icon className="w-3.5 h-3.5 hidden sm:inline" />
                <span>{step.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-bar with Prev/Next Quick Navigation */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Módulo {currentStep} de 8:
            </span>
            <span className="text-slate-600">
              {STEPS.find(s => s.id === currentStep)?.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={currentStep === 1}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition ${
                currentStep > 1
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'border-slate-200 text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              onClick={onNext}
              disabled={!canProceed || currentStep === 8}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition ${
                canProceed && currentStep < 8
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
