"""Inspect CSV for existing foods matching the required FD273-FD280 set."""
import pandas as pd

df = pd.read_csv('app/data/foods.csv')
print(f"Total rows: {len(df)}")
print(f"ID range: {df['food_id'].iloc[0]} to {df['food_id'].iloc[-1]}")
print()

# Search terms for each required food
searches = {
    'Sadham / Plain Rice': ['sadham', 'sadam', 'plain rice', 'steamed rice', 'white rice', 'cooked rice'],
    'Paneer Masala':       ['paneer masala', 'paneer curry', 'paneer sabzi'],
    'Noodles':             ['noodles', 'noodle', 'hakka noodles', 'chow mein'],
    'Koozh':               ['koozh', 'kool', 'kanji', 'ragi koozh', 'rice koozh'],
    'Pizza':               ['pizza'],
    'Burger':              ['burger', 'veggie burger'],
    'Apple':               ['apple'],
    'Banana':              ['banana', 'kela'],
}

name_col = df['name'].str.lower().fillna('')
alt_col  = df['alternate_names'].str.lower().fillna('')
all_text = name_col + ' | ' + alt_col

for label, terms in searches.items():
    print(f"=== {label} ===")
    found = False
    for term in terms:
        mask = all_text.str.contains(term, na=False)
        hits = df[mask]
        if len(hits):
            for _, r in hits.iterrows():
                print(f"  FOUND [{r['food_id']}] {r['name']} | alt={r['alternate_names']} | srv={r['serving_amount']} {r['serving_unit']}")
            found = True
    if not found:
        print("  NOT FOUND in CSV")
    print()

# Show FD273-FD280 current state
print("=== Current FD273-FD280 ===")
for fid in ['FD273','FD274','FD275','FD276','FD277','FD278','FD279','FD280']:
    row = df[df['food_id']==fid]
    if len(row):
        r = row.iloc[0]
        print(f"  {fid}: {r['name']} | alt={r['alternate_names']} | srv={r['serving_amount']} {r['serving_unit']}")
    else:
        print(f"  {fid}: ABSENT")
