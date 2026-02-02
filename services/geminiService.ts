
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

/**
 * Utilitaire de gestion des tentatives (retry) avec backoff exponentiel.
 * Utile pour gérer les erreurs transitoires comme 429 (quota) ou 5xx (serveur).
 */
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // On ne réessaie que pour les erreurs de quota (429) ou les erreurs serveur (5xx)
      const status = error?.status || error?.response?.status;
      const isRateLimit = status === 429 || error?.message?.includes('429');
      const isServerError = status >= 500 || error?.message?.includes('500') || error?.message?.includes('503');
      
      if ((isRateLimit || isServerError) && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`Gemini API: Erreur temporaire (${status}). Tentative ${i + 1}/${maxRetries} après ${delay.toFixed(0)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

/**
 * Initialise l'instance client. 
 * Note: La clé est récupérée depuis process.env.API_KEY.
 */
const getClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("Clé API manquante. Veuillez configurer votre clé API Gemini.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Récupère des conseils business basés sur le contexte de l'application.
 */
export const getBusinessInsights = async (context: string, query: string) => {
  try {
    const ai = getClient();
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tu es un assistant expert en gestion d'entreprise pour l'ERP TerraPOS+.
      Contexte des données actuelles (JSON): ${context}
      Question de l'utilisateur: ${query}
      
      Fournis une réponse concise, professionnelle et en français. Si tu suggères des actions, formate-les sous forme de liste.`,
    }));

    return response.text || "Désolé, je n'ai pas pu générer de réponse pour le moment.";
  } catch (error: any) {
    console.error("Gemini API Error (getBusinessInsights):", error);
    if (error?.message?.includes('429')) return "Quota dépassé. Veuillez réessayer dans quelques instants.";
    if (error?.message?.includes('403')) return "Accès refusé. Vérifiez la validité de votre clé API.";
    return "L'assistant rencontre des difficultés techniques. Veuillez réessayer plus tard.";
  }
};

/**
 * Analyse les données de ventes pour en extraire des indicateurs clés.
 */
export const analyzeSalesData = async (salesData: any) => {
  try {
    const ai = getClient();
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyse ces chiffres de vente et fournis 3 points clés de performance (takeaways) en français pour TerraPOS+: ${JSON.stringify(salesData)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          propertyOrdering: ["insights"]
        }
      }
    }));

    const text = response.text;
    if (!text) return ["Aucune analyse disponible pour le moment."];

    try {
      const data = JSON.parse(text);
      return data.insights || ["Données d'analyse incomplètes."];
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON output:", text);
      return ["Erreur lors de l'interprétation des résultats de l'analyse."];
    }
  } catch (error: any) {
    console.error("Gemini API Error (analyzeSalesData):", error);
    return ["Impossible d'analyser les ventes actuellement en raison d'une erreur technique."];
  }
};
