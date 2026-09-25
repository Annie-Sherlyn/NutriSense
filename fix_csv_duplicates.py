"""
Fix CSV: Remove duplicate FD273,FD275,FD276,FD277,FD278 and replace with 
unique foods not already in the CSV.
"""
import pandas as pd

CSV_PATH = 'app/data/foods.csv'
df = pd.read_csv(CSV_PATH)
print(f"Before fix: {len(df)} rows")

# Remove duplicate rows that shadow existing entries
dupes_to_remove = ['FD273', 'FD275', 'FD276', 'FD277', 'FD278']
df = df[~df['food_id'].isin(dupes_to_remove)]
print(f"After removing duplicates: {len(df)} rows")

cols = df.columns.tolist()

def make_row(food_id, name, alternate_names, variants, category, subcategory,
             serving_amount, serving_unit, serving_weight_g,
             cal_min, cal_max, prot_min, prot_max, carb_min, carb_max,
             fat_min, fat_max, fiber_min, fiber_max, iron_min, iron_max,
             cal_mg_min, cal_mg_max, dietary_tags, allergens, ingredients,
             price_min, price_max):
    row = {c: '' for c in cols}
    row['food_id'] = food_id
    row['name'] = name
    row['alternate_names'] = alternate_names
    row['variants'] = variants
    row['category'] = category
    row['subcategory'] = subcategory
    row['serving_amount'] = serving_amount
    row['serving_unit'] = serving_unit
    row['serving_weight_g'] = serving_weight_g
    row['calories_min'] = cal_min
    row['calories_max'] = cal_max
    row['protein_min'] = prot_min
    row['protein_max'] = prot_max
    row['carbs_min'] = carb_min
    row['carbs_max'] = carb_max
    row['fat_min'] = fat_min
    row['fat_max'] = fat_max
    row['fiber_min'] = fiber_min
    row['fiber_max'] = fiber_max
    row['iron_min'] = iron_min
    row['iron_max'] = iron_max
    row['calcium_min'] = cal_mg_min
    row['calcium_max'] = cal_mg_max
    row['dietary_tags'] = dietary_tags
    row['allergens'] = allergens
    row['ingredients'] = ingredients
    row['price_min_inr'] = price_min
    row['price_max_inr'] = price_max
    row['source'] = 'INDB 2024 estimate'
    row['confidence'] = 'Medium'
    row['match_type'] = 'Exact'
    row['variant_status'] = 'No variants listed'
    return row

# Replace with 5 unique foods not in the CSV
replacement_rows = [
    make_row(
        food_id='FD273',
        name='Guava',
        alternate_names='Amrud, Peru, Psidium Guajava',
        variants='White Guava, Pink Guava',
        category='Fruits',
        subcategory='Fresh Fruit',
        serving_amount=1, serving_unit='piece', serving_weight_g=100,
        cal_min=55, cal_max=68, prot_min=0.8, prot_max=1.2,
        carb_min=12.0, carb_max=15.0, fat_min=0.5, fat_max=0.9,
        fiber_min=4.0, fiber_max=6.0, iron_min=0.2, iron_max=0.4,
        cal_mg_min=15.0, cal_mg_max=25.0,
        dietary_tags='Vegetarian, Vegan', allergens='',
        ingredients='guava',
        price_min=10, price_max=30
    ),
    make_row(
        food_id='FD275',
        name='Mango',
        alternate_names='Aam, Alphonso, Kesar',
        variants='Alphonso Mango, Kesar Mango, Totapuri Mango',
        category='Fruits',
        subcategory='Fresh Fruit',
        serving_amount=1, serving_unit='piece', serving_weight_g=200,
        cal_min=120, cal_max=148, prot_min=1.4, prot_max=1.8,
        carb_min=29.0, carb_max=36.0, fat_min=0.4, fat_max=0.8,
        fiber_min=2.5, fiber_max=3.5, iron_min=0.2, iron_max=0.4,
        cal_mg_min=14.0, cal_mg_max=20.0,
        dietary_tags='Vegetarian, Vegan', allergens='',
        ingredients='mango',
        price_min=20, price_max=80
    ),
    make_row(
        food_id='FD276',
        name='Orange',
        alternate_names='Santra, Narangi, Nagpur Orange',
        variants='Kinnow, Mosambi (Sweet Lime)',
        category='Fruits',
        subcategory='Fresh Fruit',
        serving_amount=1, serving_unit='piece', serving_weight_g=130,
        cal_min=55, cal_max=68, prot_min=0.9, prot_max=1.3,
        carb_min=12.5, carb_max=15.5, fat_min=0.1, fat_max=0.3,
        fiber_min=2.5, fiber_max=3.5, iron_min=0.1, iron_max=0.2,
        cal_mg_min=40.0, cal_mg_max=56.0,
        dietary_tags='Vegetarian, Vegan', allergens='',
        ingredients='orange',
        price_min=10, price_max=40
    ),
    make_row(
        food_id='FD277',
        name='Papaya',
        alternate_names='Papeeta, Pawpaw',
        variants='Raw Papaya, Ripe Papaya',
        category='Fruits',
        subcategory='Fresh Fruit',
        serving_amount=1, serving_unit='serving', serving_weight_g=150,
        cal_min=57, cal_max=70, prot_min=0.5, prot_max=0.9,
        carb_min=13.0, carb_max=16.0, fat_min=0.2, fat_max=0.4,
        fiber_min=2.0, fiber_max=3.0, iron_min=0.2, iron_max=0.4,
        cal_mg_min=25.0, cal_mg_max=36.0,
        dietary_tags='Vegetarian, Vegan', allergens='',
        ingredients='papaya',
        price_min=15, price_max=50
    ),
    make_row(
        food_id='FD278',
        name='Watermelon',
        alternate_names='Tarbooz, Tarbuj',
        variants='',
        category='Fruits',
        subcategory='Fresh Fruit',
        serving_amount=1, serving_unit='serving', serving_weight_g=200,
        cal_min=58, cal_max=72, prot_min=1.0, prot_max=1.4,
        carb_min=13.0, carb_max=16.0, fat_min=0.2, fat_max=0.4,
        fiber_min=0.8, fiber_max=1.2, iron_min=0.2, iron_max=0.3,
        cal_mg_min=14.0, cal_mg_max=20.0,
        dietary_tags='Vegetarian, Vegan', allergens='',
        ingredients='watermelon',
        price_min=10, price_max=40
    ),
]

new_df = pd.DataFrame(replacement_rows, columns=cols)
df = pd.concat([df, new_df], ignore_index=True)

# Sort by food_id to maintain order
df = df.sort_values('food_id').reset_index(drop=True)
df.to_csv(CSV_PATH, index=False)
print(f"After fix: {len(df)} rows, last ID: {df['food_id'].iloc[-1]}")

# Verify
print("\nFD273-FD280:")
for fid in ['FD273','FD274','FD275','FD276','FD277','FD278','FD279','FD280']:
    row = df[df['food_id']==fid]
    if len(row) > 0:
        r = row.iloc[0]
        print(f"  {fid}: {r['name']} | alt={r['alternate_names']}")
    else:
        print(f"  {fid}: NOT FOUND")

# Confirm no duplicates
dup = df[df['food_id'].duplicated()]
if len(dup) > 0:
    print(f"WARNING: {len(dup)} duplicate food_ids: {dup['food_id'].tolist()}")
else:
    print("\nNo duplicate food_ids.")
