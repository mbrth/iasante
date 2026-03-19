/**
 * mlService.ts — Machine Learning algorithms implemented from scratch
 * NutriPath AI — Bachelor 3rd Year Project
 */

import { UserProfile, HealthMetrics, Meal, Pathology } from '../types';

export interface LinearRegressionModel {
    slope: number;
    intercept: number;
    r2: number;
}

export const fitLinearRegression = (data: { x: number; y: number }[]): LinearRegressionModel => {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: data[0]?.y ?? 0, r2: 0 };

    const sumX = data.reduce((s, p) => s + p.x, 0);
    const sumY = data.reduce((s, p) => s + p.y, 0);
    const sumXY = data.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = data.reduce((s, p) => s + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const yMean = sumY / n;
    const ssTot = data.reduce((s, p) => s + Math.pow(p.y - yMean, 2), 0);
    const ssRes = data.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
    const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

    return { slope, intercept, r2 };
};

export const predictMetricTrend = (metrics: HealthMetrics[], metricKey: keyof HealthMetrics, daysAhead: number = 7): { predicted: number; trend: 'increasing' | 'decreasing' | 'stable' } => {
    const metricsCopy = JSON.parse(JSON.stringify(metrics)) as HealthMetrics[];
    
    const data = metricsCopy
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((m, i) => ({ x: i, y: Number(m[metricKey]) || 0 }));

    if (data.length < 2) {
        const initialValue = data[0]?.y ?? 0;
        return { predicted: initialValue, trend: 'stable' };
    }

    const model = fitLinearRegression(data);
    const predicted = model.slope * (data.length + daysAhead - 1) + model.intercept;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (model.slope > 0.1 * (data[0].y / 100)) trend = 'increasing'; 
    else if (model.slope < -0.1 * (data[0].y / 100)) trend = 'decreasing';

    return { predicted: Math.max(0, predicted), trend };
};

export const predictWeightTrend = (metrics: HealthMetrics[], daysAhead: number = 7): { predicted: number; trend: 'increasing' | 'decreasing' | 'stable' } => {
    return predictMetricTrend(metrics, 'weight', daysAhead);
};

export interface MealCluster {
    centroid: number[];
    meals: Meal[];
}

const distance = (a: number[], b: number[]): number => {
    return Math.sqrt(a.reduce((s, v, i) => s + Math.pow(v - b[i], 2), 0));
};

const initializeCentroids = (data: number[][], k: number): number[][] => {
    const indices = new Set<number>();
    while (indices.size < k && indices.size < data.length) {
        indices.add(Math.floor(Math.random() * data.length));
    }
    return Array.from(indices).map(i => [...data[i]]);
};

export const kMeansClustering = (meals: Meal[], k: number = 3): MealCluster[] => {
    if (meals.length < k) {
        return meals.map(m => ({ centroid: [m.calories, m.protein, m.carbs, m.fat], meals: [m] }));
    }

    const features = meals.map(m => [m.calories / 1000, m.protein / 50, m.carbs / 100, m.fat / 30]);
    let centroids = initializeCentroids(features, k);
    let assignments = new Array(meals.length).fill(0);
    let changed = true;
    let iterations = 0;
    const maxIterations = 20;

    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        for (let i = 0; i < features.length; i++) {
            let minDist = Infinity;
            let cluster = 0;
            for (let j = 0; j < centroids.length; j++) {
                const d = distance(features[i], centroids[j]);
                if (d < minDist) {
                    minDist = d;
                    cluster = j;
                }
            }
            if (assignments[i] !== cluster) {
                assignments[i] = cluster;
                changed = true;
            }
        }

        for (let j = 0; j < k; j++) {
            const clusterPoints = features.filter((_, i) => assignments[i] === j);
            if (clusterPoints.length > 0) {
                centroids[j] = clusterPoints[0].map((_, dim) =>
                    clusterPoints.reduce((s, p) => s + p[dim], 0) / clusterPoints.length
                );
            }
        }
    }

    const clusters: MealCluster[] = centroids.map(c => ({ centroid: c, meals: [] }));
    assignments.forEach((cluster, i) => clusters[cluster].meals.push(meals[i]));
    return clusters.filter(c => c.meals.length > 0);
};

export interface RiskAssessment {
    score: number;
    level: 'low' | 'moderate' | 'high' | 'critical';
    factors: string[];
    description: string;
    recommendations: string[];
}

export const calculateHealthRiskScore = (profile: UserProfile, metrics?: HealthMetrics): RiskAssessment => {
    let score = 0;
    const factors: string[] = [];

    if (profile.bmi >= 30) { score += 30; factors.push('IMC Obèse (≥ 30)'); }
    else if (profile.bmi >= 25) { score += 15; factors.push('Surpoids (IMC ≥ 25)'); }

    if (profile.age >= 65) { score += 20; factors.push('Âge avancé (≥ 65)'); }

    const pathologyPoints: Record<string, number> = {
        [Pathology.DIABETES_T1]: 25, 
        [Pathology.DIABETES_T2]: 20, 
        [Pathology.HYPERTENSION]: 15,
        [Pathology.CARDIOVASCULAR]: 25, 
        [Pathology.OBESITY]: 20
    };

    profile.pathologies.forEach(p => {
        score += (pathologyPoints[p] || 10);
        factors.push(`${p} détectée`);
    });

    if (metrics) {
        if (metrics.glucose && metrics.glucose > 126) { score += 15; factors.push('Glycémie élevée'); }
        if (metrics.systolicBP && metrics.systolicBP > 140) { score += 15; factors.push('Tension élevée'); }
    }

    score = Math.min(100, score);
    let level: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    if (score >= 75) level = 'critical';
    else if (score >= 50) level = 'high';
    else if (score >= 25) level = 'moderate';

    const recommendationsMap: Record<string, string[]> = {
        low: ['Maintenez votre routine actuelle', 'Hydratez-vous régulièrement'],
        moderate: ['Réduisez les sucres rapides', 'Augmentez l\'activité physique modérée'],
        high: ['Surveillez votre glycémie après chaque repas', 'Consultez votre médecin pour ajuster le traitement'],
        critical: ['Contactez immédiatement votre service médical prescripteur', 'Repos strict et surveillance clinique']
    };

    const descriptionMap: Record<string, string> = {
        low: 'Votre état de santé est stable et sous contrôle.',
        moderate: 'Quelques indicateurs nécessitent votre attention.',
        high: 'Plusieurs facteurs de risque sont élevés. Vigilance requise.',
        critical: 'Alerte clinique importante : une intervention médicale est nécessaire.'
    };

    return { 
        score, 
        level, 
        factors, 
        description: descriptionMap[level], 
        recommendations: recommendationsMap[level] 
    };
};

// 4. NUTRITION SCORE & ANALYSIS
export interface NutritionAnalysis {
    score: number;
    status: 'excellent' | 'bon' | 'moyen' | 'bas';
    analysis: string[];
}

export const calculateNutritionScore = (meals: Meal[]): NutritionAnalysis => {
    if (meals.length === 0) return { score: 0, status: 'bas', analysis: ['Aucune donnée alimentaire aujourd\'hui'] };

    let score = 85; 
    const analysis: string[] = [];

    const avgProtein = meals.reduce((s, m) => s + m.protein, 0) / meals.length;
    const avgCarbs = meals.reduce((s, m) => s + m.carbs, 0) / meals.length;
    const avgFat = meals.reduce((s, m) => s + m.fat, 0) / meals.length;
    const totalSugar = meals.reduce((s, m) => s + m.sugar, 0);

    if (avgProtein > 20) { score += 5; analysis.push('Protéines suffisantes'); }
    else { score -= 10; analysis.push('Manque de protéines'); }

    if (totalSugar > 50) { score -= 15; analysis.push('Alerte : Sucres trop élevés'); }
    else { score += 5; analysis.push('Apport en sucre maîtrisé'); }

    if (avgFat < 15) { score += 5; analysis.push('Lipides sains'); }

    score = Math.min(100, Math.max(0, score));
    let status: 'excellent' | 'bon' | 'moyen' | 'bas' = 'excellent';
    if (score < 40) status = 'bas';
    else if (score < 60) status = 'moyen';
    else if (score < 80) status = 'bon';

    return { score, status, analysis };
};

// 5. METABOLIC STABILITY
export const calculateMetabolicStability = (metrics: HealthMetrics[]): number => {
    if (metrics.length < 3) return 80; // Baseline
    
    // Variance-based stability
    const glucoseValues = metrics.map(m => m.glucose || 100);
    const mean = glucoseValues.reduce((a, b) => a + b) / glucoseValues.length;
    const variance = glucoseValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / glucoseValues.length;
    
    const stability = Math.max(0, 100 - Math.sqrt(variance) * 2);
    return Math.round(stability);
};

// 6. HEALTH ALERTS GENERATOR
export interface HealthAlert {
    type: 'success' | 'warning' | 'error';
    message: string;
}

export const generateHealthAlerts = (metrics: HealthMetrics, profile: UserProfile): HealthAlert[] => {
    const alerts: HealthAlert[] = [];
    
    // Hydration (simple mock logic for demo)
    alerts.push({ type: 'success', message: 'Hydratation suffisante aujourd\'hui' });
    
    if (metrics.glucose && metrics.glucose > 120) {
        alerts.push({ type: 'warning', message: 'Glycémie légèrement élevée hier soir' });
    }
    
    if (profile.pathologies.includes(Pathology.DIABETES_T1) && metrics.glucose && metrics.glucose < 70) {
        alerts.push({ type: 'error', message: 'Risque d\'hypoglycémie détecté !' });
    }
    
    return alerts;
};

// 7. CARDIOVASCULAR RISK PREDICTION
export const calculateCardiovascularRisk = (profile: UserProfile, metrics: HealthMetrics): number => {
    let risk = 5; // Base risk
    
    // Age factor
    if (profile.age > 60) risk += 15;
    else if (profile.age > 50) risk += 10;
    
    // Blood Pressure factor
    if (metrics.systolicBP && metrics.systolicBP > 140) risk += 20;
    else if (metrics.systolicBP && metrics.systolicBP > 130) risk += 10;
    
    // Pathology factors
    if (profile.pathologies.includes(Pathology.CARDIOVASCULAR)) risk += 30;
    if (profile.pathologies.includes(Pathology.HYPERTENSION)) risk += 15;
    if (profile.pathologies.includes(Pathology.DIABETES_T1) || profile.pathologies.includes(Pathology.DIABETES_T2)) risk += 10;
    
    // BMI factor
    if (profile.bmi > 30) risk += 10;
    
    return Math.min(100, risk);
};
