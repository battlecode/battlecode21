#!/usr/bin/env python3

import util, bracketlib
from config import *

import sys, json, requests


def run(num_players, maps, replays, first_scrim, last_scrim):

    scrims = []
    for i in range(first_scrim, last_scrim+1):
        try:
            auth_token = util.get_api_auth_token()
            response = requests.get(url=api_match_status(i), headers={
                'Authorization': 'Bearer {}'.format(auth_token)
            })
            response.raise_for_status()
            scrims.append(response.json())
            print (response.json())
            logging.info('{} done'.format(i))
        except Exception as e:
            logging.error('sad', exc_info=e)

    bracket = bracketlib.DoubleEliminationTournament(num_players)
    bracket.generate_bracket()

    for i, match in enumerate(bracket.matches):
        if maps[match.round_str] != None:
            for j, map_name in enumerate(maps[match.round_str]):
                replay = replays[i][j]
                for scrim in scrims:
                    if scrim['replay'] == replay:
                        print ('{} -vs- {} | {} {} replay {}'.format(
                            scrim['red_team'].rjust(40),
                            scrim['blue_team'].ljust(40),
                            map_name.ljust(30),
                            scrim['status'].ljust(8),
                            scrim['replay']))

if __name__ == '__main__':
    # Command-line usage: ./tournament_server.py argv, where:
    # argv[1] = num players
    # argv[2] = file containing map config
    # argv[3] = file containing replay dump
    # argv[4] = min match id
    # argv[5] = max match id
    # Team data should be ordered from first to last seed, one per line
    # Map data should be a JSON map from round name to a list of maps

    num_players = int(sys.argv[1])
    maps = []
    replays = []
    with open(sys.argv[2], 'r') as f:
        maps = json.loads(f.read())
    with open(sys.argv[3], 'r') as f:
        replays = json.loads(f.read())

    run(num_players, maps, replays, int(sys.argv[4]), int(sys.argv[5]))
