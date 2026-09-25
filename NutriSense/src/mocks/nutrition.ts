import type { DailyNutritionTarget, WeeklyNutritionSummary, LabReport } from '../types';

export const DEFAULT_DAILY_TARGETS: DailyNutritionTarget = {
  calories: { target: 1950, unit: 'kcal' },
  protein: { target: 65, unit: 'g' },
  carbs: { target: 230, unit: 'g' },
  fat: { target: 55, unit: 'g' },
  fiber: { target: 30, unit: 'g' },
  iron: { target: 17, unit: 'mg' },
  calcium: { target: 1000, unit: 'mg' },
  b12: { target: 2.2, unit: 'mcg' },
  vitaminD: { target: 15, unit: 'mcg' },
};

export const MOCK_WEEKLY_SUMMARY: WeeklyNutritionSummary = {
  weekLabel: '16–22 Sep',
  consistencyScore: 86,
  mostImprovedNutrient: 'Protein (+18% vs last week)',
  persistentGapNutrient: 'Dietary Iron',
  loggingCompleteness: 6, // 6 out of 7 days logged
  carefulGapNotice:
    'Estimated dietary iron intake was below your selected target on most logged days this week. Consider pairing plant-based iron sources (like sattu or spinach) with vitamin C.',
  foodSuggestions: [
    { foodName: 'Chilled Spiced Sattu Drink', richIn: 'Plant Iron & Protein', price: 40 },
    { foodName: 'Palak Paneer with Brown Rice', richIn: 'Dietary Iron & Calcium', price: 150 },
    { foodName: 'Moong Sprouts Chaat with Lemon', richIn: 'Iron & Dietary Fiber', price: 50 },
  ],
  days: [
    { day: 'Mon', date: '16 Sep', proteinPct: 82, ironPct: 58, calciumPct: 75, b12Pct: 60, fiberPct: 80, vitaminDPct: 40, caloriesPct: 92 },
    { day: 'Tue', date: '17 Sep', proteinPct: 75, ironPct: 52, calciumPct: 82, b12Pct: 70, fiberPct: 68, vitaminDPct: 35, caloriesPct: 88 },
    { day: 'Wed', date: '18 Sep', proteinPct: 91, ironPct: 64, calciumPct: 88, b12Pct: 65, fiberPct: 85, vitaminDPct: 50, caloriesPct: 95 },
    { day: 'Thu', date: '19 Sep', proteinPct: 88, ironPct: 60, calciumPct: 79, b12Pct: 80, fiberPct: 72, vitaminDPct: 45, caloriesPct: 90, isToday: true },
    { day: 'Fri', date: '20 Sep', proteinPct: 78, ironPct: 55, calciumPct: 71, b12Pct: 55, fiberPct: 65, vitaminDPct: 30, caloriesPct: 84 },
    { day: 'Sat', date: '21 Sep', proteinPct: 95, ironPct: 70, calciumPct: 94, b12Pct: 85, fiberPct: 90, vitaminDPct: 55, caloriesPct: 98 },
    { day: 'Sun', date: '22 Sep', proteinPct: 68, ironPct: 48, calciumPct: 65, b12Pct: 50, fiberPct: 60, vitaminDPct: 25, caloriesPct: 79 },
  ],
};

export const MOCK_LAB_REPORT: LabReport = {
  fileName: 'Health_Check_Comprehensive_Sept.pdf',
  fileSize: 1845000, // ~1.8 MB
  uploadDate: '2026-09-15',
  parsedText:
    'Comprehensive Metabolic & Vitamin Panel: Serum Ferritin 14 ng/mL (Ref: 20-250), Vitamin B12 210 pg/mL (Ref: 200-900), Vitamin D 25-OH 18 ng/mL (Ref: 30-100), Calcium 9.4 mg/dL (Ref: 8.5-10.2).',
  disclaimer:
    'Potential nutrient-related information found in uploaded report. Backend analysis will be connected later. NutriSense does not provide medical diagnoses or lab interpretations.',
  indicators: [
    {
      name: 'Serum Ferritin (Iron Stores)',
      value: '14 ng/mL',
      referenceRange: '20–250 ng/mL',
      status: 'low',
      nutrientKey: 'iron',
      note: 'Values below reference range suggest prioritizing dietary iron intake in daily meal planning.',
    },
    {
      name: 'Vitamin D (25-OH)',
      value: '18 ng/mL',
      referenceRange: '30–100 ng/mL',
      status: 'low',
      nutrientKey: 'hydration', // fallback
      note: 'Lower dietary vitamin D observed; sunlight exposure and fortified dairy recommended.',
    },
    {
      name: 'Vitamin B12',
      value: '210 pg/mL',
      referenceRange: '200–900 pg/mL',
      status: 'normal',
      nutrientKey: 'b12',
      note: 'Borderline range often seen in vegetarian diets; curd and paneer support ongoing maintenance.',
    },
    {
      name: 'Serum Calcium',
      value: '9.4 mg/dL',
      referenceRange: '8.5–10.2 mg/dL',
      status: 'normal',
      nutrientKey: 'calcium',
      note: 'Within standard reference range.',
    },
  ],
};
