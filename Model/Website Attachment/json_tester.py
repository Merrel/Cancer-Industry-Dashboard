import json
import numpy as np
import os
from sklearn.externals import joblib


model_2 = joblib.load(open('Model2.sav', 'rb'))

while True:
    if os.path.exists('inputData.json'):

        inputData = json.load(open('inputData.json'))

        

        prediction = model_2.predict(np.array(inputData).reshape(1, -1))

        prediction = prediction.tolist()
        print(prediction)

        json.dump(prediction, open('outputData.json', 'w'))

        os.remove('inputData.json')
    else:
        pass