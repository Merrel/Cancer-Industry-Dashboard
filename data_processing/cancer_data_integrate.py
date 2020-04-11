import os
import re
import pathlib
# import requests
import pandas as pd
import multiprocessing as mp
from functools import partial
# from cancer_data_query import CancerDataQuery, query_state_data


####################
#
# HELPER FUNCTIONS
#
####################
def make_meta_df(idx_max, subset_key):
    for idx in range(idx_max):
        df = pd.DataFrame(subset_key).transpose()
        df.index = [idx]
        yield df


def skip_to(fle, starters,**kwargs):
    '''Source: https://stackoverflow.com/questions/34028511/skipping-unknown-number-of-lines-to-read-the-header-python-pandas'''
    if os.stat(fle).st_size == 0:
        raise ValueError("File is empty")
    with open(fle, errors='replace') as f:
        pos = 0
        cur_line = f.readline()
        
        while not any([cur_line.startswith(s) for s in starters]):
            pos = f.tell()
            cur_line = f.readline()
        f.seek(pos)

        df = pd.read_csv(f, **kwargs)
        return df


def gen_subsets(df_key, raw_data_dir, cols_to_clean=None):
    for idx, subset_key in df_key.iterrows():
        
        # df_subset = pd.read_csv(raw_data_dir / subset_key.file_name, header=9, encoding = "ISO-8859-1").dropna()
    
        try:
            df_subset = skip_to(raw_data_dir / subset_key.file_name, ['County', 'Parish', 'Borough'])

            df_subset.columns = [c.strip().lower() for c in df_subset.columns]
            df_subset = df_subset.dropna(subset=['fips'])

            # Join with metadata
            df_subset = df_subset.join(
                pd.concat(make_meta_df(len(df_subset), subset_key))
            )

            # Rename the columns
            if cols_to_clean is not None:
                try:
                    df_subset.columns = cols_to_clean
                except ValueError:
                    print(subset_key.file_name)
                    print('---')
                    print(df_subset.columns)
                    print('---')

            yield df_subset
            
        except:
            continue

###################################################################################################
#
# PROCESS INCIDENCE RATE DATA
#
###################################################################################################

def process_incidencerates_raw(state):
    '''
    Process Incidence Data
        1. Load Each Pre-downloaded data
        2. Drop Duplicates from DATA KEY
        3. Split data key to process ALL STAGE and LATE STAGE data sets separately (different column names)
        4. Drow all rows with NaN
        5. Clean (rename) columns
        6. Join metadata to each row of subset
        7. Combine data subsets
        8. Re-join ALL STAGE and LATE STAGE data sets
    '''
    subset_key_dict = {
    'cancer_by_type': range(0,23),
    'cancer_by_race': range(23,31),
    'cancer_by_sex': range(31,34),
    'cancer_by_age': range(34,39),
    'cancer_all': range(39,40),
    'cancer_latestage_by_type': range(40,59),
    }

    data_type = 'incidencerates'

    # Set the data path
    cancer_data_dir = raw_data_dir / 'CDC_CancerByCounty'
    this_data_dir = cancer_data_dir / state / data_type

    # Load the data key
    df_key = pd.read_csv(this_data_dir / 'DATA_KEY.csv')
    
    for subset_name, subset_range in subset_key_dict.items():
        
        print(f'Processing data for:\t{subset_name}')
        
        subset_key = df_key[df_key.index.isin(subset_range)]

        # Drop all the duplicates from data key
        subset_key = subset_key.drop_duplicates(
            subset=[c for c in df_key.columns if 'file_name' not in c]
            # Ignore the file_name column for deduplication
        )

       
        if subset_name != 'cancer_latestage_by_type':
        #
        # ALL STAGE DATA  -  Must split 'all stage' and 'late stage' data sets due to difference in columns
        #

            # Load and clean/rename columns
            cols_to_clean= ['locale', 'fips', 'met_health_obj', 
                        'incidence rate_per_100000', 'incidence rate_lower_95_confidence', 'incidence rate_upper_95_confidence',
                        'annual_count_avg', 'recent_trend_str',
                        'trend_last_5', 'trend_last_5_lower_95_confidence', 'trend_last_5_upper_95_confidence',
                        'age', 'areatype', 'cancer', 'file_name', 'race', 'sex', 'source_url', 
                        'stage', 'stateFIPS', 'type']

        else:
        #
        # LATE STAGE DATA
        #

            # Load and clean/rename columns
            cols_to_clean= ['locale', 'fips', 'met_health_obj', 
                        'incidence rate_per_100000', 'incidence rate_lower_95_confidence', 'incidence rate_upper_95_confidence',
                        'annual_count_avg', 'late_stage_%',
                        'age', 'areatype', 'cancer', 'file_name', 'race', 'sex', 'source_url', 
                        'stage', 'stateFIPS', 'type']

            
        df = pd.concat(
            gen_subsets(subset_key, this_data_dir, cols_to_clean=cols_to_clean),
            sort=False
        )


        # Relabel state and US level data
        df.loc[df.locale.str.contains(str.title(state)), 'areatype'] = "state"
        df.loc[df.locale == 'US (SEER+NPCR)(1,10)', 'areatype'] = "country"

        # Save out the cleaned and joined dataset
        df.to_csv(this_data_dir / f'{subset_name}-incidencerates.csv',
                  index=False
                 )

###################################################################################################
#
# PROCESS DEATH RATE DATA
#
###################################################################################################

def process_deathrates_raw(state):
    
    subset_key_dict = {
    'cancer_by_type': range(0,22),
    'cancer_by_race': range(22,30),
    'cancer_by_sex': range(30,33),
    'cancer_by_age': range(33,38),
    'cancer_all': range(38,49),
    }
        
    data_type = 'deathrates'

    # Set the data path
    cancer_data_dir = raw_data_dir / 'CDC_CancerByCounty'
    this_data_dir = cancer_data_dir / state / data_type

    # Load the data key
    df_key = pd.read_csv(this_data_dir / 'DATA_KEY.csv')

    for subset_name, subset_range in subset_key_dict.items():
        
        print(f'Processing data for:\t{subset_name}')
        
        subset_key = df_key[df_key.index.isin(subset_range)]
    
        # Load and clean/rename columns
        cols_to_clean= ['locale', 'fips', 'met_health_obj', 
                    'deathrate_per_100000', 'deathrate_lower_95_confidence', 'deathrate_upper_95_confidence',
                    'annual_count_avg', 'recent_trend_str',
                    'trend_last_5', 'trend_last_5_lower_95_confidence', 'trend_last_5_upper_95_confidence',
                    'stateFIPS', 'areatype', 'cancer', 'race', 'sex', 'age', 'type','file_name', 'source_url']

        df = pd.concat(
            gen_subsets(subset_key, this_data_dir, cols_to_clean)
        )

        # Change areatype for state and country entries
        df.loc[df.locale == str.title(state), 'areatype'] = "state"
        df.loc[df.locale == 'United States', 'areatype'] = "country"

        # Save out the cleaned and joined dataset
        df.to_csv(this_data_dir / f'{subset_name}-deathrates.csv',
                  index=False
                 )

        print(f'Data Joined and cleaned for data type {data_type} in {state}')


def combine_states(cancer_data_dir, data_type, data_subset):
    for state_dir in cancer_data_dir.iterdir():

        if state_dir.name.startswith('.'):
            # skip
            continue
        else:
            df = pd.read_csv(state_dir / data_type / f'{data_subset}-{data_type}.csv')
            df['state'] = str.lower(state_dir.name)

        yield df


def collate_cancer_data(data_type):

    # Clean cancer data dir
    cancer_data_dir = repo_dir / 'data_raw' / 'CDC_CancerByCounty'
    clean_data_dir = repo_dir / 'data_clean' / 'CDC_CancerByCounty' / data_type

    if not clean_data_dir.exists():
        clean_data_dir.mkdir(parents=True)


    subset_key_list = [
        'cancer_by_type',
        'cancer_by_race',
        'cancer_by_sex',
        'cancer_by_age',
        'cancer_all'
    ]

    # Load the cancer_id key
    cancer_id_key = pd.read_csv(repo_dir / 'data_raw' / 'cancer_ID_list.csv')
    cancer_key_dict = cancer_id_key.set_index('Cancer_ID').to_dict()['Cancer_Description']

    for subset_name in subset_key_list:

        # try:

        df_consolidated = pd.concat(
            combine_states(cancer_data_dir, data_type, subset_name)
        )

        df_consolidated = (df_consolidated
                        .sort_values(by=['fips', 'cancer'])
                        .drop_duplicates(subset=['locale', 'cancer'])
        )

        df_consolidated['cancer_description'] = df_consolidated.cancer.apply(
            lambda x: cancer_key_dict[x]
        )
        
        df_consolidated.to_csv(clean_data_dir / f'{subset_name}.csv', index=False)

        # except Exception:
        #     continue


###################################################################################################
#
# MAIN
#
###################################################################################################

if __name__ == "__main__":
    # Define the data paths
    project_dir = pathlib.Path.cwd().parent.parent
    repo_dir = pathlib.Path.cwd().parent
    raw_data_dir = repo_dir / 'data_raw'

    with open(raw_data_dir / 'county_cancer_stats' / 'states.txt') as f:
        states_str = f.read()
        states_list = states_str.split(', ')
        
    # Convert to lower case
    states_list = [str.lower(state) for state in states_list]
    states_list = [s.replace(' ', '') for s in states_list]

    # for state in states_list[40:]:
        # process_incidencerates_raw(state)

    # Multiprocessing to collect all the states
    p = mp.Pool()
    # incidence = p.map(process_incidencerates_raw, states_list)
    # death = p.map(process_deathrates_raw, states_list)
    p.close()

    # Collate data from all the states
    # Load the cancer_id key

    cancer_id_key = pd.read_csv(repo_dir / 'data_raw' / 'cancer_ID_list.csv')
    cancer_key_dict = cancer_id_key.set_index('Cancer_ID').to_dict()['Cancer_Description']


    # collate_cancer_data('incidencerates')
    collate_cancer_data('deathrates')

