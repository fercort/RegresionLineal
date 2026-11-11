import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  // Gemini API analytical dispatch endpoint
  app.post('/api/gemini/analyze', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY no configurada en el servidor. Se utilizará el motor econométrico local.',
          fallback: true,
        });
      }

      const { action, payload } = req.body;

      if (action === 'recommend_variables') {
        const prompt = `Actúa como Econometrista Senior y Científico de Datos.
El usuario tiene un problema de negocio:
"${payload.businessContext || 'Predecir y entender la variable dependiente principal del negocio'}"

Columnas disponibles en el dataset:
${JSON.stringify(payload.columnsSummary, null, 2)}

Muestra de las primeras filas:
${JSON.stringify(payload.sampleRows, null, 2)}

Tu tarea:
1. Recomienda la mejor Variable Dependiente (Y / Target) para responder a esta pregunta de negocio.
2. Explica brevemente la razón de negocio.
3. Recomienda las mejores Variables Independientes (X1, X2, ...), evitando IDs obvios o columnas con target leakage (fuga de información) o multicolinealidad obvia.
4. Identifica columnas a evitar o de precaución.
Responde estrictamente en formato JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendedTarget: { type: Type.STRING },
                targetRationale: { type: Type.STRING },
                recommendedPredictors: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                predictorsRationale: { type: Type.STRING },
                cautionVariables: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['recommendedTarget', 'targetRationale', 'recommendedPredictors', 'predictorsRationale'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, data: parsed });
      }

      if (action === 'eda_insights') {
        const prompt = `Actúa como Consultor en Econometría.
Contexto de negocio: "${payload.businessContext}"
Estadísticas descriptivas de variables:
${JSON.stringify(payload.stats, null, 2)}
Matriz de correlación relevante con el target o entre predictores:
${JSON.stringify(payload.correlationHighlights, null, 2)}

Proporciona un diagnóstico de negocio en JSON con:
1. businessSummary: Resumen ejecutivo de los datos en relación con el negocio (1-2 párrafos).
2. anomaliesOrRisks: Lista de posibles anomalías, sesgos o reglas de negocio observables en las estadísticas.
3. keyCorrelations: Lista de correlaciones más fuertes y su implicación práctica.
4. dataQualityRating: 'Excelente' | 'Buena' | 'Aceptable' | 'Requiere Atención'.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                businessSummary: { type: Type.STRING },
                anomaliesOrRisks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                keyCorrelations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                dataQualityRating: { type: Type.STRING },
              },
              required: ['businessSummary', 'anomaliesOrRisks', 'keyCorrelations', 'dataQualityRating'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, data: parsed });
      }

      if (action === 'interpret_model') {
        const prompt = `Actúa como Econometrista y Traductor de Datos para Directores de Negocio.
Contexto de negocio: "${payload.businessContext}"
Ecuación estimada: ${payload.equationString}
R²: ${payload.r2}, R² Ajustado: ${payload.adjustedR2}, F-stat: ${payload.fStatistic} (p-value: ${payload.fPValue})
Coeficientes y significancia:
${JSON.stringify(payload.coefficients, null, 2)}

Tu objetivo es traducir estos hallazgos estadísticos a un lenguaje de negocio accionable:
1. equationExplanation: Explicación didáctica de la ecuación para directores ejecutivos.
2. coefficientExplanations: Un objeto mapeando cada variable predictora a su interpretación en negocio bajo la condición ceteris paribus ("manteniendo todo lo demás constante").
3. executiveTakeaway: La conclusión central sobre la bondad de ajuste del modelo y si es confiable para tomar decisiones.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                equationExplanation: { type: Type.STRING },
                executiveTakeaway: { type: Type.STRING },
              },
              required: ['equationExplanation', 'executiveTakeaway'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, data: parsed });
      }

      if (action === 'strategic_report') {
        const prompt = `Actúa como Senior Business Economist & Chief Strategy Officer.
Pregunta / Contexto de Negocio: "${payload.businessContext}"
Métricas del Modelo:
- Variable Objetivo: ${payload.targetVariable}
- R²: ${payload.r2} (${(payload.r2 * 100).toFixed(1)}% de la varianza explicada)
- R² Ajustado: ${payload.adjustedR2}
- RMSE: ${payload.rmse}
Variables y Coeficientes:
${JSON.stringify(payload.coefficients, null, 2)}
Escenarios Simulados:
${JSON.stringify(payload.scenarios, null, 2)}

Genera un reporte estratégico de alto nivel para la Junta Directiva en JSON:
- executiveSummary: Síntesis de alto impacto (1-2 párrafos).
- businessQuestionAnswer: Respuesta directa, cuantificada y fundamentada a la pregunta de negocio inicial.
- keyDriversRanked: Array ordenado de variables palanca con { variable, impact, recommendation }.
- scenarioAdvice: { optimisticAction: recomendación para capturar el escenario favorable, pessimisticMitigation: medidas de mitigación para el escenario adverso }.
- econometricConfidence: Evaluación honesta de la solidez estadística y advertencias econométricas.
- nextSteps: 3 a 5 acciones operativas inmediatas para la organización.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                executiveSummary: { type: Type.STRING },
                businessQuestionAnswer: { type: Type.STRING },
                keyDriversRanked: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      variable: { type: Type.STRING },
                      impact: { type: Type.STRING },
                      recommendation: { type: Type.STRING },
                    },
                    required: ['variable', 'impact', 'recommendation'],
                  },
                },
                scenarioAdvice: {
                  type: Type.OBJECT,
                  properties: {
                    optimisticAction: { type: Type.STRING },
                    pessimisticMitigation: { type: Type.STRING },
                  },
                  required: ['optimisticAction', 'pessimisticMitigation'],
                },
                econometricConfidence: { type: Type.STRING },
                nextSteps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['executiveSummary', 'businessQuestionAnswer', 'keyDriversRanked', 'scenarioAdvice', 'econometricConfidence', 'nextSteps'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, data: parsed });
      }

      return res.status(400).json({ error: 'Acción no soportada' });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      return res.status(500).json({
        error: err.message || 'Error al comunicarse con Gemini API',
        fallback: true,
      });
    }
  });

  // Serve static assets or mount Vite in development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Econometric App server listening at http://0.0.0.0:${port}`);
  });
}

startServer();
