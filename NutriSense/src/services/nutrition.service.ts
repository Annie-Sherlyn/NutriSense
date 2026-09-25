import { ENV } from '../config/env';
import { request } from './api';
import { INITIAL_MOCK_MEALS } from '../mocks/meals';
import { DEFAULT_DAILY_TARGETS, MOCK_WEEKLY_SUMMARY } from '../mocks/nutrition';
import { TOKENS } from '../config/tokens';
import { delay, checkSimulatedError } from '../utils/delay';
import type {
  Meal,
  MacroNutrients,
  MicroNutrients,
  DailyNutritionSummary,
  WeeklyNutritionSummary,
  NutrientGap,
  PortionSize,
  PreparationStyle,
  PriorityNutrient,
} from '../types';

function getStoredMeals(): Meal[] {
  const raw = localStorage.getItem(TOKENS.storageKeys.meals);
  if (!raw) {
    localStorage.setItem(TOKENS.storageKeys.meals, JSON.stringify(INITIAL_MOCK_MEALS));
    return INITIAL_MOCK_MEALS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_MEALS;
  }
}

function saveStoredMeals(meals: Meal[]) {
  localStorage.setItem(TOKENS.storageKeys.meals, JSON.stringify(meals));
}

// Portion multiplier: small 0.7, regular 1.0, large 1.4
export function getPortionMultiplier(portion: PortionSize): number {
  switch (portion) {
    case 'small':
      return 0.7;
    case 'large':
      return 1.4;
    case 'regular':
    default:
      return 1.0;
  }
}

// Prep style fat/calorie adjustment multiplier
export function getPrepMultiplier(prep: PreparationStyle): { cal: number; fat: number } {
  switch (prep) {
    case 'low-oil':
      return { cal: 0.9, fat: 0.75 };
    case 'extra-oil':
      return { cal: 1.2, fat: 1.4 };
    case 'homemade':
      return { cal: 0.95, fat: 0.85 };
    case 'restaurant':
      return { cal: 1.15, fat: 1.25 };
    case 'normal':
    default:
      return { cal: 1.0, fat: 1.0 };
  }
}

export const nutritionService = {
  // Calculate nutrition for selected items with portions & prep styles
  async calculate(
    items: Array<{ foodId: string; quantity: number; portion: PortionSize; prepStyle: PreparationStyle }>
  ): Promise<{ totalMacros: MacroNutrients; totalMicros: MicroNutrients }> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      // TODO(BACKEND): Connect backend calculation endpoint (e.g. POST /nutrition/calculate)
      return request<{ totalMacros: MacroNutrients; totalMicros: MicroNutrients }>('/nutrition/calculate', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
    }

    await delay(300, 600);
    // Calculated dynamically in mock based on food items
    let calMin = 0, calMax = 0;
    let protMin = 0, protMax = 0;
    let carbMin = 0, carbMax = 0;
    let fatMin = 0, fatMax = 0;
    let fibMin = 0, fibMax = 0;

    let ironMin = 0, ironMax = 0;
    let calcMin = 0, calcMax = 0;
    let b12Min = 0, b12Max = 0;

    items.forEach((it) => {
      const pMult = getPortionMultiplier(it.portion) * it.quantity;
      const prep = getPrepMultiplier(it.prepStyle);

      calMin += Math.round(180 * pMult * prep.cal);
      calMax += Math.round(230 * pMult * prep.cal);
      protMin += Math.round(7 * pMult * 10) / 10;
      protMax += Math.round(10 * pMult * 10) / 10;
      carbMin += Math.round(30 * pMult * 10) / 10;
      carbMax += Math.round(38 * pMult * 10) / 10;
      fatMin += Math.round(5 * pMult * prep.fat * 10) / 10;
      fatMax += Math.round(8 * pMult * prep.fat * 10) / 10;
      fibMin += Math.round(4 * pMult * 10) / 10;
      fibMax += Math.round(6 * pMult * 10) / 10;

      ironMin += Math.round(1.5 * pMult * 10) / 10;
      ironMax += Math.round(2.5 * pMult * 10) / 10;
      calcMin += Math.round(40 * pMult);
      calcMax += Math.round(70 * pMult);
      b12Min += Math.round(0.1 * pMult * 100) / 100;
      b12Max += Math.round(0.2 * pMult * 100) / 100;
    });

    return {
      totalMacros: {
        calories: { min: calMin, max: calMax, unit: 'kcal' },
        protein: { min: protMin, max: protMax, unit: 'g' },
        carbs: { min: carbMin, max: carbMax, unit: 'g' },
        fat: { min: fatMin, max: fatMax, unit: 'g' },
        fiber: { min: fibMin, max: fibMax, unit: 'g' },
      },
      totalMicros: {
        iron: { min: ironMin, max: ironMax, unit: 'mg' },
        calcium: { min: calcMin, max: calcMax, unit: 'mg' },
        b12: { min: b12Min, max: b12Max, unit: 'mcg' },
      },
    };
  },

  // Save / Log a new meal
  async logMeal(mealData: Omit<Meal, 'id'>): Promise<Meal> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      // TODO(BACKEND): Connect meal logging endpoint (e.g. POST /meals)
      return request<Meal>('/meals', {
        method: 'POST',
        body: JSON.stringify(mealData),
      });
    }

    await delay(400, 800);

    const newMeal: Meal = {
      ...mealData,
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    const currentMeals = getStoredMeals();
    const updated = [newMeal, ...currentMeals];
    saveStoredMeals(updated);

    return newMeal;
  },

  // Get today's meals
  async getTodayMeals(): Promise<Meal[]> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      // TODO(BACKEND): Connect today's meals endpoint (e.g. GET /meals/today)
      return request<Meal[]>('/meals/today');
    }

    await delay(200, 450);
    return getStoredMeals();
  },

  // Update existing meal (portion or item changes)
  async updateMeal(updatedMeal: Meal): Promise<Meal> {
    checkSimulatedError();
    await delay(300, 600);

    const meals = getStoredMeals();
    const index = meals.findIndex((m) => m.id === updatedMeal.id);
    if (index !== -1) {
      meals[index] = updatedMeal;
      saveStoredMeals(meals);
    }
    return updatedMeal;
  },

  // Delete logged meal
  async deleteMeal(mealId: string): Promise<void> {
    checkSimulatedError();
    await delay(250, 500);

    const meals = getStoredMeals();
    const filtered = meals.filter((m) => m.id !== mealId);
    saveStoredMeals(filtered);
  },

  // Calculate daily nutrition summary and nutrient gaps
  async getDailySummary(): Promise<DailyNutritionSummary> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      // TODO(BACKEND): Connect daily summary endpoint (e.g. GET /nutrition/daily-summary)
      return request<DailyNutritionSummary>('/nutrition/daily-summary');
    }

    await delay(250, 500);

    const meals = getStoredMeals();

    let cal = 0;
    let prot = 0;
    let carb = 0;
    let fat = 0;
    let fib = 0;
    let iron = 0;
    let calc = 0;
    let b12 = 0;
    const vitD = 5.2; // default estimated base

    meals.forEach((m) => {
      cal += (m.totalMacros.calories.min + m.totalMacros.calories.max) / 2;
      prot += (m.totalMacros.protein.min + m.totalMacros.protein.max) / 2;
      carb += (m.totalMacros.carbs.min + m.totalMacros.carbs.max) / 2;
      fat += (m.totalMacros.fat.min + m.totalMacros.fat.max) / 2;
      fib += (m.totalMacros.fiber.min + m.totalMacros.fiber.max) / 2;

      iron += (m.totalMicros.iron.min + m.totalMicros.iron.max) / 2;
      calc += (m.totalMicros.calcium.min + m.totalMicros.calcium.max) / 2;
      b12 += (m.totalMicros.b12.min + m.totalMicros.b12.max) / 2;
    });

    const targets = DEFAULT_DAILY_TARGETS;

    const buildGap = (
      name: string,
      key: PriorityNutrient | 'carbs' | 'fat' | 'calories' | 'vitaminD',
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
        insight = `Daily target reached!`;
      }

      return {
        nutrient: name,
        nutrientKey: key,
        consumed: Math.round(consumedVal * 10) / 10,
        target: targetVal,
        remaining,
        unit,
        percentage,
        status,
        insight,
      };
    };

    const gaps: NutrientGap[] = [
      buildGap('Protein', 'protein', prot, targets.protein.target, targets.protein.unit),
      buildGap('Dietary Iron', 'iron', iron, targets.iron.target, targets.iron.unit),
      buildGap('Calcium', 'calcium', calc, targets.calcium.target, targets.calcium.unit),
      buildGap('Vitamin B12', 'b12', b12, targets.b12.target, targets.b12.unit),
      buildGap('Dietary Fiber', 'fiber', fib, targets.fiber.target, targets.fiber.unit),
      buildGap('Carbohydrates', 'carbs', carb, targets.carbs.target, targets.carbs.unit),
      buildGap('Healthy Fats', 'fat', fat, targets.fat.target, targets.fat.unit),
      buildGap('Calories', 'calories', cal, targets.calories.target, targets.calories.unit),
      buildGap('Vitamin D', 'vitaminD', vitD, targets.vitaminD.target, targets.vitaminD.unit),
    ];

    return {
      date: new Date().toISOString().split('T')[0],
      consumed: {
        calories: Math.round(cal),
        protein: Math.round(prot * 10) / 10,
        carbs: Math.round(carb * 10) / 10,
        fat: Math.round(fat * 10) / 10,
        fiber: Math.round(fib * 10) / 10,
        iron: Math.round(iron * 10) / 10,
        calcium: Math.round(calc),
        b12: Math.round(b12 * 100) / 100,
        vitaminD: Math.round(vitD * 10) / 10,
      },
      targets,
      meals,
      gaps,
    };
  },

  // Get weekly summary trend
  async getWeeklySummary(): Promise<WeeklyNutritionSummary> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      // TODO(BACKEND): Connect weekly summary endpoint (e.g. GET /nutrition/weekly-summary)
      return request<WeeklyNutritionSummary>('/nutrition/weekly-summary');
    }

    await delay(300, 600);
    return MOCK_WEEKLY_SUMMARY;
  },

  // Reset meals to empty state for testing empty states
  async resetToEmpty(): Promise<void> {
    saveStoredMeals([]);
  },

  // Reset meals to sample seed data
  async resetToSeed(): Promise<void> {
    saveStoredMeals(INITIAL_MOCK_MEALS);
  },
};
