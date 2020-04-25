from sklearn import linear_model
from math import sqrt
import numpy as np
from sklearn.externals import joblib


data = np.empty([500, 5])

for i in range(500):
    data[i] = [i, i, i, sqrt(2*i*i), sqrt(2*i*i)-1]

X_train = data[:350, :3]
y_train = data[:350, 3:]
X_test = data[350:, :3]
y_test = data[350:, 3:]

ridge = linear_model.Ridge(alpha=0.5).fit(X_train, y_train)
# print(ridge.score(X_test, y_test))

ridge.predict(np.array([1, 1, 1]).reshape(1, -1))
joblib.dump(ridge, 'test_model.sav')

test = joblib.load('test_model.sav')
test.predict(np.array([1, 1, 1]).reshape(1, -1))

# np.savetxt("foo1.csv", ridge.coef_, delimiter=",")
# np.savetxt("foo2.csv", ridge.intercept_, delimiter=",")
