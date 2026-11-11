import { GoogleGenAI, Type } from '@google/genai';

/**
 * Vercel Serverless Function handler for /api/gemini
 * Ensures seamless deployment on Vercel
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY no configurada. Usando motor econométrico local.',
      fallback: true,
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const { action, payload } = req.body;

    if (action === 'recommend_variables') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Actúa como Econometrista Senior y Científico de Datos.
Contexto de negocio: "${payload.businessContext || 'Predecir la variable objetivo'}"
Columnas: ${JSON.stringify(payload.columnsSummary)}
Muestra: ${JSON.stringify(payload.sampleRows)}
Recomienda la mejor variable Y y las variables predictoras X.`,
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

      return res.status(200).json({ success: true, data: JSON.parse(response.text || '{}') });
    }

    if (action === 'eda_insights') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Contexto: "${payload.businessContext}"
Estadísticas: ${JSON.stringify(payload.stats)}
Correlaciones: ${JSON.stringify(payload.correlationHighlights)}
Analiza reglas de negocio, correlaciones clave y calidad de datos.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              businessSummary: { type: Type.STRING },
              anomaliesOrRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyCorrelations: { type: Type.ARRAY, items: { type: Type.STRING } },
              dataQualityRating: { type: Type.STRING },
            },
            required: ['businessSummary', 'anomaliesOrRisks', 'keyCorrelations', 'dataQualityRating'],
          },
        },
      });

      return res.status(200).json({ success: true, data: JSON.parse(response.text || '{}') });
    }

    if (action === 'interpret_model') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Contexto: "${payload.businessContext}"
Ecuación: ${payload.equationString}
R²: ${payload.r2}, F: ${payload.fStatistic}
Coeficientes: ${JSON.stringify(payload.coefficients)}
Interpreta la ecuación y los coeficientes ceteris paribus para directores ejecutivos.`,
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

      return res.status(200).json({ success: true, data: JSON.parse(response.text || '{}') });
    }

    if (action === 'strategic_report') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Contexto: "${payload.businessContext}"
Target: ${payload.targetVariable}, R²: ${payload.r2}, RMSE: ${payload.rmse}
Coeficientes: ${JSON.stringify(payload.coefficients)}
Escenarios: ${JSON.stringify(payload.scenarios)}
Genera informe ejecutivo para la toma de decisiones.`,
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
              nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['executiveSummary', 'businessQuestionAnswer', 'keyDriversRanked', 'scenarioAdvice', 'econometricConfidence', 'nextSteps'],
          },
        },
      });

      return res.status(200).json({ success: true, data: JSON.parse(response.text || '{}') });
    }

    return res.status(400).json({ error: 'Acción no soportada' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, fallback: true });
  }
}
