## Data Collection

For this project we have collected data from three primary sources:

1. State Cancer Profiles from the U.S. National Inititutes of Health (NIH)
	- Technically from the sub-org the National Cancer Institude in partnership with the CDC.
2. County Business Patterns (CBP) from the U.S. Bureau of Economic Analysis (BEA)
	- Data published and aquired throught the U.S. Census bureau's data.census.gov API
3. Industry Impact Data (IID) from the United States Economically-Extended Input Outputs (USEEIO) model published by the U.S. Environmental Protection Agency (EPA)

Incidence and death rates for various forms of cancer were collected from the NIH's State Cancer Profiles website through the use of a python web scaping script. There exists a separate web page for each state and each page contains a uniform series of links to raw data that can be extracted and written to csv files using python.

County Business Patterns (CBP) are a critical dataset because they provide inside into the size of each industry within each locaity. Specifically, we have gathered a dataset that includes the total number of employees, total payroll, and unique industry and locality IDs for each industry in each county. As detailed in **APPENDIX**, the industry data exists as a hierarchy of sectors and their constituents. Together this hierarchy is called the North American Industry Classification System (NAICS). All CBP data was collected using python to query an  API exposed by the U.S Census Bureau.

To characterize the impacts of each industry, a collection of 24 industry indicators, ranging from job creation to CO2 emissions, was collected from USEEIO through an API exposed by the EPA. To complement the CBP data detailed above, we have collected IID values for all 24 indicators for a wide range of industries. 



## Data Cleaning and Integration

