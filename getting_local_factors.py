import csv
import pandas as pd

# read the new file
industry_codes = []
t_c = []
v_a = []
with open ('data_rescaling_input_file.csv', 'r') as csv_file:
    csv_reader1 = csv.reader(csv_file)
    for row in csv_reader1:
        industry_codes.append(row[0].lower())
        t_c.append(row[2])
        v_a.append(row[3])

# read last file
ex_industry_codes = []
payann = []
with open ('indicators_per-industry_per-county.csv', 'r') as csv_file:
    next(csv_file)
    csv_reader2 = csv.reader(csv_file)
    for line in csv_reader2:
        ex_industry_codes.append(line[4].lower())
        payann.append(line[8])

#open the lists I will use
total_compensation = []
added_value = []

#fill them with zeros
for i in range(len(payann)):
    total_compensation.append(0)
    added_value.append(0)

#assign industry indicators to counties
for index1,item1 in enumerate(t_c):
    for index2,item2 in enumerate(payann):
        if industry_codes[index1] == ex_industry_codes[index2]:
            total_compensation[index2] = item1
            added_value[index2] = v_a[index1]

#write outputs

results = zip(total_compensation, added_value)
with open('output.csv', 'w', newline='' ) as myfile:
    wr = csv.writer(myfile)
    for item in results:
        wr.writerow([item,])
