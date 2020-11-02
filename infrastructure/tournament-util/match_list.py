#!/usr/bin/env python3

import sys, json, requests

with open(sys.argv[1], 'r') as f:
    replays = json.loads(f.read())

for match in replays:
    if match is not None:
        for game in match:
            if game[3] == 1:
                winner = 'redwon'
            elif game[3] == 2:
                winner = 'bluewon'
            else:
                raise ValueError('Invalid winner: {}'.format(game[3]))
            print ('{} -vs- {} | {} {} replay {}'.format(
                game[0].rjust(40), # Red team
                game[1].ljust(40), # Blue team
                game[2].ljust(30), # Map name
                winner.ljust(8),    # Winner status
                game[4]))          # Replay id
