"""
Fix foods.csv:
1. Replace FD273 (Guava) with Sadham / Plain Rice
2. Replace FD275 (Mango) with Noodles
3. Replace FD276 (Orange) with Koozh
4. Replace FD277 (Papaya) with Pizza
5. Replace FD278 (Watermelon) with Burger
   (FD274 Paneer Masala, FD279 Apple, FD280 Banana already correct)

Nutrition values for Sadham: derived from FD045 Steamed Rice (same food, same INDB data).
Nutrition values for Noodles, Koozh, Pizza, Burger: INDB 2024 / USDA estimates.
"""
import pandas as pd

CSV_PATH = 'app/data/foods.csv'
df = pd.read_csv(CSV_PATH)
print(f"Before: {len(df)} rows")

cols = df.columns.tolist()

def make_row(**kw):
    """Build a row dict with all CSV columns, filling mandatory fields."""
    row = {c: '' for c in cols}
    row.update(kw)
    if 'source' not in kw or not kw['source']:
        row['source'] = 'INDB 2024 estimate'
    if 'confidence' not in kw or not kw['confidence']:
        row['confidence'] = 'Medium'
    if 'match_type' not in kw or not kw['match_type']:
        row['match_type'] = 'Exact'
    if 'variant_status' not in kw or not kw['variant_status']:
        row['variant_status'] = 'No variants listed'
    return row

# ─────────────────────────────────────────────────────────────────
# FD273 — Sadham / Plain Rice
# Nutrition: same food as FD045 Steamed Rice (INDB 2024).
# FD045 existing values used directly.
# ─────────────────────────────────────────────────────────────────
fd045 = df[df['food_id']=='FD045'].iloc[0]
row_273 = make_row(
    food_id='FD273',
    name='Sadham',
    alternate_names='Plain Rice, Sadam, Saadam, Choru, Cooked Rice',
    variants='Boiled Rice, Raw Rice (Pacharisi Sadam)',
    category='Rice & Lunch Mains',
    subcategory='Plain Rice',
    serving_amount=fd045['serving_amount'],
    serving_unit=fd045['serving_unit'],
    serving_weight_g=fd045['serving_weight_g'],
    calories_min=fd045['calories_min'],
    calories_max=fd045['calories_max'],
    protein_min=fd045['protein_min'],
    protein_max=fd045['protein_max'],
    carbs_min=fd045['carbs_min'],
    carbs_max=fd045['carbs_max'],
    fat_min=fd045['fat_min'],
    fat_max=fd045['fat_max'],
    fiber_min=fd045['fiber_min'],
    fiber_max=fd045['fiber_max'],
    iron_min=fd045['iron_min'],
    iron_max=fd045['iron_max'],
    calcium_min=fd045['calcium_min'],
    calcium_max=fd045['calcium_max'],
    dietary_tags='Vegetarian, Vegan',
    allergens='',
    ingredients='rice, water',
    price_min_inr=15,
    price_max_inr=50,
    source='Anuvaad Indian Nutrient Databank (INDB) 2024.11',
    confidence='High',
    match_type='Direct INDB equivalent',
    variant_status='Demo canonical entry (same as Steamed Rice FD045)',
)

# ─────────────────────────────────────────────────────────────────
# FD275 — Noodles
# INDB 2024 / USDA estimate for plain boiled noodles (~per 1 cup cooked).
# Per 150g cooked: ~220 kcal, protein 7g, carbs 43g, fat 1.5g, iron 1.2mg, Ca 14mg
# ─────────────────────────────────────────────────────────────────
row_275 = make_row(
    food_id='FD275',
    name='Noodles',
    alternate_names='Boiled Noodles, Plain Noodles, Wheat Noodles',
    variants='Hakka Noodles, Chow Mein, Maggi Noodles, Rice Noodles',
    category='Rice & Lunch Mains',
    subcategory='Noodles & Pasta',
    serving_amount=1,
    serving_unit='cup (cooked)',
    serving_weight_g=150,
    calories_min=198,
    calories_max=242,
    protein_min=6.3,
    protein_max=7.7,
    carbs_min=38.7,
    carbs_max=47.3,
    fat_min=1.4,
    fat_max=1.7,
    fiber_min=1.8,
    fiber_max=2.2,
    iron_min=1.1,
    iron_max=1.4,
    calcium_min=12.6,
    calcium_max=15.4,
    dietary_tags='Vegetarian',
    allergens='Gluten',
    ingredients='wheat flour, water, salt',
    price_min_inr=20,
    price_max_inr=80,
    source='USDA FoodData Central / INDB 2024 estimate',
    confidence='Medium',
    match_type='Category estimate',
    variant_status='Generic entry; specify variant for exact values',
)

# ─────────────────────────────────────────────────────────────────
# FD276 — Koozh
# Traditional Tamil fermented rice/millet gruel (Ragi Koozh or Rice Koozh).
# Per 1 cup (~200g): ~90-110 kcal, protein 2g, carbs 20g, fat 0.5g, iron 1.5mg, Ca 30mg
# Source: INDB 2024 analogue (Ragi/Rice gruel); prep-variability ±20%
# ─────────────────────────────────────────────────────────────────
row_276 = make_row(
    food_id='FD276',
    name='Koozh',
    alternate_names='Kool, Ragi Koozh, Rice Koozh, Kambu Koozh, Fermented Rice Gruel',
    variants='Ragi Koozh (finger-millet), Kambu Koozh (pearl millet), Rice Koozh',
    category='Breakfast & Tiffin',
    subcategory='Traditional Porridge',
    serving_amount=1,
    serving_unit='cup',
    serving_weight_g=200,
    calories_min=88,
    calories_max=112,
    protein_min=1.6,
    protein_max=2.4,
    carbs_min=18.0,
    carbs_max=22.0,
    fat_min=0.4,
    fat_max=0.6,
    fiber_min=0.8,
    fiber_max=1.2,
    iron_min=1.2,
    iron_max=1.8,
    calcium_min=24.0,
    calcium_max=36.0,
    dietary_tags='Vegetarian, Vegan',
    allergens='',
    ingredients='rice or ragi flour, water, salt, buttermilk (traditional)',
    price_min_inr=10,
    price_max_inr=40,
    source='INDB 2024 analogue (Ragi/Rice gruel)',
    confidence='Low',
    match_type='Category estimate',
    variant_status='Variant nutrition varies significantly; ragi variant has higher calcium',
)

# ─────────────────────────────────────────────────────────────────
# FD277 — Pizza
# USDA estimate for a typical cheese pizza slice (~107g per slice).
# Per 1 slice: ~270 kcal, protein 11g, carbs 33g, fat 10g, iron 2.5mg, Ca 188mg
# ─────────────────────────────────────────────────────────────────
row_277 = make_row(
    food_id='FD277',
    name='Pizza',
    alternate_names='Cheese Pizza, Plain Pizza',
    variants='Margherita Pizza, Veg Pizza, Chicken Pizza, Pepperoni Pizza',
    category='Evening Snacks & Street Food',
    subcategory='Fast Food',
    serving_amount=1,
    serving_unit='slice',
    serving_weight_g=107,
    calories_min=243,
    calories_max=297,
    protein_min=9.9,
    protein_max=12.1,
    carbs_min=29.7,
    carbs_max=36.3,
    fat_min=9.0,
    fat_max=11.0,
    fiber_min=1.8,
    fiber_max=2.2,
    iron_min=2.25,
    iron_max=2.75,
    calcium_min=169.2,
    calcium_max=206.8,
    dietary_tags='Vegetarian',
    allergens='Gluten, Dairy',
    ingredients='maida, tomato sauce, cheese, vegetables',
    price_min_inr=80,
    price_max_inr=300,
    source='USDA FoodData Central',
    confidence='Medium',
    match_type='USDA equivalent',
    variant_status='Generic entry; values for plain cheese pizza',
)

# ─────────────────────────────────────────────────────────────────
# FD278 — Burger
# USDA estimate for a plain hamburger/veggie burger (~100g).
# Per 1 burger: ~295 kcal, protein 17g, carbs 24g, fat 14g, iron 2.5mg, Ca 60mg
# ─────────────────────────────────────────────────────────────────
row_278 = make_row(
    food_id='FD278',
    name='Burger',
    alternate_names='Hamburger, Veggie Burger, Aloo Tikki Burger',
    variants='Veg Burger, Chicken Burger, Aloo Tikki Burger',
    category='Evening Snacks & Street Food',
    subcategory='Fast Food',
    serving_amount=1,
    serving_unit='piece',
    serving_weight_g=100,
    calories_min=265,
    calories_max=325,
    protein_min=15.3,
    protein_max=18.7,
    carbs_min=21.6,
    carbs_max=26.4,
    fat_min=12.6,
    fat_max=15.4,
    fiber_min=0.9,
    fiber_max=1.1,
    iron_min=2.25,
    iron_max=2.75,
    calcium_min=54.0,
    calcium_max=66.0,
    dietary_tags='Non-Vegetarian',
    allergens='Gluten, Dairy',
    ingredients='burger bun, patty, lettuce, tomato, sauce, cheese',
    price_min_inr=50,
    price_max_inr=250,
    source='USDA FoodData Central',
    confidence='Medium',
    match_type='USDA equivalent',
    variant_status='Generic entry; values for plain beef/veg burger',
)

# ─────────────────────────────────────────────────────────────────
# Build replacement dataframe
# ─────────────────────────────────────────────────────────────────
replacements = {
    'FD273': row_273,
    'FD275': row_275,
    'FD276': row_276,
    'FD277': row_277,
    'FD278': row_278,
}

# Remove old rows for these IDs
df = df[~df['food_id'].isin(replacements.keys())]
# Add new rows
new_rows = pd.DataFrame(list(replacements.values()), columns=cols)
df = pd.concat([df, new_rows], ignore_index=True)

# Sort by food_id
df = df.sort_values('food_id').reset_index(drop=True)
df.to_csv(CSV_PATH, index=False)

print(f"After: {len(df)} rows")
print()
print("FD273-FD280:")
for fid in ['FD273','FD274','FD275','FD276','FD277','FD278','FD279','FD280']:
    row = df[df['food_id']==fid]
    if len(row):
        r = row.iloc[0]
        print(f"  {fid}: {r['name']} | alt={r['alternate_names']} | srv={r['serving_amount']} {r['serving_unit']} | cal_min={r['calories_min']}")
    else:
        print(f"  {fid}: ABSENT!")

# No duplicates check
dup = df[df['food_id'].duplicated()]
if len(dup):
    print(f"\nWARNING: {len(dup)} duplicate food_ids!")
else:
    print("\nNo duplicate food_ids.")
