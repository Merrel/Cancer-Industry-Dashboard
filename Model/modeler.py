import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.svm import LinearSVR
from sklearn import svm
from sklearn.svm import NuSVR
from sklearn import linear_model

df = pd.read_pickle("Final_Data")

X = df.loc[:, :'WATR']
y = df['annual_count_avg']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3)


svr = LinearSVR(random_state=0, tol=1e-5).fit(X_train, y_train)
svr.score(X_test, y_test)


svm = svm.SVR().fit(X_train, y_train)
svm.score(X_test, y_test)


nuSVR = NuSVR().fit(X_train, y_train)
nuSVR.score(X_test, y_test)


ridge = linear_model.Ridge(alpha=0.5).fit(X_train, y_train)
ridge.score(X_test, y_test)
np.argmax(ridge.coef_)
