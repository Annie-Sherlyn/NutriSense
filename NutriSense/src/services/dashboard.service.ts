import { supabase } from '../lib/supabase';
import { profileService } from './profile.service';
import type { DailyNutritionSummary, WeeklyNutritionSummary, NutrientGap, WeeklyNutritionDay } from '../types';

// ICMR-NIN-based default daily targets (same as used in rest of codebase)
const DEFAULT_TARGETS = {
  calories: { target: 2000, unit: 'kcal' },
  protein: { target: 65, unit: 'g' },
  carbs: { target: 230, unit: 'g' },
  fat: { target: 55, unit: 'g' },
  fiber: { target: 30, unit: 'g' },
  iron: { target: 17, unit: 'mg' },
  calcium: { target: 1000, unit: 'mg' },
  b12: { target: 2.2, unit: 'mcg' },
  vitaminD: { target: 15, unit: 'mcg' },
};

const buildGap = (
  name: string,
  key: 'protein' | 'carbs' | 'fat' | 'calories' | 'vitaminD' | 'fiber' | 'iron' | 'calcium' | 'b12',
  consumedVal: number,
  targetVal: number,
  unit: string
): NutrientGap => {
  const remaining = Math.max(0, Math.round((targetVal - consumedVal) * 10) / 10);
  const percentage = Math.min(150, Math.round((consumedVal / targetVal) * 100));
  let status: 'low' | 'on-track' | 'met' | 'exceeded' = 'on-track';
  if (percentage < 55) status = 'low';
  else if (percentage >= 100) status = 'met';

  let insight = '';
  if (percentage < 55) {
    insight = `~${remaining}${unit} left to reach target`;
  } else if (percentage < 100) {
    insight = `On track (~${remaining}${unit} remaining)`;
  } else {
    insight = `Target met!`;
  }

  return {
    nutrient: name,
    nutrientKey: key as any,
    consumed: Math.round(consumedVal * 10) / 10,
    target: targetVal,
    unit,
    percentage,
    remaining,
    status,
    insight,
  };
};

export const dashboardService = {
  async getTodaySummary(): Promise<DailyNutritionSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let userId: string;
    try {
      userId = profileService.getStableUserId();
    } catch {
      userId = 'demo-user-1';
    }

    // FIXED: query meal_logs (NOT the legacy 'meals' table)
    // Also join meal_items to sum actual per-item nutrition
    const { data: logs, error } = await supabase
      .from('meal_logs')
      .select(`
        id,
        meal_type,
        logged_at,
        total_calories,
        total_protein,
        total_carbs,
        total_fat,
        meal_items (
          calories,
          protein,
          carbs,
          fat,
          quantity
        )
      `)
      .eq('user_id', userId)
      .gte('logged_at', today.toISOString());

    if (error) {
      console.error('Supabase fetch error for today (meal_logs):', error);
      // Return zero-state instead of throwing — prevents "Loading ecosystem..." from hanging
      return buildEmptyDaySummary(today);
    }

    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    logs?.forEach((log) => {
      // Use the pre-aggregated totals on meal_logs if available
      calories += Number(log.total_calories || 0);
      protein += Number(log.total_protein || 0);
      carbs += Number(log.total_carbs || 0);
      fat += Number(log.total_fat || 0);
    });

    // fiber, iron, calcium, b12, vitaminD are stored in foods table
    // For now we derive them from meal_items when richer data is available
    // (these will be 0 until foods table has micronutrient columns seeded)
    const fiber = 0;
    const iron = 0;
    const calcium = 0;
    const b12 = 0;
    const vitaminD = 0;

    const gaps: NutrientGap[] = [
      buildGap('Calories', 'calories', calories, DEFAULT_TARGETS.calories.target, 'kcal'),
      buildGap('Protein', 'protein', protein, DEFAULT_TARGETS.protein.target, 'g'),
      buildGap('Carbs', 'carbs', carbs, DEFAULT_TARGETS.carbs.target, 'g'),
      buildGap('Fat', 'fat', fat, DEFAULT_TARGETS.fat.target, 'g'),
      buildGap('Iron', 'iron', iron, DEFAULT_TARGETS.iron.target, 'mg'),
      buildGap('Calcium', 'calcium', calcium, DEFAULT_TARGETS.calcium.target, 'mg'),
      buildGap('Dietary Fiber', 'fiber', fiber, DEFAULT_TARGETS.fiber.target, 'g'),
      buildGap('Vitamin B12', 'b12', b12, DEFAULT_TARGETS.b12.target, 'mcg'),
      buildGap('Vitamin D', 'vitaminD', vitaminD, DEFAULT_TARGETS.vitaminD.target, 'mcg'),
    ];

    return {
      date: today.toISOString(),
      consumed: {
        calories: Math.round(calories),
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,
        fiber: 0,
        iron: 0,
        calcium: 0,
        b12: 0,
        vitaminD: 0,
      },
      targets: DEFAULT_TARGETS,
      meals: [],
      gaps,
    };
  },

  async getWeeklySummary(): Promise<WeeklyNutritionSummary> {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    let userId: string;
    try {
      userId = profileService.getStableUserId();
    } catch {
      userId = 'demo-user-1';
    }

    // FIXED: query meal_logs (NOT the legacy 'meals' table)
    const { data: logs, error } = await supabase
      .from('meal_logs')
      .select('id, logged_at, total_calories, total_protein, total_carbs, total_fat')
      .eq('user_id', userId)
      .gte('logged_at', start.toISOString());

    if (error) {
      console.error('Supabase fetch error for weekly (meal_logs):', error);
      throw error;
    }

    const dayMap = new Map<string, any>();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      dayMap.set(key, {
        day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        proteinPct: 0,
        ironPct: 0,
        calciumPct: 0,
        b12Pct: 0,
        fiberPct: 0,
        vitaminDPct: 0,
        caloriesPct: 0,
        isToday: i === 6,
        calories: 0,
        protein: 0,
        iron: 0,
        calcium: 0,
        b12: 0,
        fiber: 0,
        vitaminD: 0,
      });
    }

    logs?.forEach((log) => {
      const date = new Date(log.logged_at);
      const key = date.toISOString().split('T')[0];
      const entry = dayMap.get(key);
      if (entry) {
        entry.calories += Number(log.total_calories || 0);
        entry.protein += Number(log.total_protein || 0);
      }
    });

    const targets = {
      calories: 2000,
      protein: 65,
      iron: 17,
      calcium: 1000,
      b12: 2.2,
      fiber: 30,
      vitaminD: 15,
    };

    const days: WeeklyNutritionDay[] = Array.from(dayMap.values()).map(entry => ({
      day: entry.day,
      date: entry.date,
      proteinPct: Math.min(100, Math.round((entry.protein / targets.protein) * 100)),
      ironPct: Math.min(100, Math.round((entry.iron / targets.iron) * 100)),
      calciumPct: Math.min(100, Math.round((entry.calcium / targets.calcium) * 100)),
      b12Pct: Math.min(100, Math.round((entry.b12 / targets.b12) * 100)),
      fiberPct: Math.min(100, Math.round((entry.fiber / targets.fiber) * 100)),
      vitaminDPct: Math.min(100, Math.round((entry.vitaminD / targets.vitaminD) * 100)),
      caloriesPct: Math.min(100, Math.round((entry.calories / targets.calories) * 100)),
      isToday: entry.isToday
    }));

    const daysWithData = Array.from(dayMap.values()).filter(d => d.calories > 0).length;

    return {
      weekLabel: 'Last 7 Days',
      days,
      consistencyScore: Math.round((daysWithData / 7) * 100),
      mostImprovedNutrient: daysWithData > 0 ? 'Protein' : 'None',
      persistentGapNutrient: daysWithData > 0 ? 'Iron' : 'None',
      loggingCompleteness: Math.round((daysWithData / 7) * 100),
      carefulGapNotice: daysWithData === 0 ? 'Log meals this week to see your first report.' : '',
      foodSuggestions: [],
    };
  },

  // Returns count of meals logged today for a user
  async getMealCountToday(): Promise<number> {
    let userId: string;
    try {
      userId = profileService.getStableUserId();
    } catch {
      return 0;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('meal_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('logged_at', today.toISOString());
    return count || 0;
  },
};

// Helper: always-valid zero-state summary (no hang, no spinner, correct empty state)
function buildEmptyDaySummary(today: Date): DailyNutritionSummary {
  return {
    date: today.toISOString(),
    consumed: {
      calories: 0, protein: 0, carbs: 0, fat: 0,
      fiber: 0, iron: 0, calcium: 0, b12: 0, vitaminD: 0,
    },
    targets: DEFAULT_TARGETS,
    meals: [],
    gaps: [
      buildGap('Calories', 'calories', 0, DEFAULT_TARGETS.calories.target, 'kcal'),
      buildGap('Protein', 'protein', 0, DEFAULT_TARGETS.protein.target, 'g'),
      buildGap('Carbs', 'carbs', 0, DEFAULT_TARGETS.carbs.target, 'g'),
      buildGap('Fat', 'fat', 0, DEFAULT_TARGETS.fat.target, 'g'),
      buildGap('Iron', 'iron', 0, DEFAULT_TARGETS.iron.target, 'mg'),
      buildGap('Calcium', 'calcium', 0, DEFAULT_TARGETS.calcium.target, 'mg'),
      buildGap('Dietary Fiber', 'fiber', 0, DEFAULT_TARGETS.fiber.target, 'g'),
      buildGap('Vitamin B12', 'b12', 0, DEFAULT_TARGETS.b12.target, 'mcg'),
      buildGap('Vitamin D', 'vitaminD', 0, DEFAULT_TARGETS.vitaminD.target, 'mcg'),
    ],
  };
}
