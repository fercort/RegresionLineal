import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StepNavigation } from './components/StepNavigation';
import { Module1BusinessContext } from './components/Module1BusinessContext';
import { Module2DataPrep } from './components/Module2DataPrep';
import { Module3EDA } from './components/Module3EDA';
import { Module4VariableSelection } from './components/Module4VariableSelection';
import { Module5ModelTraining } from './components/Module5ModelTraining';
import { Module6ModelEquation } from './components/Module6ModelEquation';
import { Module7ScenarioSimulator } from './components/Module7ScenarioSimulator';
import { Module8StrategicReport } from './components/Module8StrategicReport';

import { SAMPLE_DATASETS, SampleDataset } from './utils/sampleDatasets';
import { profileColumns } from './utils/dataParser';
import { fitOLS, fitRefinedModel } from './utils/mathEngine';
import {
  DatasetState,
  ImputationConfig,
  DummyEncodingConfig,
  ModelComparison,
  RegressionResult,
  ScenarioDefinition,
} from './types/econometrics';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(8);

  // Business Context
  const [businessContext, setBusinessContext] = useState<string>(
    SAMPLE_DATASETS[0].businessQuestion
  );

  // Active Dataset
  const [dataset, setDataset] = useState<DatasetState | null>(() => {
    const s = SAMPLE_DATASETS[0];
    const profiles = profileColumns(s.data, s.headers);
    return {
      rawFileName: s.fileName,
      rowCount: s.data.length,
      columnCount: s.headers.length,
      headers: s.headers,
      data: s.data,
      cleanedData: s.data,
      profiles,
    };
  });

  // Imputation & Dummy Configs
  const [imputationConfig, setImputationConfig] = useState<ImputationConfig>({});
  const [dummyConfig, setDummyConfig] = useState<DummyEncodingConfig>({
    columnsToEncode: ['Zona'],
    dropFirst: true,
    mappings: {},
  });

  // Target and Predictors
  const [targetVariable, setTargetVariable] = useState<string>(
    SAMPLE_DATASETS[0].suggestedTarget
  );
  const [selectedPredictors, setSelectedPredictors] = useState<string[]>(
    SAMPLE_DATASETS[0].suggestedPredictors
  );

  // Model comparison & results
  const [modelComparison, setModelComparison] = useState<ModelComparison | null>(null);
  const [selectedModelType, setSelectedModelType] = useState<'full' | 'refined'>('full');

  // Simulation scenarios
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);

  // Function to train regression model
  const trainModel = (dataToUse = dataset?.cleanedData) => {
    if (!dataToUse || !targetVariable || selectedPredictors.length === 0) return;

    try {
      const y = dataToUse.map((r) => Number(r[targetVariable]) || 0);
      const X = dataToUse.map((r) =>
        selectedPredictors.map((p) => Number(r[p]) || 0)
      );

      const fullResult = fitOLS(y, X, targetVariable, selectedPredictors);
      const refinedResult = fitRefinedModel(y, X, targetVariable, selectedPredictors, fullResult);

      const comparison: ModelComparison = {
        fullModel: fullResult,
        refinedModel: refinedResult,
        selectedModelType: 'full',
      };

      setModelComparison(comparison);
      setSelectedModelType('full');
      // Reset scenarios to be regenerated
      setScenarios([]);
    } catch (err: any) {
      console.error('Error training model:', err);
    }
  };

  // Train initial model on load
  useEffect(() => {
    if (dataset && selectedPredictors.length > 0 && targetVariable) {
      trainModel(dataset.cleanedData);
    }
  }, []);

  // Handle loading sample dataset
  const handleLoadSample = (sample: SampleDataset) => {
    const profiles = profileColumns(sample.data, sample.headers);
    const newDs: DatasetState = {
      rawFileName: sample.fileName,
      rowCount: sample.data.length,
      columnCount: sample.headers.length,
      headers: sample.headers,
      data: sample.data,
      cleanedData: sample.data,
      profiles,
    };

    setDataset(newDs);
    setBusinessContext(sample.businessQuestion);
    setTargetVariable(sample.suggestedTarget);
    setSelectedPredictors(sample.suggestedPredictors);
    setImputationConfig({});
    setDummyConfig({
      columnsToEncode: [],
      dropFirst: true,
      mappings: {},
    });
    setScenarios([]);
    setCurrentStep(1);
    setMaxUnlockedStep(8);

    // Train model on new dataset
    trainModel(sample.data);
  };

  // Reset entire workflow
  const handleReset = () => {
    setDataset(null);
    setBusinessContext('');
    setTargetVariable('');
    setSelectedPredictors([]);
    setModelComparison(null);
    setScenarios([]);
    setCurrentStep(1);
    setMaxUnlockedStep(1);
  };

  // Unlock and proceed
  const handleProceedFromStep = (step: number) => {
    const nextStep = step + 1;
    if (nextStep <= 8) {
      setMaxUnlockedStep((prev) => Math.max(prev, nextStep));
      setCurrentStep(nextStep);
    }

    // Specific transitions
    if (step === 4) {
      // From variable selection to OLS training
      trainModel();
    }
  };

  const activeModel: RegressionResult | null = modelComparison
    ? selectedModelType === 'refined' && modelComparison.refinedModel
      ? modelComparison.refinedModel
      : modelComparison.fullModel
    : null;

  const canProceed = Boolean(
    dataset &&
      dataset.rowCount > 0 &&
      (currentStep < 4 || (targetVariable && selectedPredictors.length > 0))
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentDatasetName={dataset?.rawFileName || 'Sin archivo'}
        rowCount={dataset?.rowCount || 0}
        colCount={dataset?.columnCount || 0}
        onSelectSample={handleLoadSample}
        onReset={handleReset}
      />

      {/* Step Navigation Pipeline */}
      <StepNavigation
        currentStep={currentStep}
        maxUnlockedStep={maxUnlockedStep}
        onSelectStep={(stepId) => setCurrentStep(stepId)}
        canProceed={canProceed}
        onNext={() => handleProceedFromStep(currentStep)}
        onPrev={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Module 1: Business Context & Data Ingestion */}
        {currentStep === 1 && (
          <Module1BusinessContext
            businessContext={businessContext}
            setBusinessContext={setBusinessContext}
            dataset={dataset}
            setDataset={(ds) => {
              setDataset(ds);
              if (ds) {
                setMaxUnlockedStep((prev) => Math.max(prev, 2));
              }
            }}
            onProceed={() => handleProceedFromStep(1)}
            onLoadSample={handleLoadSample}
          />
        )}

        {/* Module 2: Data Diagnostics & Preparation */}
        {currentStep === 2 && dataset && (
          <Module2DataPrep
            dataset={dataset}
            setDataset={setDataset}
            imputationConfig={imputationConfig}
            setImputationConfig={setImputationConfig}
            dummyConfig={dummyConfig}
            setDummyConfig={setDummyConfig}
            onProceed={() => handleProceedFromStep(2)}
          />
        )}

        {/* Module 3: Exploratory Data Analysis (EDA) */}
        {currentStep === 3 && dataset && (
          <Module3EDA
            businessContext={businessContext}
            dataset={dataset}
            targetVariable={targetVariable}
            onProceed={() => handleProceedFromStep(3)}
          />
        )}

        {/* Module 4: Intelligent Variable Selection */}
        {currentStep === 4 && dataset && (
          <Module4VariableSelection
            businessContext={businessContext}
            dataset={dataset}
            targetVariable={targetVariable}
            setTargetVariable={setTargetVariable}
            selectedPredictors={selectedPredictors}
            setSelectedPredictors={setSelectedPredictors}
            onProceed={() => handleProceedFromStep(4)}
          />
        )}

        {/* Module 5: OLS Model Training & ANOVA */}
        {currentStep === 5 && modelComparison && activeModel && (
          <Module5ModelTraining
            modelComparison={modelComparison}
            activeModel={activeModel}
            onSelectModelType={(type) => {
              setSelectedModelType(type);
              setModelComparison({ ...modelComparison, selectedModelType: type });
            }}
            onProceed={() => handleProceedFromStep(5)}
          />
        )}

        {/* Module 6: Model Equation & Coefficient Interpretation */}
        {currentStep === 6 && activeModel && (
          <Module6ModelEquation
            businessContext={businessContext}
            model={activeModel}
            onProceed={() => handleProceedFromStep(6)}
          />
        )}

        {/* Module 7: What-If Scenario Simulator */}
        {currentStep === 7 && dataset && activeModel && (
          <Module7ScenarioSimulator
            datasetRows={dataset.cleanedData}
            model={activeModel}
            onProceed={() => handleProceedFromStep(7)}
            scenarios={scenarios}
            setScenarios={setScenarios}
          />
        )}

        {/* Module 8: Strategic Report & Business Advice */}
        {currentStep === 8 && activeModel && (
          <Module8StrategicReport
            businessContext={businessContext}
            model={activeModel}
            scenarios={scenarios}
            datasetName={dataset?.rawFileName || 'dataset'}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Econometr<strong className="text-indigo-600">IX</strong> • Plataforma de Regresión Múltiple & Simulación OLS
          </p>
          <p className="text-[11px] text-slate-400">
            Desarrollado para despliegue en Vercel & exportación a GitHub
          </p>
        </div>
      </footer>
    </div>
  );
}
