import pandas as pd

df = pd.read_csv('app/data/foods.csv')
print("Columns:", df.columns.tolist())
print("Total rows:", len(df))
print()

print("First 10 rows:")
for i, row in df.head(10).iterrows():
    alt = row.get('alternate_names', '')
    srv = str(row.get('serving_amount', '')) + ' ' + str(row.get('serving_unit', ''))
    print(f"  {row['food_id']}: {row['name']} | alt={alt} | srv={srv}")

print()
print("Last 15 rows:")
for i, row in df.tail(15).iterrows():
    alt = row.get('alternate_names', '')
    srv = str(row.get('serving_amount', '')) + ' ' + str(row.get('serving_unit', ''))
    print(f"  {row['food_id']}: {row['name']} | alt={alt} | srv={srv}")

print()
print("Key food IDs:")
ids = ['FD001','FD002','FD012','FD013','FD016','FD057','FD088','FD199','FD273','FD274','FD275','FD276','FD277','FD278','FD279','FD280']
for fid in ids:
    row = df[df['food_id']==fid]
    if len(row)>0:
        r = row.iloc[0]
        alt = r.get('alternate_names','')
        var = r.get('variants','')
        srv = str(r.get('serving_amount','')) + ' ' + str(r.get('serving_unit',''))
        print(f"  {fid}: {r['name']}")
        print(f"       alt={alt}")
        print(f"       var={var}")
        print(f"       srv={srv}")
    else:
        print(f"  {fid}: NOT FOUND")

# Find biryani variants
print()
print("Biryani variants:")
biryani_rows = df[df['name'].str.lower().str.contains('biryani', na=False)]
for i, r in biryani_rows.iterrows():
    print(f"  {r['food_id']}: {r['name']}")

# Find pongal variants
print()
print("Pongal variants:")
pongal_rows = df[df['name'].str.lower().str.contains('pongal', na=False)]
for i, r in pongal_rows.iterrows():
    print(f"  {r['food_id']}: {r['name']}")

# Find poori variants
print()
print("Poori variants:")
poori_rows = df[df['name'].str.lower().str.contains('poori', na=False)]
for i, r in poori_rows.iterrows():
    print(f"  {r['food_id']}: {r['name']}")

# Find dosa variants  
print()
print("Dosa variants:")
dosa_rows = df[df['name'].str.lower().str.contains('dosa', na=False)]
for i, r in dosa_rows.iterrows():
    print(f"  {r['food_id']}: {r['name']}")

# Find naan variants
print()
print("Naan variants:")
naan_rows = df[df['name'].str.lower().str.contains('naan', na=False)]
for i, r in naan_rows.iterrows():
    print(f"  {r['food_id']}: {r['name']}")
