import type { MoteType } from '../config/tokens';

export type DietType = 'vegetarian' | 'vegan' | 'eggitarian' | 'non-vegetarian';

export type NutritionGoal =
  | 'better-health'
  | 'build-muscle'
  | 'manage-weight'
  | 'more-energy'
  | 'improve-digestion'
  | 'balanced-nutrition';

export type PriorityNutrient = 'protein' | 'iron' | 'calcium' | 'b12' | 'fiber' | 'hydration';

export type ActivityLevel = 'sedentary' | 'moderate' | 'active' | 'very-active';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAnonymous?: boolean;
  isOnboarded: boolean;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  dietType: DietType;
  allergies: string[];
  customAllergies?: string[];
  goal: NutritionGoal;
  priorityNutrients: PriorityNutrient[];
  budgetPerMeal: number; // ₹50–₹500
  ageGroup?: string;
  activityLevel?: ActivityLevel;
  location?: string;
  cuisineLikes: string[];
  cuisineDislikes: string[];
  hasUploadedReport?: boolean;
  reportSummary?: string;
  updatedAt: string;
}

export interface NutritionRange {
  min: number;
  max: number;
  unit: string;
}

export interface MacroNutrients {
  calories: NutritionRange;
  protein: NutritionRange;
  carbs: NutritionRange;
  fat: NutritionRange;
  fiber: NutritionRange;
}

export interface MicroNutrients {
  iron: NutritionRange;
  calcium: NutritionRange;
  b12: NutritionRange;
  folate?: NutritionRange;
  sodium?: NutritionRange;
  vitaminD?: NutritionRange;
  potassium?: NutritionRange;
}

export type PortionSize = 'small' | 'regular' | 'large';
export type PreparationStyle = 'normal' | 'low-oil' | 'extra-oil' | 'homemade' | 'restaurant';

export interface FoodAlias {
  alias: string;
  language?: string;
}

export interface Food {
  id: string;
  name: string;
  regionalName?: string;
  aliases: string[];
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage';
  cuisine: 'South Indian' | 'North Indian' | 'Pan-Indian' | 'Snacks';
  dietType: DietType;
  allergens: string[];
  typicalPrice: number;
  image: string;
  servingDescription: string;
  perServingMacros: MacroNutrients;
  perServingMicros: MicroNutrients;
  per100gMacros: MacroNutrients;
  per100gMicros: MicroNutrients;
  source: 'dev-seed' | 'user' | 'api';
  tags: string[];
}

export interface FoodCandidate {
  id: string;
  name: string;
  regionalName?: string;
  confidence: number; // 0 to 1
  image?: string;
  estimatedKcal?: string;
  category?: string;
  platePosition?: string;
  box?: [number, number, number, number];
  color?: string;
}

export interface DetectedPlateItem extends FoodCandidate {
  platePosition?: string;
  box?: [number, number, number, number];
  color?: string;
}

export interface FoodAnalysisResponse {
  isMultiItem: boolean;
  mode: 'multi' | 'single';
  plateMessage: string;
  detectedItems: DetectedPlateItem[];
  candidates: FoodCandidate[];
  annotatedImage?: string;
}

export interface MealItem {
  id: string;
  foodId: string;
  foodName: string;
  image: string;
  quantity: number;
  portion: PortionSize;
  preparationStyle: PreparationStyle;
  macros: MacroNutrients;
  micros: MicroNutrients;
}

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface Meal {
  id: string;
  userId: string;
  mealType: MealType;
  loggedAt: string; // ISO string
  items: MealItem[];
  totalMacros: MacroNutrients;
  totalMicros: MicroNutrients;
  notes?: string;
  inputMethod: 'photo' | 'menu' | 'delivery' | 'voice' | 'search' | 'manual';
}

export interface DailyNutritionTarget {
  calories: { target: number; unit: string };
  protein: { target: number; unit: string };
  carbs: { target: number; unit: string };
  fat: { target: number; unit: string };
  fiber: { target: number; unit: string };
  iron: { target: number; unit: string };
  calcium: { target: number; unit: string };
  b12: { target: number; unit: string };
  vitaminD: { target: number; unit: string };
}

export interface DailyNutritionSummary {
  date: string;
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    iron: number;
    calcium: number;
    b12: number;
    vitaminD: number;
  };
  targets: DailyNutritionTarget;
  meals: Meal[];
  gaps: NutrientGap[];
}

export interface NutrientGap {
  nutrient: string;
  nutrientKey: PriorityNutrient | 'carbs' | 'fat' | 'calories' | 'vitaminD';
  consumed: number;
  target: number;
  remaining: number;
  unit: string;
  percentage: number;
  status: 'low' | 'on-track' | 'met' | 'exceeded';
  insight: string;
}

export interface WeeklyNutritionDay {
  day: string; // 'Mon', 'Tue'
  date: string;
  proteinPct: number;
  ironPct: number;
  calciumPct: number;
  b12Pct: number;
  fiberPct: number;
  vitaminDPct: number;
  caloriesPct: number;
  isToday?: boolean;
}

export interface WeeklyNutritionSummary {
  weekLabel: string; // e.g. "16–22 Sep"
  days: WeeklyNutritionDay[];
  consistencyScore: number; // percentage e.g. 85
  mostImprovedNutrient: string;
  persistentGapNutrient: string;
  loggingCompleteness: number; // days logged / 7
  carefulGapNotice: string;
  foodSuggestions: Array<{ foodName: string; richIn: string; price: number }>;
}

export interface Reason {
  key: string;
  label: string;
  passed: boolean;
  profileField?: string;
}

export interface Recommendation {
  id: string;
  foodId: string;
  dishName: string;
  regionalName?: string;
  category: string;
  image: string;
  estimatedProtein: NutritionRange;
  estimatedCalories: NutritionRange;
  estimatedPrice: number;
  eatingWindow: MealType;
  reasons: Reason[];
  confidence: number;
  tags: string[];
  whySummary: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  selected?: boolean;
  matchedFoodId?: string;
  confidence?: number;
}

export interface OCRResult {
  restaurantName?: string;
  items: MenuItem[];
  rawText: string;
  confidence: number;
}

export interface SpeechResult {
  transcript: string;
  confidence: number;
  extractedItems: Array<{
    name: string;
    quantity: number;
    unit?: string;
    matchedFoodId?: string;
  }>;
}

export interface LabReportIndicator {
  name: string;
  value?: string;
  referenceRange?: string;
  status: 'low' | 'normal' | 'high';
  nutrientKey?: PriorityNutrient;
  note: string;
}

export interface LabReport {
  fileName: string;
  fileSize: number;
  uploadDate: string;
  indicators: LabReportIndicator[];
  parsedText: string;
  disclaimer: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  moteType: MoteType;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export type AppErrorCode =
  | 'NETWORK'
  | 'UNAUTHORIZED'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'IMAGE_UNPROCESSABLE'
  | 'LOW_CONFIDENCE'
  | 'NO_TEXT_DETECTED'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN';

export interface AppError {
  code: AppErrorCode;
  message: string;
  recoverable: boolean;
  action?: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}
