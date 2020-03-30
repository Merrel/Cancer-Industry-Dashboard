#BASE URL AND KEY
#Use the requests library
import csv
import requests as r
import pandas as pd
import zipfile, io
import os

#Set the base URL.
# base_url ='https://smmtool.app.cloud.gov/api/' 

# Add a key for the request hhttps://api.edap-cluster.com/useeio/api/eaders. 
# No keys are needed by default, so it's blank

api_headers = {}
# api-key for USEEIO
# with open(".BEA_API_KEY", 'r') as KEY_FILE:
#     api_headers['x-api-key']=KEY_FILE.read()

api_headers['x-api-key'] = '975f39a54e48438ceebf303d6018e34db212e804'


import pathlib

# Set a relative location to save the data from the request
repo_dir = pathlib.Path().cwd()
raw_data_dir = repo_dir / 'data_raw'
out_data_dir = raw_data_dir / 'BEA_Industry_Factors'

# Create new folders if needed
state_data_dir = out_data_dir / 'state_level'
if not state_data_dir.exists():
    state_data_dir.mkdir(parents=True)
    
county_data_dir = out_data_dir / 'county_level'
if not county_data_dir.exists():
    county_data_dir.mkdir(parents=True)


# Load the state FIPS codes key
state_fips = pd.read_csv(out_data_dir / 'state_fips.csv', usecols=['Name', 'Postal Code', 'FIPS'])
state_fips = state_fips.head(50)  # <-- limit to only US states, not teritories

# Base URL for the API call
base_url = "https://api.census.gov/data"

#
# NOTE Years Prior to 2012 Currently have a bug when specifying NAICS#### as one of the columns
#      - stick to 2012 and later for now
#


def get_county_cbp(fips, state, years):
    count=0
    for year in years:
        print(f"Getting data for state: {state}\tyear: {year}")
        if year>=2000 and year<=2002:
            columns_to_select = "GEO_ID,GEO_TTL,COUNTY,YEAR,NAICS1997_TTL,ESTAB,EMP,PAYANN"
            url=f"{base_url}/{year}/cbp?get={columns_to_select}&for=county:*&in=state:{fips:02d}"
        elif year>=2003 and year<=2007:
            columns_to_select = "GEO_ID,GEO_TTL,COUNTY,YEAR,NAICS2002_TTL,ESTAB,EMP,PAYANN"
            url=f"{base_url}/{year}/cbp?get={columns_to_select}&for=county:*&in=state:{fips:02d}"
        elif year>=2008 and year<=2011:
            columns_to_select = "GEO_ID,GEO_TTL,COUNTY,YEAR,NAICS2007_TTL,ESTAB,EMP,PAYANN"
            url=f"{base_url}/{year}/cbp?get={columns_to_select}&for=county:*&in=state:{fips:02d}"
        elif year>=2012 and year<=2016:
            columns_to_select = "GEO_ID,GEO_TTL,COUNTY,YEAR,NAICS2012,NAICS2012_TTL,ESTAB,EMP,PAYANN"
            url=f"{base_url}/{year}/cbp?get={columns_to_select}&for=county:*&in=state:{fips:02d}"
        elif year==2017:
            columns_to_select = "GEO_ID,NAME,COUNTY,YEAR,NAICS2017,NAICS2017_LABEL,ESTAB,EMP,PAYANN"
            url=f"{base_url}/{year}/cbp?get={columns_to_select}&for=county:*&in=state:{fips:02d}"
    
    
        response = r.get(url, headers=api_headers)

        with open(county_data_dir / f"industriesPerCounty_{str.lower(state.replace(' ', ''))}_{year}.csv",'w') as resultPath:
            for line in response.text.strip().split('\n'):
                line=line.replace('[',"").replace(']',"")
                resultPath.write(line + "\n")

        print("  > Finished CSV for year"+str(year))


# for fips in state_fips.FIPS.unique():
#     state = state_fips.query(f'FIPS=={fips}').values[0][0]
#     years=range(2012,2018)
    
#     get_county_cbp(fips, state, years)
