"""
    Filename: hello-world.py
"""

from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/users/<string:username>')
def hello_world(username=None):

    return("Hello {}!".format(username))


@app.route('/hello', methods=['GET', 'POST'])
def hello():

    # POST request
    if request.method == 'POST':
        print('Incoming..')
        print(request.get_json())  # parse as JSON
        return 'OK', 200

    # GET request
    else:
        message = {'greeting':'Hello from Flask!'}
        return jsonify(message)  # serialize and use JSON headers


@app.route('/test')
def test_page():
    # look inside `templates` and serve `index.html`
    return render_template('./index.html')
