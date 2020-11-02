#!/usr/bin/env python3
# Usage: pull_seeding.py CSV_FILE

import sys, os, requests

KEY = os.getenv('BC20_CHALLONGE_KEY')

response = requests.get(url='https://api.challonge.com/v1/tournaments/bc20_seeding/participants.json?api_key={}'.format(KEY))
response.raise_for_status()

seeded = {}
for team in response.json():
    seeded[team['participant']['name']] = team['participant']['final_rank']

scrim_ranks = []
with open(sys.argv[1], 'r') as f:
    f.readline() # Skip the title row
    for line in f.readlines():
        team_id, team_name, team_score = line.split(',')
        team_name = team_name[1:-1] # Remove quotation marks
        scrim_ranks.append((team_id, team_name, team_score))

teams = []
for rank, team_data in enumerate(scrim_ranks):
    team_id, team_name, team_score = team_data
    if team_name in seeded:
        teams.append((seeded[team_name], rank+1, team_id, team_name))
    else:
        teams.append((1000000, rank+1, team_id, team_name))
teams.sort()

with open('team_pk', 'w') as g:
    with open('team_names', 'w') as h:
        for team in teams:
            team_seed, team_scrim, team_id, team_name = team
            print (team)
            g.write(team_id+'\n')
            h.write(team_name+'\n')
