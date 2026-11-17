import { supabase } from '../../lib/supabase';

export interface Nutrient {
  id: string;
  name: string;
  slug: string;
  unit: string;
  category: string;
}

export const CANONICAL_21_NUTRIENTS: Nutrient[] = [
  { id: 'ce183032-4964-4605-b549-2f5d33174f42', name: 'Calories', slug: 'calories', unit: 'kcal', category: 'Macro' },
  { id: '61ed3497-fa21-45b4-9890-5d4a0a4d2bea', name: 'Protein', slug: 'protein', unit: 'g', category: 'Macro' },
  { id: 'c737ea23-a4a9-4f4a-b02c-85a77fa51953', name: 'Carbs', slug: 'carbs', unit: 'g', category: 'Macro' },
  { id: '7bfb7d51-47c5-4a08-ad5f-fb8475341cfc', name: 'Fat', slug: 'fat', unit: 'g', category: 'Macro' },
  { id: 'a513ecec-605f-4376-9fd3-8ce5378707e9', name: 'Dietary Fiber', slug: 'fiber', unit: 'g', category: 'Macro' },
  { id: '4ebcb9b2-50cf-4c78-ac41-a73c09f08944', name: 'Iron', slug: 'iron', unit: 'mg', category: 'Micro' },
  { id: '315664b0-b7a5-4f7f-b45a-1fc2b4a6ad97', name: 'Calcium', slug: 'calcium', unit: 'mg', category: 'Micro' },
  { id: '5e465bd4-a0bb-443b-af4e-08e1f6ddbff7', name: 'Magnesium', slug: 'magnesium', unit: 'mg', category: 'Micro' },
  { id: '50650177-49a1-4569-b4ef-c25d8ae24e84', name: 'Potassium', slug: 'potassium', unit: 'mg', category: 'Micro' },
  { id: 'c283476d-7ee5-47ea-b6bd-e8d3a424af4f', name: 'Zinc', slug: 'zinc', unit: 'mg', category: 'Micro' },
  { id: '9d827e7a-a9dd-41be-82ef-14560500c385', name: 'Sodium', slug: 'sodium', unit: 'mg', category: 'Micro' },
  { id: 'ac10e142-7b67-42ca-8890-89a64015193c', name: 'Vitamin A', slug: 'vitamin_a', unit: 'mcg', category: 'Micro' },
  { id: '535ad90c-4376-453d-8f4e-5b708ea40c2f', name: 'Vitamin C', slug: 'vitamin_c', unit: 'mg', category: 'Micro' },
  { id: 'cd5fa895-1474-4633-afb2-148b9b094ec3', name: 'Vitamin D', slug: 'vitamin_d', unit: 'mcg', category: 'Micro' },
  { id: '14f68ebd-ed45-4b7c-bc24-ebac52daf426', name: 'Vitamin E', slug: 'vitamin_e', unit: 'mg', category: 'Micro' },
  { id: '69c90ce4-9f53-4533-bcc3-aedb4683adcf', name: 'Vitamin K', slug: 'vitamin_k', unit: 'mcg', category: 'Micro' },
  { id: '01e07c3e-f0fe-4cc5-8254-809929258698', name: 'Vitamin B1 (Thiamin)', slug: 'vitamin_b1', unit: 'mg', category: 'Micro' },
  { id: 'b5282c13-bf68-4210-bfcc-4e2dcff96785', name: 'Vitamin B2 (Riboflavin)', slug: 'vitamin_b2', unit: 'mg', category: 'Micro' },
  { id: 'da12da9a-e552-48f8-8259-967664e1550a', name: 'Vitamin B6', slug: 'vitamin_b6', unit: 'mg', category: 'Micro' },
  { id: '18ace0da-1ad8-48f0-878c-bbcb58dea31f', name: 'Folate', slug: 'folate', unit: 'mcg', category: 'Micro' },
  { id: '6ea17d3a-fbdb-4fa7-b58c-c1daac2e998a', name: 'Vitamin B12', slug: 'vitamin_b12', unit: 'mcg', category: 'Micro' },
];

export const supabaseNutrientService = {
  async getNutrients(): Promise<Nutrient[]> {
    try {
      const { data, error } = await supabase
        .from('nutrients')
        .select('*')
        .eq('active', true)
        .order('name');

      if (!error && data && data.length > 0) {
        return data.map((n) => ({
          id: n.id,
          name: n.name,
          slug: n.slug,
          unit: n.unit,
          category: n.category,
        }));
      }
    } catch (e) {
      console.warn('Supabase nutrients query error, providing canonical 21 nutrients:', e);
    }

    // Always guarantee all 21 canonical nutrients are displayed for onboarding & profile
    return CANONICAL_21_NUTRIENTS;
  },
};
