import json
import numpy as np
import os
from sklearn.externals import joblib


model_1 = joblib.load(open('test_model.sav', 'rb'))

while True:
    if os.path.exists('mydata.json'):

        inputData = json.load(open('mydata.json'))

        

        prediction = model_1.predict(np.array(inputData).reshape(1, -1))

        prediction = prediction.tolist()

        json.dump(prediction, open('outputData.json', 'w'))

        os.remove('mydata.json')
    else:
        pass