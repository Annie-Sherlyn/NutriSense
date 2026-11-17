import { supabase } from '../lib/supabase';
import { getCurrentUserUid } from '../lib/firebase';
import type { UserProfile } from '../types';

export function toUUID(str: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }
  const h1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const h2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const combined = (h1 + h2 + h1 + h2).slice(0, 32);
  return `${combined.slice(0, 8)}-${combined.slice(8, 12)}-4${combined.slice(13, 16)}-a${combined.slice(17, 20)}-${combined.slice(20, 32)}`;
}

export const profileService = {
  getStableUserId(): string {
    const raw = localStorage.getItem('nutrisense:v1:auth');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.id) return parsed.id;
      } catch {}
    }
    return getCurrentUserUid();
  },

  getStableUUID(): string {
    return toUUID(this.getStableUserId());
  },

  async getProfile(): Promise<UserProfile | null> {
    const userId = this.getStableUserId();
    const uuid = toUUID(userId);

    // 1. Try Supabase by UUID / ID
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${uuid},id.eq.${userId}`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          userId,
          name: data.display_name || data.name || 'NutriSense Member',
          dietType: data.diet_type || 'vegetarian',
          allergies: data.allergies || [],
          goal: data.goal || 'better-health',
          priorityNutrients: data.priority_nutrients || ['protein', 'iron'],
          budgetPerMeal: data.budget_per_meal || 150,
          ageGroup: data.age_group,
          activityLevel: data.activity_level || 'moderate',
          location: data.location,
          cuisineLikes: data.cuisine_likes || [],
          cuisineDislikes: data.cuisine_dislikes || [],
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase profile fetch error, checking local:', e);
    }

    // 2. Local fallback
    const rawLocal = localStorage.getItem('ns_profile');
    if (rawLocal) {
      try {
        return JSON.parse(rawLocal);
      } catch {}
    }
    return null;
  },

  async upsertProfile(profile: Partial<UserProfile>): Promise<void> {
    const userId = this.getStableUserId();
    const uuid = toUUID(userId);
    const displayName = profile.name || 'NutriSense Member';

    // Cache locally immediately
    const localProfile = {
      userId,
      name: displayName,
      dietType: profile.dietType || 'vegetarian',
      allergies: profile.allergies || [],
      goal: profile.goal || 'better-health',
      priorityNutrients: profile.priorityNutrients || ['protein', 'iron'],
      budgetPerMeal: profile.budgetPerMeal || 150,
      activityLevel: profile.activityLevel || 'moderate',
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('ns_profile', JSON.stringify(localProfile));

    // Try Supabase insert using the actual schema columns (id as UUID, display_name)
    try {
      await supabase
        .from('profiles')
        .upsert(
          {
            id: uuid,
            display_name: displayName,
            diet_type: profile.dietType,
            activity_level: profile.activityLevel,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
    } catch (err) {
      console.warn('Supabase profiles upsert failed (checking RLS/schema):', err);
    }
  },
};
