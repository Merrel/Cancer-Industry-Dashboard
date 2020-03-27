import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.svm import LinearSVR

input_df = pd.read_csv("modifiedIndustriesPerCountyGA-2012.csv")
input_df = input_df.drop(['Column'], axis=1)

output_df = pd.read_csv("incidencerates.csv")
output_df = output_df[['locale', 'fips', 'annual_count_avg']]  # 'trend_last_5' missing data in 10 counties

industry_keys = {}

for naics in input_df['NAICS2012']:
    if naics not in industry_keys:
        industry_keys[naics] = 0

# industry_keys['year'] = 2012
industry_keys['counties'] = []
industry_keys['annual_count_avg'] = 0

for county in output_df['fips']:
    industry_keys['counties'].append(county)

df = pd.DataFrame(industry_keys, index=industry_keys['counties'])
df.set_index('counties')

for idx, row in input_df.iterrows():
    df.set_value(row['COUNTY'], row['NAICS2012'], row['ESTAB'])

for idx, row in output_df.iterrows():
    df.set_value(row['fips'], 'annual_count_avg', row['annual_count_avg'])

X = df.loc[:, :'counties']
y = df['annual_count_avg']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3)

svr = LinearSVR(random_state=0, tol=1e-5).fit(X_train, y_train)
print(svr.score(X_test, y_test))

# Test single prediction for county 307
pred = np.array(df.loc[307, :'counties']).reshape(1, -1)
svr.predict(pred)
