import { supabase } from '../../lib/supabase';
import { profileService, toUUID } from '../profile.service';
import type { Meal } from '../../types';

export const supabaseMealService = {
  async saveMeal(meal: Omit<Meal, 'id'>): Promise<Meal> {
    const rawUserId = profileService.getStableUserId();
    const userId = toUUID(rawUserId);

    // 1. Ensure a profile row exists in Supabase profiles (id: UUID, display_name)
    try {
      await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            display_name: 'NutriSense Member',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
    } catch (e) {
      console.warn('Profile touch before meal log skipped/failed:', e);
    }

    // 2. Prepare rich meal summary in notes to preserve all macros & micros
    const mealPayload = {
      items: meal.items,
      totalMacros: meal.totalMacros,
      totalMicros: meal.totalMicros,
    };

    // 3. Insert into meal_logs using valid columns: id, user_id, meal_type, logged_at, notes
    const { data: logData, error: logError } = await supabase
      .from('meal_logs')
      .insert({
        user_id: userId,
        meal_type: meal.mealType,
        logged_at: meal.loggedAt || new Date().toISOString(),
        notes: JSON.stringify(mealPayload),
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Failed to insert meal_log into Supabase:', logError);
      throw logError;
    }

    const mealId = logData.id;

    // 4. Insert items into meal_items using valid columns: meal_id, food_id, quantity
    const itemsToInsert = meal.items.map((item) => ({
      meal_id: mealId,
      food_id: item.foodId || null,
      quantity: item.quantity || 1,
    }));

    if (itemsToInsert.length > 0) {
      try {
        const { error: itemsError } = await supabase
          .from('meal_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.warn('Failed to insert meal_items into Supabase:', itemsError);
        }
      } catch (err) {
        console.warn('Exception during meal_items insert:', err);
      }
    }

    return {
      ...meal,
      id: mealId,
    };
  },

  // Retrieve today's meals directly from Supabase meal_logs
  async getTodayMeals(): Promise<Meal[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rawUserId = profileService.getStableUserId();
    const userId = toUUID(rawUserId);

    try {
      const { data: logs, error } = await supabase
        .from('meal_logs')
        .select('id, user_id, meal_type, logged_at, notes')
        .eq('user_id', userId)
        .gte('logged_at', today.toISOString())
        .order('logged_at', { ascending: false });

      if (error || !logs || logs.length === 0) {
        return [];
      }

      return logs.map((log: any) => {
        let parsedNotes: any = null;
        if (log.notes) {
          try {
            parsedNotes = JSON.parse(log.notes);
          } catch {}
        }

        const items = parsedNotes?.items || [];
        const totalMacros = parsedNotes?.totalMacros || {
          calories: { min: 0, max: 0, unit: 'kcal' },
          protein: { min: 0, max: 0, unit: 'g' },
          carbs: { min: 0, max: 0, unit: 'g' },
          fat: { min: 0, max: 0, unit: 'g' },
          fiber: { min: 0, max: 0, unit: 'g' },
        };
        const totalMicros = parsedNotes?.totalMicros || {
          iron: { min: 0, max: 0, unit: 'mg' },
          calcium: { min: 0, max: 0, unit: 'mg' },
          b12: { min: 0, max: 0, unit: 'mcg' },
        };

        return {
          id: log.id,
          userId: rawUserId,
          mealType: log.meal_type,
          loggedAt: log.logged_at,
          inputMethod: 'photo' as const,
          items,
          totalMacros,
          totalMicros,
        };
      });
    } catch (e) {
      console.warn('Error reading today meals from Supabase:', e);
      return [];
    }
  },
};
