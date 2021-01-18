#!/usr/bin/env python3

import sys, json, requests

with open(sys.argv[1], 'r') as f:
    replays = json.loads(f.read())

for match in replays:
    if match is not None:
        for game in match:
            if game[3] == 1:
                # winner = 'redwon'
                winner = game[0]
            elif game[3] == 2:
                # winner = 'bluewon'
                winner = game[1]
            else:
                raise ValueError('Invalid winner: {}'.format(game[3]))
            # print ('{} -vs- {}'.format(
                # game[0], # Red team
                # game[1])) # Blue team
            # print('winner: {}'.format(
                # winner))
            # replay_link = 'https://2021.battlecode.org/visualizer.html?tournamentMode&https://2021.battlecode.org/replays/' + game[4] + '.bc21'
            replay_link = game[4]
            print(replay_link)
            # blank line to separate games
            # print()
        # more blank lines to separate matches
        # print()
        print()
    
