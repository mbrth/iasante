// Service to use local Gemma 3 4B model via LM Studio
const LOCAL_MODEL_URL = 'http://127.0.0.1:1234/v1/chat/completions';
const CHECK_TIMEOUT = 2000; // 2 seconds max to check availability

export const isLocalModelAvailable = async (): Promise<boolean> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

        const response = await fetch(LOCAL_MODEL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemma-3-4b',
                messages: [{ role: 'user', content: 'Test' }],
                max_tokens: 10,
                temperature: 0.3,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.log('Local model not available, will use Gemini');
        return false;
    }
};

export const generateWithLocalModel = async (prompt: string, responseFormat?: 'json' | 'text'): Promise<string> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

        const response = await fetch(LOCAL_MODEL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemma-3-4b',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a medical nutrition AI assistant. Always respond in valid JSON when requested, and provide accurate, helpful information about nutrition and chronic disease management.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
                max_tokens: 2000,
                top_p: 0.9,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.error('No content in response:', data);
            throw new Error('Empty response from LM Studio');
        }

        console.log('Raw LM Studio response:', content);

        if (responseFormat === 'json') {
            // Clean response if it contains markdown JSON or wrapper
            content = content.trim();

            // Try to detect if it's wrapped JSON
            if (content.includes('```json')) {
                content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            }

            // Try to parse to validate JSON
            try {
                JSON.parse(content);
            } catch {
                // If still invalid, try to extract JSON array/object
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    content = jsonMatch[0];
                }
            }
        }

        return content;
    } catch (error) {
        console.error('Error calling LM Studio:', error);
        throw error;
    }
};

// Generate nutrition plan using local model
import { UserProfile, NutritionPlan } from '../types';

export const generateNutritionPlanLocal = async (profile: UserProfile): Promise<NutritionPlan[]> => {
    const prompt = `Create a 3-day nutrition plan as JSON. Profile: age ${profile.age}, BMI ${profile.bmi}, sex ${profile.sex}, conditions: ${profile.pathologies.join(', ') || 'none'}, allergies: ${profile.allergies.join(', ') || 'none'}. 

Response must be ONLY a JSON array with this exact structure:
[{"day":"YYYY-MM-DD","meals":[{"id":"string","type":"Breakfast|Lunch|Dinner|Snack","name":"string","calories":number,"protein":number,"carbs":number,"fat":number,"sodium":number,"sugar":number,"analysis":"string"}],"totalCalories":number}]

Dates should be for today and the next 2 days.`;

    const result = await generateWithLocalModel(prompt, 'json');

    try {
        const plans = JSON.parse(result);
        return plans;
    } catch (error) {
        console.error('Failed to parse local model response:', error);
        throw new Error('Invalid response from local model');
    }
};

// Analyze meal using local model
export const analyzeMealLocal = async (mealDescription: string, profile: UserProfile): Promise<string> => {
    const prompt = `Analyze this meal for someone with: conditions ${profile.pathologies.join(', ') || 'none'}, allergies ${profile.allergies.join(', ') || 'none'}. 

Meal: ${mealDescription}

Provide a brief nutritional analysis in JSON:
{"calories":number,"protein":number,"carbs":number,"fat":number,"verdict":"string","warnings":string[]}`;

    const result = await generateWithLocalModel(prompt, 'json');
    return result;
};

// Analyze health risk using local model
export const analyzeHealthRiskLocal = async (metrics: { glucose?: number; weight: number; bloodPressure?: { systolic: number; diastolic: number } }, profile: UserProfile): Promise<{ riskLevel: string; factors: string[]; recommendations: string[] }> => {
    const prompt = `Analyze health risk for: age ${profile.age}, conditions ${profile.pathologies.join(', ') || 'none'}. 

Metrics: glucose ${metrics.glucose} mg/dL, weight ${metrics.weight} kg, BP ${metrics.bloodPressure?.systolic}/${metrics.bloodPressure?.diastolic} mmHg.

Provide risk analysis in JSON:
{"riskLevel":"low|medium|high","factors":["string"],"recommendations":["string"]}`;

    const result = await generateWithLocalModel(prompt, 'json');

    try {
        return JSON.parse(result);
    } catch {
        return {
            riskLevel: 'medium',
            factors: ['Unable to analyze'],
            recommendations: ['Consult a healthcare provider']
        };
    }
};
