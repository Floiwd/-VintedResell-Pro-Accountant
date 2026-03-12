import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem, ItemStatus, ItemCondition } from "../types";


const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') return null;
  return new GoogleGenAI({ apiKey: apiKey });
};

const MODEL_NAME = "gemini-3-flash-preview";

export const analyzeModelPerformance = async (modelData: any[]) => {
    const ai = getAiClient();
    if (!ai) return "Analyse indisponible.";

    // Compression des données pour éviter l'erreur 429 et rester sous les limites de tokens
    const data = modelData.map(m => ({
        n: m.model_name,
        b: m.brand,
        v: m.totalVolume, // Nb ventes
        px_d: Math.round(m.avgDisplayPrice || m.avgPrice * 1.1), // Prix affiché moyen
        px_f: Math.round(m.avgPrice), // Prix final vendu
        m: Math.round(m.totalProfit / (m.totalVolume || 1)), // Marge nette moy
        j: Math.round(m.avgDays), // Temps avant vente
        r_j: ((m.totalProfit / (m.totalVolume || 1)) / (m.avgDays || 1)).toFixed(2) // € / jour
    }));

    const prompt = `Agis en tant qu'expert Analyste Pricing Vinted. Analyse et COMPARE ces modèles :
    Données : ${JSON.stringify(data)}

    CONSIGNES STRICTES :
    1. Pour CHAQUE modèle, utilise EXACTEMENT ce template de conclusion : "Sur [v] ventes testées, les [n] se vendent en moyenne [j] jours plus vite mais seulement [différence px_f vs moyenne autres] plus cher. Conclusion : rentable uniquement sous [Z €] d’achat."
    2. Compare les métriques : Volume, Prix Affiché vs Vendu, Marge Nette, Temps avant vente, et Ratio € gagnés/jour.
    3. Donne un résumé factuel des forces et faiblesses.
    4. Recommande une stratégie de prix (prix de vente idéal) et de rotation (quand booster/baisser le prix).
    
    RÉPONSE : Très structurée, ton professionnel, maximum 250 mots.`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 } // Flash n'a pas besoin de gros thinking pour ça
            }
        });
        return response.text || "L'analyse n'a pas pu être générée.";
    } catch (e: any) {
        console.error("Gemini Error:", e);
        if (e.message?.includes('429')) {
            return "⚠️ Limite de débit atteinte (Erreur 429). Gemini est très sollicité. Réessayez dans 10-20 secondes avec moins de modèles sélectionnés.";
        }
        return "Une erreur est survenue lors de l'analyse IA.";
    }
}

export const analyzeProfitability = async (items: InventoryItem[]) => {
  const ai = getAiClient();
  if (!ai) return { analysis: "IA indisponible.", strategies: [], precautions: [], chartData: [] };
  const compressed = items.slice(0, 20).map(i => ({ n: i.name, p: i.purchasePrice, s: i.salePrice }));
  const schema = {
    type: Type.OBJECT,
    properties: {
      analysis: { type: Type.STRING },
      strategies: { type: Type.ARRAY, items: { type: Type.STRING } },
      precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
      chartData: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } } } }
    },
    required: ["analysis", "strategies", "precautions", "chartData"]
  };
  try {
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analyse ce stock : ${JSON.stringify(compressed)}`,
        config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    return { analysis: "Erreur d'analyse.", strategies: [], precautions: [], chartData: [] };
  }
};

export const parseItemDescription = async (text: string) => {
  const ai = getAiClient();
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Extraire en JSON : brand, modelName, category, size, condition, color depuis : "${text}"`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { return null; }
};