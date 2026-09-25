import pandas as pd
df = pd.read_csv('app/data/foods.csv')

# Show FD045 full nutritional details
r = df[df['food_id']=='FD045'].iloc[0]
print('FD045 Steamed Rice:')
print('  name:', r['name'])
print('  alt:', r['alternate_names'])
print('  srv:', r['serving_amount'], r['serving_unit'])
print('  cal_min:', r['calories_min'])
print('  prot_min:', r['protein_min'])
print('  carb_min:', r['carbs_min'])
print('  fat_min:', r['fat_min'])
print('  iron_min:', r['iron_min'])
print('  calcium_min:', r['calcium_min'])
print()

# Show dosa rows
print('Dosa rows:')
dosa = df[df['name'].str.lower().str.contains('dosa', na=False)]
for i, r in dosa.iterrows():
    print('  ' + r['food_id'] + ': ' + r['name'] + ' | alt=' + str(r['alternate_names']))
print()

# Check potential kanji/porridge etc. 
print('Porridge/kanji/gruel rows:')
keywords = ['kanji', 'porridge', 'gruel', 'sathu', 'kool', 'sathumavu']
for kw in keywords:
    hits = df[df['name'].str.lower().str.contains(kw, na=False) | df['alternate_names'].str.lower().fillna('').str.contains(kw, na=False)]
    for i, r in hits.iterrows():
        print('  ' + r['food_id'] + ': ' + r['name'] + ' | alt=' + str(r['alternate_names']))

# Show noodles/pasta search
print()
print('Noodles/pasta rows:')
for kw in ['noodle', 'pasta', 'maggi', 'chow', 'hakka']:
    hits = df[df['name'].str.lower().str.contains(kw, na=False) | df['alternate_names'].str.lower().fillna('').str.contains(kw, na=False)]
    for i, r in hits.iterrows():
        print('  ' + r['food_id'] + ': ' + r['name'] + ' | alt=' + str(r['alternate_names']))

# Show pizza/burger rows
print()
print('Pizza/burger/fast food rows:')
for kw in ['pizza', 'burger', 'sandwich']:
    hits = df[df['name'].str.lower().str.contains(kw, na=False) | df['alternate_names'].str.lower().fillna('').str.contains(kw, na=False)]
    for i, r in hits.iterrows():
        print('  ' + r['food_id'] + ': ' + r['name'] + ' | alt=' + str(r['alternate_names']))
