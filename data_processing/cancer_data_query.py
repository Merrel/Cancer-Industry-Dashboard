import os
import re
import pathlib
import requests
import multiprocessing as mp
import pandas as pd

from functools import partial

class CancerDataQuery(object):
    
    # Assign Class variables
    base_url = "https://www.statecancerprofiles.cancer.gov"


    def __init__(self, state_name, data_dir):
        self.state = state_name
        print(state_name)
        # Assign state url
        self.state_url = self.base_url + "/quick-profiles/index.php?statename=" + str.lower(state_name)
        
        # Get all URLs from the state
        all_urls = self._get_urls_for_state()
        
        # Split URL by type
        self.data_types = list(set([u.split('/')[1] for u in all_urls]))
        
        self.url_by_type = {datatype: [u for u in all_urls if datatype in u] 
                            for datatype in self.data_types}
        
        # Preallocate dictionary for storing data keys
        self.data_keys = {}
        
        # Set the data dir
        self.data_dir = data_dir


    def _get_urls_for_state(self):
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36',
            'Content-Type': 'text/html',
        }
        
        response = requests.get(self.state_url, headers=headers)
        html = response.text
        
        regex = 'class="icn icn-table" href="(.*?)"'
        url_all = re.findall(regex, html)
        
        return url_all


    def download_cancer_data(self, data_type):

        # Set the proper paths
        raw_data_dir = self.data_dir / 'CDC_CancerIncidenceByCounty' / str.title(self.state) / data_type

        # print(raw_data_dir)

        if not raw_data_dir.exists():
            # print(f'Making directory: {raw_data_dir}')
            raw_data_dir.mkdir(parents=True, exist_ok=True)

        # Define where to download data
        data_key = pd.DataFrame()
        base_url = 'https://www.statecancerprofiles.cancer.gov'

        # Define which data to donwload

        url_list = self.url_by_type[data_type]
        
        print(f' > State: {self.state} \t Getting {data_type} data')

        for file_idx, file_url in enumerate(url_list):

            if 'demographics' in file_url:
                dl_text = '&sortVariableName=value&sortOrder=asc&output=1'
            else:
                dl_text = '&sortVariableName=rate&sortOrder=desc&output=1'

            dl_url = base_url + file_url.replace('#results', dl_text)

            try:
                details = file_url.split('?')[1].split('&')
                details = [d.split('#results')[0] for d in details]
                details = {d.split('=')[0]: d.split('=')[1] for d in details}
            except:
                breakpoint()

            response = requests.get(dl_url, stream=True)

            new_file_name = f'{data_type}_{file_idx:03d}.csv'


            details.update({'file_name': new_file_name})
            details.update({'source_url': dl_url})

            data_key = pd.concat([data_key, pd.DataFrame(data=details, index=[file_idx])],
                                 sort=True
                                )

            with open(raw_data_dir / new_file_name, "wb") as handle:
                handle.write(bytearray('------------\n', 'utf-8'))
                handle.write(bytearray('DL METADATA\n', 'utf-8'))
                handle.write(bytearray(f' > URL: {dl_url}\n', 'utf-8'))
                handle.write(bytearray(f' > Details: {details}\n', 'utf-8'))
                handle.write(bytearray('------------\n', 'utf-8'))


                for data in response.iter_content():
                    handle.write(data)

        data_key.to_csv(raw_data_dir / 'DATA_KEY.csv', index=False)
        
        self.data_keys.update({data_type: data_key})
        

#         return data_key


def query_state_data(state_name, data_dir):

    cdq = CancerDataQuery(state_name, data_dir=data_dir)

    for data_type in cdq.data_types:
        cdq.download_cancer_data(data_type)



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

    query_func = partial(query_state_data, data_dir=raw_data_dir)

    # query_func(states_list[0])

    # Query states with multiprocessing
    p = mp.Pool()

    results = p.map(query_func, states_list)
    p.close()
