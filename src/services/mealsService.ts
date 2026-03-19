import { supabase } from './supabaseClient';
import { Meal } from '../types';

export const saveMeal = async (meal: Meal, date: string): Promise<void> => {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('meals')
            .upsert({
                user_id: sessionData.session.user.id,
                id: meal.id,
                type: meal.type,
                name: meal.name,
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fat: meal.fat,
                sodium: meal.sodium,
                sugar: meal.sugar,
                analysis: meal.analysis,
                date: date,
            });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error saving meal:', error);
        throw error;
    }
};

export const loadMeals = async (startDate?: string, endDate?: string): Promise<Meal[]> => {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
            throw new Error('User not authenticated');
        }

        let query = supabase
            .from('meals')
            .select('*')
            .eq('user_id', sessionData.session.user.id)
            .order('date', { ascending: false });

        if (startDate) {
            query = query.gte('date', startDate);
        }

        if (endDate) {
            query = query.lte('date', endDate);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return (data || []).map(dbMeal => ({
            id: dbMeal.id,
            type: dbMeal.type,
            name: dbMeal.name,
            calories: dbMeal.calories,
            protein: dbMeal.protein,
            carbs: dbMeal.carbs,
            fat: dbMeal.fat,
            sodium: dbMeal.sodium,
            sugar: dbMeal.sugar,
            analysis: dbMeal.analysis,
        }));
    } catch (error) {
        console.error('Error loading meals:', error);
        throw error;
    }
};

export const deleteMeal = async (mealId: string): Promise<void> => {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('meals')
            .delete()
            .eq('id', mealId)
            .eq('user_id', sessionData.session.user.id);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error deleting meal:', error);
        throw error;
    }
};

export const getTodayMeals = async (): Promise<Meal[]> => {
    const today = new Date().toISOString().split('T')[0];
    return loadMeals(today, today);
};
