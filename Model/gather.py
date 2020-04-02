import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

input_df = pd.read_csv("../data_clean/indicators_per-industry_per-county.csv")

output_df = pd.read_csv("allCancer.csv")
output_df = output_df[['FIPS', 'Average Annual Count']]

features = {}

for naics in input_df['industry_code']:
    if naics not in features:
        features[naics] = 0

features['counties'] = []
features['ACID'] = 0
features['ENRG'] = 0
features['ETOX'] = 0
features['EUTR'] = 0
features['FOOD'] = 0
features['GCC'] = 0
features['HAPS'] = 0
features['HAZW'] = 0
features['HC'] = 0
features['HNC'] = 0
features['HRSP'] = 0
features['HTOX'] = 0
features['JOBS'] = 0
features['LAND'] = 0
features['METL'] = 0
features['MINE'] = 0
features['MSW'] = 0
features['NREN'] = 0
features['OZON'] = 0
features['PEST'] = 0
features['REN'] = 0
features['SMOG'] = 0
features['VADD'] = 0
features['WATR'] = 0
features['annual_count_avg'] = 0

for county in output_df['FIPS']:
    features['counties'].append(county)

df = pd.DataFrame(features, index=features['counties'])
df.set_index('counties')

for idx, row in input_df.iterrows():
    df.loc[row['fips'], row['industry_code']] = row['estab']
    df.loc[row['fips'], 'ACID'] += row['ACID']
    df.loc[row['fips'], 'ENRG'] += row['ENRG']
    df.loc[row['fips'], 'ETOX'] += row['ETOX']
    df.loc[row['fips'], 'EUTR'] += row['EUTR']
    df.loc[row['fips'], 'FOOD'] += row['FOOD']
    df.loc[row['fips'], 'GCC'] += row['GCC']
    df.loc[row['fips'], 'HAPS'] += row['HAPS']
    df.loc[row['fips'], 'HAZW'] += row['HAZW']
    df.loc[row['fips'], 'HC'] += row['HC']
    df.loc[row['fips'], 'HNC'] += row['HNC']
    df.loc[row['fips'], 'HRSP'] += row['HRSP']
    df.loc[row['fips'], 'HTOX'] += row['HTOX']
    df.loc[row['fips'], 'JOBS'] += row['JOBS']
    df.loc[row['fips'], 'LAND'] += row['LAND']
    df.loc[row['fips'], 'METL'] += row['METL']
    df.loc[row['fips'], 'MINE'] += row['MINE']
    df.loc[row['fips'], 'MSW'] += row['MSW']
    df.loc[row['fips'], 'NREN'] += row['NREN']
    df.loc[row['fips'], 'OZON'] += row['OZON']
    df.loc[row['fips'], 'PEST'] += row['PEST']
    df.loc[row['fips'], 'REN'] += row['REN']
    df.loc[row['fips'], 'SMOG'] += row['SMOG']
    df.loc[row['fips'], 'VADD'] += row['VADD']
    df.loc[row['fips'], 'WATR'] += row['WATR']

df = df.iloc[:2949, :]

for idx, row in output_df.iterrows():
    df.loc[row['FIPS'], 'annual_count_avg'] = row['Average Annual Count']

X = df.loc[:, :'WATR']
y = df['annual_count_avg']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3)


from sklearn.svm import LinearSVR
svr = LinearSVR(random_state=0, tol=1e-5).fit(X_train, y_train)
svr.score(X_test, y_test)


from sklearn import svm
svm = svm.SVR().fit(X_train, y_train)
svm.score(X_test, y_test)


from sklearn.svm import NuSVR
nuSVR = NuSVR().fit(X_train, y_train)
nuSVR.score(X_test, y_test)


from sklearn import linear_model
ridge = linear_model.Ridge(alpha=0.5).fit(X_train, y_train)
ridge.score(X_test, y_test)
np.argmax(ridge.coef_)

