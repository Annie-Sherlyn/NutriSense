"""
Add FD273-FD280 to foods.csv.
Run once from nutrisense/ directory.
"""
import pandas as pd
import os

CSV_PATH = os.path.join('app', 'data', 'foods.csv')

df = pd.read_csv(CSV_PATH)
print(f"Before: {len(df)} rows, last ID: {df['food_id'].iloc[-1]}")

# Check the CSV columns so we match exactly
cols = df.columns.tolist()

def make_row(food_id, name, alternate_names, variants, category, subcategory,
             serving_amount, serving_unit, serving_weight_g,
             cal_min, cal_max, prot_min, prot_max, carb_min, carb_max,
             fat_min, fat_max, fiber_min, fiber_max, iron_min, iron_max,
             cal_mg_min, cal_mg_max, dietary_tags, allergens, ingredients,
             price_min, price_max):
    """Build a row dict with all required CSV columns, leaving unused columns as empty string."""
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

new_rows = [
    make_row(
        food_id='FD273',
        name='Chana Masala',
        alternate_names='Chole, Chickpea Curry',
        variants='Amritsari Chole',
        category='North Indian',
        subcategory='Curry',
        serving_amount=1, serving_unit='bowl', serving_weight_g=200,
        cal_min=180, cal_max=220, prot_min=8.0, prot_max=10.0,
        carb_min=28.0, carb_max=34.0, fat_min=5.0, fat_max=7.0,
        fiber_min=6.0, fiber_max=8.0, iron_min=3.0, iron_max=4.0,
        cal_mg_min=60.0, cal_mg_max=80.0,
        dietary_tags='Vegetarian, Vegan', allergens='',
        ingredients='chickpeas, tomato, onion, spices, oil',
        price_min=60, price_max=120
    ),
    make_row(
        food_id='FD274',
        name='Paneer Masala',
        alternate_names='Paneer Curry, Paneer Sabzi',
        variants='Paneer Butter Masala, Paneer Tikka Masala',
        category='North Indian',
        subcategory='Curry',
        serving_amount=1, serving_unit='bowl', serving_weight_g=200,
        cal_min=260, cal_max=320, prot_min=12.0, prot_max=16.0,
        carb_min=14.0, carb_max=18.0, fat_min=16.0, fat_max=22.0,
        fiber_min=2.0, fiber_max=3.0, iron_min=1.0, iron_max=1.5,
        cal_mg_min=220.0, cal_mg_max=280.0,
        dietary_tags='Vegetarian', allergens='Dairy',
        ingredients='paneer, tomato, onion, cream, spices, butter',
        price_min=80, price_max=160
    ),
    make_row(
        food_id='FD275',
        name='Dal Makhani',
        alternate_names='Dal Makhni, Black Dal',
        variants='',
        category='North Indian',
        subcategory='Dal',
        serving_amount=1, serving_unit='bowl', serving_weight_g=200,
        cal_min=200, cal_max=250, prot_min=9.0, prot_max=12.0,
        carb_min=24.0, carb_max=30.0, fat_min=8.0, fat_max=12.0,
        fiber_min=5.0, fiber_max=7.0, iron_min=3.5, iron_max=4.5,
        cal_mg_min=80.0, cal_mg_max=110.0,
        dietary_tags='Vegetarian', allergens='Dairy',
        ingredients='black lentils, kidney beans, butter, cream, tomato, spices',
        price_min=70, price_max=140
    ),
    make_row(
        food_id='FD276',
        name='Rajma Chawal',
        alternate_names='Rajma Rice, Kidney Bean Curry with Rice',
        variants='',
        category='North Indian',
        subcategory='Rice Dish',
        serving_amount=1, serving_unit='plate', serving_weight_g=350,
        cal_min=380, cal_max=460, prot_min=14.0, prot_max=18.0,
        carb_min=68.0, carb_max=82.0, fat_min=6.0, fat_max=10.0,
        fiber_min=8.0, fiber_max=11.0, iron_min=4.0, iron_max=5.5,
        cal_mg_min=80.0, cal_mg_max=110.0,
        dietary_tags='Vegetarian, Vegan', allergens='',
        ingredients='kidney beans, rice, tomato, onion, spices, oil',
        price_min=60, price_max=120
    ),
    make_row(
        food_id='FD277',
        name='Chole Bhature',
        alternate_names='Chhole Bhature',
        variants='',
        category='North Indian',
        subcategory='Breakfast',
        serving_amount=1, serving_unit='plate', serving_weight_g=300,
        cal_min=520, cal_max=640, prot_min=14.0, prot_max=18.0,
        carb_min=72.0, carb_max=88.0, fat_min=18.0, fat_max=26.0,
        fiber_min=7.0, fiber_max=10.0, iron_min=3.5, iron_max=5.0,
        cal_mg_min=70.0, cal_mg_max=100.0,
        dietary_tags='Vegetarian', allergens='Gluten, Dairy',
        ingredients='chickpeas, maida, yogurt, oil, spices',
        price_min=60, price_max=130
    ),
    make_row(
        food_id='FD278',
        name='Palak Paneer',
        alternate_names='Spinach Paneer, Saag Paneer',
        variants='',
        category='North Indian',
        subcategory='Curry',
        serving_amount=1, serving_unit='bowl', serving_weight_g=200,
        cal_min=200, cal_max=260, prot_min=10.0, prot_max=14.0,
        carb_min=10.0, carb_max=14.0, fat_min=13.0, fat_max=18.0,
        fiber_min=3.0, fiber_max=5.0, iron_min=3.0, iron_max=4.5,
        cal_mg_min=280.0, cal_mg_max=360.0,
        dietary_tags='Vegetarian', allergens='Dairy',
        ingredients='spinach, paneer, tomato, onion, cream, spices',
        price_min=70, price_max=150
    ),
    make_row(
        food_id='FD279',
        name='Apple',
        alternate_names='Seb, Red Apple, Green Apple',
        variants='Fuji Apple, Granny Smith Apple, Gala Apple',
        category='Fruits',
        subcategory='Fresh Fruit',
        serving_amount=1, serving_unit='piece', serving_weight_g=150,
        cal_min=72, cal_max=88, prot_min=0.3, prot_max=0.5,
        carb_min=18.0, carb_max=22.0, fat_min=0.1, fat_max=0.3,
        fiber_min=2.5, fiber_max=3.5, iron_min=0.1, iron_max=0.2,
        cal_mg_min=8.0, cal_mg_max=12.0,
        dietary_tags='Vegetarian, Vegan', allergens='',
        ingredients='apple',
        price_min=20, price_max=60
    ),
    make_row(
        food_id='FD280',
        name='Banana',
        alternate_names='Kela, Plantain',
        variants='Robusta Banana, Nendran Banana',
        category='Fruits',
        subcategory='Fresh Fruit',
        serving_amount=1, serving_unit='piece', serving_weight_g=120,
        cal_min=90, cal_max=110, prot_min=1.0, prot_max=1.4,
        carb_min=22.0, carb_max=28.0, fat_min=0.2, fat_max=0.4,
        fiber_min=2.0, fiber_max=3.0, iron_min=0.2, iron_max=0.4,
        cal_mg_min=4.0, cal_mg_max=8.0,
        dietary_tags='Vegetarian, Vegan', allergens='',
        ingredients='banana',
        price_min=5, price_max=20
    ),
]

new_df = pd.DataFrame(new_rows, columns=cols)
df = pd.concat([df, new_df], ignore_index=True)
df.to_csv(CSV_PATH, index=False)
print(f"After: {len(df)} rows, last ID: {df['food_id'].iloc[-1]}")

# Verify new rows
print("\nNew rows added:")
for fid in ['FD273','FD274','FD275','FD276','FD277','FD278','FD279','FD280']:
    row = df[df['food_id']==fid]
    if len(row)>0:
        r = row.iloc[0]
        print(f"  {fid}: {r['name']} | alt={r['alternate_names']} | srv={r['serving_amount']} {r['serving_unit']}")
    else:
        print(f"  {fid}: NOT FOUND - ERROR!")
