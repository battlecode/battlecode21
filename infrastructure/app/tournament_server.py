#!/usr/bin/env python3

import util, bracket
from config import *

import logging
import time
import requests
import copy


def get_match_winner(match):
    """Checks the status of a match, returning either 1, 2 or None"""
    # TODO
    raise NotImplementedError

def run_tournament(num_players, team_keys, team_names):
    """Generates the tournament bracket and publishes it to the queue"""
    try:
        tournament = bracket.DoubleEliminationTournament(num_players)
        tournament.generate_bracket()
        manager = bracket.TournamentManager(tournament, team_keys, team_names)

        while not manager.is_complete():
            # Check status of running games
            # This list is mutated, so use a copy
            logging.info('Checking status of current running games')
            for match in copy.copy(manager.running):
                winner = get_match_winner(match)
                if winner != None:
                    manager.match_report_winner(match, winner)
            logging.info('Finished checking status of current running games')
            # Publish new ready games
            # This list is mutated, so use a copy
            logging.info('Adding ready games to queue')
            for match in copy.copy(manager.ready):
                manager.match_enqueue(match,
                    lambda m: util.publish_match(m.player1_key, m.player2_key))
            logging.info('Finished adding ready games to queue')
            # Sleep before checking again
            time.sleep(TOURNAMENT_SLEEP_TIME)
    except:
        logging.critical('Error while running tournament')


if __name__ == '__main__':
    # TODO: receive tournament specifications, via sys.args or something
    num_players = 8
    team_keys = ['Key {}'.format(i+1) for i in range(num_players)]
    team_names = ['Team {}'.format(i+1) for i in range(num_players)]

    logging.info('Beginning tournament')
    run_tournament(num_players, team_keys, team_names)
    logging.info('Tournament finished')
