import pandas as pd
df = pd.read_csv('app/data/foods.csv')
check_names = ['Chana Masala','Dal Makhani','Rajma Chawal','Chole Bhature','Palak Paneer','Paneer Masala','Apple','Banana']
for name in check_names:
    matches = df[df['name'].str.lower()==name.lower()]
    if len(matches):
        for i,r in matches.iterrows():
            print(r['food_id'], r['name'])
    else:
        print('NOT FOUND:', name)

# Show all FD273-FD280
print('\nNew rows:')
new_rows = df[df['food_id'].isin(['FD273','FD274','FD275','FD276','FD277','FD278','FD279','FD280'])]
print(new_rows[['food_id','name']].to_string())
