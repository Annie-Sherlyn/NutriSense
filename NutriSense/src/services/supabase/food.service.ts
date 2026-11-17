import { supabase } from '../../lib/supabase';
import CANONICAL_FOODS from '../../data/canonical_foods.json';
import type { Food } from '../../types';

// Helper: map a Supabase foods row to the app's Food type
function mapFoodRow(f: any): Food {
  const calories = Number(f.calories ?? f.calories_max ?? f.calories_min ?? 0);
  const protein = Number(f.protein ?? f.protein_max ?? f.protein_min ?? 0);
  const carbs = Number(f.carbs ?? f.carbs_max ?? f.carbs_min ?? 0);
  const fat = Number(f.fat ?? f.fat_max ?? f.fat_min ?? 0);
  const fiber = Number(f.fiber ?? f.fiber_max ?? f.fiber_min ?? 0);

  const iron = Number(f.iron ?? f.iron_max ?? f.iron_min ?? 0);
  const calcium = Number(f.calcium ?? f.calcium_max ?? f.calcium_min ?? 0);
  const b12 = Number(f.b12 ?? f.vitamin_b12 ?? f.vitamin_b12_max ?? f.vitamin_b12_min ?? 0);
  const vitaminD = Number(f.vitamin_d ?? f.vitamin_d_max ?? f.vitamin_d_min ?? 0);

  const macros = {
    calories: { min: Number(f.calories_min ?? calories), max: Number(f.calories_max ?? calories), unit: 'kcal' },
    protein: { min: Number(f.protein_min ?? protein), max: Number(f.protein_max ?? protein), unit: 'g' },
    carbs: { min: Number(f.carbs_min ?? carbs), max: Number(f.carbs_max ?? carbs), unit: 'g' },
    fat: { min: Number(f.fat_min ?? fat), max: Number(f.fat_max ?? fat), unit: 'g' },
    fiber: { min: Number(f.fiber_min ?? fiber), max: Number(f.fiber_max ?? fiber), unit: 'g' },
  };

  const micros = {
    iron: { min: Number(f.iron_min ?? iron), max: Number(f.iron_max ?? iron), unit: 'mg' },
    calcium: { min: Number(f.calcium_min ?? calcium), max: Number(f.calcium_max ?? calcium), unit: 'mg' },
    b12: { min: Number(f.vitamin_b12_min ?? b12), max: Number(f.vitamin_b12_max ?? b12), unit: 'mcg' },
    vitaminD: { min: Number(f.vitamin_d_min ?? vitaminD), max: Number(f.vitamin_d_max ?? vitaminD), unit: 'mcg' },
  };

  const servingAmount = f.serving_amount || f.base_quantity || 1;
  const servingUnit = f.serving_unit || f.base_unit || 'serving';

  return {
    id: f.food_id || f.id,
    name: f.name,
    regionalName: f.alternate_names || f.name,
    aliases: f.alternate_names ? f.alternate_names.split(',').map((s: string) => s.trim()) : [],
    category: f.category || 'lunch',
    cuisine: 'Pan-Indian',
    dietType: (f.dietary_tags?.toLowerCase().includes('vegan') ? 'vegan' : 'vegetarian') as any,
    allergens: f.allergens ? f.allergens.split(',').map((s: string) => s.trim()) : [],
    typicalPrice: Number(f.price_min_inr || 40),
    image: f.image_url || '',
    servingDescription: `${servingAmount} ${servingUnit}`,
    nutritionPer100g: {
      calories: { value: calories, unit: 'kcal' },
      protein: { value: protein, unit: 'g' },
      carbs: { value: carbs, unit: 'g' },
      fat: { value: fat, unit: 'g' },
    },
    perServingMacros: macros,
    perServingMicros: micros,
    per100gMacros: macros,
    per100gMicros: micros,
    source: 'api',
    tags: f.variants ? f.variants.split(',').map((s: string) => s.trim()) : [],
  } as any;
}

export const supabaseFoodService = {
  // Search foods strictly from the verified dataset and database
  async searchFoods(query: string): Promise<Food[]> {
    const clean = (query || '').trim().toLowerCase();

    // 1. Try querying Supabase foods table
    try {
      let q = supabase.from('foods').select('*');
      if (clean) {
        q = q.ilike('name', `%${clean}%`);
      }
      const { data, error } = await q.order('name').limit(50);
      if (!error && data && data.length > 0) {
        return data.map(mapFoodRow);
      }
    } catch (e) {
      console.warn('Supabase food search error, checking canonical dataset:', e);
    }

    // 2. Query verified canonical dataset (all 280 Indian dishes from foods.csv)
    const dataset = CANONICAL_FOODS as unknown as Food[];
    if (!clean) {
      return dataset.slice(0, 50);
    }

    return dataset.filter((f) => {
      const nameMatch = f.name.toLowerCase().includes(clean);
      const aliasMatch = f.aliases && f.aliases.some((a) => a.toLowerCase().includes(clean));
      const tagMatch = f.tags && f.tags.some((t) => t.toLowerCase().includes(clean));
      return nameMatch || aliasMatch || tagMatch;
    });
  },

  // Get a single food by its UUID or dataset ID
  async getFoodById(id: string): Promise<{ data: Food | null; error: any }> {
    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return { data: mapFoodRow(data), error: null };
      }
    } catch {}

    // 2. Try Canonical Dataset
    const dataset = CANONICAL_FOODS as unknown as Food[];
    const cleanId = (id || '').toLowerCase();
    const found = dataset.find(
      (f) =>
        f.id.toLowerCase() === cleanId ||
        f.name.toLowerCase() === cleanId ||
        cleanId.includes(f.name.toLowerCase()) ||
        f.name.toLowerCase().includes(cleanId.replace('food-', '').replace(/-/g, ' '))
    );

    if (found) {
      return { data: found, error: null };
    }

    return { data: null, error: new Error('Food not found in database') };
  },

  // Resolve a food label (from DL model / Menu OCR / Voice recognition)
  // Strictly matches against verified database items and returns complete nutrients
  async resolveByLabel(label: string): Promise<Food | null> {
    if (!label || !label.trim()) return null;
    const clean = label.trim().toLowerCase();

    // 1. Try Supabase exact & partial match
    try {
      const { data: exactMatch } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', clean)
        .limit(1)
        .single();

      if (exactMatch) return mapFoodRow(exactMatch);

      const { data: partialMatches } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', `%${clean}%`)
        .limit(1);

      if (partialMatches && partialMatches.length > 0) {
        return mapFoodRow(partialMatches[0]);
      }
    } catch {}

    // 2. Query Canonical Dataset (280 Indian dishes)
    const dataset = CANONICAL_FOODS as unknown as Food[];

    // Priority 1: Exact name match
    const exact = dataset.find((f) => f.name.toLowerCase() === clean);
    if (exact) return exact;

    // Priority 2: Exact alias match
    const aliasExact = dataset.find((f) =>
      f.aliases && f.aliases.some((a) => a.toLowerCase() === clean)
    );
    if (aliasExact) return aliasExact;

    // Priority 3: Substring match
    const substringMatch = dataset.find((f) => {
      const nameHas = f.name.toLowerCase().includes(clean) || clean.includes(f.name.toLowerCase());
      const aliasHas = f.aliases && f.aliases.some((a) => a.toLowerCase().includes(clean) || clean.includes(a.toLowerCase()));
      return nameHas || aliasHas;
    });

    if (substringMatch) return substringMatch;

    return null;
  },
};
