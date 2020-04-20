import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn import svm
from sklearn import linear_model
from sklearn.svm import *
from sklearn.linear_model import ElasticNet


df = pd.read_pickle("Final_Data")

X = df.loc[:, :'WATR']
y = df['annual_count_avg']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3)


svr = LinearSVR(random_state=0, tol=1e-5).fit(X_train, y_train)
print(svr.score(X_test, y_test))


svm = svm.SVR().fit(X_train, y_train)
print(svm.score(X_test, y_test))


nuSVR = NuSVR().fit(X_train, y_train)
print(nuSVR.score(X_test, y_test))


ridge = linear_model.Ridge(alpha=0.5).fit(X_train, y_train)
print(ridge.score(X_test, y_test))
# np.argmax(ridge.coef_)

lasso = linear_model.Lasso(alpha=0.1).fit(X_train, y_train)
print(lasso.score(X_test, y_test))

eNet = ElasticNet(random_state=0).fit(X_train, y_train)
print(eNet.score(X_test, y_test))


import matplotlib.pyplot as plt
fig = plt.figure()
ax = fig.add_axes([0,0,1,1])
ax.bar(range(len(ridge.coef_)), ridge.coef_)
ax.set_ylabel('Weight Size')
ax.set_xlabel('Feature #')
ax.set_title('Trained Ridge Regression Weights')
plt.show()
