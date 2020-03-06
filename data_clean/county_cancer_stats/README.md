# Cancer by County

Cancer statistical data for Georgia _counties_ has been collected from the [CDC State Cancer Profiles Website](https://www.statecancerprofiles.cancer.gov/quick-profiles/index.php?statename=georgia)

This data includes three types: 
1. Incidence Rates
2. Mortality Rates
3. Demographics


## Data Subset Queries
Each data type contains a number of subsets.

These full datatypes shoudl be read using [pandas](https://pandas.pydata.org) and then can be subdivided using the following queries.

### Incidence Rates

```
###################################
# Queries to Split incidence datasets

# Split out the data by stage keys
df[~df.stage.isna()]

# Split out the data by age keys
criterion = ((df.age!=1) & (df.cancer==1))

# Split out the data by sex keys
criterion = ((df.sex!=0) & (df.cancer==1))

# Split out the data by race keys
criterion = ((df.race!=0))

# Split out the data by cancer keys
criterion = ((df.cancer!=1))

# All cancer, race, sex, age, stage
df_key_by_all = df_key
```

### Subset Queries Deographics

```python
# Subdataset 1 - Demographics: Crowding
# - Also include 'value (percent)', 'rank within us'
criterion = ~df_demographics['households (with >1 person per room)'].isna()

# # Subdataset 2 - Demographics: Education
# - Also include 'value (percent)', 'rank within us'
criterion = ( (~ df_demographics['people (education: less than 9th grade)'].isna()) \
            | (~ df_demographics['people(education: less than high school)'].isna()) \
            | (~ df_demographics['people (education: at least bachelors degree)'].isna()) )

# Subdataset 3 - Demographics: Income
# - Split Further by 
#   - demo=10 --> Median family income, 2013-2017
#   - demo=11 --> Median household income, 2013-2017
criterion = (~df_demographics["value (dollars)"].isna())

# Subdataset 4 - Demographics: Insurance
# - Also include 'value (percent)', 'rank within us'
# - Percent uninsured in demographic group, people at or below 138% of poverty, 2017, Ages <65
criterion = (~df_demographics['people (uninsured)'].isna())

# Subdataset 5 - Demographics: Language
# - Also include 'value (percent)', 'rank within us'
# - Language isolation, 2013-2017:  https://www.statecancerprofiles.cancer.gov/dictionary.php#non-english
criterion = (~df_demographics['households (language isolation)'].isna())

# Subdataset 6 - Demographics: Mobility
# - Also include 'value (percent)', 'rank within us'
criterion = ( (~ df_demographics["people (haven't moved)"].isna()) \
            | (~ df_demographics["people (moved within county)"].isna()) \
            | (~ df_demographics["people (moved from different county in same state)"].isna()) \
            | (~ df_demographics["people (moved from different state)"].isna()) \
            | (~ df_demographics["people (moved from outside us)"].isna()) )


# Subdataset 7 - Demographics: Population - Ages
# - Also include 'value (percent)', 'rank within us'
criterion = ( (~ df_demographics["people (age under 18)"].isna()) \
            | (~ df_demographics["people (age 18-39)"].isna()) \
            | (~ df_demographics["people (age 40-64)"].isna()) \
            | (~ df_demographics["people (age 40 and over)"].isna()) \
            | (~ df_demographics["people (age 50 and over)"].isna()) \
            | (~ df_demographics["people (age 65 and over)"].isna()) )


# Subdataset 8 - Demographics: Population -  Race/Ethnicity
# - Also include 'value (percent)', 'rank within us'
criterion = ( (~ df_demographics["people (ai/an)"].isna()) \
            | (~ df_demographics["people (api)"].isna()) \
            | (~ df_demographics["people (black)"].isna()) \
            | (~ df_demographics["people (foreign born)"].isna()) \
            | (~ df_demographics["people (hispanic)"].isna()) \
            | (~ df_demographics["people (non-hispanic [origin recode])"].isna()) \
            | (~ df_demographics["people (white)"].isna()) )


# Subdataset 9 - Demographics: Population -  Sex
# - Also include 'value (percent)', 'rank within us'
criterion = ( (~ df_demographics['people (male)'].isna()) \
            | (~ df_demographics['people (female)'].isna()) )


# Subdataset 9 - Demographics: Poverty
# - Also include 'value (percent)', 'rank within us'
criterion = ( (~ df_demographics['families (below poverty)'].isna()) \
            | (~ df_demographics['people (below poverty)'].isna()) \
            | (~ df_demographics['people (<150% of poverty)'].isna()) )

# Subdataset 10 - Demographics: Workforce/Unemployment
# - Also include 'value (percent)', 'rank within us'
criterion = (~df_demographics['people (unemployed)'].isna())
```