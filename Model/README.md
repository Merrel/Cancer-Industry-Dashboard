1. Cut down cancer/industry data to only all cancer types and industry from 2012 in OpenRefine
    
    1.a. Transform --> 'NAICS2012' --> to numeric --> `if(and(value>99, value<1000), value, 0)` --> exclude 999 and 0
    
<<<<<<< HEAD
    2.b. Delete everything in incidentratess.csv after row 162 --> 'fips' --> replace(value, /^13/, "")
=======
    2.b. Delete everything in incidentratess.csv after row 162 --> 'fips' --> `replace(value, /^13/, "")`
>>>>>>> fa34dd306e9a665fb869b808989bea16d029b7ca

2. Enumerate NAICS + annual_cancer_avg + counties into a Pandas dataframe

3. Machine learning (OOB values)

<<<<<<< HEAD
    3.a. SVR = 95%
=======
    3.a. SVR = 95%
>>>>>>> fa34dd306e9a665fb869b808989bea16d029b7ca
