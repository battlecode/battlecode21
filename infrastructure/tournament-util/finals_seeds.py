#!/usr/bin/env python3
# Usage: finals_seeds.py CSV_FILE

import sys, os, requests

KEY = os.getenv('BC20_CHALLONGE_KEY')

response = requests.get(url='https://api.challonge.com/v1/tournaments/bc20_seeding/participants.json?api_key={}'.format(KEY))
response.raise_for_status()

seeded = {}
for team in response.json():
    seeded[team['participant']['name']] = team['participant']['final_rank']

def calculate_value(seed, score, winner_bracket):
    return score + 500 * winner_bracket - 10 * seed

teams = []
with open(sys.argv[1], 'r') as f:
    f.readline() # Skip the title row
    for line in f.readlines():
        team_id, team_name, team_score, team_winner_bracket = line.split(',')
        team_score, team_winner_bracket = float(team_score), int(team_winner_bracket)
        team_name = team_name[1:-1] # Remove quotation marks
        team_seed = seeded[team_name]
        team_value = calculate_value(team_seed, team_score, team_winner_bracket)
        teams.append((team_value, team_id, team_name, team_seed, team_score, team_winner_bracket))
teams.sort(key=lambda x: -x[0])

with open('team_pk', 'w') as g:
    with open('team_names', 'w') as h:
        for team in teams:
            team_value, team_id, team_name, team_seed, team_score, team_winner_bracket = team
            print (team)
            g.write(team_id+'\n')
            h.write(team_name+'\n')
