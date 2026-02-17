
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { UserProfile, NutritionPlan, Pathology } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateNutritionPlan = async (profile: UserProfile): Promise<NutritionPlan[]> => {
  const prompt = `Generate a detailed weekly nutrition plan (7 days) for a patient with the following profile:
    Age: ${profile.age}, Sex: ${profile.sex}, BMI: ${profile.bmi.toFixed(1)},
    Pathologies: ${profile.pathologies.join(', ')},
    Allergies: ${profile.allergies.join(', ')},
    Goals: ${profile.goals.join(', ')}.
    Ensure strict limitations on ${profile.pathologies.includes(Pathology.HYPERTENSION) ? 'sodium' : 'sugar'} and balance macros according to their condition.
    Provide a unique 'analysis' string for each meal explaining why it's good for their specific pathology.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING },
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  name: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER },
                  sodium: { type: Type.NUMBER },
                  sugar: { type: Type.NUMBER },
                  analysis: { type: Type.STRING }
                },
                required: ['id', 'type', 'name', 'calories', 'protein', 'carbs', 'fat']
              }
            },
            totalCalories: { type: Type.NUMBER }
          },
          required: ['day', 'meals', 'totalCalories']
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const createAssistantChat = (profile: UserProfile): Chat => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are NutriPath AI, a world-class clinical nutrition assistant specializing in chronic diseases.
      Patient Profile: ${JSON.stringify(profile)}.
      Always provide medically sound, supportive, and actionable advice. 
      If a user reports dangerous symptoms (e.g., extremely high blood pressure or blood sugar), advise them to seek emergency care immediately.
      Be empathetic and professional.`,
    },
  });
};

export const analyzeHealthRisk = async (profile: UserProfile, recentMetrics: any[]) => {
  const prompt = `Analyze health risk for a patient with ${profile.pathologies.join(', ')}.
    Recent metrics: ${JSON.stringify(recentMetrics)}.
    Provide a health score (0-100), current risk level, and 3 key recommendations.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          healthScore: { type: Type.NUMBER },
          riskLevel: { type: Type.STRING },
          complianceScore: { type: Type.NUMBER },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          aiFeedback: { type: Type.STRING }
        },
        required: ['healthScore', 'riskLevel', 'recommendations']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const analyzeMealCapture = async (description: string, imageBase64?: string) => {
    const parts: any[] = [{ text: `Analyze this meal: ${description}. Provide calories, protein, carbs, fat, sodium, and sugar. Also provide a health impact summary for a chronic disease patient.` }];
    
    if (imageBase64) {
        parts.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64
            }
        });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER },
                    sodium: { type: Type.NUMBER },
                    sugar: { type: Type.NUMBER },
                    summary: { type: Type.STRING }
                }
            }
        }
    });

    return JSON.parse(response.text || '{}');
}
