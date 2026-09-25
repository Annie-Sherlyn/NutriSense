"""
Add "dosa" and "sadham" as explicit alternate_names so the resolver can
do exact Phase-2 matching without relying on fuzzy for these generic forms.

FD002 Plain Dosa: add "Dosa" to alternate_names
FD273 Sadham: already has "Sadam", "Saadam", "Plain Rice" etc — confirm "Sadham" is the canonical name

Also verify the current state of these entries.
"""
import pandas as pd

CSV_PATH = 'app/data/foods.csv'
df = pd.read_csv(CSV_PATH)

# --- FD002: add "Dosa" as alternate name if not already there ---
idx002 = df.index[df['food_id'] == 'FD002'].tolist()
if idx002:
    idx = idx002[0]
    current_alt = str(df.at[idx, 'alternate_names'])
    if 'Dosa' not in current_alt and 'dosa' not in current_alt.lower().split(','):
        new_alt = current_alt + ', Dosa'
        df.at[idx, 'alternate_names'] = new_alt
        print(f"FD002 alternate_names updated: {new_alt}")
    else:
        print(f"FD002 already has Dosa: {current_alt}")
else:
    print("FD002 NOT FOUND!")

# --- FD273: verify Sadham entry ---
idx273 = df.index[df['food_id'] == 'FD273'].tolist()
if idx273:
    idx = idx273[0]
    print(f"FD273: name={df.at[idx,'name']} | alt={df.at[idx,'alternate_names']}")
else:
    print("FD273 NOT FOUND!")

df.to_csv(CSV_PATH, index=False)
print("CSV saved.")

# Verify
df2 = pd.read_csv(CSV_PATH)
for fid in ['FD002', 'FD273']:
    r = df2[df2['food_id']==fid].iloc[0]
    print(f"  {fid}: {r['name']} | alt={r['alternate_names']}")
