// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// NECESSARY SOFTWARE

- Ran on Python 3.7.6

Python libraries {install with: $pip install [library]}:
    - [sklearn] v. 0.22.1
    - [websockets] v. 8.1
    - [asyncio] v. 3.4.3
    - [numpy] v. 1.18.1
    - [pandas] v. 0.25.3


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// INSTRUCTIONS

- CREATE THE MODEL

    - Open the Regression_Final_model.ipynb and run all cells 


- RUN THE MODEL

    - Open console in root directory and run:
        - $cd data_viz/national_choropleth
        - $python -m http.server 8000

    - Open new console at root directory and run:
        - $cd data_viz/national_choropleth/src
        - $python server.py

    - Open web browser and goto url: 
        - localhost:8000

    - Choose a county (Fulton County, GA is selected by default) and adjust the sliders to predict 
      what effects a larger or smaller industry plays in cancer rates for that county and hit the 
      'Update Prediction' button for each new prediction

    - Have fun playing around with your ideas!

    - For a remote version of the visualization, visit our website at 142.93.73.45:8000