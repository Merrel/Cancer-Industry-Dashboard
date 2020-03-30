## Data Collection

For this project we have collected data from three primary sources:

1. State Cancer Profiles from the U.S. National Institutes of Health (NIH)
	- Cancer Incidence Data (CID)
	- Technically from the sub-org the National Cancer Institute in partnership with the CDC.
2. County Business Patterns (CBP) from the U.S. Bureau Institute of Economic Analysis (BEA)
	- Data published and aquired throught the U.S. Census bureau's data.census.gov API
3. Industry Impact Data (IID) from the United States Economically-Extended Input Outputs (USEEIO) model published by the U.S. Environmental Protection Agency (EPA)

Cancer Incidence Data (CID) for various forms of cancer were collected from the NIH's State Cancer Profiles website through the use of a python web scraping script. There exists a separate web page for each state and each page contains a uniform series of links to raw data that can be extracted and written to csv files using python.

County Business Patterns (CBP) are a critical dataset because they provide insight into the size of each industry within each locaity. Specifically, we have gathered a dataset that includes the total number of employees, total payroll, and unique industry and locality IDs for each industry in each county. As detailed in **APPENDIX**, the industry data exists as a hierarchy of sectors and their constituents. Together this hierarchy is called the North American Industry Classification System (NAICS). All CBP data was collected using python to query an  API exposed by the U.S Census Bureau.

To characterize the impacts of each industry, a collection of 24 industry indicators, ranging from job creation to CO2 emissions, was collected from USEEIO through an API exposed by the EPA. To complement the CBP data detailed above, we have collected IID values for all 24 indicators for a wide range of industries. 



## Data Cleaning and Integration

Each of the three data sets described above were gathered from official government sources, so while there was significant effort invested in automating the collection of the disparate files, there was very little cleaning required. Basic measures such as deduplication and unification of missing values were handled with python and the pandas library. We had to unify several unique identifiers, such as state names, NAICS codes, and county FIPS IDs, to ensure consistent nomenclature.

Integration of this data set, however, was a much more arduous process. Our end data product is a pair of tabular data sets for the industry indicators (input features) and the cancer incidence rates (output labels). Each table contains a single row for each county in the U.S. Each row in the IID contains a column for each industry indicator for each industry classification. Each row in the CID contains a column containing annual cancer incidence rate for each cancer type and subdivision.