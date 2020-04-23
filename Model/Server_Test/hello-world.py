"""
    Filename: hello-world.py
"""

from flask import Flask, render_template, request, jsonify
import os
import json
import numpy as np
from sklearn.externals import joblib

app = Flask(__name__)

@app.route('/')
def hello_world(username=None):

    # try:
    # test_json = request.get_json()
    # test = pd.read_json(test_json)
    inputData = json.load(open('mydata.json'))
        # To resolve the issue of TypeError: Cannot compare types 'ndarray(dtype=int64)' and 'str'
        # test['Dependents'] = [str(x) for x in list(test['Dependents'])]

        #Getting the Loan_IDs separated out
        # loan_ids = test['Loan_ID']

    # except Exception as e:
    #     raise e
    
    """
    with open('mydata.json', 'w') as f:
        json.dump([1, 1, 1], f)
    """

    with open('./test_model.sav', 'rb') as f:
        loaded_model = joblib.load(f)

    prediction = loaded_model.predict(np.array(inputData).reshape(1, -1))

    return(f"Hello!2 {prediction}")


# @app.route('/hello', methods=['GET', 'POST'])
# def hello():

#     # POST request
#     if request.method == 'POST':
#         print('Incoming..')
#         print(request.get_json())  # parse as JSON
#         return 'OK', 200

#     # GET request
#     else:
#         message = {'greeting':'Hello from Flask!'}
#         return jsonify(message)  # serialize and use JSON headers


# @app.route('/test')
# def test_page():
#     # look inside `templates` and serve `index.html`
#     return render_template('./index.html')
