
import { UserProfile, NutritionPlan, Pathology } from "../types";
import { puterChatJSON, puterChat } from "./puterService";

export type PlanLocale = 'fr' | 'en';

export const generateNutritionPlan = async (profile: UserProfile, locale: PlanLocale = 'en'): Promise<NutritionPlan[]> => {
  const langInstruction = locale === 'fr'
    ? 'CRITICAL: Write ALL meal names, analysis, and descriptions in FRENCH. Use French terms like "Petit-déjeuner", "Déjeuner", "Dîner", "Collation" for meal types.'
    : 'Write all content in English.';

  const prompt = `[ROLE: PERSONAL NUTRITION ASSISTANT]
TASK: Suggest a 7-day meal plan for educational purposes. Return ONE JSON array with 7 objects.

LANGUAGE: ${langInstruction}

CONTEXT:
- User Age: ${profile.age}, Gender: ${profile.sex}, BMI: ${profile.bmi.toFixed(1)}
- Dietary focus: ${profile.pathologies.join(', ') || 'general'}
- Allergies: ${profile.allergies.join(', ') || 'none'}
- Primary Goals: ${profile.goals.join(', ') || 'balanced nutrition'}

GUIDELINES: ${profile.pathologies.includes(Pathology.HYPERTENSION) ? 'Low sodium.' : 'Low sugar.'} Balanced macros. Brief analysis per meal.

DISCLAIMER: Educational suggestion, not medical advice.

OUTPUT: Return ONLY a JSON array of 7 objects, each with this structure:
{
  "day": "Day 1",
  "meals": [
    {
      "id": "d1-b1",
      "type": "Breakfast",
      "name": "Meal name in ${locale === 'fr' ? 'French' : 'English'}",
      "calories": 400,
      "protein": 20,
      "carbs": 45,
      "fat": 15,
      "sodium": 300,
      "sugar": 8,
      "analysis": "Brief reasoning in ${locale === 'fr' ? 'French' : 'English'}"
    }
  ],
  "totalCalories": 1800
}
Each day: 3-4 meals. Use type: "Breakfast"|"Lunch"|"Dinner"|"Snack". Use unique ids like "d1-b1", "d2-l1".`;

  try {
    const result = await puterChatJSON<NutritionPlan[]>(prompt, { max_tokens: 8000 });
    return Array.isArray(result) ? result : [result];
  } catch (error) {
    console.error("Meal Generation Error:", error);
    throw error;
  }
};

// Simplified Chat implementation to work with Puter.js
export class PuterChatWrapper {
    private history: any[] = [];
    private profile: UserProfile;

    constructor(profile: UserProfile) {
        this.profile = profile;
        this.history.push({
            role: 'system',
            content: `You are NutriPath AI, a friendly nutrition companion helping users with dietary context.
            User Profile: ${JSON.stringify(profile)}.
            Always provide helpful, supportive, and actionable suggestions. 
            NOTE: This is for educational purposes. For dangerous symptoms, advise seeking prompt medical care.
            Be empathetic and professional.`
        });
    }

    async sendMessage(input: string | { message: string }) {
        const message = typeof input === 'string' ? input : input.message;
        
        this.history.push({ role: 'user', content: message });
        const response = await puterChat(this.history);
        const assistantMessage = response.message.content;
        this.history.push({ role: 'assistant', content: assistantMessage });
        
        return {
            text: assistantMessage,
            response: {
                text: () => assistantMessage
            }
        };
    }
}

export const createAssistantChat = (profile: UserProfile): any => {
    return new PuterChatWrapper(profile);
};

export interface HealthAnalysis {
  healthScore: number;
  riskLevel: string;
  complianceScore: number;
  recommendations: string[];
  aiFeedback: string;
}

export interface MealAnalysis {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  sugar: number;
  summary: string;
}

export const analyzeHealthRisk = async (profile: UserProfile, recentMetrics: any[]): Promise<HealthAnalysis> => {
  const prompt = `Analyze health risk for a patient with ${profile.pathologies.join(', ')}.
    Recent metrics: ${JSON.stringify(recentMetrics)}.
    Provide risk analysis as JSON with fields: healthScore (0-100), riskLevel (string), complianceScore (number), recommendations (array of strings), aiFeedback (string).`;

  return await puterChatJSON<HealthAnalysis>(prompt);
};

export const analyzeMealCapture = async (description: string, imageBase64?: string): Promise<MealAnalysis> => {
    let prompt = `Analyze this meal: ${description}. Provide calories, protein, carbs, fat, sodium, and sugar. Also provide a health impact summary for a chronic disease patient.`;
    
    if (imageBase64) {
        prompt += ` (Image analysis requested for the provided image description)`;
    }

    prompt += `\nResponse format: JSON object with fields: name, calories, protein, carbs, fat, sodium, sugar, summary.`;

    return await puterChatJSON<MealAnalysis>(prompt);
}
