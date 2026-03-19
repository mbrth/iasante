import { supabase } from './supabaseClient';
import { HealthMetrics } from '../types';

export const saveHealthMetrics = async (metrics: HealthMetrics): Promise<void> => {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('health_metrics')
            .upsert({
                user_id: sessionData.session.user.id,
                date: metrics.date,
                glucose: metrics.glucose,
                systolic_bp: metrics.systolicBP,
                diastolic_bp: metrics.diastolicBP,
                weight: metrics.weight,
                compliance_score: metrics.complianceScore,
            });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error saving health metrics:', error);
        throw error;
    }
};

export const loadHealthMetrics = async (startDate?: string, endDate?: string): Promise<HealthMetrics[]> => {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
            throw new Error('User not authenticated');
        }

        let query = supabase
            .from('health_metrics')
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

        return (data || []).map(dbMetrics => ({
            date: dbMetrics.date,
            glucose: dbMetrics.glucose,
            systolicBP: dbMetrics.systolic_bp,
            diastolicBP: dbMetrics.diastolic_bp,
            weight: dbMetrics.weight,
            complianceScore: dbMetrics.compliance_score,
        }));
    } catch (error) {
        console.error('Error loading health metrics:', error);
        throw error;
    }
};

export const getLatestHealthMetrics = async (): Promise<HealthMetrics | null> => {
    try {
        const metrics = await loadHealthMetrics();
        return metrics.length > 0 ? metrics[0] : null;
    } catch (error) {
        console.error('Error getting latest health metrics:', error);
        return null;
    }
};
