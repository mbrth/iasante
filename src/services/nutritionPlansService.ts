import { supabase } from './supabaseClient';
import { NutritionPlan } from '../types';

export const saveFullNutritionPlan = async (plans: NutritionPlan[]): Promise<void> => {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
            throw new Error('User not authenticated');
        }

        const userId = sessionData.session.user.id;
        const today = new Date();
        const formattedPlans = plans.map((plan, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() + index);
            const dateString = date.toISOString().split('T')[0];
            
            return {
                user_id: userId,
                day: dateString,
                meals: plan.meals,
                total_calories: plan.totalCalories,
            };
        });

        // To be safe against missing unique constraints, we delete then insert
        // This ensures no duplicates for the days we are about to save
        const dayStrings = formattedPlans.map(p => p.day);
        
        await supabase
            .from('nutrition_plans')
            .delete()
            .eq('user_id', userId)
            .in('day', dayStrings);

        const { error } = await supabase
            .from('nutrition_plans')
            .insert(formattedPlans);

        if (error) {
            throw error;
        }
        console.log(`[NutritionPlansService] Successfully saved 7-day plan.`);
    } catch (error) {
        console.error('Error saving full nutrition plan:', error);
        throw error;
    }
};

export const saveNutritionPlan = async (plan: NutritionPlan): Promise<void> => {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('nutrition_plans')
            .upsert({
                user_id: sessionData.session.user.id,
                day: plan.day,
                meals: plan.meals,
                total_calories: plan.totalCalories,
            });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error saving nutrition plan:', error);
        throw error;
    }
};

export const loadNutritionPlans = async (startDate?: string, endDate?: string): Promise<NutritionPlan[]> => {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
            throw new Error('User not authenticated');
        }

        let query = supabase
            .from('nutrition_plans')
            .select('*')
            .eq('user_id', sessionData.session.user.id)
            .order('day', { ascending: false });

        if (startDate) {
            query = query.gte('day', startDate);
        }

        if (endDate) {
            query = query.lte('day', endDate);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return (data || []).map(dbPlan => ({
            day: dbPlan.day,
            meals: dbPlan.meals,
            totalCalories: dbPlan.total_calories,
        }));
    } catch (error) {
        console.error('Error loading nutrition plans:', error);
        throw error;
    }
};

export const getLatestNutritionPlan = async (): Promise<NutritionPlan | null> => {
    try {
        const plans = await loadNutritionPlans();
        return plans.length > 0 ? plans[0] : null;
    } catch (error) {
        console.error('Error getting latest nutrition plan:', error);
        return null;
    }
};

export const getCurrentWeekPlans = async (): Promise<NutritionPlan[]> => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return loadNutritionPlans(
        startOfWeek.toISOString().split('T')[0],
        endOfWeek.toISOString().split('T')[0]
    );
};
