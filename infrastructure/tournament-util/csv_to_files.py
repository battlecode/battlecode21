#!/usr/bin/env python3
# USAGE: csv_to_files.py CSV_FILE

import sys, json

filename = sys.argv[1]

with open(filename, 'r') as f:
    with open('team_pk', 'w') as g:
        with open('team_names', 'w') as h:
            f.readline() # Skip the title row
            for line in f.readlines():
                team_id, team_name, team_score = line.split(',')
                team_name = team_name[1:-1] # Remove quotation marks
                g.write(team_id+'\n')
                h.write(team_name+'\n')
